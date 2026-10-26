import collections
import json
import re
from pathlib import Path
import subprocess

root = Path(__file__).resolve().parents[2]
baseline = 'dbed24977b8a3bc08cf2ed7c8dcae37d570135aa'
modules = []
for path in ['src/pages/GamePage.tsx','src/pages/MissionWeaponShop.tsx','src/pages/Shop.tsx','src/components/GameAccessGate.tsx','src/components/LoadingStripes.tsx','src/pages/WeaponReloadNotice.tsx','src/pages/enemyHealthClearance.ts','src/pages/weaponReloadTiming.ts','src/pages/playerCombat.ts']:
    sources = [subprocess.run(['git','show',baseline+':frontend/'+path],cwd=root,text=True,capture_output=True).stdout, (root / 'frontend' / path).read_text()]
    results = []
    for source in sources:
        run = subprocess.run(['node_modules/.bin/eslint', '--stdin', '--stdin-filename', path, '-f', 'json'], input=source, cwd=root / 'frontend', text=True, capture_output=True)
        assert run.returncode in [0, 1], run.stderr
        results.append(json.loads(run.stdout)[0])
    def signature(message, source):
        # Compare the complete rule explanation and actual highlighted token,
        # rather than neighboring JSX lines changed by the reviewed insertions.
        explanation = message['message'].split('\n\n' + str(root) + '/frontend/')[0]
        lines = source.splitlines(keepends=True)
        start = sum(map(len, lines[:message['line'] - 1])) + message['column'] - 1
        end = sum(map(len, lines[:message.get('endLine', message['line']) - 1])) + message.get('endColumn', message['column']) - 1
        token = source[start:end]
        return message['ruleId'], message['severity'], explanation, message.get('nodeType'), token
    before, after = [collections.Counter(signature(m, source) for m in result['messages']) for result, source in zip(results, sources)]
    added = list((after - before).elements())
    modules.append({'path': path, 'baselineErrors': results[0]['errorCount'], 'currentErrors': results[1]['errorCount'], 'baselineWarnings': results[0]['warningCount'], 'currentWarnings': results[1]['warningCount'], 'addedFindings': added})
    assert not added, modules[-1]
output = root / 'verification/cockpit-indicator-spacing/results/lint-comparison.json'
output.write_text(json.dumps({'baseline': baseline, 'modules': modules}, indent=2) + '\n')
print(json.dumps({'modules': len(modules), 'addedFindings': 0}))
