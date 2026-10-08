import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import { fileURLToPath } from 'node:url';
import { languages, hasTranslation } from '../src/i18n.ts';
import { regionalLocales } from '../src/locales/regional.ts';

// Static copy only: no runtime account, payment, database, configuration or secret values.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../src');
const texts = new Map();
const unwrapped = [];
const record = (source, file, language = 'en') => {
  if (!source.trim() || !/[A-Za-z\u00c0-\u024f\u0400-\u04ff]/u.test(source)) return;
  const key = `${language}:${source}`;
  const entry = texts.get(key) ?? { source, language, files: [] };
  if (!entry.files.includes(file)) entry.files.push(file);
  texts.set(key, entry);
};
const template = node => {
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text;
  if (ts.isTemplateExpression(node)) return node.head.text + node.templateSpans.map((span, index) => `{value${index}}${span.literal.text}`).join('');
  return null;
};
const properNames = new Set(['Cryptoid', 'Evolution', 'CRYPTOID EVOLUTION', 'Cryptoid Evolution – Trojan Wolf Games', 'Trojan Wolf Games', 'Pi', 'Test', '· Testnet-Beta 0.11']);
function scan(directory) {
  for (const item of fs.readdirSync(directory, { withFileTypes: true })) {
    const file = path.join(directory, item.name), name = item.name;
    if (item.isDirectory()) { if (name !== 'locales') scan(file); continue; }
    if (!/\.tsx?$/.test(name) || /i18n|\.test\./.test(name)) continue;
    const relative = path.relative(root, file);
    const source = ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true, file.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
    const collect = node => {
      const text = template(node);
      if (text !== null) record(text, relative);
      else if (ts.isConditionalExpression(node)) { collect(node.whenTrue); collect(node.whenFalse); }
      else if (ts.isArrayLiteralExpression(node)) node.elements.forEach(collect);
    };
    const visit = node => {
      if (ts.isCallExpression(node)) {
        const method = node.expression.getText(source);
        if (method === 't' && node.arguments[0]) collect(node.arguments[0]);
        if (method === 'translate' && node.arguments[1]) collect(node.arguments[1]);
        if (method === 'say' && node.arguments[1]) collect(node.arguments[1]);
        if (/^set(?:AuthError|AdminError|AccountError|StartError|SaveNotice|LoadoutMessage|Message|HangarMessage|Error)$/.test(method) && node.arguments[0]) {
          const text = template(node.arguments[0]);
          if (text) record(text, relative, name.startsWith('Admin') ? 'de' : 'en');
        }
      }
      if (ts.isPropertyAssignment(node)) {
        const property = node.name.getText(source);
        if (['GameGuide.tsx', 'bonusChallenge.ts'].includes(name) && ['label', 'title', 'intro', 'details'].includes(property)) collect(node.initializer);
        if (name === 'shipLore.ts' && property === 'en') collect(node.initializer);
        if (name === 'shipLore.ts' && ['advanced', 'elite'].includes(property) && ts.isArrayLiteralExpression(node.initializer)) collect(node.initializer.elements[1]);
        if (name === 'QuickAccessMenu.tsx' && property === 'title') collect(node.initializer);
        if (name === 'QuickAccessMenu.tsx' && property === 'items' && ts.isArrayLiteralExpression(node.initializer)) {
          for (const row of node.initializer.elements) if (ts.isArrayLiteralExpression(row) && row.elements[1]) collect(row.elements[1]);
        }
      }
      if (name === 'bossLore.ts' && ts.isVariableDeclaration(node) && node.name.getText(source) === 'bossLoreEn') {
        const dossier = entry => { if (ts.isStringLiteral(entry)) record(entry.text, relative); ts.forEachChild(entry, dossier); };
        if (node.initializer) dossier(node.initializer);
      }
      let raw = null;
      if (ts.isJsxText(node)) raw = node.text.trim().replace(/\s+/g, ' ');
      if (ts.isJsxAttribute(node) && ['aria-label', 'title', 'placeholder', 'alt'].includes(node.name.getText(source)) && node.initializer && ts.isStringLiteral(node.initializer)) raw = node.initializer.text;
      if (raw && !properNames.has(raw) && /[A-Za-zÄÖÜäöüß]{2}/.test(raw)) {
        record(raw, relative, name.startsWith('Admin') ? 'de' : 'en');
        unwrapped.push({ file: relative, source: raw });
      }
      ts.forEachChild(node, visit);
    };
    visit(source);
  }
}
for (const key of JSON.parse(fs.readFileSync(path.join(root, 'locales/uiKeys.json'), 'utf8'))) record(key, 'locales/uiKeys.json');
scan(root);
const entries = [...texts.values()].sort((a, b) => a.language.localeCompare(b.language) || a.source.localeCompare(b.source));
const playerKeys = entries.filter(entry => entry.language === 'en').map(entry => entry.source);
const coverage = Object.fromEntries(Object.keys(languages).map(locale => {
  const missing = playerKeys.filter(key => !hasTranslation(locale, key));
  return [locale, { label: languages[locale], required: playerKeys.length, translated: playerKeys.length - missing.length, missing, draft: regionalLocales.includes(locale) }];
}));
const report = { staticCopyOnly: true, entries, unwrapped, coverage, releaseReady: unwrapped.length === 0 && Object.values(coverage).every(locale => locale.missing.length === 0) };
if (process.argv.includes('--json')) process.stdout.write(JSON.stringify(report, null, 2) + '\n');
else {
  console.log(`Static copy: ${entries.length}; unwrapped UI fragments: ${unwrapped.length}`);
  for (const [code, row] of Object.entries(coverage)) console.log(`${code}: ${row.translated}/${row.required}${row.draft ? ' (draft)' : ''}`);
  console.log(`Release ready: ${report.releaseReady}`);
}
if (process.argv.includes('--check') && !report.releaseReady) process.exitCode = 1;
