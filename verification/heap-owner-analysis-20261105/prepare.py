"""Verify existing synthetic captures and prepare the pinned offline analyzer."""
import argparse
import base64
import gzip
import hashlib
import io
import json
from pathlib import Path
import tarfile
import urllib.request
import zipfile

root = Path(__file__).resolve().parent
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('archives', type=Path, help='Directory containing the three original artifact-ID.zip files')
args = parser.parse_args()
manifest = json.loads((root / 'evidence/manifest.json').read_text())

for receipt in manifest['artifacts']:
    artifact_id = str(receipt['id'])
    archive = (args.archives / (artifact_id + '.zip')).read_bytes()
    assert len(archive) == receipt['bytes']
    assert hashlib.sha256(archive).hexdigest() == receipt['sha256']
    destination = root / 'inputs' / artifact_id
    destination.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(io.BytesIO(archive)) as opened:
        assert opened.testzip() is None
        for name in ['attribution.json', 'paused.heapsnapshot.gz', 'home.heapsnapshot.gz']:
            matches = [entry for entry in opened.namelist() if Path(entry).name == name]
            assert len(matches) == 1
            (destination / name).write_bytes(opened.read(matches[0]))
    capture = json.loads((destination / 'attribution.json').read_text())
    assert capture['sourceCommit'] == receipt['sourceCommit']
    assert capture['sourceTree'] == receipt['sourceTree']
    assert capture['complete'] is True
    assert capture['activeForcedGc'] is False
    assert capture['activeHeapSnapshots'] is False
    for snapshot in receipt['snapshots']:
        compressed = (destination / (snapshot['label'] + '.heapsnapshot.gz')).read_bytes()
        assert len(compressed) == snapshot['compressedBytes']
        assert hashlib.sha256(compressed).hexdigest() == snapshot['sha256']
        content = gzip.decompress(compressed)
        assert len(content) == snapshot['bytes']
        profile = json.loads(content)
        fields = profile['snapshot']['meta']['node_fields']
        stride = len(fields)
        assert len(profile['nodes']) // stride == snapshot['nodes']
        assert sum(profile['nodes'][fields.index('self_size')::stride]) == snapshot['selfBytes']
        (destination / (snapshot['label'] + '.heapsnapshot')).write_bytes(content)
    print(artifact_id + ': both original snapshots verified')

package = manifest['package']
tools = root / 'tools'
tools.mkdir(exist_ok=True)
tar_path = tools / 'chrome-devtools-mcp-1.12.0.tgz'
if not tar_path.exists():
    url = 'https://registry.npmjs.org/chrome-devtools-mcp/-/chrome-devtools-mcp-1.12.0.tgz'
    with urllib.request.urlopen(url, timeout=40) as response:
        tar_path.write_bytes(response.read())
tar_bytes = tar_path.read_bytes()
assert hashlib.sha256(tar_bytes).hexdigest() == package['tarballSha256']
assert ('sha512-' + base64.b64encode(hashlib.sha512(tar_bytes).digest()).decode()) == package['npmIntegrity']
with tarfile.open(fileobj=io.BytesIO(tar_bytes), mode='r:gz') as archive:
    archive.extractall(tools / 'extracted', filter='data')
bundled = json.loads((tools / 'extracted/package/build/src/third_party/bundled-packages.json').read_text())
assert bundled['https://github.com/ChromeDevTools/devtools-frontend'] == package['devtoolsFrontendCommit']
print('Pinned official DevTools package verified; no browser, server or package install script started')
