// Local, reproducible bot comparison. Never imported by the application build.
// Real movement, collisions, damage and drops; no invulnerability or forced kills.
// React scene paints are suppressed during measurement: these are NOT FPS tests.
const fs = require('node:fs');
const path = require('node:path');
const cp = require('node:child_process');
const assert = require('node:assert/strict');
const { chromium } = require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES + '/playwright');
const repo = path.resolve(__dirname, '../..');
const baselineRef = process.env.CRYPTOID_BASELINE_REF || 'a8d2faf95f629d0a8f09db072382c1d8f9153211';
const out = process.env.CRYPTOID_BALANCE_DIR || '/tmp/cryptoid-balance';
fs.mkdirSync(out, { recursive: true });
const baseline = cp.execFileSync('git', ['show', baselineRef + ':frontend/src/pages/GamePage.tsx'], { cwd: repo, encoding: 'utf8' });
const results = [];
const hooks = `
  if (!(window as any).__balance) (window as any).__balance = {
    active: false, totalMs: 0, activeMs: 0, maxEnemies: 0, maxAttackers: 0, lost: 0, previousHearts: 3, reaction: 0,
    begin: (stage: number) => {
      const q = (window as any).__balance;
      Object.assign(stateRef.current, createInitialState(), { sector:stage, section:stage, status:'playing' });
      sectionSlotsRef.current=null; sectionElapsedRef.current=0; formationIndexRef.current=0;
      formationOffsetRef.current=0; formationStartedRef.current=false; elapsedRef.current=0;
      spawnTimerRef.current=0; clearTimerRef.current=0; attackCooldownRef.current=0; dropsCreatedRef.current=0;
      q.stage=stage;q.active=true;setGame({...stateRef.current});
    },
    result: () => {
      const q=(window as any).__balance,s=stateRef.current;
      return {stage:q.stage,totalMs:q.totalMs,activeMs:q.activeMs,maxEnemies:q.maxEnemies,maxAttackers:q.maxAttackers,
        lost:q.lost+Math.max(0,q.previousHearts-s.hearts),hearts:s.hearts,destroyed:s.destroyed,shards:s.shards,drops:dropsCreatedRef.current,
        sector:s.sector,status:s.status,phase:s.phase,complete:s.sector!==q.stage||s.phase==='SECTOR_CLEAR',weapon:s.weaponLevel};
    }
  };
`;
const tick = `
      const q=(window as any).__balance;
      if(q?.active) {
        if(state.sector!==q.stage || state.phase==='SECTOR_CLEAR' || state.status!=='playing') {
          q.active=false;keysRef.current.clear();
        } else {
          q.totalMs+=delta;q.maxEnemies=Math.max(q.maxEnemies,state.asteroids.length);
          q.maxAttackers=Math.max(q.maxAttackers,state.asteroids.filter(e=>e.attackPattern!==null&&e.attackDelay===0).length);
          q.lost+=Math.max(0,q.previousHearts-state.hearts);q.previousHearts=state.hearts;
          q.reaction+=delta;
          if(q.reaction>=120) {
            q.reaction=0;const w=fieldRef.current?.clientWidth||390,h=fieldRef.current?.clientHeight||844;
            const px=state.player.x*w,py=state.player.y*h;
            const targets=state.asteroids.filter(e=>!e.cloaked&&e.y>0&&e.y<py-70);
            const target=targets.sort((a,b)=>Math.abs(a.x-px)-Math.abs(b.x-px))[0];
            let desired=target?.x??w/2;
            const threat=state.enemyShots.find(e=>e.y>py-200&&e.y<py+25&&Math.abs(e.x-px)<45);
            if(threat) desired=px+(px<w/2?80:-80);
            keysRef.current.clear();
            if(desired-px>9)keysRef.current.add('ArrowRight');
            if(desired-px< -9)keysRef.current.add('ArrowLeft');
          }
        }
      }
`;
(async()=>{
  const { createServer }=await import(path.join(repo,'frontend/node_modules/vite/dist/node/index.js'));
  const browser=await chromium.launch({executablePath:process.env.CRYPTOID_CHROMIUM||'/tmp/cryptoid-chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
  try {
    for(const version of ['baseline','expanded']) {
      const server=await createServer({root:path.join(repo,'frontend'),logLevel:'error',server:{host:'127.0.0.1',port:0,hmr:false},plugins:[{name:'local-balance',enforce:'pre',transform(source,id){
        if(!id.endsWith('/GamePage.tsx'))return;
        let code=version==='baseline'?baseline:source;
        for(const marker of ['  const levelLabel =','      lastFrameRef.current = time;','        const keys = keysRef.current;'])assert.ok(code.includes(marker),marker);
        code=code.replace('  const levelLabel =',hooks+'\n  const levelLabel =')
          .replace('      lastFrameRef.current = time;','      lastFrameRef.current = time;'+tick)
          .replace('        const keys = keysRef.current;','        if ((window as any).__balance?.active && !transitionPaused) (window as any).__balance.activeMs += delta;\n        const keys = keysRef.current;');
        return code.replaceAll('setGame({ ...state','if (!(window as any).__balance?.active) setGame({ ...state');
      }}]});
      await server.listen();const origin='http://127.0.0.1:'+server.httpServer.address().port;
      try {
        const stages=(process.env.CRYPTOID_BALANCE_STAGES||'1,9,37,99,249,499').split(',').map(Number);
        for(const stage of stages) {
          const context=await browser.newContext({viewport:{width:390,height:844},locale:'en-US',isMobile:true,hasTouch:true});
          await context.addInitScript(()=>{
            window.Pi={init(){},getPiHostAppInfo:async()=>({hostApp:'web'})};
            localStorage.setItem('cryptoid_language','en');localStorage.setItem('cryptoid_home_music','off');
            let seed=719;Math.random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
          });
          await context.route('**/*',route=>{
            const u=new URL(route.request().url());
            if(u.origin!==origin)return route.fulfill({status:200,body:'',contentType:'application/javascript'});
            if(u.pathname.startsWith('/api/'))return route.fulfill({status:200,contentType:'application/json',body:'{}'});
            return route.continue();
          });
          const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
          await page.clock.install();await page.goto(origin+'/game');await page.waitForFunction(()=>window.__balance);
          assert.ok(await page.locator('.game-field').isVisible());
          await page.evaluate(stage=>window.__balance.begin(stage),stage);
          let result;
          for(let seconds=0;seconds<300;seconds+=5) {
            await page.clock.runFor(5000);result=await page.evaluate(()=>window.__balance.result());
            if(result.complete||result.status!=='playing')break;
          }
          result={version,...result,errors};
          assert.deepEqual(errors,[]);assert.ok(result.maxEnemies<=6);assert.ok(result.maxAttackers<=3);
          results.push(result);console.log(JSON.stringify(result));
          fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({baselineRef,method:'Seeded keyboard bot; standard ship, 3 hearts, L1 start; real drops and damage; virtual time; scene paints suppressed; not human difficulty or FPS measurements',results},null,2));
          await context.close();
        }
      } finally {await server.close();}
    }
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
