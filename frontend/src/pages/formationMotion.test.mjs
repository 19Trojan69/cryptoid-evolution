import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import { combatCryptoid, combatEntryStage, combatTiming } from './combatVariety.ts';
import { chooseCryptoid } from './cryptoidRoster.ts';
import { formationLayout, FORMATION_SETTLE_MS } from './sectorManager.ts';
import { entryPatternForSector, entryPosition, entryStartX } from './entryPatterns.ts';
import { attackDuration, attackPosition } from './attackPatterns.ts';
import { bossEscortRosterIndex } from './bossEscorts.ts';
import { enemyAppearance } from './shipFleet.ts';
import { legacyFormationTargets, restoreMainnetCombatChange } from '../../scripts/mainnetCombatReviewedChanges.mjs';

// Execute the actual component's simulation functions without changing exports
// or adding test hooks to the shipped game.
const source = fs.readFileSync(new URL('./GamePage.tsx', import.meta.url), 'utf8');
const ast = ts.createSourceFile('GamePage.tsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const names = ['combatVarietyEnabled', 'chooseCryptoid', 'spawnAsteroid', 'spawnBossEscort', 'attackTime', 'moveAsteroid', 'RETURN_DURATION_MS', 'ENTRY_HUD_GAP_PX'];
const declarations = new Map();
function visit(node) {
  if (ts.isVariableDeclaration(node) && names.includes(node.name.getText(ast))) declarations.set(node.name.getText(ast), node.getText(ast));
  ts.forEachChild(node, visit);
}
visit(ast);
assert.equal(declarations.size, names.length);
const code = ts.transpileModule([...declarations.values()].map(declaration => `const ${declaration};`).join('\n') +
  '\nglobalThis.motion = { spawnAsteroid, spawnBossEscort, moveAsteroid };', { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText;
function simulation(network = 'testnet') {
  const context = { shipSaveNetwork: network, combatCryptoid, originalCryptoid: chooseCryptoid,
    combatEntryStage, combatTiming, FORMATION_SETTLE_MS, entryPatternForSector, entryPosition, entryStartX,
    attackDuration, attackPosition, bossEscortRosterIndex, enemyAppearance };
  vm.runInNewContext(code, context);
  return context.motion;
}
const motion = simulation();
test('the release normalizer reverses only one exact combat switch and rejects altered gates', () => {
  const before = restoreMainnetCombatChange(source);
  assert.equal(before.replace('const combatVarietyEnabled = shipSaveNetwork === "testnet";', 'const combatVarietyEnabled = true;').replace(legacyFormationTargets, ''), source);
  assert.throws(() => restoreMainnetCombatChange(source.replace('const combatVarietyEnabled = true;', 'const combatVarietyEnabled = false;')), /one exact/);
  assert.throws(() => restoreMainnetCombatChange(source + '\nconst combatVarietyEnabled = true;'), /one exact/);
});
function docked(width = 390, stage = 26) {
  const enemy = motion.spawnAsteroid(1, width, 90, 0, stage, formationLayout(stage, width, 844, stage));
  return { ...enemy, x: enemy.entryTargetX, y: enemy.entryTargetY, entryElapsed: enemy.entryDuration, formationElapsed: enemy.formationDuration };
}

test('resting enemies sway slowly in both directions, including legacy checkpoint entry identifiers', () => {
  for (const width of [320, 390, 768, 1280]) for (const entryStage of [undefined, 1, 2, 3, 4, 5, 6, 7, 8, 9, 26, 500]) {
    let enemy = { ...docked(width), entryStage }, min = Infinity, max = -Infinity, previousX = enemy.x;
    const original = { ...enemy };
    for (let elapsed = 0; elapsed < 8000; elapsed += 16) {
      enemy = motion.moveAsteroid(enemy, 16, width, 844);
      min = Math.min(min, enemy.x - enemy.entryTargetX); max = Math.max(max, enemy.x - enemy.entryTargetX);
      assert.ok(Math.abs(enemy.x - previousX) < .35, 'gentle frame-to-frame motion'); previousX = enemy.x;
      assert.equal(enemy.y, original.y);
      assert.ok(enemy.x >= enemy.radius && enemy.x <= width - enemy.radius);
    }
    assert.ok(min < -5 && max > 5, `both directions for ${width}px / entry ${entryStage}`);
    assert.ok(min >= -12 && max <= 12, 'original limited amplitude');
    for (const key of ['health', 'points', 'reward', 'attackPace', 'entryTargetX', 'entryTargetY', 'attackPattern']) assert.equal(enemy[key], original[key]);
  }
});

test('sway is time-based while boss escorts retain their stationary formation behavior', () => {
  const positions = [30, 60, 120].map(fps => {
    let enemy = docked(), elapsed = 0;
    while (elapsed < 6000) { const delta = Math.min(1000 / fps, 6000 - elapsed); enemy = motion.moveAsteroid(enemy, delta, 390, 844); elapsed += delta; }
    return enemy.x;
  });
  for (const x of positions) assert.ok(Math.abs(x - positions[0]) < 1e-7);
  const original = docked();
  for (const [engine, enemy] of [[simulation('mainnet'), { ...original, escort: true }], [motion, { ...original, escort: true }]]) {
    const after = engine.moveAsteroid(enemy, 1000, 390, 844);
    assert.equal(after.x, enemy.entryTargetX); assert.equal(after.y, enemy.entryTargetY);
  }
});

test('Mainnet uses the released Testnet arrivals, profiles and motion across every normal campaign block', () => {
  const mainnet = simulation('mainnet');
  for (let stage = 1; stage <= 500; stage++) {
    if (stage % 10 === 0) continue;
    const slots = formationLayout(stage, 390, 844, stage);
    for (let index = 0; index < slots.length; index++) {
      const released = motion.spawnAsteroid(index, 390, 90, index, stage, slots);
      const preview = mainnet.spawnAsteroid(index, 390, 90, index, stage, slots);
      assert.deepEqual(JSON.parse(JSON.stringify(preview)), JSON.parse(JSON.stringify(released)));
      for (const delta of [16, 1500, 4000]) {
        const a = mainnet.moveAsteroid(preview, delta, 390, 844);
        const b = motion.moveAsteroid(released, delta, 390, 844);
        assert.deepEqual(JSON.parse(JSON.stringify(a)), JSON.parse(JSON.stringify(b)));
      }
    }
  }
});

test('normal arrivals take ten percent longer across all stages without changing profiles or docking', () => {
  for (let stage = 1; stage <= 500; stage++) {
    if (stage % 10 === 0) continue;
    const slots = formationLayout(stage, 390, 844, stage);
    for (let index = 0; index < slots.length; index++) {
      const profile = combatCryptoid(stage, index), enemy = motion.spawnAsteroid(index, 390, 90, index, stage, slots);
      const beforeDuration = combatTiming(stage).entryMs + (profile.shipClass === 'heavy' ? 600 : 0);
      assert.ok(enemy.entryDuration / beforeDuration >= 1.0995 && enemy.entryDuration / beforeDuration <= 1.1005);
      for (const key of ['health', 'points', 'reward', 'attackPace', 'radius']) assert.equal(enemy[key], profile[key]);
      const beforeDock = motion.moveAsteroid(enemy, beforeDuration, 390, 844);
      assert.ok(beforeDock.entryElapsed < beforeDock.entryDuration);
      const dock = motion.moveAsteroid(beforeDock, enemy.entryDuration - beforeDuration, 390, 844);
      assert.equal(dock.x, enemy.entryTargetX); assert.equal(dock.y, enemy.entryTargetY);
      assert.equal(dock.entryElapsed, enemy.entryDuration); assert.equal(dock.formationDuration, 180);
    }
  }
  const escort = motion.spawnBossEscort(1, 390, 0, 10, [{ x: 100, y: 200, index: 0, entrySide: 1 }], 0);
  assert.equal(escort.entryDuration, 1850); assert.equal(escort.formationDuration, 300);
});

test('obsolete formation targets cannot render and their styles are retired', () => {
  assert.doesNotMatch(source, /formation-target/);
  const css = fs.readFileSync(new URL('../index.css', import.meta.url), 'utf8');
  assert.doesNotMatch(css, /formation-target/);
  assert.throws(() => restoreMainnetCombatChange(source + '\nformation-target'), /one exact/);
  assert.throws(() => restoreMainnetCombatChange(source.replace('<BossHullView boss=', '<BossHullView altered=')), /one exact/);
});
