import test from 'node:test';
import assert from 'node:assert/strict';
import { componentHost } from './componentTestHost.mjs';
import { adminText } from '../src/adminLocale.ts';
import { integrationQuality, INTEGRATION_REFRESH_MS, RESPONSE_SCALE_MS, startIntegrationPolling } from '../src/pages/adminIntegrationHealth.ts';

const check = (responseMs, status = 'ok') => ({ id: 'database', label: 'MongoDB-Verbindung', status, responseMs, detail: 'Leseabfrage' });
const report = n => ({ checkedAt: `2026-11-19T09:03:${String(n).padStart(2, '0')}Z`, checks: [check(98)],
  nfts: { purchasable: false, ownerReleased: false, walletSigning: 'not_verified', reservationMode: false, checks: [], explanation: 'Noch offen' } });

function clockHost() {
  let visible = true, online = true, subscriber = null, time = 0, nextId = 1;
  const timers = new Map();
  const host = {
    isVisible: () => visible, isOnline: () => online,
    subscribe(fn) { subscriber = fn; return () => { subscriber = null; }; },
    setTimer(fn, delay) { const id = nextId++; timers.set(id, { fn, at: time + delay }); return id; },
    clearTimer(id) { timers.delete(id); },
  };
  return { host, timers,
    get subscribed() { return Boolean(subscriber); },
    visibility(value) { visible = value; subscriber?.(); },
    connectivity(value) { online = value; subscriber?.(); },
    advance(ms) {
      const until = time + ms;
      while (true) {
        const next = [...timers].sort((a, b) => a[1].at - b[1].at)[0];
        if (!next || next[1].at > until) break;
        time = next[1].at; timers.delete(next[0]); next[1].fn();
      }
      time = until;
    },
  };
}
const flush = async () => { for (let i = 0; i < 15; i++) await Promise.resolve(); };
function polling() {
  const clock = clockHost(), requests = [], results = [], errors = [], busy = [], modes = [];
  const poll = startIntegrationPolling({ host: clock.host,
    request: signal => new Promise((resolve, reject) => requests.push({ signal, resolve, reject })),
    onResult: result => results.push(result), onError: error => { errors.push(error); return error !== 'denied'; },
    onBusy: value => busy.push(value), onMode: mode => modes.push(mode),
  });
  return { ...clock, clock, requests, results, errors, busy, modes, ...poll };
}

test('latency thresholds include the screenshot values and exact color boundaries', () => {
  for (const [ms, tone] of [[0, 'good'], [98, 'good'], [284, 'good'], [500, 'good'], [501, 'fair'], [592, 'fair'], [1000, 'fair'], [1001, 'slow'], [2500, 'slow'], [2501, 'bad'], [4000, 'bad'], [9000, 'bad']]) {
    assert.equal(integrationQuality(check(ms)).tone, tone, String(ms));
  }
});

test('unknown evidence stays neutral, failures turn red, warnings never look healthy, stale values lose their glow', () => {
  assert.equal(integrationQuality(check(592, 'unknown')).tone, 'unknown');
  assert.equal(integrationQuality(check(592, 'unknown')).responseMs, null);
  assert.equal(integrationQuality(check(2, 'error')).tone, 'bad');
  assert.equal(integrationQuality(check(2, 'warning')).tone, 'slow');
  for (const status of ['ok', 'warning', 'error', 'unknown']) {
    assert.equal(integrationQuality(check(98, status), true).tone, 'unknown');
    assert.equal(integrationQuality(check(98, status), true).responseMs, null);
  }
  for (const ms of [-1, NaN, Infinity]) assert.equal(integrationQuality(check(ms)).tone, 'unknown');
});

test('one immediate read, no overlap, then a single 15-second timer after completion', async () => {
  const p = polling();
  assert.equal(p.requests.length, 1);
  p.refresh(); p.advance(60_000);
  assert.equal(p.requests.length, 1);
  assert.equal(p.timers.size, 0);
  p.requests[0].resolve('first'); await flush();
  assert.deepEqual(p.results, ['first']);
  assert.equal(p.timers.size, 1);
  p.advance(INTEGRATION_REFRESH_MS - 1);
  assert.equal(p.requests.length, 1);
  p.advance(1);
  assert.equal(p.requests.length, 2);
  p.advance(60_000);
  assert.equal(p.requests.length, 2);
  p.stop();
});

test('backgrounding cancels reads, return checks immediately, stale replies cannot overwrite newer data', async () => {
  const p = polling();
  p.visibility(false);
  assert.equal(p.requests[0].signal.aborted, true);
  p.advance(120_000);
  assert.equal(p.requests.length, 1);
  assert.equal(p.modes.at(-1), 'hidden');
  p.visibility(true);
  assert.equal(p.requests.length, 2);
  p.requests[1].resolve('current'); await flush();
  p.requests[0].resolve('obsolete'); await flush();
  assert.deepEqual(p.results, ['current']);
  assert.equal(p.timers.size, 1);
  p.stop();
});

test('offline cancels the next timer and reconnect performs an immediate check', async () => {
  const p = polling(); p.requests[0].resolve('first'); await flush();
  p.connectivity(false);
  assert.equal(p.timers.size, 0);
  p.advance(120_000);
  assert.equal(p.requests.length, 1);
  assert.equal(p.modes.at(-1), 'offline');
  p.connectivity(true);
  assert.equal(p.requests.length, 2);
  p.stop();
});

test('transient failures retry, authorization denial stops, explicit refresh can check a restored session', async () => {
  const p = polling(); p.requests[0].reject('temporary'); await flush();
  assert.equal(p.timers.size, 1);
  p.advance(INTEGRATION_REFRESH_MS);
  p.requests[1].reject('denied'); await flush();
  assert.equal(p.modes.at(-1), 'blocked');
  assert.equal(p.timers.size, 0);
  p.visibility(false); p.visibility(true); p.advance(120_000);
  assert.equal(p.requests.length, 2);
  p.refresh(); assert.equal(p.requests.length, 3);
  p.requests[2].resolve('restored'); await flush();
  assert.deepEqual(p.results, ['restored']); p.stop();
});

test('unmount removes listeners, aborts a pending read and rejects its late response', async () => {
  const p = polling(); p.stop();
  assert.equal(p.clock.subscribed, false);
  assert.equal(p.requests[0].signal.aborted, true);
  const busyBefore = [...p.busy];
  p.requests[0].resolve('late'); await flush(); p.advance(120_000);
  assert.deepEqual(p.results, []);
  assert.deepEqual(p.busy, busyBefore);
  assert.equal(p.timers.size, 0);
  p.refresh(); assert.equal(p.requests.length, 1);
});

test('actual cards render readable ratings, truthful capped meter values and neutral unavailable states', () => {
  const env = { adminText, integrationQuality, RESPONSE_SCALE_MS };
  for (const [ms, tone] of [[98, 'good'], [592, 'fair'], [1800, 'slow'], [3000, 'bad'], [9000, 'bad']]) {
    const h = componentHost('src/pages/AdminIntegrationHealth.tsx', 'IntegrationHealthCheck', { check: check(ms) }, env);
    assert.ok(h.nodes().some(n => n.props.className === `admin-health-check ${tone}`));
    const meter = h.nodes().find(n => n.props.role === 'meter');
    assert.equal(meter.props['aria-valuenow'], Math.min(ms, RESPONSE_SCALE_MS));
    assert.match(meter.props['aria-valuetext'], /ms/);
    assert.ok(h.nodes().find(n => n.props.className === 'admin-health-quality').props.children[0]);
    h.unmount();
  }
  for (const props of [{ check: check(592, 'unknown') }, { check: check(98), stale: true }]) {
    const h = componentHost('src/pages/AdminIntegrationHealth.tsx', 'IntegrationHealthCheck', props, env);
    assert.equal(h.nodes().some(n => n.props.role === 'meter'), false);
    assert.ok(h.nodes().some(n => n.props.className === 'admin-health-check unknown'));
    h.unmount();
  }
});

test('actual panel keeps the last result during refresh, marks failures stale and clears it after access denial', async () => {
  const clock = clockHost(), requests = [];
  const h = componentHost('src/pages/AdminIntegrationHealth.tsx', 'AdminIntegrationHealth', {}, {
    adminText, useAdminLocale: () => {}, browserIntegrationPollingHost: () => clock.host,
    startIntegrationPolling, integrationQuality, RESPONSE_SCALE_MS,
    window: {}, isAxiosError: error => error?.isAxiosError === true,
    axiosClient: { get(path, config) {
      assert.equal(path, '/admin/integration-health');
      return new Promise((resolve, reject) => requests.push({ ...config, resolve, reject }));
    } },
  });
  const cards = () => h.nodes().filter(n => typeof n.type === 'function' && n.type.name === 'IntegrationHealthCheck');
  requests[0].resolve({ data: report(21) }); await h.flush();
  assert.equal(cards().length, 1); assert.equal(cards()[0].props.stale, false);
  clock.advance(INTEGRATION_REFRESH_MS); await h.flush();
  assert.equal(cards().length, 1, 'refresh does not remove the report');
  requests[1].reject(Error('offline')); await h.flush();
  assert.equal(cards()[0].props.stale, true);
  assert.ok(h.nodes().some(n => n.props.role === 'alert'));
  clock.advance(INTEGRATION_REFRESH_MS);
  requests[2].resolve({ data: report(52) }); await h.flush();
  assert.equal(cards()[0].props.stale, false);
  assert.equal(h.nodes().some(n => n.props.role === 'alert'), false);
  clock.advance(INTEGRATION_REFRESH_MS);
  requests[3].reject({ isAxiosError: true, response: { status: 403 } }); await h.flush();
  assert.equal(cards().length, 0); assert.equal(clock.timers.size, 0);
  h.unmount();
});
