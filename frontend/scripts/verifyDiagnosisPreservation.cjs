// Compare the actual source with the immutable public Testnet commit.
const fs=require('node:fs'),cp=require('node:child_process'),assert=require('node:assert/strict'),ts=require('typescript');
const baseline='1c1c7f9b6c5e8ac7d41b9bf1c4b44036cc196220';
const file='frontend/src/pages/GamePage.tsx';
const before=cp.execFileSync('git',['show',`${baseline}:${file}`],{encoding:'utf8'});
const after=fs.readFileSync('src/pages/GamePage.tsx','utf8');
const parse=source=>{const ast=ts.createSourceFile('GamePage.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX),nodes=new Map();const visit=node=>{if(ts.isVariableDeclaration(node)&&ts.isIdentifier(node.name)&&node.initializer)nodes.set(node.name.text,node.initializer);ts.forEachChild(node,visit);};visit(ast);return {ast,nodes};};
const a=parse(before),b=parse(after);
const names=['moveAsteroid','spawnAsteroid','spawnBossEscort','attackTime','createInitialState','createFormationSlots','syncSelectedWeapon','engineTrails','scatteredPieces','fallingBoss'];
for(const name of names){assert.ok(a.nodes.has(name)&&b.nodes.has(name),name);assert.equal(b.nodes.get(name).getText(b.ast),a.nodes.get(name).getText(a.ast),name+' unchanged');}
const scene=x=>x.nodes.get('GamePage').body.statements.findLast(ts.isReturnStatement).expression.getText(x.ast);
assert.equal(scene(b).replace(' data-hull-ready={bossHullReady}',''),scene(a),'only unloaded-boss flame-readiness attribute added to game JSX');
const stripProbe=s=>s.replace(/^[ \t]*performanceProbeRef\.current\?\.(?:mark|volley|hit|sceneRequested)\([^\n]*\);\n/gm,'');
let baseSimulation=stripProbe(a.nodes.get('simulate').getText(a.ast)),currentSimulation=stripProbe(b.nodes.get('simulate').getText(b.ast));
const timedStart=baseSimulation.indexOf('        if (variety && !intro.weaponIssued && intro.clock >= intro.weaponDue');
assert.ok(timedStart>=0);const timedEnd=baseSimulation.indexOf('        const rockAllowed =',timedStart);baseSimulation=baseSimulation.slice(0,timedStart)+baseSimulation.slice(timedEnd);
currentSimulation=currentSimulation.replace('contactWithBoss(state.player, width, height, state.boss, impactCooldownRef.current, previousBoss, previousPlayer)','contactWithEnemy(state.player, width, height, state.boss, true, false, impactCooldownRef.current, previousBoss, previousPlayer)');
const canonicalDrop=(source,start)=>{const a=source.indexOf(start);assert.ok(a>=0);const b=source.indexOf('\n        }\n        state.shots',a);assert.ok(b>a);return source.slice(0,a)+'          APPROVED_KILL_ORIGIN_DROP;'+source.slice(b);};
baseSimulation=canonicalDrop(baseSimulation,'          const drop = enemy.escort ? null : createPowerUpDrop(');currentSimulation=canonicalDrop(currentSimulation,'          const ordinaryDrop = enemy.escort ? null : createPowerUpDrop(');
assert.equal(currentSimulation,baseSimulation,'simulation unchanged except boss contact, kill-origin drops and diagnostic calls');
// Keep the established ordinary chance function, all arguments and existing safety limits verbatim.
const ordinary=node=>{let found;const visit=n=>{if(ts.isCallExpression(n)&&n.expression.getText(node.ast)==='createPowerUpDrop')found=n.getText(node.ast);ts.forEachChild(n,visit);};visit(node.ast);return found;};assert.equal(ordinary(b),ordinary(a),'ordinary drop probabilities and safety arguments unchanged');
const trackedChanges=cp.execFileSync('git',['diff','--name-only',baseline],{encoding:'utf8'}).trim().split('\n');
assert.ok(!trackedChanges.some(p=>p!=='frontend/src/pages/hullArrival.css'&&/\.(?:css|png|webp|svg|mp3|woff2|ttf)$/.test(p)),'no styles or assets changed');
const result={passed:true,baseline,unchangedFunctions:names,gameJSXUnchangedExceptHullReadiness:true,simulationUnchangedExceptAuthorizedFixes:true,existingStylesAndAssetsUnchanged:true,ordinaryDropChanceUnchanged:true,authorizedChanges:['boss contact extents','kill-origin opening benefit','unloaded-hull flame guard','bounded hull preparation','developer diagnostics/export']};
console.log(JSON.stringify(result,null,2));
