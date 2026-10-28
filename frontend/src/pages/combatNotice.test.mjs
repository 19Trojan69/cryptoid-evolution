import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { transformSync } from 'esbuild';
import { showCombatNotice } from './combatNotice.ts';
import { powerUpNames } from './powerUps.ts';
import { translate, languages } from '../i18n.ts';
import { restoreFormationNoticeChanges } from '../../scripts/formationNoticeReviewedChanges.mjs';

const source = readFileSync(new URL('./GamePage.tsx', import.meta.url), 'utf8');
const previousSource = restoreFormationNoticeChanges(source);
function renderer(controller) {
  const line = controller.split('\n').find(row => row.includes('className="combat-variety-notice"'));
  assert.ok(line);
  const code = transformSync(`function render(varietyRef, t, combatVarietyEnabled = true) {
    const visibleTopRef = {current: 40}; return <>${line.trim()}</>;
  }`, {loader: 'tsx', target: 'es2022'}).code;
  return new Function('React', 'showCombatNotice', code + '; return render;')(React, showCombatNotice);
}
const current = renderer(source), previous = renderer(previousSource);
const html = (render, saved, locale, enabled = true) => renderToStaticMarkup(render(saved, text => translate(locale, text), enabled));

test('the real status hides redundant formation notices in every language, including a restored saved notice', () => {
  for (const locale of Object.keys(languages)) {
    for (const notice of ['Clear the formation', 'Finish this wave without a hit', 'Hold your combo', 'Perfect formation', 'FORMATION CLEARED', 'Weapon Upgrade']) {
      const saved = JSON.parse(JSON.stringify({current: {notice, noticeMs: 1800, waveComplete: true, waveDamage: 0}}));
      const snapshot = JSON.stringify(saved);
      assert.match(html(previous, saved, locale), /class="combat-variety-notice"/, 'released status displays the redundant pill');
      assert.equal(html(current, saved, locale), '');
      assert.equal(JSON.stringify(saved), snapshot, 'presentation must not rewrite the saved combat state');
    }
  }
  assert.match(html(previous, {current: {notice: 'Perfect formation', noticeMs: 1800}}, 'de'), /Formation ohne Schaden/);
});

test('the real status preserves heavy warnings and every power-up notice with the same text, position and expiry', () => {
  for (const locale of Object.keys(languages)) {
    for (const notice of ['Heavy attacker incoming', ...Object.values(powerUpNames).filter(name => name !== 'Weapon Upgrade')]) {
      const saved = {current: {notice, noticeMs: 1800}};
      const output = html(current, saved, locale);
      assert.equal(output, html(previous, saved, locale));
      assert.match(output, /role="status"/); assert.match(output, /top:88px/);
      assert.equal(html(current, {current: {...saved.current, noticeMs: 0}}, locale), '');
      assert.equal(html(current, saved, locale, false), '');
    }
  }
});

test('exact restoration covers the whole released controller and rejects changes to gameplay or the retained notices', () => {
  const hash = text => createHash('sha256').update(text).digest('hex');
  assert.equal(hash(previousSource), '10130d98a4cc4c60ec48d885515e95ec01b9da9db98c5c7b5979f8c529327fc9');
  assert.throws(() => restoreFormationNoticeChanges(source.replace('showCombatNotice(varietyRef.current.notice) &&', 'false &&')), /one exact/);
  const changed = source.replace('if (damaged && state.damageCount !== undefined) state.damageCount++;', 'if (damaged) state.damageCount = 0;');
  assert.notEqual(changed, source);
  assert.notEqual(hash(restoreFormationNoticeChanges(changed)), hash(previousSource));
});
