import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { adaptVerifier } from './adaptVerifier.mjs';
const url = new URL('../systematic-stability-20261101/verifyBrowserSoak.mjs', import.meta.url);
const original = readFileSync(url, 'utf8');

test('external driver retains every existing clock, pause, export and failure gate', () => {
  for (const workload of ['existing-left', 'reactor-line']) {
    const adapted = adaptVerifier(original, url.href, workload);
    for (const gate of ["assert.equal(observed.clock.latest.mode, 'running')",
      "assert.equal(observed.clock.latest.unobservedGaps, 0, 'No hidden/unobserved interval accepted')",
      'assert.equal(held.clock.latest.elapsedMs, paused.clock.latest.elapsedMs)',
      'assert.equal(report.fullSession, null)', 'process.exitCode = 1'])
      assert.equal(adapted.split(gate).length, 2, gate);
    assert.ok(adapted.includes('await page.touchscreen.tap(fieldBox.x + fieldBox.width * .5'));
    assert.doesNotMatch(adapted, /stateRef\.current|__crossDeviceTest\.park\(|__crossDeviceTest\.protect\(/);
  }
});
test('modified native gates and unknown workload are rejected before starting a browser', () => {
  assert.throws(() => adaptVerifier(original.replace("'No hidden/unobserved interval accepted'", "'loosened'"), url.href, 'reactor-line'));
  assert.throws(() => adaptVerifier(original, url.href, 'unknown'));
});
