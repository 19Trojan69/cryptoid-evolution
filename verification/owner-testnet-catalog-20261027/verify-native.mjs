import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
const root=resolve(new URL('../..',import.meta.url).pathname),require=createRequire(root+'/frontend/package.json');
const {createServer}=require('vite'),{chromium}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright');
const backendRequire=createRequire(root+'/backend/src/handlers/ownerTestnetCatalog.test.mjs');
const testSource=readFileSync(root+'/backend/src/handlers/ownerTestnetCatalog.test.mjs','utf8');
const harness=new Function('require',testSource.slice(testSource.indexOf('const get ='),testSource.indexOf('function owner('))+'\nreturn harness;')(backendRequire);
const platform=backendRequire('../../build/services/platformAPIClient.js'),quotes=backendRequire('../../build/purchaseQuote.js'),receipts=backendRequire('../../build/paymentReceipt.js');
const output=root+'/verification/owner-testnet-catalog-20261027/results';mkdirSync(output,{recursive:true});
const result={localOnly:true,realUiAndHandlers:true,isolatedPiAndDatabase:true,physicalDevice:false,fontPixelsVerified:false,checks:[],errors:[],complete:false};
const check=(name,value)=>{assert.ok(value,name);result.checks.push(name);console.log(name);};
process.env.ADMIN_PI_TESTNET_UID='pilot-a';
quotes.capturePurchaseQuote=async()=>({availability:'test_payment'});receipts.readPaymentReceipt=async()=>({});
let activeHarness;
platform.platformAPIClientForRequest=()=>({
 get:async url=>({data:structuredClone(activeHarness.payments.get(url.split('/').at(-1)))}),
 post:async url=>{const parts=url.split('/');const payment=activeHarness.payments.get(parts.at(-2));if(parts.at(-1)==='approve')payment.status.developer_approved=true;else payment.status.developer_completed=true;},
});
let browser;const servers=[];
async function scenario({owner,network,width}){
 const h=harness();h.payments=new Map();activeHarness=h;
 await h.call('progress','/me',null,{method:'GET'});
 Object.assign(h.profile(),{version:1,balance:5000,legacyImported:true,cardReveals:['grey-scout-1']});
 if(!owner)h.session.currentUser.uid='pilot-b';
 const server=await createServer({root:root+'/frontend',logLevel:'error',server:{host:'127.0.0.1',port:0,hmr:false,fs:{allow:[root]}},plugins:[{name:'isolated-owner-catalog',transformIndexHtml:{order:'post',handler:html=>html.replace(/appNetwork:\s*"[^"]*"/,`appNetwork: "${network==='testnet'?'testnet':''}"`).replace(/backendURL:\s*"[^"]*"/,'backendURL: "/api"')}}]});
 server.middlewares.use((req,res,next)=>{if(!/^\/font-mirror\/[a-f0-9]{64}\.ttf$/.test(req.url||''))return next();res.setHeader('Content-Type','font/ttf');res.end(readFileSync(root+'/verification/white-screen-fonts/'+req.url.split('/').at(-1)));});
 await server.listen();servers.push(server);const origin='http://127.0.0.1:'+server.httpServer.address().port;
 const context=await browser.newContext({viewport:{width,height:825},hasTouch:true,reducedMotion:'reduce'});
 await context.addInitScript(()=>{localStorage.setItem('cryptoid_home_music','off');localStorage.setItem('cryptoid_language','en');localStorage.setItem('cryptoid_pi_session','1');window.Pi={init(){},getPiHostAppInfo:async()=>({hostApp:'PiBrowser'}),authenticate:async()=>({accessToken:'local-owner-token',user:{uid:'pilot-a',username:'Local owner'}}),createPayment:async(data,callbacks)=>{const {id}=await window.localCreatePayment(data);await callbacks.onReadyForServerApproval(id);await callbacks.onReadyForServerCompletion(id,'tx-'+id);}};});
 await context.exposeBinding('localCreatePayment',(_source,data)=>{const id='local-purchase-'+(h.payments.size+1);h.payments.set(id,{identifier:id,user_uid:h.session.currentUser.uid,direction:'user_to_app',network:'Pi Testnet',amount:data.amount,metadata:data.metadata,status:{transaction_verified:true},transaction:{txid:'tx-'+id}});return{id};});
 const requests=[];
 await context.route('**/*',async route=>{
  const url=new URL(route.request().url());
  if(url.hostname==='fonts.googleapis.com')return route.fulfill({contentType:'text/css',body:''});
  if(url.origin!==origin)return route.fulfill({status:200,contentType:'application/javascript',body:''});
  if(!url.pathname.startsWith('/api/'))return route.continue();
  const [group,...parts]=url.pathname.slice(5).split('/'),path='/'+parts.join('/');let response;
  if(group==='user')response={code:200,body:{user:{...h.session.currentUser,username:'Local owner',roles:[]},canAdmin:owner,adminMode:false}};
  else if(group==='usage')response={code:204};
  else if(['progress','hangar','rewards','leaderboard','payments'].includes(group))response=await h.call(group,path,route.request().postDataJSON(),{method:route.request().method(),network});
  else response={code:200,body:{}};
  requests.push({path:url.pathname,method:route.request().method(),status:response.code});
  return route.fulfill({status:response.code,contentType:'application/json',body:response.code===204?'':JSON.stringify(response.body)});
 });
 const page=await context.newPage();page.on('pageerror',e=>result.errors.push(e.message));
 await page.goto(origin);await page.locator('.cinematic-shop').click();await page.locator('.ship-selector-shop').waitFor();
 await page.getByRole('searchbox').fill('Core Carrier');
 const card=page.locator('#fleet-core-carrier'),buy=card.locator('.ship-shard-button');
 if(!owner||network!=='testnet'){
  check(`${network}/${owner?'owner':'player'}: late Standard hull remains locked`,await buy.isDisabled());
  await card.locator('.ship-version-tabs button').nth(1).click();
  check(`${network}/${owner?'owner':'player'}: no upgrade checkout`,await card.locator('.weapon-purchase').count()===0);
  check(`${network}/${owner?'owner':'player'}: no purchase requests`,!requests.some(r=>r.path.startsWith('/api/payments')));
 }else{
  check('owner has no automatically granted last hull',!h.profile().fleet['core-carrier']);
  await card.locator('.ship-version-tabs button').nth(1).click();check('upgrade requires Standard first',await card.locator('.weapon-purchase button').isDisabled());
  await card.locator('.ship-version-tabs button').nth(0).click();await buy.click();
  await page.locator('.card-reveal-dialog').waitFor();await page.locator('.card-reveal-dialog .collection-footer button').last().click();
  check('Standard purchase deducts Shards and equips acquired hull',h.profile().balance===350&&h.profile().skin==='core-carrier');
  await card.locator('.ship-version-tabs button').nth(1).click();
  await card.locator('.weapon-purchase button').click();await page.locator('.card-reveal-dialog').waitFor();await page.locator('.card-reveal-dialog .collection-footer button').last().click();
  check('Advanced becomes owned after actual isolated approval and completion',h.orders.some(o=>o.product_id==='ship_20_stage_2'&&o.paid));
  await card.locator('.ship-version-tabs button').nth(2).click();await card.locator('.weapon-purchase button').click();await page.locator('.card-reveal-dialog').waitFor();await page.locator('.card-reveal-dialog .collection-footer button').last().click();
  check('Elite is separately bought after matching Advanced',h.orders.some(o=>o.product_id==='ship_20_stage_3'&&o.paid));
  await page.screenshot({path:output+'/owner-elite-phone.png'});
  const openFleet = async label => {
    await page.locator('.shop-modal-header .menu-return').click();
    const category=page.locator('[data-category="fleet"] .quick-access-category-trigger');
    if(await category.getAttribute('aria-expanded')!=='true')await category.click();
    await page.locator('#quick-access-fleet button').filter({hasText:label}).click();
  };
  await openFleet('Weapons');
  const plasma=page.locator('.hangar-offer-weapon').filter({has:page.locator('h4',{hasText:'Plasma'})});
  await plasma.locator('input[type="number"]').fill('3');
  await plasma.locator('.weapon-buy-button').click();
  await page.waitForFunction(()=>[...document.querySelectorAll('.hangar-offer-weapon')].some(node=>node.querySelector('h4')?.textContent==='Plasma'&&node.querySelector('.weapon-stock-count strong')?.textContent==='3'));
  check('Plasma checkout buys the selected charge quantity',h.orders.some(o=>o.product_id==='weapon_plasma'&&o.paid&&o.quantity===3&&o.weapon_model===2));
  const armor=page.locator('.hangar-offer-armor');
  check('Titanium requires Reinforced Hull in the real UI',await armor.nth(1).locator('.weapon-purchase button').isDisabled());
  await armor.nth(0).locator('.weapon-purchase button').click();
  await armor.nth(0).getByText('OWNED',{exact:true}).waitFor();
  await armor.nth(1).locator('.weapon-purchase button').click();
  await armor.nth(1).getByText('OWNED',{exact:true}).waitFor();
  check('both armor purchases become owned through the normal checkout',h.orders.filter(o=>o.paid&&o.product_id.startsWith('armor_')).length===2);
  await openFleet('Power-ups');
  const shield=page.locator('.hangar-offer-power').filter({has:page.locator('h4',{hasText:'Start Shield'})});
  await shield.locator('.weapon-purchase button').click();
  await shield.getByRole('button',{name:'Equip for next mission'}).waitFor();
  await shield.getByRole('button',{name:'Equip for next mission'}).click();
  await shield.getByRole('button',{name:'Selected',exact:true}).waitFor();
  check('start power is bought and selected for the next normal mission',h.orders.some(o=>o.paid&&o.product_id==='start_shield')&&h.docs[0].loadout.power==='start_shield');
  await page.screenshot({path:output+'/owner-powers-phone.png'});
  check('only test-network marked orders exist',h.orders.every(o=>o.owner_testnet_catalog&&o.payment_network==='Pi Testnet'));
  check('no failed API boundary in the purchase flow',requests.every(r=>r.status<400));
 }
 await context.close();
}
try{
 browser=await chromium.launch({headless:true,executablePath:process.env.CRYPTOID_CHROMIUM_PATH||'/root/.cache/ms-playwright/chromium_headless_shell-1194/chrome-linux/headless_shell'});
 result.engine=browser.version();
 await scenario({owner:true,network:'testnet',width:430});
 await scenario({owner:false,network:'testnet',width:430});
 await scenario({owner:true,network:'mainnet',width:1363});
 check('no uncaught JavaScript errors',result.errors.length===0);result.complete=true;
}finally{writeFileSync(output+'/native.json',JSON.stringify(result,null,2));await browser?.close();for(const server of servers)await server.close();}
