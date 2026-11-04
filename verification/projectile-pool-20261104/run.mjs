import assert from 'node:assert/strict';
import { readFileSync,writeFileSync,mkdirSync,unlinkSync,copyFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawn,execFileSync } from 'node:child_process';
import { gzipSync } from 'node:zlib';
import { createEvidenceWriter } from '../ios-safari-native-20261103/evidenceOutput.mjs';
import { digest } from './transform.mjs';
const root=resolve(new URL('../..',import.meta.url).pathname);
const [kind,engine,condition,replicaText]=process.argv.slice(2),replica=Number(replicaText);
assert.ok(['short','memory'].includes(kind));assert.ok(['control','pool'].includes(condition));
assert.ok(['chromium','webkit'].includes(engine));assert.ok([1,2].includes(replica));
if(kind==='memory')assert.equal(engine,'chromium');
const output=root+`/verification/projectile-pool-20261104/results/${engine}-${condition}-r${replica}-${kind}`;
mkdirSync(output,{recursive:true});
const infoPath=root+'/verification/boss2-forensics-20261028/results/device-preview/site/device-preview-info.json';
const info=JSON.parse(readFileSync(infoPath,'utf8'));
assert.equal(info.projectilePoolCandidate.condition,condition);
assert.equal(info.playerMuzzleLocalCandidate.condition,'control');
copyFileSync(infoPath,output+'/build-info.json');
const path=root+(kind==='short'?'/verification/systematic-stability-20261101/verifyBrowserSoak.mjs':'/verification/memory-retention-attribution-20261101/profileLifetime.mjs');
const original=readFileSync(path,'utf8'),edits=[];let code=original;
function change(before,after){assert.equal(code.split(before).length,2,before);code=code.replace(before,after);edits.push([before,after]);}
change(kind==='short'?'const output = clockProbe ?':'const output = localStyles',kind==='short'?'const legacyOutput = clockProbe ?':'const legacyOutput = localStyles');
change('mkdirSync(output, { recursive: true });',`const output=${JSON.stringify(output)};\nmkdirSync(output, { recursive: true });`);
change('assert.equal(info.sourceCommit, result.sourceCommit);',`assert.equal(info.projectilePoolCandidate.condition,${JSON.stringify(condition)});
  result.projectilePoolComparison=info.projectilePoolCandidate;
  result.projectilePoolReplica=${replica};
  assert.equal(info.sourceCommit, result.sourceCommit);`);
let prefix='';
if(kind==='short') {
  prefix="import { installReuseProbe } from '../projectile-pool-20261104/reuseProbe.mjs';\n";
  change('comparedConditionsAreVisuallyDifferent: true,','comparedConditionsAreVisuallyDifferent: false,');
  change('page = await context.newPage(); page.setDefaultTimeout(25000);','page = await context.newPage(); page.setDefaultTimeout(25000);\n  await page.addInitScript(installReuseProbe);');
  change('row.pauseFreezeVerified = true;',`row.pauseFreezeVerified = true;
    row.projectileReuseProof=await page.evaluate(()=>window.__projectileReuseProof());
    assert.ok(row.projectileReuseProof.added>0);
    ${condition==='pool'?'assert.ok(row.projectileReuseProof.reused>0, "The actual compiled game must reuse native shot nodes");':'assert.equal(row.projectileReuseProof.reused,0,"The actual control keeps original node lifetimes");'}`);
}
let restored=code;for(const [before,after]of[...edits].reverse())restored=restored.replace(after,before);
assert.equal(restored,original,'Original flow, timing and inactive-profiler gates retained exactly');
code=prefix+code;
const temporary=path.replace(/\.mjs$/,`.projectile-${condition}-${process.pid}.mjs`);
const env=Object.fromEntries(Object.entries(process.env).filter(([key])=>!key.startsWith('CRYPTOID_')));
Object.assign(env,kind==='short'?{CRYPTOID_SOAK_ENGINE:engine,CRYPTOID_SOAK_CONDITION:'original',CRYPTOID_SOAK_SECONDS:'60',CRYPTOID_SOAK_RUN:'smoke'}:
 {CRYPTOID_SOAK_CONDITION:'original',CRYPTOID_LIFETIME_ATTRIBUTION:'1',CRYPTOID_ATTRIBUTION_SECONDS:'1200',
  CRYPTOID_LOCAL_STYLE_SCOPE:'leaves',CRYPTOID_LOCAL_STYLE_REPLICA:String(replica),CRYPTOID_LOCAL_STYLE_FIDELITY:'0',CRYPTOID_INACTIVE_NATIVE_TRACE:'1'});
let exit;
try{
 writeFileSync(temporary,code);
 const child=spawn(process.execPath,[temporary],{cwd:root,env,stdio:'inherit'});
 exit=await new Promise(done=>{child.once('error',error=>done({code:null,error:error.message}));child.once('exit',(code,signal)=>done({code,signal}));});
}finally{unlinkSync(temporary);}
const resultName=kind==='short'?'verification.json':'attribution.json';
const capture=JSON.parse(readFileSync(output+'/'+resultName,'utf8'));
const receipt={version:1,kind,engine,condition,replica,childExit:exit,complete:exit?.code===0&&capture.complete===true,
 sourceCollectorSha256:digest(original),adaptedCollectorSha256:digest(code),originalCollectorRestoredExactly:true,
 sourceGameFilesEdited:false,activeNativeWrappersAdded:false,shortReuseObserver:kind==='short',
 extraGameTimers:false,physicalDevice:false,whiteScreenFixed:false};
writeFileSync(output+'/receipt.json',JSON.stringify(receipt,null,2)+'\n');
execFileSync(process.execPath,['verification/direct-boss-style-device-20261102/verifyScope.mjs'],{cwd:root,stdio:'inherit'});
const files=[];
for(const name of ['receipt.json','build-info.json',resultName,...(kind==='memory'?['native-memory-infra.json.gz']:[])]){
 try{const bytes=readFileSync(output+'/'+name);files.push({name,bytes:bytes.length,sha256:digest(bytes),gzipBase64:gzipSync(bytes).toString('base64')});}
 catch(error){if(receipt.complete)throw error;}
}
await createEvidenceWriter()('PROJECTILE_POOL_CAPTURE',{kind,engine,condition,replica,complete:receipt.complete,files,
 syntheticGuestDataOnly:true,physicalDevice:false,whiteScreenFixed:false});
assert.equal(receipt.complete,true,'Failures stay failures, no automatic Resume or retry');
