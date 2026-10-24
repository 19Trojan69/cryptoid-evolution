// Native-browser checks of the AUDIT HELPER, not the Cryptoid game or iPhone stability.
// Every interruption below is synthetic and deliberately seeded into a local fixture.
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { once } from 'node:events';
import { createRequire } from 'node:module';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { captureLifecycleState, captureLifecycleFailure, assertLifecycleState } from './startupLifecycleEvidence.mjs';

const require = createRequire(import.meta.url);
const playwright = require(process.env.CRYPTOID_PLAYWRIGHT_PACKAGE || 'playwright');
const engine = process.env.CRYPTOID_STARTUP_ENGINE || 'chromium';
assert.ok(['chromium', 'webkit'].includes(engine));
const out = resolve(process.env.CRYPTOID_LIFECYCLE_EVIDENCE_DIR || 'startup-lifecycle-evidence');
mkdirSync(out, { recursive: true });
const report = { passed: false, scope: 'synthetic audit-helper fixture; NOT actual game lifecycle', engine,
  actualGameTested: false, iPhoneTested: false, automaticResume: false, cases: [], pageErrors: [] };
const html = `<!doctype html><meta charset="utf-8"><title>Synthetic audit-helper fixture</title>
<style>body{font:16px sans-serif;margin:0}button{padding:12px}.game-shell{height:825px}.game-overlay{position:fixed;inset:0;background:white;padding:48px;box-sizing:border-box}</style>
<div id="root"><div class="game-shell" data-effects-paused="false"><button class="pause-control">Pause</button><p>Synthetic audit-helper fixture — not Cryptoid gameplay</p></div></div>`;
const server = createServer((_req, res) => { res.setHeader('Content-Type', 'text/html'); res.end(html); });
server.listen(0, '127.0.0.1'); await once(server, 'listening');
let browser;
try {
  browser = await playwright[engine].launch({ headless: true,
    ...(process.env.CRYPTOID_BROWSER_EXECUTABLE ? { executablePath: process.env.CRYPTOID_BROWSER_EXECUTABLE } : {}) });
  report.version = browser.version();
  const context = await browser.newContext({ viewport: { width: 430, height: 825 }, deviceScaleFactor: 3 });
  try {
    for (const mode of ['active', 'loop-stall', 'input-error', 'unknown-pause']) {
      const page = await context.newPage();
      page.on('pageerror', error => report.pageErrors.push(error.name));
      await page.goto('http://127.0.0.1:' + server.address().port);
      await page.evaluate(() => {
        localStorage.removeItem('cryptoid_game_diagnostics_v1');
        localStorage.setItem('fixture-save-do-not-touch', 'preserve');
        window.fixtureResumeCount = 0;
      });
      const row = { mode, lifecycleStage: 'before-pause' };
      const initial = await captureLifecycleState(page, row, 'initial');
      row.lifecycleStartedAt = initial.observedAtEpochMs;
      assertLifecycleState(initial, 'active', initial.documentStartedAt);
      if (mode === 'active') {
        await page.evaluate(() => {
          localStorage.setItem('cryptoid_game_diagnostics_v1', JSON.stringify([
            { reason: 'loop-stall', at: new Date(performance.timeOrigin - 1000).toISOString() },
          ]));
        });
        const state = await captureLifecycleState(page, row, 'historical-only');
        assertLifecycleState(state, 'active', initial.documentStartedAt);
        assert.equal(state.diagnostics.entries.length, 1);
        assert.equal(state.recordedInterruptions.length, 0);
        row.fixturePassed = true;
      } else {
        await page.evaluate(mode => {
          if (mode !== 'unknown-pause') localStorage.setItem('cryptoid_game_diagnostics_v1', JSON.stringify([
            { reason: mode, at: new Date().toISOString(), phase: 'FORMATION', encounter: 'normal', status: 'paused', sector: 1 },
          ]));
          document.querySelector('.game-shell').setAttribute('data-effects-paused', 'true');
          const overlay = document.createElement('div');
          overlay.className = 'game-overlay pause-settings-overlay'; overlay.setAttribute('role', 'dialog');
          overlay.innerHTML = '<h1>Synthetic pause</h1><p>Audit-helper fixture only</p><button class="pause-resume-button">Resume</button>';
          overlay.querySelector('button').onclick = () => window.fixtureResumeCount++;
          document.body.appendChild(overlay);
        }, mode);
        let failure;
        try { await page.locator('.pause-control').click({ timeout: 300 }); }
        catch (error) { failure = error; }
        assert.equal(failure?.name, 'TimeoutError');
        const path = resolve(out, engine + '-' + mode + '.png');
        await captureLifecycleFailure(page, row, failure, { screenshotPath: path });
        const state = row.lifecycleSamples.at(-1);
        assert.equal(state.captured, true);
        assert.equal(state.pauseOverlay.visible, true);
        assert.equal(state.pauseHitTarget.insidePauseControl, false);
        assert.deepEqual(state.recordedInterruptions.map(entry => entry.reason), mode === 'unknown-pause' ? [] : [mode]);
        assert.throws(() => assertLifecycleState(state, 'active', initial.documentStartedAt));
        assert.equal(row.passed, false);
        assert.equal(row.failureScreenshot.captured, true);
        row.screenshotSha256 = createHash('sha256').update(readFileSync(path)).digest('hex');
        row.fixturePassed = true;
      }
      assert.equal(await page.evaluate(() => window.fixtureResumeCount), 0);
      assert.equal(await page.evaluate(() => localStorage.getItem('fixture-save-do-not-touch')), 'preserve');
      report.cases.push(row);
      await page.close();
    }
  } finally { await context.close(); }
  assert.deepEqual(report.pageErrors, []);
  report.passed = true;
} catch (error) {
  report.error = { name: error.name, message: String(error.message).slice(0, 2000) };
  throw error;
} finally {
  try { writeFileSync(resolve(out, 'native-' + engine + '.json'), JSON.stringify(report, null, 2) + '\n'); }
  finally {
    try { await browser?.close(); }
    finally { server.closeAllConnections(); server.close(); }
  }
}
console.log(JSON.stringify({ scope: report.scope, engine, version: report.version, passed: report.cases.length }));
