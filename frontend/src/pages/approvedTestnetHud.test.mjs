import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import postcss from 'postcss';

// Check the real entry-point stylesheet order: a preview-only override concealed
// the earlier regression, while the public Testnet still had a two-row cockpit.
const main = fs.readFileSync(new URL('../main.tsx', import.meta.url), 'utf8');
const sheets = [...main.matchAll(/import ['"](.+\.css)['"]/g)]
  .map(match => postcss.parse(fs.readFileSync(new URL(`../${match[1]}`, import.meta.url), 'utf8')));

function applies(rule, width) {
  for (let parent = rule.parent; parent; parent = parent.parent) {
    if (parent.type !== 'atrule' || parent.name !== 'media') continue;
    if (/prefers-|orientation|hover|pointer/.test(parent.params)) return false;
    for (const [, bound, value] of parent.params.matchAll(/(max|min)-width:\s*(\d+)px/g))
      if (bound === 'max' ? width > Number(value) : width < Number(value)) return false;
  }
  return true;
}

test('the public mobile stylesheet cascade keeps all six cockpit cells in one row', () => {
  for (const width of [320, 375, 390, 430, 560, 561, 700]) {
    let areas;
    for (const sheet of sheets) sheet.walkRules(rule => {
      if (!rule.selector.split(',').some(selector => selector.trim() === '.game-hud') || !applies(rule, width)) return;
      rule.walkDecls('grid-template-areas', declaration => { areas = declaration.value; });
    });
    assert.equal(areas, '"home hearts level score round pause"', `${width}px public cockpit`);
  }
});
