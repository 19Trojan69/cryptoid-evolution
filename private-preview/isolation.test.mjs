import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { runInNewContext } from 'node:vm';
import { previewReply } from './api.mjs';
import handler from './api.mjs';
import { useAuth } from './auth.mjs';
import { packagePreview } from './packagePreview.mjs';

test('guest fixture cannot access a stored session or redirect to OAuth', async () => {
  const guest = useAuth();
  assert.equal(guest.user, null); assert.equal(guest.isAuthenticated, false);
  assert.equal(guest.canAdmin, false); assert.equal(guest.adminMode, false);
  assert.equal(guest.authReady, true);
  await guest.signIn(); await guest.signOut(); await guest.refreshSession();
  guest.requireAuth(); assert.equal(useAuth(), guest);
  await assert.rejects(guest.setAdminPreview(true));
});
test('every preview fixture is disabled outside Preview', () => {
  for (const environment of [undefined, 'production', 'development'])
    assert.equal(previewReply('GET', '/api/user/me', environment).status, 403);
});
test('allowed reads never manufacture a user, inventory, rewards or leaderboard', () => {
  assert.deepEqual(previewReply('GET', '/api/user/me', 'preview').body, { user: null, canAdmin: false, adminMode: false });
  assert.deepEqual(previewReply('GET', '/api/hangar/catalog', 'preview').body, { offers: [] });
  assert.deepEqual(previewReply('GET', '/api/leaderboard/top', 'preview').body, { leaders: [], network: 'testnet' });
});
test('account/payment/game mutations and admin routes are denied', () => {
  for (const method of ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'])
    for (const path of ['/api/user/signin', '/api/user/signout', '/api/payments/create', '/api/payments/complete', '/api/game/save', '/api/score', '/api/admin/status', '/api/user/admin-mode'])
      assert.equal(previewReply(method, path, 'preview').status, 403);
});
test('Vercel rewrite handler returns guest response without cookies', () => {
  const old = process.env.VERCEL_ENV; process.env.VERCEL_ENV = 'preview';
  try {
    const headers = {}; let body;
    const res = { setHeader(k, v) { headers[k] = v; }, end(v) { body = JSON.parse(v); } };
    handler({ method: 'GET', url: '/api/index?path=user/me' }, res);
    assert.equal(res.statusCode, 200); assert.equal(body.user, null);
    assert.equal(headers['Cache-Control'], 'no-store'); assert.equal(headers['Set-Cookie'], undefined);
  } finally { if (old === undefined) delete process.env.VERCEL_ENV; else process.env.VERCEL_ENV = old; }
});
test('SDK denies authentication and payment without contacting Pi', async () => {
  const host = { window: {} };
  runInNewContext(readFileSync(new URL('./pi-sdk.js', import.meta.url), 'utf8'), host);
  host.window.Pi.init({ version: '2.0' });
  await assert.rejects(host.window.Pi.authenticate());
  await assert.rejects(host.window.Pi.signIn());
  assert.throws(() => host.window.Pi.createPayment());
});
test('production packaging aborts before touching output', () => {
  assert.throws(() => packagePreview('/does-not-exist', 'production', {}), /Private preview only/);
});
test('packaged original entry/init/startup guard survive with isolated transport', () => {
  const dir = mkdtempSync(join(tmpdir(), 'cryptoid-preview-'));
  try {
    const original = readFileSync(new URL('../frontend/index.html', import.meta.url), 'utf8');
    writeFileSync(join(dir, 'index.html'), original);
    packagePreview(dir, 'preview', { sourceCommit: 'test-fixture' });
    const html = readFileSync(join(dir, 'index.html'), 'utf8');
    assert.ok(html.includes('id="cryptoid-startup-recovery"'));
    assert.ok(html.includes('Pi.init({ version: "2.0" });'));
    assert.ok(html.includes('type="module" src="/src/main.tsx"'));
    assert.ok(html.includes('src="/private-preview-sdk.js"'));
    assert.ok(html.includes('backendURL: "/api"')); assert.ok(!html.includes('https://sdk.minepi.com/'));
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
