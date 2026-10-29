import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync, appendFileSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { root, configuration } from '../boss2-forensics-20261028/fixture.mjs';
import { serveDevicePreview } from '../boss2-forensics-20261028/devicePreviewServer.mjs';
import { sampleBrowserMemory } from '../boss2-forensics-20261028/processMemory.mjs';

const pw = createRequire(new URL('../boss2-forensics-20261028/package.json', import.meta.url))('playwright');
const engine = process.env.CRYPTOID_DURATION_ENGINE;
const seconds = Number(process.env.CRYPTOID_DURATION_SECONDS || 360);
const diagnostics = process.env.CRYPTOID_DURATION_DIAGNOSTICS !== 'off';
assert.ok(['chromium', 'webkit'].includes(engine));
assert.ok(Number.isInteger(seconds) && seconds >= 30 && seconds <= 900);
const output = resolve(root, 'verification/boss2-return-duration-20261029/results', `${engine}-${diagnostics ? 'on' : 'off'}-${seconds}`);
mkdirSync(output, { recursive: true });
const summary = { complete: false, engine, requestedSeconds: seconds, sixMinuteObservation: seconds >= 360, physicalDevice: false,
  physicalPiBrowser: false, nativeTerminationCauseMeasured: false, whiteScreenFixed: false,
  actualHostOS: process.platform, buildMode: 'production', diagnostics,
  protection: true, scene: 'reactor', activeScreenshots: false, forcedGc: false,
  heapSnapshots: false, extraGameCollectors: false, control: 'native single touchscreen taps',
  memoryMetric: 'Linux browser descendant PSS; not iOS/Android or GPU-resident memory', points: [] };
let server, browser, page, fatal;
const median = values => { const sorted = [...values].sort((a, b) => a - b); const n = sorted.length;
  return n % 2 ? sorted[(n - 1) / 2] : (sorted[n / 2 - 1] + sorted[n / 2]) / 2; };
async function tap(locator) {
  await locator.waitFor({ state: 'visible', timeout: 45000 });
  assert.ok(await locator.isEnabled());
  await locator.scrollIntoViewIfNeeded();
  const box = await locator.boundingBox(); assert.ok(box);
  const viewport = page.viewportSize(); assert.ok(viewport);
  assert.ok(box.x + box.width / 2 >= 0 && box.x + box.width / 2 <= viewport.width
    && box.y + box.height / 2 >= 0 && box.y + box.height / 2 <= viewport.height,
  'native tap must land inside the viewport');
  await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
}
try {
  server = await serveDevicePreview();
  browser = await pw[engine].launch({ headless: true });
  summary.engineVersion = browser.version();
  const profile = configuration(engine === 'webkit' ? 'iphone' : 'android-phone', pw.devices);
  const context = await browser.newContext({ ...profile.context, viewport: { width: 430, height: 825 }, deviceScaleFactor: 3, acceptDownloads: true });
  summary.emulation = { preset: profile.preset, viewport: { width: 430, height: 825 }, deviceScaleFactor: 3, actualPhysicalDevice: false };
  const external = [];
  await context.route('**/*', route => {
    const url = new URL(route.request().url());
    if (url.origin === server.origin || ['fonts.googleapis.com', 'fonts.gstatic.com'].includes(url.hostname)) return route.continue();
    external.push(url.hostname); return route.abort();
  });
  page = await context.newPage(); page.setDefaultTimeout(15000);
  page.on('pageerror', () => { fatal ||= 'javascript-error'; });
  page.on('crash', () => { fatal ||= 'renderer-crash'; });
  await page.goto(server.origin, { waitUntil: 'domcontentloaded' }); await page.bringToFront();
  const diagnosticToggle = page.getByRole('checkbox', { name: 'Diagnose lokal aufzeichnen', exact: true });
  assert.equal(await diagnosticToggle.isChecked(), true);
  if (!diagnostics) { await tap(diagnosticToggle); assert.equal(await diagnosticToggle.isChecked(), false); }
  await tap(page.getByRole('button', { name: 'Testszene vorbereiten', exact: true }));
  await tap(page.getByRole('button', { name: 'Boss-2-Test öffnen', exact: true }));
  await page.waitForFunction(() => window.__crossDeviceTest?.inspect().status === 'paused');
  assert.equal(await page.evaluate(() => window.__crossDeviceTest.inspect().technicalPause), false);
  await tap(page.locator('.pause-resume-button'));
  await page.waitForFunction(() => window.__crossDeviceTest?.inspect().status === 'playing'
    && window.__crossDeviceTest.inspect().encounter === 'boss-fight', {}, { timeout: 40000 });
  const first = await page.evaluate(() => ({ scene: window.__crossDeviceTest.inspect(), documentStartedAt: performance.timeOrigin }));
  assert.equal(first.scene.sector, 20); assert.equal(first.scene.reactorOpen, true); assert.equal(first.scene.ownerDiagnostics, diagnostics);
  assert.deepEqual(first.scene.buildFlags, { development: false, production: true });
  summary.initialSetupPause = { expected: true, technical: false, manualResumeRequired: true };
  const started = Date.now(); let lastProgress = started, frameAt, lastPrinted = started;
  while (Date.now() - started < seconds * 1000) {
    assert.ok(!fatal, fatal);
    const now = Date.now();
    const observed = await page.evaluate(() => ({ scene: window.__crossDeviceTest?.inspect(), documentStartedAt: performance.timeOrigin }));
    assert.equal(observed.documentStartedAt, first.documentStartedAt, 'same document throughout active duration');
    const scene = observed.scene; assert.ok(scene, 'game remains mounted');
    assert.equal(scene.status, 'playing'); assert.equal(scene.technicalPause, false); assert.equal(scene.sector, 20); assert.equal(scene.reactorOpen, true);
    if (scene.frameAt !== frameAt) lastProgress = now;
    assert.ok(now - lastProgress < 5000, 'frame callbacks continue'); frameAt = scene.frameAt;
    const memory = sampleBrowserMemory(); assert.ok(memory.contentProcessObserved && memory.summedPssKiB !== null);
    const row = { elapsedSeconds: (now - started) / 1000, frameAt, coreVolley: scene.coreVolley,
      status: scene.status, shots: scene.shots, hostileShots: scene.hostileShots, effects: scene.effects,
      canvas: scene.canvas, audio: scene.audio, summedPssKiB: memory.summedPssKiB, summedRssKiB: memory.summedRssKiB,
      processRoles: memory.processes.map(p => p.role),
      processMemoryByRole: Object.fromEntries([...new Set(memory.processes.map(p => p.role))].map(role => [role,
        memory.processes.filter(p => p.role === role).reduce((sum, p) => sum + p.pssKiB, 0)])) };
    summary.points.push(row); appendFileSync(output + '/process-counters.jsonl', JSON.stringify(row) + '\n');
    if (now - lastPrinted >= 60000) { lastPrinted = now; console.log('CRYPTOID_DURATION_PROGRESS ' + JSON.stringify({ engine, activeSeconds: Math.round(row.elapsedSeconds), pssMiB: row.summedPssKiB / 1024 })); }
    await page.waitForTimeout(1000);
  }
  const end = await page.evaluate(() => window.__crossDeviceTest.inspect());
  assert.equal(end.status, 'playing'); assert.equal(end.technicalPause, false); assert.ok(end.coreVolley > first.scene.coreVolley);
  summary.observedActiveSeconds = (Date.now() - started) / 1000;
  summary.volleyProgress = { first: first.scene.coreVolley, last: end.coreVolley };
  const pss = summary.points.map(p => p.summedPssKiB);
  summary.processMemory = { samples: pss.length, firstPssKiB: pss[0], lastPssKiB: pss.at(-1),
    minimumPssKiB: Math.min(...pss), maximumPssKiB: Math.max(...pss),
    firstMinuteMedianPssKiB: median(summary.points.filter(p => p.elapsedSeconds < 60).map(p => p.summedPssKiB)),
    lastMinuteMedianPssKiB: median(summary.points.filter(p => p.elapsedSeconds >= seconds - 60).map(p => p.summedPssKiB)) };
  await tap(page.getByRole('button', { name: /^(Pause|Pausieren)$/, exact: true }));
  await page.waitForFunction(() => window.__crossDeviceTest.inspect().status === 'paused');
  if (diagnostics) {
    const pause = await page.evaluate(() => window.__bossLabPauseEvents.at(-1)); assert.equal(pause.pauseReason, 'manual-pause');
    const through = await page.evaluate(() => JSON.parse(localStorage.getItem('cryptoid_owner_full_status_v1') || 'null')?.lastObservedSeq);
    assert.ok(Number.isSafeInteger(through) && through > 0);
    await page.waitForFunction(seq => { try { return JSON.parse(localStorage.getItem('cryptoid_owner_full_status_v1'))?.lastCommittedSeq >= seq; } catch { return false; } }, through);
  } else {
    assert.equal(await page.evaluate(() => localStorage.getItem('cryptoid_owner_full_status_v1')), null);
    summary.additionalFullRecordingAbsent = true;
  }
  await page.screenshot({ path: output + '/paused-after-duration.png' });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: 'Testszene vorbereiten', exact: true }).waitFor();
  assert.equal(new URL(page.url()).pathname, '/'); assert.equal(await page.locator('.game-shell').count(), 0);
  if (diagnostics) await tap(page.getByRole('button', { name: /^Bericht vorbereiten ·/ }).first());
  else await tap(page.getByRole('button', { name: 'Begrenzten lokalen Bericht vorbereiten', exact: true }));
  const pending = page.waitForEvent('download');
  const [download] = await Promise.all([pending, tap(page.getByRole('button', { name: 'Bericht speichern', exact: true }))]);
  const report = JSON.parse(readFileSync(await download.path(), 'utf8'));
  assert.equal(report.isolatedGuest, true); assert.equal(report.automaticTransmission, false);
  if (diagnostics) {
    assert.equal(report.fullSession.integrity.contiguous, true); assert.deepEqual(report.fullSession.integrity.errors, []);
    assert.equal(report.testOptionsMatchedByStartTime, true); assert.equal(report.testOptions.protection, true); assert.equal(report.testOptions.diagnostics, true);
  } else {
    assert.equal(report.fullSession, null); assert.equal(report.testOptionsHistory.at(-1).diagnostics, false);
    assert.equal(report.testOptionsHistory.at(-1).protection, true);
  }
  const returned = report.returnEvidence; assert.equal(returned.evidenceSource, 'current-tab');
  assert.equal(returned.activeDocument.navigationType, 'reload'); assert.ok(returned.activeDocument.startedAt > first.documentStartedAt);
  if (diagnostics) {
    const tail = report.crashTails.sessions.find(t => t.id === report.fullSession.summary.id); assert.equal(tail.documentStartedAt, first.documentStartedAt);
  }
  summary.report = { source: report.source, fullRecording: diagnostics,
    records: diagnostics ? report.fullSession.integrity.records : null, bytes: JSON.stringify(report).length,
    contiguous: diagnostics ? true : null, recoveredAfterControlledPausedReload: true, separateNewDocumentEvidence: true,
    pauseReasons: diagnostics ? report.fullSession.records.filter(r => r.kind === 'pause').map(r => r.data.pauseReason) : null };
  if (diagnostics) assert.deepEqual(summary.report.pauseReasons, ['manual-pause']);
  assert.deepEqual(external, []); summary.unexpectedExternalRequests = external;
  await page.screenshot({ path: output + '/recovered-report.png' });
  assert.ok(!fatal, fatal); summary.complete = true;
} catch (error) {
  summary.failure = { code: fatal || 'verification-failed', message: error.message }; process.exitCode = 1;
  if (page && !page.isClosed()) try {
    summary.failure.observed = await page.evaluate(() => ({ scene: window.__crossDeviceTest?.inspect(), pauses: window.__bossLabPauseEvents?.slice(-8),
      visibleMessage: document.body.innerText.slice(-2000) }));
    await page.screenshot({ path: output + '/failure.png', timeout: 5000 });
  } catch { summary.failure.observationUnavailable = true; }
} finally {
  summary.finishedAt = new Date().toISOString(); writeFileSync(output + '/verification.json', JSON.stringify(summary, null, 2) + '\n');
  console.log('CRYPTOID_DURATION_RESULT ' + JSON.stringify({ complete: summary.complete, engine,
    requestedSeconds: seconds, diagnostics, sixMinuteObservation: summary.sixMinuteObservation,
    observedActiveSeconds: summary.observedActiveSeconds, processMemory: summary.processMemory, report: summary.report, failure: summary.failure }));
  if (browser) await browser.close(); if (server) await server.close();
}
