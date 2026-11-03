import assert from 'node:assert/strict';
import { spawn, execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { mkdirSync, readFileSync, readdirSync, writeFileSync, copyFileSync } from 'node:fs';
import { resolve, relative } from 'node:path';
import { pathToFileURL } from 'node:url';
import { readSourceState } from '../mobile-30m-source-proof-20261102/sourceState.mjs';
import { gzipSync } from 'node:zlib';
import { createEvidenceWriter } from '../ios-safari-native-20261103/evidenceOutput.mjs';
import { adaptVerifier, VERIFIER_SHA256 } from './adaptVerifier.mjs';

const SOURCE = 'ac98e95166b0e2013186257904da46323840dab5';
const TREE = '99092ec24e843fb1e419dc382bc2523a4edc0b42';
const CLOCK = '5e5845d5e5beef85ca5dadac597b8d751e81f931374b942b22fdedc7d83bbb5c';
const [candidateArg, outputArg, engine, workload, phase] = process.argv.slice(2);
assert.ok(candidateArg && outputArg);
assert.ok(['chromium', 'webkit'].includes(engine));
assert.ok(['stationary', 'field-contacts'].includes(workload));
assert.ok(['smoke', 'soak'].includes(phase));
if (phase === 'soak') assert.equal(workload, 'field-contacts', 'Only the contact-then-hold workload gets a new long run');
const candidate = resolve(candidateArg), output = resolve(outputArg, engine, workload, phase);
mkdirSync(output, { recursive: true });
const seconds = phase === 'smoke' ? 60 : 1800;
const git = ref => execFileSync('git', ['rev-parse', ref], { cwd: candidate, encoding: 'utf8' }).trim();
assert.equal(git('HEAD'), SOURCE); assert.equal(git('HEAD^{tree}'), TREE);
const locks = readSourceState(candidate);
for (const file of ['verifyScope.mjs', '../device-resource-checkpoint-20261102/verifyPackage.mjs'])
  execFileSync(process.execPath, ['verification/direct-boss-style-device-20261102/' + file], { cwd: candidate, stdio: 'inherit' });
const site = resolve(candidate, 'verification/boss2-forensics-20261028/results/device-preview/site');
const info = JSON.parse(readFileSync(resolve(site, 'device-preview-info.json'), 'utf8'));
assert.equal(info.sourceCommit, SOURCE); assert.equal(info.sourceTree, TREE);
assert.equal(info.diagnosticStopwatch.stateSha256, CLOCK);
assert.equal(info.directStyleDeviceCandidate.activeFrameProbeIncluded, false);
assert.equal(info.directStyleDeviceCandidate.activeClockTraceIncluded, false);
const digest = file => createHash('sha256').update(readFileSync(file)).digest('hex');
const scripts = [];
function collect(dir) { for (const entry of readdirSync(dir, { withFileTypes: true })) {
  const path = resolve(dir, entry.name);
  if (entry.isDirectory()) collect(path);
  else if (/\.(js|css)$/.test(entry.name)) scripts.push({ path: relative(site, path), sha256: digest(path) });
} }
collect(site); scripts.sort((a, b) => a.path.localeCompare(b.path));
const appRequire = createRequire(resolve(candidate, 'frontend/package.json'));
const pwRequire = createRequire(resolve(candidate, 'verification/boss2-forensics-20261028/package.json'));
const packages = Object.fromEntries(['react', 'react-dom', 'react-router-dom', 'vite', 'typescript']
  .map(name => [name, appRequire(name + '/package.json').version]));
packages.playwright = pwRequire('playwright/package.json').version;
const verifierPath = resolve(candidate, 'verification/systematic-stability-20261101/verifyBrowserSoak.mjs');
const adapted = adaptVerifier(readFileSync(verifierPath, 'utf8'), pathToFileURL(verifierPath).href, workload);
const adaptedPath = resolve(output, 'external-driver.mjs'); writeFileSync(adaptedPath, adapted);
const receipt = { version: 1, complete: false, sourceCommit: SOURCE, sourceTree: TREE,
  engine, workload, phase, requestedActiveSeconds: seconds, startedAt: new Date().toISOString(),
  sourceVerifierSha256: VERIFIER_SHA256, externalDriverSha256: digest(adaptedPath),
  originalClockSha256: CLOCK, installedPackages: packages,
  lockSha256: digest(resolve(candidate, 'frontend/yarn.lock')), generatedLockfiles: locks,
  scriptsAndStyles: scripts, viewport: { width: 430, height: 825 }, deviceScaleFactor: 3,
  ordinaryNativeFieldContacts: workload === 'field-contacts', directGameStateWrites: false,
  runtimeSourceChanged: false, servedPackageChanged: false, renderedHudStyleCandidate: true, automaticResume: false,
  clocksAccelerated: false, physicalDevice: false, whiteScreenFixed: false,
  memoryComparisonEligible: false, errors: [],
  limits: ['The one reviewed mobile HUD backdrop rule is injected once per document before game entry; this is a treated candidate.',
    'Same frozen application; external driver adds seven ordinary single-finger field contacts per contact cycle.',
    'This is a synthetic contact sequence, not a replay of private phone coordinates, continuous dragging or multitouch.',
    'Placement setup adds test-inspector reads; the existing long-loop read cadence stays unchanged.',
    'Unseeded Linux native engines and synthetic viewport are not a physical iOS/Android test.',
    'Linux PSS and app counters do not identify native phone/GPU termination causes.',
    'A green run remains functional coverage, never a mobile White Screen fix.'] };
writeFileSync(resolve(output, 'build-info.json'), JSON.stringify(info, null, 2) + '\n');
const env = Object.fromEntries(Object.entries(process.env).filter(([key]) => !key.startsWith('CRYPTOID_')));
Object.assign(env, { CRYPTOID_SOAK_ENGINE: engine, CRYPTOID_SOAK_CONDITION: 'original',
  CRYPTOID_SOAK_SECONDS: String(seconds), CRYPTOID_SOAK_RUN: phase });
const child = spawn(process.execPath, [adaptedPath], { cwd: candidate, env, stdio: 'inherit' });
receipt.childExit = await new Promise(done => {
  child.once('error', error => done({ code: null, error: String(error.message) }));
  child.once('exit', (code, signal) => done({ code, signal }));
});
try {
  const results = resolve(candidate, 'verification/systematic-stability-20261101/results', engine + '-original', phase, workload);
  const resultPath = resolve(results, 'verification.json');
  const result = JSON.parse(readFileSync(resultPath, 'utf8'));
  copyFileSync(resultPath, resolve(output, 'verification.json'));
  for (let cycle = 0; cycle < 3; cycle++) {
    try { copyFileSync(resolve(results, `cycle-${cycle}.jsonl`), resolve(output, `cycle-${cycle}.jsonl`)); }
    catch { if (result.complete) throw Error('Completed flow is missing an original cycle capture'); }
  }
  receipt.flow = { complete: result.complete, failure: result.failure ?? null,
    normalReportVerified: result.normalReportVerified === true,
    cycles: result.cycles.map(row => ({ cycle: row.cycle, complete: row.complete,
      observedActiveMs: row.observedActiveMs, workload: row.reactorLineWorkload })) };
  assert.equal(receipt.childExit.code, 0); assert.equal(result.complete, true);
  assert.equal(result.sourceCommit, SOURCE); assert.equal(result.sourceTree, TREE);
  assert.equal(result.requestedActiveSeconds, seconds); assert.equal(result.cycles.length, 3);
  assert.equal(result.normalReportVerified, true); assert.equal(result.diagnosticResourceCheckpointVerified, true);
  assert.equal(result.automaticResume, false); assert.equal(result.clocksAccelerated, false);
  for (const [i, row] of result.cycles.entries()) {
    assert.equal(row.complete, true); assert.ok(row.observedActiveMs >= (i ? 10 : seconds) * 1000);
    for (const key of ['pauseFreezeVerified', 'weaponRoundtripVerified', 'normalExitVerified']) assert.equal(row[key], true);
    assert.equal(row.targetedHudCandidate?.backdropFilter, 'none');
    assert.equal(row.reactorLineWorkload.condition, workload);
    assert.equal(row.reactorLineWorkload.nativeContacts.length, workload === 'field-contacts' ? 7 : 0);
    if (workload === 'field-contacts') for (const contact of row.reactorLineWorkload.nativeContacts)
      assert.ok(Math.abs(contact.requestedX - contact.actualPlayer.x) < .02);
  }
  execFileSync(process.execPath, ['verification/direct-boss-style-device-20261102/verifyScope.mjs'], { cwd: candidate, stdio: 'inherit' });
  assert.deepEqual(readSourceState(candidate), locks, 'Frozen source and both generated lockfiles remain identical');
  for (const row of scripts) assert.equal(digest(resolve(site, row.path)), row.sha256, row.path);
  receipt.complete = true;
} catch (error) { receipt.errors.push(String(error.message).slice(0, 4096)); }
receipt.finishedAt = new Date().toISOString();
writeFileSync(resolve(output, 'receipt.json'), JSON.stringify(receipt, null, 2) + '\n');
console.log('CRYPTOID_REACTOR_LINE_RESULT ' + JSON.stringify({ engine, workload, phase,
  complete: receipt.complete, sourceCommit: SOURCE,
  activeMs: receipt.flow?.cycles.map(row => row.observedActiveMs), errors: receipt.errors }));
const files=[];
for(const name of ['receipt.json','verification.json','cycle-0.jsonl','cycle-1.jsonl','cycle-2.jsonl']){
 try{const bytes=readFileSync(resolve(output,name));files.push({name,bytes:bytes.length,
   sha256:createHash('sha256').update(bytes).digest('hex'),gzipBase64:gzipSync(bytes).toString('base64')});}
 catch(error){if(receipt.complete)throw error;}
}
await createEvidenceWriter()('HUD_FIXED_GAME_CAPTURE',{engine,workload,phase,complete:receipt.complete,
  syntheticGuestDataOnly:true,physicalDevice:false,whiteScreenFixed:false,files});
if (!receipt.complete) process.exitCode = 1;
