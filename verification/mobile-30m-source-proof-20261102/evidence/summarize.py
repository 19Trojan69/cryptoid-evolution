"""Offline reader of all original driver receipts, including failed/missing cases."""
import argparse
import hashlib
import json
from pathlib import Path
from statistics import median

SOURCE = 'b042c8e50ad3f05a70418ae5ee6bb4412809035b'
TREE = '921fe9212ce0ccfeaa7dc46352d3d6385c7f3fb2'


def summarize(root):
    cases, problems, seen = [], [], set()
    for path in sorted(Path(root).rglob('receipt.json')):
        try:
            r = json.loads(path.read_text())
            key = (r['engine'], r['replica'], r['phase'])
            if key in seen:
                raise ValueError('duplicate receipt identity: ' + repr(key))
            seen.add(key)
            if r['engine'] not in ['chromium', 'webkit'] or r['replica'] not in [1, 2] or r['phase'] not in ['smoke', 'soak']:
                raise ValueError('unexpected receipt identity')
            if r['sourceCommit'] != SOURCE or r['sourceTree'] != TREE:
                raise ValueError('mixed runtime source')
            requested = 60 if r['phase'] == 'smoke' else 1800
            if r['requestedActiveSeconds'] != requested:
                raise ValueError('short/inexact capture cannot become a long run')
            for name in ['runtimeSourceChanged', 'builtRuntimeChanged', 'addedInPageHooks', 'physicalDevice', 'whiteScreenFixed']:
                if r[name] is not False:
                    raise ValueError('changed source/measurement condition: ' + name)
            v = json.loads(path.with_name('verification.json').read_text())
            if v['sourceCommit'] != SOURCE or v['sourceTree'] != TREE or v['engine'] != r['engine'] or v['run'] != r['phase']:
                raise ValueError('verification/receipt identity mismatch')
            points = v['cycles'][0]['points'] if v.get('cycles') else []
            values = [p['linuxBrowserDescendantPssKiB'] / 1024 for p in points]
            first = [p['linuxBrowserDescendantPssKiB'] / 1024 for p in points if p['activeMs'] <= 60000]
            last_time = max((p['activeMs'] for p in points), default=0)
            last = [p['linuxBrowserDescendantPssKiB'] / 1024 for p in points if p['activeMs'] >= last_time - 60000]
            warnings = []
            if any(p.get('canvas', {}).get('failures') for p in points):
                warnings.append('canvas failure counter is nonempty')
            if any(p.get('audio', {}).get('audioClockStalls', 0) for p in points):
                warnings.append('audio clock stall counter is nonzero')
            first_median = median(first) if first else None
            last_median = median(last) if last else None
            row = {'engine': r['engine'], 'replica': r['replica'], 'phase': r['phase'],
                   'complete': r['complete'] is True and v['complete'] is True,
                   'engineVersion': v.get('engineVersion'),
                   'requestedActiveSeconds': requested, 'actualCyclesMs': [c.get('observedActiveMs') for c in v.get('cycles', [])],
                   'activeSampleCount': len(points), 'peakSummedLinuxPssMiB': max(values, default=None),
                   'firstActiveMinuteMedianPssMiB': first_median, 'lastActiveMinuteMedianPssMiB': last_median,
                   'medianPssChangeMiB': last_median - first_median if first_median is not None and last_median is not None else None,
                   'externalSamples': r['processSamples'], 'errors': r['errors'],
                   'nativeFailure': v.get('failure'), 'resourceWarnings': warnings,
                   'maxCanvasCacheBytes': max((p.get('canvas', {}).get('cacheBytes', 0) for p in points), default=None),
                   'maxCanvasSurfaceBytes': max((p.get('canvas', {}).get('surfaceBytes', 0) for p in points), default=None),
                   'maxAudioVoices': max((p.get('audio', {}).get('audioVoices', 0) for p in points), default=None),
                   'maxAudioBufferBytes': max((p.get('audio', {}).get('audioBufferBytes', 0) for p in points), default=None),
                   'normalReportVerified': v.get('normalReportVerified') is True,
                   'packages': r['installedPackages'], 'lockSha256': r['lockSha256'],
                   'builtScriptStyleManifestSha256': hashlib.sha256(json.dumps(r['scriptsAndStyles'], sort_keys=True).encode()).hexdigest()}
            if row['complete']:
                if len(v['cycles']) != 3 or not row['normalReportVerified'] or r['childExit']['code'] != 0 or r['errors']:
                    raise ValueError('incomplete cycle/report/exit was labelled complete')
                for i, cycle in enumerate(v['cycles']):
                    if cycle.get('observedActiveMs', 0) < (requested if i == 0 else 10) * 1000:
                        raise ValueError('insufficient measured active time')
                    if not all(cycle.get(k) is True for k in ['complete', 'pauseFreezeVerified', 'weaponRoundtripVerified', 'normalExitVerified']):
                        raise ValueError('missing complete lifecycle gate')
            cases.append(row)
        except Exception as error:
            problems.append({'receipt': str(path.relative_to(root)), 'error': str(error)})
    expected = {(e, r, p) for e in ['chromium', 'webkit'] for r in [1, 2] for p in ['smoke', 'soak']}
    missing = sorted(expected - seen)
    return {'version': 1, 'sourceCommit': SOURCE, 'sourceTree': TREE,
            'complete': not missing and not problems and len(cases) == 8 and all(c['complete'] for c in cases),
            'physicalDevice': False, 'whiteScreenFixed': False, 'causalMemoryComparison': False,
            'cases': cases, 'missingCases': missing, 'artifactProblems': problems,
            'limits': ['Linux native engines; no physical iOS/Android acceptance.',
                       'One source condition and unseeded gameplay; no causal A/B effect size.',
                       'PSS includes classified browser descendants, not phone RAM or GPU-resident memory.',
                       'Passing DOM/clock gates does not directly measure physical white pixels.',
                       'Resource warnings remain separate from the original native-flow result.',
                       'Byte-equal CI JS/CSS manifests do not prove equality with the hosted bundle.']}


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('root', type=Path)
    parser.add_argument('output', type=Path)
    args = parser.parse_args()
    result = summarize(args.root)
    args.output.write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps({'complete': result['complete'], 'cases': len(result['cases']),
                      'missing': result['missingCases'], 'problems': result['artifactProblems']}))
