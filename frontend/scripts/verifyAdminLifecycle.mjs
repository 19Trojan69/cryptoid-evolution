// Local production bundle with synthetic authentication transport only.
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { once } from 'node:events';
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, extname } from 'node:path';

const dist = resolve('frontend/dist');
const fixture = process.env.CRYPTOID_STARTUP_FIXTURE_ROOT;
const fonts = new Map(JSON.parse(readFileSync(fixture + '/route-font-manifest.json')).map(r => [r.url, readFileSync(fixture + '/' + r.path)]));
const css = readFileSync(fixture + '/route-fonts.css', 'utf8');
const html = readFileSync(dist + '/index.html', 'utf8').replaceAll('$$BACKEND_URL$$', '/api').replace(/appNetwork:\s*""/, 'appNetwork: "testnet"');
const types = { '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.mp3': 'audio/mpeg' };
const server = createServer((req, res) => {
  const path = new URL(req.url, 'http://local').pathname;
  const file = resolve(dist, '.' + path);
  if (file.startsWith(dist + '/') && existsSync(file) && extname(file)) {
    res.setHeader('Content-Type', types[extname(file)] || 'application/octet-stream'); res.end(readFileSync(file));
  } else { res.setHeader('Content-Type', 'text/html'); res.end(html); }
});
server.listen(0, '127.0.0.1'); await once(server, 'listening');
const origin = 'http://127.0.0.1:' + server.address().port;
const require = createRequire(import.meta.url);
const engine = process.env.CRYPTOID_STARTUP_ENGINE || 'chromium';
const pw = require(process.env.CRYPTOID_PLAYWRIGHT_PACKAGE || process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES + '/playwright');
const report = { engine, passed: false, syntheticAuthentication: true, noLiveAccounts: true, results: [] };
let browser;
try {
  browser = await pw[engine].launch({ headless: true, executablePath: process.env.CRYPTOID_BROWSER_EXECUTABLE });
  report.version = browser.version();
  for (const mode of ['owner', 'non-owner', 'server-revoked']) {
    const row = { mode, passed: false, pageErrors: [], statusRequests: 0, unexpected: [] }; report.results.push(row);
    const context = await browser.newContext({ locale: 'de-AT', viewport: { width: 1024, height: 768 } });
    await context.addInitScript(() => {
      localStorage.setItem('cryptoid_pi_session', 'synthetic-session');
      const get = Storage.prototype.getItem;
      window.__evidenceReads = 0;
      Storage.prototype.getItem = function(key) { if (key === 'cryptoid_owner_lifecycle_v1') window.__evidenceReads++; return get.call(this, key); };
    });
    await context.route('**/*', route => {
      const url = route.request().url(), path = new URL(url).pathname;
      if (url.startsWith('https://fonts.googleapis.com/')) return route.fulfill({ contentType: 'text/css', body: css });
      if (fonts.has(url)) return route.fulfill({ contentType: 'font/ttf', body: fonts.get(url) });
      if (url === 'https://sdk.minepi.com/pi-sdk.js') return route.fulfill({ contentType: 'text/javascript', body: 'window.Pi={init(){},getPiHostAppInfo:async()=>({hostApp:"web"})};' });
      if (url.startsWith(origin + '/api/')) {
        let status = 200, data = {};
        if (path === '/api/user/me') data = { user: { uid: 'synthetic', username: 'synthetic' }, canAdmin: mode !== 'non-owner', adminMode: false };
        else if (path === '/api/admin/status') {
          row.statusRequests++;
          status = mode === 'server-revoked' ? 403 : 200;
          data = status === 200 ? { canAdmin: true, username: 'synthetic', services: {}, game: {} } : { error: 'not_authorized' };
        } else { status = 501; }
        return route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(data) });
      }
      if (url.startsWith(origin + '/') || url.startsWith('data:') || url.startsWith('blob:')) return route.continue();
      row.unexpected.push(url); return route.abort();
    });
    const page = await context.newPage(); page.on('pageerror', e => row.pageErrors.push(e.message));
    await page.goto(origin + '/admin?view=diagnostics');
    if (mode === 'non-owner') {
      await page.getByText('Kein Admin-Zugriff', { exact: true }).waitFor();
      assert.equal(await page.locator('textarea').count(), 0);
      row.evidenceReads = await page.evaluate(() => window.__evidenceReads);
      assert.equal(row.evidenceReads, 0); assert.equal(row.statusRequests, 0);
    } else {
      if (mode === 'owner') {
        await page.locator('textarea').waitFor();
        await page.waitForFunction(() => document.querySelector('textarea')?.value.includes('ownerLifecycle'));
        const data = JSON.parse(await page.locator('textarea').inputValue());
        assert.equal(data.ownerLifecycle.format, 'cryptoid-owner-lifecycle-report');
        assert.ok(data.ownerLifecycle.events.some(e => e.kind === 'document-start'));
        row.lifecycleEvents = data.ownerLifecycle.events.length;
        row.noPublicGlobal = await page.evaluate(() => window.CryptoidPrivatePreviewEvidence === undefined);
        assert.equal(row.noPublicGlobal, true);
      } else {
        await page.getByRole('alert').first().waitFor();
        assert.equal(await page.locator('textarea').count(), 0);
        assert.equal(await page.getByRole('button', { name: 'Bericht kopieren', exact: true }).isEnabled(), false);
      }
      assert.ok(row.statusRequests >= 1);
    }
    assert.deepEqual(row.pageErrors, []); assert.deepEqual(row.unexpected, []);
    row.passed = true;
    await context.close();
  }
  report.passed = true;
} finally {
  writeFileSync(`docs/testnet-admin-lifecycle-20261025/${engine}-admin.json`, JSON.stringify(report, null, 2) + '\n');
  await browser?.close(); await new Promise(r => server.close(r));
}
console.log(JSON.stringify(report));
