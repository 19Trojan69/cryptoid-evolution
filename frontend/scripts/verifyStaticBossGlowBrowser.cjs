// Native Chromium lifetime check of static boss glow with production CSS.
// No app account/API routes, deployment or physical iPhone measurements.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const assert=require('node:assert/strict');
const {build}=require('esbuild');
const root=path.resolve(__dirname,'..');
(async()=>{
  const source=`
    import React from 'react';import {createRoot} from 'react-dom/client';import {flushSync} from 'react-dom';
    import Before from './src/pages/BossReactorView';import After from './src/pages/BossReactorView';
    import HullDamage from './src/pages/HullDamage';import {createSectorBoss} from './src/pages/sectorBoss';
    import {startCssFramePacing,cssFramePacingStats} from './src/lib/cssFramePacing';
    import './src/index.css';import './src/fleetMenus.css';
    const roots=['before','after'].map(id=>createRoot(document.getElementById(id)));
    const stop=startCssFramePacing(document.body);
    window.setQa=(id,width,elapsed,volley,hitId=1)=>{
      const boss=createSectorBoss(id*10,width,96,825);boss.elapsed=10000;boss.turrets.forEach(t=>t.health=0);
      boss.health=boss.maxHealth*.28;boss.core={elapsed,volley,lastShotColor:'#76aaff'};
      const sites=Array.from({length:8},(_,i)=>({id:i+1,revision:hitId+i,x:20+i%4*20,y:30+Math.floor(i/4)*30}));
      flushSync(()=>roots.forEach((r,i)=>r.render(<div className="sector-boss asteroid" style={{left:width/2,top:160,width:boss.width,height:boss.height,transform:'translate(-50%,-50%)'}}>
        <img className="boss-hull" src={boss.config.image}/>{React.createElement(i?After:Before,{boss})}
        <HullDamage sites={sites} hit={{id:hitId,x:50,y:60,impactPower:3}} maskImage={"url('"+boss.config.image+"')"} bossDamage={.72}/>
      </div>)));
      document.querySelectorAll('section').forEach(s=>s.style.width=width+'px');
    };
    window.freezeQa=()=>{document.getAnimations().forEach(a=>{a.pause();a.currentTime=250;});};
    window.readQa=()=>({pacing:cssFramePacingStats(),nativeAnimations:document.getAnimations().length,
      hotspots:document.querySelectorAll('.hull-hotspot').length,bursts:document.querySelectorAll('.hull-mini-explosion').length});
    window.glowQa=()=>({node:document.querySelector('.boss-static-heat .hull-hotspot'), animations:[...document.querySelectorAll('.boss-static-heat')].reduce((n,e)=>n+e.getAnimations({subtree:true}).length,0)});
    window.clearQa=()=>{flushSync(()=>roots.forEach(r=>r.render(null)));};
    window.stopQa=stop;
  `;
  const bundle=await build({absWorkingDir:root,stdin:{contents:source,resolveDir:root,loader:'tsx'},bundle:true,write:false,
    outdir:'/virtual',platform:'browser',format:'iife',jsx:'automatic',external:['/ships/*','/planets/*','/satellite.svg'],define:{'process.env.NODE_ENV':'"production"'},
  });
  const output=new Map(bundle.outputFiles.map(f=>[path.extname(f.path),f.text]));
  const html='<!doctype html><meta charset="utf-8"><link rel="stylesheet" href="/qa.css"><style>body{margin:0;background:#050b18}section{position:absolute;left:0;top:0;height:340px;background:#050b18}</style><section id="before"></section><section id="after"></section><script src="/qa.js"></script>';
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
    browser=await chromium.launch({executablePath:process.env.CRYPTOID_CHROMIUM_EXECUTABLE||'/tmp/cryptoid-boss-native-runtime/chromium',headless:true,args:serverless.default.args});
    const page=await browser.newPage({viewport:{width:1700,height:420},deviceScaleFactor:1.5});
    const errors=[];page.on('pageerror',e=>errors.push(String(e)));
    await page.goto('http://127.0.0.1:'+server.address().port+'/');
    const settle=()=>page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
    let maxController=0, bossWidthCases=0;
    for(let id=1;id<=50;id++)for(const width of [320,430,820]){
      await page.evaluate(p=>window.setQa(...p),[id,width,1000,1,1]);await settle();
      await page.evaluate(()=>window.firstGlow=window.glowQa().node);
      await page.evaluate(p=>window.setQa(...p),[id,width,1000,1,2]);await settle();
      const glow=await page.evaluate(()=>({stable:window.firstGlow===window.glowQa().node,animations:window.glowQa().animations}));
      assert.equal(glow.stable,true);assert.equal(glow.animations,0);bossWidthCases++;
    }
    await page.reload();
    await page.evaluate(()=>{window.setQa(2,430,500,1,1);window.firstGlow=window.glowQa().node;});
    // Let native cancellation events run after rapid actual React replacements.
    for(let hit=1;hit<=500;hit++){
      await page.evaluate(p=>window.setQa(2,430,500+p%1600,1,p),hit);await settle();
      const state=await page.evaluate(()=>window.readQa());maxController=Math.max(maxController,state.pacing.active);
      const glow=await page.evaluate(()=>({stable:window.firstGlow===window.glowQa().node,animations:window.glowQa().animations}));
      assert.equal(glow.stable,true,'boss heat site survives successive hits');assert.equal(glow.animations,0,'boss glow has no native CSS animations, including pseudos');
      assert.equal(state.hotspots,16);assert.equal(state.bursts,2);assert.ok(state.pacing.active<100,'native event cleanup stays bounded');
    }
    await page.evaluate(()=>window.clearQa());await settle();
    const cleanup=await page.evaluate(()=>window.readQa());
    assert.equal(cleanup.nativeAnimations,0);assert.equal(cleanup.pacing.active,0);assert.deepEqual(errors,[]);
    await page.evaluate(()=>window.stopQa());
    const result={passed:true,browser:await browser.version(),bossWidthCases,staticBossGlow:{animations:0,stableSites:true},actualHitReplacements:500,maxControllerEntries:maxController,cleanup,pageErrors:errors,
      limits:'Native Linux Chromium with software rendering. No Safari/WebKit, physical iPhone memory/heat/FPS or Whitescreen-cause proof.'};
    if(process.env.CRYPTOID_NATIVE_GLOW_REPORT)fs.writeFileSync(process.env.CRYPTOID_NATIVE_GLOW_REPORT,JSON.stringify(result,null,2)+'\n');
    console.log(JSON.stringify(result,null,2));
  }finally{await browser?.close();await new Promise(resolve=>server.close(resolve));}
})().catch(error=>{console.error(error);process.exitCode=1;});
