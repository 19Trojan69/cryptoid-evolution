const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),ts=require('typescript');
const {execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'../..'),base='50688fe9c2b47a4801e005954cd8a8ee71cfca65';
const old=file=>execFileSync('git',['show',`${base}:${file}`],{cwd:root,encoding:'utf8'}),now=file=>fs.readFileSync(path.join(root,file),'utf8');
function declarations(source){const found=new Map(),tree=ts.createSourceFile('game.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);const visit=node=>{if(ts.isVariableDeclaration(node)&&node.initializer)found.set(node.name.getText(tree),node.initializer.getText(tree));if(ts.isJsxElement(node)&&node.openingElement.getText(tree).includes('className="game-shell"'))found.set('gameMarkup',node.getText(tree));ts.forEachChild(node,visit);};visit(tree);return found;}
const file='frontend/src/pages/GamePage.tsx',before=declarations(old(file)),after=declarations(now(file));
const cleanSimulation=after.get('simulate').split('\n').filter(line=>!line.includes('combatProbeRef.current?.attempt(')&&!line.includes('const probeShotCount =')&&!line.includes('combatProbeRef.current?.shot(')).join('\n');
assert.equal(cleanSimulation,before.get('simulate'),'simulation byte-identical after removing observational calls');
const probeBlock=`      if (combatProbeRef.current) {
        const state = stateRef.current;
        const eligible = !['SECTOR_INTRO', 'SECTOR_CLEAR'].includes(state.phase) && !['boss-intro', 'boss-clear'].includes(state.encounter) && (state.encounter !== 'normal' || formationStartedRef.current);
        combatProbeRef.current.frame(time, lastMeasuredFrameRef.current, Math.min(34, lastMeasuredFrameRef.current), performance.now() - probeStarted,
          state.status === 'playing', eligible, state.shots.length, state.enemyShots.length, state.effects.length, state.asteroids.length);
      }
`;
assert.equal(after.get('step').replace('      const probeStarted = combatProbeRef.current ? performance.now() : 0;\n','').replace(probeBlock,''),before.get('step'),'unchanged scheduler/step apart from observation');
assert.equal(after.get('gameMarkup'),before.get('gameMarkup'),'entire game markup unchanged');
for(const name of ['playerCombat.ts','shipAttributes.ts','enemyFire.ts','sectorBoss.ts','powerUps.ts','gameAudio.ts','musicPlayback.ts','shipMaterial.ts'])assert.equal(now('frontend/src/pages/'+name),old('frontend/src/pages/'+name),name);
const changed=execFileSync('git',['diff','--name-only',base,'--'],{cwd:root,encoding:'utf8'}).trim().split('\n');
assert.deepEqual(changed.filter(file=>file.startsWith('frontend/public/')||file.endsWith('.css')||file.startsWith('backend/src/')),[]);
console.log(JSON.stringify({passed:true,baseline:base,simulationAndShotLogicUnchanged:true,gameMarkupStylesAssetsAudioUnchanged:true,limits:'No native-device visibility/audio/latency proof; measurement has finite overhead.'}));
