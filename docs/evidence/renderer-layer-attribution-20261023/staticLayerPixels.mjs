// Synthetic frozen DOM comparison. Never loaded by the application.
import {writeFileSync} from 'node:fs';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {PNG}=require('pngjs');
async function setCandidate(page,target,hint){
  await page.evaluate(({target,hint})=>{
    if(target==='.static-starfield-cache'){
      const old=document.querySelector(target);
      if(!hint&&old){const dynamic=old.nextElementSibling;dynamic.prepend(...old.querySelector('.starfield').childNodes);old.remove();}
      if(hint&&!old){
        const dynamic=document.querySelector('.starfield');
        const group=document.createElement('div');group.className='static-starfield-cache';group.setAttribute('aria-hidden','true');
        Object.assign(group.style,{position:'absolute',inset:'0',zIndex:'0',pointerEvents:'none',background:'inherit',willChange:'transform'});
        const background=dynamic.cloneNode(false);background.removeAttribute('aria-hidden');
        for(const child of [...dynamic.children])if(child.matches('.nebula-field,.milky-band'))background.append(child);
        group.append(background);dynamic.before(group);
      }
    }else if(target==='.game-background-cache'){
      const old=document.querySelector(target);
      if(!hint&&old)old.replaceWith(...old.childNodes);
      if(hint&&!old){
        const starfield=document.querySelector('.starfield'),scene=document.querySelector('.space-scene');
        const group=document.createElement('div');group.className='game-background-cache';group.setAttribute('aria-hidden','true');
        Object.assign(group.style,{position:'absolute',inset:'0',zIndex:'0',pointerEvents:'none',background:'inherit',willChange:'transform'});
        starfield.before(group);group.append(starfield,scene);
      }
    }else document.querySelector(target).style.willChange=hint||'auto';
    for(const animation of document.getAnimations()){animation.pause();animation.currentTime=1000;}
  },{target,hint});
  await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
}
function comparePixels(before,after,path){
  const a=PNG.sync.read(before),b=PNG.sync.read(after);
  if(a.width!==b.width||a.height!==b.height)throw new Error('Pixel comparison dimensions changed');
  let differentPixels=0,maxChannelDelta=0,absoluteChannelDelta=0;
  const diff=new PNG({width:a.width,height:a.height});
  for(let i=0;i<a.data.length;i+=4){
    let differs=false;
    for(let j=0;j<4;j++){const delta=Math.abs(a.data[i+j]-b.data[i+j]);if(delta)differs=true;maxChannelDelta=Math.max(maxChannelDelta,delta);absoluteChannelDelta+=delta;diff.data[i+j]=j===3?255:delta;}
    if(differs)differentPixels++;
  }
  if(differentPixels)writeFileSync(path,PNG.sync.write(diff));
  return {width:a.width,height:a.height,differentPixels,maxChannelDelta,absoluteChannelDelta,exact:!differentPixels};
}

export async function captureFrozenScene(page){
  return page.evaluate(()=>{
    const source=document.getElementById('root');
    const copy=source.cloneNode(true);
    const sources=[...source.querySelectorAll('canvas')];
    const copies=[...copy.querySelectorAll('canvas')];
    copies.forEach((canvas,index)=>{
      const image=document.createElement('img');
      for(const attr of canvas.attributes)image.setAttribute(attr.name,attr.value);
      image.src=sources[index].toDataURL();canvas.replaceWith(image);
    });
    return copy.outerHTML;
  });
}

export async function compareFrozenLayer(page,html,root,tag){
  const target=process.env.SCENE_PIXEL_TARGET||'.milky-band';
  if(!['.milky-band','.starfield','.game-field','.game-background-cache','.static-starfield-cache'].includes(target))throw new Error('Unknown pixel target');
  const report={synthetic:true,liveGameplay:false,layer:target,candidate:'will-change hints',pairs:[]};
  await page.evaluate(html=>{document.getElementById('root').outerHTML=html;document.getElementById('audio-start')?.remove();},html);
  const short=process.env.SCENE_PIXEL_SHORT==='1';
  const hints=(process.env.SCENE_PIXEL_HINTS||'transform').split(',');
  if(hints.some(h=>!['transform','opacity','filter'].includes(h)))throw new Error('Unsupported compositor hint');
  for(const viewport of (short?[{width:430,height:825}]:[{width:430,height:825},{width:1024,height:768}])){
    await page.setViewportSize(viewport);
    for(const palette of (short?[2]:[1,2])){
      await page.evaluate(({palette,target})=>{
        for(const field of document.querySelectorAll('.starfield'))field.className='starfield starfield-sector-'+palette;
        for(const animation of document.getAnimations()){animation.pause();animation.currentTime=1000;}
      },{palette,target});
      await setCandidate(page,target,null);
      await page.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].map(image=>image.decode().catch(()=>{})));});
      await page.waitForTimeout(500);
      const label=tag+'-'+viewport.width+'x'+viewport.height+'-palette'+palette;
      await page.screenshot();
      let before=await page.screenshot({path:root+'pixel-'+label+'-original.png'});
      await page.waitForTimeout(500);
      const control=await page.screenshot();
      const controlResult=comparePixels(before,control,root+'pixel-'+label+'-control-diff.png');
      report.pairs.push({viewport,palette,hint:'unchanged-control',...controlResult});
      if(!controlResult.exact){
        const settled=await page.screenshot();
        const secondControl=comparePixels(control,settled,root+'pixel-'+label+'-settled-control-diff.png');
        report.pairs.push({viewport,palette,hint:'settled-control',...secondControl});
        if(!secondControl.exact){report.aborted='Frozen DOM did not settle';return report;}
        before=settled;writeFileSync(root+'pixel-'+label+'-original.png',before);
      }
      for(const hint of hints){
        await setCandidate(page,target,hint);
        await page.waitForTimeout(500);
        const after=await page.screenshot({path:root+'pixel-'+label+'-cached-'+hint+'.png'});
        const row={viewport,palette,hint,...comparePixels(before,after,root+'pixel-'+label+'-diff-'+hint+'.png')};
        report.pairs.push(row);console.log(JSON.stringify({pixelLayer:row}));
        await setCandidate(page,target,null);
        await page.waitForTimeout(500);
        const reverted=await page.screenshot();
        report.pairs.push({viewport,palette,hint:'reverted-'+hint,...comparePixels(before,reverted,root+'pixel-'+label+'-revert-'+hint+'-diff.png')});
      }
    }
  }
  return report;
}
