import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import { formatLives } from './locales/quantities.ts';
import { languages, hasTranslation, translate, resolveLocale } from './i18n.ts';
import { regionalCoreKeys, regionalLocales } from './locales/regional.ts';

const sourceRoot = path.dirname(new URL(import.meta.url).pathname);
const rawUiTexts = [];
const required = new Set(JSON.parse(fs.readFileSync(path.join(sourceRoot, 'locales/uiKeys.json'), 'utf8')));
function discover(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) { if (entry.name !== 'locales') discover(file); continue; }
    if (!/\.tsx?$/.test(file) || /i18n|\.test\.|AdminPage|AdminUsage|BossWeaponsView|EngagementTasks|ProductCard/.test(entry.name)) continue;
    const ast = ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true, file.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
    const collect = node => {
      if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) { if (node.text) required.add(node.text); }
      else if (ts.isConditionalExpression(node)) { collect(node.whenTrue); collect(node.whenFalse); }
    };
    const visit = node => {
      if (ts.isCallExpression(node) && node.arguments[0]) {
        const method = node.expression.getText(ast);
        if (method === 't' || /^set(?:AuthError|AdminError|AccountError|StartError|SaveNotice|LoadoutMessage|Message|HangarMessage)$/.test(method)) collect(node.arguments[0]);
      }
      if (entry.name === 'QuickAccessMenu.tsx' && ts.isPropertyAssignment(node)) {
        if (node.name.getText(ast) === 'title') collect(node.initializer);
        if (node.name.getText(ast) === 'items' && ts.isArrayLiteralExpression(node.initializer)) {
          for (const item of node.initializer.elements) if (ts.isArrayLiteralExpression(item) && item.elements[1]) collect(item.elements[1]);
        }
      }
      // Guide and reward strings are selected by data rather than literal t() calls.
      if (ts.isPropertyAssignment(node) && ['GameGuide.tsx', 'bonusChallenge.ts'].includes(entry.name) && ['label', 'title', 'intro', 'details'].includes(node.name.getText(ast))) {
        if (ts.isArrayLiteralExpression(node.initializer)) node.initializer.elements.forEach(collect);
        else collect(node.initializer);
      }
      const recordRaw = (text) => {
        const value = text.trim();
        if (!/[A-Za-zÄÖÜäöüß]{2}/.test(value)) return;
        if (['Cryptoid', 'Evolution', 'CRYPTOID EVOLUTION', 'Cryptoid Evolution – Trojan Wolf Games', 'Trojan Wolf Games', 'Pi', 'Test', '· Testnet-Beta 0.11'].includes(value)) return;
        rawUiTexts.push(`${entry.name}: ${value}`);
      };
      if (ts.isJsxText(node)) recordRaw(node.text);
      if (ts.isJsxAttribute(node) && ['aria-label', 'title', 'placeholder', 'alt'].includes(node.name.getText(ast)) && node.initializer && ts.isStringLiteral(node.initializer)) recordRaw(node.initializer.text);
      if (ts.isJsxExpression(node) && node.expression && !ts.isJsxAttribute(node.parent)) {
        const inspect = expression => {
          if (ts.isStringLiteral(expression) || ts.isNoSubstitutionTemplateLiteral(expression)) recordRaw(expression.text);
          else if (ts.isConditionalExpression(expression)) { inspect(expression.whenTrue); inspect(expression.whenFalse); }
        };
        inspect(node.expression);
      }
      ts.forEachChild(node, visit);
    };
    visit(ast);
  }
}
discover(sourceRoot);
required.add('Ship {number} · {stage}');
for (const [file, fields] of [
  [path.resolve(sourceRoot, '../..', 'backend/src/hangarCatalog.ts'), ['name', 'description']],
  [path.resolve(sourceRoot, '../..', 'backend/src/rewardRules.ts'), ['name']],
]) {
  const ast = ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true);
  const visit = node => {
    if (ts.isPropertyAssignment(node) && fields.includes(node.name.getText(ast)) && ts.isStringLiteral(node.initializer)) required.add(node.initializer.text);
    ts.forEachChild(node, visit);
  };
  visit(ast);
}
const placeholders = text => [...text.matchAll(/\{(\w+)\}/g)].map(match => match[1]).sort();
for (const locale of Object.keys(languages)) {
  test(`${locale}: ${regionalLocales.includes(locale) ? 'draft core controls' : 'every player UI key'} has a translation and preserves its placeholders`, () => {
    const keys = regionalLocales.includes(locale) ? regionalCoreKeys : [...required];
    const missing = keys.filter(key => !hasTranslation(locale, key));
    assert.deepEqual(missing, [], `${locale}: missing translations`);
    for (const key of keys) {
      assert.deepEqual(placeholders(translate(locale, key)), placeholders(key), `${locale}: ${key}`);
      if (locale !== 'en' && key.length > 90) assert.notEqual(translate(locale, key), key, `${locale}: untranslated prose`);
    }
  });
}
test('English mission resume contains no German source text', () => {
  const description = 'Completed sections stay saved in your Pi account. An unfinished section restarts when you resume.';
  const text = ['Your mission', description, 'Resume', 'New game', 'Back'].map(key => translate('en', key)).join(' ');
  assert.match(text, /Your mission.*Completed sections.*Resume.*New game.*Back/);
  assert.doesNotMatch(text, /Bestätigte|Fortsetzen|Zurück|Abschnitte/);
});
test('interpolation handles all repeated values and a locale change preserves life count', () => {
  const key = 'Resume at section {section} · {phase} · {hearts} lives · {score} points.';
  for (const locale of Object.keys(languages)) {
    const text = translate(locale, key, { section: 14, phase: translate(locale, 'Boss'), hearts: 1, score: 6463 });
    assert.doesNotMatch(text, /\{\w+\}/);
    assert.match(text, /6463/);
    assert.match(text, /\b1\b/);
  }
});
test('automatic language choice and manual override resolve supported locales', () => {
  assert.equal(resolveLocale(['en-US', 'de-AT']), 'en');
  assert.equal(resolveLocale(['en-US'], 'th'), 'th');
  assert.equal(resolveLocale(['de-AT']), 'de');
  assert.equal(resolveLocale(['xx-ZZ']), 'en');
});

test('remaining lives use the correct singular and plural forms', () => {
  assert.equal(formatLives('en', 1), '1 life');
  assert.equal(formatLives('en', 3), '3 lives');
  assert.equal(formatLives('de', 1), '1 Leben');
  assert.equal(formatLives('ru', 1), '1 жизнь');
  assert.equal(formatLives('ru', 2), '2 жизни');
  assert.equal(formatLives('ru', 5), '5 жизней');
  assert.equal(formatLives('pl', 5), '5 żyć');
});

test('player components contain no unwrapped static UI copy', () => {
  assert.deepEqual(rawUiTexts, []);
});
