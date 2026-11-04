"""USB-only iPhone log preparation. No game changes or automatic uploads."""
import argparse
from collections import deque
from datetime import datetime, timezone
import importlib.metadata
import json
import os
from pathlib import Path
import queue
import re
import subprocess
import sys
import threading
import time
import uuid
import venv

VERSION = '11.49.5'
BASE = Path(__file__).resolve().parent
MAX_LINE = 131072
MAX_RECORDS = 3000
MAX_BYTES = 2 * 1024 * 1024
SCOPE = r'Pi[ -]?Browser|cryptoid|WebKit|WebContent|GPUProcess|jetsam|memorystatus|memory.?pressure'
SCOPE_RE = re.compile(SCOPE, re.I)
EVENT_RE = re.compile(r'terminat|\bexit|crash|kill|jetsam|memory|memorystatus|footprint|allocat|pressure|GPU|WebProcessProxy|WebPageProxy|unresponsive|watchdog|\bhang\b|\bhung\b|connection.*(?:lost|closed)|process.*(?:launch|spawn)', re.I)
SENSITIVE_RE = re.compile(r'authorization|access.?token|refresh.?token|password|secret|cookie|payment|wallet|email|authentication|\blogin\b', re.I)
REASONS = ['memory', 'pressure', 'jetsam', 'limit', 'crash', 'terminated', 'termination', 'exited', 'killed',
           'gpu', 'watchdog', 'timeout', 'unresponsive', 'invalid', 'authentication', 'expired', 'connection']
ANSI = re.compile(r'\x1b\[[0-?]*[ -/]*[@-~]')


def utc():
    return datetime.now(timezone.utc).isoformat()


def redact(text):
    text = re.sub(r'https?://[^\s<>\"\']+', '[URL]', str(text), flags=re.I)
    text = re.sub(r'\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b', '[EMAIL]', text, flags=re.I)
    text = re.sub(r'\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b', '[TOKEN]', text)
    text = re.sub(r'\bG[A-Z2-7]{55}\b', '[ACCOUNT]', text)
    text = re.sub(r'\b[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}\b', '[UUID]', text, flags=re.I)
    text = re.sub(r'\b[0-9a-f]{8}-[0-9a-f]{16}\b|\b[0-9a-f]{32,}\b', '[IDENTIFIER]', text, flags=re.I)
    text = re.sub(r'[A-Z]:\\[^\r\n\"\']+', '[WINDOWS_PATH]', text, flags=re.I)
    return text


def basename(value):
    return redact(str(value or '').replace('\\', '/').rsplit('/', 1)[-1])[:160]


def technical_entry(raw):
    if not isinstance(raw, dict) or not isinstance(raw.get('message'), str):
        return None
    message = raw['message']
    label = raw.get('label') if isinstance(raw.get('label'), dict) else {}
    process, image = basename(raw.get('filename')), basename(raw.get('image_name'))
    scope = ' '.join([process, image, str(label.get('subsystem', '')), message])
    if not SCOPE_RE.search(scope) or not EVENT_RE.search(message):
        return None
    sensitive = bool(SENSITIVE_RE.search(message))
    safe = '[Vertraulicher Meldungsinhalt ausgelassen]' if sensitive else redact(message)
    if len(safe) > 4000:
        safe = safe[:2000] + ' [gekuerzt] ' + safe[-2000:]
    timestamp = raw.get('timestamp')
    pid = raw.get('pid')
    return {'deviceTimestamp': timestamp[:64] if isinstance(timestamp, str) else None,
            'receivedAtUtc': utc(), 'pid': pid if type(pid) is int and 0 <= pid < 2**32 else None,
            'process': process, 'image': image, 'level': str(raw.get('level', ''))[:24],
            'subsystem': redact(label.get('subsystem', ''))[:160],
            'category': redact(label.get('category', ''))[:160], 'message': safe,
            'reasonWords': [word for word in REASONS if word in message.lower()],
            'sensitiveContentOmitted': sensitive}


class Ring:
    def __init__(self):
        self.records = deque()
        self.bytes = 0
        self.dropped = 0

    def append(self, record):
        size = len(json.dumps(record, ensure_ascii=False).encode('utf-8'))
        self.records.append((record, size))
        self.bytes += size
        while len(self.records) > MAX_RECORDS or self.bytes > MAX_BYTES:
            self.bytes -= self.records.popleft()[1]
            self.dropped += 1

    def export(self):
        return [record for record, _ in self.records]


def child_env(udid=None):
    env = {k: v for k, v in os.environ.items()
           if not k.upper().startswith('PYMOBILEDEVICE3_') and k.upper() != 'USBMUXD_SOCKET_ADDRESS'}
    env.update(PYTHONIOENCODING='utf-8', PYTHONUTF8='1', NO_COLOR='1')
    if udid is not None:
        if not re.fullmatch(r'[A-Za-z0-9-]{8,80}', udid):
            raise ValueError('Ungueltige USB-Geraetekennung')
        env['CRYPTOID_USB_TARGET'] = udid
    else:
        env.pop('CRYPTOID_USB_TARGET', None)
    return env


def command(kind):
    base = [sys.executable, '-u', str(BASE / 'iphone_usb.py')]
    choices = {'devices': ['devices'], 'info': ['info'], 'probe': ['stream'], 'record': ['stream']}
    if kind not in choices:
        raise ValueError('Nur feste Diagnose-Lesebefehle sind zugelassen')
    return base + choices[kind]


class NativeSession:
    def __init__(self, args, env):
        self.events = queue.Queue(maxsize=128)
        self.ended = threading.Event()
        self.dropped = 0
        self.oversized = 0
        self.proc = subprocess.Popen(args, stdin=subprocess.DEVNULL, stdout=subprocess.PIPE,
                                     stderr=subprocess.STDOUT, env=env)
        self.reader = threading.Thread(target=self.read, daemon=True)
        self.reader.start()

    def read(self):
        try:
            while True:
                line = self.proc.stdout.readline(MAX_LINE + 1)
                if not line:
                    break
                if len(line) > MAX_LINE:
                    self.oversized += 1
                    while line and not line.endswith(b'\n'):
                        line = self.proc.stdout.readline(MAX_LINE + 1)
                    continue
                try:
                    value = json.loads(line.decode('utf-8', errors='replace'))
                except (ValueError, TypeError):
                    continue
                if not isinstance(value, dict) or not isinstance(value.get('message'), str):
                    continue
                try:
                    self.events.put_nowait(value)
                except queue.Full:
                    self.dropped += 1
                    try:
                        self.events.get_nowait()
                    except queue.Empty:
                        pass
                    try:
                        self.events.put_nowait(value)
                    except queue.Full:
                        pass
        finally:
            self.ended.set()

    def next(self, timeout=.2):
        try:
            return self.events.get(timeout=timeout)
        except queue.Empty:
            return None

    def close(self):
        # This terminates only our local reader, never an iPhone app/process.
        if self.proc.poll() is None:
            self.proc.terminate()
            try:
                self.proc.wait(timeout=5)
            except subprocess.TimeoutExpired:
                self.proc.kill()
                self.proc.wait(timeout=5)
        self.reader.join(timeout=2)
        self.proc.stdout.close()


def native_json(kind, udid=None):
    result = subprocess.run(command(kind), env=child_env(udid), stdin=subprocess.DEVNULL,
                            capture_output=True, text=True, encoding='utf-8', errors='replace', timeout=35)
    if result.returncode:
        failure = RuntimeError('USB- bzw. Apple-Dienstzugriff fehlgeschlagen. iPhone entsperren und USB-Verbindung/Vertrauen pruefen.')
        # Preserve only a class name, never the worker's raw message/device data.
        try:
            error_type = json.loads(result.stderr.strip().splitlines()[-1]).get('readerErrorType', '')
            if re.fullmatch(r'[A-Za-z][A-Za-z0-9_]{0,95}', error_type):
                failure.reader_error_type = error_type
        except (ValueError, TypeError, AttributeError, IndexError):
            pass
        raise failure
    return json.loads(ANSI.sub('', result.stdout))


def select_device(devices):
    if not isinstance(devices, list) or len(devices) != 1 or not isinstance(devices[0], str):
        raise RuntimeError('Bitte genau ein iPhone per USB anschliessen. Weitere iPhones/iPads voruebergehend abziehen.')
    return devices[0]


def save(path, report):
    report['savedAtUtc'] = utc()
    temp = path.with_suffix(path.suffix + '.tmp')
    temp.write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    os.replace(temp, path)


def capture(mode, destination):
    report = {'version': 1, 'mode': mode, 'startedAtUtc': utc(), 'packageVersion': VERSION,
              'usbOnly': True, 'automaticUpload': False, 'gameChanged': False,
              'developerModeOrTunnelRequested': False, 'nativeStreamVerified': False,
              'nativeTerminationCauseDetermined': False, 'records': []}
    session = None
    ring = None
    try:
        print('iPhone entsperrt per USB verbinden. Falls gefragt: Diesem Computer vertrauen.')
        udid = select_device(native_json('devices'))
        info = native_json('info', udid)
        report['device'] = {k: str(info.get(k, ''))[:40] for k in ['ProductType', 'ProductVersion']}
        if not str(info.get('ProductType', '')).startswith('iPhone'):
            raise RuntimeError('Das angeschlossene Geraet wurde nicht als iPhone erkannt.')
        print('USB-Verbindung steht. Native Meldungen werden kurz geprueft ...')
        session = NativeSession(command('probe' if mode == 'check' else 'record'), child_env(udid))
        deadline = time.monotonic() + 20
        first = None
        while time.monotonic() < deadline:
            first = session.next()
            if first is not None:
                break
            if session.ended.is_set():
                break
        if first is None:
            raise RuntimeError('USB erkannt, aber noch kein lesbarer nativer Meldungsstrom. Statusdatei senden; noch keinen Spiel-Dauertest starten.')
        report['nativeStreamVerified'] = True
        if mode == 'check':
            report['status'] = 'USB_UND_NATIVE_MELDUNGEN_OK'
            print('PRUEFUNG BESTANDEN. Noch kein Spieltest erforderlich. Die Statusdatei ist fertig.')
            return report
        ring = Ring()
        entry = technical_entry(first)
        if entry:
            ring.append(entry)
        stop = threading.Event()
        def wait_for_enter():
            try:
                input()
            except (EOFError, KeyboardInterrupt):
                pass
            stop.set()
        threading.Thread(target=wait_for_enter, daemon=True).start()
        print('AUFZEICHNUNG LAEUFT. Nach einem White Screen etwa 10 Sekunden warten, dann hier Enter druecken.')
        started, saved = time.monotonic(), 0
        reason = 'user-enter'
        while not stop.is_set():
            raw = session.next()
            if raw is not None:
                entry = technical_entry(raw)
                if entry:
                    ring.append(entry)
            if session.ended.is_set() and session.events.empty():
                reason = 'native-stream-ended'
                break
            if time.monotonic() - started > 3600:
                reason = 'one-hour-reader-limit'
                break
            if time.monotonic() - saved >= 5:
                report.update(records=ring.export(), droppedRecords=ring.dropped, status='RECORDING')
                save(destination, report)
                saved = time.monotonic()
        report.update(records=ring.export(), droppedRecords=ring.dropped, stopReason=reason,
                      status='RECORDED' if reason != 'native-stream-ended' else 'STREAM_ENDED_EARLY')
        return report
    except KeyboardInterrupt:
        report['status'] = 'STOPPED_BY_USER'
        return report
    except Exception as error:
        report.update(status='PRUEFUNG_NICHT_BESTANDEN', error=redact(str(error))[:1200])
        report['readerErrorType'] = getattr(error, 'reader_error_type', type(error).__name__)
        print(report['error'])
        return report
    finally:
        if ring is not None:
            report.update(records=ring.export(), droppedRecords=ring.dropped)
        if session:
            try:
                session.close()
            except Exception as error:
                report.update(status='LOCAL_READER_CLOSE_FAILED', readerErrorType=type(error).__name__)
            finally:
                report.update(readerDroppedRecords=session.dropped, oversizedLines=session.oversized)
        save(destination, report)


def bootstrap(mode):
    runtime = BASE / 'native-runtime'
    python = runtime / ('Scripts/python.exe' if os.name == 'nt' else 'bin/python')
    if not python.exists():
        print('Einmalige Einrichtung des kostenlosen Diagnose-Hilfsprogramms ...')
        venv.EnvBuilder(with_pip=True).create(runtime)
    probe = subprocess.run([str(python), '-c', 'import importlib.metadata;print(importlib.metadata.version("pymobiledevice3"))'],
                           capture_output=True, text=True)
    if probe.returncode or probe.stdout.strip() != VERSION:
        subprocess.run([str(python), '-m', 'pip', '--isolated', 'install', '--disable-pip-version-check', '--no-cache-dir',
                        '--index-url', 'https://pypi.org/simple', 'pymobiledevice3==' + VERSION], check=True)
    return subprocess.call([str(python), str(Path(__file__).resolve()), mode, '--prepared'])


def main():
    parser = argparse.ArgumentParser(description='Cryptoid: native iPhone-Meldungen ueber USB lesen')
    parser.add_argument('mode', choices=['check', 'record'], default='check', nargs='?')
    parser.add_argument('--prepared', action='store_true', help=argparse.SUPPRESS)
    args = parser.parse_args()
    if not args.prepared:
        return bootstrap(args.mode)
    if importlib.metadata.version('pymobiledevice3') != VERSION:
        raise RuntimeError('Die gepruefte Hilfsprogramm-Version fehlt.')
    output = BASE / 'Ergebnisse'
    output.mkdir(exist_ok=True)
    path = output / ('cryptoid-iphone-' + args.mode + '-' + datetime.now().strftime('%Y%m%d-%H%M%S') + '-' + uuid.uuid4().hex[:6] + '.json')
    report = capture(args.mode, path)
    print('\nDatei: ' + str(path))
    return 0 if report.get('status') in ['USB_UND_NATIVE_MELDUNGEN_OK', 'RECORDED', 'STOPPED_BY_USER'] else 1


if __name__ == '__main__':
    try:
        raise SystemExit(main())
    except Exception as error:
        print('Einrichtung fehlgeschlagen: ' + redact(str(error))[:1200])
        raise SystemExit(1)
