import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';

export const VERIFIER_SHA256 = '614df63b6b04c28446a0294972ff2e9125be8275e1d953ee2c06482dd2180af0';
const digest = text => createHash('sha256').update(text).digest('hex');
const once = (text, before, after) => {
  assert.equal(text.split(before).length, 2, 'One exact external-driver insertion');
  return text.replace(before, after);
};

// Adapt only a copy of the existing TEST DRIVER outside the frozen checkout.
// No served source/build file or browser/application API is patched.
export function adaptVerifier(original, originalUrl, workload) {
  assert.equal(digest(original), VERIFIER_SHA256, 'Exact unchanged source verifier required');
  assert.ok(['existing-left', 'reactor-line'].includes(workload));
  const setupAnchor = '    const first = await observe(); if (clockProbe) probeFirst = first; verifyActive(first, first);';
  const setup = `    const reactorLineWorkload = ${JSON.stringify(workload)};
    const placementBefore = await observe();
    verifyActive(placementBefore, placementBefore);
    assert.ok(Math.abs(placementBefore.scene.player.x - .075) < .01, 'Original reactor seed starts left');
    row.reactorLineWorkload = { condition: reactorLineWorkload,
      playerBefore: { ...placementBefore.scene.player }, bossHealthBefore: placementBefore.scene.bossHealth,
      nativeFieldTap: false, initialBossDamageVerified: false };
    if (reactorLineWorkload === 'reactor-line') {
      const fieldBox = await page.locator('.game-field').boundingBox();
      assert.ok(fieldBox && fieldBox.width > 0 && fieldBox.height > 0);
      // Ordinary one-finger field tap; never set player/game state in evaluate.
      await page.touchscreen.tap(fieldBox.x + fieldBox.width * .5, fieldBox.y + fieldBox.height * .84);
      await page.waitForFunction(() => {
        const s = window.__crossDeviceTest?.inspect();
        return s?.status === 'playing' && Math.abs(s.player.x - .5) < .02;
      }, null, { timeout: 10000 });
      await page.waitForFunction(health => {
        const s = window.__crossDeviceTest?.inspect();
        return s?.status === 'playing' && s.bossHealth < health;
      }, placementBefore.scene.bossHealth, { timeout: 45000 });
      row.reactorLineWorkload.nativeFieldTap = true;
      row.reactorLineWorkload.initialBossDamageVerified = true;
    }
${setupAnchor}
    row.reactorLineWorkload.playerAtStart = { ...first.scene.player };
    row.reactorLineWorkload.bossHealthAtStart = first.scene.bossHealth;
    console.log('CRYPTOID_REACTOR_WORKLOAD_READY ' + JSON.stringify({ engine, cycle, ...row.reactorLineWorkload }));`;
  const observeAnchor = '      const observed = await observe(); verifyActive(observed, first);';
  const observe = `${observeAnchor}
      assert.ok(Math.abs(observed.scene.player.x - (reactorLineWorkload === 'reactor-line' ? .5 : .075)) < .02,
        'Native placement remains in the selected firing lane');
      row.reactorLineWorkload.lastPlayer = { ...observed.scene.player };
      row.reactorLineWorkload.lastBossHealth = observed.scene.bossHealth;`;
  const pointAnchor = '          coreVolley: observed.scene.coreVolley, shots: observed.scene.shots, hostileShots: observed.scene.hostileShots,';
  const point = `${pointAnchor}
          player: { ...observed.scene.player }, bossHealth: observed.scene.bossHealth,`;
  const metaAnchor = 'let browser, server, page, fatal, probeFirst;';
  const meta = `result.reactorLineCoverage = { version: 1, workload: ${JSON.stringify(workload)},
  ordinaryNativeInputOnly: true, gameSourceChanged: false, servedPackageChanged: false,
  sourceVerifierSha256: ${JSON.stringify(VERIFIER_SHA256)},
  extraSetupInspectorReads: true, activeLoopSamplingMs: 1000,
  initialDamageIsNotAnEveryHitCounter: true,
  phoneViewportIsConfigurationNotDeviceAttestation: true };
result.memoryComparisonEligible = false;
result.comparedConditionsAreVisuallyDifferent = true;
${metaAnchor}`;
  let adapted = once(original, setupAnchor, setup);
  adapted = once(adapted, observeAnchor, observe);
  adapted = once(adapted, pointAnchor, point);
  adapted = once(adapted, metaAnchor, meta);
  // Exact reverse proves that no original lifecycle/clock/failure gate changed.
  assert.equal(adapted.replace(setup, setupAnchor).replace(observe, observeAnchor)
    .replace(point, pointAnchor).replace(meta, metaAnchor), original);
  adapted = adapted.replace(/\bfrom\s+(['"])(\.\.?\/[^'"]+)\1/g,
    (_match, _quote, specifier) => 'from ' + JSON.stringify(new URL(specifier, originalUrl).href));
  return adapted.replaceAll('import.meta.url', JSON.stringify(originalUrl));
}
