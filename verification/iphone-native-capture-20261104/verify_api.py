"""Verify the actual pinned installed API on Windows; does not access a device."""
from datetime import datetime, timezone
import hashlib
import importlib.metadata
import inspect
import json
from pathlib import Path
import platform
import sys

import collect_iphone as collector
import iphone_usb as worker
from pymobiledevice3 import usbmux
from pymobiledevice3.lockdown import LockdownClient, create_using_usbmux
from pymobiledevice3.services.os_trace import OsTraceService, OsActivityStreamFlag, OS_TRACE_RELAY_STREAM_FLAGS_DEFAULT, SyslogEntry, SyslogLogLevel

assert importlib.metadata.version('pymobiledevice3') == collector.VERSION == worker.VERSION == '11.49.5'
assert inspect.iscoroutinefunction(usbmux.list_devices)
assert {'serial', 'connection_type', 'autopair', 'pair_timeout'} <= set(inspect.signature(create_using_usbmux).parameters)
assert 'key' in inspect.signature(LockdownClient.get_value).parameters
assert 'stream_flags' in inspect.signature(OsTraceService.syslog).parameters
assert inspect.isasyncgenfunction(OsTraceService.syslog)
assert hasattr(OsTraceService, '__aenter__') and hasattr(OsTraceService, '__aexit__')
flags = OS_TRACE_RELAY_STREAM_FLAGS_DEFAULT & ~OsActivityStreamFlag.DEBUG
assert not flags & OsActivityStreamFlag.DEBUG
entry = SyslogEntry(pid=17, timestamp=datetime.now(timezone.utc), level=SyslogLogLevel.ERROR,
                    image_name='WebKit', image_offset=0, filename='WebContent', message='process terminated due to memory limit')
assert collector.technical_entry(worker.entry_dict(entry))['pid'] == 17
assert 'pymobiledevice3.__main__' not in sys.modules
assert not any(name.startswith('pymobiledevice3.remote.') and ('tunnel' in name or 'remotepairing' in name) for name in sys.modules)
base = Path(__file__).resolve().parent
out = base / 'results'
out.mkdir(exist_ok=True)
receipt = {'packageVersion': collector.VERSION, 'os': platform.system(), 'python': platform.python_version(),
           'directUsbApiContractPassed': True, 'physicalIphoneConnected': False, 'physicalUsbAccepted': False,
           'nativeWhiteScreenCauseEstablished': False, 'gameModified': False,
           'files': {name: hashlib.sha256((base/name).read_bytes()).hexdigest() for name in ['collect_iphone.py', 'iphone_usb.py', 'PRUEFEN.cmd', 'AUFZEICHNEN.cmd']}}
(out/'api-receipt.json').write_text(json.dumps(receipt, indent=2)+'\n', encoding='utf-8')
print(json.dumps(receipt, indent=2))
