import test from 'node:test';
import assert from 'node:assert/strict';
import { readDeviceReturnEvidence } from './deviceReturnEvidence.mjs';

const context = { status: 'playing', phase: 'ATTACK_CYCLE', encounter: 'boss-fight', sector: 20 };
const sourceCommit = 'a'.repeat(40);
const host = (events, marker = null) => ({
  sessionStorage: { getItem: key => key === 'cryptoid_reload_trace_v2' ? JSON.stringify(events)
    : key === 'cryptoid_game_session_v1' ? JSON.stringify(marker) : null },
  performance: { timeOrigin: 80000, getEntriesByType: () => [{ type: 'reload', name: 'private-url' }] },
  location: { pathname: '/', href: 'private-url', search: 'private-token' },
});

test('new document evidence preserves the previous active game and distinct boot identities', () => {
  const result = readDeviceReturnEvidence(host([
    { kind: 'heartbeat', at: 79000, bootId: 'old-document', context: { ...context, sourceCommit } },
    { kind: 'app-boot', at: 80100, bootId: 'new-document', navigationType: 'reload', route: 'home' },
    { kind: 'boot-after-active-session', at: 80100, bootId: 'new-document', context, source: 'session-marker' },
  ], { active: true, at: 79000, context }), 82000);
  assert.deepEqual(result.activeDocument, { startedAt: 80000, ageMs: 2000, navigationType: 'reload', route: 'home' });
  assert.equal(result.evidenceSource, 'current-tab');
  assert.deepEqual(result.reloadTrace.events.map(row => row.bootId), ['old-document', 'new-document', 'new-document']);
  assert.equal(result.reloadTrace.events[0].context.sourceCommit, sourceCommit);
  assert.equal(result.reloadTrace.events[1].context, undefined);
  assert.equal(result.lastSession.context.status, 'playing');
  assert.ok(!JSON.stringify(result).includes('private-'));
});

test('same document and an explicit Home intent remain distinguishable from a new boot', () => {
  const h = host([{ kind: 'home-intent', at: 81000, bootId: 'same-document', context }]);
  h.performance.getEntriesByType = () => [{ type: 'navigate' }];
  const result = readDeviceReturnEvidence(h, 82000);
  assert.equal(result.activeDocument.startedAt, 80000);
  assert.equal(result.activeDocument.navigationType, 'navigate');
  assert.equal(result.reloadTrace.events[0].kind, 'home-intent');
  assert.equal(result.reloadTrace.events.some(row => row.kind === 'app-boot'), false);
});

test('the origin-wide copy from a different tab is never read or merged', () => {
  const h = host([{ kind: 'app-boot', at: 80100, bootId: 'this-tab', route: 'home' }]);
  Object.defineProperty(h, 'localStorage', { get() { throw Error('origin copy must not be accessed'); } });
  assert.equal(readDeviceReturnEvidence(h, 82000).reloadTrace.events[0].bootId, 'this-tab');
  const absent = readDeviceReturnEvidence({ ...host(null), localStorage: {
    getItem: () => JSON.stringify([{ kind: 'app-boot', at: 99999, bootId: 'other-tab' }]),
  } }, 82000);
  assert.equal(absent.reloadTrace, null);
  assert.equal(absent.evidenceSource, 'absent-or-unavailable');
});

test('export keeps the existing sixty-second bound and strips private payloads', () => {
  const rows = Array.from({ length: 200 }, (_, index) => ({ kind: 'heartbeat', at: index * 1000,
    bootId: 'bounded', context: { ...context, score: 1726354, username: 'private-user', token: 'private-token' },
    stack: 'private-stack', url: 'private-url' }));
  const result = readDeviceReturnEvidence(host(rows), 210000);
  assert.equal(result.reloadTrace.windowMs, 60000);
  assert.ok(result.reloadTrace.events.length <= 64);
  assert.equal(result.reloadTrace.events[0].at, 139000);
  assert.equal(result.reloadTrace.events.at(-1).at, 199000);
  assert.ok(!JSON.stringify(result).includes('private-'));
  assert.ok(!JSON.stringify(result).includes('1726354'));
});

test('missing, denied, invalid and oversized tab storage report missing evidence without throwing', () => {
  const denied = {};
  for (const key of ['sessionStorage', 'performance', 'location']) {
    Object.defineProperty(denied, key, { get() { throw Error('denied'); } });
  }
  for (const h of [{}, denied, { sessionStorage: { getItem: () => '{invalid' } },
    { sessionStorage: { getItem: () => 'x'.repeat(131073) } }]) {
    const result = readDeviceReturnEvidence(h, 82000);
    assert.equal(result.reloadTrace, null);
    assert.equal(result.activeDocument, null);
    assert.equal(result.evidenceSource, 'absent-or-unavailable');
  }
});

test('reading an export neither writes storage nor changes navigation or starts a collector', () => {
  const h = host([{ kind: 'app-boot', at: 80100, bootId: 'readonly', route: 'home' }]);
  for (const key of ['setItem', 'removeItem', 'clear']) h.sessionStorage[key] = () => assert.fail('storage mutation');
  for (const key of ['setTimeout', 'setInterval', 'requestAnimationFrame', 'fetch', 'addEventListener']) h[key] = () => assert.fail('new observation');
  h.location.assign = h.location.replace = () => assert.fail('navigation');
  assert.equal(readDeviceReturnEvidence(h, 82000).reloadTrace.events.length, 1);
  assert.equal(h.location.pathname, '/');
});
