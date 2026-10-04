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
  const server = await createServer({ root: path.join(repo, 'frontend'), logLevel: 'error', define: { 'import.meta.env.VITE_BACKEND_URL': JSON.stringify('/api') }, server: { host: '127.0.0.1', port: 0, hmr: false }, plugins: [{ name: 'local-flight-qa', enforce: 'pre', transform(code, id) { if (id.endsWith('/GamePage.tsx')) return code.replace('  const levelLabel =', instrumentation + '\n  const levelLabel =').replace('if (data.combat) restoreCombat(data.combat);', 'if (data.combat) { restoreCombat(data.combat); (window as any).__restoredFlight = structuredClone(stateRef.current); (window as any).__restoredRefs = Object.fromEntries(COMBAT_REF_KEYS.map(k=>[k,combatRefs[k].current])); }'); } }] });
  await server.listen();
  const origin = 'http://127.0.0.1:' + server.httpServer.address().port;
  const browser = await chromium.launch({ executablePath: process.env.CRYPTOID_CHROMIUM || '/tmp/cryptoid-chromium', headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  try {
    for (const [stage, viewport] of [[1,{width:390,height:844}],[9,{width:390,height:844}],[37,{width:1280,height:800}],[99,{width:390,height:844}],[249,{width:1280,height:800}],[499,{width:390,height:844}],[10,{width:390,height:844}],[40,{width:1280,height:800}],[500,{width:390,height:844}]]) {
      if(process.env.CRYPTOID_QA_STAGES&&!process.env.CRYPTOID_QA_STAGES.split(',').includes(String(stage)))continue;
      if(bonusScenario && stage%10)continue;
      const h = makeHarness();
      await h.call('progress', '/me', null, { method: 'GET' });
      const snapshot = firstMissionSnapshot(2);
      Object.assign(h.profile(), { ...emptyPlayerSave(), version: 1, legacyImported: true, mission: { sector: stage, phase: stage%10 ? 'normal' : bonusScenario ? 'bonus' : 'boss', rulesVersion, snapshot, savedAt: new Date().toISOString() } });
      h.docs[0].rewardEventKeys = { testnet: [] };
      for (let s=1;s<stage;s++) if(s%10) {h.docs[0].rewardEventKeys.testnet.push('block:'+s);if(s%10===9)h.docs[0].rewardEventKeys.testnet.push('chain:'+Math.ceil(s/10));}else h.docs[0].rewardEventKeys.testnet.push('boss:'+s/10,'bonus:'+s/10);
      if(bonusScenario)h.docs[0].rewardEventKeys.testnet.push('boss:'+stage/10);
      const context = await browser.newContext({ viewport, locale:'en-US', isMobile:viewport.width<700, hasTouch:viewport.width<700 });
      await context.addInitScript(() => { window.__ENV={backendURL:'/api'};window.Pi={init(){},getPiHostAppInfo:async()=>({hostApp:'web'})}; localStorage.setItem('cryptoid_pi_session','1');localStorage.setItem('cryptoid_language','en');localStorage.setItem('cryptoid_home_music','off'); });
      const apiFailures=[];
      let networkFault=false, failedAttempts=0;
      await context.route('**/*',async route=>{
        const u=new URL(route.request().url());
        if(u.origin!==origin)return route.fulfill({status:200,body:'',contentType:'application/javascript'});
        if(!u.pathname.startsWith('/api/'))return route.continue();
        const [group,...parts]=u.pathname.slice(5).split('/'), endpoint='/'+parts.join('/');
        const body=route.request().postDataJSON();let response;
        const fault=networkFault&&group==='progress'&&endpoint==='/checkpoint';
        if(fault&&networkScenario==='offline'){failedAttempts++;return route.abort('internetdisconnected');}
        if(group==='user')response={code:200,body:{user:{uid:'pilot-a',username:'QA'},canAdmin:false,adminMode:false}};
        else if(group==='usage')response={code:204};
        else if(['progress','rewards','hangar','leaderboard'].includes(group)) {
          if(group==='hangar'&&endpoint==='/catalog')response={code:200,body:{offers:[]}};
          else response=await h.call(group,endpoint,body,{method:route.request().method()});
          if(group==='hangar'&&endpoint==='/start'&&response.code===200){h.session.scoreRun.startedAt-=60_000;h.profile().lastStart.runMeta.startedAt=h.session.scoreRun.startedAt;}
        }else response={code:200,body:{}};
        if(fault&&networkScenario==='lost-ack'&&response.code===200){failedAttempts++;return route.abort('connectionreset');}
        if(response.code>=400)apiFailures.push({path:u.pathname,status:response.code,body:response.body});
        await route.fulfill({status:response.code,contentType:'application/json',body:response.code===204?'':JSON.stringify(response.body)});
      });
      const page=await context.newPage();page.on('pageerror',e=>errors.push({stage,error:e.message}));
      await page.clock.install();
      await page.goto(origin+'/game'); await page.getByRole('button',{name:'Resume',exact:true}).click();
      await page.waitForFunction(()=>window.__flightTest?.inspect().state.status==='playing');
      await page.clock.runFor(900);
      await page.evaluate(()=>window.__flightTest.pause());
      await page.evaluate(()=>window.__flightTest.save());
      assert.equal(apiFailures.length,0,JSON.stringify(apiFailures));
      let c=structuredClone(h.profile().mission.combat);assert.ok(c,'actual client checkpoint accepted by actual API');
      assert.equal(h.profile().mission.snapshot.hearts,2);
      const savedSectionTime=c.refs.sectionElapsed;
      await page.clock.runFor(3000);
      assert.equal((await page.evaluate(()=>window.__flightTest.inspect())).refs.sectionElapsed,savedSectionTime,'pause preserves clocks');
      if(stage%10) {
        const groups=await page.locator('.flight-indicator').innerText();
        let info=await page.evaluate(()=>window.__flightTest.inspect());
        const expected = Number(groups.split('/')[1]);
        for(let group=0;group<expected;group++) {
          await page.evaluate(()=>window.__flightTest.resume());
          await page.clock.runFor(8200);
          info=await page.evaluate(()=>window.__flightTest.inspect());
          assert.ok(info.state.asteroids.length<=6);
          if(rulesVersion===1)assert.ok(info.state.asteroids.every(e=>e.entryPattern===info.expectedEntryPattern),"legacy entry patterns stay unchanged");
          await page.evaluate(()=>window.__flightTest.pause());
          let recoveredBalance=null;
          if(group===0&&networkScenario!=='normal') {
            const balanceBefore=h.profile().balance, creditedBefore=h.profile().creditedShards;
            await page.evaluate(()=>{const s=window.__flightTest.inspect().state;window.__flightTest.alter({score:s.score+20,shards:s.shards+4,destroyed:s.destroyed+1});});
            const expected=await page.evaluate(()=>window.__flightTest.inspect());
            recoveredBalance=balanceBefore+expected.state.shards-creditedBefore;
            networkFault=true;
            await page.evaluate(()=>{window.__failedSave=false;window.__flightTest.save().catch(()=>{window.__failedSave=true;});});
            for(let attempt=0;attempt<6&&!await page.evaluate(()=>window.__failedSave);attempt++)await page.clock.runFor(1000);
            assert.equal(await page.evaluate(()=>window.__failedSave),true,'all retry attempts fail visibly');
            assert.ok(failedAttempts>=3,'initial attempt plus retries exercised');
            const pending=await page.evaluate(()=>Object.keys(localStorage).filter(k=>k.startsWith('cryptoid_save_outbox_v1_')).flatMap(k=>JSON.parse(localStorage.getItem(k)||'[]')));
            assert.ok(pending.some(e=>e.path==='/progress/checkpoint'),'unconfirmed save remains durable');
            assert.equal(h.profile().balance,networkScenario==='offline'?balanceBefore:recoveredBalance,'lost acknowledgement must not double-credit retries');
            networkFault=false;
          } else await page.evaluate(()=>window.__flightTest.save());
          c=structuredClone(h.profile().mission.combat);
          assert.equal(c.refs.flight,group);
          const before=await page.evaluate(()=>window.__flightTest.inspect());
          // Reload through the real resume UI. The API keeps enemy HP and timers.
          if(stage===37&&group===0)await page.setViewportSize({width:390,height:844});
          await page.reload();await page.getByRole('button',{name:'Resume',exact:true}).click();
          await page.waitForFunction(()=>window.__flightTest?.inspect().state.status==='playing');
          await page.evaluate(()=>window.__flightTest.pause());
          const resumed=await page.evaluate(()=>window.__flightTest.inspect());
          assert.equal(resumed.refs.flight,group);
          if(stage===37)assert.ok(resumed.state.asteroids.every(e=>e.entryTargetX>=e.radius&&e.entryTargetX<=390-e.radius));
          assert.deepEqual(resumed.state.asteroids.map(e=>[e.id,e.health]),before.state.asteroids.map(e=>[e.id,e.health]));
          assert.equal(resumed.state.hearts,before.state.hearts);
          assert.equal(resumed.state.shards,before.state.shards);
          if(recoveredBalance!==null){
            assert.equal(h.profile().balance,recoveredBalance,'replayed checkpoint credits exactly once');
            const pending=await page.evaluate(()=>Object.keys(localStorage).filter(k=>k.startsWith('cryptoid_save_outbox_v1_')).flatMap(k=>JSON.parse(localStorage.getItem(k)||'[]')));
            assert.equal(pending.length,0,'recovery drains durable queue');
            assert.equal(h.profile().mission.snapshot.destroyed,before.state.destroyed);
          }
          await page.evaluate(()=>{window.__flightTest.clearGroup();window.__flightTest.resume();});
          await page.clock.runFor(34);
          await page.evaluate(()=>window.__flightTest.pause());
          const after=await page.evaluate(()=>window.__flightTest.inspect());
          assert.equal(after.rules,rulesVersion);
          assert.equal(after.state.sector,stage,'group never advances the stage');
          if(group<expected-1){assert.equal(after.refs.flight,group+1);assert.equal(after.state.phase,'SECTOR_INTRO');if(rulesVersion===2)assert.ok(after.refs.sectionElapsed>=2200&&after.refs.sectionElapsed<2700);else assert.ok(after.refs.sectionElapsed<100,`legacy reinforcement keeps full intro: ${after.refs.sectionElapsed} ms, rules ${after.rules}`);}
          else assert.equal(after.state.phase,'SECTOR_CLEAR');
          if(group===0&&expected>1){await page.evaluate(()=>window.__flightTest.resume());await page.screenshot({path:path.join(screenshots,`stage-${stage}-warning.png`)});await page.evaluate(()=>window.__flightTest.pause());}
        }
        assert.ok(!h.profile().mission.combat,'completed boundary clears the runtime');
        assert.equal(h.profile().mission.sector,stage+1);
        assert.equal(h.profile().mission.phase,stage%10===9?'boss':'normal');
        results.push({stage,rulesVersion,networkScenario,failedAttempts,viewport,groups:expected,checkpoints:'passed',pause:'passed',resume:'passed',onceOnlyClear:'passed'});
      }else if(bonusScenario){
        await page.evaluate(()=>window.__flightTest.resume());
        await page.clock.runFor(6000);
        await page.evaluate(()=>window.__flightTest.pause());
        await page.evaluate(()=>window.__flightTest.save());
        const before=await page.evaluate(()=>window.__flightTest.inspect());
        assert.equal(before.state.encounter,'bonus');
        assert.ok(before.refs.bonusIndex>0 && before.refs.bonusIndex<12,'save in the middle of bonus spawns');
        await page.reload();await page.getByRole('button',{name:'Resume',exact:true}).click();
        await page.waitForFunction(()=>window.__flightTest?.inspect().state.status==='playing');
        await page.evaluate(()=>window.__flightTest.pause());
        const restored=await page.evaluate(()=>window.__restoredFlight);
        const restoredRefs=await page.evaluate(()=>window.__restoredRefs);
        assert.equal(restoredRefs.bonusIndex,before.refs.bonusIndex);
        assert.equal(restored.bonusHits,before.state.bonusHits);
        assert.deepEqual(restored.bonusTargets,before.state.bonusTargets);
        assert.equal(restored.shards,before.state.shards);
        assert.equal(restored.hearts,before.state.hearts);
        await page.evaluate(()=>window.__flightTest.resume());
        for(let tick=0;tick<60;tick++){
          await page.clock.runFor(1000);
          const current=await page.evaluate(()=>window.__flightTest.inspect().state);
          if(current.status==='victory'||current.sector>stage)break;
        }
        assert.equal(h.docs[0].rewardEventKeys.testnet.filter(k=>k==='bonus:'+stage/10).length,1,'bonus reward committed once');
        if(stage===500){
          assert.equal((await page.evaluate(()=>window.__flightTest.inspect())).state.status,'victory');
          assert.equal(h.profile().mission,null,'final bonus completes mission');
        }else{
          assert.equal(h.profile().mission.sector,stage+1);
          assert.equal(h.profile().mission.phase,'normal');
        }
        results.push({stage,rulesVersion,viewport,bonusResume:'passed',onceOnlyBonus:'passed',next:stage===500?'victory':stage+1});
      }else{
        await page.evaluate(()=>window.__flightTest.resume());await page.clock.runFor(8000);await page.evaluate(()=>window.__flightTest.pause());await page.evaluate(()=>window.__flightTest.save());
        const before=await page.evaluate(()=>window.__flightTest.inspect());
        await page.reload();await page.getByRole('button',{name:'Resume',exact:true}).click();await page.waitForFunction(()=>window.__flightTest?.inspect().state.status==='playing');await page.evaluate(()=>window.__flightTest.pause());
        const after=await page.evaluate(()=>window.__flightTest.inspect());
        const restored=await page.evaluate(()=>window.__restoredFlight);
        assert.equal(restored.boss.health,before.state.boss.health);assert.deepEqual(restored.boss.turrets.map(t=>[t.health,t.maxHealth,t.shots]),before.state.boss.turrets.map(t=>[t.health,t.maxHealth,t.shots]));
        assert.ok(after.state.boss.health<=before.state.boss.health,'resuming cannot heal the boss');
        results.push({stage,rulesVersion,viewport,bossResume:'passed'});
      }
      assert.deepEqual(apiFailures,[]);
      await page.screenshot({path:path.join(screenshots,`stage-${stage}.png`)});
      await context.close();
      console.log(JSON.stringify(results.at(-1)));
    }
    assert.deepEqual(errors,[]);fs.writeFileSync(path.join(screenshots,`results-rules-${rulesVersion}-${networkScenario}${bonusScenario?'-bonus':''}.json`),JSON.stringify({results,errors},null,2));
  }finally{await browser.close();await server.close();}
})().catch(e=>{console.error(e);console.error(JSON.stringify({results,errors}));process.exitCode=1;});
