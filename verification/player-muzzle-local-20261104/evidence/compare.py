"""Validate the original captured cohort before the predeclared resource decision."""
from pathlib import Path
import gzip
import hashlib
import json
import math
import statistics
import sys

ROOT = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(__file__).resolve().parent
M = json.loads((ROOT / 'manifest.json').read_bytes())

def load(row, name):
    f = next(x for x in row['files'] if x['name'] == name)
    packed = (ROOT / f['file']).read_bytes()
    assert hashlib.sha256(packed).hexdigest() == f['archiveSha256']
    raw = gzip.decompress(packed) if f['encoding'] == 'gzip' else packed
    assert len(raw) == f['bytes'] and hashlib.sha256(raw).hexdigest() == f['sha256']
    return json.loads(raw)

def renderer_pss(point):
    ps = [p for p in point['memory']['processes'] if p['role'] == 'chromium-renderer']
    assert ps and all(isinstance(p['pssKiB'], (int, float)) and p['pssKiB'] >= 0 for p in ps)
    return sum(p['pssKiB'] for p in ps) / 1024

def native_objects(capture):
    a = capture['inactiveNativeAllocation']
    assert a['attachedOnlyAfterActiveInterval'] and not a['deterministic'] and a['automaticDumpTriggers'] == []
    d = next(d for d in a['checkpoints'] if d['label'] == 'paused-settled-before-gc')
    # Fragments of one process must not be double-counted. Different processes
    # have separate Blink heaps; overlapping allocator categories are not added.
    values = {}
    for p in d['processes']:
        v = p['categories']['blink_objects']
        if 'renderer' not in p['processName'].lower() or v is None:
            continue
        assert isinstance(v, (int, float)) and math.isfinite(v) and v >= 0
        if p['processId'] in values:
            assert values[p['processId']] == v, 'Ambiguous native fragments'
        values[p['processId']] = v
    assert values, 'Unreported native category cannot become zero'
    return {'totalReportedRendererBlinkObjectBytes': sum(values.values()), 'byProcess': values}

short = []
leaf_code_hashes = set()
for row in M['short']:
    r = load(row, 'verification.json'); b = load(row, 'build-info.json'); receipt = load(row, 'receipt.json')
    assert receipt['complete'] and r['complete'] and r['sourceCommit'] == M['sourceCommit'] and r['sourceTree'] == M['sourceTree']
    assert r['normalReportVerified'] and r['diagnosticResourceCheckpointVerified']
    assert not r['physicalDevice'] and not r['whiteScreenFixed'] and not r['automaticResume'] and not r['clocksAccelerated']
    assert b['diagnosticStopwatch']['stateSha256'] == '5e5845d5e5beef85ca5dadac597b8d751e81f931374b942b22fdedc7d83bbb5c'
    assert b['mobileHudBackdropCandidate']['value'] == 'none'
    assert b['playerMuzzleLocalCandidate']['condition'] == 'leaf'
    leaf_code_hashes.add(b['playerMuzzleLocalCandidate']['compiledVirtualControllerSha256'])
    for i, c in enumerate(r['cycles']):
        assert c['complete'] and c['observedActiveMs'] >= (60 if i == 0 else 10)*1000
        for k in ['actualCompiledMuzzlePathVerified', 'pauseFreezeVerified', 'weaponRoundtripVerified', 'normalExitVerified']:
            assert c[k]
    f = r['cycles'][0]['playerMuzzleFidelity']
    assert len(f['cases']) == 8 and all(c['computedConsumersAndGeometryEqual'] for c in f['cases'])
    for k in ['mountedNodesRetained', 'missingConsumerFallback', 'fallbackRemovedOnConsumerMount',
              'replacedLeafAndNewHostVerified', 'nativeAnimationIdentityAndTimingRetained', 'originalComputedPresentationRestored']:
        assert f[k]
    short.append({'engine': row['engine'], 'activeMs': [c['observedActiveMs'] for c in r['cycles']], 'complete': True})
assert {x['engine'] for x in short} == {'chromium', 'webkit'}
assert len(leaf_code_hashes) == 1, 'Both engine builds must receive the same candidate source'

rows, cohort = [], []
for row in M['memory']:
    r = load(row, 'attribution.json'); b = load(row, 'build-info.json'); receipt = load(row, 'receipt.json')
    assert r['sourceCommit'] == M['sourceCommit'] and r['sourceTree'] == M['sourceTree']
    assert r['playerMuzzleComparison']['condition'] == row['condition'] and r['playerMuzzleReplica'] == row['replica']
    assert not r['clocksAccelerated'] and not r['automaticResume'] and not r['physicalDevice'] and not r['whiteScreenFixed']
    for k in ['activeHeapProfilerAttached', 'activeForcedGc', 'activeHeapSnapshots', 'activeScreenshots', 'activeNativeAnimationScans', 'activeNativeTracing']:
        assert r[k] is False
    assert r['localStyleComparison']['condition'] == 'leaves' and b['mobileHudBackdropCandidate']['value'] == 'none'
    assert r['fullRecording'] is False and r['collisionProtection'] is True
    assert b['playerMuzzleLocalCandidate']['originalControllerSha256'] == '6b500123cb1443bbcb52809f0dbd06520ea0aee02a550ec346ab5ce1f186f277'
    bp = b['playerMuzzleLocalCandidate']
    assert bp['condition'] == row['condition']
    assert bp['compiledVirtualControllerSha256'] == (next(iter(leaf_code_hashes)) if row['condition'] == 'leaf' else bp['incomingVirtualControllerSha256'])
    cohort.append((r['engineVersion'], json.dumps(r['actualInstalledPackages'], sort_keys=True), r['lockSha256'],
                   b['playerMuzzleLocalCandidate']['incomingVirtualControllerSha256'], b['diagnosticStopwatch']['stateSha256']))
    out = {'condition': row['condition'], 'replica': row['replica'], 'complete': r['complete'] and receipt['complete'],
           'failure': r.get('failure'), 'observedActiveMs': r.get('observedActiveMs'), 'volleysAdvanced': r.get('volleysAdvanced')}
    if out['complete']:
        assert r['requestedSeconds'] == 1200 and r['observedActiveMs'] >= 1200000
        points = r['points']; times = [p['activeMs'] for p in points]
        assert len(points) >= 200 and times == sorted(times) and times[0] >= 0
        end = r['observedActiveMs']; first = [renderer_pss(p) for p in points if p['activeMs'] <= 60000]
        last = [renderer_pss(p) for p in points if end-60000 <= p['activeMs'] <= end]
        assert len(first) >= 8 and len(last) >= 8
        out.update(firstMinuteMedianRendererPssMiB=statistics.median(first),
                   lastMinuteMedianRendererPssMiB=statistics.median(last),
                   peakSampleRendererPssMiB=max(map(renderer_pss, points)), nativeBeforeExplicitGc=native_objects(r))
    rows.append(out)
assert len(set(cohort)) == 1, 'Source, engine, installed packages, clock or incoming controller differ'
keys = {(r['condition'], r['replica']) for r in rows}
assert keys == {(c, n) for c in ['control', 'leaf'] for n in [1, 2]} and len(rows) == 4
eligible = all(r['complete'] for r in rows)
pairs = []
if eligible:
    for n in [1, 2]:
        a = next(r for r in rows if r['condition'] == 'control' and r['replica'] == n)
        b = next(r for r in rows if r['condition'] == 'leaf' and r['replica'] == n)
        reduction = 1-b['lastMinuteMedianRendererPssMiB']/a['lastMinuteMedianRendererPssMiB']
        native_lower = b['nativeBeforeExplicitGc']['totalReportedRendererBlinkObjectBytes'] < a['nativeBeforeExplicitGc']['totalReportedRendererBlinkObjectBytes']
        pairs.append({'replica': n, 'lastMinuteRendererPssReduction': reduction, 'nativeObjectBytesLower': native_lower,
                      'predeclaredGatePassed': reduction >= .15 and native_lower})
print(json.dumps({'version': 1, 'short': short, 'memory': rows, 'pairs': pairs,
                  'completeCohort': eligible, 'predeclaredResourceGatePassed': eligible and all(p['predeclaredGatePassed'] for p in pairs),
                  'physicalDeviceAccepted': False, 'whiteScreenFixed': False,
                  'limits': ['Two unseeded independent host repeats per arm; not phone RAM, GPU memory or a native termination cause.',
                             'Native allocator dumps are inactive observations and may themselves affect collection.']}, ensure_ascii=False, indent=2))
