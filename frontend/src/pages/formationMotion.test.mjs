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
import { slowerEnemyArrival } from './enemyArrival.ts';
import {normalArrival} from './normalArrival.ts';
import {strengthVisualDiameter} from './shipDisplayScale.ts';

// Execute the actual component's simulation functions without changing exports
// or adding test hooks to the shipped game.
const source = fs.readFileSync(new URL('./GamePage.tsx', import.meta.url), 'utf8');
const ast = ts.createSourceFile('GamePage.tsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const names = ['spawnAsteroid', 'spawnBossEscort', 'attackTime', 'moveAsteroid', 'RETURN_DURATION_MS', 'ENTRY_HUD_GAP_PX'];
const declarations = new Map();
function visit(node) {
  if (ts.isVariableDeclaration(node) && names.includes(node.name.getText(ast))) declarations.set(node.name.getText(ast), node.getText(ast));
  ts.forEachChild(node, visit);
}
visit(ast);
assert.equal(declarations.size, names.length);
const code = ts.transpileModule([...declarations.values()].map(declaration => `const ${declaration};`).join('\n') +
  '\nglobalThis.motion = { spawnAsteroid, spawnBossEscort, moveAsteroid };', { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText;
function simulation(testnet = true) {
  const context = { combatVarietyEnabled: testnet, chooseCryptoid: testnet ? combatCryptoid : chooseCryptoid,
    combatEntryStage, combatTiming, FORMATION_SETTLE_MS, entryPatternForSector, entryPosition, entryStartX,
    attackDuration, attackPosition, bossEscortRosterIndex, enemyAppearance, slowerEnemyArrival, normalArrival, strengthVisualDiameter };
  vm.runInNewContext(code, context);
  return context.motion;
}
const motion = simulation();
function docked(width = 390, stage = 26) {
  const enemy = motion.spawnAsteroid(1, width, 90, 0, stage, formationLayout(stage, width, 844, stage));
  return { ...enemy, x: enemy.entryTargetX, y: enemy.entryTargetY, entryElapsed: enemy.entryDuration, formationElapsed: enemy.formationDuration };
}

test('resting Testnet enemies sway slowly in both directions, including legacy checkpoint entry identifiers', () => {
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

test('sway is time-based; Mainnet and boss escorts retain their existing stationary formation behavior', () => {
  const positions = [30, 60, 120].map(fps => {
    let enemy = docked(), elapsed = 0;
    while (elapsed < 6000) { const delta = Math.min(1000 / fps, 6000 - elapsed); enemy = motion.moveAsteroid(enemy, delta, 390, 844); elapsed += delta; }
    return enemy.x;
  });
  for (const x of positions) assert.ok(Math.abs(x - positions[0]) < 1e-7);
  const original = docked();
  for (const [engine, enemy] of [[simulation(false), original], [motion, { ...original, escort: true }]]) {
    const after = engine.moveAsteroid(enemy, 1000, 390, 844);
    assert.equal(after.x, enemy.entryTargetX); assert.equal(after.y, enemy.entryTargetY);
  }
});

test('normal arrivals use 25 percent less speed than the prior Testnet build across all stages', () => {
  for (let stage = 1; stage <= 500; stage++) {
    if (stage % 10 === 0) continue;
    const slots = formationLayout(stage, 390, 844, stage);
    for (let index = 0; index < slots.length; index++) {
      const profile = combatCryptoid(stage, index), enemy = motion.spawnAsteroid(index, 390, 90, index, stage, slots);
      const beforeDuration = combatTiming(stage).entryMs + (profile.shipClass === 'heavy' ? 600 : 0);
      assert.ok(enemy.entryDuration>=slowerEnemyArrival(Math.round(beforeDuration*1.1)));
      if(enemy.entryStartX>=0&&enemy.entryStartX<=390)assert.ok(Math.abs(Math.round(beforeDuration*1.1)/enemy.entryDuration-.75)<.001);
      for (const key of ['health', 'points', 'reward', 'attackPace', 'radius']) assert.equal(enemy[key], profile[key]);
      const beforeDock = motion.moveAsteroid(enemy, beforeDuration, 390, 844);
      assert.ok(beforeDock.entryElapsed < beforeDock.entryDuration);
      const dock = motion.moveAsteroid(beforeDock, enemy.entryDuration - beforeDuration, 390, 844);
      assert.equal(dock.x, enemy.entryTargetX); assert.equal(dock.y, enemy.entryTargetY);
      assert.equal(dock.entryElapsed, enemy.entryDuration); assert.equal(dock.formationDuration, 180);
    }
  }
  const escort = motion.spawnBossEscort(1, 390, 0, 10, [{ x: 100, y: 200, index: 0, entrySide: 1 }], 0);
  assert.equal(escort.entryDuration, 2467); assert.equal(escort.formationDuration, 300);
});
