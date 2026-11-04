import assert from 'node:assert/strict';
import { spawn, execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync, unlinkSync, copyFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { gzipSync } from 'node:zlib';
import { createRequire } from 'node:module';
import { createEvidenceWriter } from '../ios-safari-native-20261103/evidenceOutput.mjs';
import { HELPER, digest } from './transform.mjs';

const root = resolve(new URL('../..', import.meta.url).pathname);
const [kind, engine, condition, replicaText] = process.argv.slice(2), replica = Number(replicaText);
assert.ok(['short', 'memory'].includes(kind)); assert.ok(['chromium', 'webkit'].includes(engine));
assert.ok(['control', 'leaf'].includes(condition)); assert.ok([1, 2].includes(replica));
if (kind === 'memory') assert.equal(engine, 'chromium');
const output = resolve(root, 'verification/player-muzzle-local-20261104/results', `${engine}-${condition}-r${replica}-${kind}`);
mkdirSync(output, { recursive: true });
const info = JSON.parse(readFileSync(root + '/verification/boss2-forensics-20261028/results/device-preview/site/device-preview-info.json', 'utf8'));
assert.equal(info.playerMuzzleLocalCandidate.condition, condition);
assert.equal(info.mobileHudBackdropCandidate.value, 'none');
assert.equal(info.qaLocalBossStyle.condition, 'leaves');
copyFileSync(root + '/verification/boss2-forensics-20261028/results/device-preview/site/device-preview-info.json', output + '/build-info.json');

// Type-check the entire new helper with real DOM types. The full unchanged
// controller is then compiled by the ordinary Vite guest build.
const require = createRequire(root + '/frontend/package.json'), ts = require('typescript');
const helperPath = output + '/new-helper.ts'; writeFileSync(helperPath, HELPER);
try {
  const program = ts.createProgram([helperPath], { strict: true, noEmit: true, skipLibCheck: true,
    types: [], target: ts.ScriptTarget.ES2022, lib: ['lib.es2022.d.ts', 'lib.dom.d.ts'] });
  const errors = ts.getPreEmitDiagnostics(program).filter(d => d.category === ts.DiagnosticCategory.Error);
  assert.deepEqual(errors.map(d => ts.flattenDiagnosticMessageText(d.messageText, '\n')), []);
} finally { unlinkSync(helperPath); }

const path = root + (kind === 'short' ? '/verification/systematic-stability-20261101/verifyBrowserSoak.mjs'
  : '/verification/memory-retention-attribution-20261101/profileLifetime.mjs');
const original = readFileSync(path, 'utf8'), replacements = [];
let code = original;
function change(before, after) {
  assert.equal(code.split(before).length, 2, before); code = code.replace(before, after); replacements.push([before, after]);
}
change(kind === 'short' ? 'const output = clockProbe ?' : 'const output = localStyles',
  kind === 'short' ? 'const legacyOutput = clockProbe ?' : 'const legacyOutput = localStyles');
change('mkdirSync(output, { recursive: true });',
  `const output = ${JSON.stringify(output)};\nmkdirSync(output, { recursive: true });`);
change('assert.equal(info.sourceCommit, result.sourceCommit);',
  `assert.equal(info.playerMuzzleLocalCandidate.condition, ${JSON.stringify(condition)});
  result.playerMuzzleComparison = info.playerMuzzleLocalCandidate;
  result.playerMuzzleReplica = ${replica};
  assert.equal(info.sourceCommit, result.sourceCommit);`);
if (kind === 'short') {
  change('comparedConditionsAreVisuallyDifferent: true,', 'comparedConditionsAreVisuallyDifferent: false,');
  change('const started = Date.now(); let previous = first,',
    `await page.waitForFunction(condition => {
      const host = document.querySelector('.player-ship'), leaf = host?.querySelector('.player-muzzle-flash');
      if (!host || !leaf) return false;
      const value = condition === 'leaf' ? leaf.style.getPropertyValue('--muzzle-light') : host.style.getPropertyValue('--muzzle-light');
      return Number(value) > .05 && (condition !== 'leaf' || host.style.getPropertyValue('--muzzle-light') === '');
    }, ${JSON.stringify(condition)}, { timeout: 15000 });
    row.actualCompiledMuzzlePathVerified = true;
    const started = Date.now(); let previous = first,`);
  change('row.pauseFreezeVerified = true;',
    `row.pauseFreezeVerified = true;
    if (cycle === 0) row.playerMuzzleFidelity = await verifyPlayerMuzzleFidelity({ page,
      guard: async () => requireInactiveCheckpoint(await observe(), 'paused') });`);
  code = "import { verifyPlayerMuzzleFidelity } from '../player-muzzle-local-20261104/fidelity.mjs';\n" + code;
}
let restored = code;
if (kind === 'short') restored = restored.slice("import { verifyPlayerMuzzleFidelity } from '../player-muzzle-local-20261104/fidelity.mjs';\n".length);
for (const [before, after] of [...replacements].reverse()) restored = restored.replace(after, before);
assert.equal(restored, original, 'Original collectors and all active/inactive assertions preserved exactly');
const driver = path.replace(/\.mjs$/, `.muzzle-${condition}-${process.pid}.mjs`); writeFileSync(driver, code);
const env = Object.fromEntries(Object.entries(process.env).filter(([k]) => !k.startsWith('CRYPTOID_')));
Object.assign(env, kind === 'short' ? { CRYPTOID_SOAK_ENGINE: engine, CRYPTOID_SOAK_CONDITION: 'original',
  CRYPTOID_SOAK_SECONDS: '60', CRYPTOID_SOAK_RUN: 'smoke' } : {
  CRYPTOID_SOAK_CONDITION: 'original', CRYPTOID_LIFETIME_ATTRIBUTION: '1', CRYPTOID_ATTRIBUTION_SECONDS: '1200',
  CRYPTOID_LOCAL_STYLE_SCOPE: 'leaves', CRYPTOID_LOCAL_STYLE_REPLICA: String(replica), CRYPTOID_LOCAL_STYLE_FIDELITY: '0',
  CRYPTOID_INACTIVE_NATIVE_TRACE: '1' });
let exit;
try {
  const child = spawn(process.execPath, [driver], { cwd: root, env, stdio: 'inherit' });
  exit = await new Promise(done => { child.once('error', error => done({ code: null, error: error.message })); child.once('exit', (code, signal) => done({ code, signal })); });
} finally { unlinkSync(driver); }
const resultName = kind === 'short' ? 'verification.json' : 'attribution.json';
const capture = JSON.parse(readFileSync(output + '/' + resultName, 'utf8'));
const receipt = { version: 1, kind, engine, condition, replica, childExit: exit,
  complete: exit?.code === 0 && capture.complete === true, sourceCollectorSha256: digest(original),
  adaptedCollectorSha256: digest(code), originalCollectorRestoredExactly: true,
  sourceGameFilesEdited: false, activeNativeWrappersAdded: false, extraGameTimers: false,
  physicalDevice: false, whiteScreenFixed: false };
writeFileSync(output + '/receipt.json', JSON.stringify(receipt, null, 2) + '\n');
execFileSync(process.execPath, ['verification/direct-boss-style-device-20261102/verifyScope.mjs'], { cwd: root, stdio: 'inherit' });
const files = [];
for (const name of ['receipt.json', 'build-info.json', resultName, ...(kind === 'memory' ? ['native-memory-infra.json.gz'] : [])]) {
  try { const bytes = readFileSync(output + '/' + name); files.push({ name, bytes: bytes.length, sha256: digest(bytes), gzipBase64: gzipSync(bytes).toString('base64') }); }
  catch (error) { if (receipt.complete) throw error; }
}
await createEvidenceWriter()('PLAYER_MUZZLE_CAPTURE', { kind, engine, condition, replica, complete: receipt.complete, files,
  syntheticGuestDataOnly: true, physicalDevice: false, whiteScreenFixed: false });
assert.equal(receipt.complete, true, 'Failed runs remain failed; no automatic retry or Resume');
