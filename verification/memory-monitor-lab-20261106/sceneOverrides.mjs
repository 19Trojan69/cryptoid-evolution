import assert from 'node:assert/strict';

function applyPinnedEdits(source, edits) {
  for (const [before, after = ''] of edits) {
    assert.equal(source.split(before).length, 2, 'Unexpected pinned scene source: ' + before.slice(0, 120));
    source = source.replace(before, after);
  }
  return source;
}

function block(source, from, until) {
  const start = source.indexOf(from);
  const end = source.indexOf(until, start);
  assert.ok(start >= 0 && end > start, 'Missing pinned scene block: ' + from);
  return source.slice(start, end);
}

export function withoutShootingStar(source) {
  return applyPinnedEdits(source, [['    <i className="shooting-star shooting-star-one"><span /></i>\n']]);
}

export function withoutShootingStarStyles(source) {
  const effect = block(source, '.shooting-star { position:', '.starfield-paused .starfield-stars,');
  const result = applyPinnedEdits(source, [
    [effect],
    [', .starfield-paused .shooting-star'],
    ['html[data-motion="reduced"] .shooting-star { display: none; }\n'],
    [' .shooting-star { display: none; }'],
  ]);
  assert.doesNotMatch(result, /shooting-star|meteor-cross/);
  return result;
}

export function withoutFallingRocks(source) {
  const importLine = block(source, 'import { advanceBonusRock,', "import BonusRockLayer from './BonusRockLayer';");
  const spawnAndMove = block(source, '        const rockAllowed =', '        state.powerUps = state.powerUps.filter(pickup => {');
  const shotCollision = block(source, '            const rock = state.rocks.find', '            remainingShots.push(shot);');
  const result = applyPinnedEdits(source, [
    [importLine, "import type { BonusRock, RockEffect } from './bonusRocks';\n"],
    ["import BonusRockLayer from './BonusRockLayer';\n"],
    [spawnAndMove],
    [shotCollision],
    ['      stateRef.current.rocks = varietyRef.current.rocks.map(rock => ({ ...rock, x: rock.x * sx, y: rock.y * sy }));',
      '      varietyRef.current.rocks = [];\n      stateRef.current.rocks = [];'],
    ['          state.rockEffects = state.rockEffects.map(e => ({ ...e, age: e.age + delta })).filter(e => e.age < (e.final ? 750 : 250));\n'],
    ['        if (variety && intro.asteroidStage !== state.sector) { intro.asteroidStage = state.sector; intro.asteroidStageEvents = 0; }\n'],
    ['        state.rockEffects = state.rockEffects.map(e => ({ ...e, age: e.age + delta })).filter(e => e.age < (e.final ? 750 : 250));\n'],
    ['        {combatVarietyEnabled && <BonusRockLayer rocks={game.rocks} effects={game.rockEffects} width={fieldSizeRef.current.width} height={fieldSizeRef.current.height} />}\n'],
  ]);
  assert.doesNotMatch(result, /BonusRockLayer|spawnBonusRock|advanceBonusRock|rockHitsShot|playRock\(/);
  return result;
}
