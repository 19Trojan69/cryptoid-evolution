// Local-only Vite instrumentation: no test hooks are included in production.
// Uses the real API handlers with an isolated in-memory account, never live Pi.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createRequire } = require('node:module');
const { chromium } = require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES + '/playwright');
const repo = path.resolve(__dirname, '../..');
const testFile = path.join(repo, 'backend/src/handlers/progress.test.mjs');
const backendRequire = createRequire(testFile);
const harnessSource = fs.readFileSync(testFile, 'utf8').split('const get =')[1].split('const snapshot =')[0];
const makeHarness = new Function('require', 'const get =' + harnessSource + '\nreturn harness;')(backendRequire);
const { emptyPlayerSave, firstMissionSnapshot } = backendRequire('../../build/playerSave.js');
const { emptyRewardProgress } = backendRequire('../../build/rewardRules.js');
const networkScenario = process.env.CRYPTOID_QA_NETWORK || "normal";
assert.ok(["normal","offline","lost-ack"].includes(networkScenario));
const rulesVersion = process.env.CRYPTOID_QA_RULES === "1" ? 1 : 2;
const coreScenario = process.env.CRYPTOID_QA_PHASE === 'core';
const bonusScenario = process.env.CRYPTOID_QA_PHASE === 'bonus';
const results = [], errors = [], screenshots = process.env.CRYPTOID_QA_DIR || '/tmp/cryptoid-expansion-qa';
fs.mkdirSync(screenshots, { recursive: true });
(async () => {
  const { createServer } = await import(path.join(repo, 'frontend/node_modules/vite/dist/node/index.js'));
  const instrumentation = `
    (window as any).__flightTest = {
      inspect: () => ({ state: stateRef.current, refs: Object.fromEntries(COMBAT_REF_KEYS.map(k=>[k,combatRefs[k].current])), rules:rulesVersionRef.current, expectedEntryPattern:entryPatternForSector(stateRef.current.sector) }),
      clearGroup: () => { stateRef.current.asteroids=[]; stateRef.current.shots=[]; formationIndexRef.current=blockFlights(stateRef.current.sector,rulesVersionRef.current)[flightRef.current]; },
      pause: () => { stateRef.current.status="paused";setGame({...stateRef.current}); },
      resume: () => { stateRef.current.status="playing";setGame({...stateRef.current}); },
      save: saveCombat,
      alter: (s:any,r:any={}) => { Object.assign(stateRef.current,s); for(const k in r) (combatRefs as any)[k].current=r[k];setGame({...stateRef.current}); },
      restore: restoreCombat,
    };
  `;
  const server = await createServer({ root: path.join(repo, 'frontend'), cacheDir: path.join(repo, 'frontend/node_modules/.vite-mission-selection'), logLevel: 'error', define: { 'import.meta.env.VITE_BACKEND_URL': JSON.stringify('/api') }, server: { host: '127.0.0.1', port: 0, hmr: false }, plugins: [{ name: 'local-flight-qa', enforce: 'pre', transform(code, id) { if (id.endsWith('/GamePage.tsx')) return code.replace('  const levelLabel =', instrumentation + '\n  const levelLabel =').replace('if (data.combat) restoreCombat(data.combat);', 'if (data.combat) { restoreCombat(data.combat); (window as any).__restoredFlight = structuredClone(stateRef.current); (window as any).__restoredRefs = Object.fromEntries(COMBAT_REF_KEYS.map(k=>[k,combatRefs[k].current])); }'); } }] });
  await server.listen();
  const origin = 'http://testnet.localhost:' + server.httpServer.address().port;
  const browser = await chromium.launch({ executablePath: process.env.CRYPTOID_CHROMIUM || '/tmp/cryptoid-chromium', headless: true, args: ['--host-resolver-rules=MAP testnet.localhost 127.0.0.1', '--no-sandbox', '--disable-dev-shm-usage', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  try {

    for (const [width, hand, account] of [[390,'right',true],[320,'left',true],[1280,'right',true],[390,'left',false]]) {
      const h=makeHarness();
      await h.call('progress','/me',null,{method:'GET'});
      Object.assign(h.profile(),{...emptyPlayerSave(),version:1,legacyImported:true,mission:{sector:1,phase:'normal',rulesVersion:2,snapshot:firstMissionSnapshot(3),savedAt:new Date().toISOString()}});
      h.orders.push({user:'pilot-a',paid:true,product_id:'weapon_rapid_twin',pi_payment_id:'qa-rapid',payment_network:'Pi Testnet',weapon_model:2,quantity:3});
      h.orders.push({user:'pilot-a',paid:true,product_id:'weapon_twin',pi_payment_id:'qa-twin',payment_network:'Pi Testnet',weapon_model:2,quantity:2});
      const context=await browser.newContext({viewport:{width,height:width<700?844:900},isMobile:width<700,hasTouch:width<700});
      await context.addInitScript(({account,hand})=>{
        window.__ENV={backendURL:'/api'};window.Pi={init(){},getPiHostAppInfo:async()=>({hostApp:'web'})};
        if(account)localStorage.setItem('cryptoid_pi_session','1');
        localStorage.setItem('cryptoid_language','de');localStorage.setItem('cryptoid_home_music','off');
        localStorage.setItem('cryptoid_control_hand',hand);
        for(const network of ['testnet','mainnet'])localStorage.setItem('cryptoid_card_reveals_v1_'+network+'_pilot-a',JSON.stringify(['grey-scout-1']));
      },{account,hand});
      const failures=[], activations=[];
      await context.route('**/*',async route=>{
        const u=new URL(route.request().url());
        if(u.origin!==origin)return route.fulfill({status:200,body:'',contentType:'application/javascript'});
        if(!u.pathname.startsWith('/api/'))return route.continue();
        const [group,...parts]=u.pathname.slice(5).split('/'), endpoint='/'+parts.join('/');
        let response;
        if(group==='user')response={code:200,body:{user:account?{uid:'pilot-a',username:'QA'}:null,canAdmin:false,adminMode:false}};
        else if(group==='usage')response={code:204};
        else if(['progress','rewards','hangar','leaderboard'].includes(group)){
          response=await h.call(group,endpoint,route.request().postDataJSON(),{method:route.request().method()});
          if(endpoint==='/weapon/activate')activations.push(response);
          if(group==='hangar'&&endpoint==='/start'&&response.code===200){h.session.scoreRun.startedAt-=60000;h.profile().lastStart.runMeta.startedAt=h.session.scoreRun.startedAt;}
        }else response={code:200,body:{}};
        if(response.code>=400)failures.push(response.body);
        return route.fulfill({status:response.code,contentType:'application/json',body:response.code===204?'':JSON.stringify(response.body)});
      });
      const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
      await page.clock.install();await page.goto(origin+'/game');
      if(account)await page.getByRole('button',{name:'Fortsetzen',exact:true}).click();
      await page.waitForFunction(()=>window.__flightTest?.inspect().state.status==='playing');
      await page.clock.runFor(1000);
      const access=page.locator('.mission-shop-access');
      assert.match(await access.innerText(),/Shop & Waffen/);
      const side=await access.boundingBox();assert(hand==='right'?side.x<width/2:side.x>width/2,JSON.stringify({hand,side,width}));
      await access.click();
      await page.waitForFunction(()=>!document.querySelector('.mission-weapon-shop')?.getAttribute('aria-busy')?.includes('true'));
      const state=await page.evaluate(()=>window.__flightTest.inspect().state);
      assert.equal(state.status,'paused');
      const cards=page.locator('.mission-weapon-card');
      const levels=await cards.evaluateAll(es=>es.map(e=>Number(e.dataset.level)));
      assert.deepEqual(levels,account?[3,2,1,5,4]:[1,5,4,3,2]);
      if(account){
        assert.match(await page.locator('[data-level="3"] .mission-stock').innerText(),/3/);
        const select=page.locator('[data-level="3"] .mission-select');
        await select.click();
        await page.waitForFunction(()=>window.__flightTest.inspect().state.weaponLevel===3);
        assert.equal(activations.length,1);assert.equal(activations[0].code,200);
        assert.equal(h.docs[0].weaponStockByNetwork.testnet.balances.weapon_rapid_twin,2);
        assert.match(await page.locator('[data-level="3"] .mission-stock').innerText(),/2/);
        await select.click();assert.equal(activations.length,1,'Switching to a running weapon does not consume another charge');
        await page.locator('[data-level="1"] .mission-select').click();
        await page.waitForFunction(()=>window.__flightTest.inspect().state.weaponLevel===1);
        await select.click();await page.waitForFunction(()=>window.__flightTest.inspect().state.weaponLevel===3);
        assert.equal(activations.length,1);
        await page.evaluate(()=>window.__flightTest.alter({pickupWeaponLevel:3,pickupWeaponMs:20000,weaponCap:3}));
        await page.locator('[data-level="3"] .mission-pickup-select').click();
        assert.equal((await page.evaluate(()=>window.__flightTest.inspect().state)).weaponSource,'pickup');
        await select.click();
        assert.equal((await page.evaluate(()=>window.__flightTest.inspect().state)).weaponSource,'pickup','Active pickup stays selected');
      }else{
        assert(await page.locator('[data-level="3"] .mission-select').isDisabled());
        assert(await page.locator('.weapon-buy-button').first().isDisabled());
      }
      assert.equal(await page.locator('[data-level="5"] .weapon-buy-button').count(),0);
      assert.equal(await page.locator('[data-level="4"] .weapon-buy-button').count(),0);
      const back=page.getByRole('button',{name:'Zurück ins Spiel',exact:false});
      const y=(await back.boundingBox()).y;
      await page.locator('.mission-shop-scroll').evaluate(el=>{el.scrollTop=el.scrollHeight});
      assert(Math.abs((await back.boundingBox()).y-y)<1);
      const overflow=await cards.evaluateAll(es=>es.some(e=>e.scrollWidth>e.clientWidth+1));
      assert(!overflow,'No overflowing card');
      assert((await page.locator('.mission-select').first().boundingBox()).height <= 55,'Selection buttons remain compact');
      await page.locator('.mission-shop-scroll').evaluate(el=>{el.scrollTop=0});
      await page.screenshot({path:path.join(screenshots,'weapons-'+width+'-'+account+'.png')});
      await back.click();await page.clock.runFor(3100);
      assert.equal((await page.evaluate(()=>window.__flightTest.inspect().state)).status,'playing');
      await page.locator('.pause-control').click();
      await page.getByRole('button',{name:'Shop & Waffen',exact:true}).click();
      await page.waitForFunction(()=>document.querySelectorAll('.mission-weapon-card').length===5);
      await page.getByRole('button',{name:'Zurück ins Spiel',exact:false}).click();
      await page.clock.runFor(3100);
      assert.equal((await page.evaluate(()=>window.__flightTest.inspect().state)).status,'playing');
      assert.deepEqual(failures,[]);assert.deepEqual(errors,[]);
      results.push({width,hand,account,levels,activations:activations.length,fixedFooter:true});
      await context.close();
    }
    console.log(JSON.stringify(results,null,2));
  }catch(error){for(const ctx of browser.contexts())for(const p of ctx.pages()){await p.screenshot({path:path.join(screenshots,'selection-failure.png')});console.error((await p.locator('body').innerText()).slice(-3000));}throw error;}
  finally{await browser.close();await server.close();}
})().catch(error=>{console.error(error);process.exitCode=1});
