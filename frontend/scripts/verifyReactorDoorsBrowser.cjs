// Actual old/new React reactor with unchanged production CSS and native clocks.
// This local fixture does not load an account, API, full game or deployment.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {execFileSync}=require('node:child_process');
const assert=require('node:assert/strict');
const {createHash}=require('node:crypto');
const {build}=require('esbuild');
const root=path.resolve(__dirname,'..');
const baseline=process.env.CRYPTOID_REACTOR_BASE||'540d73e7b5a89a3098a6c6404bd3deac8f269cd3';
const software=process.env.CRYPTOID_NATIVE_SOFTWARE==='1';
(async()=>{
  const before=execFileSync('git',['show',baseline+':frontend/src/pages/BossReactorView.tsx'],{cwd:root,encoding:'utf8'});
  const source=`
    import React from 'react';import {createRoot} from 'react-dom/client';import {flushSync} from 'react-dom';
    import Before from './src/pages/BeforeReactor';import After from './src/pages/BossReactorView';
    import {createSectorBoss} from './src/pages/sectorBoss';
    import {startCssFramePacing,cssFramePacingStats} from './src/lib/cssFramePacing';
    import './src/index.css';import './src/fleetMenus.css';
    const roots=['before','after'].map(id=>createRoot(document.getElementById(id)));
    const stop=startCssFramePacing(document.body);
    window.setQa=(id,width,elapsed,volley,closed=false)=>{
      const boss=createSectorBoss(id*10,width,96,825);boss.elapsed=10000;
      if(!closed)boss.turrets.forEach(t=>t.health=0);
      boss.core={elapsed,volley,lastShotColor:'#76aaff'};
      flushSync(()=>roots.forEach((r,i)=>r.render(<div style={{position:'relative',margin:'20px auto',width:boss.width,height:boss.height}}>
        <img style={{position:'absolute',width:'100%',height:'100%'}} src={boss.config.image}/>
        {React.createElement(i?After:Before,{boss})}
      </div>)));
      document.querySelectorAll('section').forEach(s=>s.style.width=width+'px');
    };
    window.freezeQa=time=>document.getAnimations().forEach(a=>{a.pause();a.currentTime=time;});
    window.readQa=()=>({pacing:cssFramePacingStats(),nativeAnimations:document.getAnimations().length,
      reactors:document.querySelectorAll('.boss-special-weapon').length});
    window.clearQa=()=>{flushSync(()=>roots.forEach(r=>r.render(null)));};
    window.stopQa=stop;
  `;
  const bundle=await build({absWorkingDir:root,stdin:{contents:source,resolveDir:root,loader:'tsx'},bundle:true,write:false,
    outdir:'/virtual',platform:'browser',format:'iife',jsx:'automatic',external:['/ships/*','/planets/*','/satellite.svg'],define:{'process.env.NODE_ENV':'"production"'},
    plugins:[{name:'baseline-reactor',setup(b){b.onResolve({filter:/BeforeReactor$/},()=>({path:path.join(root,'src/pages/BeforeReactor.tsx')}));
      b.onLoad({filter:/BeforeReactor\.tsx$/},()=>({contents:before,loader:'tsx'}));
      if(process.env.CRYPTOID_NATIVE_BASELINE_CONTROL==='1')b.onLoad({filter:/BossReactorView\.tsx$/},()=>({contents:before,loader:'tsx'}));}}]});
  const output=new Map(bundle.outputFiles.map(f=>[path.extname(f.path),f.text]));
  const html='<!doctype html><meta charset="utf-8"><link rel="stylesheet" href="/qa.css"><style>body{margin:0;background:#050b18}section{position:absolute;left:0;top:0;height:420px;background:#050b18}</style><section id="before"></section><section id="after"></section><script src="/qa.js"></script>';
  const server=http.createServer((req,res)=>{
    const pathname=new URL(req.url,'http://localhost').pathname;
    if(pathname==='/'){res.setHeader('Content-Type','text/html');return res.end(html);}
    if(pathname==='/qa.js'||pathname==='/qa.css'){
      res.setHeader('Content-Type',pathname.endsWith('js')?'text/javascript':'text/css');return res.end(output.get(pathname.endsWith('js')?'.js':'.css'));
    }
    const asset=path.resolve(root,'public','.'+pathname);
    if(asset.startsWith(path.join(root,'public')+path.sep)&&fs.existsSync(asset)&&fs.statSync(asset).isFile()){
      if(asset.endsWith('.webp'))res.setHeader('Content-Type','image/webp');return fs.createReadStream(asset).pipe(res);
    }
    res.statusCode=404;res.end();
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const {chromium}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright');
  let browser;
  try{
    const serverless=await import(process.env.CRYPTOID_CHROMIUM_PACKAGE||'/tmp/cryptoid-boss-native-qa/node_modules/@sparticuz/chromium/build/index.js');
    browser=await chromium.launch({executablePath:process.env.CRYPTOID_CHROMIUM_EXECUTABLE||'/tmp/cryptoid-boss-native-runtime/chromium',headless:true,
      args:[...serverless.default.args,...(software?['--disable-gpu','--disable-accelerated-2d-canvas']:[])]});
    const page=await browser.newPage({viewport:{width:900,height:440},deviceScaleFactor:1.5});
    const errors=[];page.on('pageerror',e=>errors.push(String(e)));
    await page.goto('http://127.0.0.1:'+server.address().port+'/');
    const settle=()=>page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(resolve)));
    let domComparisons=0,pixelComparisons=0;
    const pixelMismatches=[];
    const {createCanvas,loadImage}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/@napi-rs/canvas');
    const cases=[[0,0,true],[0,0,false],[450,0,false],[899,0,false],[180,1,false],[1000,1,false],[50,1,false]];
    for(let id=1;id<=50;id++)for(const width of [320,430,820])for(const [elapsed,volley,closed] of cases){
      await page.evaluate(p=>window.setQa(...p),[id,width,elapsed,volley,closed]);await settle();
      await page.evaluate(async()=>{await Promise.all([...document.images].map(i=>i.decode()));});
      const trees=await page.evaluate(()=>['before','after'].map(id=>{
        const el=document.querySelector('#'+id+' svg');const first=el.querySelector('linearGradient').id;
        return el.outerHTML.replaceAll(first.slice(0,-'-steel'.length),'reactor-id');
      }));
      assert.equal(trees[1],trees[0],`native DOM boss ${id}, width ${width}, elapsed ${elapsed}, closed ${closed}`);domComparisons++;
      if([1,2,3,7,50].includes(id)&&[450,1000,50].includes(elapsed))for(const pulseTime of [0,550]){
        await page.evaluate(time=>window.freezeQa(time),pulseTime);
        // Compare the same physical origin and fixed native animation phase.
        const show=id=>page.evaluate(id=>document.querySelectorAll('section').forEach(s=>s.style.visibility=s.id===id?'visible':'hidden'),id);
        await show('before');const beforePixels=await page.locator('#before').screenshot({animations:'allow'});
        await show('after');const afterPixels=await page.locator('#after').screenshot({animations:'allow'});
        const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
        if(hash(afterPixels)!==hash(beforePixels)){
          const rgba=await Promise.all([beforePixels,afterPixels].map(async bytes=>{
            const image=await loadImage(bytes),canvas=createCanvas(image.width,image.height),ctx=canvas.getContext('2d');
            ctx.drawImage(image,0,0);return ctx.getImageData(0,0,image.width,image.height).data;
          }));
          let differentPixels=0;const maxChannels=[0,0,0,0];
          for(let i=0;i<rgba[0].length;i+=4){let differs=false;for(let c=0;c<4;c++){
            const delta=Math.abs(rgba[0][i+c]-rgba[1][i+c]);maxChannels[c]=Math.max(maxChannels[c],delta);differs||=delta>0;
          }if(differs)differentPixels++;}
          pixelMismatches.push({id,width,elapsed,pulseTime,differentPixels,maxChannels});
        }
        pixelComparisons++;
      }
    }
    // Fresh native clocks: updates must neither replace the pulse/images nor
    // restart the CSS animation. No animation seeking in this independent test.
    await page.reload();await page.evaluate(()=>window.setQa(2,430,180,1));await settle();
    await page.evaluate(()=>{window.nativeReferences=['before','after'].map(id=>{
      const reactor=document.querySelector('#'+id+' svg');const pulse=reactor.querySelector('.boss-reactor-pulse');
      return {reactor,pulse,images:[...reactor.querySelectorAll('image')],animation:pulse.getAnimations()[0]};
    });});
    for(let frame=1;frame<=120;frame++){
      await page.evaluate(frame=>window.setQa(2,430,180+frame*10,1),frame);await settle();
      const continuous=await page.evaluate(()=>window.nativeReferences.every(ref=>{
        const animation=ref.pulse.getAnimations()[0];
        return ref.reactor.isConnected&&ref.pulse.isConnected&&ref.images.every(n=>n.isConnected)
          &&animation===ref.animation&&animation.playState==='running';
      }));
      assert.equal(continuous,true,`native pulse/image lifetime frame ${frame}`);
    }
    const progressed=await page.evaluate(()=>window.nativeReferences.every(ref=>Number(ref.animation.currentTime)>500));
    assert.equal(progressed,true,'native pulse clock advances through charge updates');
    await page.evaluate(()=>window.clearQa());await settle();await settle();
    const cleanup=await page.evaluate(()=>window.readQa());
    assert.equal(cleanup.nativeAnimations,0);assert.equal(cleanup.pacing.active,0);assert.equal(cleanup.reactors,0);assert.deepEqual(errors,[]);
    await page.evaluate(()=>window.stopQa());
    const result={passed:pixelMismatches.length===0,structuralAndLifetimePassed:true,browser:await browser.version(),softwareFlags:software,baseline,baselineSelfControl:process.env.CRYPTOID_NATIVE_BASELINE_CONTROL==='1',
      domComparisons,pixelComparisons,pixelMismatches,pixelCapture:'Exact PNG hashes, same physical origin, paused native pulse at 0/550 ms; no tolerance',
      bosses:50,widths:[320,430,820],nativeChargeUpdates:120,samePulseImagesAndAnimation:true,nativePulseClockProgressed:progressed,cleanup,pageErrors:errors,
      limits:'Isolated React reactor/hull with unchanged production CSS in Linux Chromium. Controlled raster comparisons; no Safari/WebKit, physical iPhone memory/heat/FPS or Whitescreen-fix proof.'};
    if(process.env.CRYPTOID_NATIVE_REACTOR_REPORT)fs.writeFileSync(process.env.CRYPTOID_NATIVE_REACTOR_REPORT,JSON.stringify(result,null,2)+'\n');
    console.log(JSON.stringify(result,null,2));
    if(!result.passed)process.exitCode=1;
  }finally{await browser?.close();await new Promise(resolve=>server.close(resolve));}
})().catch(error=>{console.error(error);process.exitCode=1;});
