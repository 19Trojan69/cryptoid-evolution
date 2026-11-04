"""Verify capture integrity, comparability and the predeclared resource gate."""
import argparse
import gzip
import hashlib
import json
import math
from pathlib import Path
import statistics

args = argparse.ArgumentParser()
args.add_argument('root', type=Path, nargs='?', default=Path(__file__).resolve().parent)
args.add_argument('--short-only', action='store_true')
options = args.parse_args()
ROOT = options.root
manifest = json.loads((ROOT/'manifest.json').read_bytes())
source_hashes = {'control': 'deb3c488892c3096b5086b35ab3141aa1e1c5f7cd34f2e8a1ae714ef9ebd96db',
                 'pool': 'ea2d1fb8ff13ff4930f2c9d4aa18ff9d13091fa5e0c9c11eb56915917913ea78'}


def load(row, name):
    f = next(x for x in row['files'] if x['name'] == name)
    packed = (ROOT/f['file']).read_bytes()
    assert hashlib.sha256(packed).hexdigest() == f['archiveSha256']
    raw = gzip.decompress(packed) if f['encoding'] == 'gzip' else packed
    assert len(raw) == f['bytes'] and hashlib.sha256(raw).hexdigest() == f['sha256']
    return json.loads(raw)


def require_build(row, result, build, receipt):
    assert result['sourceCommit'] == build['sourceCommit'] == manifest['sourceCommit']
    assert result['sourceTree'] == build['sourceTree'] == manifest['sourceTree']
    assert receipt['condition'] == row['condition'] and receipt['replica'] == row['replica']
    assert receipt['originalCollectorRestoredExactly'] and receipt['sourceGameFilesEdited'] is False
    assert receipt['extraGameTimers'] is False and not receipt['physicalDevice'] and not receipt['whiteScreenFixed']
    for k in ['physicalDevice', 'whiteScreenFixed', 'automaticResume', 'clocksAccelerated']:
        assert result[k] is False
    p = build['projectilePoolCandidate']
    assert result['projectilePoolComparison'] == p and p['condition'] == row['condition']
    assert result['projectilePoolReplica'] == row['replica']
    assert p['originalSha256'] == source_hashes['control']
    assert p['transformedSha256'] == source_hashes[row['condition']]
    assert p['poolLimitPerGroup'] == (32 if row['condition'] == 'pool' else 0)
    assert p['typeScriptDiagnosticsUnchanged'] and p['baselineTypeScriptErrors'] == []
    assert p['originalRestoredExactly'] and p['originalGameControllerAndClockRetained']
    for k in ['simulationChanged', 'cssChanged', 'extraTimers', 'extraFrames']:
        assert p[k] is False
    assert build['controllerSha256'] == '6b500123cb1443bbcb52809f0dbd06520ea0aee02a550ec346ab5ce1f186f277'
    assert build['diagnosticStopwatch']['stateSha256'] == '5e5845d5e5beef85ca5dadac597b8d751e81f931374b942b22fdedc7d83bbb5c'
    assert build['mobileHudBackdropCandidate']['value'] == 'none'
    assert build['qaLocalBossStyle']['condition'] == 'leaves'
    muzzle = build['playerMuzzleLocalCandidate']
    assert muzzle['condition'] == 'control'
    assert muzzle['compiledVirtualControllerSha256'] == muzzle['incomingVirtualControllerSha256']


short = []
assert len(manifest['short']) == 4
assert {(x['engine'], x['condition']) for x in manifest['short']} == {(e, c) for e in ['chromium', 'webkit'] for c in ['control', 'pool']}
for row in manifest['short']:
    result, build, receipt = [load(row, name) for name in ['verification.json', 'build-info.json', 'receipt.json']]
    require_build(row, result, build, receipt)
    assert result['complete'] and receipt['complete']
    assert receipt['shortReuseObserver'] and not result['memoryComparisonEligible']
    assert result['normalReportVerified'] and result['diagnosticResourceCheckpointVerified']
    assert len(result['cycles']) == 3
    for i, cycle in enumerate(result['cycles']):
        assert cycle['complete'] and cycle['observedActiveMs'] >= (60000 if i == 0 else 10000)
        for key in ['pauseFreezeVerified', 'weaponRoundtripVerified', 'normalExitVerified']:
            assert cycle[key]
        proof = cycle['projectileReuseProof']
        assert proof['added'] > 0 and proof['unique'] > 0
        assert (proof['reused'] > 0) if row['condition'] == 'pool' else (proof['reused'] == 0)
    short.append({'engine': row['engine'], 'condition': row['condition'], 'complete': True,
                  'activeMs': [c['observedActiveMs'] for c in result['cycles']],
                  'reuseProof': [c['projectileReuseProof'] for c in result['cycles']]})


def renderer_pss(point):
    processes = [p for p in point['memory']['processes'] if p['role'] == 'chromium-renderer']
    assert processes and all(isinstance(p['pssKiB'], (int, float)) and p['pssKiB'] >= 0 for p in processes)
    return sum(p['pssKiB'] for p in processes)/1024


def native_objects(result):
    allocation = result['inactiveNativeAllocation']
    assert allocation['attachedOnlyAfterActiveInterval'] and not allocation['deterministic']
    assert allocation['automaticDumpTriggers'] == []
    point = next(d for d in allocation['checkpoints'] if d['label'] == 'paused-settled-before-gc')
    values = {}
    for process in point['processes']:
        value = process['categories']['blink_objects']
        if 'renderer' not in process['processName'].lower() or value is None:
            continue
        assert isinstance(value, (int, float)) and math.isfinite(value) and value >= 0
        if process['processId'] in values:
            assert values[process['processId']] == value, 'Ambiguous native fragments'
        values[process['processId']] = value
    assert values, 'An unreported native category is not zero'
    return {'totalReportedRendererBlinkObjectBytes': sum(values.values()), 'byProcess': values}


rows, signatures = [], []
for row in manifest['memory']:
    result, build, receipt = [load(row, name) for name in ['attribution.json', 'build-info.json', 'receipt.json']]
    require_build(row, result, build, receipt)
    for key in ['activeHeapProfilerAttached', 'activeForcedGc', 'activeHeapSnapshots', 'activeScreenshots',
                'activeNativeAnimationScans', 'activeNativeTracing']:
        assert result[key] is False
    assert receipt['shortReuseObserver'] is False and receipt['activeNativeWrappersAdded'] is False
    assert result['fullRecording'] is False and result['collisionProtection'] is True
    assert result['localStyleComparison']['condition'] == 'leaves'
    signatures.append((result['engineVersion'], json.dumps(result['actualInstalledPackages'], sort_keys=True), result['lockSha256'],
                       build['playerMuzzleLocalCandidate']['incomingVirtualControllerSha256'],
                       build['diagnosticStopwatch']['stateSha256'], build['projectilePoolCandidate']['baseBuilderSha256'],
                       build['projectilePoolCandidate']['adaptedBuilderSha256']))
    out = {'condition': row['condition'], 'replica': row['replica'], 'complete': result['complete'] and receipt['complete'],
           'failure': result.get('failure'), 'observedActiveMs': result.get('observedActiveMs'), 'volleysAdvanced': result.get('volleysAdvanced')}
    if out['complete']:
        assert result['requestedSeconds'] == 1200 and result['observedActiveMs'] >= 1200000
        points = result['points']
        times = [p['activeMs'] for p in points]
        assert len(points) >= 200 and times == sorted(times) and times[0] >= 0
        end = result['observedActiveMs']
        first = [renderer_pss(p) for p in points if p['activeMs'] <= 60000]
        last = [renderer_pss(p) for p in points if end-60000 <= p['activeMs'] <= end]
        assert len(first) >= 8 and len(last) >= 8
        out.update(firstMinuteMedianRendererPssMiB=statistics.median(first), lastMinuteMedianRendererPssMiB=statistics.median(last),
                   peakSampleRendererPssMiB=max(map(renderer_pss, points)), nativeBeforeExplicitGc=native_objects(result))
    rows.append(out)
if rows:
    assert len(set(signatures)) == 1, 'Source, clock, engine, packages or build implementation differ'
expected = {(c, n) for c in ['control', 'pool'] for n in [1, 2]}
if not options.short_only:
    assert len(rows) == 4 and {(r['condition'], r['replica']) for r in rows} == expected
eligible = len(rows) == 4 and all(row['complete'] for row in rows)
pairs = []
if eligible:
    for n in [1, 2]:
        a = next(r for r in rows if r['condition'] == 'control' and r['replica'] == n)
        b = next(r for r in rows if r['condition'] == 'pool' and r['replica'] == n)
        reduction = 1-b['lastMinuteMedianRendererPssMiB']/a['lastMinuteMedianRendererPssMiB']
        pairs.append({'replica': n, 'lastMinuteRendererPssReduction': reduction, 'predeclaredGatePassed': reduction >= .15})
print(json.dumps({'version': 1, 'short': short, 'memory': rows, 'pairs': pairs, 'completeCohort': eligible,
                  'predeclaredResourceGatePassed': eligible and all(p['predeclaredGatePassed'] for p in pairs),
                  'physicalDeviceAccepted': False, 'whiteScreenFixed': False,
                  'limits': ['Two unseeded independent Linux renderer processes per arm, not phone RAM or GPU memory.',
                             'Short flow has an explicit test observer; only the separate long cohort is resource-eligible.',
                             'Native dumps and heaps occur only after inactive gates and may influence collection.']}, indent=2))
