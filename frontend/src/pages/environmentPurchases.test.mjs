import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import * as jsx from 'react/jsx-runtime';
import { renderToStaticMarkup } from 'react-dom/server';
import { languages, translate } from '../i18n.ts';
import * as fleet from './shipFleet.ts';
import * as evolution from './shipEvolution.ts';
import * as attributes from './shipAttributes.ts';
import { hangarCatalog } from '../../../backend/src/hangarCatalog.ts';
import { shipNftEditions } from '../../../backend/src/shipNftCatalog.ts';
import * as liveries from '../../../backend/src/shipLivery.ts';
import { shipNftCopy } from '../locales/shipNft.ts';
import { chargeQuantity, chargeTotal, MAX_CHARGE_QUANTITY } from '../../../backend/src/chargePurchase.ts';
import { piPurchaseAllowed, testPiPurchaseAllowed } from '../../../backend/src/paymentPolicy.ts';
const Price = ({ amount, testnet }) => jsx.jsxs('span', { children: [amount, testnet ? ' Test-Pi' : ' Pi'] });
function component(file, imports = {}) {
  const exports = {};
  const code = ts.transpileModule(readFileSync(new URL(file, import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  vm.runInNewContext(code, { exports, require: name => { assert.ok(name in imports, `Unmapped ${name}`); return imports[name]; } });
  return exports.default;
}
const nodes = tree => { const result = []; const walk = node => { if (!node || typeof node !== 'object') return; if (node.type) result.push(node); [node.props?.children].flat(Infinity).forEach(walk); }; walk(tree); return result; };
const base = { 'react/jsx-runtime': jsx, '../components/PiPrice': { default: Price }, '../i18n': { useLocale: () => ({ locale: 'en', t: value => value }) } };

test('checkout controls show the actual network and preserve exact quantity and total', () => {
  for (const locale of Object.keys(languages)) for (const network of ['mainnet', 'testnet']) {
    const imports = { ...base, '../i18n': { useLocale: () => ({ locale, t: value => translate(locale, value) }) } };
    const Once = component('./TestPiPurchase.tsx', imports);
    const once = renderToStaticMarkup(jsx.jsx(Once, { price: 9.9, network, onBuy() {} }));
    assert.ok(once.includes(network === 'testnet' ? 'Test-Pi' : ' Pi'));
    if (network === 'mainnet') assert.ok(!once.includes('Test-Pi'));
    const buyLabel = translate(locale, network === 'testnet' ? 'Buy with Test-Pi' : 'Buy with Pi');
    assert.ok(once.includes(buyLabel), locale);
    const Batch = component('./WeaponPurchase.tsx', { ...imports, react: { useState: () => ['5', () => {}] }, '../../../backend/src/chargePurchase': { chargeQuantity, chargeTotal, MAX_CHARGE_QUANTITY }, './weaponStock.css': {} });
    const purchases = [];
    const tree = nodes(Batch({ network, id: 'weapon_twin', price: 0.02, count: 7, disabled: false, onBuy: (quantity, total) => purchases.push({ quantity, total }) }));
    const button = tree.find(node => node.props.className === 'weapon-buy-button');
    assert.ok(button.props['aria-label'].startsWith(buyLabel), locale);
    assert.equal(tree.find(node => node.type === Price).props.testnet, network === 'testnet');
    button.props.onClick(); assert.deepEqual(purchases, [{ quantity: 5, total: 0.1 }]);
  }
});

const Panel = component('./ShipSelectionPanel.tsx', { ...base, './ShipPreview': { default: () => null }, './shipFleet': fleet, './shipEvolution': evolution, './shipAttributes': attributes,
  '../../../backend/src/shipNftCatalog': { shipNftEditions }, '../../../backend/src/shipLivery.ts': liveries,
  '../locales/shipNft': { shipNftCopy }, './shipNftVisibility': { shipNftMainnetVisible: true } });
const defaults = { view: 'shop', skin: fleet.playerSkins[0], focusStage: 2, ownedStage: 1, fleet: { 'grey-scout': { grey: 1 } }, shards: 1000, locale: 'en',
  offers: hangarCatalog.filter(offer => offer.kind === 'ship_upgrade'), message: '', selectedSkinId: 'grey-scout', t: value => value,
  onStageChange() {}, onColorChange() {}, onBuyStandard() {}, onEquipPreview() {}, onOpenShop() {} };

test('ship upgrade checkout requires released capability, existing base hull and prior stage', () => {
  for (const network of ['mainnet', 'testnet']) {
    const purchases = [];
    const tree = props => nodes(Panel({ ...defaults, paymentNetwork: network, upgradesPurchasable: true, onBuyUpgrade: stage => purchases.push(stage), ...props }));
    const buy = props => tree(props).find(node => node.type === 'button' && Array.isArray(node.props.children) && node.props.children[0] === 'Buy for');
    assert.equal(buy({ upgradesPurchasable: false }), undefined);
    assert.equal(Boolean(buy({}).props.disabled), false);
    assert.equal(Boolean(buy({ fleet: {} }).props.disabled), true);
    assert.equal(Boolean(buy({ purchaseBusy: true }).props.disabled), true);
    assert.equal(Boolean(buy({ focusStage: 3, ownedStage: 1 }).props.disabled), true);
    assert.equal(Boolean(buy({ focusStage: 3, ownedStage: 2 }).props.disabled), false);
    buy({}).props.onClick(); buy({ focusStage: 3, ownedStage: 2 }).props.onClick();
    assert.deepEqual(purchases, [2, 3]);
    const price = tree({}).find(node => node.type === Price && node.props.amount === 9.9);
    assert.equal(price.props.testnet, network === 'testnet');
  }
});

function missionHost(network, released) {
  const states = [], refs = [], effects = [], orders = [];
  let stateIndex = 0, refIndex = 0, mounted = false;
  const react = {
    useState(initial) { const i = stateIndex++; if (!(i in states)) states[i] = typeof initial === 'function' ? initial() : initial; return [states[i], value => { states[i] = value; }]; },
    useRef(value) { return refs[refIndex++] ??= { current: value }; }, useCallback: fn => fn,
    useEffect(fn) { if (!mounted) effects.push(fn); },
  };
  const Purchase = () => null;
  const Mission = component('./MissionWeaponShop.tsx', { ...base, react, '../lib/axiosClient': { axiosClient: { get: async () => ({ data: { offers: hangarCatalog, mainnetReleased: released } }) } },
    '../hooks/usePayments': { usePayments: () => ({ orderProduct: (...args) => orders.push(args), isLoading: false }) },
    './shipFleet': { shipSaveNetwork: network, selectedShip: () => ({ skin: { sprite: 1 }, color: { id: 'grey' } }) },
    '../../../backend/src/hangarCatalog': { hangarCatalog }, '../../../backend/src/paymentPolicy': { piPurchaseAllowed, testPiPurchaseAllowed },
    '../../../backend/src/missionPower': { missionPowerOffers: hangarCatalog.filter(offer => offer.kind === 'power') },
    './WeaponPurchase': { default: Purchase }, './WeaponPreview': { default: () => null }, './PowerPreview': { default: () => null }, './WeaponTutorial': { default: () => null }, './ReloadConfirmation': { default: () => null },
    './weaponSymbols': { weaponSymbols: ['', 'I', 'II', 'III', 'IV', 'V'] }, './missionWeaponShop.css': {} });
  const render = () => { stateIndex = refIndex = 0; const tree = Mission({ authenticated: true, admin: false, timers: [], refreshInventory: async () => false, refreshPowers: async () => {}, onPaymentBusy() {}, onClose() {} }); mounted = true; return nodes(tree); };
  render(); effects.forEach(fn => fn());
  return { render, orders, Purchase };
}

test('paused mission purchase UI requires Mainnet release and carries matching product, model, quantity and total', async () => {
  const blocked = missionHost('mainnet', false), ready = missionHost('mainnet', true), testnet = missionHost('testnet', false);
  for (let i = 0; i < 40; i++) await Promise.resolve();
  assert.equal(blocked.render().filter(node => node.type === blocked.Purchase).length, 0);
  const mainOffers = ready.render().filter(node => node.type === ready.Purchase);
  assert.equal(mainOffers.length, 4);
  const twin = mainOffers.find(node => node.props.id === 'weapon_twin');
  assert.equal(twin.props.network, 'mainnet'); assert.equal(Boolean(twin.props.disabled), false);
  twin.props.onBuy(5, 0.1);
  assert.deepEqual(structuredClone(ready.orders[0].slice(1, 3)), [0.1, { productId: 'weapon_twin', quantity: 5, weaponModel: 2 }]);
  assert.ok(ready.orders[0][0].endsWith(' · Pi')); assert.ok(!ready.orders[0][0].includes('Test-Pi'));
  const publicTestnet = testnet.render().filter(node => node.type === testnet.Purchase);
  assert.deepEqual(publicTestnet.map(node => node.props.id), ['weapon_twin', 'weapon_rapid_twin']);
  assert.ok(publicTestnet.every(node => node.props.network === 'testnet'));
});
