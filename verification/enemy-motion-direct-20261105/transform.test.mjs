import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,unlinkSync,mkdtempSync,rmSync} from 'node:fs';
import {resolve} from 'node:path';
import {tmpdir} from 'node:os';
import {execFileSync} from 'node:child_process';
import {enemyController,visual,adaptMuzzleBuilder,adaptCriticalBuilder,adaptDeviceBuilder,REDUCED_CSS} from './transform.mjs';
import {adaptJournalBuild} from '../player-muzzle-webkit-device-20261105/transform.mjs';

const root=resolve(new URL('../..',import.meta.url).pathname),read=p=>readFileSync(root+'/'+p,'utf8');
const game=read('frontend/src/pages/GamePage.tsx'),ship=read('frontend/src/pages/GameShipVisual.tsx');
test('control retains complete frozen sources and candidate changes only declared normal-enemy fragments',()=>{
 assert.equal(enemyController(game,'control'),game);assert.equal(visual(ship,'control'),ship);
 const changed=enemyController(game,'candidate');
 assert.equal(changed.split('motionBank={asteroid.visualMotion?.bank ?? 0}').length,2);
 assert.equal(changed.split('motionFlameLength=').length,2);
 // Player direct frame writes, bonus path and the complete rest restore exactly.
 assert.ok(changed.includes('playerShipRef.current?.style.setProperty("--visual-bank"'));
 assert.ok(changed.includes('game.bonusTargets.map(target'));
});
test('incompatible/missing/duplicate runtime source is rejected instead of broad normalization',()=>{
 assert.throws(()=>visual(ship+'\n'));
 assert.throws(()=>enemyController(game.replace('"--visual-bank": `${asteroid.visualMotion?.bank ?? 0}deg`, ','') ));
 assert.throws(()=>enemyController(game+game));
});
test('legacy consumers and both reduced-motion routes remain explicit',()=>{
 const s=visual(ship,'candidate');assert.ok(s.includes('motionBank === undefined ? null'));
 assert.ok(s.includes('style={motion ? {...style,...motion.engine} : style}'));
 assert.ok(REDUCED_CSS.includes('@media(prefers-reduced-motion:reduce)'));
 assert.ok(REDUCED_CSS.includes('html[data-motion="reduced"]'));
 assert.equal((REDUCED_CSS.match(/rotateY\(0deg\)!important/g)||[]).length,2);
});
test('all generated Node builder stages are syntactically valid in both assigned conditions',()=>{
 const dir=mkdtempSync(resolve(tmpdir(),'cryptoid-enemy-build-'));
 try{for(const condition of ['control','candidate']){
  const sources=[adaptDeviceBuilder(read('verification/player-muzzle-webkit-device-20261105/build.mjs'),condition),
   adaptCriticalBuilder(adaptJournalBuild(read('verification/critical-failure-journal-20261104/build.mjs')),condition),
   adaptMuzzleBuilder(read('verification/player-muzzle-local-20261104/build.mjs'),condition)];
  sources.forEach((s,i)=>{const p=resolve(dir,condition+i+'.mjs');writeFileSync(p,s);execFileSync(process.execPath,['--check',p]);});
 }}finally{rmSync(dir,{recursive:true,force:true});}
});
