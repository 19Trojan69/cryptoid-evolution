// Isolated startup profiling. Test hooks exist only in this Vite transform.
const { chromium } = require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES + '/playwright');
const path = require('node:path');
const fs = require('node:fs');
const assert = require('node:assert/strict');
const repo = path.resolve(__dirname, '../..');
(async () => {
  process.env.VITE_BACKEND_URL = '/api';
  const { createServer } = await import(path.join(repo, 'frontend/node_modules/vite/dist/node/index.js'));
  const server = await createServer({ root: path.join(repo, 'frontend'), logLevel: 'error', plugins: [{name:'startup-test-hooks', enforce:'pre', transform(code,id) {
    if(id.endsWith('/paintedShip.ts')) return code + '\n(window as any).__paintQA = {paint:createPaintedSprite, cache};';
    if(id.endsWith('/GamePage.tsx')) return code.replace('const [game, setGame] = useState<GameState>(createInitialState);', 'const [game, setGame] = useState<GameState>(createInitialState); (window as any).__startupQA = { inspect:()=>({phase:stateRef.current.phase, status:stateRef.current.status, stage:stateRef.current.sector, enemies:stateRef.current.asteroids.length}), play:()=>{stateRef.current.status="playing";stateRef.current.hearts=50;setGame({...stateRef.current});}, clearCards:()=>{rewardCardsRef.current=[];setRewardCards([]);stateRef.current.status="playing";} };');
  }}], server: {host:'127.0.0.1',port:0,hmr:false} });
  await server.listen(); const origin='http://testnet.localhost:'+server.httpServer.address().port;
  const browser=await chromium.launch({executablePath:process.env.CRYPTOID_CHROMIUM||path.resolve(repo,'../chromium'),headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu','--host-resolver-rules=MAP testnet.localhost 127.0.0.1']});
  const out=process.env.CRYPTOID_PERF_OUT||path.resolve(repo,'../startup-performance.json');
  try {
    const context=await browser.newContext({viewport:{width:390,height:844}});
    await context.addInitScript(()=>{window.Pi={init(){}};window.__longTasks=[];window.__frameGaps=[];new PerformanceObserver(list=>window.__longTasks.push(...list.getEntries().map(e=>({at:e.startTime,ms:e.duration})))).observe({type:'longtask',buffered:true});let last;const frame=t=>{if(last)window.__frameGaps.push(t-last);last=t;requestAnimationFrame(frame);};requestAnimationFrame(frame);});
    await context.route('**/*',async route=>{const u=new URL(route.request().url());if(u.origin!==origin)return route.abort();if(u.pathname==='/qa-paint')return route.fulfill({contentType:'text/html',body:'<html><body>Ship paint benchmark<script type="module">import "/src/pages/paintedShip.ts";</script></body></html>'});if(u.pathname.startsWith('/api/'))return route.fulfill({json:{}});return route.continue();});
    const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));const cdp=await context.newCDPSession(page);await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});
    await page.goto(origin+'/qa-paint');await page.waitForFunction(()=>window.__paintQA);
    const paint=await page.evaluate(async()=>{
      const test=window.__paintQA,start=performance.now(),framesBefore=window.__frameGaps.length;
      const duplicate=await Promise.all(Array.from({length:8},()=>test.paint(0,'gold',1)));
      const duplicateMs=performance.now()-start;const uniqueStart=performance.now();
      await Promise.all(Array.from({length:6},(_,i)=>test.paint(i+2,'silver',1)));
      return {duplicateMs,distinctResults:new Set(duplicate).size,uniqueMs:performance.now()-uniqueStart,framesDuring:window.__frameGaps.length-framesBefore,cacheSize:test.cache.size};
    });
    await page.goto(origin+'/game');await page.waitForFunction(()=>window.__startupQA);await page.evaluate(()=>{window.__startupQA.clearCards();window.__startupQA.play();window.__longTasks=[];window.__frameGaps=[];});
    await page.waitForTimeout(12000);const game=await page.evaluate(()=>({state:window.__startupQA.inspect(),longTasks:window.__longTasks,gaps:window.__frameGaps}));
    assert.equal(game.state.status,'playing');assert.ok(game.state.enemies>0);assert.deepEqual(errors,[]);assert.equal(await page.locator('vite-error-overlay').count(),0);
    await page.screenshot({path:out.replace(/\.json$/,'.png')});const sorted=game.gaps.sort((a,b)=>a-b);const result={paint,game:{state:game.state,longTasks:game.longTasks,maxGap:Math.max(...sorted),p95Gap:sorted[Math.floor(sorted.length*.95)],frameCount:sorted.length},errors};fs.writeFileSync(out,JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));await context.close();
  }finally{await browser.close();await server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
