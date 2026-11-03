"""Offline replay of synthetic CI captures, including the failed preparation."""
import argparse
import hashlib
import io
import json
from pathlib import Path
import tarfile

ROOT = Path(__file__).resolve().parent
SOURCE = 'ac98e95166b0e2013186257904da46323840dab5'
TREE = '99092ec24e843fb1e419dc382bc2523a4edc0b42'
CLOCK = '5e5845d5e5beef85ca5dadac597b8d751e81f931374b942b22fdedc7d83bbb5c'
VERIFIER = '614df63b6b04c28446a0294972ff2e9125be8275e1d953ee2c06482dd2180af0'


def read_archive(receipt_path):
    receipt = json.loads((ROOT / receipt_path).read_bytes())
    raw = (ROOT / receipt['archive']['file']).read_bytes()
    assert len(raw) == receipt['archive']['bytes']
    assert hashlib.sha256(raw).hexdigest() == receipt['archive']['sha256']
    data = {}
    with tarfile.open(fileobj=io.BytesIO(raw), mode='r:gz') as archive:
        members = archive.getmembers()
        assert all(m.isfile() and not Path(m.name).is_absolute() and '..' not in Path(m.name).parts for m in members)
        assert len(members) == len(set(m.name for m in members)) == len(receipt['files'])
        assert {m.name for m in members} == {row['path'] for row in receipt['files']}
        for row in receipt['files']:
            value = archive.extractfile(row['path']).read()
            assert len(value) == row['bytes']
            assert hashlib.sha256(value).hexdigest() == row['sha256']
            data[row['path']] = value
    assert receipt['sourceCommit'] == SOURCE and receipt['sourceTree'] == TREE
    return receipt, data


def verify_initial():
    receipt, data = read_archive('initial-failure-receipt.json')
    assert receipt['runId'] == 41583486452 and receipt['conclusion'] == 'failure'
    assert receipt['completeNativeShortFlow'] is False and receipt['longFlowStarted'] is False
    for engine in ['chromium', 'webkit']:
        prefix = f'reactor-line-{engine}/lab/verification/reactor-line-load-20261103/results/{engine}/existing-left/smoke/'
        result = json.loads(data[prefix + 'verification.json'])
        flow_receipt = json.loads(data[prefix + 'receipt.json'])
        assert result['sourceCommit'] == SOURCE and result['sourceTree'] == TREE
        assert result['complete'] is False and flow_receipt['complete'] is False
        assert result['failure']['message'] == 'Original reactor seed starts left'
        assert result['lastObservation']['scene']['player'] == {'x': .5, 'y': .78}
        assert result['cycles'][0].get('observedActiveMs') is None
    print('Initial failed attempt preserved: false start-position assumption, not a game crash or long run.')


def verify_complete():
    receipt, data = read_archive('completed-receipt.json')
    assert receipt['testCommit'] == '8c1c6b2cbf4232e75e3da1422646c3238031b722'
    assert receipt['runId'] == 41584352581 and receipt['conclusion'] == 'success'
    summaries = []
    manifests = set()
    for engine in ['chromium', 'webkit']:
        for workload, phase in [('stationary', 'smoke'), ('field-contacts', 'smoke'), ('field-contacts', 'soak')]:
            prefix = f'reactor-line-{engine}/lab/verification/reactor-line-load-20261103/results/{engine}/{workload}/{phase}/'
            flow_receipt = json.loads(data[prefix + 'receipt.json'])
            result = json.loads(data[prefix + 'verification.json'])
            info = json.loads(data[prefix + 'build-info.json'])
            seconds = 60 if phase == 'smoke' else 1800
            assert flow_receipt['complete'] and result['complete']
            assert not flow_receipt['errors'] and flow_receipt['childExit']['code'] == 0
            for value in [flow_receipt, result, info]:
                assert value['sourceCommit'] == SOURCE and value['sourceTree'] == TREE
            assert flow_receipt['sourceVerifierSha256'] == VERIFIER
            assert hashlib.sha256(data[prefix + 'external-driver.mjs']).hexdigest() == flow_receipt['externalDriverSha256']
            assert flow_receipt['originalClockSha256'] == info['diagnosticStopwatch']['stateSha256'] == CLOCK
            assert result['requestedActiveSeconds'] == seconds
            assert result['normalReportVerified'] and result['diagnosticResourceCheckpointVerified']
            for key in ['automaticResume', 'clocksAccelerated', 'physicalDevice', 'whiteScreenFixed', 'memoryComparisonEligible']:
                assert result[key] is False
            assert result['reactorLineCoverage']['workload'] == workload
            assert result['reactorLineCoverage']['gameSourceChanged'] is False
            assert result['reactorLineCoverage']['servedPackageChanged'] is False
            assert len(result['cycles']) == 3
            total_contacts = 0
            max_stalls = max_failures = 0
            for index, row in enumerate(result['cycles']):
                assert row['complete'] and row['observedActiveMs'] >= (seconds if index == 0 else 10) * 1000
                for key in ['pauseFreezeVerified', 'weaponRoundtripVerified', 'normalExitVerified', 'resourceCheckpointActiveVerified']:
                    assert row[key] is True
                workload_row = row['reactorLineWorkload']
                assert workload_row['condition'] == workload
                contacts = workload_row['nativeContacts']
                assert len(contacts) == (7 if workload == 'field-contacts' else 0)
                total_contacts += len(contacts)
                for contact in contacts:
                    assert abs(contact['requestedX'] - contact['actualPlayer']['x']) < .02
                assert abs(workload_row['lastPlayer']['x'] - .5) < .02
                capture = data[prefix + f'cycle-{index}.jsonl']
                candidate_capture = data[f'reactor-line-{engine}/candidate/verification/systematic-stability-20261101/results/{engine}-original/{phase}/{workload}/cycle-{index}.jsonl']
                assert capture == candidate_capture
                points = [json.loads(line) for line in capture.splitlines() if line]
                # The original driver samples after AT LEAST five wall seconds,
                # plus native/host overhead. Do not invent an exact 5 s cadence.
                assert len(points) >= 2
                times = [point['activeMs'] for point in points]
                assert times == sorted(times) and times[0] >= 0
                assert times[-1] <= row['observedActiveMs']
                assert all(abs(point['player']['x'] - .5) < .02 for point in points)
                for point in points:
                    max_stalls = max(max_stalls, point['audio']['audioClockStalls'])
                    max_failures = max(max_failures, len(point['canvas']['failures']))
            manifest = json.dumps(flow_receipt['scriptsAndStyles'], sort_keys=True, separators=(',', ':'))
            manifests.add(hashlib.sha256(manifest.encode()).hexdigest())
            summaries.append({'engine': engine, 'workload': workload, 'phase': phase,
                              'activeMs': [row['observedActiveMs'] for row in result['cycles']],
                              'verifiedNativeContacts': total_contacts,
                              'maxRecordedAudioStalls': max_stalls, 'maxRecordedCanvasFailures': max_failures})
    print(json.dumps({'flows': summaries, 'distinctCIScriptStyleManifests': len(manifests),
                      'physicalDeviceAccepted': False, 'whiteScreenFixed': False}, indent=2))


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--initial-only', action='store_true')
    args = parser.parse_args()
    verify_initial()
    if not args.initial_only:
        verify_complete()
