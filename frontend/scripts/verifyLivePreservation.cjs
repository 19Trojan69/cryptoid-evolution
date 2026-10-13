// Strict source evidence, not a native pixel/audio/GPU or crash-free guarantee.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto'),ts=require('typescript');
const {execFileSync}=require('node:child_process');
const repo=path.resolve(__dirname,'../..'),base='1c1c7f9b6c5e8ac7d41b9bf1c4b44036cc196220';
const previous=file=>execFileSync('git',['show',`${base}:${file}`],{cwd:repo,encoding:'utf8'}),current=file=>fs.readFileSync(path.join(repo,file),'utf8');
const ast=source=>ts.createSourceFile('source.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX),hash=value=>crypto.createHash('sha256').update(value).digest('hex');
function declarations(source){const result=new Map(),tree=ast(source);const visit=node=>{if(ts.isVariableDeclaration(node)&&node.initializer)result.set(node.name.getText(tree),node.initializer.getText(tree));if(ts.isFunctionDeclaration(node)&&node.name)result.set(node.name.text,node.getText(tree));ts.forEachChild(node,visit);};visit(tree);return result;}
function gameMarkup(source){let main;const tree=ast(source);const visit=node=>{if(ts.isJsxElement(node)&&node.openingElement.tagName.getText(tree)==='main'&&node.openingElement.getText(tree).includes('className="game-shell"'))main=node.getText(tree);ts.forEachChild(node,visit);};visit(tree);assert.ok(main);return main;}
const file='frontend/src/pages/GamePage.tsx',old=previous(file),next=current(file),before=declarations(old),after=declarations(next),identical=[];
for(const name of ['createFormationSlots','spawnAsteroid','spawnBossEscort','moveAsteroid','destroyBoss','saveCombat','restoreCombat','activateStartPower']){assert.equal(after.get(name),before.get(name),name);identical.push(name);}
const timed=`        if (variety && !intro.weaponIssued && intro.clock >= intro.weaponDue && state.phase !== "SECTOR_CLEAR") {
          const pickup = safeEarlyPickup(state,stageWeaponLevel(shipStageRef.current,state.weaponLevel),width,height,visibleTop);
          if(pickup){ state.powerUps.push({id:nextIdRef.current++,...pickup}); state.powerUpTypes.push(pickup.type); dropsCreatedRef.current++; intro.weaponIssued=true; intro.notice=powerUpNames[pickup.type]; intro.noticeMs=2_600; }
        }
`;
assert.ok(before.get('simulate').includes(timed));
assert.equal(after.get('simulate'),before.get('simulate').replace(timed,'').replace('usedTypes: variety && !intro.weaponIssued ? [...state.powerUpTypes, "weapon"] : state.powerUpTypes','usedTypes: state.powerUpTypes'),'only explicitly authorized pickup-origin changes in simulation');
assert.equal(after.get('step'),before.get('step').replace('      simulate(time);','      simulate(time);\n      if (stateRef.current.status === \'playing\' && saveQueueRef.current?.underPressure) interruptionRef.current(\'save-pressure\');'),'unchanged RAF/paint step except save-pressure safety pause');
assert.equal(gameMarkup(next),gameMarkup(old),'complete game markup, dimensions and effects');
const changed=execFileSync('git',['diff','--name-only',base,'--'],{cwd:repo,encoding:'utf8'}).trim().split('\n').filter(Boolean);
assert.deepEqual(changed.filter(file=>file.startsWith('frontend/public/')||file.endsWith('.css')||file.startsWith('backend/src/')),[]);
for(const name of ['gameAudio.ts','musicPlayback.ts','sectorManager.ts','shipDisplayScale.ts','shipMaterial.ts','bossWeaponRenderer.ts','bossWeaponTextures.ts','Starfield.tsx','SectorBackdrop.tsx','BossWeaponsView.tsx','playerCombat.ts','shipAttributes.ts','powerUps.ts'])assert.equal(current('frontend/src/pages/'+name),previous('frontend/src/pages/'+name),name);
const result={passed:true,baseline:base,normalMarkupSha256:hash(gameMarkup(next)),identicalGameplayFunctions:identical,simulationChangedOnly:'Remove elapsed-time pickup and its artificial weapon reservation; existing defeat-drop function and limits remain byte-identical',stepChangedOnly:'Existing technical pause when save outbox is pressured; no rate/gate/quality change',stylesAssetsBackendChanged:false,audioSourceIdentical:true,shipSizesFormationsEntryTimingsIdentical:true,materialPixelAlgorithmIdentical:true,limits:'Source/logic evidence only; no real-device pixel/audio/GPU/FPS or original crash-fix proof'};
if(process.env.CRYPTOID_LIVE_PRESERVATION_OUT)fs.writeFileSync(process.env.CRYPTOID_LIVE_PRESERVATION_OUT,JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
