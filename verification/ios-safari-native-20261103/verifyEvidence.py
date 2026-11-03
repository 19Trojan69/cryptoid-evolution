"""Replay synthetic native-Safari evidence from one completed Actions job log."""
from __future__ import annotations

import argparse
import gzip
import hashlib
import json
import re
from pathlib import Path

SOURCE = 'ac98e95166b0e2013186257904da46323840dab5'
TREE = '99092ec24e843fb1e419dc382bc2523a4edc0b42'
CLOCK = '5e5845d5e5beef85ca5dadac597b8d751e81f931374b942b22fdedc7d83bbb5c'
MARKER = re.compile(r'^\ufeff?\d{4}-\d\d-\d\dT\S+Z CRYPTOID_IOS_([A-Z_]+) (\{.*\})$')


def read_events(raw: bytes) -> list[tuple[str, dict]]:
    events = []
    for line in raw.decode('utf-8-sig').splitlines():
        match = MARKER.match(line)
        if match:
            events.append((match[1], json.loads(match[2])))
    return events


def webcontent(memory: dict) -> list[dict]:
    assert memory.get('webContentObserved') is True, memory
    rows = memory['rows']
    assert rows and len({row['pid'] for row in rows}) == len(rows)
    for row in rows:
        assert isinstance(row['pid'], int) and row['pid'] > 0
        assert isinstance(row['rssKiB'], int) and row['rssKiB'] >= 0
    selected = [row for row in rows if 'webcontent' in (row['label'] + row['executable']).lower()]
    assert selected and all(row['rssKiB'] > 0 for row in selected)
    return selected


def verify(raw: bytes) -> dict:
    events = read_events(raw)
    ready = [value for kind, value in events if kind == 'SIMULATOR_READY']
    assert len(ready) == 1 and ready[0]['booted'] is True
    assert ready[0]['runtime']['version'] == '26.2'
    assert ready[0]['physicalDevice'] is False
    results = [value for kind, value in events if kind == 'RESULT']
    assert [r['phase'] for r in results] == ['pilot', 'soak'], 'Both sequential complete flows are required'
    manifests = []
    summary = {'version': 1, 'sourceCommit': SOURCE, 'sourceTree': TREE,
               'physicalDevice': False, 'whiteScreenFixed': False, 'flows': []}
    for result, seconds in zip(results, [60, 1800], strict=True):
        phase = result['phase']
        assert result['complete'] is True and not result.get('failure')
        assert result['sourceCommit'] == SOURCE and result['sourceTree'] == TREE
        assert result['sourceClockSha256'] == CLOCK
        assert result['requestedActiveSeconds'] == seconds
        assert result['nativeHostOS'] == 'darwin'
        assert result['driverBackend'] == 'appium-xcuitest'
        assert result['toolVersions'] == {'appium': '3.9.0', 'xcuitest': '12.22.8'}
        assert result['simulator']['udid'] == ready[0]['udid']
        assert result['capabilities']['platformName'].lower() == 'ios'
        assert 'iPhone' in result['environment']['userAgent']
        assert result['environment']['secureContext'] is True
        assert result['sourceAndPackageUnchangedVerified'] is True
        assert result['normalReportVerified'] is True
        for key in ['physicalDevice', 'physicalPiBrowser', 'whiteScreenFixed', 'clocksAccelerated',
                    'automaticResume', 'additionalFullRecording', 'gameSourceEdited', 'servedPackageEdited',
                    'activeScreenshots', 'extraGameCollectors', 'newGameTimers', 'newAnimationFrames',
                    'memoryComparisonEligible', 'nativePhysicalTerminationCauseMeasured']:
            assert result[key] is False, key
        manifest = result['builtPackageManifest']
        paths = [entry['path'] for entry in manifest]
        assert manifest and len(set(paths)) == len(paths)
        assert all(not p.startswith('/') and '..' not in p.split('/') for p in paths)
        assert all(re.fullmatch('[0-9a-f]{64}', entry['sha256']) and entry['bytes'] >= 0 for entry in manifest)
        manifests.append(manifest)
        assert len(result['cycles']) == 3
        flow = {'phase': phase, 'observedActiveMs': [], 'samples': [], 'webContentHostRssKiB': []}
        preflights = [value for kind, value in events if kind == 'MEMORY_PREFLIGHT' and value['phase'] == phase]
        assert [p['cycle'] for p in preflights] == [0, 1, 2]
        for preflight in preflights:
            webcontent(preflight)
        for index, row in enumerate(result['cycles']):
            assert row['cycle'] == index and row['complete'] is True
            for key in ['pauseFreezeVerified', 'weaponRoundtripVerified', 'normalExitVerified', 'qaInspectionBridgeReleased']:
                assert row[key] is True, key
            assert row['requestedActiveMs'] == (10 if index else seconds) * 1000
            assert row['observedActiveMs'] >= row['requestedActiveMs']
            points = [value for kind, value in events if kind == 'POINT'
                      and value['phase'] == phase and value['cycle'] == index]
            assert len(points) == row['nativePoints'] and len(points) >= 2
            assert all(0 <= p['activeMs'] <= row['observedActiveMs'] for p in points)
            assert all(a['activeMs'] <= b['activeMs'] for a, b in zip(points, points[1:]))
            values = [sum(item['rssKiB'] for item in webcontent(p['memory'])) for p in points]
            flow['observedActiveMs'].append(row['observedActiveMs'])
            flow['samples'].append(len(points))
            flow['webContentHostRssKiB'].append({'first': values[0], 'last': values[-1], 'peakSample': max(values),
                'metric': 'sum of observed WebContent host RSS; shared pages may be counted repeatedly; not phone/GPU memory'})
        reports = [value['report'] for kind, value in events if kind == 'NORMAL_REPORT' and value['phase'] == phase]
        assert len(reports) == 1
        report = reports[0]
        assert report['fullSession'] is None and report['briefMatchesLatestStopwatch'] is True
        assert report['stopwatch']['latest']['mode'] == 'ended'
        assert report['briefDiagnostics']['latest']['options']['fullRecording'] is False
        assert report['briefDiagnostics']['latest']['resourceCheckpoint']['clockId'] == report['stopwatch']['latest']['id']
        summary['flows'].append(flow)
    assert manifests[0] == manifests[1], 'Both Safari sessions must use exactly the same built files'
    assert results[0]['finishedAt'] <= results[1]['startedAt'], 'Short flow gates the fresh long flow'
    summary['nativeLogSha256'] = hashlib.sha256(raw).hexdigest()
    summary['complete'] = True
    return summary


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('log', type=Path)
    args = parser.parse_args()
    raw = args.log.read_bytes()
    if args.log.suffix == '.gz':
        raw = gzip.decompress(raw)
    print(json.dumps(verify(raw), ensure_ascii=False, indent=2))
