// Existing real-handler fixture, isolated from all live accounts and networks.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { restorePauseEvidenceChanges } from '../../frontend/scripts/pauseEvidenceReviewedChanges.mjs';

export const baselineController = restorePauseEvidenceChanges;
export const BASELINE = 'ce073547cf573375d141bf846f70e294138dbd73';
export const DIRECTORY = 'verification/boss2-forensics-20261028';
export const root = resolve(new URL('../..', import.meta.url).pathname);

export function createAccountFixture() {
  const require = createRequire(root + '/backend/src/handlers/progress.test.mjs');
  const source = readFileSync(root + '/backend/src/handlers/progress.test.mjs', 'utf8');
  const begin = source.indexOf('const get ='), end = source.indexOf('const snapshot =');
  assert.ok(begin > 0 && end > begin, 'Existing handler fixture boundaries');
  const harness = new Function('require', source.slice(begin, end) + '\nreturn harness;')(require);
  process.env.NODE_ENV = 'test';
  process.env.ADMIN_PI_TESTNET_UID = 'pilot-a';
  const h = harness();
  return {
    h,
    async initialize(startSector = 1) {
      const first = await h.call('progress', '/me', null, { method: 'GET' });
      assert.equal(first.code, 200);
      const { firstMissionSnapshot } = require('../../build/playerSave.js');
      Object.assign(h.profile(), {
        version: 1, balance: 5000, legacyImported: true, cardReveals: ['grey-scout-1'],
        mission: { sector: startSector, phase: startSector === 20 ? 'boss' : 'normal', rulesVersion: 2,
          snapshot: firstMissionSnapshot(3), savedAt: new Date().toISOString() },
      });
      for (let batch = 0; batch < 4; batch++) h.orders.push({ user: 'pilot-a', paid: true, owner_testnet_catalog: true,
        product_id: 'weapon_plasma', pi_payment_id: 'isolated-duration-stock-' + batch,
        weapon_model: 2, quantity: 25, payment_network: 'Pi Testnet' });
    },
  };
}

// One test-server-only insertion. The production controller is never edited.
// Protection is disclosed: duration coverage is not a mortality/balance test.
export const hooks = `
  (window as any).__crossDeviceTest = {
    protect: () => { impactCooldownRef.current = 1e9; },
    park: () => { stateRef.current.player = { x: .075, y: .84 }; },
    openReactor: () => {
      const s = stateRef.current;
      if (s.sector !== 20 || s.encounter !== 'boss-fight' || !s.boss) return false;
      for (const gun of s.boss.turrets) gun.health = 0;
      s.boss.health = s.boss.maxHealth / 2;
      s.player = { x: .075, y: .84 };
      setGame({ ...s });
      return true;
    },
    inspect: () => {
      const s = stateRef.current, width = fieldSizeRef.current.width;
      return {
        status:s.status, phase:s.phase, encounter:s.encounter, sector:s.sector, ownerDiagnostics,
        hearts:s.hearts, score:s.score, shards:s.shards,
        enemies:s.asteroids.length, shots:s.shots.length, hostileShots:s.enemyShots.length,
        bossId:s.boss?.config.id ?? null, liveTurrets:s.boss?.turrets.filter(g=>g.health>0).length ?? null,
        reactorOpen:!!s.boss && s.boss.turrets.length>0 && s.boss.turrets.every(g=>g.health<=0),
        coreVolley:s.boss?.core?.volley ?? 0,
        destroyed:s.destroyed, bossHealth:s.boss?.health ?? null, bonusHits:s.bonusHits,
        effects:s.effects.length, paidWeaponMs:s.paidWeaponMs, weapon:s.weaponLevel,
        frameAt:lastFrameRef.current, technicalPause, weaponMenuOpen,
        countdown:weaponCountdown, summary:!!bossSummaryRef.current, cards:rewardCards.length,
        prepared:bossSummaryPrepared, failed:bossSummaryFailed,
        bonusX:s.bonusTargets[0] ? s.bonusTargets[0].x / width : null,
        player:{...s.player}, field:{...fieldSizeRef.current},
        canvas:canvasEffectResources(), audio:soundRef.current?.diagnosticResourceStats ?? null,
        buildFlags:{development:import.meta.env.DEV,production:import.meta.env.PROD}
      };
    }
  };
`;
const pauseObserver = `
import { observeSessionDiagnostics as observeBossLabEvents } from '../lib/sessionDiagnosticEvents';
const bossLabPauseRows: Record<string, unknown>[] = [];
(window as any).__bossLabPauseEvents = bossLabPauseRows;
(window as any).__bossLabStopPauseObserver = observeBossLabEvents((kind, details) => {
  if (kind !== 'pause') return;
  bossLabPauseRows.push({ at: performance.now(), ...details });
  if (bossLabPauseRows.length > 64) bossLabPauseRows.shift();
});
`;

export function instrumentController(source) {
  const anchor = '  const levelLabel =';
  assert.equal(source.split(anchor).length, 2, 'One exact controller insertion');
  const frameAnchor = '    const simulate = (time: number, delta: number, present: boolean) => {\n      const state = stateRef.current;';
  const direct = '\n      if ((window as any).__bossLabDirect && !(window as any).__bossLabOpened && state.status === "playing" && state.sector === 20 && state.encounter === "boss-fight") {\n        (window as any).__bossLabOpened = (window as any).__crossDeviceTest.openReactor();\n      }';
  assert.equal(source.split(frameAnchor).length, 2, 'One exact existing-frame hook');
  const transformed = pauseObserver + source.replace(anchor, hooks + '\n' + anchor).replace(frameAnchor, frameAnchor + direct);
  assert.equal(transformed.replace(pauseObserver, '').replace(hooks + '\n', '').replace(direct, ''), source);
  return transformed;
}

// Keep the observed boss alive without suppressing shots, hit effects, audio or
// normal weapon cadence. Test-only health floor; never in a published module.
export function instrumentBossDamage(source) {
  const anchor = 'boss.health = Math.max(0, boss.health - damage * 2);';
  assert.equal(source.split(anchor).length, 2, 'One exact boss damage assignment');
  const replacement = 'boss.health = typeof window !== "undefined" && (window as any).__bossLabHold && boss.config.id === 2\n    ? Math.max(Math.min(boss.health, boss.maxHealth * .4), boss.health - damage * 2) : Math.max(0, boss.health - damage * 2);';
  const transformed = source.replace(anchor, replacement);
  assert.equal(transformed.replace(replacement, anchor), source);
  return transformed;
}

export function instrumentInputEvidence(source) {
  const anchor = 'const enabled = () => { try { return active(); } catch { return false; } };';
  const navigation = '  if (!host.addEventListener || !host.removeEventListener) return () => {};';
  const replacement = 'const enabled = () => { try { return !(typeof window !== "undefined" && (window as any).__bossLabNoInputEvidence) && active(); } catch { return false; } };';
  const navigationReplacement = '  if (typeof window !== "undefined" && (window as any).__bossLabNoInputEvidence) return () => {};\n' + navigation;
  assert.equal(source.split(anchor).length, 2); assert.equal(source.split(navigation).length, 2);
  const transformed = source.replace(anchor, replacement).replace(navigation, navigationReplacement);
  assert.equal(transformed.replace(replacement, anchor).replace(navigationReplacement, navigation), source);
  return transformed;
}

export function configuration(name, devices) {
  const profiles = {
    'android-phone': { engine: 'chromium', preset: 'Pixel 7', viewport: { width: 412, height: 839 } },
    'android-tablet': { engine: 'chromium', preset: 'Galaxy Tab S4', viewport: { width: 820, height: 1180 } },
    'iphone': { engine: 'webkit', preset: 'iPhone 15 Pro Max', viewport: { width: 430, height: 825 } },
  };
  const selected = profiles[name];
  assert.ok(selected && devices[selected.preset], 'Known explicit emulation profile');
  const { defaultBrowserType, ...device } = devices[selected.preset];
  return { ...selected, context: { ...device, viewport: selected.viewport, locale: 'en-US', reducedMotion: 'no-preference' } };
}
