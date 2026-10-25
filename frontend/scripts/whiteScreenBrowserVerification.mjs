import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import {createRequire} from 'node:module';
import {build} from 'esbuild';
import {actualBackend} from './weaponReloadRecoveryHost.mjs';
// Optional local-browser verification, separate from the portable build gate.
// Set CRYPTOID_PLAYWRIGHT_MODULE and CRYPTOID_CHROMIUM_EXECUTABLE if needed.
const require=createRequire(import.meta.url),root=new URL('../',import.meta.url).pathname;
const playwright=require(process.env.CRYPTOID_PLAYWRIGHT_MODULE||'playwright');
const directory=path.resolve(root,'../verification/browser');fs.mkdirSync(directory,{recursive:true});
await build({absWorkingDir:root,entryPoints:['scripts/fixtures/white-screen-browser.tsx'],bundle:true,format:'esm',jsx:'automatic',outdir:directory,entryNames:'app',define:{'import.meta.env':'{}'},logLevel:'silent',plugins:[{name:'exact-source-and-public-css',setup(b){b.onResolve({filter:/\/paintedShip$/},()=>({path:root+'src/pages/paintedShip.ts'}));b.onResolve({filter:/^\//},a=>a.kind==='url-token'?{path:a.path,external:true}:undefined);}}]});
const {harness,firstMissionSnapshot}=await actualBackend(),h=harness();await h.call('progress','/me',null,{method:'GET'});
await h.call('hangar','/start',{action:'new',rulesVersion:2,version:h.profile().version,startKey:'browser-fixture-0000001'});
h.profile().mission={sector:10,phase:'bonus',snapshot:firstMissionSnapshot(3),savedAt:new Date().toISOString()};
Object.assign(h.docs[1],{username:'BrowserPlayer',careerScoreByNetwork:{testnet:123},bestScoreV2:{testnet:100},bestRunByNetwork:{testnet:{score:100,level:1}},playerByNetwork:{testnet:{version:0,activeRunId:null,balance:42}}});
const previousOwner=process.env.ADMIN_PI_TESTNET_UID,previousDeletion=process.env.CRYPTOID_TESTNET_ACCOUNT_DELETION;
process.env.ADMIN_PI_TESTNET_UID='browser-owner';process.env.CRYPTOID_TESTNET_ACCOUNT_DELETION='enabled';
const reviews=new Map();h.locals.adminCollection={
 async insertOne(row){reviews.set(row._id,structuredClone(row));},
 async findOne(q){const row=reviews.get(q._id);if(!row)return null;return Object.entries(q).every(([k,v])=>v&&typeof v==='object'&&'$gt'in v?row[k]>v.$gt:row[k]===v)?structuredClone(row):null;},
 async findOneAndUpdate(q,u){const row=await this.findOne(q);if(!row)return null;Object.assign(reviews.get(q._id),u.$set);return row;},
};
let ownerGuard;const adminRoutes={};require('../../backend/build/handlers/admin.js').default({use(fn){ownerGuard=fn;},get(p,fn){adminRoutes['GET '+p]=fn;},post(p,fn){adminRoutes['POST '+p]=fn;}});
const apiCalls=[];
const server=http.createServer(async(req,res)=>{
 try{
  const url=new URL(req.url,'http://localhost');let body={};if(req.method==='POST'){let raw='';for await(const c of req)raw+=c;body=JSON.parse(raw||'{}');}
  if(url.pathname.startsWith('/api/')){
   const endpoint=url.pathname.slice(5);apiCalls.push({method:req.method,endpoint});let answer;
   if(endpoint==='_fixture/run')answer={code:200,body:{runId:h.session.scoreRun.id}};
   else if(endpoint==='_fixture/age'){h.profile().mission.bossIntermission.createdAt-=11000;answer={code:200,body:{ok:true}};}
   else if(endpoint.startsWith('progress/'))answer=await h.call('progress','/'+endpoint.slice(9),body,{method:req.method});
   else if(endpoint.startsWith('admin/')){
    const request={session:{currentUser:{uid:'browser-owner',username:'19Trojan69'}},body,headers:{'x-cryptoid-app-network':'testnet'},get:()=> 'testnet',app:{locals:h.locals}};
    const response={code:200,setHeader(){},status(code){this.code=code;return this;},json(body){this.body=body;return this;}};let allowed=false;await ownerGuard(request,response,()=>{allowed=true;});if(allowed)await adminRoutes[req.method+' /'+endpoint.slice(6)](request,response);answer=response;
   }else answer={code:404,body:{error:'unknown_fixture_route'}};
   res.writeHead(answer.code,{'content-type':'application/json','cache-control':'no-store'});res.end(JSON.stringify(answer.body));return;
  }
  if(url.pathname==='/app.js'||url.pathname==='/app.css'){res.writeHead(200,{'content-type':url.pathname.endsWith('.js')?'text/javascript':'text/css'});res.end(fs.readFileSync(directory+url.pathname));return;}
  res.writeHead(200,{'content-type':'text/html'});res.end('<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/app.css"></head><body><div id="root"></div><script>window.__ENV={appNetwork:"testnet",backendURL:"/api"};</script><script type="module" src="/app.js"></script></body></html>');
 }catch(e){res.writeHead(500,{'content-type':'application/json'});res.end(JSON.stringify({error:String(e)}));}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const origin='http://127.0.0.1:'+server.address().port;
let browser;const evidence={runtime:'Chromium headless',fixturesOnly:true,realPiAuthentication:false,realMongoDB:false,checks:[]};
try{
 browser=await playwright.chromium.launch({headless:true,...process.env.CRYPTOID_CHROMIUM_EXECUTABLE?{executablePath:process.env.CRYPTOID_CHROMIUM_EXECUTABLE}:{},args:['--no-sandbox']});
 const context=await browser.newContext({viewport:{width:430,height:825},locale:'de-AT'}),page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.route('https://**',route=>route.abort());await page.clock.install();await page.goto(origin+'/boss-test');await page.getByTestId('prepared').filter({hasText:'true'}).waitFor();
 await page.clock.runFor(9750);assert.equal(await page.getByRole('button',{name:'Spiel fortsetzen',exact:true}).count(),0);
 await page.screenshot({path:directory+'/boss-statistics.png',fullPage:true});
 await page.clock.runFor(250);await page.getByRole('button',{name:'Spiel fortsetzen',exact:true}).waitFor();
 assert.equal(await page.getByTestId('status').textContent(),'paused');assert.ok(h.profile().mission.bossIntermission);
 await page.request.post(origin+'/api/_fixture/age',{data:{}});await page.getByRole('button',{name:'Spiel fortsetzen',exact:true}).click();await page.getByTestId('status').filter({hasText:'playing'}).waitFor();assert.equal(h.profile().mission.bossIntermission,undefined);
 evidence.checks.push('Actual React boss modal: no Continue before ten seconds, no automatic continuation, explicit click reaches backend and clears saved marker.');
 await page.goto(origin+'/admin-test');await page.getByLabel('Vollständiger Pi-Name').fill('BrowserPlayer');await page.getByRole('button',{name:'Spieler suchen',exact:true}).click();await page.getByRole('button',{name:'Highscores löschen',exact:true}).click();
 const confirm=page.getByRole('button',{name:'Löschung bestätigen',exact:true});await confirm.waitFor();assert.equal(await confirm.isDisabled(),true);
 await page.getByLabel('Pi-Namen zur Bestätigung erneut eingeben').fill('BrowserPlayer');assert.equal(await confirm.isDisabled(),true);await page.getByRole('checkbox').check();await confirm.click();await page.getByText('Die Highscores wurden gelöscht.',{exact:true}).waitFor();assert.equal(h.docs[1].careerScoreByNetwork.testnet,0);assert.equal(h.docs[1].playerByNetwork.testnet.balance,42);
 await page.getByRole('button',{name:'Spieler suchen',exact:true}).click();await page.getByRole('button',{name:'Account vollständig löschen',exact:true}).click();await confirm.waitFor();assert.equal(await confirm.isDisabled(),true);await page.screenshot({path:directory+'/account-review.png',fullPage:true});await page.getByRole('button',{name:'Abbrechen',exact:true}).click();
 evidence.checks.push('Actual Admin UI: exact name and confirmation checkbox required; real handler resets only synthetic scores; account review cancel sends no deletion.');
 await page.goto(origin+'/recorder-test');await page.evaluate(()=>window.cryptoidVerification.startRecording());await page.evaluate(()=>window.cryptoidVerification.finalObservation());
 const cdp=await context.newCDPSession(page),crashed=page.waitForEvent('crash');void cdp.send('Page.crash').catch(()=>{});await crashed;
 const recovery=await context.newPage();recovery.on('pageerror',e=>errors.push(String(e)));await recovery.route('https://**',route=>route.abort());await recovery.goto(origin+'/recover-test');await recovery.waitForFunction(()=>Boolean(window.cryptoidVerification));const report=await recovery.evaluate(()=>window.cryptoidVerification.recover());
 assert.equal(report.integrity.contiguous,true);assert.equal(report.crashEvidence.tail.state,'recording');assert.ok(report.crashEvidence.tail.errors.some(r=>r.data.errorCode==='save_before_activation'));assert.ok(report.crashEvidence.tail.errors.some(r=>r.data.upstreamRequestId==='cdg1::browser-test'));
 assert.equal(report.crashEvidence.observedTailIsNotCommittedHistory,true);evidence.checks.push('Actual renderer crash through CDP Page.crash: new tab recovers native IndexedDB history and the origin-storage fallback of the final response without finish/unload.');
 assert.deepEqual(errors,[]);evidence.pageErrors=errors;evidence.apiCalls=apiCalls;evidence.passed=true;fs.writeFileSync(directory+'/evidence.json',JSON.stringify(evidence,null,2)+'\n');console.log(JSON.stringify({passed:true,checks:evidence.checks.length,pageErrors:errors.length}));
}finally{
 await browser?.close();await new Promise(resolve=>server.close(resolve));if(previousOwner===undefined)delete process.env.ADMIN_PI_TESTNET_UID;else process.env.ADMIN_PI_TESTNET_UID=previousOwner;if(previousDeletion===undefined)delete process.env.CRYPTOID_TESTNET_ACCOUNT_DELETION;else process.env.CRYPTOID_TESTNET_ACCOUNT_DELETION=previousDeletion;
}
