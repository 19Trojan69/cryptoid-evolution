import test from 'node:test';
import assert from 'node:assert/strict';
import { selectionHost, weaponMenu, networkFailure, handlerSelectionHost } from './weaponReloadRecoveryHost.mjs';

async function lostAutomaticReply() {
  const f = selectionHost();
  let lost = true;
  f.env.afterGrant = async () => { if (lost) { lost = false; throw networkFailure(); } };
  f.env.reloadRequestRef.current(2); await f.flush();
  assert.equal(f.receipts.size, 1); assert.equal(f.balances.weapon_twin, 9);
  assert.equal(f.env.activationRef.current?.level, 2);
  return f;
}

test('automatic feedback follows the actual delayed response and cannot return after its binary window was consumed', async () => {
  for (const mode of ['confirmed', 'failed', 'consumed']) {
    const f = selectionHost();
    let release;
    f.env.beforePost = () => new Promise(resolve => { release = resolve; });
    if (mode === 'failed') f.env.afterGrant = async () => { throw networkFailure(); };
    f.env.reloadRequestRef.current(2);
    const notice = { source: 'paid', level: 2, shown: true, window: '19:0', reload: 'pending' };
    f.env.weaponSpentRef.current = notice;
    await f.flush();
    assert.equal(notice.reload, 'pending'); assert.equal(f.env.weaponBusy, true);
    if (mode === 'consumed') f.env.weaponSpentRef.current = null;
    release(); await f.flush();
    assert.equal(f.env.weaponBusy, false);
    assert.equal(f.receipts.size, 1); assert.equal(f.balances.weapon_twin, 9);
    if (mode === 'consumed') assert.equal(f.env.weaponSpentRef.current, null);
    else assert.equal(notice.reload, mode === 'confirmed' ? 'complete' : 'failed');
  }
});

test('an expired automatic charge can be reconciled before choosing the standard weapon, with the same receipt', async () => {
  const f = await lostAutomaticReply(); const id = f.requests[0].requestId;
  f.openWeaponSelection(); await f.selectWeaponLevel(1);
  assert.equal(f.env.activationRef.current, null);
  assert.deepEqual(f.requests.map(r => r.requestId), [id, id]);
  assert.equal(f.receipts.size, 1); assert.equal(f.balances.weapon_twin, 9);
  assert.equal(f.state.weaponTimers[2], 60000); assert.equal(f.state.weaponSource, 'standard');
  assert.equal(f.env.weaponError, ''); assert.equal(f.env.weaponBusyRef.current, false);
});

test('choosing an already running different weapon resolves the pending charge without refilling that timer', async () => {
  const f = await lostAutomaticReply(); f.state.weaponTimers[3] = 23000;
  f.openWeaponSelection(); await f.selectWeaponLevel(3);
  assert.equal(f.env.activationRef.current, null); assert.equal(f.requests.length, 2);
  assert.equal(f.state.weaponTimers[3], 23000); assert.equal(f.state.paidWeaponMs, 23000);
  assert.equal(f.state.weaponLevel, 3); assert.equal(f.receipts.size, 1);
});

test('choosing a new different charge confirms the old receipt before saving and issuing exactly one new receipt', async () => {
  const f = await lostAutomaticReply(); f.openWeaponSelection(); await f.selectWeaponLevel(3);
  assert.deepEqual(f.requests.map(r => r.level), [2, 2, 3]);
  assert.equal(f.requests[0].requestId, f.requests[1].requestId);
  assert.notEqual(f.requests[1].requestId, f.requests[2].requestId);
  assert.equal(f.receipts.size, 2); assert.equal(f.balances.weapon_twin, 9); assert.equal(f.balances.weapon_rapid_twin, 9);
  assert.equal(f.saves.at(-1).weaponTimers[2], 60000);
  assert.equal(f.state.weaponLevel, 3); assert.equal(f.env.weaponError, '');
});

test('a picked-up weapon can be selected after pending confirmation without purchasing or refilling the pickup', async () => {
  const f = await lostAutomaticReply(); f.openWeaponSelection();
  f.state.pickupWeaponLevel = 4; f.state.pickupWeaponMs = 18000;
  await f.selectPickupWeapon(); await f.flush();
  assert.equal(f.env.activationRef.current, null); assert.equal(f.requests.length, 2);
  assert.equal(f.state.weaponSource, 'pickup'); assert.equal(f.state.weaponLevel, 4);
  assert.equal(f.state.pickupWeaponMs, 18000); assert.equal(f.receipts.size, 1);
});

test('the actual menu permits a new choice and makes the pending receipt retryable even if that weapon looks active', () => {
  const calls = [];
  const menu = weaponMenu({ pendingLevel: 2, activeLevel: 2, source: 'pickup', pickupLevel: 2, pickupMs: 18000,
    onSelect: level => calls.push(level), onPickup() {} });
  const allButtons = node => [node, ...(node?.props?.children || []).flatMap(child => child && typeof child === 'object' ? allButtons(child) : [])];
  const retry = allButtons(menu.card(2)).find(n => n?.props?.className === 'mission-select');
  const other = allButtons(menu.card(3)).find(n => n?.props?.className === 'mission-select');
  assert.ok(!other.props.disabled, 'a confirmed or owned alternative remains selectable');
  assert.ok(!retry.props.disabled); retry.props.onClick();
  assert.deepEqual(calls, [2]); assert.ok(retry.props.children.includes('Retry'));
});

test('successful free or cached manual selections clear the old rejection text', async () => {
  for (const level of [1, 3]) {
    const f = selectionHost(); f.openWeaponSelection(); f.env.weaponError = 'Not confirmed. Retry the same weapon.';
    f.state.weaponTimers[3] = 14000; await f.selectWeaponLevel(level);
    assert.equal(f.env.weaponError, ''); assert.equal(f.requests.length, 0);
  }
});

test('failed inventory loading cannot disable replay of an uncertain activation or inventory refresh', () => {
  const calls = [];
  const menu = weaponMenu({ pendingLevel: 2, initialStock: {},
    onSelect: level => calls.push(level) }, { ready: false });
  const retry = menu.nodes.find(n => n.props?.className === 'mission-select'
    && n.props.children.includes('Retry'));
  assert.ok(retry, 'the original receipt has a retry control even with no inventory');
  assert.equal(retry.props.disabled, false);
  retry.props.onClick();
  assert.deepEqual(calls, [2]);
  assert.equal(menu.nodes.find(n => n.props?.className === 'mission-refresh').props.disabled, false);
  assert.ok(menu.nodes.filter(n => n.type === 'WeaponPurchase').every(n => n.props.disabled),
    'an uncertain grant still blocks new purchases');
});

test('a continuing connection failure retains the original receipt and cannot consume a different charge', async () => {
  const f = await lostAutomaticReply(); f.openWeaponSelection();
  f.env.beforePost = async () => { throw networkFailure(); };
  await f.selectWeaponLevel(3);
  assert.equal(f.env.activationRef.current?.id, f.requests[0].requestId);
  assert.deepEqual(f.requests.map(r => r.level), [2, 2]);
  assert.equal(f.state.weaponLevel, 1); assert.equal(f.receipts.size, 1);
  assert.equal(f.env.weaponBusyRef.current, false); assert.equal(f.env.reloadPendingRef.current, false);
});

test('a retry of the original charge never allocates a new id or overwrites it with a checkpoint', async () => {
  const f = await lostAutomaticReply(); f.openWeaponSelection(); const saved = f.saves.length;
  await f.selectWeaponLevel(2);
  assert.equal(f.requests[0].requestId, f.requests[1].requestId);
  assert.equal(f.saves.length, saved); assert.equal(f.receipts.size, 1);
  assert.equal(f.state.weaponLevel, 2); assert.equal(f.env.activationRef.current, null);
});

test('a pickup obtained while automatic confirmation waits keeps the player selection and receives no free refill', async () => {
  const f = selectionHost(); let release;
  f.env.beforePost = () => new Promise(resolve => { release = resolve; });
  f.env.reloadRequestRef.current(2); await f.flush();
  f.state.weaponSource = 'pickup'; f.state.weaponLevel = f.state.pickupWeaponLevel = 4; f.state.pickupWeaponMs = 13000;
  release(); await f.flush();
  assert.equal(f.state.weaponSource, 'pickup'); assert.equal(f.state.weaponLevel, 4);
  assert.equal(f.state.pickupWeaponMs, 13000); assert.equal(f.state.weaponTimers[2], 60000);
});

test('a late response after a replaced mission cannot mutate the new mission', async () => {
  const f = selectionHost(); let release;
  f.env.beforePost = () => new Promise(resolve => { release = resolve; });
  f.env.reloadRequestRef.current(2); await f.flush();
  const next = structuredClone(f.state); f.env.stateRef.current = next; f.env.scoreRunRef.current = 'new-run';
  f.env.activationRef.current = null; f.env.weaponBusyRef.current = false;
  release(); await f.flush();
  assert.equal(next.weaponTimers[2], 0); assert.equal(next.weaponLevel, 1);
});

test('automatic reload remains bounded over repeated cycles and rejected duplicate triggers', async () => {
  const f = selectionHost();
  for (let cycle = 0; cycle < 5; cycle++) {
    f.state.weaponTimers[2] = f.state.paidWeaponMs = 0; f.state.weaponSource = 'standard'; f.state.weaponLevel = 1;
    assert.equal(f.env.reloadRequestRef.current(2), true);
    assert.equal(f.env.reloadRequestRef.current(2), false);
    await f.flush(); assert.equal(f.state.weaponLevel, 2);
  }
  assert.equal(f.receipts.size, 5); assert.equal(f.balances.weapon_twin, 5);
  assert.equal(f.env.weaponBusyRef.current, false); assert.equal(f.env.reloadPendingRef.current, false);
});

test('automatic reload still confirms exactly one charge without an obsolete feedback timeout',async()=>{
 const f=selectionHost();assert.equal(f.env.reloadRequestRef.current(2),true);await f.flush();
 assert.equal(f.state.weaponLevel,2);assert.equal(f.requests.length,1);assert.equal(f.timers.size,0);
 f.advance(60000);assert.equal(f.state.weaponLevel,2);assert.equal(f.requests.length,1);
});

test('an already spent confirmed receipt does not silently allocate another charge on retry', async () => {
  const f = await lostAutomaticReply(); f.openWeaponSelection(); f.env.confirmedMs = 0;
  await f.selectWeaponLevel(2);
  assert.equal(f.requests.length, 2); assert.equal(f.receipts.size, 1);
  assert.equal(f.state.weaponTimers[2], 0); assert.equal(f.state.weaponSource, 'standard');
  assert.equal(f.env.activationRef.current, null);
});

test('an invalid confirmation retains the receipt and cannot introduce a non-finite timer', async () => {
  const f = selectionHost(); f.env.confirmedMs = NaN;
  f.env.reloadRequestRef.current(2); await f.flush();
  assert.equal(f.state.weaponTimers[2], 0); assert.equal(f.state.weaponLevel, 1);
  assert.equal(f.env.activationRef.current?.level, 2); assert.equal(f.env.weaponBusyRef.current, false);
});

test('a definitive rejection releases the pending gate without starting a different activation', async () => {
  const f = await lostAutomaticReply(); f.openWeaponSelection();
  f.env.beforePost = async () => { throw { response: { status: 409 } }; };
  await f.selectWeaponLevel(3);
  assert.equal(f.env.activationRef.current, null); assert.equal(f.env.weaponBusyRef.current, false);
  assert.deepEqual(f.requests.map(r => r.level), [2, 2]); assert.equal(f.receipts.size, 1);
});

test('a failed automatic activation cannot erase a newer manual failure', async () => {
  const f = await lostAutomaticReply(); f.advance(1000); f.openWeaponSelection();
  f.env.beforePost = async () => { throw networkFailure(); };
  await f.selectWeaponLevel(2); f.advance(2000);
  assert.equal(f.env.weaponError, 'Not confirmed. Retry the same weapon.');
  assert.equal(f.env.weaponBusyRef.current, false);
});

test('actual account handlers reconcile a lost automatic response, then honor a new paid selection with no double consumption', async () => {
  const f = await handlerSelectionHost(); f.loseNextReply();
  f.env.reloadRequestRef.current(2); await f.flush();
  assert.equal(f.env.activationRef.current?.level, 2);
  assert.equal(f.h.docs[0].weaponStockByNetwork.testnet.balances.weapon_twin, 2);
  f.openWeaponSelection(); await f.selectWeaponLevel(3);
  assert.deepEqual(f.requests.map(r => r.level), [2, 2, 3]);
  assert.equal(f.requests[0].requestId, f.requests[1].requestId);
  assert.equal(f.h.docs[0].weaponStockByNetwork.testnet.balances.weapon_twin, 2);
  assert.equal(f.h.docs[0].weaponStockByNetwork.testnet.balances.weapon_rapid_twin, 2);
  assert.equal(Object.keys(f.h.docs[0].weaponStockByNetwork.testnet.activations).length, 2);
  assert.equal(f.h.profile().mission.snapshot.weaponTimers[2], 45000);
  assert.equal(f.h.profile().mission.snapshot.weaponTimers[3], 45000);
  assert.equal(f.env.activationRef.current, null); assert.equal(f.state.weaponLevel, 3);
});

test('actual account handlers accept a completed charge cycle and repeat its lost response without another debit', async () => {
  const f = await handlerSelectionHost();
  f.env.reloadRequestRef.current(2); await f.flush();
  assert.equal(f.state.weaponLevel, 2);
  f.state.weaponTimers[2] = f.state.paidWeaponMs = 0; f.state.paidWeaponLevel = 1;
  f.state.weaponSource = 'standard'; f.state.weaponLevel = 1;
  f.loseNextReply(); f.env.reloadRequestRef.current(2); await f.flush();
  assert.equal(f.env.activationRef.current?.level, 2);
  f.openWeaponSelection(); await f.selectWeaponLevel(1);
  assert.equal(f.requests.length, 3); assert.equal(f.requests[1].requestId, f.requests[2].requestId);
  assert.notEqual(f.requests[0].requestId, f.requests[1].requestId);
  assert.equal(f.h.docs[0].weaponStockByNetwork.testnet.balances.weapon_twin, 1);
  assert.equal(Object.keys(f.h.docs[0].weaponStockByNetwork.testnet.activations).length, 2);
  assert.equal(f.state.weaponLevel, 1); assert.equal(f.env.activationRef.current, null);
});

const missingCombat = () => ({ response: { status: 409, data: { error: 'save_before_activation' } } });

test('a stage reward between checkpoint and activation is repaired using the actual account handlers', async () => {
  const f = await handlerSelectionHost();
  const post = f.env.axiosClient.post;
  let completed = false;
  f.env.axiosClient.post = async (path, body) => {
    if (!completed) {
      completed = true;
      const result = await f.h.call('rewards', '/event', { runId: body.runId, kind: 'block', level: 1, stage: 1,
        save: structuredClone(f.h.profile().mission.snapshot) });
      assert.equal(result.code, 200);
      assert.equal(f.h.profile().mission.combat, undefined);
      f.state.sector = 2;
    }
    return post(path, body);
  };
  f.env.reloadRequestRef.current(2); await f.flush();
  assert.equal(f.requests.length, 2);
  assert.equal(f.requests[0].requestId, f.requests[1].requestId);
  assert.equal(f.saves.length, 2);
  assert.equal(f.h.profile().mission.sector, 2);
  assert.equal(f.h.profile().mission.combat.stage, 2);
  assert.equal(f.h.docs[0].weaponStockByNetwork.testnet.balances.weapon_twin, 2);
  assert.equal(Object.keys(f.h.docs[0].weaponStockByNetwork.testnet.activations).length, 1);
  assert.equal(f.state.weaponSource, 'paid');
  assert.equal(f.state.weaponLevel, 2);
  assert.equal(f.env.weaponError, '');
});

test('only the explicit missing-combat rejection permits one checkpoint repair with the same receipt', async () => {
  const f = selectionHost(); let denied = false;
  f.env.beforePost = async () => { if (!denied) { denied = true; throw missingCombat(); } };
  f.env.reloadRequestRef.current(2); await f.flush();
  assert.equal(f.saves.length, 2); assert.equal(f.requests.length, 2);
  assert.equal(f.requests[0].requestId, f.requests[1].requestId);
  assert.equal(f.balances.weapon_twin, 9); assert.equal(f.receipts.size, 1);
  assert.equal(f.state.weaponTimers[2], 60000); assert.equal(f.state.weaponLevel, 2);
  assert.equal(f.env.activationRef.current, null); assert.equal(f.env.weaponBusyRef.current, false);
});

test('a repeated missing-combat rejection stops after one repair and never consumes a charge', async () => {
  const f = selectionHost(); f.env.beforePost = async () => { throw missingCombat(); };
  f.env.reloadRequestRef.current(2); await f.flush();
  assert.equal(f.requests.length, 2); assert.equal(f.saves.length, 2);
  assert.equal(f.receipts.size, 0); assert.equal(f.balances.weapon_twin, 10);
  assert.equal(f.env.activationRef.current, null); assert.equal(f.env.weaponBusyRef.current, false);
  assert.equal(f.state.weaponLevel, 1);
});

test('an uncertain reply after checkpoint repair remains retryable without another stock debit', async () => {
  const f = selectionHost(); let denied = false, lost = false;
  f.env.beforePost = async () => { if (!denied) { denied = true; throw missingCombat(); } };
  f.env.afterGrant = async () => { if (!lost) { lost = true; throw networkFailure(); } };
  f.env.reloadRequestRef.current(2); await f.flush();
  assert.equal(f.env.activationRef.current?.id, f.requests[0].requestId);
  assert.equal(f.receipts.size, 1); assert.equal(f.balances.weapon_twin, 9);
  f.openWeaponSelection(); await f.selectWeaponLevel(2);
  assert.equal(f.requests.length, 3);
  assert.ok(f.requests.every(r => r.requestId === f.requests[0].requestId));
  assert.equal(f.saves.length, 2); assert.equal(f.balances.weapon_twin, 9);
  assert.equal(f.state.weaponLevel, 2); assert.equal(f.env.activationRef.current, null);
});

test('other activation conflicts never checkpoint or retry automatically', async () => {
  for (const code of ['run_replaced', 'activation_conflict', 'weapon_already_active', 'weapon_stock_empty', 'inventory_changed', undefined]) {
    const f = selectionHost();
    f.env.beforePost = async () => { throw { response: { status: 409, data: { error: code } } }; };
    f.env.reloadRequestRef.current(2); await f.flush();
    assert.equal(f.requests.length, 1); assert.equal(f.saves.length, 1);
    assert.equal(f.receipts.size, 0); assert.equal(f.env.weaponBusyRef.current, false);
  }
});

test('a missing-combat rejection during a clear phase remains available for a later manual selection', async () => {
  const f = selectionHost(); let denied = false;
  f.state.phase = 'SECTOR_CLEAR';
  f.env.beforePost = async () => { if (!denied) { denied = true; throw missingCombat(); } };
  f.env.reloadRequestRef.current(2); await f.flush();
  assert.equal(f.requests.length, 1); assert.equal(f.saves.length, 1);
  assert.equal(f.receipts.size, 0); assert.equal(f.env.weaponBusyRef.current, false);
  f.state.phase = 'ENTRY'; f.openWeaponSelection(); await f.selectWeaponLevel(2);
  assert.equal(f.state.weaponLevel, 2); assert.equal(f.receipts.size, 1);
});

test('a mission replaced while repairing a rejected activation receives no late grant', async () => {
  const f = selectionHost();
  f.env.beforePost = async () => { throw missingCombat(); };
  const save = f.env.saveCombat;
  f.env.saveCombat = async () => {
    await save();
    if (f.saves.length === 2) {
      f.env.scoreRunRef.current = 'replacement-run';
      f.env.activationRef.current = null; f.env.weaponBusyRef.current = false;
    }
  };
  f.env.reloadRequestRef.current(2); await f.flush();
  assert.equal(f.saves.length, 2); assert.equal(f.requests.length, 1);
  assert.equal(f.receipts.size, 0); assert.equal(f.state.weaponLevel, 1);
  assert.equal(f.env.activationRef.current, null);
});

