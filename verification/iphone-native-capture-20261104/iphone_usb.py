"""Direct classic USB APIs only; never invokes the package CLI or tunnel fallback."""
import argparse
import asyncio
import importlib.metadata
import json
import os
import re
import sys

VERSION = '11.49.5'


def entry_dict(entry):
    # Deliberately omit image UUIDs, offsets, thread and device identifiers.
    return {'timestamp': entry.timestamp.isoformat(), 'pid': entry.pid,
            'level': entry.level.name, 'filename': entry.filename,
            'image_name': entry.image_name, 'message': entry.message,
            'label': {'subsystem': entry.label.subsystem, 'category': entry.label.category}
            if entry.label else None}


async def run(kind):
    from pymobiledevice3 import usbmux
    if kind == 'devices':
        devices = await usbmux.list_devices()
        print(json.dumps([device.serial for device in devices if device.is_usb]), flush=True)
        return
    serial = os.environ.get('CRYPTOID_USB_TARGET', '')
    if not re.fullmatch(r'[A-Za-z0-9-]{8,80}', serial):
        raise RuntimeError('Explizites USB-Ziel fehlt')
    from pymobiledevice3.lockdown import create_using_usbmux
    lockdown = await create_using_usbmux(serial=serial, connection_type='USB', autopair=True, pair_timeout=25)
    try:
        if kind == 'info':
            info = {key: await lockdown.get_value(key=key) for key in ['ProductType', 'ProductVersion']}
            print(json.dumps(info), flush=True)
        elif kind == 'stream':
            from pymobiledevice3.services.os_trace import OsTraceService, OsActivityStreamFlag, OS_TRACE_RELAY_STREAM_FLAGS_DEFAULT
            flags = OS_TRACE_RELAY_STREAM_FLAGS_DEFAULT & ~OsActivityStreamFlag.DEBUG
            async with OsTraceService(lockdown=lockdown) as service:
                async for entry in service.syslog(stream_flags=flags):
                    if entry.level.name != 'DEBUG':
                        print(json.dumps(entry_dict(entry), ensure_ascii=False), flush=True)
        else:
            raise ValueError('Unbekannter Lesebefehl')
    finally:
        await lockdown.close()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('kind', choices=['devices', 'info', 'stream'])
    args = parser.parse_args()
    if importlib.metadata.version('pymobiledevice3') != VERSION:
        raise RuntimeError('Die gepruefte Hilfsprogramm-Version fehlt')
    if sys.platform == 'win32':
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(run(args.kind))


if __name__ == '__main__':
    try:
        main()
    except Exception as error:
        # No exception bodies: they can contain a device name/identifier.
        print(json.dumps({'readerErrorType': type(error).__name__}), file=sys.stderr, flush=True)
        raise SystemExit(1)
