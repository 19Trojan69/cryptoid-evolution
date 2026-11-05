import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

export const originalSha256='5ce3a3c5a7f3c6e08ea6d0c43d134b4dd5e406462392a54157523c6a1217fb3c';
export const conditions=['control','milky-hidden'];
export function makeDriver(condition) {
 assert.ok(conditions.includes(condition),'Unknown internal render condition');
 const source=readFileSync(new URL('../webkit-memory-categories-20261105/run.mjs',import.meta.url),'utf8');
 assert.equal(createHash('sha256').update(source).digest('hex'),originalSha256,'Original complete collector is pinned');
 const patches=[
 ["const output=root+'/verification/webkit-memory-categories-20261105/results';",
  "const output=root+'/verification/milky-band-attribution-20261105/results/"+condition+"';"],
 ["kind:'webkit-native-memory-categories-and-layer-owners',complete:false,",
  "kind:'internal-single-background-suppression',condition:"+JSON.stringify(condition)+",renderSuppressionIsDiagnosisOnly:true,pixelEquivalenceClaimed:false,originalCollectorSha256:'"+originalSha256+"',complete:false,"],
 ["await tap(page.getByRole('button',{name:'Boss-2-Test öffnen',exact:true}));",
  "const probeStyle=await page.addStyleTag({content:"+JSON.stringify(condition==='milky-hidden'?'.game-route .milky-band{display:none!important;}':'/* identical original drawing; control style node */')+"});await probeStyle.evaluate(n=>n.dataset.renderProbe="+JSON.stringify(condition)+");\n await tap(page.getByRole('button',{name:'Boss-2-Test öffnen',exact:true}));"],
 ["stage.layerOwners=await layerOwners();",
  "stage.layerOwners=await layerOwners();stage.singleBackgroundProbe=await page.evaluate(()=>{const nodes=[...document.querySelectorAll('.game-route .milky-band')];return nodes.map(n=>{const s=getComputedStyle(n),r=n.getBoundingClientRect();return {display:s.display,filter:s.filter,opacity:s.opacity,width:r.width,height:r.height};});});if(stage.after.mounted){assert.equal(stage.singleBackgroundProbe.length,1);assert.equal(stage.singleBackgroundProbe[0].display,"+JSON.stringify(condition==='milky-hidden'?'none':'block')+");assert.equal(stage.singleBackgroundProbe[0].filter,'blur(11px)');}"]
 ];
 let generated=source;
 for(const [before,after] of patches){assert.equal(generated.split(before).length-1,1,'Only exact unique collector extensions are permitted');generated=generated.replace(before,after);}
 let recovered=generated;
 for(const [before,after] of [...patches].reverse()){assert.equal(recovered.split(after).length-1,1);recovered=recovered.replace(after,before);}
 assert.equal(recovered,source,'Every original collection and acceptance condition is retained byte for byte');
 return generated;
}
if(process.argv[1]===fileURLToPath(import.meta.url)){
 assert.deepEqual(process.argv.slice(2),['--check']);
 for(const condition of conditions){const code=makeDriver(condition);execFileSync(process.execPath,['--check','--input-type=module'],{input:code,stdio:['pipe','pipe','pipe']});}
 console.log(JSON.stringify({conditions,completeCollectorRecovered:true,generatedModuleSyntax:true,originalSha256}));
}
