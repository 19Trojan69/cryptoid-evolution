// Actual UI and backend handlers; Pi, database, input clock and hits are isolated fixtures.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {restoreWeaponMenuGameChanges} from '../../frontend/scripts/weaponMenuReviewedChanges.mjs';
const control=false,withoutPauseCss=false;
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
const root=resolve(new URL('../..',import.meta.url).pathname),require=createRequire(root+'/frontend/package.json');
const {createServer}=require('vite'),{chromium}=require(process.env.CRYPTOID_PLAYWRIGHT_MODULE);
const br=createRequire(root+'/backend/src/handlers/ownerTestnetCatalog.test.mjs');
const raw=readFileSync(root+'/backend/src/handlers/ownerTestnetCatalog.test.mjs','utf8');
const harness=new Function('require',raw.slice(raw.indexOf('const get ='),raw.indexOf('function owner('))+'\nreturn harness;')(br);
process.env.NODE_ENV='test';process.env.ADMIN_PI_TESTNET_UID='pilot-a';harness();
const platform=br('../../build/services/platformAPIClient.js'),quotes=br('../../build/purchaseQuote.js'),receipts=br('../../build/paymentReceipt.js');
quotes.capturePurchaseQuote=async()=>({availability:'test_payment'});receipts.readPaymentReceipt=async()=>({});
let active;
platform.platformAPIClientForRequest=()=>({get:async url=>({data:structuredClone(active.payments.get(url.split('/').at(-1)))}),post:async url=>{const parts=url.split('/'),p=active.payments.get(parts.at(-2));p.status[parts.at(-1)==='approve'?'developer_approved':'developer_completed']=true;}});
const output=root+'/verification/modest-ship-balance-reload-feedback-20261027/results/pinned-public';mkdirSync(output,{recursive:true});
const hash=()=>createHash('sha256').update(readFileSync(root+'/frontend/src/pages/GamePage.tsx')).digest('hex');
const result={baseline:'0868671b213fb25ba9ce1a0a8d1057dc2067d1f2',control,sourceSha256:hash(),realUiAndHandlers:true,localOnly:true,syntheticPiAndDatabase:true,physicalDevice:false,checks:[],errors:[],requests:[],cases:[],complete:false};
const check=(name,value)=>{assert.ok(value,name);result.checks.push(name);console.log(name);};
const hooks=`(window as any).__shipSelectionQA={inspect:()=>({stage:shipStageRef.current,skin:shipSelectionRef.current.skin.id,color:shipSelectionRef.current.color.id,state:structuredClone(stateRef.current),account:accountRun,technical:technicalPause,formation:formationStartedRef.current,sectionElapsed:sectionElapsedRef.current,auto:structuredClone(autoReloadRef.current),stock:structuredClone(stockRef.current),pending:activationRef.current,confirmed:null}),protect:()=>{impactCooldownRef.current=1000000;},spendGuard:()=>{stateRef.current.projectileGuard=1;},expire:()=>{stateRef.current.weaponTimers[5]=16;stateRef.current.paidWeaponMs=16;stateRef.current.powerUps=[];},hit:()=>{const s=stateRef.current,{width,height}=fieldSizeRef.current;impactCooldownRef.current=0;s.shieldCharges=0;s.shieldMs=0;s.purchasedShieldMs=0;s.shieldActive=false;s.overdriveMs=0;s.empMs=0;s.enemyShots=[{id:nextIdRef.current++,x:s.player.x*width,y:s.player.y*height,vx:0,vy:0,radius:5}];},sampleVolley:()=>makeShipVolley(shipSelectionRef.current.skin.id,shipStageRef.current,stateRef.current.weaponLevel,100,200,false,()=>0)};\n`;
const server=await createServer({root:root+'/frontend',cacheDir:output+'/vite-native',logLevel:'error',server:{host:'127.0.0.1',port:0,hmr:false,fs:{allow:[root]}},plugins:[{name:'local-ship-selection',enforce:'pre',transform(code,id){if(id.endsWith('/pages/shipAttributes.ts'))return execFileSync('git',['show','0868671:frontend/src/pages/shipAttributes.ts'],{cwd:root,encoding:'utf8'});if(id.endsWith('/gameViewport.css')&&(control||withoutPauseCss))return execFileSync('git',['show','363d9fd:frontend/src/gameViewport.css'],{cwd:root,encoding:'utf8'});if(id.endsWith('/MissionWeaponShop.tsx')&&control)return code.replace(' data-game-scroll','');if(id.endsWith('/GamePage.tsx'))return execFileSync('git',['show','0868671:frontend/src/pages/GamePage.tsx'],{cwd:root,encoding:'utf8'}).replace('  const levelLabel =',hooks+'  const levelLabel =');},transformIndexHtml:{order:'post',handler:html=>html.replace(/appNetwork:\s*"[^"]*"/,'appNetwork: "testnet"').replace(/backendURL:\s*"[^"]*"/,'backendURL: "/api"')}}]});
let browser,currentPage;
try {
 await server.listen();const origin='http://127.0.0.1:'+server.httpServer.address().port;browser=await chromium.launch({headless:true});result.engine=browser.version();
 async function setup({guest=false,width=393,height=744,legacy=false,auto=true,stage=1,hand='right'}={}) {
  const h=harness();h.payments=new Map();active=h;await h.call('progress','/me',null,{method:'GET'});
  Object.assign(h.profile(),{version:1,balance:5000,legacyImported:true,cardReveals:['grey-scout-1']});
  if(legacy){delete h.profile().shipStage;for(const stage of [2,3])h.orders.push({user:'pilot-a',paid:true,owner_testnet_catalog:true,product_id:'ship_02_stage_'+stage,payment_network:'Pi Testnet'});}
  if(stage>1){h.profile().shipStage=stage;for(const n of [2,3].filter(n=>n<=stage))h.orders.push({user:'pilot-a',paid:true,owner_testnet_catalog:true,product_id:'ship_02_stage_'+n,payment_network:'Pi Testnet'});}
  if(guest)h.session.currentUser=null;
  for(const name of ['twin','rapid_twin','triple','plasma'])h.orders.push({user:'pilot-a',paid:true,owner_testnet_catalog:true,product_id:'weapon_'+name,pi_payment_id:'isolated-seed-'+name,payment_network:'Pi Testnet',weapon_model:2,quantity:20});
  let held=false,release;const gate={armed:false,pending:false,release:()=>{release?.();},hold:()=>{gate.armed=true;}};
  const context=await browser.newContext({viewport:{width,height},isMobile:true,hasTouch:true,locale:'de-AT',reducedMotion:'reduce'});
  await context.addInitScript(({guest,auto,hand})=>{localStorage.setItem('cryptoid_control_hand',hand);localStorage.setItem('cryptoid_home_music','off');localStorage.setItem('cryptoid_language','de');localStorage.setItem('cryptoid_auto_reload:testnet:pilot-a',JSON.stringify({5:auto}));if(!guest)sessionStorage.setItem('cryptoid_pi_access_token','isolated-valid-token');else{localStorage.setItem('cryptoid_shard_balance_testnet','1000');localStorage.setItem('cryptoid_ship_fleet_v2_testnet',JSON.stringify({'grey-scout':{grey:1}}));}window.Pi={init(){},getPiHostAppInfo:async()=>({hostApp:'web'}),authenticate:async()=>({accessToken:'isolated-valid-token',user:{uid:'pilot-a',username:'Local owner'}}),createPayment:async(data,callbacks)=>{const{id}=await window.localCreatePayment(data);await callbacks.onReadyForServerApproval(id);await callbacks.onReadyForServerCompletion(id,'isolated-tx-'+id);}};},{guest,auto,hand});
  await context.exposeBinding('localCreatePayment',(_source,data)=>{const id='isolated-ship-payment-'+(h.payments.size+1);h.payments.set(id,{identifier:id,user_uid:'pilot-a',direction:'user_to_app',network:'Pi Testnet',amount:data.amount,metadata:data.metadata,status:{transaction_verified:true,developer_approved:false,developer_completed:false},transaction:{txid:'isolated-tx-'+id,verified:true}});return{id};});
  const requests=[];await context.route('**/*',async route=>{const u=new URL(route.request().url());if(u.origin!==origin)return route.fulfill({status:200,body:'',contentType:'text/css'});if(!u.pathname.startsWith('/api/'))return route.continue();const[group,...parts]=u.pathname.slice(5).split('/');let response;const body=route.request().postDataJSON();if(group==='user')response=guest?{code:401,body:{error:'not_authenticated'}}:{code:200,body:{user:{uid:'pilot-a',username:'Local owner'},canAdmin:true,adminMode:false}};else if(group==='usage')response={code:204};else if(['progress','hangar','rewards','leaderboard','payments'].includes(group))response=await h.call(group,'/'+parts.join('/'),body,{method:route.request().method()});else response={code:200,body:{}};if(group==='hangar'&&parts.join('/')==='start'&&response.code===200){h.session.scoreRun.startedAt-=3600000;h.profile().lastStart.runMeta.startedAt=h.session.scoreRun.startedAt;}requests.push({path:u.pathname,status:response.code,stage:body?.shipStage,error:response.body?.error});if(group==='hangar'&&parts.join('/')==='weapon/activate'&&gate.armed){gate.armed=false;gate.pending=true;await new Promise(resolve=>{release=resolve;});gate.pending=false;}return route.fulfill({status:response.code,contentType:'application/json',body:response.code===204?'':JSON.stringify(response.body)});});
  const page=await context.newPage();currentPage=page;result.currentRequests=requests;page.on('pageerror',e=>result.errors.push(e.message));page.on('console',m=>{if(m.type()==='error')console.log('Browser error:',m.text());});
  const inspect=()=>page.evaluate(()=>window.__shipSelectionQA.inspect());
  const drive=async predicate=>{for(let i=0;i<350;i++){if(await page.evaluate(predicate))return;await page.clock.runFor(100);await page.waitForTimeout(8);}result.deadline=await page.evaluate(()=>({qa:window.__shipSelectionQA?.inspect(),visibility:document.visibilityState,text:document.body.innerText.slice(-1400)}));throw Error('Native state deadline');};
  const openShop=async()=>{await page.locator('.cinematic-shop').click();await page.locator('#fleet-grey-scout').waitFor();};
  const closeShop=()=>page.getByRole('button',{name:'Shop schließen',exact:true}).click();
  const dismissCard=async()=>{try{await page.locator('.card-reveal-dialog').waitFor({timeout:10000});}catch(error){result.debug=(await page.locator('body').innerText()).slice(-6000);throw error;}await page.locator('.card-reveal-dialog .collection-footer button').last().click();};
  await page.goto(origin);return{h,context,page,requests,inspect,drive,openShop,closeShop,dismissCard,gate};
 }
 async function start(f){await f.page.locator('.cinematic-launch-actions').waitFor();await f.page.clock.install();await f.page.clock.pauseAt(await f.page.evaluate(()=>Date.now()+100));await f.page.locator('.cinematic-play').click();await f.drive(()=>window.__shipSelectionQA?.inspect().state.status==='playing');await f.page.evaluate(()=>window.__shipSelectionQA.protect());}
 async function menu(f){await f.page.locator('.mission-shop-access').click();await f.page.locator('.mission-weapon-shop[aria-busy="false"]').waitFor();}
 async function resume(f){await f.page.locator('.mission-return').click();await f.drive(()=>window.__shipSelectionQA.inspect().state.status==='playing');}
 async function swipe(f) {
  const point=await f.page.locator('.mission-shop-scroll').evaluate(n=>{
   const b=n.getBoundingClientRect();
   for(const selector of ['h3','.testnet-shop-notice','.mission-stock','.mission-duration','.weapon-fire-preview']){
    for(const target of n.querySelectorAll(selector)){
     const r=target.getBoundingClientRect(),top=Math.max(r.top,b.top+5),bottom=Math.min(r.bottom,b.bottom-5);
     if(bottom-top<24)continue;
     const y=(top+bottom)/2;if(y-b.top<35)continue;
     return{x:r.x+r.width*.45,y,to:b.top+5,target:target.tagName,selector};
    }
   }
   throw Error('No visible non-interactive offer text');
  });
  const cdp=await f.context.newCDPSession(f.page),{x,y,to}=point;
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});
  for(let i=1;i<=14;i++){
   await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y:y+(to-y)*i/14}]});
   await f.page.clock.runFor(20);await f.page.waitForTimeout(18);
  }
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  await f.page.clock.runFor(200);await f.page.waitForTimeout(200);await cdp.detach();
  const metrics=await f.page.locator('.mission-shop-scroll').evaluate(n=>({scroll:n.scrollTop,height:n.clientHeight,total:n.scrollHeight,bodyY:scrollY}));
  result.swipes??=[];result.swipes.push({...point,...metrics});return metrics.scroll;
 }

 const e=await setup({auto:false,stage:3});await start(e);
 check('pinned public Elite base volley really totals four Standard damage units',Math.abs((await e.page.evaluate(()=>window.__shipSelectionQA.sampleVolley())).reduce((sum,shot)=>sum+shot.damage,0)-4)<1e-9);
 for(let hit=0;hit<3;hit++){await e.page.evaluate(()=>window.__shipSelectionQA.hit());await e.page.clock.runFor(32);}
 let state=await e.inspect();check('pinned public Elite renews two free hits after losing a heart',state.state.hearts===2&&state.state.projectileGuard===2);await e.context.close();
 const f=await setup();await start(f);await f.drive(()=>window.__shipSelectionQA.inspect().state.weaponSource==='paid');await f.drive(()=>window.__shipSelectionQA.inspect().formation);
 f.gate.hold();await f.page.evaluate(()=>window.__shipSelectionQA.expire());await f.drive(()=>window.__shipSelectionQA.inspect().pending?.level===5);for(let i=0;i<100&&!f.gate.pending;i++)await f.page.waitForTimeout(10);f.gate.release();await f.drive(()=>!window.__shipSelectionQA.inspect().pending&&window.__shipSelectionQA.inspect().state.weaponSource==='paid');
 check('pinned public reload has no immediate status during active flight after actual positive confirmation',await f.page.locator('.weapon-reload-status,.weapon-reload-confirmation').count()===0&&await f.page.locator('.formation-data-stream').count()===0);
 check('pinned public counterexample has no unexpected page or API error',result.errors.length===0&&f.requests.every(r=>r.status<400));result.renderedControllerSha256='83fad3d2d4e20d1f5c6b6777c5dc0f5fcfea3215eeda386014d6b1fed32f1c1e';await f.context.close();result.complete=true;
}catch(error){result.failure={message:error.message,stack:error.stack};if(currentPage)await currentPage.screenshot({path:output+'/failure.png'}).catch(()=>{});throw error;}
finally{await browser?.close();await server.close();writeFileSync(output+'/native.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({complete:result.complete,control,checks:result.checks.length,failure:result.failure?.message}));}
