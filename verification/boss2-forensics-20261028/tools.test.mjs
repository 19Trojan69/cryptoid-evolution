import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { root, instrumentBossDamage, instrumentInputEvidence } from './fixture.mjs';
import { memoryFromStatus, processRole, sampleBrowserMemory } from './processMemory.mjs';
test('OS counters distinguish RSS, high water and unavailable PSS', () => {
  assert.deepEqual(memoryFromStatus('VmRSS:  10 kB\nVmHWM:  22 kB\n', 'Pss: 7 kB\n'), { rssKiB: 10, peakRssKiB: 22, pssKiB: 7 });
  assert.equal(memoryFromStatus('VmRSS: 10 kB').pssKiB, null);
});
test('content, GPU and network processes remain separate categories', () => {
  assert.equal(processRole('/bin/chrome\0--type=renderer'), 'chromium-renderer');
  assert.equal(processRole('/bin/chrome\0--type=gpu-process'), 'chromium-gpu');
  assert.equal(processRole('/bin/WebKitWebProcess'), 'webkit-content');
  assert.equal(processRole('/bin/node\0run.mjs'), null);
});
test('only descendants of the test runner are attributed; unrelated browsers are excluded', () => {
  const proc = mkdtempSync(tmpdir() + '/cryptoid-proc-');
  const add = (pid, parent, command, pss) => {
    mkdirSync(`${proc}/${pid}`); writeFileSync(`${proc}/${pid}/status`, `PPid: ${parent}\nVmRSS: 10 kB\nVmHWM: 11 kB\n`);
    writeFileSync(`${proc}/${pid}/cmdline`, command);
    if (pss !== null) writeFileSync(`${proc}/${pid}/smaps_rollup`, `Pss: ${pss} kB\n`);
  };
  try {
    add(100, 1, '/bin/node', null); add(101, 100, '/bin/chrome\0--headless', 6);
    add(102, 101, '/bin/chrome\0--type=renderer', 7); add(103, 1, '/bin/chrome', 99);
    add(104, 100, '/bin/chrome --type=gpu-process --private-flag=value', 2);
    const result = sampleBrowserMemory(100, proc);
    assert.deepEqual(result.processes.map(p => p.pid), [101, 102, 104]);
    assert.equal(result.processes.at(-1).executable, 'chrome', 'Rewritten argv0 cannot leak launch arguments');
    assert.equal(result.summedRssKiB, 30); assert.equal(result.summedPssKiB, 15);
    rmSync(`${proc}/102/smaps_rollup`); assert.equal(sampleBrowserMemory(100, proc).summedPssKiB, null);
    assert.equal(sampleBrowserMemory(999, proc).available, false);
    add(105, 101, '/bin/bwrap', null);
    rmSync(`${proc}/105/cmdline`);
    add(106, 105, '/bin/WebKitWebProcess', 4);
    const bridged = sampleBrowserMemory(100, proc);
    assert.ok(bridged.processes.some(p => p.pid === 106), 'Unreadable intermediary argv cannot sever renderer ancestry');
    assert.equal(bridged.contentProcessObserved, true);
  } finally { rmSync(proc, { recursive: true }); }
});

test('test-only boss hold retains hit processing without healing and is inert outside its explicit window', () => {
  const source = instrumentBossDamage(readFileSync(root + '/frontend/src/pages/sectorBoss.ts', 'utf8'));
  const start = source.indexOf('export const damageSectorBoss'), end = source.indexOf('export const bossVulnerable', start);
  const ts = createRequire(root + '/frontend/package.json')('typescript');
  const fragment = source.slice(start, end).replace('export const', 'const') + '\nreturn damageSectorBoss;';
  const code = ts.transpileModule(fragment, { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText;
  const window = { __bossLabHold: true };
  const damage = new Function('bossVulnerable', 'bossHullExposed', 'window', code)(() => true, () => true, window);
  const boss = { health: 50, maxHealth: 100, config: { id: 2 }, lastDamageAt: 0 };
  assert.equal(damage(boss, 1000, 123), true); assert.equal(boss.health, 40); assert.equal(boss.lastDamageAt, 123);
  boss.health = 20; damage(boss, 1000, 124); assert.equal(boss.health, 20, 'No artificial healing');
  window.__bossLabHold = false; damage(boss, 1000, 125); assert.equal(boss.health, 0);
  window.__bossLabHold = true; boss.config.id = 1; boss.health = 50;
  damage(boss, 1000, 126); assert.equal(boss.health, 0, 'Other bosses retain normal damage');
});

test('evidence control disables only input capture while retaining the same active owner observer', () => {
  const source = instrumentInputEvidence(readFileSync(root + '/frontend/src/pages/inputDiagnostics.ts', 'utf8'));
  const start = source.indexOf('export function createInputDiagnostics'), end = source.indexOf('// Registered only', start);
  const ts = createRequire(root + '/frontend/package.json')('typescript');
  const code = ts.transpileModule(source.slice(start, end).replace('export function', 'function') + '\nreturn createInputDiagnostics;',
    { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText;
  const window = { __bossLabNoInputEvidence: true }, rows = [];
  const create = new Function('window', code)(window);
  const input = create(() => true, row => rows.push(row), () => 0);
  const point = { clientX: 300, clientY: 700, pointerType: 'touch' }, bounds = { left: 0, top: 0, width: 430, height: 825 };
  input.start(point, bounds); input.end('released'); assert.equal(rows.length, 0);
  window.__bossLabNoInputEvidence = false;
  input.start(point, bounds); input.end('released'); assert.equal(rows.length, 2);
});
