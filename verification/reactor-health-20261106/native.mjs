import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
import {createSectorBoss} from '../../frontend/src/pages/sectorBoss.ts';
import {specialWeaponBox} from '../../frontend/src/pages/bossSpecialWeapon.ts';
import {reactorHealthPosition} from '../../frontend/src/pages/bossHealthLayout.ts';
const require=createRequire(new URL('../transition-motion-20261106/package.json',import.meta.url));
const pw=require('playwright'),engine=process.argv[2];
const browser=await pw[engine].launch({headless:true});
let oldArea=0,newArea=0,cases=0;
try{
 const page=await browser.newPage();await page.route('**/*',r=>r.abort());
 const css=readFileSync(new URL('../../frontend/src/index.css',import.meta.url),'utf8');
 await page.setContent(`<style>${css}</style><div class="asteroid sector-boss" style="position:relative"><span class="health-bar"><b></b><small class="boss-health-readout">100%</small></span><span class="boss-reactor-health"><b></b><small>◈ 100%</small></span></div>`);
 for(const [width,height] of [[320,568],[390,760],[1366,768]])for(let id=1;id<=50;id++){
  const boss=createSectorBoss(id*10,width,90,height),box=specialWeaponBox(boss),position=reactorHealthPosition(boss);
  assert.equal(position.left,box.left+box.width/2);assert.ok(position.width>=52&&position.width<=76);
  const result=await page.evaluate(({w,h,position})=>{
   const parent=document.querySelector('.sector-boss'),bar=document.querySelector('.boss-reactor-health');
   parent.style.width=w+'px';parent.style.height=h+'px';
   for(const k of ['left','top','width'])bar.style[k]=position[k]+'px';
   const a=document.querySelector('.health-bar').getBoundingClientRect(),b=bar.getBoundingClientRect(),s=getComputedStyle(bar);
   return {oldArea:a.width*a.height,newArea:b.width*b.height,radius:s.borderRadius,childRadius:getComputedStyle(bar.firstChild).borderRadius,font:getComputedStyle(bar.lastChild).fontSize};
  },{w:boss.width,h:boss.height,position});
  assert.equal(result.radius,'0px');assert.equal(result.childRadius,'0px');assert.equal(result.font,'10px');
  assert.ok(result.newArea<result.oldArea);oldArea+=result.oldArea;newArea+=result.newArea;cases++;
 }
 console.log(JSON.stringify({engine,cases,oldArea,newArea,barAreaReduction:1-newArea/oldArea,totalGameRamMeasured:false,whiteScreenFixed:false}));
}finally{await browser.close();}
