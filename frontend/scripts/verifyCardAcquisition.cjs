const {chromium}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright');
const path=require('node:path'),fs=require('node:fs'),assert=require('node:assert/strict');
const {createRequire}=require('node:module');
const req=createRequire(path.resolve('backend/src/handlers/progress.test.mjs'));
const source=fs.readFileSync('backend/src/handlers/progress.test.mjs','utf8').split('const get =')[1].split('const snapshot =')[0];
const harness=new Function('require','const get ='+source+'\nreturn harness;')(req);
process.env.VITE_BACKEND_URL='/api';
(async()=>{
 const {createServer}=await import(path.resolve('frontend/node_modules/vite/dist/node/index.js'));
 const server=await createServer({root:path.resolve('frontend'),cacheDir:path.resolve('frontend/node_modules/.vite-card-acquisition'),server:{host:'127.0.0.1',port:0},logLevel:'error'});await server.listen();
 const origin='http://testnet.localhost:'+server.httpServer.address().port;
 const b=await chromium.launch({executablePath:path.resolve('../chromium'),headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu','--host-resolver-rules=MAP testnet.localhost 127.0.0.1']});
 const results=[];
 const openShop=async p=>{await p.getByRole('button',{name:'Schnellzugriff',exact:true}).click();await p.getByRole('button',{name:'Shop & Hangar'}).click();await p.getByRole('button',{name:'Schiff-Shop'}).click();};
 try {
 for(const width of [390])for(const account of [false,true]){
  const h=harness();await h.call('progress','/me',null,{method:'GET'});h.profile().balance=1000;
  let failure='',calls=0;const errors=[];
  const c=await b.newContext({viewport:{width,height:900}});const p=await c.newPage();p.on('pageerror',e=>errors.push(e.message));
  await p.addInitScript(({account})=>{window.Pi={init:()=>{}};localStorage.setItem('cryptoid_language','de');localStorage.setItem('cryptoid_shard_balance_testnet','1000');if(account)localStorage.setItem('cryptoid_pi_session','1');},{account});
  await p.route('**/*',async route=>{
   const u=new URL(route.request().url());if(u.origin!==origin){if(route.request().resourceType()==='xhr')console.log('external API',u.origin,u.pathname);return route.abort();}if(!u.pathname.startsWith('/api/'))return route.continue();
   let data={},status=200;
   if(u.pathname==='/api/user/me')data={user:account?{uid:'pilot-a',username:'QA'}:null,canAdmin:false,adminMode:false};
   else if(u.pathname==='/api/progress/card-reveals'){const result=await h.call('progress','/card-reveals',route.request().postDataJSON());data=result.body;status=result.code;}
   else if(u.pathname==='/api/hangar/start'){const result=await h.call('hangar','/start',route.request().postDataJSON());data=result.body;status=result.code;}
   else if(u.pathname==='/api/progress/me')data=(await h.call('progress','/me',null,{method:'GET'})).body;
   else if(u.pathname==='/api/progress/inventory'){
    calls++;if(failure==='reject')return route.fulfill({status:403,json:{error:'not_enough_shards'}});
    const result=await h.call('progress','/inventory',route.request().postDataJSON());data=result.body;status=result.code;
    if(failure==='lost-ack'){failure='';return route.abort();}
   }else if(u.pathname==='/api/rewards/me')data={progress:{bossWins:{},linkedBlocks:{}},network:'testnet'};
   else if(u.pathname==='/api/hangar/catalog')data={offers:req('../../build/hangarCatalog.js').hangarCatalog};
   else if(u.pathname==='/api/hangar/inventory')data={ownedWeapons:[],ownedArmor:[],ownedShipUpgrades:[],consumables:[]};
   return route.fulfill({status,json:data});
  });
  await p.goto(origin);await p.getByRole('button',{name:'✧ Sammelkarten'}).waitFor({state:'visible'});await p.waitForTimeout(200);await openShop(p);
  await p.locator('.ship-search-result').filter({hasText:'Solar Lance'}).click();
  await p.getByRole('button',{name:/Gold ·/}).click();
  const buy=p.locator('.ship-shard-button');assert.equal(await buy.isEnabled(),true);
  await buy.scrollIntoViewIfNeeded();await p.screenshot({path:`../green-${width}.png`});const style=await buy.evaluate(e=>({color:getComputedStyle(e).color,bg:getComputedStyle(e).backgroundImage}));assert.match(style.bg,/133, 243, 183/);
  await buy.click();
  await p.waitForSelector('.card-reveal-dialog');
  await p.waitForTimeout(150);
  if(account)assert.ok(h.profile().cardReveals.includes('solar-lance-1'),'Purchase presentation saved to account before Continue');
  else assert.ok(JSON.parse(await p.evaluate(()=>localStorage.getItem('cryptoid_card_reveals_v1_testnet_guest'))).includes('solar-lance-1'));
  await p.reload();await p.getByRole('button',{name:'✧ Sammelkarten'}).waitFor({state:'visible'});
  assert.equal(await p.locator('.card-reveal-dialog').count(),0,'Reload never replays acquired card');
  // A second owned color/duplicate is not a new ship type.
  await p.waitForTimeout(200);await openShop(p);
  await p.locator('.ship-search-result').filter({hasText:'Solar Lance'}).click();
  await p.getByRole('button',{name:/Gold ·/}).click();
  await p.locator('.ship-shard-button').click();await p.waitForTimeout(300);
  assert.equal(await p.locator('.card-reveal-dialog').count(),0,'Repeat purchase does not replay card');
  assert.deepEqual(errors,[]);results.push({account,newPurchaseOnce:true,persistedBeforeContinue:true,repeatPurchaseSilent:true});
  await c.close();
 }
 console.log(JSON.stringify(results,null,2));
 }finally{await b.close();await server.close();}
})().catch(e=>{console.error(e);process.exit(1)});
