"""Compare original downloaded CI ZIPs with the independently captured files."""
import argparse
import gzip
import hashlib
import json
from pathlib import Path
import zipfile

parser = argparse.ArgumentParser()
parser.add_argument('--github-manifest', type=Path, required=True)
parser.add_argument('--archives', type=Path, required=True)
parser.add_argument('--evidence', type=Path, default=Path(__file__).resolve().parent)
args = parser.parse_args()
provider = json.loads(args.github_manifest.read_bytes())
manifest = json.loads((args.evidence/'manifest.json').read_bytes())
assert manifest['runId'] == 41777900101
rows = []
for row in manifest['short']+manifest['memory']:
    if row['kind'] == 'short':
        name = f"projectile-pool-short-{row['engine']}-{row['condition']}"
    else:
        name = f"projectile-pool-memory-{row['condition']}-{row['replica']}"
    item = next(x for x in provider['artifacts'] if x['name'] == name)
    assert not item['expired'] and item['workflow_run']['head_sha'] == manifest['sourceCommit']
    path = args.archives/(name+'.zip')
    original = path.read_bytes()
    digest = hashlib.sha256(original).hexdigest()
    assert 'sha256:'+digest == item['digest'] and len(original) == item['size_in_bytes']
    prefix = f"{row['engine']}-{row['condition']}-r{row['replica']}-{row['kind']}/"
    snapshot_count = 0
    with zipfile.ZipFile(path) as archive:
        assert archive.testzip() is None
        for f in row['files']:
            packed = (args.evidence/f['file']).read_bytes()
            assert hashlib.sha256(packed).hexdigest() == f['archiveSha256']
            raw = gzip.decompress(packed)
            assert len(raw) == f['bytes'] and hashlib.sha256(raw).hexdigest() == f['sha256']
            assert archive.read(prefix+f['name']) == raw
        if row['kind'] == 'short':
            fixture = json.loads(archive.read('fixture-'+row['engine']+'/fixture.json'))
            assert fixture['complete'] and fixture['normalAllocations'] == {'control': 24002, 'pool': 14}
            assert fixture['detachedPoolLimitVerified'] == 64
            assert fixture['nativeComputedMainAndPseudoStylesEqual'] and fixture['nativeGeometryEqual']
            assert not fixture['physicalDevice'] and not fixture['resourceBenefitMeasured']
        else:
            capture = json.loads(archive.read(prefix+'attribution.json'))
            assert capture['complete'] and len(capture['snapshots']) == 2
            for snapshot in capture['snapshots']:
                packed = archive.read(prefix+snapshot['file'])
                assert len(packed) == snapshot['compressedBytes']
                assert hashlib.sha256(packed).hexdigest() == snapshot['sha256']
                assert len(gzip.decompress(packed)) == snapshot['bytes']
                snapshot_count += 1
    rows.append({'name': name, 'artifactId': item['id'], 'bytes': len(original), 'sha256': digest,
                 'capturedFilesCompared': len(row['files']), 'rawHeapGzipDigestsVerified': snapshot_count})
assert len(rows) == len(manifest['short'])+len(manifest['memory'])
print(json.dumps({'runId': manifest['runId'], 'archives': rows, 'rawHeapsResummarized': False,
                  'rawNativeTracesCheckedSeparately': True}, indent=2))
