"""Offline integrity and functional-result replay; no native crash claim."""
import hashlib
import io
import json
from pathlib import Path
import tarfile

root = Path(__file__).resolve().parent
receipt = json.loads((root / 'receipt.json').read_text())
raw = (root / receipt['archive']['path']).read_bytes()
assert len(raw) == receipt['archive']['bytes']
assert hashlib.sha256(raw).hexdigest() == receipt['archive']['sha256']
with tarfile.open(fileobj=io.BytesIO(raw), mode='r:gz') as archive:
    names = archive.getnames()
    assert len(names) == len(set(names)) == 12
    assert set(names) == {row['path'] for row in receipt['files']}
    data = {}
    for row in receipt['files']:
        member = archive.getmember(row['path'])
        assert member.isfile()
        value = archive.extractfile(member).read()
        assert len(value) == row['bytes']
        assert hashlib.sha256(value).hexdigest() == row['sha256']
        data[row['path']] = value

for engine in ['chromium', 'webkit']:
    prefix = f'resource-checkpoint-{engine}/'
    result = json.loads(data[prefix + f'systematic-stability-20261101/results/{engine}-original/smoke/verification.json'])
    info = json.loads(data[prefix + 'boss2-forensics-20261028/results/device-preview/site/device-preview-info.json'])
    assert result['sourceCommit'] == info['sourceCommit'] == receipt['sourceCommit']
    assert result['sourceTree'] == receipt['sourceTree']
    assert result['complete'] and result['normalReportVerified'] and result['diagnosticResourceCheckpointVerified']
    assert result['whiteScreenFixed'] is False and result['physicalDevice'] is False
    assert result['memoryComparisonEligible'] is False
    assert len(result['cycles']) == 3
    for row, seconds in zip(result['cycles'], [60, 10, 10]):
        assert row['complete'] and row['normalExitVerified'] and row['resourceCheckpointActiveVerified']
        assert row['observedActiveMs'] >= seconds * 1000
    assert info['diagnosticStopwatch']['stateSha256'] == '5e5845d5e5beef85ca5dadac597b8d751e81f931374b942b22fdedc7d83bbb5c'
    assert info['diagnosticResourceCheckpoint']['recordingStateMeasured'] is False
    scope = data[prefix + 'device-resource-checkpoint-20261102/results/source-scope-after.txt'].decode()
    assert '"originalRuntimeTreesUnchanged":true' in scope
    print(f'{engine}: source, normal export and all three resource checkpoints verified')

for row in receipt['hostedFiles']:
    value = (root / row['path']).read_bytes()
    assert len(value) == row['bytes']
    assert hashlib.sha256(value).hexdigest() == row['sha256']
report = json.loads((root / 'hosted-report.json').read_bytes())
info = json.loads((root / 'hosted-info.json').read_bytes())
hosted = receipt['hostedFunctionalCheck']
assert report['source']['sourceCommit'] == info['sourceCommit'] == receipt['sourceCommit']
assert report['source']['sourceTree'] == info['sourceTree'] == receipt['sourceTree']
assert report['reportDocumentOrigin'] + '/' == hosted['url']
assert report['stopwatch']['latest']['mode'] == 'ended'
assert report['briefMatchesLatestStopwatch'] and report['fullSession'] is None
assert report['briefDiagnostics']['latest']['resourceCheckpoint']['clockId'] == report['stopwatch']['latest']['id']
stalls = sum(row['kind'] == 'state' and row['mode'] == 'stalled'
             for row in report['briefDiagnostics']['latest']['events'])
assert stalls == hosted['observedDiagnosticStalledEvents'] == 2
assert hosted['strictStabilityPassClaimed'] is False
print('Hosted normal export and all three file hashes verified; two stalled states remain explicit.')
print('All 12 synthetic captures verified; White Screen cause and physical-device acceptance remain open.')
