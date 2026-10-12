// Source-level preservation evidence, separate from device/pixel/audio checks.
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const crypto = require('node:crypto'), ts = require('typescript');
const repo = path.resolve(__dirname, '../..');
const base = process.env.CRYPTOID_PRESERVATION_BASE || '16fcfb43aad836de0e38f684c0d4cade82b78976';
const previous = file => execFileSync('git', ['show', `${base}:${file}`], { cwd: repo, encoding: 'utf8' });
const current = file => fs.readFileSync(path.join(repo, file), 'utf8');
const ast = text => ts.createSourceFile('audit.tsx', text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const digest = value => crypto.createHash('sha256').update(value).digest('hex');
function declarations(source) {
 const result = new Map(), tree = ast(source);
 const visit = node => {
  if (ts.isVariableDeclaration(node) && node.initializer) result.set(node.name.getText(tree), node.initializer.getText(tree));
  if (ts.isFunctionDeclaration(node) && node.name) result.set(node.name.text, node.getText(tree));
  ts.forEachChild(node, visit);
 }; visit(tree); return result;
}
function main(source) {
 const tree = ast(source); let found;
 const visit = node => {
  if (ts.isJsxElement(node) && node.openingElement.tagName.getText(tree) === 'main' && node.openingElement.getText(tree).includes('className="game-shell"')) found = node.getText(tree);
  ts.forEachChild(node, visit);
 }; visit(tree); assert.ok(found);
 return found.replace(/^\s*<GameSceneBoundary[^\n]*>\r?\n/gm, '').replace(/^\s*<\/GameSceneBoundary>\r?\n/gm, '');
}
const file = 'frontend/src/pages/GamePage.tsx', old = previous(file), next = current(file);
const before = declarations(old), after = declarations(next), functions = {};
// Explicit user correction after the private device test on 12 October:
// pickups may originate only at defeated ships, never from the 18s timer.
const authorizedTimedPickup = `        if (variety && !intro.weaponIssued && intro.clock >= intro.weaponDue && state.phase !== "SECTOR_CLEAR") {
          const pickup = safeEarlyPickup(state,stageWeaponLevel(shipStageRef.current,state.weaponLevel),width,height,visibleTop);
          if(pickup){ state.powerUps.push({id:nextIdRef.current++,...pickup}); state.powerUpTypes.push(pickup.type); dropsCreatedRef.current++; intro.weaponIssued=true; intro.notice=powerUpNames[pickup.type]; intro.noticeMs=2_600; }
        }
`;
for (const name of ['createFormationSlots', 'spawnAsteroid', 'moveAsteroid', 'saveCombat', 'restoreCombat', 'destroyBoss', 'simulate', 'activateStartPower']) {
 assert.ok(before.has(name), name);
 let expected=before.get(name);
 if(name==='simulate') {
  assert.ok(expected.includes(authorizedTimedPickup));
  expected=expected.replace(authorizedTimedPickup,'').replace('usedTypes: variety && !intro.weaponIssued ? [...state.powerUpTypes, "weapon"] : state.powerUpTypes','usedTypes: state.powerUpTypes');
 }
 assert.equal(after.get(name), expected, name);
 functions[name] = { identical: after.get(name)===before.get(name), sha256: digest(after.get(name)), ...(name==='simulate'?{authorizedChangeOnly:'Remove timed pickup; use the unchanged drop selector exclusively on ship defeat.'}:{}) };
}
assert.equal(main(next), main(old), 'normal game markup');
const changed = execFileSync('git', ['diff', '--name-only', base, '--'], { cwd: repo, encoding: 'utf8' }).trim().split('\n').filter(Boolean);
const visualChanges = changed.filter(name => name.startsWith('frontend/public/') || name.endsWith('.css'));
assert.deepEqual(visualChanges, [], 'styles and original assets');
const audioFile = 'frontend/src/pages/gameAudio.ts';
function audioMembers(source) {
 const tree = ast(source), cls = tree.statements.find(node => ts.isClassDeclaration(node) && node.name.text === 'GameAudio');
 return new Map(cls.members.filter(node => node.name).map(node => [node.name.getText(tree), node.getText(tree)]));
}
const audioBefore = audioMembers(previous(audioFile)), audioAfter = audioMembers(current(audioFile)); let unchangedAudioMembers = 0;
for (const [name, value] of audioBefore) {
 if (['start', 'prepareBossSounds', 'prepareEnemySound'].includes(name)) continue;
 assert.equal(audioAfter.get(name), value, `audio ${name}`); unchangedAudioMembers++;
}
assert.equal(declarations(previous(audioFile)).get('sampleGains'), declarations(current(audioFile)).get('sampleGains'));
const result = { passed: true, base, normalGameMarkup: { identical: true, sha256: digest(main(next)) }, functions,
 stylesAndPublicAssetsChanged: visualChanges, audio: { unchangedMembers: unchangedAudioMembers, sampleGainsIdentical: true, changedOnlyInitializationAndAtomicSamplePreparation: true },
 limitation: 'Source evidence only: no physical iPhone pixel comparison, audible listening test or proof of OS/GPU stability.' };
if (process.env.CRYPTOID_PRESERVATION_OUT) fs.writeFileSync(process.env.CRYPTOID_PRESERVATION_OUT, JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
