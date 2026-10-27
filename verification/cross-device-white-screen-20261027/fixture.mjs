// Existing real-handler fixture, isolated from all live accounts and networks.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

export const BASELINE = '97d74b412f7dc7ea2f4f8c05f483d87eb3451dba';
export const DIRECTORY = 'verification/cross-device-white-screen-20261027';
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
    async initialize() {
      const first = await h.call('progress', '/me', null, { method: 'GET' });
      assert.equal(first.code, 200);
      const { firstMissionSnapshot } = require('../../build/playerSave.js');
      Object.assign(h.profile(), {
        version: 1, balance: 5000, legacyImported: true, cardReveals: ['grey-scout-1'],
        mission: { sector: 1, phase: 'normal', rulesVersion: 2,
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
    inspect: () => {
      const s = stateRef.current, width = fieldSizeRef.current.width;
      return {
        status:s.status, phase:s.phase, encounter:s.encounter, sector:s.sector,
        hearts:s.hearts, score:s.score, shards:s.shards,
        enemies:s.asteroids.length, shots:s.shots.length, hostileShots:s.enemyShots.length,
        destroyed:s.destroyed, bossHealth:s.boss?.health ?? null, bonusHits:s.bonusHits,
        effects:s.effects.length, paidWeaponMs:s.paidWeaponMs, weapon:s.weaponLevel,
        frameAt:lastFrameRef.current, technicalPause, weaponMenuOpen,
        countdown:weaponCountdown, summary:!!bossSummaryRef.current,
        prepared:bossSummaryPrepared, failed:bossSummaryFailed,
        bonusX:s.bonusTargets[0] ? s.bonusTargets[0].x / width : null,
        player:{...s.player}, field:{...fieldSizeRef.current},
        canvas:canvasEffectResources()
      };
    }
  };
`;

export function instrumentController(source) {
  const anchor = '  const levelLabel =';
  assert.equal(source.split(anchor).length, 2, 'One exact controller insertion');
  const transformed = source.replace(anchor, hooks + '\n' + anchor);
  assert.equal(transformed.replace(hooks + '\n', ''), source);
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
