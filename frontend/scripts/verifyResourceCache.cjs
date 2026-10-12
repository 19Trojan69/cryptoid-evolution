// Compare original and optimized pixel caches using original HD assets.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE_PATH||'playwright');
const current=path.resolve(__dirname,'../..'),roots=[process.env.CRYPTOID_BASELINE_REPO,current].filter(Boolean);
(async()=>{const results=[];for(const root of roots){
 const {createServer}=await import(path.join(root,'frontend/node_modules/vite/dist/node/index.js'));
 const server=await createServer({root:path.join(root,'frontend'),logLevel:'error',server:{host:'127.0.0.1',port:0,hmr:false},plugins:[{name:'resource-probe',enforce:'pre',transform(code,id){if(id.endsWith('/paintedShip.ts'))return code+`\n(window as any).__resources={paint:createPaintedSprite,stats:()=>typeof paintedShipResourceStats==='function'?paintedShipResourceStats():({painted:cache.size,sources:sourceImages.size})};`;}}]});await server.listen();const origin='http://127.0.0.1:'+server.httpServer.address().port;
 const browser=await chromium.launch({executablePath:process.env.CRYPTOID_CHROMIUM,args:['--no-sandbox','--no-zygote','--single-process','--disable-dev-shm-usage']});
 try{const page=await browser.newPage();await page.route('**/qa-resources',route=>route.fulfill({contentType:'text/html',body:'<script type="module">import "/src/pages/paintedShip.ts";</script>'}));await page.goto(origin+'/qa-resources');await page.waitForFunction(()=>window.__resources);
 const result=await page.evaluate(async()=>{const tasks=[],observer=new PerformanceObserver(list=>tasks.push(...list.getEntries().map(e=>e.duration)));observer.observe({type:'longtask'});const start=performance.now(),jobs=[];for(let stage=1;stage<=3;stage++)for(let i=0;i<20;i++)for(const color of ['gold','silver','bronze','copper'])jobs.push(window.__resources.paint(i,color,stage));await Promise.all(jobs);await new Promise(resolve=>setTimeout(resolve,100));observer.disconnect();return {...window.__resources.stats(),variants:jobs.length,totalMs:performance.now()-start,maxLongTask:Math.max(0,...tasks),longTasks:tasks.length};});
 if(root===current){assert.ok(result.painted<=48);assert.ok(result.sources<=8);}results.push({root,...result});console.log(JSON.stringify(results.at(-1)));
 }finally{await browser.close();await server.close();}}
 fs.writeFileSync(process.env.CRYPTOID_RESOURCE_OUT||'/tmp/cryptoid-resources.json',JSON.stringify(results,null,2));
})().catch(e=>{console.error(e);process.exitCode=1});
