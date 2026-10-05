/* Isolated browser regression: real inventory handlers, in-memory accounts; no Pi payments. */
const { chromium } = require(process.env.PLAYWRIGHT_MODULE_PATH || 'playwright');
const path = require('node:path'), fs = require('node:fs'), assert = require('node:assert/strict');
const { createRequire } = require('node:module');
const req = createRequire(path.resolve('backend/src/handlers/progress.test.mjs'));
const source = fs.readFileSync('backend/src/handlers/progress.test.mjs', 'utf8').split('const get =')[1].split('const snapshot =')[0];
const harness = new Function('require', 'const get =' + source + '\nreturn harness;')(req);
const out = path.resolve(process.env.AUDIT_OUTPUT || 'audit-output/browser');
fs.mkdirSync(out, { recursive: true });
process.env.VITE_BACKEND_URL = '/api';
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
(async () => {
  const { createServer } = await import(path.resolve('frontend/node_modules/vite/dist/node/index.js'));
  const server = await createServer({ root: path.resolve('frontend'), server: { host: '127.0.0.1', port: 0 }, logLevel: 'error' });
  await server.listen();
  const origin = `http://testnet.localhost:${server.httpServer.address().port}`;
  const browser = await chromium.launch({ ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}), headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--host-resolver-rules=MAP testnet.localhost 127.0.0.1'] });
  const results = [];
  let activePage;
  const openShop = async page => {
    await page.getByRole('button', { name: 'Schnellzugriff', exact: true }).click();
    await page.getByRole('button', { name: 'Shop & Hangar' }).click();
    await page.getByRole('button', { name: 'Schiff-Shop' }).click();
  };
  const chooseShip = async (page, ship, color) => {
    await page.locator('#ship-search').fill(ship);
    await page.locator('.ship-search-result').filter({ hasText: ship }).click();
    if (color) await page.getByRole('button', { name: new RegExp(`^${color} ·`) }).click();
  };
  const footerVisible = async page => {
    const geometry = await page.locator('.collection-dialog[open]').evaluate(element => {
      const footer = element.querySelector('.collection-footer').getBoundingClientRect();
      const content = element.querySelector('.collection-scroll').getBoundingClientRect();
      return { footerTop: footer.top, footerBottom: footer.bottom, contentBottom: content.bottom, height: innerHeight,
        overflowX: element.scrollWidth > element.clientWidth + 1 };
    });
    assert.ok(geometry.footerTop >= 0 && geometry.footerBottom <= geometry.height + 1, JSON.stringify(geometry));
    assert.ok(geometry.contentBottom <= geometry.footerTop + 1, 'Footer overlays content');
    assert.equal(geometry.overflowX, false);
  };
  const closeReveal = async page => {
    await page.locator('.card-reveal-dialog').waitFor();
    await footerVisible(page);
    await page.locator('.card-reveal-dialog .collection-footer button').last().click();
    await page.locator('.card-reveal-dialog').waitFor({ state: 'detached' });
  };
  try {
    for (const [width, height, account] of [[390,844,false],[1440,900,false],[390,844,true],[1440,900,true],[360,740,false],[844,390,false]]) {
      const h = harness(); await h.call('progress','/me',null,{method:'GET'}); h.profile().balance = 3000;
      // Old usage and upgrade records are intentionally not proof of current hull ownership.
      h.profile().usedShipSkins = ['iron-guard','twin-core','core-carrier'];
      let failure = '', inventoryCalls = 0, paidCalls = 0;
      const errors = [];
      const context = await browser.newContext({ viewport: { width, height }, hasTouch: width < 900, locale: 'de-DE' });
      const page = activePage = await context.newPage();
      page.setDefaultTimeout(20000); page.on('pageerror', error => errors.push(error.message));
      await page.addInitScript(({ account }) => {
        window.Pi = { init() {} };
        localStorage.setItem('cryptoid_language','de');
        if (!localStorage.getItem('collection-audit-fixture')) {
          localStorage.setItem('collection-audit-fixture','1');
          localStorage.setItem('cryptoid_shard_balance_testnet','3000');
          if (account) localStorage.setItem('cryptoid_pi_session','1');
        }
      }, { account });
      await page.route('**/*', async route => {
        const request = route.request(), url = new URL(request.url());
        if (url.origin !== origin) return route.abort();
        if (!url.pathname.startsWith('/api/')) return route.continue();
        let data = {}, status = 200;
        if (/payment|order/.test(url.pathname)) { paidCalls++; return route.abort(); }
        if (url.pathname === '/api/user/me') data = { user: account ? { uid:'pilot-a',username:'QA' } : null, canAdmin:false,adminMode:false };
        else if (url.pathname === '/api/progress/me') data = (await h.call('progress','/me',null,{method:'GET'})).body;
        else if (url.pathname === '/api/progress/card-reveals') { const result=await h.call('progress','/card-reveals',request.postDataJSON()); data=result.body;status=result.code; }
        else if (url.pathname === '/api/progress/inventory') {
          inventoryCalls++;
          if (failure === 'reject') { failure=''; return route.fulfill({ status:403,json:{error:'not_enough_shards'} }); }
          const result=await h.call('progress','/inventory',request.postDataJSON()); data=result.body;status=result.code;
          if (failure === 'lost-ack') { failure=''; return route.abort(); }
        } else if (url.pathname === '/api/hangar/catalog') data={offers:req('../../build/hangarCatalog.js').hangarCatalog};
        else if (url.pathname === '/api/hangar/inventory') data={ownedWeapons:[],ownedArmor:[],consumables:[],ownedShipUpgrades:Array.from({length:20},(_,i)=>[2,3].map(s=>`ship_${String(i+1).padStart(2,'0')}_stage_${s}`)).flat()};
        else if (url.pathname === '/api/rewards/me') data={progress:{bossWins:Object.fromEntries(Array.from({length:50},(_,i)=>[String(i+1),1])),linkedBlocks:{}},network:'testnet'};
        return route.fulfill({ status,json:data });
      });
      await page.goto(origin); await page.getByRole('button',{name:'✧ Sammelkarten'}).waitFor();
      await page.screenshot({path:path.join(out,`home-${width}-${account}.png`)});
      assert.equal(await page.locator('vite-error-overlay').count(),0);
      await openShop(page); await chooseShip(page,'Solar Lance','Gold');
      const buy=page.locator('.ship-shard-button');
      assert.equal(await buy.isEnabled(),true);
      await buy.scrollIntoViewIfNeeded();
      const green=await buy.evaluate(e=>({foreground:getComputedStyle(e).color,background:getComputedStyle(e).backgroundImage}));
      assert.match(green.background,/133, 243, 183/);
      await page.screenshot({path:path.join(out,`green-purchase-${width}-${account}.png`)});
      await buy.click(); await page.locator('.card-reveal-dialog').waitFor(); await delay(200);
      const state = async () => account ? { skin:h.profile().skin,color:h.profile().color,balance:h.profile().balance }
        : page.evaluate(()=>({skin:localStorage.getItem('cryptoid_player_ship_skin_testnet'),color:localStorage.getItem('cryptoid_player_ship_color_testnet'),balance:Number(localStorage.getItem('cryptoid_shard_balance_testnet'))}));
      assert.deepEqual(await state(),{skin:'solar-lance',color:'gold',balance:2600});
      if(account)assert.ok(h.profile().cardReveals.includes('solar-lance-1'));
      else assert.ok(JSON.parse(await page.evaluate(()=>localStorage.getItem('cryptoid_card_reveals_v1_testnet_guest'))).includes('solar-lance-1'));
      // Reload before Continue: presentation receipt and selection both survive.
      await page.reload(); await page.getByRole('button',{name:'✧ Sammelkarten'}).waitFor();
      assert.equal(await page.locator('.card-reveal-dialog').count(),0);
      assert.deepEqual(await state(),{skin:'solar-lance',color:'gold',balance:2600});
      await openShop(page);
      assert.match(await page.locator('.ship-one-art-wrap').getAttribute('aria-label'),/Solar Lance · Gold/);
      await chooseShip(page,'Nova Wing','Silber'); await page.locator('.ship-shard-button').click();
      await closeReveal(page); assert.deepEqual(await state(),{skin:'nova-wing',color:'silver',balance:2450});
      await chooseShip(page,'Iron Guard','Gold');
      const before = await state();
      if(account)failure='reject';
      else await page.evaluate(()=>localStorage.setItem('cryptoid_shard_balance_testnet','0'));
      await page.locator('.ship-shard-button').click(); await delay(400);
      assert.equal((await state()).skin,before.skin);assert.equal((await state()).color,before.color);
      assert.equal(await page.locator('.card-reveal-dialog').count(),0);
      if(account){
        await chooseShip(page,'Dark Delta','Bronze'); failure='lost-ack';
        await page.locator('.ship-shard-button').click(); await closeReveal(page);
        assert.deepEqual(await state(),{skin:'dark-delta',color:'bronze',balance:1800});
      }
      await chooseShip(page,'Core Carrier','Gold'); assert.equal(await page.locator('.ship-shard-button').isDisabled(),true);
      const gold=await page.locator('.ship-one-info .mainnet-ready-badge').evaluate(e=>({color:getComputedStyle(e).color,bg:getComputedStyle(e).backgroundColor}));
      assert.equal(gold.color,'rgb(255, 227, 163)');
      await page.reload(); await page.getByRole('button',{name:'✧ Sammelkarten'}).click();
      await page.locator('.collection-grid').waitFor(); await footerVisible(page);
      assert.equal(await page.locator('.collection-tile:not(.is-locked)').count(),account?3:0,'Only first three bosses, regardless of legacy wins');
      if(account){
        await page.locator('.collection-tile').nth(3).click();
        const portrait=page.locator('.collection-locked-detail .boss-portrait');
        await portrait.locator('canvas').waitFor({state:'visible'});
        await page.waitForFunction(()=>document.querySelector('.collection-locked-detail .boss-portrait')?.dataset.ready==='true');
        const pixels=await portrait.locator('canvas').evaluate(c=>{
          const d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let opaque=0,colored=0;
          for(let i=0;i<d.length;i+=4)if(d[i+3]){opaque++;if(d[i]!==d[i+1]||d[i]!==d[i+2])colored++;}
          return{opaque,colored,guns:Number(c.dataset.turretCount)};
        });
        assert.ok(pixels.opaque>1000&&pixels.guns>0);assert.equal(pixels.colored,0);
        assert.equal(await page.getByRole('button',{name:'Download vorbereiten'}).count(),0);
        assert.equal(await page.locator('.collection-stats').count(),0);
        await page.screenshot({path:path.join(out,`locked-boss-04-${width}.png`)});
        await page.keyboard.press('ArrowLeft');
        await page.waitForFunction(()=>document.querySelector('.collection-card')?.dataset.cardKey==='boss-3');
        await page.evaluate(()=>{
          const e=document.querySelector('.collection-scroll');const t=x=>new Touch({identifier:1,target:e,clientX:x,clientY:250});
          e.dispatchEvent(new TouchEvent('touchstart',{bubbles:true,touches:[t(300)]}));
          e.dispatchEvent(new TouchEvent('touchend',{bubbles:true,changedTouches:[t(90)]}));
        });
        await page.waitForSelector('.collection-locked-detail');
        assert.equal(await page.locator('.collection-download').count(),0);
        await page.getByRole('button',{name:'← Zurück zur Sammlung'}).click();
      }
      await page.getByRole('button',{name:'Standard',exact:true}).click();
      assert.equal(await page.locator('.collection-tile:not(.is-locked)').count(),account?4:3,'Only currently owned released hulls');
      assert.equal(await page.locator('.collection-tile').filter({hasText:'Iron Guard'}).locator('small').innerText(),'GESPERRT');
      await page.locator('.collection-tile').filter({hasText:'Solar Lance'}).click();
      await footerVisible(page);
      await page.screenshot({path:path.join(out,`ship-card-${width}-${account}.png`)});
      await page.locator('.collection-scroll').evaluate(e=>e.scrollTop=e.scrollHeight);
      await footerVisible(page);
      await page.screenshot({path:path.join(out,`card-footer-${width}-${account}.png`)});
      await page.getByRole('button',{name:'Download vorbereiten'}).click();
      await page.locator('.collection-download').waitFor();
      const download=page.waitForEvent('download');await page.locator('.collection-download').click();
      await (await download).saveAs(path.join(out,`solar-lance-${width}-${account}.png`));
      await page.getByRole('button',{name:'← Zurück zur Sammlung'}).click();
      for(const category of ['Advanced','Elite']){
        await page.getByRole('button',{name:category,exact:true}).click();
        assert.equal(await page.locator('.collection-tile.is-locked').count(),20);
        assert.equal(await page.locator('.collection-tile:not(.is-locked)').count(),0);
      }
      assert.deepEqual(errors,[]);assert.equal(paidCalls,0);
      results.push({width,height,account,successAndReload:true,nextPurchaseEquips:true,failedPurchaseUnchanged:true,lostAcknowledgement:account?'reconciled':'not applicable',receiptBeforeContinue:true,releaseLimits:true,footerVisible:true,pngDownload:true,inventoryCalls,paidCalls});
      await context.close(); activePage=null;
    }
    // All 110 cards in both languages: test export layout without unlocking any UI cards.
    const context=await browser.newContext();const page=activePage=await context.newPage();await page.goto(origin);
    const exports=await page.evaluate(async()=>{
      const {shipCard,bossCard}=await import('/src/pages/collectionData.ts');
      const {playerSkins}=await import('/src/pages/shipFleet.ts');
      const {exportCollectionCard}=await import('/src/pages/collectionExport.ts');
      const original=CanvasRenderingContext2D.prototype.fillText;let records=[];
      CanvasRenderingContext2D.prototype.fillText=function(text,x,y,...rest){
        if(this.canvas.width===1200){const m=this.measureText(text);records.push({text,x,y,width:m.width,bottom:y+m.actualBoundingBoxDescent,height:this.canvas.height});}
        return original.call(this,text,x,y,...rest);
      };
      const completed=[];
      try{
        for(const de of [true,false])for(const card of [...Array.from({length:50},(_,i)=>bossCard(i+1,de?'de':'en')),...[1,2,3].flatMap(s=>playerSkins.map(ship=>shipCard(ship.id,s,de)))]){
          records=[];const blob=await exportCollectionCard(card,de);
          if(blob.type!=='image/png'||blob.size<1000)throw new Error('Invalid PNG: '+card.key);
          const text=records.map(r=>r.text).join('').replace(/\s/g,'');
          for(const p of [...card.story,...card.equipment])if(!text.includes(p.replace(/\s/g,'')))throw new Error('Missing text: '+card.key);
          for(const r of records)if(r.x<0||r.x+r.width>1101||r.bottom>r.height-60)throw new Error('Clipped export: '+card.key+' '+JSON.stringify(r));
          completed.push({key:card.key,locale:de?'de':'en',height:records[0].height,bytes:blob.size});
        }
      }finally{CanvasRenderingContext2D.prototype.fillText=original;}
      return completed;
    });
    assert.equal(exports.length,220);fs.writeFileSync(path.join(out,'all-card-exports.json'),JSON.stringify(exports,null,2));
    await context.close();activePage=null;
    fs.writeFileSync(path.join(out,'browser-results.json'),JSON.stringify({cases:results,exports:exports.length,paidCalls:0},null,2));
    console.log(JSON.stringify({cases:results,exports:exports.length,paidCalls:0},null,2));
  } catch(error) {
    if(activePage){await activePage.screenshot({path:path.join(out,'failure.png'),fullPage:true}).catch(()=>{});fs.writeFileSync(path.join(out,'failure-dom.txt'),await activePage.locator('body').innerText().catch(()=>''));}
    throw error;
  } finally { await browser.close();await server.close(); }
})().catch(error=>{console.error(error);process.exit(1);});
