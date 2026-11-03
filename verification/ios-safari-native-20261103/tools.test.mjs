import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { SafariClient } from './safariClient.mjs';
import { selectRuntime, parseServices, parseRss } from './nativeMemory.mjs';

test('Only an available pinned iOS runtime can be selected', () => {
  const runtime = (version, available = true, type = 'iOS') => ({ version, isAvailable: available,
    identifier: 'com.apple.CoreSimulator.SimRuntime.' + type + '-' + version });
  assert.equal(selectRuntime([runtime('26.2', false), runtime('26.1'), runtime('26.2', true, 'tvOS')]), undefined);
  assert.equal(selectRuntime([runtime('26.2'), runtime('26.2.1')]).version, '26.2.1');
});
test('RSS joins only numeric process IDs actually enumerated inside the selected simulator', () => {
  const services = parseServices('PID Status Label\n- 0 com.apple.WebKit.WebContent\n42 0 com.apple.WebKit.WebContent\n43 -9 unrelated\n44 0 UIKitApplication:com.apple.mobilesafari[lab]\n');
  assert.deepEqual(services.map(s => s.pid), [42, 44]);
  const rows = parseRss('42 1 12000 /runtime/com.apple.WebKit.WebContent\n43 1 999999 /private/unrelated\n44 1 1000 /runtime/MobileSafari\n', services);
  assert.deepEqual(rows.map(r => [r.pid, r.rssKiB]), [[42, 12000], [44, 1000]]);
});
test('WebDriver protocol errors and desktop fallback fail instead of yielding a green test', async () => {
  let mode = 'error';
  const server = createServer((req, res) => {
    res.setHeader('Content-Type', 'application/json');
    if (mode === 'error') res.writeHead(500).end(JSON.stringify({ value: { error: 'session not created', message: 'simulator unavailable' } }));
    else res.end(JSON.stringify({ value: { sessionId: 'isolated-test', capabilities: { platformName: 'mac' } } }));
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  try {
    const driver = new SafariClient('http://127.0.0.1:' + server.address().port);
    await assert.rejects(driver.start('test-simulator'), /session not created/);
    mode = 'desktop'; await assert.rejects(driver.start('test-simulator'), /Never silently fall back/);
  } finally { await new Promise(resolve => server.close(resolve)); }
});
