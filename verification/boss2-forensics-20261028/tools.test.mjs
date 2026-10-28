import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
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
    const result = sampleBrowserMemory(100, proc);
    assert.deepEqual(result.processes.map(p => p.pid), [101, 102]);
    assert.equal(result.summedRssKiB, 20); assert.equal(result.summedPssKiB, 13);
    rmSync(`${proc}/102/smaps_rollup`); assert.equal(sampleBrowserMemory(100, proc).summedPssKiB, null);
    assert.equal(sampleBrowserMemory(999, proc).available, false);
  } finally { rmSync(proc, { recursive: true }); }
});
