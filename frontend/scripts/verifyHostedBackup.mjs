// Protocol verification only, without a browser or a listening test server.
// Credential arrives on hidden stdin, is sent only to the selected Site, and
// never appears in an artifact, log, environment variable or command argument.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { createHash, randomUUID } from 'node:crypto';
if(process.stdin.isTTY)process.stdin.setRawMode(true);
process.stdout.write('Ready for private Site verification JSON on hidden stdin.\n');
const config=await new Promise((resolve,reject)=>{let input='';process.stdin.setEncoding('utf8');process.stdin.on('data',chunk=>{input+=chunk;if(input.includes('\n')){try{resolve(JSON.parse(input.slice(0,input.indexOf('\n'))));}catch{reject(Error('Invalid verification input'));}} });});
const origin=new URL(config.url).origin;
assert.ok(origin.endsWith('.chatgpt.site'));
const request=(route,init={})=>fetch(origin+route,{...init,headers:{...init.headers,'OAI-Sites-Authorization':'Bearer '+config.token},redirect:'error',signal:AbortSignal.timeout(15000)});
const json=async(route,init)=>{const r=await request(route,init);assert.equal(r.status,200,route+' status');assert.match(r.headers.get('content-type'),/application\/json/);return r.json();};
try {
 const initial=await json('/api/diagnostics');assert.equal(initial.ready,true);
 const runId='server-qa-'+randomUUID();
 const trace={version:2,environment:'developer-only',samples:[{sector:100,flight:0,phase:'SECTOR_CLEAR',encounter:'boss-clear',status:'playing',hearts:3,fps:30,secret:'must-be-removed'}],events:[{atMs:5000,kind:'boss-final-blast',sector:100,message:'must-be-removed'}]};
 const post=revision=>json('/api/diagnostics',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({runId,revision,clientVersion:'server-qa',trace})});
 const ack=await post(3);assert.equal(ack.revision,3);assert.equal(ack.runId,runId);assert.ok(Number.isFinite(ack.savedAt));
 await post(1);
 // Independent requests carry no localStorage/sessionStorage or browser state.
 const recovered=await json('/api/diagnostics?runId='+encodeURIComponent(runId));
 assert.equal(recovered.latest.revision,3);assert.equal(recovered.latest.trace.samples[0].sector,100);assert.equal(recovered.latest.trace.events[0].kind,'boss-final-blast');assert.ok(!JSON.stringify(recovered).includes('must-be-removed'));
 const latest=await json('/api/diagnostics');assert.equal(latest.latest?.runId,initial.latest?.runId,'QA must not replace the user report');
 const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
 for(const [route,file] of [['/','public/index.html'],['/assets/crash-probe.js','public/assets/crash-probe.js']]){
  const response=await request(route);assert.equal(response.status,200);assert.equal(sha(Buffer.from(await response.arrayBuffer())),sha(fs.readFileSync(config.checkout+'/'+file)),'exact deployed '+route);
 }
 const unauthenticated=await fetch(origin+'/api/diagnostics',{redirect:'manual',signal:AbortSignal.timeout(15000)});
 assert.ok([301,302,303,307,308,401,403].includes(unauthenticated.status),'private route must reject unauthenticated access');
 const result={passed:true,protocol:'authenticated HTTPS against deployed private Site; no browser',checkpointAcknowledged:true,independentRequestRestored:true,staleRevisionRejected:true,privateAccessEnforced:true,unauthenticatedStatus:unauthenticated.status,sensitiveFieldsRemoved:true,qaExcludedFromLatest:true,exactRootAndBundle:true,runId,savedAt:ack.savedAt,limits:'Synthetic record; no real device crash or final unsent frame proof.'};
 fs.writeFileSync(config.output,JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
} catch(error) { console.error(error instanceof Error?error.message:'Verification failed');process.exitCode=1; }
process.stdin.destroy();
