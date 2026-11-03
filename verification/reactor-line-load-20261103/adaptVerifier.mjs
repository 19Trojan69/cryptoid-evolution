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
  assert.ok(['stationary', 'field-contacts'].includes(workload));
  const setupAnchor = '    const first = await observe(); if (clockProbe) probeFirst = first; verifyActive(first, first);';
  const setup = `    const reactorLineWorkload = ${JSON.stringify(workload)};
    const placementBefore = await observe();
    verifyActive(placementBefore, placementBefore);
    assert.ok(Math.abs(placementBefore.scene.player.x - .5) < .02, 'Actual prepared device seed starts centered');
    row.reactorLineWorkload = { condition: reactorLineWorkload,
      playerBefore: { ...placementBefore.scene.player }, bossHealthBefore: placementBefore.scene.bossHealth,
      nativeContacts: [] };
    if (reactorLineWorkload === 'field-contacts') {
      const fieldBox = await page.locator('.game-field').boundingBox();
      assert.ok(fieldBox && fieldBox.width > 0 && fieldBox.height > 0);
      // Ordinary single-finger contacts; never set game state in evaluate.
      // End centered so the held-position phase uses the established lane.
      for (const x of [.25, .75, .35, .65, .25, .75, .5]) {
        await page.touchscreen.tap(fieldBox.x + fieldBox.width * x, fieldBox.y + fieldBox.height * .84);
        await page.waitForFunction(target => {
          const s = window.__crossDeviceTest?.inspect();
          return s?.status === 'playing' && Math.abs(s.player.x - target) < .02;
        }, x, { timeout: 10000 });
        const moved = await observe(); verifyActive(moved, placementBefore);
        row.reactorLineWorkload.nativeContacts.push({ requestedX: x, actualPlayer: { ...moved.scene.player },
          elapsedMs: moved.clock.latest.elapsedMs });
        await page.waitForTimeout(300);
      }
    }
${setupAnchor}
    row.reactorLineWorkload.playerAtStart = { ...first.scene.player };
    row.reactorLineWorkload.bossHealthAtStart = first.scene.bossHealth;
    console.log('CRYPTOID_REACTOR_WORKLOAD_READY ' + JSON.stringify({ engine, cycle, ...row.reactorLineWorkload }));`;
  const observeAnchor = '      const observed = await observe(); verifyActive(observed, first);';
  const observe = `${observeAnchor}
      assert.ok(Math.abs(observed.scene.player.x - .5) < .02,
        'Held-position phase remains centered after releasing the contacts');
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
  nativeContactSequence: true, continuousDragOrMultiTouchReplayed: false,
  phoneViewportIsConfigurationNotDeviceAttestation: true };
result.memoryComparisonEligible = false;
result.comparedConditionsAreVisuallyDifferent = true;
${metaAnchor}`;
  let adapted = once(original, setupAnchor, setup);
  adapted = once(adapted, observeAnchor, observe);
  adapted = once(adapted, pointAnchor, point);
  adapted = once(adapted, metaAnchor, meta);
  const outputAnchor = "  : resolve(root, 'verification/systematic-stability-20261101/results', `${engine}-${condition}`, run);";
  const scopedOutput = "  : resolve(root, 'verification/systematic-stability-20261101/results', `${engine}-${condition}`, run, " + JSON.stringify(workload) + ");";
  adapted = once(adapted, outputAnchor, scopedOutput);
  // Exact reverse proves that no original lifecycle/clock/failure gate changed.
  assert.equal(adapted.replace(setup, setupAnchor).replace(observe, observeAnchor)
    .replace(point, pointAnchor).replace(meta, metaAnchor).replace(scopedOutput, outputAnchor), original);
  adapted = adapted.replace(/\bfrom\s+(['"])(\.\.?\/[^'"]+)\1/g,
    (_match, _quote, specifier) => 'from ' + JSON.stringify(new URL(specifier, originalUrl).href));
  return adapted.replaceAll('import.meta.url', JSON.stringify(originalUrl));
}
