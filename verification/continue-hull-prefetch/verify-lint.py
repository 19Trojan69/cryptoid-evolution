import collections
import json
import re
from pathlib import Path
import subprocess

root = Path(__file__).resolve().parents[2]
baseline = 'bd23bd4babe0a2a14ee7d8ac1ad7f749d843abd5'
modules = []
for path in ['src/pages/paintedShip.ts', 'src/pages/usePreparedGameHulls.ts', 'src/pages/bossArtwork.ts']:
    sources = [subprocess.check_output(['git', 'show', baseline + ':frontend/' + path], cwd=root, text=True), (root / 'frontend' / path).read_text()]
    results = []
    for source in sources:
        run = subprocess.run(['node_modules/.bin/eslint', '--stdin', '--stdin-filename', path, '-f', 'json'], input=source, cwd=root / 'frontend', text=True, capture_output=True)
        assert run.returncode in [0, 1], run.stderr
        results.append(json.loads(run.stdout)[0])
    def signature(message):
        # Preserve rule, message and complete source excerpt; normalize only
        # embedded locations/line labels shifted by the reviewed insertion.
        detail = re.sub(re.escape(str(root)) + r'/frontend/[^\n]+:\d+:\d+', '<source-location>', message['message'])
        detail = re.sub(r'(?m)^([ >]*)\d+( \|)', r'\1#\2', detail)
        return message['ruleId'], message['severity'], detail, message.get('nodeType')
    before, after = [collections.Counter(signature(m) for m in result['messages']) for result in results]
    added = list((after - before).elements())
    modules.append({'path': path, 'baselineErrors': results[0]['errorCount'], 'currentErrors': results[1]['errorCount'], 'baselineWarnings': results[0]['warningCount'], 'currentWarnings': results[1]['warningCount'], 'addedFindings': added})
    assert not added, modules[-1]
output = root / 'verification/continue-hull-prefetch/results/lint-comparison.json'
output.write_text(json.dumps({'baseline': baseline, 'modules': modules}, indent=2) + '\n')
print(json.dumps({'modules': len(modules), 'addedFindings': 0}))
