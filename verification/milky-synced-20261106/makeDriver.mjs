import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {makeDriver as originalDriver} from '../milky-band-attribution-20261105/makeDriver.mjs';
export const orders=Object.freeze({'control-first':['control','milky-hidden'],'hidden-first':['milky-hidden','control']});
const oldGeneratorSha256='8c6807bd5dd8efa2ddcf0182251983bc50bcbbb49d55377959bf985689fab062';
const extra=String.raw`import {phasePoint,validateWindow,windowBounds} from './alignment.mjs';
async function waitForMatchedWindow(){
 const started=Date.now(),rows=[];let first;
 while(true){
  assert.ok(!fatal,fatal);const snap=await observe();running(snap);const row=phasePoint(snap,result.sourceCommit);first??=row;
  assert.equal(row.clockId,first.clockId);assert.equal(row.timeOrigin,first.timeOrigin);
  assert.ok(row.elapsedMs<=windowBounds.start+windowBounds.startGrace,'Warmup cannot enter the measurement window late');
  rows.push({hostAt:Date.now(),...row});assert.ok(rows.length<=92);
  if(row.elapsedMs>=windowBounds.start){result.alignmentWarmup={bounds:windowBounds,rows,readOnly:true};save();return;}
  assert.ok(Date.now()-started<90000,'Bounded warmup must reach the original active clock target');
  await new Promise(resolve=>setTimeout(resolve,1000));
 }
}
`;
export function makeDriver(condition,order){
 assert.ok(Object.hasOwn(orders,order));assert.ok(orders[order].includes(condition));
 const old=readFileSync(new URL('../milky-band-attribution-20261105/makeDriver.mjs',import.meta.url),'utf8');
 assert.equal(createHash('sha256').update(old).digest('hex'),oldGeneratorSha256);
 const original=originalDriver(condition);
 const patches=[
 ["const output=root+'/verification/milky-band-attribution-20261105/results/"+condition+"';","const output=root+'/verification/milky-synced-20261106/results/"+order+"/"+condition+"';"],
 ["kind:'internal-single-background-suppression',","kind:'internal-active-window-background-comparison',pairOrder:"+JSON.stringify(order)+","],
 ["extraPeriodicGameInspector:false,","extraPeriodicGameInspector:true,readOnlyHostWarmupPolling:true,readOnlyActivePointPolling:true,"],
 ["async function capture(label,seconds){",extra+"\nasync function capture(label,seconds){"],
 ["stage.points.push({hostAt:Date.now(),memory});","const point={hostAt:Date.now(),memory};if(label==='playing-original-boss'){point.observationStartedAt=Date.now();point.phasePoint=phasePoint(await observe(),result.sourceCommit);point.observationFinishedAt=Date.now();}stage.points.push(point);"],
 ["const active=await capture('playing-original-boss',15);","await waitForMatchedWindow();const active=await capture('playing-original-boss',30);result.activeWindow=validateWindow(active,result.sourceCommit);save();"]
 ];
 let code=original;
 for(const [before,after] of patches){assert.equal(code.split(before).length-1,1,'Unique pinned collector extension');code=code.replace(before,after);}
 let restored=code;
 for(const [before,after] of [...patches].reverse()){assert.equal(restored.split(after).length-1,1);restored=restored.replace(after,before);}
 assert.equal(restored,original,'All original collector and flow gates are retained exactly');
 return code;
}
if(process.argv[1]===fileURLToPath(import.meta.url)){
 assert.deepEqual(process.argv.slice(2),['--check']);
 for(const [order,conditions] of Object.entries(orders))for(const condition of conditions){
  const code=makeDriver(condition,order);execFileSync(process.execPath,['--check','--input-type=module'],{input:code,stdio:['pipe','pipe','pipe']});
 }
 console.log(JSON.stringify({generatedVariants:4,completeOriginalGatesRecovered:true,moduleSyntax:true,oldGeneratorSha256}));
}
