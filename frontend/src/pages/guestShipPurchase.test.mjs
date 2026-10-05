import test from 'node:test';
import assert from 'node:assert/strict';
import { buyShipVariant, saveGuestShipPurchase, selectedShip, SHIP_FLEET_KEY, SHARD_BALANCE_KEY, SHIP_SKIN_KEY, SHIP_COLOR_KEY } from './shipFleet.ts';

test('guest purchases persist the last bought hull and color across reload, and restore failed writes', () => {
  const data = new Map([[SHIP_FLEET_KEY, '{"grey-scout":{"grey":1}}'], [SHARD_BALANCE_KEY, '1000'], [SHIP_SKIN_KEY, 'grey-scout'], [SHIP_COLOR_KEY, 'grey']]);
  let fail = false;
  const storage = { getItem: key => data.get(key) ?? null, removeItem: key => data.delete(key), setItem: (key, value) => { if (fail && key === SHIP_COLOR_KEY) { fail = false; throw Error('quota'); } data.set(key, value); } };
  globalThis.localStorage = storage;
  globalThis.sessionStorage = { getItem: () => null };
  for (const [skin, color] of [['solar-lance', 'gold'], ['nova-wing', 'silver']]) {
    const purchase = buyShipVariant(skin, color, JSON.parse(storage.getItem(SHIP_FLEET_KEY)), Number(storage.getItem(SHARD_BALANCE_KEY)));
    assert.ok(purchase);
    saveGuestShipPurchase(storage, skin, color, purchase);
    assert.equal(selectedShip().skin.id, skin);
    assert.equal(selectedShip().color.id, color);
  }
  const before = [...data];
  assert.equal(buyShipVariant('iron-guard', 'gold', JSON.parse(storage.getItem(SHIP_FLEET_KEY)), Number(storage.getItem(SHARD_BALANCE_KEY))), null);
  assert.deepEqual([...data], before);
  const purchase = buyShipVariant('nova-wing', 'gold', JSON.parse(storage.getItem(SHIP_FLEET_KEY)), Number(storage.getItem(SHARD_BALANCE_KEY)));
  fail = true;
  assert.throws(() => saveGuestShipPurchase(storage, 'nova-wing', 'gold', purchase), /quota/);
  assert.deepEqual([...data], before);
  assert.equal(selectedShip().skin.id, 'nova-wing');
  assert.equal(selectedShip().color.id, 'silver');
});
