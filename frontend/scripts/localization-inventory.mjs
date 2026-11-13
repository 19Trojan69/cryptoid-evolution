import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import ts from 'typescript';
import { fileURLToPath } from 'node:url';
import { languages, hasExplicitTranslation, translate } from '../src/i18n.ts';
import { completeLanguages } from '../src/locales/config.ts';
import { powerUpDescriptions, powerUpNames } from '../src/pages/powerUps.ts';
import { bossLoreEn } from '../src/pages/bossLore.ts';
import { BOSS_NAMES } from '../src/pages/bossNames.ts';
import { supplementalCollectionLocales } from '../src/pages/collectionLore.ts';
import { shipStories } from '../src/pages/shipLore.ts';
import { shipCaptureLore } from '../src/pages/shipCaptureLore.ts';
import { hangarCatalog } from '../../backend/src/hangarCatalog.ts';

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
const properNames = new Set(['Cryptoid', 'Evolution', 'CRYPTOID EVOLUTION', 'Cryptoid Evolution – Trojan Wolf Games', 'Trojan Wolf Games', 'Pi', 'Mainnet', 'Testnet', 'Test', '· Testnet-Beta 0.11', 'NFTs']);
const missionFiles = new Set([
  'GamePage.tsx', 'GameRoute.tsx', 'GameAccessGate.tsx', 'GameHudStats.tsx', 'GameSceneBoundary.tsx',
  'LevelCompletion.tsx', 'BossIntermission.tsx', 'BossHealthView.tsx', 'BossWeaponsView.tsx',
  'MissionWeaponShop.tsx', 'MissionPowerDock.tsx', 'WeaponPurchase.tsx', 'WeaponPreview.tsx',
  'WeaponSpentNotice.tsx', 'WeaponTutorial.tsx', 'PowerPreview.tsx', 'ReloadConfirmation.tsx',
  'BlockchainProgress.tsx', 'CardReveal.tsx', 'LoadingStripes.tsx',
  'SystemSettings.tsx', 'LanguagePicker.tsx', 'GameGuide.tsx', 'BossPhaseGuide.tsx', 'RouteRecovery.tsx',
  'bonusChallenge.ts', 'completionSaveFailure.ts', 'useAuth.ts', 'usePayments.ts',
]);
const collectionFiles = new Set([
  'Collection.tsx', 'CollectionCardView.tsx', 'CardReveal.tsx', 'BossDossier.tsx', 'collectionData.ts',
  'collectionExport.ts', 'useCollectionLore.tsx', 'bossLore.ts', 'shipLore.ts', 'shipCaptureLore.ts',
]);
const collectionStories = (() => {
  const bosses = bossLoreEn.map(({ title, story }, index) => ({ id: index + 1, name: BOSS_NAMES[index], copy: [title, ...story] }));
  const ships = Object.entries(shipStories).map(([id, story]) => ({ id, copy: [story.en, shipCaptureLore[id][1], story.advanced[1], story.elite[1]] }));
  const sourceHash = createHash('sha256').update(JSON.stringify({ bosses, ships })).digest('hex');
  return new Map([...supplementalCollectionLocales].map(locale => {
    assert(Object.hasOwn(languages, locale), `Unexpected card language ${locale}`);
    const pack = JSON.parse(fs.readFileSync(new URL(`../public/collection-lore/${locale}.json`, import.meta.url), 'utf8'));
    assert.equal(pack.locale, locale);
    assert.equal(pack.sourceHash, sourceHash, `Card story sources changed for ${locale}`);
    const localized = new Map();
    for (const [cards, translations] of [[bosses, pack.bosses], [ships, pack.ships]]) {
      assert.deepEqual(Object.keys(translations), cards.map(({ id }) => String(id)), `Card IDs for ${locale}`);
      for (const { id, copy } of cards) {
        const lines = translations[id];
        assert.equal(lines.length, copy.length, `Card ${locale}/${id}`);
        for (const [index, line] of lines.entries()) {
          assert(typeof line === 'string' && line.trim() && !/[<>\n]|\{\{/.test(line) && line !== copy[index],
            `Untranslated or malformed card text ${locale}/${id}/${index}`);
          localized.set(copy[index], line);
        }
      }
    }
    assert.equal(new Set(Object.values(pack.bosses).map(([title]) => title)).size, bosses.length, `Duplicate boss titles for ${locale}`);
    return [locale, localized];
  }));
})();
function scan(directory) {
  for (const item of fs.readdirSync(directory, { withFileTypes: true })) {
    const file = path.join(directory, item.name), name = item.name;
    if (item.isDirectory()) { if (name !== 'locales') scan(file); continue; }
    if (!/\.tsx?$/.test(name) || /i18n|\.test\./.test(name)) continue;
    const relative = path.relative(root, file);
    const source = ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true, file.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
    const collect = (node, language = 'en') => {
      const text = template(node);
      if (text !== null) record(text, relative, language);
      else if (ts.isConditionalExpression(node)) { collect(node.whenTrue, language); collect(node.whenFalse, language); }
      else if (ts.isArrayLiteralExpression(node)) node.elements.forEach(child => collect(child, language));
    };
    const visit = node => {
      if (ts.isCallExpression(node)) {
        const method = node.expression.getText(source);
        if (method === 't' && node.arguments[0]) collect(node.arguments[0], name.startsWith('Admin') ? 'de' : 'en');
        if (method === 'translate' && node.arguments[1]) collect(node.arguments[1]);
        if (method === 'say' && node.arguments[1]) collect(node.arguments[1]);
        if (node.arguments[0] && (
          (name === 'GamePage.tsx' && method === 'setWeaponError') ||
          (name === 'SystemSettings.tsx' && method === 'setFullscreenStatus') ||
          (name === 'MissionWeaponShop.tsx' && method === 'setNotice') ||
          (name === 'usePayments.ts' && method === 'setPaymentStatus')
        )) collect(node.arguments[0]);
        if (/^set(?:AuthError|AdminError|AccountError|StartError|SaveNotice|LoadoutMessage|Message|HangarMessage|Error)$/.test(method) && node.arguments[0]) {
          const text = template(node.arguments[0]);
          if (text) record(text, relative, name.startsWith('Admin') ? 'de' : 'en');
        }
      }
      if (name === 'completionSaveFailure.ts' && ts.isReturnStatement(node) && node.expression) collect(node.expression);
      if (name === 'GamePage.tsx' && ts.isVariableDeclaration(node) && node.name.getText(source) === 'pickupEffectLabels'
        && node.initializer && ts.isObjectLiteralExpression(node.initializer)) {
        for (const property of node.initializer.properties) if (ts.isPropertyAssignment(property)) collect(property.initializer);
      }
      if (name.startsWith('Admin') && ts.isVariableDeclaration(node) && node.initializer) {
        const variable = node.name.getText(source);
        if (['tabs', 'audioTests'].includes(variable) && ts.isArrayLiteralExpression(node.initializer)) {
          for (const row of node.initializer.elements) if (ts.isArrayLiteralExpression(row)) collect(row.elements[variable === 'tabs' ? 1 : 0], variable === 'tabs' ? 'de' : 'en');
        }
        if (['stageNames', 'weaponNames'].includes(variable)) collect(node.initializer);
        if (['networkNames', 'statusNames', 'names'].includes(variable) && ts.isObjectLiteralExpression(node.initializer)) {
          for (const property of node.initializer.properties) if (ts.isPropertyAssignment(property)) collect(property.initializer, 'de');
        }
      }
      if (name.startsWith('Admin') && ts.isReturnStatement(node) && node.expression && (ts.isStringLiteral(node.expression) || ts.isNoSubstitutionTemplateLiteral(node.expression)) && /[ÄÖÜäöüß]|\s/.test(node.expression.text)) collect(node.expression, 'de');
      if (name.startsWith('Admin') && ts.isArrayLiteralExpression(node) && node.elements.some(child => ts.isArrayLiteralExpression(child)) && node.parent.getText(source).includes('.map(')) {
        for (const row of node.elements) if (ts.isArrayLiteralExpression(row)) for (const value of row.elements.slice(1)) if (ts.isStringLiteral(value)) collect(value, 'de');
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
        const dossier = entry => { if (ts.isStringLiteral(entry)) entry.text.split('|').forEach(text => record(text, relative)); ts.forEachChild(entry, dossier); };
        if (node.initializer) dossier(node.initializer);
      }
      if (name === 'shipCaptureLore.ts' && ts.isPropertyAssignment(node) && ts.isArrayLiteralExpression(node.initializer) && node.initializer.elements[1]) collect(node.initializer.elements[1]);
      // Only the DE/EN copy branches contain display text; locale-code branches do not.
      if (name === 'shipLore.ts' && ts.isConditionalExpression(node) && node.condition.getText(source) === 'de') collect(node.whenFalse);
      if (name === 'BossDossier.tsx' && ts.isVariableDeclaration(node) && node.name.getText(source) === 'weaponLabels' && node.initializer && ts.isObjectLiteralExpression(node.initializer)) {
        for (const property of node.initializer.properties) if (ts.isPropertyAssignment(property) && ts.isArrayLiteralExpression(property.initializer)) collect(property.initializer.elements[1]);
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
for (const source of [...Object.values(powerUpNames), ...Object.values(powerUpDescriptions)]) record(source, 'pages/GamePage.tsx');
for (const { kind, name, description } of hangarCatalog) {
  if (kind === 'power' || kind === 'weapon') {
    record(name, 'pages/MissionWeaponShop.tsx');
    record(description, 'pages/MissionWeaponShop.tsx');
  }
}
scan(root);
const entries = [...texts.values()].sort((a, b) => a.language.localeCompare(b.language) || a.source.localeCompare(b.source)).map((entry, id) => ({ id, ...entry }));
const placeholders = text => [...text.matchAll(/\{(\w+)\}/g)].map(match => match[1]).sort().join('|');
const coverage = Object.fromEntries(Object.keys(languages).map(locale => {
  const stories = collectionStories.get(locale);
  const missing = entries.filter(entry => locale !== entry.language && !hasExplicitTranslation(locale, entry.source) && !stories?.has(entry.source)).map(entry => entry.id);
  const invalidPlaceholders = entries.filter(entry => !missing.includes(entry.id) && placeholders(stories?.get(entry.source) ?? translate(locale, entry.source)) !== placeholders(entry.source)).map(entry => entry.id);
  return [locale, { label: languages[locale], required: entries.length, translated: entries.length - missing.length, missing, invalidPlaceholders, draft: !completeLanguages.includes(locale) }];
}));
const missionEntries = new Set(entries.filter(entry => entry.files.some(file => missionFiles.has(path.basename(file)))).map(entry => entry.id));
const missionMissing = Object.fromEntries(Object.entries(coverage).map(([locale, row]) => [locale, row.missing.filter(id => missionEntries.has(id))]));
const collectionEntries = new Set(entries.filter(entry => entry.files.some(file => collectionFiles.has(path.basename(file)))).map(entry => entry.id));
const collectionMissing = Object.fromEntries(Object.entries(coverage).map(([locale, row]) => [locale, row.missing.filter(id => collectionEntries.has(id))]));
const playerMenuFiles = new Set([
  'Shop.tsx', 'ShipSelectionPanel.tsx', 'ShipPreview.tsx', 'NftOverview.tsx', 'BossNftPreview.tsx',
  'ShipNftPreview.tsx', 'PilotProfile.tsx', 'CareerDashboard.tsx', 'AvatarCropper.tsx',
  'FeedbackHub.tsx', 'FeedbackDescription.tsx', 'CommunityText.tsx', 'Header.tsx', 'QuickAccessMenu.tsx',
]);
const playerMenuEntries = new Set(entries.filter(entry => entry.files.some(file => playerMenuFiles.has(path.basename(file)))).map(entry => entry.id));
const playerMenuMissing = Object.fromEntries(Object.entries(coverage).map(([locale, row]) => [locale, row.missing.filter(id => playerMenuEntries.has(id))]));
// Missing entries reference IDs above rather than duplicating long stories for every language.
const report = {
  schemaVersion: 2, staticCopyOnly: true, entries, unwrapped, coverage, completeLanguages,
  missionCoverage: { required: missionEntries.size, missing: missionMissing },
  collectionCoverage: { required: collectionEntries.size, missing: collectionMissing },
  playerMenuCoverage: { required: playerMenuEntries.size, missing: playerMenuMissing },
  releaseReady: unwrapped.length === 0
    && completeLanguages.every(code => coverage[code]?.missing.length === 0)
    && Object.values(missionMissing).every(missing => missing.length === 0)
    && Object.values(collectionMissing).every(missing => missing.length === 0)
    && Object.values(playerMenuMissing).every(missing => missing.length === 0)
    && Object.values(coverage).every(locale => locale.invalidPlaceholders.length === 0),
};
if (process.argv.includes('--json')) process.stdout.write(JSON.stringify(report, null, 2) + '\n');
else {
  console.log(`Static copy: ${entries.length}; unwrapped UI fragments: ${unwrapped.length}`);
  for (const [code, row] of Object.entries(coverage)) console.log(`${code}: ${row.translated}/${row.required}${row.draft ? ' (draft)' : ''}`);
  console.log(`Mission interface: ${missionEntries.size} texts checked in ${Object.keys(coverage).length} languages.`);
  for (const [code, missing] of Object.entries(missionMissing)) {
    if (missing.length) console.log(`${code} missing mission texts: ${missing.map(id => entries[id].source).join(' | ')}`);
  }
  console.log(`Collection cards: ${collectionEntries.size} texts checked in ${Object.keys(coverage).length} languages.`);
  for (const [code, missing] of Object.entries(collectionMissing)) {
    if (missing.length) console.log(`${code} missing card texts: ${missing.map(id => entries[id].source).join(' | ')}`);
  }
  console.log(`Player menus: ${playerMenuEntries.size} texts checked in ${Object.keys(coverage).length} languages.`);
  for (const [code, missing] of Object.entries(playerMenuMissing)) {
    if (missing.length) console.log(`${code} missing menu texts: ${missing.map(id => entries[id].source).join(' | ')}`);
  }
  console.log(`Complete language gate: ${completeLanguages.join(', ')}; release ready: ${report.releaseReady}`);
}
if (process.argv.includes('--check') && !report.releaseReady) process.exitCode = 1;
