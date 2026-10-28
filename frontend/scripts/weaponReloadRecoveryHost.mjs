import fs from 'node:fs';
import { build, transformSync } from 'esbuild';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { hangarCatalog } from '../../backend/src/hangarCatalog.ts';
import { isTestnetWeaponPurchaseEnabled } from '../../backend/src/paymentPolicy.ts';
import { weaponSymbols } from '../src/pages/weaponSymbols.ts';
import { updateWeaponReloadNotice } from '../src/pages/weaponSpentNotice.ts';
import { recordPauseEvidence } from '../src/pages/pauseDiagnostics.ts';

// Execute the actual event handlers/component; only React scheduling, clock and
// transport are replaced. No browser session, live account or paid API is used.
const sourceOf = path => process.env.CRYPTOID_WEAPON_BEFORE === '1'
  ? execFileSync('git', ['show', '94825bdcc78c7be27632a12340732a27088aebe2:frontend/' + path], { cwd: new URL('../../', import.meta.url), encoding: 'utf8' })
  : fs.readFileSync(new URL('../' + path, import.meta.url), 'utf8');
export function selectionHost() {
  const source = sourceOf('src/pages/GamePage.tsx');
  const start = source.indexOf('  const openWeaponSelection =');
  const end = source.indexOf('  const restart =', start);
  if (start < 0 || end < 0) throw Error('Missing actual weapon handlers');
  const sync = source.slice(source.indexOf('const syncSelectedWeapon ='), source.indexOf('const CockpitIcon ='));
  const code = transformSync(sync + source.slice(start, end), { loader: 'tsx' }).code;
  const state = { hearts: 3, status: 'playing', weaponSource: 'standard', weaponLevel: 1,
    paidWeaponLevel: 1, paidWeaponMs: 0, pickupWeaponLevel: 1, pickupWeaponMs: 0, weaponCap: 5,
    weaponTimers: [0, 0, 0, 0, 0, 0], unlockedWeapons: [1, 2, 3] };
  const ref = current => ({ current });
  let clock = 0, timerId = 0, requestId = 0;
  const timers = new Map(), requests = [], receipts = new Map(), saves = [];
  const balances = { weapon_twin: 10, weapon_rapid_twin: 10 };
  const env = {
    updateWeaponReloadNotice,
    ownerDiagnostics: true, sessionDiagnostic() {}, recordPauseEvidence, lastFrameRef: ref(0),
    stateRef: ref(state), scoreRunRef: ref('isolated-run'), weaponMountedRef: ref(true),
    weaponBusyRef: ref(false), activationRef: ref(null), adminRunRef: ref(false), bossSummaryRef: ref(null),
    stockRef: ref({ ...balances }), reloadPendingRef: ref(false), reloadRequestRef: ref(null),
    automaticStartRunRef: ref(null), confirmedReloadRef: ref(null), setConfirmedReload(level) { env.confirmedReload = level; },
    weaponSpentRef: ref(null), reloadNoticeTimerRef: ref(null), soundRef: ref({ play() {} }), musicRef: ref({ pause() {} }),
    accountRun: true, weaponMenuOpen: false, weaponCountdown: null, weaponError: '', weaponBusy: false,
    PURCHASED_WEAPON_DURATION_MS: 60000, autoReloading: null,
    crypto: { randomUUID: () => 'isolated-request-' + ++requestId },
    setWeaponSpent(value) { env.weaponSpent = value; }, clearControls() {}, setGame(value) { env.lastGame = value; },
    setWeaponMenuOpen(value) { env.weaponMenuOpen = value; },
    setWeaponError(value) { env.weaponError = value; },
    setWeaponBusy(value) { env.weaponBusy = value; },
    setWeaponStock(value) { env.weaponStock = value; },
    setAutoReloading(value) { env.autoReloading = value; },
    async saveCombat() { saves.push(structuredClone(env.stateRef.current)); },
    window: {
      setTimeout(fn, ms) { const id = ++timerId; timers.set(id, { at: clock + ms, fn }); return id; },
      clearTimeout(id) { timers.delete(id); },
    },
    axiosClient: { async post(path, body) {
      if (path !== '/hangar/weapon/activate') throw Error('Unexpected transport');
      requests.push({ ...body });
      if (env.beforePost) await env.beforePost(body);
      const product = body.level === 2 ? 'weapon_twin' : 'weapon_rapid_twin';
      if (!receipts.has(body.requestId)) {
        balances[product]--; receipts.set(body.requestId, { ...body });
      }
      if (env.afterGrant) await env.afterGrant(body);
      return { data: { remainingMs: env.confirmedMs ?? 60000, weaponStock: { ...balances } } };
    } },
  };
  const api = new Function('env', 'with (env) {\n' + code
    + '\nreturn { openWeaponSelection, selectWeaponLevel, selectPickupWeapon }; }')(env);
  return { ...api, env, state, requests, receipts, balances, saves, timers,
    async flush() { for (let i = 0; i < 1000; i++) await Promise.resolve(); },
    advance(ms) { clock += ms; for (const [id, timer] of [...timers]) if (timer.at <= clock) { timers.delete(id); timer.fn(); } },
  };
}

export function weaponMenu(props, { ready = true } = {}) {
  const source = sourceOf('src/pages/MissionWeaponShop.tsx');
  const code = transformSync(source.replace(/^import .*;\r?\n/gm, '')
    .replace('export default function', 'function'), { loader: 'tsx', jsxFactory: 'element', jsxFragment: 'fragment' }).code;
  let hook = 0;
  const env = {
    useState(initial) { const index = hook++; return [index === 2 ? ready : typeof initial === 'function' ? initial() : initial, () => {}]; },
    useRef: value => ({ current: value }), useCallback: fn => fn, useEffect() {},
    useLocale: () => ({ t: value => value, locale: 'en' }),
    selectedShip: () => ({ skin: { sprite: 0 }, color: { id: 'grey' } }),
    usePayments: () => ({ orderProduct() {}, isLoading: false }),
    element: (type, props, ...children) => ({ type, props: { ...props, children: children.flat(Infinity) } }),
    fragment: 'fragment',
    hangarCatalog, isTestnetWeaponPurchaseEnabled, shipSaveNetwork: 'testnet',
    ReloadConfirmation: 'ReloadConfirmation', weaponSymbols, WeaponPreview: 'WeaponPreview', WeaponPurchase: 'WeaponPurchase', WeaponTutorial: 'WeaponTutorial', PiPrice: 'PiPrice',
  };
  const component = new Function('env', 'with (env) {\n' + code + '\nreturn MissionWeaponShop; }')(env);
  const tree = component({ authenticated: true, admin: false, timers: [0, 0, 0, 0, 0, 0],
    onInventory: async () => {}, onClose() {}, initialStock: { weapon_twin: 2, weapon_rapid_twin: 2 }, ...props });
  const nodes = [];
  const visit = node => { if (!node || typeof node !== 'object') return; nodes.push(node); node.props?.children?.forEach(visit); };
  visit(tree);
  return { tree, nodes, card: level => nodes.find(n => n.type === 'article' && n.props['data-level'] === level) };
}

export const networkFailure = () => Error('Isolated lost response');

let backendDefinitions;
export async function actualBackend() {
  backendDefinitions ??= (async () => {
    const root = new URL('../../', import.meta.url), requireNode = createRequire(import.meta.url);
    const modules = ['handlers/progress', 'handlers/hangar', 'handlers/rewards', 'handlers/leaderboard', 'playerSave', 'combatCheckpoint'];
    const result = await build({ absWorkingDir: root.pathname,
      entryPoints: modules.map(name => 'backend/src/' + name + '.ts'),
      outbase: 'backend/src', outdir: 'backend/build', write: false, bundle: true,
      platform: 'node', format: 'cjs', external: ['express', 'mongodb', 'tinyld'], logLevel: 'silent' });
    const cache = new Map();
    const requireLocal = name => {
      if (!name.startsWith('../../build/')) return requireNode(name);
      const path = name.slice('../../build/'.length);
      if (!cache.has(path)) {
        const file = result.outputFiles.find(file => file.path.endsWith('/backend/build/' + path));
        if (!file) throw Error('Unexpected backend dependency ' + path);
        const module = { exports: {} }; cache.set(path, module);
        new Function('module', 'exports', 'require', file.text)(module, module.exports, requireLocal);
      }
      return cache.get(path).exports;
    };
    const source = fs.readFileSync(new URL('backend/src/handlers/progress.test.mjs', root), 'utf8');
    const definitions = source.slice(source.indexOf('const get ='), source.indexOf('const snapshot ='));
    const start = source.indexOf('const combat =');
    const combat = source.slice(start, source.indexOf('\ntest(', start));
    const api = new Function('require', definitions + combat + '\nreturn { harness, combat };')(requireLocal);
    return { ...api, firstMissionSnapshot: requireLocal('../../build/playerSave.js').firstMissionSnapshot };
  })();
  return backendDefinitions;
}

export async function handlerSelectionHost() {
  const { harness, combat, firstMissionSnapshot } = await actualBackend();
  const h = harness(); await h.call('progress', '/me', null, { method: 'GET' });
  const started = await h.call('hangar', '/start', { action: 'new', rulesVersion: 2,
    version: h.profile().version, startKey: 'isolated-weapon-start-0001' });
  if (started.code !== 200) throw Error(JSON.stringify(started.body));
  h.orders.push(...['weapon_twin', 'weapon_rapid_twin'].map(product_id => ({ user: 'pilot-a',
    paid: true, product_id, pi_payment_id: 'isolated-' + product_id, quantity: 3, weapon_model: 2, payment_network: 'Pi Testnet' })));
  await h.call('hangar', '/inventory', null, { method: 'GET' });
  const f = selectionHost(); f.env.scoreRunRef.current = h.session.scoreRun.id;
  let sequence = 0, loseReply = false;
  const check = response => { if (response.code >= 400) throw { response: { status: response.code, data: response.body } }; return { data: response.body }; };
  f.env.saveCombat = async () => {
    f.saves.push(structuredClone(f.state));
    const snapshot = firstMissionSnapshot(3);
    for (const key of ['weaponSource', 'paidWeaponLevel', 'paidWeaponMs', 'pickupWeaponLevel', 'pickupWeaponMs', 'weaponTimers']) snapshot[key] = structuredClone(f.state[key]);
    check(await h.call('progress', '/checkpoint', { runId: h.session.scoreRun.id,
      combat: combat({ sequence: ++sequence, stage: f.state.sector || 1 }), save: snapshot }));
  };
  f.env.axiosClient.post = async (path, body) => {
    if (path !== '/hangar/weapon/activate') throw Error('Unexpected live-looking path');
    f.requests.push({ ...body });
    const result = check(await h.call('hangar', '/weapon/activate', body));
    if (loseReply) { loseReply = false; throw networkFailure(); }
    return result;
  };
  return { ...f, h, loseNextReply() { loseReply = true; } };
}

