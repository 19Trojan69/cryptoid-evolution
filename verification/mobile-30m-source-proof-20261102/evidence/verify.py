"""Recompute the closed cohort from digest-checked, original synthetic captures."""
import gzip
import hashlib
import json
from pathlib import Path, PurePosixPath
import runpy
import io
import tarfile
from tempfile import TemporaryDirectory

here = Path(__file__).resolve().parent
manifest = json.loads((here / 'artifact-receipt.json').read_text())
assert manifest['runId'] == 41507411505
assert manifest['ownerReportsIncluded'] is False
assert len(manifest['artifacts']) == 4 and len(manifest['files']) == 64
bundle = (here / manifest['archive']['path']).read_bytes()
assert hashlib.sha256(bundle).hexdigest() == manifest['archive']['sha256']
archive = tarfile.open(fileobj=io.BytesIO(bundle), mode='r:gz')
assert len(archive.getmembers()) == 64
assert all(m.isfile() and not PurePosixPath(m.name).is_absolute() and '..' not in PurePosixPath(m.name).parts for m in archive.getmembers())
reader = runpy.run_path(str(here / 'summarize.py'))['summarize']
with TemporaryDirectory(prefix='cryptoid-evidence-replay-') as directory:
    root = Path(directory)
    for entry in manifest['files']:
        source = PurePosixPath(entry['sourceRelativePath'])
        assert not source.is_absolute() and '..' not in source.parts
        compressed = archive.extractfile(entry['path']).read()
        assert hashlib.sha256(compressed).hexdigest() == entry['gzipSha256']
        raw = gzip.decompress(compressed)
        assert hashlib.sha256(raw).hexdigest() == entry['rawSha256']
        assert len(raw) == entry['rawBytes']
        destination = root / str(source)
        destination.parent.mkdir(parents=True, exist_ok=True)
        destination.write_bytes(raw)
    actual = reader(root)
    expected = json.loads((here / 'summary.json').read_text())
    assert actual == expected
archive.close()
assert actual['complete'] is True and len(actual['cases']) == 8
assert actual['whiteScreenFixed'] is False and actual['physicalDevice'] is False
assert len({c['builtScriptStyleManifestSha256'] for c in actual['cases']}) == 1
assert len({c['lockSha256'] for c in actual['cases']}) == 1
assert len({json.dumps(c['packages'], sort_keys=True) for c in actual['cases']}) == 1
assert all(not c['resourceWarnings'] for c in actual['cases'])
initial = json.loads(gzip.decompress((here / 'initial-preflight-failure.json.gz').read_bytes()))
assert initial['classification'] == 'test-preflight-failed-before-browser-launch'
assert len(initial['evidence']) == 4
partial = json.loads(gzip.decompress((here / 'input-complete-clock-boundary-failure.json.gz').read_bytes()))
assert partial['complete'] is False and partial['input']['complete'] is True
assert len(partial['input']['neutralContacts']['cases']) == 9
assert partial['input']['neutralContacts']['repeatedSequence']['complete'] is True
reload = json.loads(gzip.decompress((here / 'input-reload-verification.json.gz').read_bytes()))
assert reload['complete'] is True and reload['input']['notRunInThisCapture'] is True
assert reload['reload']['navigationType'] == 'reload'
assert reload['reload']['oldRunIdRetained'] is True and reload['reload']['bootAfterActiveSessionObserved'] is True
assert reload['reload']['noAutomaticResume'] is True
control = json.loads((here / 'no-toolbar-environment-control.json').read_text())
assert control['sourceCommit'] == manifest['runtimeSourceCommit']
assert control['sourceTree'] == manifest['runtimeSourceTree']
assert control['deploymentProtectionWeakened'] is False and control['runtimeSourceChanged'] is False
assert control['whiteScreenFixed'] is False and control['physicalDevice'] is False
print('CRYPTOID_30M_EVIDENCE passed: 64 original files, 8 complete flows, preserved failures, separate controls; no physical White Screen fix claimed')
