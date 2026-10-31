import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { root, configuration } from '../boss2-forensics-20261028/fixture.mjs';
import { serveDevicePreview } from '../boss2-forensics-20261028/devicePreviewServer.mjs';
import { STOPWATCH_KEY } from '../boss2-stopwatch-20261029/stopwatchState.mjs';

const engine = process.env.CRYPTOID_FLAT_ENGINE;
const miniCompletionComparison = process.env.CRYPTOID_MINI_COMPLETION_COMPARISON === '1';
const miniCompletionOff = miniCompletionComparison && process.env.CRYPTOID_BOSS_MINI_INSPECTION_OFF === '1';
const staticHotspotsComparison = miniCompletionComparison || process.env.CRYPTOID_STATIC_HOTSPOTS_COMPARISON === '1';
const staticHotspotsOff = staticHotspotsComparison && process.env.CRYPTOID_BOSS_STATIC_HOTSPOTS_OFF === '1';
const heatFlatFillComparison = staticHotspotsComparison || process.env.CRYPTOID_HEAT_FLAT_FILL_COMPARISON === '1';
const heatFlatFill = heatFlatFillComparison && process.env.CRYPTOID_BOSS_HEAT_FLAT_FILL === '1';
const reflectionBlendComparison = process.env.CRYPTOID_REFLECTION_BLEND_COMPARISON === '1';
const reflectionNormalBlend = reflectionBlendComparison && process.env.CRYPTOID_REFLECTION_NORMAL_BLEND === '1';
const expectedBlend = reflectionNormalBlend ? 'normal' : 'screen';
const reflectionMaskComparison = reflectionBlendComparison || process.env.CRYPTOID_REFLECTION_MASK_COMPARISON === '1';
const reflectionMaskRemoved = reflectionBlendComparison || (reflectionMaskComparison && process.env.CRYPTOID_REFLECTION_IMAGE_MASK_OFF === '1');
const reflectionComparison = reflectionMaskComparison || process.env.CRYPTOID_UNMASKED_HEAT_REFLECTION_COMPARISON === '1';
const reflectionOn = reflectionMaskComparison || (reflectionComparison && process.env.CRYPTOID_UNMASKED_HEAT_REFLECTION === '1');
const unmasked = heatFlatFillComparison || reflectionComparison || process.env.CRYPTOID_BOSS_HEAT_UNMASKED === '1';
assert.ok(['chromium', 'webkit'].includes(engine));
const pw = createRequire(new URL('../boss2-forensics-20261028/package.json', import.meta.url))('playwright');
const directory = miniCompletionComparison
  ? resolve(root, 'verification/boss2-mini-completion-control-20261031/results', engine, miniCompletionOff ? 'native-off' : 'native-on')
  : staticHotspotsComparison
  ? resolve(root, 'verification/boss2-static-hotspots-control-20261031/results', engine, staticHotspotsOff ? 'static-off' : 'static-on')
  : heatFlatFillComparison
  ? resolve(root, 'verification/boss2-heat-flat-fill-control-20261031/results', engine, heatFlatFill ? 'flat-fill' : 'original-gradients')
  : reflectionBlendComparison
  ? resolve(root, 'verification/boss2-reflection-blend-control-20261031/results', engine, reflectionNormalBlend ? 'normal-blend' : 'screen-blend')
  : reflectionMaskComparison
  ? resolve(root, 'verification/boss2-reflection-mask-control-20261031/results', engine, reflectionMaskRemoved ? 'unmasked-reflection' : 'original-reflection-mask')
  : reflectionComparison
  ? resolve(root, 'verification/boss2-unmasked-heat-reflection-20261030/results', engine, reflectionOn ? 'reflection-on' : 'reflection-off')
  : resolve(root, 'verification/boss2-boss-heat-unmasked-20261030/results', engine, unmasked ? 'unmasked' : 'original-mask');
mkdirSync(directory, { recursive: true });
const result = {
  complete: false, engine, unmasked, miniCompletionComparison, miniCompletionOff, staticHotspotsComparison, staticHotspotsOff, heatFlatFillComparison, heatFlatFill, reflectionComparison, reflectionOn, reflectionMaskComparison, reflectionMaskRemoved,
  reflectionBlendComparison, reflectionNormalBlend, physicalDevice: false, physicalCrashSimulated: false,
  fullRecording: false, whiteScreenFixed: false, steeringEventsSynthetic: true,
};
let server, browser, page, fatal;
const clock = () => page.evaluate(key => JSON.parse(localStorage.getItem(key)), STOPWATCH_KEY);
const inspect = () => page.evaluate(() => window.__crossDeviceTest.inspect());
const waitMode = mode => page.waitForFunction(({ key, mode }) => JSON.parse(localStorage.getItem(key))?.latest?.mode === mode,
  { key: STOPWATCH_KEY, mode }, { timeout: 45000 });
async function tap(locator) {
  await locator.waitFor({ state: 'visible', timeout: 45000 }); assert.ok(await locator.isEnabled());
  await locator.scrollIntoViewIfNeeded();
  const box = await locator.boundingBox(); assert.ok(box);
  await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
}
async function resume() { await tap(page.locator('.pause-resume-button')); await waitMode('running'); }
const geometry = () => page.evaluate(() => Object.fromEntries(['.game-field', '.game-hud', '.home-control', '.pause-control', '.player-ship'].map(selector => {
  const node = document.querySelector(selector); if (!node) throw Error('Missing ' + selector);
  const r = node.getBoundingClientRect(); return [selector, { x: r.x, y: r.y, width: r.width, height: r.height }];
})));
try {
  server = await serveDevicePreview(); browser = await pw[engine].launch({ headless: true });
  result.engineVersion = browser.version();
  const profile = configuration(engine === 'webkit' ? 'iphone' : 'android-phone', pw.devices);
  const context = await browser.newContext({ ...profile.context, viewport: { width: 430, height: 825 }, deviceScaleFactor: 3 });
  const external = [];
  await context.route('**/*', route => {
    const url = new URL(route.request().url());
    if (url.origin === server.origin || ['fonts.googleapis.com', 'fonts.gstatic.com'].includes(url.hostname)) return route.continue();
    external.push(url.hostname); return route.abort();
  });
  if (miniCompletionComparison) await context.addInitScript(() => {
    // QA-only bounded native-call proof, never part of the delivered build.
    const proof = { supported:typeof Element.prototype.getAnimations === 'function', nativeCalls:0, endEvents:0, observedPeakBossMini:0 };
    Object.defineProperty(window,'__miniCompletionProof',{value:proof});
    const original = Element.prototype.getAnimations;
    if (proof.supported) Element.prototype.getAnimations = function(options) {
      if (this.classList.contains('hull-mini-explosion') && this.closest('.sector-boss')) proof.nativeCalls++;
      return original.call(this,options);
    };
    document.addEventListener('animationend',event => {
      const target=event.target;
      if (!(target instanceof Element)) return;
      const mini=target.closest('.hull-mini-explosion');
      if (mini?.closest('.sector-boss')) {
        proof.endEvents++;
        proof.observedPeakBossMini=Math.max(proof.observedPeakBossMini,document.querySelectorAll('.sector-boss .hull-mini-explosion').length);
      }
    },{capture:true,passive:true});
  });
  page = await context.newPage(); page.setDefaultTimeout(25000);
  page.on('pageerror', e => { fatal ||= 'javascript-error: ' + e.message; });
  page.on('crash', () => { fatal ||= 'renderer-crash'; });
  await page.goto(server.origin, { waitUntil: 'domcontentloaded' }); await page.bringToFront();
  const info = await (await context.request.get(server.origin + '/device-preview-info.json')).json();
  result.source = info.sourceCommit; result.sourceTree = info.sourceTree; result.scene = info.diagnosticScene;
  assert.equal(info.bossHeatMaskCandidate.enabled, unmasked);
  assert.equal(info.bossHeatMaskCandidate.reflectionHidden, !reflectionOn);
  if (miniCompletionComparison) {
    assert.equal(info.bossMiniCompletionControl.enabled,miniCompletionOff);
    assert.equal(info.bossMiniCompletionControl.nativeInspectionSkippedOnlyForBossMini,miniCompletionOff);
    assert.equal(info.bossMiniCompletionControl.qaNativeInspectionProbeDeployed,false);
    for (const key of ['originalFinishedEffectComponentHookAndHandlerRetained','originalMiniMarkupCssSparksDurationsRetained','otherEffectsNativeInspectionRetained','oneLatestKeyedBossMiniAtMost','simulationBossHitAndHullFireArraysUnchanged']) assert.equal(info.bossMiniCompletionControl[key],true,key);
  }
  if (staticHotspotsComparison) {
    assert.equal(info.bossStaticHotspotControl.enabled, staticHotspotsOff);
    for (const key of ['originalHullDamageComponentAndPropsRetained','originalHeatLayerAndInlineMaskRetained','originalEarlyReturnRetained','originalMiniExplosionFragmentRetained','simulationHullFireArraysAndDamageUnchanged']) assert.equal(info.bossStaticHotspotControl[key], true, key);
  }
  if (heatFlatFillComparison) {
    assert.equal(reflectionOn, false);
    assert.equal(info.bossHeatFlatFillCandidate.enabled, heatFlatFill);
    assert.equal(info.bossHeatFlatFillCandidate.heatStandardAndWebkitMasksStillRemoved, true);
    assert.equal(info.bossHeatFlatFillCandidate.reflectionStillHidden, true);
    assert.equal(info.bossHeatFlatFillCandidate.originalHotspotComponentsPositionsKeysTransformsShapeBoundsAndOpacityRetained, !staticHotspotsOff);
    assert.equal(info.bossHeatFlatFillCandidate.miniExplosionsAndTheirGradientsRetained, true);
    assert.equal(info.bossHeatFlatFillCandidate.newCanvasOrAsset, false);
    assert.equal(info.bossHeatMaskCandidate.originalHeatComponentHotspotsGradientsAndKeysRetained, !heatFlatFill);
  }
  if (reflectionComparison) {
    assert.equal(info.bossUnmaskedHeatReflection.enabled, reflectionOn);
    assert.equal(info.bossUnmaskedHeatReflection.heatImageMaskStillRemoved, true);
    assert.equal(info.bossUnmaskedHeatReflection.originalReflectionCascadeMaskAndLightRetained, !reflectionMaskRemoved);
  }
  if (reflectionMaskComparison) {
    assert.equal(info.bossReflectionMaskCandidate.enabled, reflectionMaskRemoved);
    assert.equal(info.bossReflectionMaskCandidate.bothHeatImageMasksStillRemoved, true);
    assert.equal(info.bossReflectionMaskCandidate.originalReflectionGradientLightBlendAndBoundsRetained, !reflectionNormalBlend);
  }
  if (reflectionBlendComparison) {
    assert.equal(info.bossReflectionBlendCandidate.enabled, reflectionNormalBlend);
    assert.equal(info.bossReflectionBlendCandidate.activeReflectionBlend, expectedBlend);
    assert.equal(info.bossReflectionBlendCandidate.bothOverlaysStandardAndWebkitMasksStillRemoved, true);
    assert.equal(info.bossReflectionBlendCandidate.originalReflectionGradientLightOpacityBoundsAndDisplayCascadeRetained, true);
  }
  assert.equal(info.bossWeaponControl.disabled, true);
  for (const key of ['actualPiAuthentication', 'liveBackend', 'realAccounts', 'payments', 'automaticUpload', 'automaticResume']) assert.equal(info[key], false, key);
  assert.equal(info.guestOnly, true); assert.equal(info.nativeGameClocks, true);
  const label = await page.locator('.device-preview-menu section').evaluate(n => getComputedStyle(n, '::before').content);
  assert.ok(label.includes(miniCompletionComparison ? 'TREFFERTEST' : heatFlatFillComparison ? heatFlatFill ? 'HITZESPURENTEST' : 'HITZESPURENVERGLEICH' : reflectionBlendComparison ? reflectionNormalBlend ? 'BLENDTEST' : 'BLENDKONTROLLE' : reflectionMaskComparison ? reflectionMaskRemoved ? 'MASKENTEST' : 'MASKENKONTROLLE' : reflectionComparison ? reflectionOn ? 'REFLEXIONSTEST' : 'REFLEXIONSVERGLEICH' : unmasked ? 'MASKENKANDIDAT' : 'MASKENVERGLEICH')); result.bannerMatches = true;
  assert.equal(await page.getByRole('checkbox', { name: 'Vollaufzeichnung zusätzlich aktivieren', exact: true }).isChecked(), false);
  assert.equal(await page.getByRole('checkbox', { name: 'Testschutz: Tod und Bossende verhindern', exact: true }).isChecked(), true);
  await tap(page.getByRole('button', { name: 'Testszene vorbereiten', exact: true }));
  await tap(page.getByRole('button', { name: 'Boss-2-Test öffnen', exact: true }));
  await page.waitForFunction(() => window.__crossDeviceTest?.inspect().status === 'paused');
  await page.evaluate(() => document.fonts.ready);
  result.initialPausedGeometry = await geometry();
  assert.equal(await page.locator('[data-stopwatch-value]').innerText(), '00:00');
  let baseline;
  if (miniCompletionComparison ? miniCompletionOff : staticHotspotsComparison ? staticHotspotsOff : heatFlatFillComparison ? heatFlatFill : reflectionBlendComparison ? reflectionNormalBlend : reflectionMaskComparison ? reflectionMaskRemoved : reflectionComparison ? reflectionOn : unmasked) {
    baseline = JSON.parse(readFileSync(resolve(directory, miniCompletionComparison ? '../native-on/verification.json' : staticHotspotsComparison ? '../static-on/verification.json' : heatFlatFillComparison ? '../original-gradients/verification.json' : reflectionBlendComparison ? '../screen-blend/verification.json' : reflectionMaskComparison ? '../original-reflection-mask/verification.json' : reflectionComparison ? '../reflection-off/verification.json' : '../original-mask/verification.json'), 'utf8'));
    assert.equal(baseline.complete, true); assert.equal(baseline.source, result.source);
    for (const [selector, rect] of Object.entries(baseline.initialPausedGeometry)) for (const key of ['x', 'y', 'width', 'height'])
      assert.ok(Math.abs(rect[key] - result.initialPausedGeometry[selector][key]) <= 1, selector + ' ' + key);
    result.originalLayoutBoxesPreserved = true;
  }
  await resume(); await page.waitForFunction(() => window.__crossDeviceTest.inspect().encounter === 'boss-fight');
  const first = await inspect(), origin = await page.evaluate(() => performance.timeOrigin);
  await page.waitForFunction(key => JSON.parse(localStorage.getItem(key))?.latest?.elapsedMs >= 20000, STOPWATCH_KEY, { timeout: 90000 });
  if (staticHotspotsOff) await page.locator('.sector-boss .boss-static-heat').waitFor();
  else await page.waitForFunction(() => document.querySelectorAll('.sector-boss .hull-hotspot').length > 0);
  const active = await inspect(); assert.equal(active.status, 'playing'); assert.ok(active.frameAt > first.frameAt);
  assert.ok(active.coreVolley > first.coreVolley); assert.equal(active.ownerDiagnostics, false);
  assert.equal(await page.evaluate(() => performance.timeOrigin), origin);
  result.activeObservation = { activeMs: (await clock()).latest.elapsedMs, coreVolley: active.coreVolley, sameDocument: true };
  if (reflectionBlendComparison || heatFlatFillComparison) result.initialActiveObservationBeforeSyntheticSteering = true;

  if (staticHotspotsComparison) {
    const pulse = await page.waitForFunction(() => {
      const n = document.querySelector('.sector-boss .hull-mini-explosion'); if (!n) return false;
      const css = getComputedStyle(n);
      return n.getClientRects().length && Number(css.opacity) > 0 && !n.closest('.hull-heat-layer')
        ? { opacity:Number(css.opacity), background:css.backgroundImage, sparks:n.querySelectorAll('span').length,
            outsideHeatLayer:true, hotspots:document.querySelectorAll('.sector-boss .hull-hotspot').length } : false;
    }, null, {timeout:20000,polling:'raf'});
    result.originalMiniExplosionPulse = await pulse.jsonValue(); await pulse.dispose();
    assert.ok(result.originalMiniExplosionPulse.background.includes('radial-gradient'));
    assert.ok(result.originalMiniExplosionPulse.sparks >= 3 && result.originalMiniExplosionPulse.sparks <= 5);
    if(staticHotspotsOff)assert.equal(result.originalMiniExplosionPulse.hotspots,0);
  }
  if (miniCompletionComparison) {
    await page.waitForFunction(() => window.__miniCompletionProof.endEvents >= 3, null, {timeout:20000});
    result.miniCompletionProof = await page.evaluate(() => ({...window.__miniCompletionProof}));
    assert.equal(result.miniCompletionProof.supported,true);
    assert.ok(result.miniCompletionProof.endEvents>=3);
    assert.equal(result.miniCompletionProof.observedPeakBossMini,1);
    if(miniCompletionOff) assert.equal(result.miniCompletionProof.nativeCalls,0);
    else assert.ok(result.miniCompletionProof.nativeCalls>0,'Control must actually invoke native boss-mini completion inspection');
    result.qaNativeProbeOnlyInTestContext = true;
  }
  if (reflectionOn) {
    // Original reflection is a short naturally triggered pulse. A visible DOM
    // box with zero alpha alone is insufficient evidence that it can paint.
    const pulse = await page.waitForFunction(() => {
      const node = document.querySelector('.sector-boss .hull-reflection'); if (!node) return false;
      const s = getComputedStyle(node), opacity = Number(s.opacity);
      return s.display !== 'none' && node.getClientRects().length > 0 && opacity > 0
        ? { opacity, display: s.display, rects: node.getClientRects().length, mask: s.maskImage,
          webkitMask: s.webkitMaskImage, blend: s.mixBlendMode, background: s.backgroundImage } : false;
    }, null, { timeout: 15000, polling: 'raf' });
    result.originalReflectionPulse = await pulse.jsonValue(); await pulse.dispose();
    assert.ok(result.originalReflectionPulse.opacity > 0);
    if (reflectionMaskRemoved) {
      assert.equal(result.originalReflectionPulse.mask, 'none'); assert.equal(result.originalReflectionPulse.webkitMask, 'none');
    } else assert.ok(result.originalReflectionPulse.mask.includes('url('));
    if (reflectionMaskComparison) {
      assert.equal(result.originalReflectionPulse.blend, expectedBlend); assert.ok(result.originalReflectionPulse.background.includes('linear-gradient'));
    }
  }

  await tap(page.getByRole('button', { name: 'Pause', exact: true })); await waitMode('paused');
  const paused = await clock(); await page.waitForTimeout(2100);
  assert.equal((await clock()).latest.elapsedMs, paused.latest.elapsedMs); result.manualPauseFreezes = true;
  const scene = await page.evaluate(() => {
    const heat = document.querySelector('.sector-boss .hull-heat-layer');
    const reflection = document.querySelector('.sector-boss .hull-reflection');
    const image = document.querySelector('.sector-boss img.boss-hull');
    if (!heat || !reflection || !image) throw Error('Missing original boss subtree');
    const hs = getComputedStyle(heat), rs = getComputedStyle(reflection);
    const rect = document.querySelector('.sector-boss').getBoundingClientRect();
    const hotspots = [...heat.querySelectorAll('.hull-hotspot')].map(n => {
      const s = getComputedStyle(n), b = getComputedStyle(n.querySelector('b'));
      return { rects: n.getClientRects().length, opacity: s.opacity, transform: s.transform,
        width: s.width, height: s.height, animation: s.animationName, innerAnimation: b.animationName,
        background: b.backgroundImage, innerBackgroundColor: b.backgroundColor, innerOpacity: b.opacity,
        innerBorderRadius: b.borderRadius, nativeAnimations: n.getAnimations({ subtree: true }).length };
    });
    // Same paused DOM, synchronous QA-only cascade probe. Restore the exact
    // inline style immediately; no game, clock, hit or production code changes.
    const properties = ['display', 'position', 'inset', 'overflow', 'z-index', 'opacity', 'transform'];
    const signature = () => ({ heat: properties.map(p => getComputedStyle(heat).getPropertyValue(p)),
      spots: [...heat.querySelectorAll('.hull-hotspot, .hull-hotspot b')].map(n => {
        const s = getComputedStyle(n); return ['left','top','width','height','transform','opacity','background-image','animation-name'].map(p => s.getPropertyValue(p));
      }), image: { src: image.currentSrc, width: image.width, height: image.height },
      mini: [...document.querySelectorAll('.sector-boss .hull-mini-explosion')].map(n => n.outerHTML) });
    const before = signature(), cssText = heat.style.cssText, originalMask = heat.style.maskImage || heat.style.webkitMaskImage;
    const wasUnmasked = hs.maskImage === 'none';
    let oppositeMask, after;
    try {
      heat.style.setProperty('mask-image', wasUnmasked ? originalMask : 'none', 'important');
      heat.style.setProperty('-webkit-mask-image', wasUnmasked ? originalMask : 'none', 'important');
      oppositeMask = getComputedStyle(heat).maskImage; after = signature();
    } finally { heat.style.cssText = cssText; }
    const restored = getComputedStyle(heat);
    const reflectionProperties = ['display','position','inset','z-index','opacity','transform','background-image','mix-blend-mode','width','height'];
    const reflectionSignature = () => reflectionProperties.map(p => getComputedStyle(reflection).getPropertyValue(p));
    const reflectionBefore = reflectionSignature(), reflectionStyle = reflection.style.cssText;
    const originalReflectionMask = reflection.style.maskImage || reflection.style.webkitMaskImage;
    const reflectionWasUnmasked = getComputedStyle(reflection).maskImage === 'none';
    let reflectionOpposite, reflectionAfter;
    try {
      reflection.style.setProperty('mask-image', reflectionWasUnmasked ? originalReflectionMask : 'none', 'important');
      reflection.style.setProperty('-webkit-mask-image', reflectionWasUnmasked ? originalReflectionMask : 'none', 'important');
      reflectionOpposite = getComputedStyle(reflection).maskImage; reflectionAfter = reflectionSignature();
    } finally { reflection.style.cssText = reflectionStyle; }
    const blendProbeProperties = reflectionProperties.filter(p => p !== 'mix-blend-mode').concat(['mask-image','-webkit-mask-image']);
    const blendSignature = () => blendProbeProperties.map(p => getComputedStyle(reflection).getPropertyValue(p));
    const blendBefore = blendSignature(), originalBlend = getComputedStyle(reflection).mixBlendMode;
    let oppositeBlend, blendAfter;
    try {
      reflection.style.setProperty('mix-blend-mode', originalBlend === 'normal' ? 'screen' : 'normal', 'important');
      oppositeBlend = getComputedStyle(reflection).mixBlendMode; blendAfter = blendSignature();
    } finally { reflection.style.cssText = reflectionStyle; }
    const reactor = document.querySelector('.sector-boss .boss-reactor');
    return {
      heat: { display: restored.display, rects: heat.getClientRects().length, mask: restored.maskImage,
        webkitMask: restored.webkitMaskImage, inlineMask: originalMask, opacity: restored.opacity, overflow: restored.overflow },
      reflection: { display: rs.display, rects: reflection.getClientRects().length, inlineMask: reflection.style.maskImage,
        mask: rs.maskImage, webkitMask: rs.webkitMaskImage, opacity: Number(rs.opacity), blend: rs.mixBlendMode, background: rs.backgroundImage },
      reflectionCascadeOnlyProbe: { nonMaskPropertiesIdentical: JSON.stringify(reflectionBefore) === JSON.stringify(reflectionAfter),
        oppositeMask: reflectionOpposite, exactInlineStyleRestored: reflection.style.cssText === reflectionStyle },
      reflectionBlendOnlyProbe: { nonBlendPropertiesIdentical: JSON.stringify(blendBefore) === JSON.stringify(blendAfter),
        oppositeBlend, exactInlineStyleRestored: reflection.style.cssText === reflectionStyle },
      hotspots, cascadeOnlyProbe: { nonMaskPropertiesIdentical: JSON.stringify(before) === JSON.stringify(after), oppositeMask, exactInlineStyleRestored: heat.style.cssText === cssText },
      bossRect: { width: rect.width, height: rect.height }, bossImageReady: image.complete && image.naturalWidth > 0,
      sceneCanvases: document.querySelectorAll('.game-field canvas').length,
      backgroundStarCircles: document.querySelectorAll('.game-field .starfield circle').length,
      backgroundPlanets: document.querySelectorAll('.game-field .space-scene .space-world').length,
      flatShips: document.querySelectorAll('.diagnostic-flat-ship').length,
      reactor: reactor ? { display: getComputedStyle(reactor).display, rects: reactor.getClientRects().length } : null,
    };
  });
  assert.equal(scene.heat.display, 'block'); assert.equal(scene.heat.rects, 1); assert.equal(Number(scene.heat.opacity), 1);
  assert.equal(scene.heat.overflow, 'hidden'); assert.ok(scene.heat.inlineMask.includes('url('));
  for (const key of ['mask', 'webkitMask']) {
    if (unmasked) assert.equal(scene.heat[key], 'none', key); else assert.ok(scene.heat[key].includes('url('), key);
  }
  assert.equal(scene.reflection.display, reflectionOn ? 'block' : 'none'); assert.equal(scene.reflection.rects, reflectionOn ? 1 : 0);
  assert.ok(scene.reflection.inlineMask.includes('url('));
  for (const key of ['mask','webkitMask']) {
    if (reflectionMaskRemoved) assert.equal(scene.reflection[key], 'none', key); else assert.ok(scene.reflection[key].includes('url('), key);
  }
  if (reflectionMaskComparison) {
    assert.equal(scene.reflection.blend, expectedBlend); assert.ok(scene.reflection.background.includes('linear-gradient'));
    assert.equal(scene.reflectionCascadeOnlyProbe.nonMaskPropertiesIdentical, true);
    assert.equal(scene.reflectionCascadeOnlyProbe.exactInlineStyleRestored, true);
    assert.equal(scene.reflectionCascadeOnlyProbe.oppositeMask === 'none', !reflectionMaskRemoved);
  }
  if (reflectionBlendComparison) {
    assert.equal(scene.reflectionBlendOnlyProbe.nonBlendPropertiesIdentical, true);
    assert.equal(scene.reflectionBlendOnlyProbe.exactInlineStyleRestored, true);
    assert.equal(scene.reflectionBlendOnlyProbe.oppositeBlend, reflectionNormalBlend ? 'screen' : 'normal');
    if (baseline) for (const key of ['display','rects','mask','webkitMask','background']) assert.equal(scene.reflection[key], baseline.scene.reflection[key]);
  }
  if (staticHotspotsOff) assert.equal(scene.hotspots.length, 0);
  else assert.ok(scene.hotspots.length > 0 && scene.hotspots.length <= 8);
  for (const spot of scene.hotspots) {
    assert.equal(spot.rects, 1); assert.ok(Number(spot.opacity) > 0);
    if (heatFlatFill) { assert.equal(spot.background, 'none'); assert.equal(spot.innerBackgroundColor, 'rgb(255, 121, 40)'); }
    else assert.ok(spot.background.includes('radial-gradient'));
    if (heatFlatFillComparison) { assert.equal(Number(spot.opacity), .48); assert.equal(Number(spot.innerOpacity), .72); }
    assert.equal(spot.animation, 'none'); assert.equal(spot.innerAnimation, 'none'); assert.equal(spot.nativeAnimations, 0);
  }
  assert.equal(scene.cascadeOnlyProbe.nonMaskPropertiesIdentical, true);
  assert.equal(scene.cascadeOnlyProbe.exactInlineStyleRestored, true);
  assert.equal(scene.cascadeOnlyProbe.oppositeMask === 'none', !unmasked);
  assert.equal(scene.bossImageReady, true); assert.equal(scene.sceneCanvases, 0);
  assert.ok(scene.backgroundStarCircles >= 215); assert.equal(scene.backgroundPlanets, 4); assert.ok(scene.flatShips > 0);
  if (scene.reactor) { assert.equal(scene.reactor.display, 'none'); assert.equal(scene.reactor.rects, 0); }
  if (baseline) for (const key of ['width', 'height']) assert.ok(Math.abs(scene.bossRect[key] - baseline.scene.bossRect[key]) <= 1, 'boss ' + key);
  result.scene = scene;
  await page.screenshot({ path: directory + '/paused-scene.png' });
  await resume();
  const field = await page.locator('.game-field').boundingBox(); assert.ok(field);
  const before = (await inspect()).player;
  const pointer = { bubbles: true, cancelable: true, pointerId: 900001, pointerType: 'touch', isPrimary: true, buttons: 1 };
  const start = { clientX: field.x + field.width * .50, clientY: field.y + field.height * .80 };
  const end = { clientX: field.x + field.width * .30, clientY: field.y + field.height * .70 };
  await page.locator('.game-field').dispatchEvent('pointerdown', { ...pointer, ...start });
  await page.locator('.game-field').dispatchEvent('pointermove', { ...pointer, ...end });
  await page.locator('.game-field').dispatchEvent('pointerup', { ...pointer, buttons: 0, ...end });
  await page.waitForFunction(p => Math.abs(window.__crossDeviceTest.inspect().player.x - p.x) > .03, before);
  result.pointerSteeringPreserved = true;
  await tap(page.getByRole('button', { name: /^Waffen · Aktive Waffe:/ }));
  await page.locator('.weapon-selection-dialog').waitFor(); await waitMode('paused');
  const weaponPause = await clock(); await page.waitForTimeout(2100);
  assert.equal((await clock()).latest.elapsedMs, weaponPause.latest.elapsedMs);
  await tap(page.locator('.weapon-drawer-tab')); await waitMode('running'); result.weaponMenuRoundtrip = true;
  await tap(page.locator('.home-control')); await page.locator('#leave-mission-title').waitFor();
  await tap(page.getByRole('button', { name: 'Spiel verlassen', exact: true })); await waitMode('ended');
  await tap(page.getByRole('button', { name: 'Letzten Testbericht vorbereiten', exact: true }));
  await tap(page.getByRole('button', { name: 'Berichtstext in Teilen anzeigen', exact: true }));
  const part = JSON.parse(await page.getByRole('textbox', { name: 'Diagnosebericht', exact: true }).inputValue());
  assert.equal(part.total, 1); const report = JSON.parse(part.data);
  assert.equal(report.source.sourceCommit, info.sourceCommit); assert.equal(report.source.sourceTree, info.sourceTree);
  assert.equal(report.source.diagnosticScene, info.diagnosticScene);
  assert.equal(report.briefMatchesLatestStopwatch, true); assert.equal(report.fullSession, null);
  assert.equal(report.briefDiagnostics.latest.options.fullRecording, false);
  result.reportScene = report.source.diagnosticScene;
  if (miniCompletionComparison) assert.ok(result.reportScene.endsWith('-flat-fill-no-static-hotspots'+(miniCompletionOff?'-no-mini-inspection':'')));
  else if (staticHotspotsComparison) assert.ok(result.reportScene.endsWith('-unmasked-hull-heat-flat-fill'+(staticHotspotsOff?'-no-static-hotspots':'')));
  else if (heatFlatFillComparison) assert.ok(result.reportScene.endsWith('-hidden-hull-reflection-unmasked-hull-heat' + (heatFlatFill ? '-flat-fill' : '')));
  else if (reflectionBlendComparison) assert.ok(result.reportScene.endsWith('-unmasked-hull-heat-unmasked-hull-reflection' + (reflectionNormalBlend ? '-normal-blend' : '')));
  else if (reflectionMaskComparison) assert.ok(result.reportScene.endsWith(reflectionMaskRemoved
    ? '-unmasked-hull-heat-unmasked-hull-reflection' : '-unmasked-hull-heat-restored-hull-reflection'));
  result.normalExitAndReportPreserved = true; result.savedActiveMs = report.testStopwatch?.latest?.elapsedMs ?? (await clock()).latest.elapsedMs;
  assert.deepEqual(external, []); assert.ok(!fatal, fatal);
  result.complete = true;
} catch (error) {
  result.failure = { message: error.message, stack: error.stack }; process.exitCode = 1;
  if (page && !page.isClosed()) try { await page.screenshot({ path: directory + '/failure.png', timeout: 5000 }); } catch { /* Retain first error. */ }
} finally {
  result.finishedAt = new Date().toISOString(); writeFileSync(directory + '/verification.json', JSON.stringify(result, null, 2) + '\n');
  console.log((miniCompletionComparison ? 'CRYPTOID_MINI_COMPLETION_RESULT ' : staticHotspotsComparison ? 'CRYPTOID_STATIC_HOTSPOT_RESULT ' : heatFlatFillComparison ? 'CRYPTOID_HEAT_FLAT_FILL_RESULT ' : reflectionBlendComparison ? 'CRYPTOID_REFLECTION_BLEND_RESULT ' : reflectionMaskComparison ? 'CRYPTOID_REFLECTION_MASK_RESULT ' : reflectionComparison ? 'CRYPTOID_UNMASKED_HEAT_REFLECTION_RESULT ' : 'CRYPTOID_HEAT_MASK_RESULT ') + JSON.stringify(result));
  if (browser) await browser.close(); if (server) await server.close();
}
