import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { weaponPayment, weaponQuantity, creditWeaponOrders, emptyWeaponStock } = require('../build/weaponStock.js');
test('quantity and catalog total are bounded and computed without floating point drift', () => {
  for (const bad of [0, -1, 1.5, '10', 100, NaN]) assert.equal(weaponQuantity(bad), null);
  assert.deepEqual(weaponPayment({kind:'weapon',pricePi:.16},{weaponModel:2,quantity:10}),{quantity:10,amount:1.6});
  assert.equal(weaponPayment({kind:'weapon',pricePi:.1},{weaponModel:2,quantity:100}),null);
  assert.equal(weaponPayment({kind:'armor',pricePi:1},{weaponModel:2,quantity:1}),null);
});
test('confirmed orders credit quantity once, preserve legacy time and isolate networks', () => {
  const order={paid:true, product_id:'weapon_twin',payment_network:'Pi Testnet'};
  const orders=[{...order,pi_payment_id:'legacy'}, {...order,pi_payment_id:'batch',weapon_model:2,quantity:10}, {...order,pi_payment_id:'unpaid',paid:false}, {...order,pi_payment_id:'main',payment_network:'Pi Network'}, {...order,pi_payment_id:'cancelled',cancelled:true}, {...order,pi_payment_id:'locked',product_id:'weapon_plasma'}];
  const stock=creditWeaponOrders(emptyWeaponStock(),orders,'testnet');
  assert.equal(stock.balances.weapon_twin,12);
  assert.deepEqual(creditWeaponOrders(stock,orders,'testnet'),stock);
  assert.deepEqual(creditWeaponOrders(emptyWeaponStock(),orders,'mainnet').balances,{});
});
