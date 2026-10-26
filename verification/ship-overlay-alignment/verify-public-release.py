import concurrent.futures
import hashlib
import json
from pathlib import Path
import re
import time
import urllib.error
import urllib.request
from urllib.parse import urljoin

COMMIT = 'bd23bd4babe0a2a14ee7d8ac1ad7f749d843abd5'
OUTPUT = Path(__file__).resolve().parent / 'public-release.json'

def get(url):
    start = time.monotonic()
    try:
        with urllib.request.urlopen(urllib.request.Request(url, headers={'Cache-Control': 'no-cache'}), timeout=40) as response:
            return response.status, response.read(), dict(response.headers), response.geturl(), round((time.monotonic() - start) * 1000)
    except urllib.error.HTTPError as error:
        return error.code, error.read(), dict(error.headers), error.geturl(), round((time.monotonic() - start) * 1000)

def check(host, network):
    root = 'https://' + host + '/'
    result = {'host': host, 'sourceCommit': COMMIT, 'passed': False, 'bundles': []}
    try:
        status, body, _, final, milliseconds = get(root)
        result.update(url=final, httpStatus=status, htmlSha256=hashlib.sha256(body).hexdigest(), htmlBytes=len(body), htmlMilliseconds=milliseconds)
        html = body.decode()
        entry = next(urljoin(root, path) for path in re.findall(r'<script[^>]+src="([^"]+)"', html) if '/assets/' in path and path.endswith('.js'))
        assert status == 200
        entry_response = get(entry)
        entry_code = entry_response[1]
        # The deployed app lazy-loads GamePage. Its build identity and queue code
        # must be checked in that real chunk, not assumed to live in the shell.
        references = re.findall(r'''["']([^"'\s]+\.js)["']''', entry_response[1].decode())
        games = sorted({urljoin(entry, path) for path in references if path.startswith('./GamePage-')})
        assert len(games) == 1, games
        for kind, url, response in [('entry', entry, entry_response), ('game', games[0], get(games[0]))]:
            code, js, _, _, elapsed = response
            assert code == 200
            row = {'kind': kind, 'url': url, 'sha256': hashlib.sha256(js).hexdigest(), 'bytes': len(js), 'httpStatus': code, 'milliseconds': elapsed,
                   'hasExpectedSourceCommit': COMMIT.encode() in js, 'hasBoundedRewardRetry': b'retryInvalidSave' in js}
            result['bundles'].append(row)
        imports = sorted(set(re.findall(r'''from\s*["'](\./[^"']+\.js)["']''', js.decode())))
        imports = [urljoin(games[0], path) for path in imports if urljoin(games[0], path) != entry]
        with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
            dependencies = list(pool.map(get, imports))
        for url, response in zip(imports, dependencies):
            code, dependency, _, _, elapsed = response
            assert code == 200
            result['bundles'].append({'kind': 'game-dependency', 'url': url, 'sha256': hashlib.sha256(dependency).hexdigest(), 'bytes': len(dependency), 'httpStatus': code,
                                      'milliseconds': elapsed, 'hasExpectedSourceCommit': COMMIT.encode() in dependency, 'hasBoundedRewardRetry': b'retryInvalidSave' in dependency})
        admins = sorted({urljoin(entry, path) for path in references if path.startswith('./AdminPage-')})
        assert len(admins) == 1
        admin_status, admin_js, _, _, admin_elapsed = get(admins[0])
        assert admin_status == 200
        result['bundles'].append({'kind':'owner-diagnostic-export', 'url':admins[0], 'sha256':hashlib.sha256(admin_js).hexdigest(), 'bytes':len(admin_js), 'httpStatus':admin_status, 'milliseconds':admin_elapsed})
        auth_code = b'\n'.join([entry_code, js, admin_js] + [response[1] for response in dependencies])
        result['authLifecycleFeatures'] = {'generationInitialised': b'generation:0' in auth_code, 'generationRetired': b'.generation++' in auth_code, 'generationChecked': b'.generation===' in auth_code, 'localFixtureAbsent': b'__signinResponses' not in auth_code and b'__loginMounted' not in auth_code}
        assert all(result['authLifecycleFeatures'].values())
        result['diagnosticFeatures'] = {name: token in auth_code for name, token in [('nestedRouteObservation', b'view-state'), ('routeChanges', b'route-change'), ('quarterSecondTail', b'frameIntervalMs:250'), ('frameHistory128', b'frameSlots:128'), ('callbackProgress', b'sceneCommittedAt'), ('version2Export', b'supplementaryEvidenceVersion:2'), ('explicitRecoveryBoundary', b'unobservedBeforeNextDocumentMs'), ('normalDepartureDistinct', b'replacement-with-lifecycle-signal')]}
        result['diagnosticFeatures']['localFixtureAbsent'] = b'__crashFixture' not in auth_code
        assert all(result['diagnosticFeatures'].values())
        assert result['bundles'][1]['hasExpectedSourceCommit']
        game_source = get(games[0])[1]
        result['completionFeatures'] = {name: token in game_source for name,token in [('levelEndMarker',b'level-end'),('unifiedCompletion',b'level-completion'),('checkpointConfirmation',b'Level checkpoint not confirmed'),('rewardConfirmation',b'Level rewards not confirmed'),('gameRouteLock',b'game-viewport-locked')]}
        assert all(result['completionFeatures'].values())
        result['completionRecoveryFeatures'] = {name: token in auth_code for name, token in [('verifiedDurableReward',b'hasDurableReward'),('explicitLocalHome',b'Return home with local backup'),('retainedDataNotice',b'Server save not confirmed. Pending data stays on this device'),('sessionFailureFeedback',b'The active run needs to be confirmed again.'),('checkpointFailureFeedback',b'The next level or its rewards are not confirmed.'),('rejectedSaveFeedback',b'The server rejected this save.'),('effectCleanupFeedback',b'Effects are still being released.') ]}
        result['completionRecoveryFeatures']['recoverBeforeDrainAvailable'] = b'.recover()' in game_source and b'.drain()' in game_source
        assert all(result['completionRecoveryFeatures'].values())
        result['completionAudioFeatures'] = {'pendingActivationWait': bool(re.search(rb'if\([a-zA-Z_$][a-zA-Z0-9_$]*&&![a-zA-Z_$][a-zA-Z0-9_$]*\.current&&[a-zA-Z_$][a-zA-Z0-9_$]*\.current\)\{[a-zA-Z_$][a-zA-Z0-9_$]*\(!0\);return\}const', game_source)), 'obsoleteBusyFailureAbsent': b'Activation confirmation still in progress' not in game_source, 'renderedPausedGraphCycle': bool(re.search(rb'currentTime>0&&[a-zA-Z_$][a-zA-Z0-9_$]*\.state!==\"closed\"', auth_code)), 'directZeroClockPath': b'currentTime===0' in auth_code}
        assert all(result['completionAudioFeatures'].values())
        result['controlCenterFeatures'] = {'fourTileComponent': b'control-center-tile' in auth_code, 'controlCenterHeading': b'Control Center' in auth_code, 'standaloneFullscreenRemoved': b'game-fullscreen-control' not in game_source, 'phoneFullscreenAction': b'phone-fullscreen-setting' in auth_code, 'expectedTree': b'abf375795cc76104c4ff5d201d353214b93cc50e' in game_source}
        assert all(result['controlCenterFeatures'].values())
        css_paths = re.findall(r'<link[^>]+href="([^"]+\.css)"', html)
        css_paths = sorted(set(css_paths + re.findall(r'''["'](assets/[^"']+\.css)["']''', entry_code.decode())))
        assert css_paths
        with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
            css_responses = list(pool.map(get, [urljoin(root, path) for path in css_paths]))
        assert all(row[0] == 200 for row in css_responses)
        styles = b'\n'.join(row[1] for row in css_responses)
        result['shipOverlayFeatures'] = {name: token in styles for name,token in [('halfSmallBar',b'width:34%;height:3px'),('halfLargeBar',b'width:39%;height:4px'),('normalShipsOnly',b'.asteroid:not(.sector-boss)'),('visibleHullTop',b'--hull-top'),('commonLivePlume',b'.game-field .ship-thruster'),('bossBarSizeRetained',b'width:96%;height:12px'),('immediateFooter',b'completion-arrive .22s ease-out backwards')]}
        result['shipOverlayFeatures']['stageSpecificNozzles'] = b'ship-thruster' in auth_code
        assert all(result['shipOverlayFeatures'].values())
        result['entranceFeatures'] = {name: token in styles for name,token in [('horizon',b'completion-horizon'),('halo',b'completion-halo'),('stagedArrival',b'completion-arrive'),('cockpitWindows',b'cockpit-window-arrive'),('reducedMotion',b'prefers-reduced-motion:reduce')]}
        assert all(result['entranceFeatures'].values())
        result['styles'] = {'sha256': hashlib.sha256(styles).hexdigest(), 'bytes': len(styles), 'controlCenter': b'.control-center-tile' in styles, 'tabletFullscreenHidden': b'.control-center .phone-fullscreen-setting{display:none}' in styles}
        assert result['styles']['controlCenter'] and result['styles']['tabletFullscreenHidden']
        result['localTestHooksAbsent'] = b'__levelFlow' not in game_source and b'__flightTest' not in game_source
        assert result['localTestHooksAbsent']
        assert any(row['hasBoundedRewardRetry'] for row in result['bundles'])
        health = get(root + 'api/')
        health_data = json.loads(health[1])
        result['apiHealth'] = {'httpStatus': health[0], 'message': health_data.get('message'), 'backend': health[2].get('x-cryptoid-backend'), 'milliseconds': health[4]}
        assert health[0] == 200 and health_data.get('message') == 'Hello, World!'
        leaders = get(root + 'api/leaderboard/top?rules=2')
        data = json.loads(leaders[1])
        result['publicLeaderboard'] = {'httpStatus': leaders[0], 'network': data.get('network'), 'milliseconds': leaders[4]}
        assert leaders[0] == 200 and data.get('network') == network
        admin = get(root + 'api/admin/players')
        result['anonymousAdminStatus'] = admin[0]
        assert admin[0] in [401, 403]
        report = get(root + 'stability-report.html')
        result['publicDiagnosticRedirect'] = report[3]
        assert report[0] == 200 and report[3] == root
        result['passed'] = True
    except Exception as error:
        result['error'] = repr(error)
    return result

with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
    sites = list(pool.map(lambda item: check(*item), [('cryptoid-evolution-testnet.vercel.app', 'testnet'), ('cryptoid-evolution.vercel.app', 'mainnet')]))
same = len(sites[0]['bundles']) == len(sites[1]['bundles']) >= 3 and all(a['sha256'] == b['sha256'] for a, b in zip(sites[0]['bundles'], sites[1]['bundles']))
result = {'expectedCommit': COMMIT, 'sameApplicationBundles': same, 'sameStyles': sites[0].get('styles',{}).get('sha256') == sites[1].get('styles',{}).get('sha256') and 'styles' in sites[0], 'sites': sites, 'readOnlyChecks': True, 'realPurchases': False, 'realGameStart': False,
          'limitations': 'Read-only delivered code and API checks, not authenticated Pi gameplay, payment validation, physical-device or White Screen acceptance.'}
OUTPUT.write_text(json.dumps(result, indent=2) + '\n')
print(json.dumps(result))
raise SystemExit(0 if same and result['sameStyles'] and all(site['passed'] for site in sites) else 1)
