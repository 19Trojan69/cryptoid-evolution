"""Replay completed synthetic browser captures and the failed native baseline."""
import base64
import gzip
import hashlib
import json
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parent
SOURCE = 'ac98e95166b0e2013186257904da46323840dab5'
TREE = '99092ec24e843fb1e419dc382bc2523a4edc0b42'
MARKER = re.compile(r'^\ufeff?\d{4}-\d\d-\d\dT\S+Z CRYPTOID_IOS_([A-Z_]+) (\{.*\})$')


def events(raw, reject_compiler=False):
    result, pending, rejected = [], {}, []
    for line in raw.decode('utf-8-sig').splitlines():
        match = MARKER.match(line)
        if not match:
            continue
        kind, value = match[1], json.loads(match[2])
        if kind != 'CHUNK':
            result.append((kind, value))
            continue
        row = pending.setdefault(value['id'], dict(parts=[], total=value['total'],
            sha256=value['sha256'], kind=value['kind']))
        assert value['index'] == len(row['parts']), 'Missing, duplicate or reordered fragment'
        assert (value['total'], value['sha256'], value['kind']) == (row['total'], row['sha256'], row['kind'])
        row['parts'].append(value['data'])
        if len(row['parts']) == row['total']:
            text = ''.join(row['parts'])
            actual = hashlib.sha256(text.encode()).hexdigest()
            if actual != row['sha256']:
                # This compiler payload is NOT accepted or used for game claims.
                # Preserve the delivered bytes and report the integrity failure.
                assert reject_compiler and row['kind'] == 'ENVIRONMENT_WDA_BUILD_LOG', 'Untrusted application evidence'
                rejected.append(dict(kind=row['kind'], reason='sha256 mismatch',
                    expected=row['sha256'], actual=actual, deliveredFragments=len(row['parts']), expectedFragments=row['total']))
            else:
                result.append((row['kind'], json.loads(text)))
            del pending[value['id']]
    assert not pending, 'Incomplete fragments are never accepted'
    return result, rejected


def verify():
    manifest = json.loads((ROOT / 'manifest.json').read_bytes())
    logs, rejected = {}, []
    for row in manifest['logs']:
        packed = (ROOT / row['file']).read_bytes()
        assert len(packed) == row['bytes'] and hashlib.sha256(packed).hexdigest() == row['sha256']
        raw = gzip.decompress(packed)
        assert len(raw) == row['rawBytes'] and hashlib.sha256(raw).hexdigest() == row['rawSha256']
        parsed, failures = events(raw, reject_compiler=row['jobId'] == 125880789952)
        logs[row['jobId']] = parsed
        rejected.extend(dict(jobId=row['jobId'], **failure) for failure in failures)
    summary = dict(version=1, hudRunId=41626481637, nativeRunId=41625231628,
        physicalDeviceAccepted=False, whiteScreenFixed=False, memoryReductionProven=False,
        entireNativeJobIntegrityClaimed=False, rejectedEvidence=rejected, flows=[])
    for engine, job in [('chromium', 125885011041), ('webkit', 125885011808)]:
        captures = [v for k, v in logs[job] if k == 'HUD_FIXED_GAME_CAPTURE']
        assert [(v['workload'], v['phase']) for v in captures] == [
            ('stationary', 'smoke'), ('field-contacts', 'smoke'), ('field-contacts', 'soak')]
        for capture in captures:
            assert capture['engine'] == engine and capture['complete'] is True
            assert capture['syntheticGuestDataOnly'] is True
            assert capture['physicalDevice'] is False and capture['whiteScreenFixed'] is False
            files = {}
            for item in capture['files']:
                raw = gzip.decompress(base64.b64decode(item['gzipBase64'], validate=True))
                assert len(raw) == item['bytes'] and hashlib.sha256(raw).hexdigest() == item['sha256']
                assert item['name'] not in files
                files[item['name']] = raw
            assert set(files) == {'receipt.json', 'verification.json', 'cycle-0.jsonl', 'cycle-1.jsonl', 'cycle-2.jsonl'}
            receipt = json.loads(files['receipt.json'])
            result = json.loads(files['verification.json'])
            for value in [receipt, result]:
                assert value['sourceCommit'] == SOURCE and value['sourceTree'] == TREE
                assert value['complete'] is True and value['whiteScreenFixed'] is False
                assert value['physicalDevice'] is False and value['automaticResume'] is False
                assert value['clocksAccelerated'] is False and value['memoryComparisonEligible'] is False
            assert receipt['childExit']['code'] == 0 and not receipt['errors']
            assert receipt['runtimeSourceChanged'] is False and receipt['servedPackageChanged'] is False
            assert receipt['renderedHudStyleCandidate'] is True
            assert result['targetedHudCandidate']['oneRuleInjected'] is True
            assert result['targetedHudCandidate']['onlyProperty'] == 'backdrop-filter'
            assert result['normalReportVerified'] is True and result['diagnosticResourceCheckpointVerified'] is True
            assert len(result['cycles']) == 3
            seconds = 1800 if capture['phase'] == 'soak' else 60
            contacts = 0
            for index, cycle in enumerate(result['cycles']):
                assert cycle['complete'] is True and cycle['observedActiveMs'] >= (seconds if index == 0 else 10)*1000
                for key in ['pauseFreezeVerified', 'weaponRoundtripVerified', 'normalExitVerified', 'resourceCheckpointActiveVerified']:
                    assert cycle[key] is True
                assert cycle['targetedHudCandidate']['backdropFilter'] == 'none'
                taps = cycle['reactorLineWorkload']['nativeContacts']
                assert len(taps) == (7 if capture['workload'] == 'field-contacts' else 0)
                for tap in taps:
                    assert abs(tap['requestedX']-tap['actualPlayer']['x']) < .02
                contacts += len(taps)
                points = [json.loads(line) for line in files[f'cycle-{index}.jsonl'].splitlines() if line]
                assert len(points) >= 2
                times = [point['activeMs'] for point in points]
                assert times == sorted(times) and 0 <= times[0] <= times[-1] <= cycle['observedActiveMs']
            summary['flows'].append(dict(engine=engine, workload=capture['workload'], phase=capture['phase'],
                complete=True, activeMs=[c['observedActiveMs'] for c in result['cycles']], verifiedNativeContacts=contacts))
    native = logs[125880789952]
    controls = [v for k, v in native if k == 'CALIBRATED_CONTROL_READY']
    assert len(controls) == 1 and controls[0]['complete'] is True and controls[0]['trustedNativeProbeTapVerified'] is True
    results = [v for k, v in native if k == 'RESULT']
    assert len(results) == 1 and results[0]['phase'] == 'pilot'
    assert results[0]['complete'] is False and results[0]['cycles'] == []
    assert 'did not return any connected web applications after 7262ms' in results[0]['failure']['message']
    pipelines = [v for k, v in native if k == 'FROZEN_GAME_PIPELINE_RESULT']
    assert len(pipelines) == 1
    pipeline = pipelines[0]
    assert pipeline['complete'] is False and pipeline['completedGamePhases'] == []
    assert pipeline['gameLoaded'] is None and pipeline['controlVerified'] is True
    assert pipeline['activeScreenshots'] is False and pipeline['postFailureSimulatorScreenshot'] is False
    summary['nativeAttempt'] = dict(complete=False, controlVerified=True, verifiedGameCycles=0,
        gameLoaded=None, longFlowStarted=False, failure=results[0]['failure'], nativePhoneCauseProven=False)
    return summary


if __name__ == '__main__':
    print(json.dumps(verify(), ensure_ascii=False, indent=2))
