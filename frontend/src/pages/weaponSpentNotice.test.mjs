import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { createWeaponSpentNotice, WEAPON_SPENT_NOTICE_MS } from './weaponSpentNotice.ts';
import { weaponNoticeWidth, weaponNoticeTop } from './weaponNoticeLayout.ts';
import { nextActiveWeapon, shouldAutoReload } from './weaponAutoReload.ts';
import { componentHost } from '../../scripts/componentTestHost.mjs';
import { restoreWeaponSpentGameChanges } from '../../scripts/weaponSpentReviewedChanges.mjs';
import { translate, hasExplicitTranslation, languages } from '../i18n.ts';

const source = readFileSync(new URL('./GamePage.tsx', import.meta.url), 'utf8');
const original = restoreWeaponSpentGameChanges(source);
const hash = value => createHash('sha256').update(value).digest('hex');
const rect = (left, top, width, height) => ({ left, top, width, height, right: left + width, bottom: top + height });

test('only a selected timed charge/pickup reaching zero creates the eight-second notice; automatic reload and unlimited weapons do not', () => {
  assert.equal(WEAPON_SPENT_NOTICE_MS, 8000);
  for (const source of ['paid', 'pickup']) for (const level of [2, 3, 4, 5]) {
    assert.deepEqual(createWeaponSpentNotice(source, level, 16, 0, false), { source, level, remainingMs: 8000, visible: false });
    assert.equal(createWeaponSpentNotice(source, level, 16, 0, true), null);
    for (const before of [0, -1, NaN, Infinity]) assert.equal(createWeaponSpentNotice(source, level, before, 0, false), null);
    assert.equal(createWeaponSpentNotice(source, level, 16, 1, false), null);
  }
  for (const level of [0, 1, 6, NaN, 2.5]) assert.equal(createWeaponSpentNotice('paid', level, 16, 0, false), null);
  assert.equal(createWeaponSpentNotice('standard', 2, 16, 0, false), null);
});

const expiryBlock = text => text.slice(text.indexOf('        const expiringLevel ='), text.indexOf('        state.combo.remainingMs ='));
const runExpiry = text => new Function('env', 'with(env){' + expiryBlock(text) + '}');
const baseState = () => ({ weaponSource: 'paid', paidWeaponLevel: 2, paidWeaponMs: 10, pickupWeaponLevel: 5, pickupWeaponMs: 0,
  weaponLevel: 2, weaponTimers: [0, 0, 10, 0, 0, 0] });

test('real expiry wiring preserves all previous selection/timer/reload decisions and names the exhausted weapon before fallback', () => {
  const cases = [
    { name: 'manual charge with stock', stock: 3, notice: 2 },
    { name: 'automatic but empty stock', auto: true, stock: 0, notice: 2 },
    { name: 'successful automatic reload', auto: true, stock: 3, start: true, notice: null },
    { name: 'busy automatic activation', auto: true, stock: 3, start: false, notice: 2 },
    { name: 'automatic purchase policy disabled', auto: true, stock: 3, allowed: false, notice: 2 },
    { name: 'another already-live paid weapon takes over', stock: 0, next: true, notice: 2 },
    { name: 'pickup expires while underlying paid level differs', pickup: true, notice: 5 },
    { name: 'unselected pickup expires', backgroundPickup: true, notice: null },
  ];
  for (const c of cases) {
    const run = text => {
      const state = baseState(), requests = [];
      if (c.pickup) Object.assign(state, { weaponSource: 'pickup', pickupWeaponMs: 10 });
      if (c.backgroundPickup) { state.pickupWeaponMs = 10; state.paidWeaponMs = 100; state.weaponTimers[2] = 100; }
      if (c.next) state.weaponTimers[4] = 30000;
      const env = { state, purchasedWeaponDelta: c.pickup ? 0 : 16, pickupWeaponDelta: 16, ownerDiagnostics: false,
        autoReloadRef: { current: { 2: !!c.auto, 4: !!c.next } }, stockRef: { current: { weapon_twin: c.stock ?? 0 } }, shipSaveNetwork: 'testnet',
        hangarCatalog: [{ kind: 'weapon', level: 2 }], isTestnetWeaponPurchaseEnabled: () => c.allowed !== false,
        syncSelectedWeapon() {}, nextActiveWeapon, shouldAutoReload, createWeaponSpentNotice,
        reloadRequestRef: { current: level => { requests.push(level); return c.start ?? false; } }, weaponSpentRef: { current: null }, setWeaponSpent() {}, forceScene: false };
      runExpiry(text)(env); return { env, requests, state };
    };
    const before = run(original), after = run(source);
    assert.deepEqual(after.state, before.state, c.name); assert.deepEqual(after.requests, before.requests, c.name);
    assert.equal(after.env.weaponSpentRef.current?.level ?? null, c.notice, c.name);
    if (c.next) assert.equal(after.state.paidWeaponLevel, 4, 'fallback retains its live timer while notice names level 2');
    if (c.pickup) assert.equal(after.env.weaponSpentRef.current.source, 'pickup');
  }
});

test('actual notice clock counts only visible active combat, preserves pauses/transition time and expires once', () => {
  const start = source.indexOf('        const transitionPaused =');
  const predicate = source.slice(start, source.indexOf('\n', start));
  const clock = source.indexOf('        if (weaponSpentRef.current?.visible');
  const block = predicate + source.slice(clock, source.indexOf('        impactCooldownRef.current =', clock));
  const run = new Function('env', 'with(env){if (state.status === "playing") {' + block + '}}');
  const env = { state: { status: 'playing', phase: 'ATTACK_CYCLE', encounter: 'normal' }, normal: true,
    formationStartedRef: { current: true }, weaponSpentRef: { current: createWeaponSpentNotice('paid', 2, 16, 0, false) }, delta: 1000, setWeaponSpent() {}, forceScene: false };
  run(env); assert.equal(env.weaponSpentRef.current.remainingMs, 8000, 'an unplaced/crowded notice does not lose reading time');
  env.weaponSpentRef.current.visible = true;
  for (const status of ['paused', 'loading', 'game-over']) { env.state.status = status; run(env); assert.equal(env.weaponSpentRef.current.remainingMs, 8000); }
  env.state.status = 'playing';
  for (const phase of ['SECTOR_INTRO', 'SECTOR_CLEAR']) { env.state.phase = phase; run(env); assert.equal(env.weaponSpentRef.current.remainingMs, 8000); }
  env.state.phase = 'ATTACK_CYCLE';
  for (let second = 0; second < 7; second++) run(env);
  assert.equal(env.weaponSpentRef.current.remainingMs, 1000); run(env);
  assert.equal(env.weaponSpentRef.current, null); assert.equal(env.forceScene, true); run(env);
});

test('real spent component exposes only the existing manual weapon menu, with localized charge/pickup copy', () => {
  for (const source of ['paid', 'pickup']) {
    let opened = 0;
    const h = componentHost('src/pages/WeaponSpentNotice.tsx', 'WeaponSpentNotice', { notice: { source, level: 5 }, weaponName: 'Plasma', layoutKey: 'normal:55', onOpen: () => opened++, onVisibleChange() {} },
      { useLocale: () => ({ t: text => translate('de', text) }), WeaponReloadNotice: 'notice' });
    const button = h.nodes().find(n => n.type === 'button');
    assert.equal(opened, 0); assert.equal(button.props.type, 'button');
    assert.ok(button.props.children.includes('Schussart wechseln / nachkaufen'));
    assert.ok(h.nodes().find(n => n.type === 'strong').props.children.includes(source === 'paid' ? 'Ladung verbraucht' : 'Gesammelte Schussart abgelaufen'));
    button.props.onClick(); assert.equal(opened, 1); h.unmount();
  }
  for (const locale of Object.keys(languages)) for (const key of ['Charge depleted', 'Weapon pickup expired', 'Switch weapon / buy charges']) {
    if (locale !== 'en') assert.ok(hasExplicitTranslation(locale, key), `${locale}: ${key}`);
    assert.ok(translate(locale, key));
  }
});

test('notice placement leaves HUD, central titles and side-control text untouched in both hands and compact/tablet/wide layouts', () => {
  for (const [width, height] of [[320, 568], [393, 628], [393, 744], [430, 825], [768, 1024], [1363, 768]]) {
    for (const rightHand of [true, false]) for (const banner of [false, true]) {
      const field = rect(20, 30, width, height), controls = [rect(rightHand ? 28 : field.right - 76, field.bottom - 390, 68, 366)];
      const text = [rect(20, 30, width, 72), rect(45, 110, width - 50, 24)];
      if (banner) text.push(rect(55, 30 + height * .45, width - 70, 92));
      const noticeWidth = weaponNoticeWidth(field, controls), noticeHeight = width < 400 ? 130 : 100;
      const top = weaponNoticeTop(field, noticeWidth, noticeHeight, 102, text);
      assert.notEqual(top, null, `${width}/${height}/${rightHand}/${banner}`);
      const notice = rect((field.left + field.right - noticeWidth) / 2, field.top + top, noticeWidth, noticeHeight);
      assert.ok(notice.bottom <= field.bottom - 12);
      for (const obstacle of [...controls, ...text]) assert.ok(notice.right <= obstacle.left || notice.left >= obstacle.right || notice.bottom <= obstacle.top || notice.top >= obstacle.bottom);
    }
  }
  const field = rect(0, 0, 320, 240);
  assert.equal(weaponNoticeTop(field, 200, 100, 90, [rect(0, 90, 320, 150)]), null, 'crowding defers the notice instead of covering other text');
});

test('real placement effect observes only a mounted finite notice and releases observers; unavailable room preserves reading time', () => {
  const fieldRect = rect(0, 0, 393, 744), hud = { getBoundingClientRect: () => rect(0, 0, 393, 72) };
  const label = { getBoundingClientRect: () => rect(10, 80, 373, 24) }, control = { getBoundingClientRect: () => rect(8, 360, 68, 360) };
  let noticeHeight = 90, observer, cleaned = false, visible, cleanup;
  const field = { getBoundingClientRect: () => fieldRect, querySelector: () => hud, querySelectorAll: selector => selector.startsWith('.game-hud') ? [hud, label] : [control] };
  const notice = { style: {}, closest: () => field, getBoundingClientRect: () => rect(0, 0, Math.min(300, parseFloat(notice.style.maxWidth) || 300), noticeHeight) };
  const h = componentHost('src/pages/WeaponReloadNotice.tsx', 'WeaponReloadNotice', { children: 'Plasma', layoutKey: 'test', onVisibleChange: value => { visible = value; } }, {
    useRef: () => ({ current: notice }), useLayoutEffect: fn => { cleanup = fn(); }, weaponNoticeWidth, weaponNoticeTop,
    ResizeObserver: class { constructor(fn) { this.place = fn; this.observed = []; observer = this; } observe(n) { this.observed.push(n); } disconnect() { cleaned = true; } },
  });
  assert.equal(visible, true); assert.equal(notice.style.maxWidth, '217px');
  assert.ok(observer.observed.includes(field)); assert.ok(observer.observed.includes(notice));
  noticeHeight = 700; observer.place(); assert.equal(visible, false); assert.equal(notice.style.visibility, 'hidden');
  noticeHeight = 90; observer.place(); assert.equal(visible, true); cleanup(); assert.equal(visible, false); assert.equal(cleaned, true); h.unmount();
});

test('the exact reviewed notice restores the full published controller and rejects changes to reload, watchdog or purchases', () => {
  assert.equal(hash(original), '280be9043d47d5cb80f3c51223a549e8dc3a69c89588d632a7698dae3e218acb');
  assert.throws(() => restoreWeaponSpentGameChanges(source.replace('autoReloadStarted);', 'false);')), /one exact/);
  assert.notEqual(hash(restoreWeaponSpentGameChanges(source.replace('watch: callback => window.setInterval(callback, 500)', 'watch: callback => window.setInterval(callback, 1000)'))), hash(original));
  assert.ok(source.includes("setAutoReloading(null), 6_000)")); assert.ok(source.includes("setWeaponError(''), 6_000)"));
});
