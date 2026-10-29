import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {resolve,dirname} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {mkdirSync,writeFileSync} from 'node:fs';
const directory=dirname(fileURLToPath(import.meta.url)),root=resolve(directory,'../..');
const req=createRequire(resolve(root,'frontend/package.json'));
const {createServer}=await import(pathToFileURL(req.resolve('vite')).href);
const react=(await import(pathToFileURL(req.resolve('@vitejs/plugin-react')).href)).default;
const {chromium,webkit}=createRequire(import.meta.url)('playwright');
const engine=process.env.CRYPTOID_INPUT_ENGINE||'chromium';
assert.ok(['chromium','webkit'].includes(engine));
const output=resolve(directory,'results',engine);mkdirSync(output,{recursive:true});
const result={complete:false,engine,physicalDevice:false,fullCombatScene:false,
  scope:'Actual game input binding, viewport lock and React click boundary. No simulated native crash or memory acceptance.',checks:[],nativeMultitouch:engine==='chromium'};
let server,browser,page;
const errors=[];
try {
  const entry={name:'single-finger-test-entry',configureServer(server){
    server.middlewares.use(async (request,response,next)=>{
      if(request.url!=='/__single-finger')return next();
      response.setHeader('Content-Type','text/html');
      response.end(await server.transformIndexHtml(request.url,`<html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;overflow:hidden"><div id="root"></div><script type="module" src="/@fs/${directory}/harness.jsx"></script></body></html>`));
    });
  }};
  server=await createServer({configFile:false,root:resolve(root,'frontend'),plugins:[react(),entry],
    resolve:{alias:['react-dom/client','react/jsx-dev-runtime','react/jsx-runtime','react'].map(find=>({find,replacement:req.resolve(find)}))},
    server:{host:'127.0.0.1',port:0,fs:{allow:[root]}}});
  await server.listen();const address=server.httpServer.address(),url=`http://127.0.0.1:${address.port}/__single-finger`;
  browser=await ({chromium,webkit}[engine]).launch({headless:true});result.engineVersion=browser.version();
  const context=await browser.newContext({viewport:{width:430,height:825},hasTouch:true,isMobile:true});
  page=await context.newPage();page.setDefaultTimeout(10000);
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto(url);await page.getByRole('heading',{name:'Single-finger input boundary QA',exact:true}).waitFor();
  await page.waitForFunction(()=>window.__singleFingerQA);
  const state=()=>page.evaluate(()=>window.__singleFingerQA.inspect());
  const check=async(name,expected)=>{assert.ok(await expected,name);result.checks.push(name);};
  const resume=async()=>{await page.locator('#resume').tap();await page.waitForFunction(()=>window.__singleFingerQA.inspect().playing);};
  const touch=async(selector)=>{const b=await page.locator(selector).boundingBox();await page.touchscreen.tap(b.x+b.width/2,b.y+b.height/2);
    await page.waitForFunction(()=>!window.__singleFingerQA.inspect().playing);};
  for(const id of ['weapons','pause','home']){
    await touch('#'+id);await check('native touch opens '+id+' after a fresh single tap',!(await state()).playing);await resume();
  }
  const order=(await state()).contactOrder;
  const firstDown=order.findIndex(row=>row.stage==='contact'&&row.event==='pointerdown');
  await check('contact observation precedes React root capture for a native touch',firstDown>=0&&order[firstDown+1]?.stage==='root-capture');
  await check('native touch totals are distinct from tracked pointer totals',order.some(row=>row.event==='touchstart'&&row.reportedTouches===1));
  await page.locator('#weapons').click();await check('native mouse click reaches the React handler',!(await state()).playing);await resume();
  await page.locator('#weapons').focus();await page.keyboard.press('Enter');await check('keyboard Enter retains deliberate control activation',!(await state()).playing);await resume();
  const dispatch=async(target,type,data)=>page.evaluate(({target,type,data})=>document.querySelector(target).dispatchEvent(new PointerEvent(type,
    {bubbles:true,cancelable:true,pointerId:1,pointerType:'touch',isPrimary:true,buttons:1,clientX:300,clientY:700,...data})),{target,type,data});
  let before=await state();
  await dispatch('.game-field','pointerdown',{});await dispatch('#weapons','pointermove',{clientX:70,clientY:760});
  await dispatch('#weapons','pointerup',{clientX:70,clientY:760,buttons:0});
  await dispatch('#weapons','click',{clientX:70,clientY:760,buttons:0,detail:1});
  await check('explicit retargeted drag click cannot open a React control', (await state()).opens===before.opens&&(await state()).moves>before.moves);
  await dispatch('.game-field','pointerdown',{});
  await dispatch('#weapons','pointerdown',{pointerId:2,isPrimary:false,clientX:70,clientY:760});
  await dispatch('#weapons','pointerup',{pointerId:2,isPrimary:false,buttons:0,clientX:70,clientY:760});
  await dispatch('#weapons','click',{pointerId:2,isPrimary:false,buttons:0,detail:1,clientX:70,clientY:760});
  await check('explicit secondary touch click is stopped before React',(await state()).opens===before.opens&&(await state()).pointer===1);
  await dispatch('.game-field','pointerup',{buttons:0});
  await touch('#weapons');await check('release then native fresh tap opens the same control',!(await state()).playing);await resume();
  if(engine==='chromium'){
    const cdp=await context.newCDPSession(page),box=await page.locator('#weapons').boundingBox();
    const end={x:box.x+box.width/2,y:box.y+box.height/2,id:1},start={x:320,y:700,id:1};
    const send=(type,touchPoints)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints});
    await page.waitForTimeout(1100);
    before=await state();await send('touchStart',[start]);
    for(let n=1;n<=12;n++)await send('touchMove',[{x:start.x+(end.x-start.x)*n/12,y:start.y+(end.y-start.y)*n/12,id:1}]);
    await send('touchEnd',[]);
    await check('native touch crosses weapons and releases without opening it',(await state()).playing&&(await state()).opens===before.opens&&(await state()).moves>before.moves);
    await send('touchStart',[start]);await send('touchStart',[start,{...end,id:2}]);
    const contacts=(await state()).contactOrder;
    await check('ignored native secondary contact is recorded before the input guard',contacts.some(row=>row.event==='pointerdown'&&row.trackedPointers===2&&row.primaryFlag===false));
    await check('native two-contact TouchEvent count is recorded',contacts.some(row=>row.event==='touchstart'&&row.reportedTouches===2));
    await send('touchEnd',[start]);
    await check('native second touch on weapons cannot pause the held steering contact',(await state()).playing&&(await state()).opens===before.opens);
    await send('touchEnd',[]);await touch('#weapons');
    await check('native multitouch release restores the next one-finger menu tap',!(await state()).playing);await resume();
    await send('touchStart',[end]);await send('touchMove',[{...end,x:end.x+80}]);await send('touchMove',[end]);await send('touchEnd',[]);
    await check('native control drag away and back is not interpreted as a tap',(await state()).playing);
    await touch('#weapons');
    const scroll=await page.locator('[data-game-scroll]').boundingBox();
    const point={x:scroll.x+scroll.width/2,y:scroll.y+scroll.height-30,id:1};
    await send('touchStart',[point]);for(let n=1;n<=12;n++)await send('touchMove',[{...point,y:point.y-n*15}]);await send('touchEnd',[]);
    await check('paused menu retains native one-finger scrolling with the document locked',await page.locator('[data-game-scroll]').evaluate(node=>node.scrollTop>40)&&await page.evaluate(()=>scrollY===0));
    const settled=await page.locator('[data-game-scroll]').evaluate(node=>new Promise(resolve=>{
      let previous=node.scrollTop,stableAt=performance.now();
      const deadline=setTimeout(()=>resolve(false),4000);
      const poll=()=>{const at=performance.now();if(node.scrollTop!==previous){previous=node.scrollTop;stableAt=at;}
        if(at-stableAt>=350){clearTimeout(deadline);resolve(true);}else requestAnimationFrame(poll);};
      requestAnimationFrame(poll);
    }));
    assert.ok(settled,'native menu momentum settles before the next deliberate tap');
    await resume();
  }
  await check('no JavaScript or recoverable input fault occurred',errors.length===0&&(await state()).faults.length===0);
  result.final=await state();await page.screenshot({path:output+'/input-boundary.png'});result.complete=true;
}catch(error){result.failure=error.message;result.errors=errors.slice(-8);process.exitCode=1;if(page)try{result.last=await page.evaluate(()=>window.__singleFingerQA?.inspect());result.visible=await page.locator('body').innerText();await page.screenshot({path:output+'/failure.png',timeout:5000});}catch{}}
finally{writeFileSync(output+'/verification.json',JSON.stringify(result,null,2)+'\n');console.log('CRYPTOID_SINGLE_FINGER_RESULT '+JSON.stringify(result));if(browser)await browser.close();if(server)await server.close();}
