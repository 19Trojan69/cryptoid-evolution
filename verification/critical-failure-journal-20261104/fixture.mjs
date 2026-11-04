import assert from 'node:assert/strict';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { browserSource, digest } from './transform.mjs';

const root = resolve(new URL('../..', import.meta.url).pathname), engine = process.argv[2];
assert.ok(['chromium', 'webkit'].includes(engine));
const { build } = createRequire(root+'/frontend/package.json')('esbuild');
const playwright = createRequire(root+'/verification/boss2-forensics-20261028/package.json')('playwright');
const source = '1'.repeat(40), directory = root+'/verification/critical-failure-journal-20261104';
const browserPath = root+'/verification/boss2-brief-report-20261030/briefBrowser.mjs';
const original = readFileSync(browserPath, 'utf8'), bundles = {};
for (const arm of ['control', 'journal']) {
  const compiled = await build({ stdin: { contents: `export { installBriefDiagnostics } from '../boss2-brief-report-20261030/briefBrowser.mjs';`,
    resolveDir: directory, sourcefile: 'fixture-entry.mjs' }, bundle: true, write: false, format: 'iife', globalName: 'Fixture',
    platform: 'browser', target: 'es2022', plugins: [{ name: 'exact-private-journal', setup(bundler) {
      bundler.onLoad({ filter: /briefBrowser\.mjs$/ }, args => {
        assert.equal(args.path, browserPath);
        assert.equal(readFileSync(args.path, 'utf8'), original);
        return { contents: arm === 'journal' ? browserSource(original) : original, loader: 'js', resolveDir: resolve(args.path, '..') };
      });
    } }] });
  bundles[arm] = compiled.outputFiles[0].text;
}
const server = createServer((req, res) => {
  const arm = req.url === '/control.js' ? 'control' : req.url === '/journal.js' ? 'journal' : null;
  if (arm) { res.setHeader('Content-Type', 'application/javascript'); res.end(bundles[arm]); return; }
  res.setHeader('Content-Type', 'text/html; charset=utf-8'); res.setHeader('Cache-Control', 'no-store');
  res.end('<!doctype html><title>Private synthetic recorder fixture</title><div class="game-shell"></div>');
});
await new Promise(done => server.listen(0, '127.0.0.1', done));
const origin = `http://127.0.0.1:${server.address().port}`;
const browser = await playwright[engine].launch({ headless: true });
const rows = [];
try {
  for (const arm of ['control', 'journal']) for (const scenario of ['error-before-removal', 'error-after-removal', 'rejection-after-removal']) {
    const context = await browser.newContext();
    try {
      const page = await context.newPage();
      let nativeUncaughtCount = 0;
      page.on('pageerror', () => nativeUncaughtCount++);
      await page.goto(origin+'/game'); await page.addScriptTag({ url: origin+'/'+arm+'.js' });
      await page.evaluate(({ source, scenario }) => {
        window.__cleanup = window.Fixture.installBriefDiagnostics(window, source);
        const at = Date.now();
        window.dispatchEvent(new CustomEvent('cryptoid:diagnostic-clock', { detail: { live: {
          id: 'fixture-run', source, startedAt: at, updatedAt: at, elapsedMs: 0, unobservedGaps: 0, mode: 'running' } } }));
        if (scenario !== 'error-before-removal') document.querySelector('.game-shell').remove();
        const code = document.createElement('script');
        if (scenario === 'rejection-after-removal') {
          window.addEventListener('unhandledrejection', event => { window.__nativeFaultSeen = true; window.__nativeFaultTrusted = event.isTrusted; }, { once: true });
          code.textContent = 'Promise.reject(new RangeError("synthetic-fixture-rejection"));';
        } else {
          window.addEventListener('error', event => { window.__nativeFaultSeen = true; window.__nativeFaultTrusted = event.isTrusted; }, { once: true });
          code.textContent = 'throw new TypeError("synthetic-fixture-error");';
        }
        document.head.append(code);
        if (scenario === 'error-before-removal') document.querySelector('.game-shell').remove();
        window.__faultLatencyMs = Date.now()-at;
      }, { source, scenario });
      await page.waitForFunction(() => window.__nativeFaultSeen === true);
      const beforeNavigation = await page.evaluate(() => ({
        legacy: JSON.parse(localStorage.getItem('cryptoid_private_brief_v1')),
        journal: JSON.parse(localStorage.getItem('cryptoid_private_critical_v1')),
        latency: window.__faultLatencyMs, nativeFaultTrusted: window.__nativeFaultTrusted }));
      if (scenario !== 'rejection-after-removal') assert.ok(beforeNavigation.latency < 250, 'Exercise the actual legacy write gap');
      const kind = scenario === 'rejection-after-removal' ? 'unhandledrejection' : 'error';
      const oldKept = beforeNavigation.legacy.latest.events.some(e => e.kind === kind);
      assert.equal(oldKept, false, 'The original fails to persist this native fault');
      if (arm === 'journal') {
        const slot = beforeNavigation.journal.latest.events[kind];
        assert.equal(typeof beforeNavigation.nativeFaultTrusted, 'boolean');
        assert.equal(slot.first.trusted, beforeNavigation.nativeFaultTrusted, 'Preserve the actual browser flag; isTrusted is not assumed identical across engines');
        assert.equal(slot.first.errorName, kind === 'error' ? 'TypeError' : 'RangeError');
        assert.equal(slot.count, 1);
      } else assert.equal(beforeNavigation.journal, null);
      await page.goto(origin+'/after');
      const saved = await page.evaluate(() => ({
        legacy: JSON.parse(localStorage.getItem('cryptoid_private_brief_v1')),
        journal: JSON.parse(localStorage.getItem('cryptoid_private_critical_v1')) }));
      const legacyAfterNavigation = saved.legacy.latest.events.some(e => e.kind === kind);
      assert.equal(legacyAfterNavigation, arm === 'journal', 'Only the corrected listener can also flush the legacy ring on exit after scene removal');
      if (arm === 'journal') {
        assert.equal(saved.journal.latest.events[kind].count, 1);
        assert.equal(saved.journal.latest.events.pagehide.first.trusted, true);
        assert.equal(saved.journal.latest.clock.id, 'fixture-run');
        assert.doesNotMatch(JSON.stringify(saved.journal), /synthetic-fixture|127\.0\.0\.1|stack|message/);
      }
      assert.ok(nativeUncaughtCount > 0, 'Automation observed an actual uncaught browser fault');
      rows.push({ arm, scenario, nativeFault: true, nativeFaultTrusted: beforeNavigation.nativeFaultTrusted,
        legacyPersistedBeforeNavigation: oldKept, legacyPersistedAfterNavigation: legacyAfterNavigation,
        persistedBeforeNavigation: arm === 'journal',
        persistedAfterNavigation: arm === 'journal', pagehideAfterSceneRemovalKept: arm === 'journal',
        errorNameKept: arm === 'journal', noSensitiveStrings: true, complete: true });
      console.log('CRITICAL_JOURNAL_FIXTURE_ROW '+JSON.stringify(rows.at(-1)));
    } finally { await context.close(); }
  }
  const output = directory+'/results/'+engine+'-fixture'; mkdirSync(output, { recursive: true });
  const result = { version: 1, engine, originalBrowserSha256: digest(original), transformedBrowserSha256: digest(browserSource(original)),
    originalBundleSha256: digest(bundles.control), journalBundleSha256: digest(bundles.journal),
    rows, nativeBrowserFaultInjection: true, gameWasNotRunInThisFixture: true,
    physicalDevice: false, nativeOsTerminationReproduced: false, whiteScreenFixed: false, complete: true };
  writeFileSync(output+'/fixture.json', JSON.stringify(result, null, 2)+'\n');
  console.log('CRITICAL_JOURNAL_FIXTURE '+JSON.stringify(result));
} finally { await browser.close(); await new Promise(done => server.close(done)); }
