import assert from 'node:assert/strict';
import { readFileSync, readdirSync, mkdtempSync, rmSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createServer } from 'node:http';
import { once } from 'node:events';
import { build } from 'esbuild';

// Local-only acceptance host, never bundled into the public app. Execute the
// actual recorder, database, verified export action and OwnerStabilityReport UI.
// Synthetic probe frames exercise persistence, not physical device gameplay.
const require = createRequire(import.meta.url);
const { webkit } = require(process.env.CRYPTOID_PLAYWRIGHT_PATH || 'playwright');
const frontend = new URL('../', import.meta.url).pathname;
const admin = readFileSync(new URL('../src/pages/AdminPage.tsx', import.meta.url), 'utf8');
const panel = admin.slice(admin.indexOf('async function verifyReportOwner()'), admin.indexOf('export default function AdminPage()'));
const entry = `
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { readOwnerStabilityReport, exportOwnerFullSession } from './src/pages/stabilityReport.mjs';
import { armOwnerTimingCapture } from './src/pages/ownerTimingCapture.ts';
import { armOwnerAudioAudit } from './src/pages/ownerAudioAudit.ts';
import { installReloadDiagnostics } from './src/pages/reloadDiagnostics.ts';
import { createOwnerDiagnosticProbe } from './src/pages/ownerFlightRecorder.ts';
import { sessionDiagnostic } from './src/lib/sessionDiagnosticEvents.ts';
import { settleFullSessionWrites, readFullSessionSummaries } from './src/pages/fullSessionStore.ts';
import { fullSessionFileName, fullSessionText, fullSessionTextPart, shareableFullSessionFile } from './src/pages/fullSessionTransfer.ts';
const __CRYPTOID_BUILD__ = { sourceCommit: 'c62efe2a9e6f4bf249e83b1e3a7a2c997d27be89', sourceTree: 'f2f84ac11f4d86cecbbe9a0338095b96bce769b8', workingTreeDirty: true };
const shipSaveNetwork = 'testnet';
const t = (value, values = {}) => Object.entries(values).reduce((s, [k,v]) => s.replaceAll('{'+k+'}', String(v)), value);
const useAdminLocale = () => ({ t });
const errorMessage = () => 'owner_access_required';
const cssFramePacingStats = () => ({ mode: 'native-easing', targetHz: 60, active: 0, fallbacks: 0 });
window.ownerAllowed = true; window.ownerChecks = 0;
const axiosClient = { get: async path => {
  if (path !== '/admin/status') throw Error('unexpected-test-request');
  window.ownerChecks++; return { data: { canAdmin: window.ownerAllowed } };
}};
${panel}
window.mountPanel = () => createRoot(document.getElementById('root')).render(<OwnerStabilityReport />);
window.recordingSummary = () => readFullSessionSummaries(window);
window.prepareRecording = async () => {
  let clock = 100, wall = Date.now();
  let state = { sector: 1, flight: 0, phase: 'FORMATION', encounter: 'normal', status: 'playing', enemies: 6,
    attackers: 0, returning: 0, playerShots: 2, enemyShots: 0, effects: 0, rocks: 0, rockEffects: 0, pickups: 0 };
  const probe = createOwnerDiagnosticProbe(true, () => window, { build: __CRYPTOID_BUILD__,
    now: () => clock, wallNow: () => wall, runtime: () => ({ domNodes: document.querySelectorAll('*').length }),
    fullContext: () => ({ ...state, weaponLevel: 3, weaponSource: 'paid', paidWeaponMs: 10000, token: 'excluded-private' }) });
  for (let sector = 1; sector <= 34; sector++) {
    state = { ...state, sector };
    sessionDiagnostic('boundary', { operation: 'transition-before', sector });
    for (let frame = 0; frame < 3; frame++) {
      probe.begin(clock, state); clock++; wall++; probe.mark('transitions');
      probe.simulationStep(16,16); probe.sceneRequested(); probe.sceneCommitted(probe.sceneRenderBegin());
      probe.end(clock); clock += 2100; wall += 2100;
    }
    sessionDiagnostic('boundary', { operation: 'transition-reset-done', sector });
    await settleFullSessionWrites();
  }
  sessionDiagnostic('boundary', { operation: 'first-spawn-before', sector: 34, phase: 'ENTRY' });
  await settleFullSessionWrites();
  // Deliberately do not call finish/close/unload. The Node host kills only its
  // own isolated WebKit content process after the transaction completed.
  const result = await readFullSessionSummaries(window);
  return result;
};
window.ready = true;`;
const bundled = await build({ stdin: { contents: entry, resolveDir: frontend, sourcefile: 'full-session-acceptance.tsx', loader: 'tsx' },
  bundle: true, write: false, format: 'iife', platform: 'browser', logLevel: 'silent' });
const server = createServer((req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.url === '/test.js') { res.setHeader('Content-Type', 'application/javascript'); res.end(bundled.outputFiles[0].contents); }
  else { res.setHeader('Content-Type', 'text/html'); res.end('<!doctype html><html><body><div id="root"></div><script src="/test.js"></script></body></html>'); }
});
server.listen(0, '127.0.0.1'); await once(server, 'listening');
const url = `http://127.0.0.1:${server.address().port}/`;
const processRows = () => {
  const rows = new Map();
  for (const dir of readdirSync('/proc').filter(name => /^\d+$/.test(name))) try {
    const status = readFileSync(`/proc/${dir}/status`, 'utf8');
    const pid = +status.match(/^Pid:\s+(\d+)/m)[1], parent = +status.match(/^PPid:\s+(\d+)/m)[1];
    const namespaces = status.match(/^NSpid:\s+(.+)/m)?.[1].trim().split(/\s+/);
    const args = readFileSync(`/proc/${dir}/cmdline`, 'utf8').replaceAll('\0', ' ');
    rows.set(pid, { pid, parent, args, killPid: +(namespaces?.at(-1) ?? dir) });
  } catch { /* A child may have exited while listing our process tree. */ }
  return [...rows.values()];
};
const before = new Set(processRows().map(p => p.pid));
const work = mkdtempSync(join(tmpdir(), 'cryptoid-full-session-browser-'));
let browser;
try {
  const base = process.env.CRYPTOID_WEBKIT_BASE;
  browser = await webkit.launch({ headless: true, ...(base ? { executablePath: base + '/bin/MiniBrowser', env: {
    ...process.env, PLAYWRIGHT_SKIP_VALIDATE_HOST_REQUIREMENTS: '1', WEBKIT_EXEC_PATH: base + '/bin',
    WEBKIT_INJECTED_BUNDLE_PATH: base + '/lib', WEBKIT_INSPECTOR_RESOURCES_PATH: base + '/share',
    LD_LIBRARY_PATH: base + '/lib:' + base + '/sys/lib:' + process.env.CRYPTOID_WEBKIT_LIBS,
    GST_PLUGIN_SYSTEM_PATH: process.env.CRYPTOID_WEBKIT_LIBS + '/gstreamer-1.0',
  } } : {}) });
  const context = await browser.newContext({ acceptDownloads: true, viewport: { width: 430, height: 825 } });
  await context.route('**/*', route => route.request().url().startsWith(url) ? route.continue() : route.abort());
  const page = await context.newPage(); await page.goto(url); await page.waitForFunction(() => window.ready);
  const recorded = await page.evaluate(() => window.prepareRecording());
  assert.equal(recorded.storage, 'available');
  assert.equal(recorded.sessions.length, 1);
  const summary = recorded.sessions[0]; assert.equal(summary.state, 'recording'); assert.ok(summary.count > 200);
  const rows = processRows(), roots = new Set(rows.filter(p => !before.has(p.pid) && /\/bin\/MiniBrowser\b/.test(p.args)).map(p => p.pid));
  const ours = pid => {
    for (let n = 0; n < 10 && pid; n++) { if (roots.has(pid)) return true; pid = rows.find(p => p.pid === pid)?.parent; }
    return false;
  };
  const content = rows.filter(p => !before.has(p.pid) && /(?:WebKit|WPE)WebProcess/.test(p.args) && ours(p.pid));
  if (content.length !== 1) console.log(JSON.stringify({ nativeChildren: rows.filter(p => !before.has(p.pid) && /(?:ms-playwright|WebKit)/.test(p.args)) }));
  assert.equal(content.length, 1, 'exactly one isolated task-owned WebKit content process');
  const crashed = page.waitForEvent('crash', { timeout: 10_000 });
  process.kill(content[0].killPid, 'SIGKILL'); await crashed;
  const recovered = await context.newPage(); await recovered.goto(url); await recovered.waitForFunction(() => window.ready);
  const errors = []; recovered.on('pageerror', error => errors.push(error.message));
  await recovered.evaluate(() => {
    window.releasedExports = 0;
    const revoke = URL.revokeObjectURL.bind(URL);
    URL.revokeObjectURL = url => { window.releasedExports++; revoke(url); };
    window.shareCalls = 0;
    Object.defineProperty(navigator, 'canShare', { configurable: true, value: data => data.files?.[0]?.type === 'text/plain' });
    Object.defineProperty(navigator, 'share', { configurable: true, value: data => {
      window.shareCalls++; window.shareHadActivation = navigator.userActivation.isActive; window.sharedFile = data.files[0];
      return Promise.reject(new DOMException('user cancelled test picker', 'AbortError'));
    } });
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async () => { throw new DOMException('blocked test clipboard', 'NotAllowedError'); } } });
  });
  await recovered.evaluate(() => window.mountPanel());
  const downloadButton = recovered.getByRole('button', { name: 'Gesamtlauf herunterladen', exact: true });
  await downloadButton.waitFor();
  assert.ok(await recovered.getByText('Für diesen Lauf wurde kein Abschluss gespeichert.', { exact: true }).isVisible());
  const checks = await recovered.evaluate(() => window.ownerChecks);
  await downloadButton.click();
  assert.equal(await recovered.evaluate(() => window.shareCalls), 0, 'preparing never launches a picker automatically');
  await recovered.getByRole('button', { name: 'Datei teilen / sichern', exact: true }).click();
  await recovered.getByText('Teilen wurde abgebrochen. Dein gespeicherter Lauf bleibt erhalten.', { exact: true }).waitFor();
  assert.equal(await recovered.evaluate(() => window.shareHadActivation), true, 'native WebKit tap activation survives until share invocation');
  assert.match(await recovered.evaluate(() => window.sharedFile.name), /\.json\.txt$/);
  const fileLink = recovered.getByRole('link', { name: 'Datei herunterladen', exact: true });
  await fileLink.waitFor();
  const downloadEvent = recovered.waitForEvent('download'); await fileLink.click();
  const download = await downloadEvent, path = join(work, 'full-session.json'); await download.saveAs(path);
  assert.equal(await recovered.evaluate(() => window.ownerChecks), checks + 1, 'download re-verifies the owner');
  const raw = readFileSync(path, 'utf8'), data = JSON.parse(raw);
  assert.equal(data.format, 'cryptoid-full-session-report'); assert.equal(data.integrity.contiguous, true);
  assert.equal(await recovered.evaluate(() => window.sharedFile.text()), raw, 'share file and download contain the exact same complete run');
  assert.equal(data.summary.lastSeq, summary.lastSeq); assert.equal(data.integrity.records, summary.count);
  assert.equal(data.records.filter(r => r.kind === 'start').length, 1);
  assert.equal(data.records[0].data.operation, 'transition-before', 'pre-first-frame observations are retained too');
  assert.ok(!data.records.some(r => r.kind === 'end'));
  assert.ok(data.records.some(r => r.kind === 'sample' && r.data.sector === 1));
  assert.ok(data.records.some(r => r.data.operation === 'first-spawn-before' && r.data.sector === 34));
  assert.ok(!raw.includes('excluded-private')); assert.deepEqual(errors, []);
  await downloadButton.click();
  const secondDownload = recovered.waitForEvent('download'); await fileLink.click(); await secondDownload;
  assert.equal(await recovered.evaluate(() => window.releasedExports), 1, 'a second export releases the previous Blob URL');
  // The failed-download fallback uses the same existing run, with no mutation.
  await recovered.getByRole('button', { name: 'Gesamtlauf als Text anzeigen', exact: true }).click();
  const textField = recovered.getByRole('textbox', { name: /Gesamtlauf · Teil/ });
  await textField.waitFor();
  const pieces = [];
  for (;;) {
    pieces.push(JSON.parse(await textField.inputValue()));
    const next = recovered.getByRole('button', { name: 'Nächster Teil', exact: true });
    if (!await next.isEnabled()) break;
    await next.click();
  }
  assert.equal(pieces.map(part => part.data).join(''), raw, 'manual parts reconstruct every byte of the original run');
  await recovered.getByRole('button', { name: 'Vorheriger Teil', exact: true }).click();
  const checksBeforeCopy = await recovered.evaluate(() => window.ownerChecks);
  await recovered.getByRole('button', { name: 'Diesen Teil kopieren', exact: true }).click();
  await recovered.getByText('Bitte diesen markierten Teil über das Kopiermenü kopieren und im Chat einfügen.', { exact: true }).waitFor();
  assert.equal(await recovered.evaluate(() => window.ownerChecks), checksBeforeCopy + 1);
  assert.equal(await textField.evaluate(el => el.selectionEnd - el.selectionStart), (await textField.inputValue()).length);
  const unchanged = await recovered.evaluate(() => window.recordingSummary());
  assert.equal(unchanged.sessions[0].lastSeq, summary.lastSeq, 'transfer never changes the existing recording');
  assert.equal(unchanged.sessions[0].bytes, summary.bytes);
  assert.deepEqual(errors, []);
  await recovered.evaluate(() => { window.ownerAllowed = false; });
  await downloadButton.click();
  await recovered.getByText('owner_access_required', { exact: true }).waitFor();
  assert.equal(await recovered.locator('textarea').count(), 0);
  assert.equal(await recovered.getByRole('button', { name: 'Gesamtlauf herunterladen', exact: true }).count(), 0);
  console.log(JSON.stringify({ engine: 'WebKit', viewport: '430x825', controlledContentProcessKill: true,
    committedRecords: data.integrity.records, committedChunks: data.integrity.chunks, bytes: Buffer.byteLength(raw),
    startRetained: true, lastCommittedBoundaryRetained: true, contiguous: true,
    actualOwnerPanelDownload: true, freshPermissionChecks: true, revokedPermissionBlocksDownload: true,
    explicitNativeTap: true, textFallbackParts: pieces.length, exactTextReassembly: true, manualCopyFallback: true,
    repeatedExportReleasesPreviousBlob: true,
    pageErrors: errors.length, scope: 'synthetic probe, native IndexedDB/process loss, actual Admin export; no physical device or crash-cause proof' }));
} finally {
  await browser?.close(); server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); rmSync(work, { recursive: true, force: true });
}
