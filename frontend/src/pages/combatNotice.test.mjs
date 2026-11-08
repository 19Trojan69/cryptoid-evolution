import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { restoreFormationNoticeChanges } from '../../scripts/formationNoticeReviewedChanges.mjs';
import { restoreTestnetLongRunSceneChanges } from '../../scripts/testnetLongRunSceneReviewedChanges.mjs';

const source = readFileSync(new URL('./GamePage.tsx', import.meta.url), 'utf8');
const hash = text => createHash('sha256').update(text).digest('hex');

test('the game field omits the dark combat banner and still renders pickup and transition feedback', () => {
  assert.doesNotMatch(source, /combat-variety-notice|showCombatNotice|combatVariety\.css/);
  assert.match(source, /className={`pickup-notice pickup-notice-/);
  assert.match(source, /className="chain-result"/);
  assert.match(source, /<LevelCompletion\b/);
});

test('exact restoration covers the released controller and detects gameplay changes', () => {
  const released = restoreFormationNoticeChanges(source);
  assert.equal(hash(released), '10130d98a4cc4c60ec48d885515e95ec01b9da9db98c5c7b5979f8c529327fc9');
  const changed = source.replace('if (damaged && state.damageCount !== undefined) state.damageCount++;', 'if (damaged) state.damageCount = 0;');
  assert.notEqual(changed, source);
  assert.notEqual(hash(restoreFormationNoticeChanges(changed)), hash(released));
  assert.throws(() => restoreTestnetLongRunSceneChanges(source.replace(
    '        <Starfield sector={game.sector}', '        <Starfield sector={1}',
  )), /one exact combat banner removal/);
});
