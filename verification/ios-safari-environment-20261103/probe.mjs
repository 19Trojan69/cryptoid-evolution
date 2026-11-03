import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { createHash } from 'node:crypto';
import { execFileSync, spawn } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync, openSync, closeSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve, dirname } from 'node:path';
import { SafariClient, delay } from '../ios-safari-native-20261103/safariClient.mjs';
import { createEvidenceWriter } from '../ios-safari-native-20261103/evidenceOutput.mjs';

assert.equal(process.platform, 'darwin');
const [outputArg, version] = process.argv.slice(2);
assert.ok(['18.5', '26.2'].includes(version));
const output = resolve(outputArg, version); mkdirSync(output, { recursive: true });
const record = createEvidenceWriter();
const execute = (name, args, timeout = 45000) => {
  const started = Date.now();
  try { return execFileSync(name, args, { encoding: 'utf8', timeout, maxBuffer: 2 ** 20 }).trim(); }
  catch (error) { throw Error(name + ' ' + JSON.stringify(args) + ' failed after '
    + (Date.now() - started) + ' ms: ' + String(error.message)); }
};
const toolsRoot = resolve(process.env.RUNNER_TEMP, 'cryptoid-appium-tools');
const appiumHome = resolve(process.env.RUNNER_TEMP, 'cryptoid-appium-home');
assert.equal(process.env.APPIUM_HOME, appiumHome);
assert.equal(JSON.parse(readFileSync(resolve(toolsRoot, 'node_modules/appium/package.json'))).version, '3.9.0');
assert.equal(JSON.parse(readFileSync(resolve(appiumHome, 'node_modules/appium-xcuitest-driver/package.json'))).version, '12.22.8');
const driverRequire = createRequire(resolve(appiumHome, 'node_modules/appium-xcuitest-driver/package.json'));
let wdaRoot = dirname(driverRequire.resolve('appium-webdriveragent'));
while (!existsSync(resolve(wdaRoot, 'WebDriverAgent.xcodeproj'))) {
  assert.notEqual(wdaRoot, dirname(wdaRoot), 'The installed WebDriverAgent project must exist');
  wdaRoot = dirname(wdaRoot);
}
const wdaVersion = JSON.parse(readFileSync(resolve(wdaRoot, 'package.json'))).version;
const derivedDataPath = resolve(output, 'wda-derived-data');
const result = { version: 1, kind: 'Safari toolchain calibration without the game', complete: false,
  requestedRuntimeVersion: version, startedAt: new Date().toISOString(), gameLoaded: false,
  gameFilesEdited: false, physicalDevice: false, whiteScreenFixed: false,
  tools: { appium: '3.9.0', xcuitest: '12.22.8', webdriveragent: wdaVersion }, nativeTapAttempted: false,
  activeScreenshots: false, postFailureSimulatorScreenshot: false,
  limits: ['A simulator and a constant local HTML page, not Cryptoid Evolution or a phone acceptance test.',
    'Reading native accessibility XML can expose first-launch UI; no unknown dialogs are accepted.',
    'No active screenshots or video. A single simulator image may be captured only after failure, without the game loaded.',
    'No forced GC, payment, account or device-provider service is used.'] };
let udid, server, driverProcess, driver, logFd;
const hostSnapshot = () => ({ at: new Date().toISOString(), vmStat: execute('vm_stat', []),
  swapUsage: execute('sysctl', ['vm.swapusage']), hostMemoryBytes: Number(execute('sysctl', ['-n', 'hw.memsize'])) });
try {
  result.hostBefore = hostSnapshot();
  result.hostArchitecture = execute('uname', ['-m']);
  // Bring up the transport before the simulator competes for resources.
  // A ready transport is required independently of all Safari/game behavior.
  const logPath = resolve(output, 'appium-console.log'); logFd = openSync(logPath, 'a');
  driverProcess = spawn(process.execPath, [resolve(toolsRoot, 'node_modules/appium/index.js'),
    '--address', '127.0.0.1', '--port', '4444', '--log-level', 'info', '--log-no-colors'],
    { stdio: ['ignore', logFd, logFd] });
  result.serverProcessId = driverProcess.pid;
  let spawnError, earlyExit;
  driverProcess.once('error', error => { spawnError = String(error.message); });
  driverProcess.once('exit', (code, signal) => { earlyExit = { code, signal }; });
  driver = new SafariClient();
  const serverStarted = Date.now();
  await driver.waitFor(async () => {
    assert.ok(!spawnError, spawnError);
    assert.ok(!earlyExit, 'Appium exited before readiness: ' + JSON.stringify(earlyExit));
    try { return (await driver.request('GET', '/status')).ready === true; } catch { return false; }
  }, 'Appium server before simulator boot', 60000);
  result.serverStartupMs = Date.now() - serverStarted;
  await record('ENVIRONMENT_SERVER_READY', { version, startupMs: result.serverStartupMs });
  // Read the catalogue obtained by this same job before Appium was installed.
  // The SDK runtime selection is not inferred from a different runner.
  const catalogue = readFileSync(resolve(process.env.RUNNER_TEMP, 'cryptoid-simulator-inventory.json'), 'utf8');
  const inventory = JSON.parse(catalogue);
  result.preinitializedCatalogueBytes = Buffer.byteLength(catalogue);
  const runtime = inventory.runtimes.find(r => r.isAvailable === true
    && r.identifier.startsWith('com.apple.CoreSimulator.SimRuntime.iOS-')
    && (r.version === version || r.version.startsWith(version + '.')));
  assert.ok(runtime, 'The requested runtime must already be installed; no SDK download');
  const type = inventory.devicetypes.find(d => d.identifier === 'com.apple.CoreSimulator.SimDeviceType.iPhone-16-Pro-Max');
  assert.ok(type);
  udid = execute('xcrun', ['simctl', 'create', 'Cryptoid Safari environment ' + version, type.identifier, runtime.identifier]);
  result.simulator = { udid, runtime: { version: runtime.version, identifier: runtime.identifier,
    buildversion: runtime.buildversion }, deviceType: type.identifier };
  await record('ENVIRONMENT_PREFLIGHT', result);
  // Build explicitly before any WebDriver HTTP session request. There is no
  // static-analysis action and no concurrent request waiting for this compiler.
  const buildArgs = ['build-for-testing', '-project', resolve(wdaRoot, 'WebDriverAgent.xcodeproj'),
    '-derivedDataPath', derivedDataPath, '-scheme', 'WebDriverAgentRunner',
    '-destination', 'platform=iOS Simulator,id=' + udid, 'CODE_SIGNING_ALLOWED=NO'];
  const buildLog = resolve(output, 'wda-build.log');
  await record('ENVIRONMENT_WDA_BUILD_START', { version, webdriveragent: wdaVersion,
    command: 'xcodebuild', args: buildArgs, timeoutMs: 360000, gameLoaded: false });
  const buildStarted = Date.now();
  const buildFd = openSync(buildLog, 'w');
  let build;
  try {
    build = await new Promise(resolveBuild => {
      const child = spawn('xcodebuild', buildArgs, { stdio: ['ignore', buildFd, buildFd] });
      let timedOut = false, killTimer;
      const timer = setTimeout(() => {
        timedOut = true; child.kill('SIGTERM');
        killTimer = setTimeout(() => child.kill('SIGKILL'), 5000);
      }, 360000);
      child.once('error', error => {
        clearTimeout(timer); clearTimeout(killTimer);
        resolveBuild({ error: String(error.message), timedOut });
      });
      child.once('exit', (code, signal) => {
        clearTimeout(timer); clearTimeout(killTimer);
        resolveBuild({ code, signal, timedOut });
      });
    });
  } finally { closeSync(buildFd); }
  const buildBytes = readFileSync(buildLog);
  result.wdaBuild = { ...build, elapsedMs: Date.now() - buildStarted,
    logBytes: buildBytes.length, logSha256: createHash('sha256').update(buildBytes).digest('hex'),
    logTruncated: buildBytes.length > 2 ** 21 };
  await record('ENVIRONMENT_WDA_BUILD_LOG', { version, ...result.wdaBuild,
    text: buildBytes.length > 2 ** 21 ? buildBytes.subarray(-(2 ** 21)).toString('utf8') : buildBytes.toString('utf8') });
  assert.equal(build.timedOut, false, 'The separate WebDriverAgent build must finish in its own budget');
  assert.equal(build.code, 0, 'WebDriverAgent must build successfully before native session creation');
  assert.equal(build.signal, null);
  result.wdaBuildCompleted = true;
  execute('xcrun', ['simctl', 'boot', udid]);
  execute('xcrun', ['simctl', 'bootstatus', udid, '-b'], 240000);
  execute('open', ['-a', 'Simulator', '--args', '-CurrentDeviceUDID', udid]);
  result.simulatorBooted = true;
  const html = '<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"><title>Cryptoid Safari environment probe</title></head><body><h1 id="probe-heading">Cryptoid Safari environment probe</h1><button id="probe-tap">Probe touch</button><output id="probe-count">0</output><script>document.getElementById("probe-tap").addEventListener("click",event=>{document.getElementById("probe-count").textContent="1";document.getElementById("probe-count").dataset.trusted=String(event.isTrusted);});</script></body></html>';
  server = createServer((req, res) => res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8',
    'Cache-Control': 'no-store' }).end(html));
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = 'http://127.0.0.1:' + server.address().port;
  result.probeOrigin = origin;
  // Deliberately start in NATIVE_APP. This avoids waiting for a Web Inspector
  // page before we can read which Safari screen the clean simulator displays.
  const session = await driver.request('POST', '/session', { capabilities: { alwaysMatch: {
    platformName: 'iOS', 'appium:automationName': 'XCUITest', 'appium:udid': udid,
    'appium:deviceName': 'iPhone 16 Pro Max', 'appium:platformVersion': version,
    'appium:bundleId': 'com.apple.mobilesafari', 'appium:includeSafariInWebviews': true,
    'appium:nativeWebTap': true, 'appium:disableAutomaticScreenshots': true,
    'appium:skipLogCapture': true, 'appium:safariGarbageCollect': false,
    'appium:usePrebuiltWDA': true, 'appium:derivedDataPath': derivedDataPath, 'appium:showXcodeLog': true,
    'appium:waitForIdleTimeout': 1, 'appium:wdaStartupRetries': 1,
    'appium:wdaLaunchTimeout': 120000, 'appium:newCommandTimeout': 120
  } } }, 240000);
  driver.session = session.sessionId; assert.ok(driver.session);
  assert.equal(String(session.capabilities.platformName).toLowerCase(), 'ios');
  result.nativeSessionCreated = true; result.capabilities = session.capabilities;
  await record('ENVIRONMENT_NATIVE_SOURCE_BEFORE', { version, xml: await driver.command('GET', '/source') });
  result.nativeSourceRead = true;
  await driver.execute('mobile: deepLink', [{ url: origin, bundleId: 'com.apple.mobilesafari' }]);
  await delay(3000);
  await record('ENVIRONMENT_NATIVE_SOURCE_AFTER', { version, xml: await driver.command('GET', '/source') });
  const contexts = await driver.command('GET', '/contexts'); result.contexts = contexts;
  await record('ENVIRONMENT_CONTEXTS', { version, contexts });
  assert.ok(Array.isArray(contexts));
  let webContext;
  for (const context of contexts.filter(c => typeof c === 'string' && c.startsWith('WEBVIEW'))) {
    await driver.command('POST', '/context', { name: context });
    if (await driver.execute('return location.origin;') === origin) { webContext = context; break; }
  }
  assert.ok(webContext, 'The constant local probe must be exposed as an inspectable Safari page');
  result.probeWebContext = webContext;
  result.page = await driver.execute(`return {heading:document.querySelector('#probe-heading')?.textContent,
    userAgent:navigator.userAgent,origin:location.origin,width:innerWidth,height:innerHeight,devicePixelRatio};`);
  assert.equal(result.page.heading, 'Cryptoid Safari environment probe');
  assert.match(result.page.userAgent, /iPhone/);
  await driver.click('#probe-tap'); result.nativeTapAttempted = true;
  const clicked = await driver.execute(`return {count:document.querySelector('#probe-count').textContent,
    trusted:document.querySelector('#probe-count').dataset.trusted};`);
  assert.deepEqual(clicked, { count: '1', trusted: 'true' });
  result.trustedNativeProbeTapVerified = true; result.complete = true;
} catch (error) {
  result.failure = String(error.message).slice(0, 4000); process.exitCode = 1;
  if (error.cause) result.failureCause = { name: String(error.cause.name), code: error.cause.code,
    message: String(error.cause.message).slice(0, 2000) };
  if (udid && result.simulatorBooted) try {
    const path = resolve(output, 'simulator-after-failure.jpeg');
    execute('xcrun', ['simctl', 'io', udid, 'screenshot', '--type=jpeg', path], 20000);
    const bytes = readFileSync(path); assert.ok(bytes.length <= 2 ** 21, 'Bounded failure-only diagnostic image');
    await record('ENVIRONMENT_FAILURE_SCREENSHOT', { version, capturedAfterFailure: true, gameLoaded: false,
      mimeType: 'image/jpeg', bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex'),
      base64: bytes.toString('base64') });
    result.postFailureSimulatorScreenshot = true;
  } catch (error) { result.failureScreenshotUnavailable = String(error.message).slice(0, 1000); }
  if (driver?.session) try {
    await driver.command('POST', '/context', { name: 'NATIVE_APP' });
    await record('ENVIRONMENT_NATIVE_SOURCE_FAILURE', { version, xml: await driver.command('GET', '/source') });
  } catch (error) { result.nativeFailureSourceUnavailable = String(error.message).slice(0, 1000); }
} finally {
  if (driver?.session) try { await driver.close(); } catch (error) {
    result.cleanupFailure = String(error.message).slice(0, 1000); result.complete = false; process.exitCode = 1;
  }
  driverProcess?.kill('SIGTERM');
  if (logFd !== undefined) closeSync(logFd);
  if (server) await new Promise(resolve => server.close(resolve));
  const logPath = resolve(output, 'appium-console.log');
  if (existsSync(logPath)) { const text = readFileSync(logPath, 'utf8');
    await record('ENVIRONMENT_DRIVER_LOG', { version, originalCharacters: text.length,
      truncated: text.length > 128000, text: text.slice(-128000) }); }
  try { result.hostAfter = hostSnapshot(); } catch (error) { result.hostAfterUnavailable = String(error.message); }
  result.finishedAt = new Date().toISOString();
  writeFileSync(resolve(output, 'receipt.json'), JSON.stringify(result, null, 2) + '\n');
  await record('ENVIRONMENT_RESULT', result);
  if (udid) for (const action of ['shutdown', 'delete']) try { execute('xcrun', ['simctl', action, udid]); }
  catch (error) { await record('ENVIRONMENT_CLEANUP', { version, action, message: String(error.message).slice(0, 1000) }); }
}
