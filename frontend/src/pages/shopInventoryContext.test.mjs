import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

// Execute the actual Shop callbacks/effect with isolated transport and React
// dependency scheduling. No browser save, Pi session or account is modified.
const source = readFileSync(new URL('./Shop.tsx', import.meta.url), 'utf8');
const parsed = ts.createSourceFile('Shop.tsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const nodes = [];
const visit = node => { nodes.push(node); ts.forEachChild(node, visit); };
visit(parsed);
const initializer = name => {
  const node = nodes.find(node => ts.isVariableDeclaration(node) && node.name.getText(parsed) === name);
  assert.ok(node?.initializer, `Actual Shop callback ${name} exists`);
  return node.initializer.getText(parsed);
};
const inventoryEffect = nodes.find(node => ts.isCallExpression(node) && node.expression.getText(parsed) === 'useEffect'
  && node.arguments[0]?.getText(parsed).includes('if (!isAuthenticated) return;')
  && node.arguments[0]?.getText(parsed).includes('"/hangar/inventory"'));
assert.ok(inventoryEffect, 'Actual authenticated inventory effect exists');
const weaponPurchase = nodes.find(node => ts.isArrowFunction(node) && ts.isJsxExpression(node.parent)
  && node.getText(parsed).includes('weaponModel: 2'));
assert.ok(weaponPurchase, 'Actual weapon checkout callback exists');
const compile = text => ts.transpileModule(text, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText;
const evaluate = (text, env) => new Function('env', `with (env) { ${compile(`const value = ${text};`)} return value; }`)(env);
const deferred = () => { let resolve; const promise = new Promise(done => { resolve = done; }); return { promise, resolve }; };
const flush = async () => { for (let i = 0; i < 20; i++) await Promise.resolve(); };
const inventory = marker => ({ marker, ownedWeapons: [], ownedArmor: [], consumables: [] });

function harness() {
  const state = { inventory: null, messages: [] }, requests = [], callbacks = [];
  const shared = {
    inventoryOwnerRef: { current: undefined }, inventoryRequestVersion: { current: 0 },
    inventoryContextRef: { current: { owner: undefined, adminMode: false, active: false } },
    axiosClient: {
      get(path) { const result = deferred(); requests.push({ method: 'GET', path, ...result }); return result.promise; },
      post(path, body) { const result = deferred(); requests.push({ method: 'POST', path, body, ...result }); return result.promise; },
    },
    setInventory: value => { state.inventory = value; }, setLoadoutMessage: value => state.messages.push(value),
    setNewCards() { throw Error('No card grants belong to this isolated inventory read'); },
    requireAuth() { throw Error('Already signed in'); },
    piPurchaseAllowed: () => true, orderProduct: (...args) => callbacks.push(args.at(-1)),
    shipSaveNetwork: 'mainnet', ownerTestnet: false, catalogReady: true, mainnetReleased: true, isLoading: false,
  };
  let dependencies, cleanup;
  const render = (uid, adminMode = false) => {
    shared.inventoryOwnerRef.current = uid;
    const env = { ...shared, user: uid ? { uid } : null, accountUid: uid, isAuthenticated: Boolean(uid),
      adminMode, account: null, inventory: null,
      useEffect(fn, next) {
        if (dependencies && next.length === dependencies.length && next.every((value, i) => Object.is(value, dependencies[i]))) return;
        cleanup?.(); dependencies = next; cleanup = fn();
      },
    };
    const refreshInventory = evaluate(initializer('refreshInventory'), env);
    const api = {
      refreshInventory,
      equip: evaluate(initializer('equip'), { ...env, refreshInventory }),
      buyPiOffer: evaluate(initializer('buyPiOffer'), { ...env, refreshInventory }),
      buyWeapon: evaluate(weaponPurchase.getText(parsed), { ...env, refreshInventory, offer: { id: 'weapon_twin', name: 'Twin', pricePi: .15 } }),
    };
    new Function('env', `with(env) { ${compile(inventoryEffect.getText(parsed))} }`)(env);
    return api;
  };
  return { state, requests, callbacks, shared, render, unmount: () => cleanup?.() };
}

test('direct A-to-B account switch refetches inventory and rejects the late A result', async () => {
  const h = harness(); h.render('pilot-a'); h.render('pilot-b');
  assert.equal(h.requests.length, 2, 'both authenticated accounts need their own read');
  h.requests[0].resolve({ data: inventory('pilot-a') }); await flush();
  assert.equal(h.state.inventory, null);
  h.requests[1].resolve({ data: inventory('pilot-b') }); await flush();
  assert.equal(h.state.inventory.marker, 'pilot-b');
});

test('a manual refresh from the retired account cannot overwrite the next account inventory', async () => {
  const h = harness(), a = h.render('pilot-a');
  const old = a.refreshInventory();
  h.shared.inventoryOwnerRef.current = 'pilot-b'; h.state.inventory = inventory('pilot-b');
  h.requests[1].resolve({ data: inventory('pilot-a') }); await old;
  assert.equal(h.state.inventory.marker, 'pilot-b');
});

test('an older same-account read cannot replace a newer confirmed inventory result', async () => {
  const h = harness(), a = h.render('pilot-a');
  const first = a.refreshInventory(), second = a.refreshInventory();
  h.requests[2].resolve({ data: inventory('latest-confirmed-stock') }); await second;
  h.requests[1].resolve({ data: inventory('older-stock') }); await first;
  assert.equal(h.state.inventory.marker, 'latest-confirmed-stock');
});

test('retired refresh errors and unmounted refresh results cannot change Shop state', async () => {
  const h = harness(), a = h.render('pilot-a');
  const failed = a.refreshInventory(); h.render('pilot-b');
  h.requests[1].resolve({ data: { invalid: true } }); await failed;
  assert.deepEqual(h.state.messages, []);
  const b = h.render('pilot-b'), pending = b.refreshInventory();
  h.unmount(); h.requests.at(-1).resolve({ data: inventory('after-unmount') }); await pending;
  assert.equal(h.state.inventory, null);
});

test('a retired equip reply cannot start a read or claim success for the new account', async () => {
  const h = harness(), a = h.render('pilot-a');
  const pending = a.equip(null, 'start_shield');
  h.shared.inventoryOwnerRef.current = 'pilot-b';
  h.requests[1].resolve({ data: {} }); await flush();
  // A broken continuation would create another read after the account switch.
  const late = h.requests.find((request, i) => i > 1 && request.method === 'GET');
  if (late) late.resolve({ data: inventory('pilot-b') });
  await pending;
  assert.equal(h.requests.length, 2); assert.deepEqual(h.state.messages, []);
});

test('a payment confirmation that retires during inventory reload cannot claim success for another account', async () => {
  const h = harness(), a = h.render('pilot-a');
  a.buyPiOffer({ id: 'start_shield', name: 'Shield', kind: 'power', pricePi: .15 });
  assert.equal(h.callbacks.length, 1);
  const pending = h.callbacks[0]();
  h.shared.inventoryOwnerRef.current = 'pilot-b';
  h.requests[1].resolve({ data: inventory('pilot-a') }); await pending;
  assert.equal(h.state.inventory, null); assert.deepEqual(h.state.messages, []);
});

test('the current account still refreshes confirmed stock and saves its selected loadout', async () => {
  const h = harness(), a = h.render('pilot-a');
  const pending = a.equip(null, 'start_shield');
  h.requests[1].resolve({ data: {} }); await flush();
  assert.deepEqual(h.requests.map(request => request.path), ['/hangar/inventory', '/hangar/equip', '/hangar/inventory']);
  h.requests[2].resolve({ data: inventory('current-confirmed-stock') }); await pending;
  assert.equal(h.state.inventory.marker, 'current-confirmed-stock');
  assert.deepEqual(h.state.messages, ['Loadout saved for the next mission.']);
});

test('the current account retains its confirmed purchase message after the inventory reload', async () => {
  const h = harness(), a = h.render('pilot-a');
  a.buyPiOffer({ id: 'start_shield', name: 'Shield', kind: 'power', pricePi: .15 });
  const pending = h.callbacks[0]();
  h.requests[1].resolve({ data: inventory('purchased-stock') }); await pending;
  assert.equal(h.state.inventory.marker, 'purchased-stock');
  assert.deepEqual(h.state.messages, ['purchase confirmed.']);
});

test('an old normal-mode equip reply cannot refresh or overwrite the same owner preview', async () => {
  const h = harness(), a = h.render('pilot-a');
  const pending = a.equip(null, 'start_shield');
  h.render('pilot-a', true);
  h.requests[2].resolve({ data: inventory('preview') }); await flush();
  h.requests[1].resolve({ data: {} }); await flush();
  if (h.requests[3]) h.requests[3].resolve({ data: inventory('retired-normal-mode') });
  await pending;
  assert.equal(h.requests.length, 3); assert.equal(h.state.inventory.marker, 'preview');
  assert.deepEqual(h.state.messages, []);
});

test('normal-mode purchase callbacks are retired by a same-owner preview context', async () => {
  for (const kind of ['power', 'weapon']) {
    const h = harness(), a = h.render('pilot-a');
    if (kind === 'weapon') a.buyWeapon(1, .15);
    else a.buyPiOffer({ id: 'start_shield', name: 'Shield', kind: 'power', pricePi: .15 });
    const confirmed = h.callbacks[0];
    h.render('pilot-a', true);
    const pending = confirmed(); await flush();
    if (h.requests[2]) h.requests[2].resolve({ data: inventory('retired-normal-mode') });
    await pending;
    assert.equal(h.requests.length, 2, kind); assert.equal(h.state.inventory, null, kind);
    assert.deepEqual(h.state.messages, [], kind);
  }
});

const revealEffect = nodes.find(node => ts.isCallExpression(node) && node.expression.getText(parsed) === 'useEffect'
  && node.arguments[0]?.getText(parsed).includes('rememberCard('));
assert.ok(revealEffect, 'Actual card presentation receipt effect exists');
const revealElement = nodes.find(node => ts.isJsxSelfClosingElement(node) && node.tagName.getText(parsed) === 'CardReveal');
assert.ok(revealElement, 'Actual card reveal dialog exists');
function revealHarness(owner = 'pilot-a', adminMode = false) {
  const cards = [{ key: 'nova-wing-1', ship: 'nova-wing', stage: 1 }, { key: 'nova-wing-2', ship: 'nova-wing', stage: 2 }];
  const state = { queue: { owner, adminMode, cards }, remembered: [], synced: [] };
  const shared = {
    inventoryOwnerRef: { current: owner === 'guest' ? undefined : owner },
    inventoryContextRef: { current: { owner, adminMode, active: true } },
    rememberCard: (uid, key) => state.remembered.push({ uid, key }),
    syncCardReveals: async uid => { state.synced.push(uid); },
    setNewCards: update => { state.queue = { ...state.queue, cards: update(state.queue.cards) }; },
    setNewCardQueue: update => { state.queue = typeof update === 'function' ? update(state.queue) : update; },
  };
  const render = (uid, preview = false) => {
    shared.inventoryOwnerRef.current = uid === 'guest' ? undefined : uid;
    shared.inventoryContextRef.current = { owner: uid, adminMode: preview, active: true };
    const env = { ...shared, user: uid === 'guest' ? null : { uid }, accountUid: uid === 'guest' ? undefined : uid,
      adminMode: preview, newCardQueue: state.queue, useEffect: fn => fn() };
    // The original unowned array is the initial failing fixture. The revised
    // implementation executes its actual render-time owner/mode selection.
    const declaration = nodes.find(node => ts.isVariableDeclaration(node) && node.name.getText(parsed) === 'newCards');
    env.newCards = declaration ? evaluate(declaration.initializer.getText(parsed), env) : state.queue.cards;
    env.firstNewCardKey = evaluate(initializer('firstNewCardKey'), env);
    const prop = revealElement.attributes.properties.find(node => node.name?.getText(parsed) === 'onContinue');
    const callbackText = prop.initializer.expression.getText(parsed);
    if (ts.isIdentifier(prop.initializer.expression)) env[callbackText] = evaluate(initializer(callbackText), env);
    return {
      cards: env.newCards,
      continue: evaluate(callbackText, env),
      commit: () => new Function('env', `with(env) { ${compile(revealEffect.getText(parsed))} }`)(env),
    };
  };
  return { state, render };
}

test('pending account cards are hidden before the next owner can render or remember them', () => {
  for (const nextOwner of ['pilot-b', 'guest']) {
    const h = revealHarness(), own = h.render('pilot-a');
    assert.equal(own.cards.length, 2); own.commit();
    const next = h.render(nextOwner);
    assert.deepEqual(next.cards, [], nextOwner); next.commit();
    assert.deepEqual(h.state.remembered, [{ uid: 'pilot-a', key: 'nova-wing-1' }]);
    assert.equal(h.state.queue.cards.length, 2, 'the first owner queue remains intact');
  }
});

test('guest cards cannot become account cards and normal cards stay hidden in owner preview', () => {
  for (const [owner, nextOwner, preview] of [['guest', 'pilot-a', false], ['pilot-a', 'pilot-a', true]]) {
    const h = revealHarness(owner), next = h.render(nextOwner, preview);
    assert.deepEqual(next.cards, []); next.commit();
    assert.deepEqual(h.state.remembered, []); assert.deepEqual(h.state.synced, []);
  }
});

test('retired reveal continuation cannot consume the next account queue', () => {
  const h = revealHarness(), a = h.render('pilot-a');
  h.state.queue = { owner: 'pilot-b', adminMode: false, cards: [{ key: 'solar-lance-1', ship: 'solar-lance', stage: 1 }] };
  h.render('pilot-b'); a.continue();
  assert.equal(h.state.queue.cards[0]?.key, 'solar-lance-1');
});

test('current owner and guest retain manual card continuation and presentation receipts', () => {
  for (const owner of ['pilot-a', 'guest']) {
    const h = revealHarness(owner), first = h.render(owner); first.commit(); first.continue();
    const second = h.render(owner); second.commit();
    assert.equal(second.cards[0].key, 'nova-wing-2');
    assert.deepEqual(h.state.remembered, [{ uid: owner, key: 'nova-wing-1' }, { uid: owner, key: 'nova-wing-2' }]);
  }
});
