import concurrent.futures
import hashlib
import json
from pathlib import Path
import re
import time
import urllib.error
import urllib.request
from urllib.parse import urljoin

COMMIT = 'd0a0b81e175bbf955dfe06d9e693b08566aabfbb'
OUTPUT = Path('/workspace/scratch/f0c1be48d22d/release-live-verification.json')

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
        assert result['bundles'][1]['hasExpectedSourceCommit']
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
result = {'expectedCommit': COMMIT, 'sameApplicationBundles': same, 'sites': sites, 'readOnlyChecks': True, 'realPurchases': False, 'realGameStart': False,
          'earlierVerifierIssue': 'The shell lazy-loads GamePage, whose queue helper is in its statically imported shared powerUps chunk. The verifier now checks those real dependencies; no game or deployment change was made.'}
OUTPUT.write_text(json.dumps(result, indent=2) + '\n')
print(json.dumps(result))
raise SystemExit(0 if same and all(site['passed'] for site in sites) else 1)
