import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { creditWeaponOrders, emptyWeaponStock } = require('../build/weaponStock.js');
const { chargePayment, chargeQuantity } = require('../build/chargePurchase.js');
test('quantity and catalog total are bounded and computed without floating point drift', () => {
  for (const bad of [0, -1, 1.5, '10', 100, NaN]) assert.equal(chargeQuantity(bad), null);
  assert.deepEqual(chargePayment({kind:'weapon',pricePi:.16},{weaponModel:2,quantity:10}),{quantity:10,amount:1.6});
  assert.equal(chargePayment({kind:'weapon',pricePi:.1},{weaponModel:2,quantity:100}),null);
  assert.equal(chargePayment({kind:'armor',pricePi:1},{weaponModel:2,quantity:1}),null);
  const shield = { kind: 'power', pricePi: .08 };
  for (const [quantity, amount] of [[5, .4], [10, .8], [15, 1.2], [99, 7.92]]) {
    assert.deepEqual(chargePayment(shield, { powerModel: 1, quantity }), { quantity, amount });
  }
  assert.deepEqual(chargePayment(shield, {}), { quantity: 1, amount: .08 });
  assert.equal(chargePayment(shield, { quantity: 15 }), null);
  assert.equal(chargePayment(shield, { powerModel: 1, quantity: 100 }), null);
  assert.equal(chargePayment(shield, { powerModel: 1, weaponModel: 2, quantity: 1 }), null);
  assert.equal(chargePayment({kind:'armor',pricePi:1},{powerModel:1,quantity:1}),null);
});
test('confirmed orders credit quantity once, retain legacy charge counts and isolate networks', () => {
  const order={paid:true, product_id:'weapon_twin',payment_network:'Pi Testnet'};
  const orders=[{...order,pi_payment_id:'legacy'}, {...order,pi_payment_id:'batch',weapon_model:2,quantity:10}, {...order,pi_payment_id:'unpaid',paid:false}, {...order,pi_payment_id:'main',payment_network:'Pi Network'}, {...order,pi_payment_id:'cancelled',cancelled:true}, {...order,pi_payment_id:'locked',product_id:'weapon_plasma'}];
  const stock=creditWeaponOrders(emptyWeaponStock(),orders,'testnet');
  assert.equal(stock.balances.weapon_twin,12);
  assert.deepEqual(creditWeaponOrders(stock,orders,'testnet'),stock);
  assert.deepEqual(creditWeaponOrders(emptyWeaponStock(),orders,'mainnet').balances,{});
});
