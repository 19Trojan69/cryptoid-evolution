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
assert.equal(scene(b),scene(a),'entire rendered game JSX is unchanged');
const stripProbe=s=>s.replace(/^[ \t]*performanceProbeRef\.current\?\.(?:mark|volley)\([^\n]+\);\n/gm,'');
assert.equal(stripProbe(b.nodes.get('simulate').getText(b.ast)),stripProbe(a.nodes.get('simulate').getText(a.ast)),'simulation is identical after removing diagnostic-only calls');
const trackedChanges=cp.execFileSync('git',['diff','--name-only',baseline],{encoding:'utf8'}).trim().split('\n');
assert.ok(!trackedChanges.some(p=>/\.(?:css|png|webp|svg|mp3|woff2|ttf)$/.test(p)),'no styles or assets changed');
const result={passed:true,baseline,unchangedFunctions:names,entireGameJSXIdentical:true,simulationIdenticalWithoutProbe:true,stylesAndAssetsUnchanged:true};
console.log(JSON.stringify(result,null,2));
