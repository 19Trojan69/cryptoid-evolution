"""Archive delivered completed synthetic captures with the existing chunk verifier."""
import argparse
import base64
import gzip
import hashlib
import importlib.util
import json
from pathlib import Path

parser = argparse.ArgumentParser()
parser.add_argument('--parser', type=Path, required=True, help='Existing hud-game-soak evidence verify.py')
parser.add_argument('--evidence', type=Path, default=Path(__file__).resolve().parent/'evidence')
parser.add_argument('jobs', nargs='+', help='JOB_ID=delivered-log.txt or JOB_ID=capture.json')
args = parser.parse_args()
spec = importlib.util.spec_from_file_location('original_capture_parser', args.parser)
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
manifest_path = args.evidence/'manifest.json'
manifest = json.loads(manifest_path.read_bytes())
assert manifest['runId'] == 41777900101
for job in args.jobs:
    number, filename = job.split('=', 1)
    path, job_id = Path(filename), int(number)
    delivered = path.read_bytes()
    if path.suffix == '.json':
        captures = [json.loads(delivered)]
    else:
        events, rejected = module.events(delivered)
        assert not rejected
        captures = [value for kind, value in events if kind == 'PROJECTILE_POOL_CAPTURE']
    assert len(captures) == 1
    capture = captures[0]
    assert capture['syntheticGuestDataOnly'] and not capture['physicalDevice'] and not capture['whiteScreenFixed']
    assert capture['kind'] in ['short', 'memory'] and capture['condition'] in ['control', 'pool']
    assert capture['engine'] in ['chromium', 'webkit'] and capture['replica'] in [1, 2]
    prefix = f"{capture['kind']}-{capture['engine']}-{capture['condition']}-r{capture['replica']}"
    row = {k: capture[k] for k in ['kind', 'engine', 'condition', 'replica', 'complete']}
    row.update(jobId=job_id, deliveredFileSha256=hashlib.sha256(delivered).hexdigest(), files=[])
    seen = set()
    for item in capture['files']:
        name = item['name']
        assert name in ['receipt.json', 'build-info.json', 'verification.json', 'attribution.json', 'native-memory-infra.json.gz']
        assert name not in seen
        seen.add(name)
        packed = base64.b64decode(item['gzipBase64'], validate=True)
        raw = gzip.decompress(packed)
        assert len(raw) == item['bytes'] and hashlib.sha256(raw).hexdigest() == item['sha256']
        target = Path(prefix)/(name+'.gz')
        output = args.evidence/target
        output.parent.mkdir(parents=True, exist_ok=True)
        output.write_bytes(packed)
        row['files'].append({'name': name, 'file': str(target), 'encoding': 'gzip', 'bytes': len(raw),
                             'sha256': item['sha256'], 'archiveSha256': hashlib.sha256(packed).hexdigest()})
    group = capture['kind']
    manifest[group] = [r for r in manifest[group] if r['jobId'] != job_id]+[row]
    print(json.dumps({'jobId': job_id, 'condition': capture['condition'], 'replica': capture['replica'],
                      'complete': capture['complete'], 'filesVerified': len(row['files'])}))
manifest_path.write_text(json.dumps(manifest, indent=2)+'\n')
