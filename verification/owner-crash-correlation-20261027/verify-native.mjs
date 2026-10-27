// Reuse the existing owner export fixture; no real accounts or native OS screenshot.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync, unlinkSync } from 'node:fs';
import { resolve } from 'node:path';
const root = resolve(new URL('../..', import.meta.url).pathname);
const require = createRequire(root + '/frontend/package.json');
const { createServer } = require('vite');
const { chromium } = require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES + '/playwright');
const output = root + '/verification/owner-crash-correlation-20261027/results';
mkdirSync(output, { recursive: true });
const pinned = execFileSync('git', ['show', '97d74b412f7dc7ea2f4f8c05f483d87eb3451dba:frontend/src/pages/crashRecoveryBoundary.mjs'], { cwd: root, encoding: 'utf8' });
const fixturePath = root + '/frontend/owner-correlation-local.html';
const fixture = root + '/verification/owner-crash-boundary/preview.tsx';
const result = { baseline: '97d74b412f7dc7ea2f4f8c05f483d87eb3451dba', reusedFixture: 'verification/owner-crash-boundary/preview.tsx', localOnly: true, syntheticFixtures: true, actualGame: false, physicalDevice: false, operatingSystemScreenshot: false, historicalWhiteScreenFixed: false, checks: [], cases: [], errors: [], complete: false };
const check = (label, value) => { assert.ok(value, label); result.checks.push(label); };
let browser, server;
try {
  writeFileSync(fixturePath, '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><div id="root"></div><script type="module" src="/@fs/' + fixture + '"></script></body></html>');
  browser = await chromium.launch({ headless: true, executablePath: process.env.CRYPTOID_CHROMIUM_EXECUTABLE || '/root/.cache/ms-playwright/chromium-1194/chrome-linux/chrome' });
  result.engine = browser.version();
  for (const control of [true, false]) {
    server = await createServer({ root: root + '/frontend', cacheDir: output + '/vite-' + control, logLevel: 'error', server: { host: '127.0.0.1', port: 0, hmr: false, fs: { allow: [root] } }, plugins: [{ name: 'pinned-correlation-only', enforce: 'pre', transform(code, id) { if (control && id.split('?')[0].endsWith('/pages/crashRecoveryBoundary.mjs')) return pinned; } }] });
    await server.listen();
    const origin = 'http://127.0.0.1:' + server.httpServer.address().port;
    const context = await browser.newContext({ viewport: { width: 430, height: 825 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
    await context.route('**/*', route => new URL(route.request().url()).origin === origin ? route.continue() : route.abort());
    const page = await context.newPage();
    page.on('pageerror', error => result.errors.push(error.message));
    await page.goto(origin + '/owner-correlation-local.html');
    await page.getByRole('button', { name: 'Start fixture' }).click();
    await page.getByRole('heading', { name: 'Local game DOM' }).waitFor();
    await page.waitForFunction(() => window.__crashFixture.tails().sessions[0]?.frames.length >= 6);
    const before = await page.evaluate(() => ({ origin: performance.timeOrigin, frame: window.__crashFixture.tails().sessions[0].head.progress.completedFrames }));
    const captureBytes = [];
    for (let i = 0; i < 5; i++) captureBytes.push((await page.screenshot({ type: 'png', animations: 'allow' })).length);
    await page.waitForFunction(frame => window.__crashFixture.tails().sessions[0].head.progress.completedFrames > frame, before.frame);
    check((control ? 'pinned' : 'candidate') + ': browser fixture captures retain the document and callback progress', await page.evaluate(old => performance.timeOrigin === old, before.origin) && captureBytes.every(n => n > 0));
    const adjusted = await page.evaluate(() => {
      const tail = window.__crashFixture.tails().sessions[0];
      const starts = window.__crashFixture.report().events.filter(row => row.kind === 'document-start');
      const canonical = starts.at(-1).documentStartedAt;
      for (const storage of [sessionStorage, localStorage]) for (const slot of [0, 1]) {
        const key = 'cryptoid_owner_crash_tail_v1_' + slot + '_meta';
        const meta = JSON.parse(storage.getItem(key) || 'null');
        if (meta?.id === tail.id) { meta.documentStartedAt = canonical - 3; storage.setItem(key, JSON.stringify(meta)); }
      }
      return canonical;
    });
    await page.goto(origin + '/owner-correlation-local.html?home=1');
    await page.getByRole('heading', { name: 'Local Home' }).waitFor();
    const exported = await page.evaluate(() => window.__crashFixture.export());
    const boundary = exported.crashEvidence.recoveryBoundary;
    check((control ? 'pinned' : 'candidate') + ': actual IndexedDB history remains complete', exported.integrity.contiguous && exported.records.length > 0);
    if (control) {
      check('pinned helper reproduces missed same-tab replacement at a three-millisecond discrepancy', boundary.status === 'replacement-not-observed');
    } else {
      check('candidate links the real next document and Home', boundary.homeObservedAt > 0 && boundary.nextDocumentStartedAt > boundary.previousDocumentStartedAt && boundary.documentStartOffsetMs === 3);
      check('candidate retains actual normal pagehide', boundary.status === 'replacement-with-lifecycle-signal' && boundary.departureSignals.some(row => row.kind === 'pagehide'));
      await page.evaluate(canonical => {
        for (const storage of [sessionStorage, localStorage]) {
          const key = 'cryptoid_owner_lifecycle_v1', value = JSON.parse(storage.getItem(key));
          value.events = value.events.filter(row => row.documentStartedAt !== canonical || !(['pagehide', 'freeze'].includes(row.kind) || row.kind === 'visibility' && row.hidden));
          storage.setItem(key, JSON.stringify(value));
        }
      }, adjusted);
      const missingDeparture = await page.evaluate(() => window.__crashFixture.export());
      const absent = missingDeparture.crashEvidence.recoveryBoundary;
      check('controlled missing final signal stays distinct from ordinary departure', absent.status === 'replacement-without-lifecycle-signal' && absent.departureSignals.length === 0);
      check('neither observed replacement fabricates white pixels or a native cause', boundary.nativeCauseKnown === false && absent.nativeCauseKnown === false && boundary.whitePixelsObserved === false && absent.whitePixelsObserved === false);
      check('exporting the changed classification preserves saved history', missingDeparture.integrity.contiguous && missingDeparture.records.length === exported.records.length);
    }
    result.cases.push({ control, captures: captureBytes.length, simulatedOriginDiscrepancyMs: 3, classification: boundary.status, recordsContiguous: exported.integrity.contiguous, nativeCauseKnown: boundary.nativeCauseKnown });
    await context.close();
    await server.close(); server = null;
  }
  check('no unexpected page errors', result.errors.length === 0);
  result.complete = true;
} catch (error) {
  result.failure = String(error.stack || error).includes('socket() failed: Operation not permitted')
    ? 'Browser launch blocked: local socket creation returned Operation not permitted before any fixture ran.'
    : String(error.stack || error);
  process.exitCode = 1;
} finally {
  if (browser) await browser.close();
  if (server) await server.close();
  try { unlinkSync(fixturePath); } catch {}
  writeFileSync(output + '/native.json', JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result));
}
