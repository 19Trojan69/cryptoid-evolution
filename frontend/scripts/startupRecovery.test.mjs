import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import vm from 'node:vm';
import { translate } from '../src/i18n.ts';
import { resolveLocale, supportedLanguages } from '../src/locales/config.ts';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const before = readFileSync(new URL('./fixtures/startup-before-20261023.html.txt', import.meta.url), 'utf8');
const marker = /    <!-- Independent of the SDK,[\s\S]*?    <\/script>\n\n/;
const source = /<script id="cryptoid-startup-recovery">([\s\S]*?)<\/script>/.exec(html)?.[1];
assert.ok(source);
const keys = ['This page could not be loaded.', 'Reload to open the current version. Your saved data is preserved.', 'Reload page', 'Return to home'];

function host({ stored = null, devices = ['en-US'], denied = false, readyInitially = false } = {}) {
  let now = 0, serial = 0, reloads = 0, disconnected = 0;
  const timers = new Map(), listeners = new Map(), created = [], reads = [];
  const make = tag => {
    const node = { tagName: tag.toUpperCase(), children: [], style: {}, textContent: '', events: new Map(),
      setAttribute(name, value) { this[name] = value; },
      addEventListener(name, fn) { this.events.set(name, fn); },
      append(...nodes) { this.children.push(...nodes); nodes.forEach(child => child.parent = this); },
      remove() { if (this.parent) this.parent.children = this.parent.children.filter(child => child !== this); },
      get childElementCount() { return this.children.length; },
    };
    return node;
  };
  const tree = make('html'), root = make('div'); root.id = 'root'; tree.append(root);
  if (readyInitially) root.append(make('main'));
  const find = (node, id) => node.id === id ? node : node.children.map(child => find(child, id)).find(Boolean);
  let changed;
  const document = { documentElement: tree, getElementById: id => find(tree, id),
    createElement(tag) { const node = make(tag); created.push(node); return node; } };
  const window = {
    setTimeout(fn, ms) { timers.set(++serial, { fn, at: now + ms }); return serial; },
    clearTimeout(id) { timers.delete(id); },
    addEventListener(name, fn, capture) { listeners.set(name, { fn, capture }); },
    removeEventListener(name, fn, capture) { const old = listeners.get(name); if (old?.fn === fn && old.capture === capture) listeners.delete(name); },
    get localStorage() { if (denied) throw new Error('Storage disabled'); return { getItem(key) { reads.push(key); return stored; }, setItem() { throw Error('Unexpected storage mutation'); }, removeItem() { throw Error('Unexpected storage mutation'); } }; },
    location: { reload() { reloads++; } },
  };
  class Observer {
    constructor(fn) { changed = fn; }
    observe(target, options) { assert.equal(target, tree); assert.deepEqual({ ...options }, { childList: true, subtree: true }); }
    disconnect() { disconnected++; changed = null; }
  }
  vm.runInNewContext(source, { window, document, navigator: { languages: devices, language: devices[0] }, MutationObserver: Observer });
  return { root, timers, listeners, created, reads,
    get panel() { return document.getElementById('cryptoid-startup-recovery-panel'); },
    get reloads() { return reloads; }, get disconnected() { return disconnected; },
    advance(ms) { now += ms; for (const [id, value] of [...timers]) if (value.at <= now) { timers.delete(id); value.fn(); } },
    error(target) { listeners.get('error')?.fn({ target }); },
    commit() { root.append(make('main')); changed?.(); }, notify() { changed?.(); },
  };
}

test('startup adds recovery and moves the identical SDK/init after root while preserving their order before entry', () => {
  const blob = createHash('sha1').update(`blob ${Buffer.byteLength(before)}\0${before}`).digest('hex');
  assert.equal(blob, 'c9f7cc2058c56c35f1a4d470f0451c8371c97b09');
  const sdk = /    <!-- Pi Network SDK -->[\s\S]*?    <\/script>\n\n/.exec(before)?.[0];
  assert.ok(sdk); assert.ok(html.includes(sdk));
  assert.equal(html.replace(marker, '').replace(sdk, ''), before.replace(sdk, ''));
  assert.ok(html.indexOf('id="cryptoid-startup-recovery"') < html.indexOf('https://sdk.minepi.com/pi-sdk.js'));
  assert.ok(html.indexOf('<div id="root">') < html.indexOf('https://sdk.minepi.com/pi-sdk.js'));
  assert.ok(html.indexOf('Pi.init(') < html.indexOf('src="/src/main.tsx"'));
  assert.equal((html.match(/Pi\.init\(\{ version: "2\.0" \}\)/g) || []).length, 1);
});
test('normal startup adds no visible nodes and releases its timer, observer and listener after the first UI commit', () => {
  const h = host(); assert.equal(h.created.length, 0); assert.equal(h.panel, undefined);
  assert.equal(h.timers.size, 1); assert.equal(h.listeners.get('error').capture, true);
  h.commit(); assert.equal(h.timers.size, 0); assert.equal(h.listeners.size, 0); assert.equal(h.disconnected, 1);
  h.advance(60_000); assert.equal(h.created.length, 0); assert.deepEqual(h.reads, []);
});
test('a blocked parser or empty lazy route gets one recovery panel at the exact eight-second boundary', () => {
  const h = host(); h.advance(7999); assert.equal(h.panel, undefined); h.advance(1);
  assert.equal(h.panel.role, 'alert'); assert.equal(h.panel.children[0].textContent, keys[0]);
  assert.equal(h.timers.size, 0); assert.equal(h.reloads, 0); assert.equal(h.root.childElementCount, 0);
  h.advance(60_000); h.notify(); assert.equal(h.created.filter(x => x.tagName === 'SECTION').length, 1);
});
test('a module resource error gives immediate manual recovery without waiting for the timeout', () => {
  const h = host(); h.error({ tagName: 'SCRIPT', type: 'module' });
  assert.ok(h.panel); assert.equal(h.timers.size, 0); assert.equal(h.reloads, 0);
  h.error({ tagName: 'SCRIPT', type: 'module' }); assert.equal(h.created.filter(x => x.tagName === 'SECTION').length, 1);
});
test('unrelated image, SDK and runtime error events do not create a premature recovery panel', () => {
  const h = host(); for (const target of [{ tagName: 'IMG' }, { tagName: 'SCRIPT', type: '' }, { tagName: 'LINK' }, undefined]) h.error(target);
  assert.equal(h.panel, undefined); h.commit(); assert.equal(h.timers.size, 0);
});
test('a late successful start removes recovery without automatic reload or replacing any app nodes', () => {
  const h = host(); h.advance(8000); const panel = h.panel; h.commit();
  assert.equal(h.panel, undefined); assert.equal(panel.parent.children.includes(panel), false);
  assert.equal(h.root.childElementCount, 1); assert.equal(h.reloads, 0);
  assert.equal(h.timers.size, 0); assert.equal(h.listeners.size, 0); assert.equal(h.disconnected, 1);
});
test('only an explicit retry click reloads; Home uses the existing origin and storage is read-only', () => {
  const h = host({ stored: 'de' }); h.advance(8000);
  assert.deepEqual(h.reads, ['cryptoid_language']); assert.equal(h.reloads, 0);
  assert.equal(h.panel.children[3].href, '/');
  h.panel.children[2].events.get('click')(); assert.equal(h.reloads, 1);
});
test('denied storage still produces a usable panel in the device language', () => {
  const h = host({ denied: true, devices: ['de-AT'] }); h.advance(8000);
  assert.equal(h.panel.children[2].textContent, translate('de', keys[2])); assert.equal(h.panel.lang, 'de');
});
test('startup copy matches the existing translations and English fallbacks for every selectable language', () => {
  for (const locale of Object.keys(supportedLanguages)) {
    const h = host({ stored: locale }); h.advance(8000);
    assert.deepEqual(h.panel.children.map(x => x.textContent), keys.map(key => translate(locale, key)), locale);
  }
});
test('override, device list, aliases and Traditional-Chinese fallback match normal locale resolution', () => {
  for (const [stored, devices] of [['DE_at', ['es-ES']], ['invalid', ['zh-TW', 'vi-VN']], [null, ['xx', 'zh-Hans-CN']], ['zh-Hant', ['de-AT']], [null, []], [null, ['fr-FR', 'de']]]) {
    const h = host({ stored, devices }); h.advance(8000); const locale = resolveLocale(devices, stored);
    assert.deepEqual(h.panel.children.map(x => x.textContent), keys.map(key => translate(locale, key)));
  }
});
test('a UI already committed before the first timeout is never covered', () => {
  const h = host({ readyInitially: true }); h.advance(8000);
  assert.equal(h.created.length, 0); assert.equal(h.root.childElementCount, 1);
  assert.equal(h.listeners.size, 0); assert.equal(h.disconnected, 1);
});
test('successful startup retires observation permanently, including later route or game changes', () => {
  const h = host(); h.commit(); h.root.children = []; h.advance(60_000);
  h.error({ tagName: 'SCRIPT', type: 'module' }); h.notify(); assert.equal(h.created.length, 0);
});
