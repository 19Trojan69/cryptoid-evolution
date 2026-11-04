"""Run the genuine Windows starter with no physical phone; failure must be honest."""
import json
import os
from pathlib import Path
import shutil
import subprocess
import tempfile

assert os.name == 'nt', 'This launcher check requires Windows'
assert shutil.which('py.exe'), 'The Windows Python launcher must be present for this check'
base = Path(__file__).resolve().parent
with tempfile.TemporaryDirectory(prefix='cryptoid usb check ') as directory:
    root = Path(directory)
    for name in ['collect_iphone.py', 'iphone_usb.py', 'PRUEFEN.cmd']:
        shutil.copyfile(base/name, root/name)
    # PRUEFEN.cmd creates its real isolated runtime, installs the pinned helper,
    # attempts local USB enumeration, and pauses. Newlines only dismiss pause.
    result = subprocess.run([os.environ.get('COMSPEC', 'cmd.exe'), '/d', '/c', str(root/'PRUEFEN.cmd')],
                            input='\n\n\n', capture_output=True, text=True, errors='replace', timeout=480)
    reports = list((root/'Ergebnisse').glob('*.json'))
    assert result.returncode == 1, (result.returncode, result.stdout[-2500:], result.stderr[-1500:])
    assert len(reports) == 1, (result.stdout[-2500:], result.stderr[-1500:])
    report = json.loads(reports[0].read_text(encoding='utf-8'))
    assert report['status'] == 'PRUEFUNG_NICHT_BESTANDEN'
    assert not report['nativeStreamVerified'] and not report['nativeTerminationCauseDetermined']
    assert not report['records']
    receipt = {'genuineWindowsCmdStarterExecuted': True, 'isolatedPinnedRuntimeCreated': True,
               'expectedNoDeviceFailurePreserved': True, 'readerErrorType': report['readerErrorType'],
               'pathWithSpacesPassed': True, 'physicalDeviceTested': False}
    (base/'results'/'launcher-receipt.json').write_text(json.dumps(receipt, indent=2)+'\n', encoding='utf-8')
    print(json.dumps(receipt, indent=2))
