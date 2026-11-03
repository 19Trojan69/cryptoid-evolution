"""Verify retained synthetic evidence integrity; never grade a phone/game fix."""
from __future__ import annotations

import hashlib
import base64
import importlib.util
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location('native_safari_evidence', ROOT.parent / 'verifyEvidence.py')
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


def verify() -> dict:
    index = json.loads((ROOT / 'capture-index.json').read_text())
    assert index['syntheticCiDataOnly'] is True
    assert index['rawOwnerReportsIncluded'] is False
    assert len({entry['name'] for entry in index['logs']}) == len(index['logs'])
    summary = {'version': 2, 'captureBlobIntegrityVerified': False,
               'acceptedStructuredRecordsIntegrityVerified': False,
               'allOriginalStructuredRecordsVerified': False, 'phoneAcceptance': False,
               'whiteScreenFixed': False, 'newMobileGameCyclesCompleted': 0, 'captures': []}
    for entry in index['logs']:
        assert Path(entry['name']).name == entry['name']
        raw = (ROOT / entry['name']).read_bytes()
        digest = hashlib.sha1(('blob ' + str(len(raw)) + '\0').encode() + raw).hexdigest()
        assert digest == entry['gitBlobSha'], entry['name']
        preserved_malformed = 0
        preserved_compiler_hash_mismatches = 0
        parse_input = raw
        if entry['name'] == 'appium-no-webview.log':
            # Accept only this exact historical byte capture. Its original
            # truncated native line stays in the archive and is disclosed.
            assert digest == '569b9aaac759efb60b4ee9a3c2b56173fe48ed51'
            lines = []
            for line in raw.decode('utf-8-sig').splitlines():
                match = module.MARKER.match(line)
                if match and match[1] == 'NATIVE_LOG_TAIL':
                    try:
                        json.loads(match[2])
                    except json.JSONDecodeError:
                        preserved_malformed += 1
                        continue
                lines.append(line)
            assert preserved_malformed == 1
            parse_input = ('\n'.join(lines) + '\n').encode('utf-8')
        if entry['name'] == 'environment-native-page-no-webview-18.5.log':
            # The delivered compiler record contains an explicitly masked export
            # block. Its sender hash fails. Preserve the entire original job log
            # but exclude only this exact, pinned, disclosed compiler record.
            assert digest == 'f9ea5ec76b905894b0f7a04b8dc8a272d5e08def'
            lines, parts = [], []
            expected = '21ffe03811d9733c4421fcaac32415366222f6afb9dd03ad77315737cf8c21b3'
            for line in raw.decode('utf-8-sig').splitlines():
                match = module.MARKER.match(line)
                if match and match[1] == 'CHUNK':
                    value = json.loads(match[2])
                    if value['kind'] == 'ENVIRONMENT_WDA_BUILD_LOG':
                        assert value['id'] == '1-ENVIRONMENT_WDA_BUILD_LOG'
                        assert value['total'] == 1053 and value['index'] == len(parts)
                        assert value['sha256'] == expected
                        parts.append(value['data'])
                        continue
                lines.append(line)
            assert len(parts) == 1053
            received = ''.join(parts)
            assert hashlib.sha256(received.encode()).hexdigest() == '2dcbe2202ca7c14b68f465097e535db9edbf31f18e2ce4869fe8a82624ab51b9'
            assert hashlib.sha256(received.encode()).hexdigest() != expected
            compiler = json.loads(received)
            assert 'export ***    export RCT_NO_LAUNCH_PACKAGER=1' in compiler['text']
            assert compiler['logTruncated'] is True
            preserved_compiler_hash_mismatches = 1
            parse_input = ('\n'.join(lines) + '\n').encode('utf-8')
        events = module.read_events(parse_input)
        failure_images = [value for kind, value in events if kind == 'ENVIRONMENT_FAILURE_SCREENSHOT']
        for value in failure_images:
            assert value['capturedAfterFailure'] is True and value['gameLoaded'] is False
            assert value['mimeType'] == 'image/jpeg'
            image_bytes = base64.b64decode(value['base64'], validate=True)
            assert len(image_bytes) == value['bytes'] <= 2 ** 21
            assert hashlib.sha256(image_bytes).hexdigest() == value['sha256']
            assert image_bytes.startswith(b'\xff\xd8\xff') and image_bytes.endswith(b'\xff\xd9')
        native = [value for kind, value in events if kind == 'RESULT']
        controls = [value for kind, value in events if kind == 'ENVIRONMENT_RESULT']
        if entry['kind'].startswith('native-game-flow-failed-before-cycle'):
            assert len(native) == 1 and native[0]['complete'] is False
            assert native[0]['cycles'] == []
            assert native[0]['sourceCommit'] == 'ac98e95166b0e2013186257904da46323840dab5'
            assert native[0]['sourceTree'] == '99092ec24e843fb1e419dc382bc2523a4edc0b42'
            assert native[0]['sourceAndPackageUnchangedVerified'] is True
            assert native[0]['whiteScreenFixed'] is False
        elif entry['kind'] == 'dependency-discovery-failure':
            assert native == [] and controls == []
            assert 'ERR_PACKAGE_PATH_NOT_EXPORTED' in raw.decode('utf-8-sig')
            assert 'appium-webdriveragent/package.json' in raw.decode('utf-8-sig')
        elif entry['kind'].startswith('environment-'):
            assert len(controls) == 1
            value = controls[0]
            assert value['complete'] is entry.get('expectedComplete', False)
            assert value['gameLoaded'] is False and value['gameFilesEdited'] is False
            assert value['physicalDevice'] is False and value['whiteScreenFixed'] is False
            if 'expectedNativeSession' in entry:
                assert value.get('nativeSessionCreated', False) is entry['expectedNativeSession']
            if 'expectedWdaBuild' in entry:
                assert value.get('wdaBuildCompleted', False) is entry['expectedWdaBuild']
            if 'expectedFailureScreenshot' in entry:
                assert bool(failure_images) is entry['expectedFailureScreenshot']
            if value['complete']:
                assert value['trustedNativeProbeTapVerified'] is True
                assert value['nativeTapAttempted'] is True
        else:
            assert entry['kind'] in ['pre-build-failure', 'volume-preflight-failure']
            assert native == [] and controls == []
        summary['captures'].append({'name': entry['name'], 'bytes': len(raw),
            'gitBlobSha': digest, 'sha256': hashlib.sha256(raw).hexdigest(),
            'parsedRecords': len(events), 'knownMalformedNativeRecordsPreserved': preserved_malformed,
            'knownCompilerRecordsWithSenderHashMismatchPreserved': preserved_compiler_hash_mismatches,
            'nativeComplete': native[0]['complete'] if native else None,
            'environmentComplete': controls[0]['complete'] if controls else None})
    scope = json.loads((ROOT / 'source-scope.json').read_text())
    expected = {'frontend': '890df8a38e13ef1fe315a5c0eb109c1d72b80aab',
                'backend': '6e93bfbac9e6cc70a1edfb8bd55d737f612ba261',
                'api': 'ccac7cd576a079771d7d7fe4f0085492ebbe6813',
                'assets': 'a9860b12db58a96dafde818d9a58a6ea0e03c5e5',
                'private-preview': 'b733d4dc70b4ac407391720eab131dbaf1d60e37'}
    assert scope['passed'] is True
    assert {row['path']: row['sha'] for row in scope['originalRuntimeTrees']} == expected
    rejected = json.loads((ROOT / 'rejected-workflow.json').read_text())
    assert rejected['jobs'] == [] and rejected['conclusion'] == 'failure'
    lint = json.loads((ROOT / 'workflow-lint.json').read_text())
    assert lint['oldWorkflowRejected'] is True and lint['currentWorkflowPassed'] is True
    comparison = json.loads((ROOT / 'mac-linux-scripts-comparison.json').read_text())
    assert comparison['macBuildJsCssFiles'] == 11 and len(comparison['earlierLinuxComparisons']) == 6
    assert all(row['sameScriptsAndStyles'] is True for row in comparison['earlierLinuxComparisons'])
    summary['captureBlobIntegrityVerified'] = True
    summary['acceptedStructuredRecordsIntegrityVerified'] = True
    summary['allOriginalStructuredRecordsVerified'] = all(
        not row['knownMalformedNativeRecordsPreserved']
        and not row['knownCompilerRecordsWithSenderHashMismatchPreserved']
        for row in summary['captures'])
    return summary


if __name__ == '__main__':
    print(json.dumps(verify(), ensure_ascii=False, indent=2))
