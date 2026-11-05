import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {stripTypeScriptTypes} from 'node:module';

// Use the exact shipping style constructor, only while the normal game is paused.
// The prototype is cloned from already mounted/prepared artwork; no new image URL.
export async function verifyEnemyMotionFidelity({page,guard}) {
 await guard();
 const helper=stripTypeScriptTypes(readFileSync(new URL('./presentation.ts',import.meta.url),'utf8')).replace('export function','function');
 const originalMedia=await page.evaluate(()=>matchMedia('(prefers-reduced-motion:reduce)').matches);
 const rows=[];
 try {
  for(const setting of ['ordinary','html-reduced','media-reduced']) {
   await page.emulateMedia({reducedMotion:setting==='media-reduced'?'reduce':'no-preference'});
   await guard();
   rows.push(await page.evaluate(({helper,setting})=>{
    const styleFor=new Function(helper+';return enemyMotionStyles;')();
    const field=document.querySelector('.game-field');
    const original=document.querySelector('.player-ship .ship-visual');
    if(!field||!original)throw Error('Existing prepared scene required');
    const previousMotion=document.documentElement.getAttribute('data-motion');
    const host=document.createElement('div');host.className='asteroid cryptoid cryptoid-light';
    host.style.cssText='left:160px;top:220px;width:132px;height:132px;transform:translate(-50%,-50%)';
    const visual=original.cloneNode(true);visual.removeAttribute('data-direct-enemy-motion');
    visual.querySelectorAll('.player-muzzle-flash,.hull-heat-layer,.hull-mini-explosion').forEach(x=>x.remove());
    const engines=[...visual.querySelectorAll('.player-engine')];engines.forEach(x=>x.className='exhaust ship-thruster');
    const reflection=visual.querySelector('.hull-reflection');
    if(!engines.length||!reflection)throw Error('Original ship consumer shape required');
    host.append(visual);field.append(host);
    const nodes=[host,...host.querySelectorAll('*')],saved=nodes.map(x=>x.style.cssText);
    const snapshot=()=>nodes.map(n=>{
     const s=getComputedStyle(n),r=n.getBoundingClientRect();
     return {style:[...s].filter(k=>!k.startsWith('--')).map(k=>[k,s.getPropertyValue(k)]),box:[r.x,r.y,r.width,r.height]};
    });
    const same=(a,b,message)=>{if(JSON.stringify(a)!==JSON.stringify(b))throw Error(message);};
    const values=[[0,'5%',0],[-17.25,'19.125%',.125],[23.8125,'13%',.85],[0,'33.333333333333336%',.5],[9.125,'0%',0],[-.001,'9.01%',.375],[0,'5%',0],[18,'17.125%',.01]];
    const cases=[];
    try {
     if(setting==='html-reduced')document.documentElement.setAttribute('data-motion','reduced');
     else document.documentElement.setAttribute('data-motion','full');
     // A preference change legitimately cancels/recreates some authored CSS
     // animations. Compare identities only within that fixed preference mode.
     const originalAnimations=document.getAnimations().map(a=>({a,start:a.startTime,rate:a.playbackRate}));
     for(const[bank,flame,light]of values){
      nodes.forEach((n,i)=>n.style.cssText=saved[i]);visual.removeAttribute('data-direct-enemy-motion');
      host.style.setProperty('--visual-bank',bank+'deg');host.style.setProperty('--flame-length',flame);host.style.setProperty('--hull-light',String(light));
      const expected=snapshot();
      for(const p of ['--visual-bank','--flame-length','--hull-light'])host.style.removeProperty(p);
      const direct=styleFor(bank,flame,light);visual.setAttribute('data-direct-enemy-motion','true');
      Object.assign(visual.style,direct.visual);engines.forEach(e=>Object.assign(e.style,direct.engine));Object.assign(reflection.style,direct.reflection);
      same(snapshot(),expected,'Computed presentation/geometry changed: '+setting+' '+JSON.stringify([bank,flame,light]));
      if(nodes.some((n,i)=>i&&n.style.getPropertyValue('--visual-bank')))throw Error('Moving bank still uses inherited live data');
      cases.push({bank,flame,light,computedStylesAndGeometryExactlyEqual:true});
     }
     if(nodes.some((n,i)=>[host,...host.querySelectorAll('*')][i]!==n))throw Error('Existing nodes replaced');
     const now=document.getAnimations();
     if(originalAnimations.some(x=>!now.includes(x.a)||x.a.startTime!==x.start||x.a.playbackRate!==x.rate))throw Error('Existing animation identity or timing changed within the same motion mode');
    } finally {
     host.remove();
     if(previousMotion===null)document.documentElement.removeAttribute('data-motion');else document.documentElement.setAttribute('data-motion',previousMotion);
    }
    return {setting,cases,nodesCompared:nodes.length,existingAnimationsRetainedWithinMotionMode:true};
   },{helper,setting}));
  }
 }finally{await page.emulateMedia({reducedMotion:originalMedia?'reduce':'no-preference'});}
 await guard();assert.equal(rows.reduce((n,x)=>n+x.cases.length,0),24);
 return {rows,actualAlreadyPreparedArtworkPrototype:true,consumerConstructorIsShippingSource:true,
  rootLiveCustomPropertiesRemoved:true,fullPixelIdentityMeasured:false,nativeCacheEntriesMeasured:false,
  nativeMemoryBenefitMeasured:false,performedOnlyDuringRegularPause:true};
}
