import gzip
import hashlib
import json
from pathlib import Path, PurePosixPath

root = Path(__file__).resolve().parent
manifest = json.loads((root/'artifact-manifest.json').read_text())
assert manifest['run'] == 41799229475
expected_source = '3511b0b59ddebd97b6dfa5e4b79fb450eb407849'
assert manifest['sourceCommit'] == expected_source
files = 0
fixtures = []
flows = []
for artifact in manifest['artifacts']:
    for row in artifact['files']:
        relative = PurePosixPath(row['archivedPath'])
        assert not relative.is_absolute() and '..' not in relative.parts
        compressed = (root/relative).read_bytes()
        assert len(compressed) == row['gzipBytes']
        assert hashlib.sha256(compressed).hexdigest() == row['gzipSha256']
        assert hashlib.sha1(b'blob '+str(len(compressed)).encode()+b'\0'+compressed).hexdigest() == row['gzipGitBlob']
        raw = gzip.decompress(compressed)
        assert len(raw) == row['bytes']
        assert hashlib.sha256(raw).hexdigest() == row['sha256']
        assert hashlib.sha1(b'blob '+str(len(raw)).encode()+b'\0'+raw).hexdigest() == row['gitBlob']
        files += 1
        if row['path'].endswith('/fixture.json'):
            value = json.loads(raw)
            assert value['complete'] and len(value['rows']) == 6
            for case in value['rows']:
                assert case['complete'] and case['nativeFault']
                assert case['persistedBeforeNavigation'] == (case['arm'] == 'journal')
                assert case['persistedAfterNavigation'] == (case['arm'] == 'journal')
            fixtures.append(value['engine'])
        if row['path'].endswith('/verification.json'):
            value = json.loads(raw)
            assert value['sourceCommit'] == expected_source and value['complete']
            assert value['normalReportVerified'] and value['criticalReportVerified'] and value['diagnosticResourceCheckpointVerified']
            assert len(value['cycles']) == 3
            for cycle, requested in zip(value['cycles'], [60000, 10000, 10000], strict=True):
                assert cycle['complete'] and cycle['observedActiveMs'] >= requested
                assert cycle['pauseFreezeVerified'] and cycle['weaponRoundtripVerified'] and cycle['normalExitVerified']
            assert value['criticalReportSummary']['matchedByIdAndSource']
            assert value['criticalReportSummary']['noNormalFlowErrors']
            assert not value['physicalDevice'] and not value['whiteScreenFixed']
            flows.append(value['engine'])
assert sorted(fixtures) == ['chromium', 'webkit']
assert sorted(flows) == ['chromium', 'webkit']
print(json.dumps({'verifiedFiles': files, 'nativeFixtureRows': 12, 'completeGameCycles': 6,
    'sourceCommit': expected_source, 'physicalDevice': False, 'whiteScreenFixed': False}))
