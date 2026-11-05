import assert from 'node:assert/strict';
import {readFileSync, writeFileSync, unlinkSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {gitBlob} from './transform.mjs';

const root = resolve(new URL('../..', import.meta.url).pathname);
const engine = process.argv[2];
assert.ok(['chromium', 'webkit'].includes(engine));
const path = root + '/verification/critical-failure-journal-20261104/run.mjs';
const original = readFileSync(path, 'utf8');
assert.equal(gitBlob(original), '746ebc727c646c9e405872f3f6a44ca66fe86b6a');
let code = original;
const pairs = [];
function change(before, after) {
  assert.equal(code.split(before).length, 2, before);
  code = code.replace(before, after); pairs.push([before, after]);
}
change("const folder = root+'/verification/critical-failure-journal-20261104';",
  "const folder = root+'/verification/player-muzzle-webkit-device-20261105';");
const extra = `
change("import assert from 'node:assert/strict';", "import assert from 'node:assert/strict';\\nimport {verifyMuzzleScope} from '../player-muzzle-webkit-device-20261105/fidelity.mjs';");
change('row.pauseFreezeVerified = true;', \`row.pauseFreezeVerified = true;
    if (cycle === 0) row.muzzleWebKitFidelity = await verifyMuzzleScope({page,
      guard: async () => requireInactiveCheckpoint(await observe(), 'paused')});\`);
change('  result.criticalReportVerified=true;', \`  assert.equal(info.playerMuzzleLocalCandidate.condition, 'leaf');
  assert.ok(info.muzzleWebKitScopeCandidate);
  assert.equal(info.criticalFailureJournal.originalClockRetained, true);
  result.muzzleWebKitScopeCandidate=info.muzzleWebKitScopeCandidate;
  result.criticalReportVerified=true;\`);
`;
change('let restored = code;', extra + '\nlet restored = code;');
let restored = code;
for (const [before, after] of [...pairs].reverse()) restored = restored.replace(after, before);
assert.equal(restored, original, 'Existing journal integration runner restores exactly');
const temporary = path.replace(/\.mjs$/, `.muzzle-webkit-${process.pid}.mjs`);
try {
  writeFileSync(temporary, code);
  await import(pathToFileURL(temporary).href);
} finally {
  unlinkSync(temporary);
  assert.equal(readFileSync(path, 'utf8'), original);
}
