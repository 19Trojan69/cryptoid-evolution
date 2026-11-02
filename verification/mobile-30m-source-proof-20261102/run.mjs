import assert from 'node:assert/strict';
import { spawn, execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { mkdirSync, readFileSync, readdirSync, writeFileSync, appendFileSync, copyFileSync } from 'node:fs';
import { resolve, relative } from 'node:path';
import { pathToFileURL } from 'node:url';
import { arch, cpus, totalmem } from 'node:os';
import { readSourceState } from './sourceState.mjs';

// The driver lives OUTSIDE the tested checkout. No runtime source, built file,
// simulation clock, browser API or application diagnostic is patched here.
const SOURCE = 'b042c8e50ad3f05a70418ae5ee6bb4412809035b';
const TREE = '921fe9212ce0ccfeaa7dc46352d3d6385c7f3fb2';
const CLOCK = '5e5845d5e5beef85ca5dadac597b8d751e81f931374b942b22fdedc7d83bbb5c';
const [candidateArg, outputArg, engine, replica, phase] = process.argv.slice(2);
assert.ok(candidateArg && outputArg);
assert.ok(['chromium', 'webkit'].includes(engine));
assert.ok(['1', '2'].includes(replica));
assert.ok(['smoke', 'soak'].includes(phase));
const candidate = resolve(candidateArg), output = resolve(outputArg, engine + '-r' + replica, phase);
const seconds = phase === 'smoke' ? 60 : 1800;
mkdirSync(output, { recursive: true });
const git = ref => execFileSync('git', ['rev-parse', ref], { cwd: candidate, encoding: 'utf8' }).trim();
assert.equal(git('HEAD'), SOURCE, 'Test exactly the frozen device source');
assert.equal(git('HEAD^{tree}'), TREE, 'Test exactly the frozen device tree');
const generatedLockfiles = readSourceState(candidate);
execFileSync(process.execPath, ['verification/direct-boss-style-device-20261102/verifyScope.mjs'], { cwd: candidate, stdio: 'inherit' });
execFileSync(process.execPath, ['verification/direct-boss-style-device-20261102/verifyPackage.mjs'], { cwd: candidate, stdio: 'inherit' });
const site = resolve(candidate, 'verification/boss2-forensics-20261028/results/device-preview/site');
const info = JSON.parse(readFileSync(resolve(site, 'device-preview-info.json'), 'utf8'));
assert.equal(info.sourceCommit, SOURCE); assert.equal(info.sourceTree, TREE);
assert.equal(info.workingTreeDirty, true, 'Build truthfully includes the two generated npm locks');
assert.equal(info.directStyleDeviceCandidate.diagnosticClockStateSha256, CLOCK);
assert.equal(info.directStyleDeviceCandidate.activeFrameProbeIncluded, false);
assert.equal(info.directStyleDeviceCandidate.activeClockTraceIncluded, false);
const digest = file => createHash('sha256').update(readFileSync(file)).digest('hex');
const files = [];
function collect(dir) { for (const e of readdirSync(dir, { withFileTypes: true })) {
  const p = resolve(dir, e.name);
  if (e.isDirectory()) collect(p);
  else if (/\.(js|css)$/.test(e.name)) files.push({ path: relative(site, p), sha256: digest(p) });
} }
collect(site); files.sort((a, b) => a.path.localeCompare(b.path));
const appRequire = createRequire(resolve(candidate, 'frontend/package.json'));
const pwRequire = createRequire(resolve(candidate, 'verification/boss2-forensics-20261028/package.json'));
const packages = Object.fromEntries(['react', 'react-dom', 'react-router-dom', 'vite', 'typescript'].map(n => [n, appRequire(n + '/package.json').version]));
packages.playwright = pwRequire('playwright/package.json').version;
const receipt = { version: 1, complete: false, sourceCommit: SOURCE, sourceTree: TREE,
  engine, replica: Number(replica), phase, requestedActiveSeconds: seconds,
  startedAt: new Date().toISOString(), nodeVersion: process.version, installedPackages: packages,
  lockSha256: digest(resolve(candidate, 'frontend/yarn.lock')), generatedLockfiles, scriptsAndStyles: files,
  host: { platform: process.platform, arch: arch(), logicalCpus: cpus().length, totalMemoryBytes: totalmem() },
  runtimeSourceChanged: false, builtRuntimeChanged: false, addedInPageHooks: false,
  exactFrozenSourceCheckout: true, physicalDevice: false, whiteScreenFixed: false,
  externalSamplingMs: 5000, processSamples: 0, errors: [],
  limits: ['Fresh Linux runners and unseeded gameplay; no matched causal A/B claim.',
    'Fresh npm resolution is recorded. Same source does not prove bytes equal the hosted bundle.',
    'External process sampling can affect host scheduling. No additional page reads are added.',
    'Linux process PSS is neither physical phone RAM nor GPU-resident allocation.',
    'The existing inspector and minimal device diagnostics remain present.',
    'Advancing DOM and game clocks do not prove the absence of white pixels on a phone.'] };
writeFileSync(resolve(output, 'build-info.json'), JSON.stringify(info, null, 2) + '\n');
const { sampleBrowserMemory } = await import(pathToFileURL(resolve(candidate, 'verification/boss2-forensics-20261028/processMemory.mjs')));
const env = Object.fromEntries(Object.entries(process.env).filter(([k]) => !k.startsWith('CRYPTOID_')));
Object.assign(env, { CRYPTOID_SOAK_ENGINE: engine, CRYPTOID_SOAK_CONDITION: 'original',
  CRYPTOID_SOAK_SECONDS: String(seconds), CRYPTOID_SOAK_RUN: phase });
const child = spawn(process.execPath, ['verification/systematic-stability-20261101/verifyBrowserSoak.mjs'], { cwd: candidate, env, stdio: 'inherit' });
const start = performance.now();
const sample = () => {
  try {
    const memory = sampleBrowserMemory(child.pid);
    const point = { elapsedWallMs: Math.round(performance.now() - start), ...memory };
    appendFileSync(resolve(output, 'external-process-memory.jsonl'), JSON.stringify(point) + '\n');
    receipt.processSamples++;
  } catch (e) { receipt.errors.push('external-sampling: ' + String(e.message).slice(0, 256)); }
};
const interval = setInterval(sample, 5000); sample();
const end = await new Promise(resolveEnd => {
  child.once('error', error => resolveEnd({ code: null, error: String(error.message) }));
  child.once('exit', (code, signal) => resolveEnd({ code, signal }));
});
clearInterval(interval); sample(); receipt.childExit = end;
try {
  const resultPath = resolve(candidate, 'verification/systematic-stability-20261101/results', engine + '-original', phase, 'verification.json');
  const result = JSON.parse(readFileSync(resultPath, 'utf8'));
  copyFileSync(resultPath, resolve(output, 'verification.json'));
  receipt.gameFlow = { complete: result.complete, cycles: result.cycles.map(c => ({ cycle: c.cycle,
    complete: c.complete, observedActiveMs: c.observedActiveMs, pauseFreezeVerified: c.pauseFreezeVerified,
    weaponRoundtripVerified: c.weaponRoundtripVerified, normalExitVerified: c.normalExitVerified })),
    failure: result.failure ?? null, normalReportVerified: result.normalReportVerified === true };
  assert.equal(end.code, 0, 'The native flow must exit successfully');
  assert.equal(result.complete, true); assert.equal(result.sourceCommit, SOURCE); assert.equal(result.sourceTree, TREE);
  assert.equal(result.requestedActiveSeconds, seconds);
  assert.equal(result.extraGameCollectors, false); assert.equal(result.activeScreenshots, false);
  assert.equal(result.clocksAccelerated, false); assert.equal(result.automaticResume, false);
  assert.equal(result.cycles.length, 3); assert.equal(result.normalReportVerified, true);
  for (const [i, c] of result.cycles.entries()) {
    assert.equal(c.complete, true); assert.ok(c.observedActiveMs >= (i === 0 ? seconds : 10) * 1000);
    assert.equal(c.pauseFreezeVerified, true); assert.equal(c.weaponRoundtripVerified, true); assert.equal(c.normalExitVerified, true);
  }
  assert.ok(receipt.processSamples >= Math.floor(seconds / 5), 'External capture covers the requested wall interval');
  execFileSync(process.execPath, ['verification/direct-boss-style-device-20261102/verifyScope.mjs'], { cwd: candidate, stdio: 'inherit' });
  assert.deepEqual(readSourceState(candidate), generatedLockfiles, 'Source state and generated lock bytes stay identical');
  assert.equal(receipt.errors.length, 0);
  receipt.complete = true;
} catch (e) { receipt.errors.push(String(e.message).slice(0, 4096)); }
receipt.finishedAt = new Date().toISOString();
writeFileSync(resolve(output, 'receipt.json'), JSON.stringify(receipt, null, 2) + '\n');
console.log('CRYPTOID_FROZEN_SOURCE_30M ' + JSON.stringify({ engine, replica, phase, complete: receipt.complete,
  sourceCommit: SOURCE, activeMs: receipt.gameFlow?.cycles.map(c => c.observedActiveMs), errors: receipt.errors }));
if (!receipt.complete) process.exitCode = 1;
