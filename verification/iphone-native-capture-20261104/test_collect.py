"""Synthetic tests only: never connects to a phone."""
import asyncio
from datetime import datetime, timezone
import json
import os
from pathlib import Path
import queue
import subprocess
import sys
import tempfile
import threading
from types import ModuleType, SimpleNamespace
import unittest
from unittest.mock import AsyncMock, patch

import collect_iphone as c
import iphone_usb as usb

TARGET = '00000000-0000000000000000'


def event(message='WebContent process terminated due to memory limit'):
    return {'message': message, 'filename': '/Applications/Pi Browser.app/Pi Browser',
            'image_name': '/System/Library/Frameworks/WebKit', 'pid': 123,
            'timestamp': '2026-11-04T12:00:00', 'level': 'ERROR',
            'image_uuid': 'must-never-be-exported', 'device_id': TARGET,
            'label': {'subsystem': 'com.apple.WebKit', 'category': 'Process'}}


class FilteringTests(unittest.TestCase):
    def test_keeps_native_termination_context_without_extra_identifiers(self):
        result = c.technical_entry(event())
        self.assertIn('memory limit', result['message'])
        self.assertEqual(result['process'], 'Pi Browser')
        self.assertEqual(result['pid'], 123)
        self.assertNotIn('must-never-be-exported', json.dumps(result))
        self.assertNotIn(TARGET, json.dumps(result))

    def test_rejects_unrelated_private_and_nontechnical_events(self):
        self.assertIsNone(c.technical_entry({'filename': 'Mail', 'message': 'secret family message'}))
        self.assertIsNone(c.technical_entry(event('Page title changed')))
        self.assertIsNone(c.technical_entry({'message': 123}))

    def test_redacts_urls_ids_accounts_and_paths(self):
        original = ('https://host.invalid/private?token=abc person@example.invalid '
                    '00000000-0000-0000-0000-000000000000 ' + TARGET + ' ' + 'G' + 'A'*55 +
                    ' eyJabc.def.ghi C:\\Users\\Private\\Desktop\\note.txt')
        redacted = c.redact(original)
        for private in ['host.invalid', 'person@', TARGET, 'G'+'A'*55, 'eyJabc', 'Private']:
            self.assertNotIn(private, redacted)
        self.assertIn('[URL]', redacted)

    def test_sensitive_body_is_omitted_but_reason_is_kept(self):
        result = c.technical_entry(event('WebKit memory pressure; authorization ABCDEF123 payment'))
        self.assertTrue(result['sensitiveContentOmitted'])
        self.assertNotIn('ABCDEF123', result['message'])
        self.assertIn('pressure', result['reasonWords'])

    def test_record_and_byte_bounds_evict_oldest(self):
        with patch.object(c, 'MAX_RECORDS', 2), patch.object(c, 'MAX_BYTES', 120):
            ring = c.Ring()
            for i in range(5):
                ring.append({'i': i, 'text': 'x'*20})
            self.assertEqual([x['i'] for x in ring.export()], [3, 4])
            self.assertEqual(ring.dropped, 3)
            ring.append({'oversize': 'x'*130})
            self.assertEqual(ring.export(), [])
            self.assertLessEqual(ring.bytes, 120)


class TransportTests(unittest.TestCase):
    def test_clears_tunnel_and_foreign_transport_environment(self):
        with patch.dict(os.environ, {'PYMOBILEDEVICE3_NATIVE': '1', 'PYMOBILEDEVICE3_USERSPACE': '1',
                                    'pymobiledevice3_tunnel': 'bad', 'USBMUXD_SOCKET_ADDRESS': 'bad'}):
            env = c.child_env(TARGET)
        self.assertFalse(any(k.upper().startswith('PYMOBILEDEVICE3_') for k in env))
        self.assertNotIn('USBMUXD_SOCKET_ADDRESS', env)
        self.assertEqual(env['CRYPTOID_USB_TARGET'], TARGET)
        self.assertNotIn('CRYPTOID_USB_TARGET', c.child_env())
        with self.assertRaises(ValueError):
            c.child_env('bad argument!')

    def test_refuses_ambiguous_device_selection(self):
        self.assertEqual(c.select_device([TARGET]), TARGET)
        for value in [[], [TARGET, TARGET], {}, [3]]:
            with self.assertRaises(RuntimeError):
                c.select_device(value)

    def test_commands_are_only_own_fixed_read_worker(self):
        for kind in ['devices', 'info', 'probe', 'record']:
            args = c.command(kind)
            self.assertEqual(Path(args[2]).name, 'iphone_usb.py')
            self.assertNotIn('-m', args)
        for forbidden in ['reboot', 'kill', 'install', 'tunnel']:
            with self.assertRaises(ValueError):
                c.command(forbidden)

    def test_real_reader_handles_unicode_invalid_oversized_and_eof(self):
        source = "import json,sys;print('not-json');print('x'*140000);print(json.dumps({'message':'WebKit memory pressure \\u00e4'}));sys.stdout.flush()"
        session = c.NativeSession([sys.executable, '-u', '-c', source], c.child_env())
        try:
            result = session.next(timeout=8)
            self.assertEqual(result['message'], 'WebKit memory pressure ä')
            self.assertTrue(session.ended.wait(8))
            self.assertEqual(session.oversized, 1)
        finally:
            session.close()

    def test_closing_reader_terminates_only_local_child(self):
        session = c.NativeSession([sys.executable, '-u', '-c', 'import time;time.sleep(30)'], c.child_env())
        session.close()
        self.assertIsNotNone(session.proc.poll())
        self.assertTrue(session.ended.is_set())


class FakeSession:
    def __init__(self, *_):
        self.events = queue.Queue()
        self.ended = threading.Event()
        self.dropped = self.oversized = 0
        self.closed = False

    def next(self):
        return event('WebKit irrelevant private page text')

    def close(self):
        self.closed = True


def fake_json(kind, *_):
    return [TARGET] if kind == 'devices' else {'ProductType': 'iPhone16,2', 'ProductVersion': '26.6', 'SerialNumber': 'PRIVATE'}


class CaptureTests(unittest.TestCase):
    def test_check_exports_no_sample_message_or_identifier(self):
        with tempfile.TemporaryDirectory() as folder, patch.object(c, 'native_json', side_effect=fake_json), patch.object(c, 'NativeSession', FakeSession):
            path = Path(folder) / 'check.json'
            result = c.capture('check', path)
            saved = path.read_text(encoding='utf-8')
            self.assertEqual(result['status'], 'USB_UND_NATIVE_MELDUNGEN_OK')
            self.assertTrue(result['nativeStreamVerified'])
            self.assertFalse(result['nativeTerminationCauseDetermined'])
            self.assertEqual(result['records'], [])
            for private in [TARGET, 'PRIVATE', 'private page text']:
                self.assertNotIn(private, saved)

    def test_no_native_stream_is_not_a_pass(self):
        class Empty(FakeSession):
            def next(self):
                self.ended.set()
                return None
        with tempfile.TemporaryDirectory() as folder, patch.object(c, 'native_json', side_effect=fake_json), patch.object(c, 'NativeSession', Empty):
            result = c.capture('check', Path(folder) / 'empty.json')
        self.assertFalse(result['nativeStreamVerified'])
        self.assertEqual(result['status'], 'PRUEFUNG_NICHT_BESTANDEN')

    def test_disconnect_keeps_partial_record_and_failed_stream_status(self):
        class Disconnected(FakeSession):
            def next(self):
                self.ended.set()
                return event()
        with tempfile.TemporaryDirectory() as folder, patch.object(c, 'native_json', side_effect=fake_json), patch.object(c, 'NativeSession', Disconnected), patch('builtins.input', side_effect=lambda: threading.Event().wait(.2)):
            path = Path(folder) / 'partial.json'
            result = c.capture('record', path)
            self.assertEqual(result['status'], 'STREAM_ENDED_EARLY')
            self.assertGreaterEqual(len(result['records']), 1)
            self.assertFalse(json.loads(path.read_text(encoding='utf-8'))['nativeTerminationCauseDetermined'])

    def test_interruption_preserves_latest_record(self):
        class Interrupted(FakeSession):
            calls = 0
            def next(self):
                self.calls += 1
                if self.calls > 1:
                    raise KeyboardInterrupt
                return event()
        with tempfile.TemporaryDirectory() as folder, patch.object(c, 'native_json', side_effect=fake_json), patch.object(c, 'NativeSession', Interrupted), patch('builtins.input', side_effect=lambda: threading.Event().wait(.2)):
            result = c.capture('record', Path(folder) / 'stopped.json')
        self.assertEqual(result['status'], 'STOPPED_BY_USER')
        self.assertEqual(len(result['records']), 1)


class WorkerTests(unittest.TestCase):
    def modules(self):
        package = ModuleType('pymobiledevice3')
        mux = ModuleType('pymobiledevice3.usbmux')
        mux.list_devices = AsyncMock(return_value=[SimpleNamespace(serial=TARGET, is_usb=True), SimpleNamespace(serial='WIFI', is_usb=False)])
        lockdown_module = ModuleType('pymobiledevice3.lockdown')
        client = SimpleNamespace(get_value=AsyncMock(side_effect=lambda key: {'ProductType': 'iPhone16,2', 'ProductVersion': '26.6'}[key]), close=AsyncMock())
        lockdown_module.create_using_usbmux = AsyncMock(return_value=client)
        package.usbmux = mux
        return {'pymobiledevice3': package, 'pymobiledevice3.usbmux': mux, 'pymobiledevice3.lockdown': lockdown_module}, client, lockdown_module

    def test_info_uses_explicit_usb_and_reads_only_two_values(self):
        modules, client, module = self.modules()
        with patch.dict(sys.modules, modules), patch.dict(os.environ, {'CRYPTOID_USB_TARGET': TARGET}), patch('builtins.print') as out:
            asyncio.run(usb.run('info'))
        module.create_using_usbmux.assert_awaited_once_with(serial=TARGET, connection_type='USB', autopair=True, pair_timeout=25)
        self.assertEqual(client.get_value.await_count, 2)
        client.close.assert_awaited_once()
        self.assertNotIn(TARGET, out.call_args.args[0])

    def test_devices_excludes_wifi_without_pairing(self):
        modules, _, module = self.modules()
        with patch.dict(sys.modules, modules), patch('builtins.print') as out:
            asyncio.run(usb.run('devices'))
        self.assertEqual(json.loads(out.call_args.args[0]), [TARGET])
        module.create_using_usbmux.assert_not_called()

    def test_worker_does_not_accept_missing_target(self):
        modules, _, module = self.modules()
        with patch.dict(sys.modules, modules), patch.dict(os.environ, {}, clear=True):
            with self.assertRaises(RuntimeError):
                asyncio.run(usb.run('info'))
        module.create_using_usbmux.assert_not_called()

    def test_serialization_omits_unneeded_native_identifiers(self):
        raw = SimpleNamespace(timestamp=datetime.now(timezone.utc), pid=17, level=SimpleNamespace(name='FAULT'),
                              filename='WebContent', image_name='WebKit', message='memory pressure', label=None,
                              image_uuid='PRIVATE', process_image_uuid='PRIVATE')
        self.assertNotIn('PRIVATE', json.dumps(usb.entry_dict(raw)))


if __name__ == '__main__':
    unittest.main()
