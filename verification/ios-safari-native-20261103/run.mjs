import assert from 'node:assert/strict';
import { execFileSync, spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { mkdirSync, readFileSync, readdirSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, relative } from 'node:path';
import { pathToFileURL } from 'node:url';
import { SafariClient, delay } from './safariClient.mjs';
import { sampleNativeMemory } from './nativeMemory.mjs';
import { readSourceState } from '../mobile-30m-source-proof-20261102/sourceState.mjs';
import { STOPWATCH_KEY } from '../boss2-stopwatch-20261029/stopwatchState.mjs';
import { createEvidenceWriter } from './evidenceOutput.mjs';

const SOURCE = 'ac98e95166b0e2013186257904da46323840dab5';
const TREE = '99092ec24e843fb1e419dc382bc2523a4edc0b42';
const CLOCK = '5e5845d5e5beef85ca5dadac597b8d751e81f931374b942b22fdedc7d83bbb5c';
const [candidateArg, outputArg, phase] = process.argv.slice(2);
assert.equal(process.platform, 'darwin'); assert.ok(['pilot', 'soak'].includes(phase));
const candidate = resolve(candidateArg), outputRoot = resolve(outputArg), output = resolve(outputRoot, phase);
mkdirSync(output, { recursive: true });
const simulator = JSON.parse(readFileSync(resolve(outputRoot, 'simulator.json'), 'utf8'));
assert.equal(simulator.booted, true);
const seconds = phase === 'pilot' ? 60 : 1800;
const git = ref => execFileSync('git', ['rev-parse', ref], { cwd: candidate, encoding: 'utf8' }).trim();
assert.equal(git('HEAD'), SOURCE); assert.equal(git('HEAD^{tree}'), TREE);
const sourceState = readSourceState(candidate);
const toolsRoot = resolve(process.env.RUNNER_TEMP, 'cryptoid-appium-tools');
const appiumHome = resolve(process.env.RUNNER_TEMP, 'cryptoid-appium-home');
assert.equal(process.env.APPIUM_HOME, appiumHome, 'Dedicated disposable Appium home');
const toolPackage = path => JSON.parse(readFileSync(path, 'utf8'));
const appiumPackage = toolPackage(resolve(toolsRoot, 'node_modules/appium/package.json'));
const xcuitestPackage = toolPackage(resolve(appiumHome, 'node_modules/appium-xcuitest-driver/package.json'));
assert.equal(appiumPackage.version, '3.9.0'); assert.equal(xcuitestPackage.version, '12.22.8');
execFileSync(process.execPath, ['verification/device-resource-checkpoint-20261102/verifyPackage.mjs'],
  { cwd: candidate, stdio: 'inherit' });
const site = resolve(candidate, 'verification/boss2-forensics-20261028/results/device-preview/site');
const digest = file => createHash('sha256').update(readFileSync(file)).digest('hex');
const manifest = [];
function collect(directory) { for (const entry of readdirSync(directory, { withFileTypes: true })) {
  const path = resolve(directory, entry.name);
  if (entry.isDirectory()) collect(path);
  else manifest.push({ path: relative(site, path), bytes: readFileSync(path).length, sha256: digest(path) });
} }
collect(site); manifest.sort((a, b) => a.path.localeCompare(b.path));
const info = JSON.parse(readFileSync(resolve(site, 'device-preview-info.json'), 'utf8'));
assert.equal(info.sourceCommit, SOURCE); assert.equal(info.sourceTree, TREE);
assert.equal(info.diagnosticStopwatch.stateSha256, CLOCK);
for (const key of ['liveBackend', 'actualPiAuthentication', 'payments', 'automaticResume', 'automaticUpload'])
  assert.equal(info[key], false);
assert.equal(info.guestOnly, true); assert.equal(info.directStyleDeviceCandidate.activeFrameProbeIncluded, false);
const require = createRequire(resolve(candidate, 'frontend/package.json'));
const result = { version: 1, phase, complete: false, sourceCommit: SOURCE, sourceTree: TREE,
  sourceClockSha256: CLOCK, sourceState, startedAt: new Date().toISOString(),
  nativeHostOS: process.platform, simulator, requestedActiveSeconds: seconds,
  driverBackend: 'appium-xcuitest', toolVersions: { appium: appiumPackage.version, xcuitest: xcuitestPackage.version },
  physicalDevice: false, physicalPiBrowser: false, whiteScreenFixed: false,
  clocksAccelerated: false, automaticResume: false, additionalFullRecording: false,
  gameSourceEdited: false, servedPackageEdited: false, activeScreenshots: false,
  extraGameCollectors: false, newGameTimers: false, newAnimationFrames: false,
  installedPackages: Object.fromEntries(['react', 'react-dom', 'react-router-dom', 'vite', 'typescript']
    .map(name => [name, require(name + '/package.json').version])),
  builtPackageManifest: manifest, sameAsRemoteVercelBytesVerified: false,
  memoryComparisonEligible: false, nativePhysicalTerminationCauseMeasured: false,
  browserConsoleEventsMeasured: false, fullNetworkMeasured: false,
  limits: ['Apple iOS simulator Safari, not a physical iPhone or Pi Browser.',
    'Frozen source is built on macOS. All served files are hashed before and after each flow; remote Preview byte identity is not claimed.',
    'The simulator has host memory and graphics constraints, not a phone GPU or phone Jetsam limit.',
    'Host RSS of discovered simulator services is a partial process measurement, not unique/PSS memory or total browser/GPU allocation.',
    'Appium XCUITest and a companion WebDriverAgent control MobileSafari in a disposable simulator. This is a different driver from Apple safaridriver.',
    'The companion process and Web Inspector connection can affect the environment. Camera, screen recording and real phone interruptions are not reproduced.',
    'No active screenshots, forced GC or heap snapshots. DOM/clock liveness does not establish native displayed pixel correctness.',
    'Any unexpected pause, document replacement or stalled frame fails; the harness never resumes it automatically.'], cycles: [] };
let server, driverProcess, driver;
const record = createEvidenceWriter();
const observeScript = `return {timeOrigin:performance.timeOrigin, hidden:document.hidden,
  scene:window.__crossDeviceTest?.inspect() ?? null,
  clock:JSON.parse(localStorage.getItem(${JSON.stringify(STOPWATCH_KEY)}) || 'null'),
  brief:JSON.parse(localStorage.getItem('cryptoid_private_brief_v1') || 'null'),
  mounted:!!document.querySelector('.game-shell')};`;
const observe = () => driver.execute(observeScript);
function verifyActive(observed, first) {
  assert.equal(observed.timeOrigin, first.timeOrigin, 'Same document');
  assert.equal(observed.hidden, false); assert.equal(observed.mounted, true);
  assert.equal(observed.scene?.status, 'playing', 'Unexpected pause fails without automatic resume');
  assert.equal(observed.scene.technicalPause, false);
  assert.equal(observed.scene.encounter, 'boss-fight'); assert.equal(observed.scene.sector, 20);
  assert.equal(observed.scene.reactorOpen, true); assert.equal(observed.scene.ownerDiagnostics, false);
  assert.deepEqual(observed.scene.buildFlags, { development: false, production: true });
  assert.equal(observed.clock?.latest?.source, SOURCE);
  assert.equal(observed.clock.latest.id, first.clock.latest.id);
  assert.equal(observed.clock.latest.mode, 'running'); assert.equal(observed.clock.latest.unobservedGaps, 0);
}
const waitMode = mode => driver.waitFor(async () => (await observe()).clock?.latest?.mode === mode, 'clock ' + mode);
try {
  const { serveDevicePreview } = await import(pathToFileURL(resolve(candidate,
    'verification/boss2-forensics-20261028/devicePreviewServer.mjs')).href);
  server = await serveDevicePreview();
  driverProcess = spawn(process.execPath, [resolve(toolsRoot, 'node_modules/appium/index.js'),
    '--address', '127.0.0.1', '--port', '4444', '--log-level', 'warn', '--log-no-colors',
    '--log', resolve(output, 'appium.log')], { stdio: ['ignore', 'inherit', 'inherit'] });
  let driverFailure; driverProcess.once('error', error => { driverFailure = String(error.message); });
  driver = new SafariClient();
  await driver.waitFor(async () => {
    assert.ok(!driverFailure, driverFailure);
    try { return !!await driver.request('GET', '/status'); } catch { return false; }
  }, 'Appium WebDriver server', 30000);
  result.capabilities = await driver.start(simulator.udid, server.origin);
  await driver.command('POST', '/timeouts', { script: 30000, pageLoad: 90000, implicit: 0 });
  await driver.waitFor(() => driver.execute(`return location.origin === arguments[0]
    && document.readyState !== 'loading';`, [server.origin]), 'initial native deeplink loads the local guest document');
  result.initialLocalGuestDeeplinkVerified = true;
  result.environment = await driver.execute(`return {userAgent:navigator.userAgent, platform:navigator.platform,
    width:innerWidth,height:innerHeight,devicePixelRatio,secureContext:isSecureContext,origin:location.origin};`);
  assert.match(result.environment.userAgent, /iPhone/); assert.equal(result.environment.secureContext, true);
  await record('BROWSER_READY', { phase, capabilities: result.capabilities, environment: result.environment });
  for (let cycle = 0; cycle < 3; cycle++) {
    const row = { cycle, requestedActiveMs: (cycle ? 10 : seconds) * 1000, complete: false, nativePoints: 0 };
    result.cycles.push(row);
    const toggles = await driver.execute(`return [...document.querySelectorAll('input[type=checkbox]')].map(x=>x.checked);`);
    assert.deepEqual(toggles, [false, true], 'Full recording off and existing collision/end protection on');
    await driver.clickButton('Testszene vorbereiten'); await driver.clickButton('Boss-2-Test öffnen');
    await driver.waitFor(async () => (await observe()).scene?.status === 'paused', 'initial authored pause');
    await driver.click('.pause-resume-button'); await waitMode('running');
    await driver.waitFor(async () => { const s = (await observe()).scene;
      return s?.status === 'playing' && s.encounter === 'boss-fight' && s.reactorOpen; }, 'authored boss intro finishes');
    const first = await observe(); verifyActive(first, first);
    row.initialPlayer = first.scene.player; assert.ok(Math.abs(first.scene.player.x - .5) < .02);
    await driver.waitFor(async () => {
      const p = (await observe()).brief?.latest?.resourceCheckpoint;
      return p?.clockId === first.clock.latest.id && p.frameAt > 0 && p.audioBufferBytes > 0 && p.canvasFailureCount === 0;
    }, 'existing resource checkpoint');
    const firstMemory = sampleNativeMemory(simulator.udid);
    await record('MEMORY_PREFLIGHT', { phase, cycle, ...firstMemory });
    assert.equal(firstMemory.webContentObserved, true, 'Require actual simulator WebContent RSS before a timed run');
    const started = Date.now(); let previous = first, progressAt = started, sampledAt = 0;
    while (previous.clock.latest.elapsedMs - first.clock.latest.elapsedMs < row.requestedActiveMs) {
      assert.ok(Date.now() - started < row.requestedActiveMs * 2 + 90000, 'Wall-time budget');
      const point = await observe(); verifyActive(point, first);
      assert.ok(point.clock.latest.elapsedMs >= previous.clock.latest.elapsedMs, 'Monotonic active clock');
      if (point.scene.frameAt > previous.scene.frameAt) progressAt = Date.now();
      assert.ok(Date.now() - progressAt < 5000, 'Frame progress');
      if (Date.now() - sampledAt >= 5000) {
        sampledAt = Date.now(); const memory = sampleNativeMemory(simulator.udid);
        const sample = { phase, cycle, activeMs: point.clock.latest.elapsedMs - first.clock.latest.elapsedMs,
          frameAt: point.scene.frameAt, coreVolley: point.scene.coreVolley, player: point.scene.player,
          audio: point.scene.audio, canvas: point.scene.canvas, memory };
        row.nativePoints++; await record('POINT', sample);
        if (!row.firstMemory) row.firstMemory = memory; row.lastMemory = memory;
        assert.equal(memory.webContentObserved, true, 'Native process observations must remain available');
      }
      previous = point; await delay(1000);
    }
    row.observedActiveMs = previous.clock.latest.elapsedMs - first.clock.latest.elapsedMs;
    row.observedWallMs = Date.now() - started;
    assert.ok(previous.scene.coreVolley > first.scene.coreVolley, 'Real reactor volleys advance');
    await driver.click('.pause-control'); await waitMode('paused');
    const paused = await observe(); await delay(1600); const held = await observe();
    assert.equal(held.clock.latest.elapsedMs, paused.clock.latest.elapsedMs);
    assert.equal(held.scene.coreVolley, paused.scene.coreVolley); row.pauseFreezeVerified = true;
    await driver.click('.pause-resume-button'); await waitMode('running');
    await driver.click('.mission-shop-access'); await waitMode('paused');
    await driver.click('.weapon-drawer-tab'); await waitMode('running'); row.weaponRoundtripVerified = true;
    await driver.click('.home-control');
    await driver.click('.game-overlay[aria-labelledby="leave-mission-title"] .button-primary');
    await waitMode('ended');
    const closed = await observe(); assert.equal(closed.mounted, false); row.normalExitVerified = true;
    // The same post-unmount QA bridge cleanup as the existing Linux driver.
    await driver.execute('delete window.__crossDeviceTest; return true;');
    row.qaInspectionBridgeReleased = true; row.complete = true;
    await record('CYCLE', { phase, ...row });
  }
  await driver.clickButton('Letzten Testbericht vorbereiten');
  await driver.clickButton('Berichtstext in Teilen anzeigen');
  const part = await driver.waitFor(async () => {
    const text = await driver.execute(`return document.querySelector('textarea[aria-label="Diagnosebericht"]')?.value || null;`);
    return text ? JSON.parse(text) : null;
  }, 'normal report text');
  assert.equal(part.total, 1); const report = JSON.parse(part.data);
  assert.equal(report.fullSession, null); assert.equal(report.briefMatchesLatestStopwatch, true);
  assert.equal(report.stopwatch.latest.mode, 'ended');
  assert.equal(report.briefDiagnostics.latest.options.fullRecording, false);
  assert.equal(report.reportDocumentOrigin, server.origin);
  assert.equal(report.briefDiagnostics.latest.resourceCheckpoint.clockId, report.stopwatch.latest.id);
  result.normalReportVerified = true;
  await record('NORMAL_REPORT', { phase, report });
  result.complete = true;
} catch (error) {
  result.failure = { message: String(error.message).slice(0, 4096), at: new Date().toISOString() };
  if (driver?.session) try { result.lastObservation = await observe(); } catch { result.lastObservationUnavailable = true; }
  result.failureMemory = sampleNativeMemory(simulator.udid); process.exitCode = 1;
} finally {
  try {
    const logs = execFileSync('xcrun', ['simctl', 'spawn', simulator.udid, 'log', 'show', '--last', '3m',
      '--style', 'compact', '--predicate',
      'process == "MobileSafari" OR process CONTAINS[c] "WebKit" OR eventMessage CONTAINS[c] "jetsam" OR eventMessage CONTAINS[c] "WebContent"'],
      { encoding: 'utf8', timeout: 30000, maxBuffer: 2 ** 22 });
    await record('NATIVE_LOG_TAIL', { phase, lastMinutes: 3, originalCharacters: logs.length,
      truncated: logs.length > 65536, text: logs.slice(-65536) });
  } catch (error) {
    await record('NATIVE_LOG_UNAVAILABLE', { phase, message: String(error.message).slice(0, 1000) });
  }
  try {
    assert.deepEqual(readSourceState(candidate), sourceState);
    for (const file of manifest) assert.equal(digest(resolve(site, file.path)), file.sha256, file.path);
    execFileSync(process.execPath, ['verification/direct-boss-style-device-20261102/verifyScope.mjs'],
      { cwd: candidate, stdio: 'inherit' }); result.sourceAndPackageUnchangedVerified = true;
  } catch (error) {
    result.complete = false; result.integrityFailure = String(error.message).slice(0, 4096); process.exitCode = 1;
  }
  if (driver?.session) try { await driver.close(); } catch (error) {
    result.complete = false; result.cleanupFailure = String(error.message).slice(0, 2000); process.exitCode = 1;
  }
  driverProcess?.kill('SIGTERM');
  const driverLog = resolve(output, 'appium.log');
  if (existsSync(driverLog)) {
    const text = readFileSync(driverLog, 'utf8');
    await record('DRIVER_LOG_TAIL', { phase, originalCharacters: text.length, truncated: text.length > 65536,
      text: text.slice(-65536) });
  }
  if (server) await server.close();
  result.finishedAt = new Date().toISOString();
  writeFileSync(resolve(output, 'receipt.json'), JSON.stringify(result, null, 2) + '\n');
  await record('RESULT', result);
}
