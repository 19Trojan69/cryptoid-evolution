import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),pw=require('playwright');
const engine=process.argv[2];assert.ok(['chromium','webkit'].includes(engine));
const browser=await pw[engine].launch({headless:true});
try{
 const page=await browser.newPage();
 await page.route('**/*',r=>r.abort());
 const css=readFileSync(new URL('../../frontend/src/index.css',import.meta.url),'utf8');
 await page.setContent(`<style>${css}</style><main class="game-shell" data-effects-paused="true"><div class="blockchain-progress"><div class="blockchain-node active"><span class="blockchain-cube-rotor"><span class="blockchain-cube-body"></span></span></div><div class="blockchain-binary-track"><span>10101010101010101010</span><span>10101010101010101010</span></div></div><div class="formation-data-stream">${Array.from({length:5},()=>'<div class="formation-data-row"><span>10101010101010101010</span><span>10101010101010101010</span></div>').join('')}</div><i class="hull-hotspot"></i></main>`);
 const result=await page.evaluate(()=>{
  const style=q=>getComputedStyle(document.querySelector(q));
  const rotor=document.querySelector('.blockchain-cube-rotor');
  const animation=rotor.getAnimations().find(a=>a.animationName==='blockchain-cube-turn');
  if(!animation)throw Error('Cube has no native rotation');
  animation.pause();animation.currentTime=100;const first=getComputedStyle(rotor).transform;animation.currentTime=1700;const second=getComputedStyle(rotor).transform;
  return {cubePlayState:style('.blockchain-cube-rotor').animationPlayState,first,second,
   single:style('.blockchain-binary-track').animationDirection,
   rows:Array.from(document.querySelectorAll('.formation-data-row'),e=>getComputedStyle(e).animationDirection),
   combatEffectPaused:style('.hull-hotspot').animationPlayState};
 });
 // Manual inspection above pauses only the observed animation object.
 assert.notEqual(result.first,result.second);
 assert.equal(result.single,'reverse');
 assert.deepEqual(result.rows,['reverse','normal','reverse','normal','reverse']);
 assert.equal(result.combatEffectPaused,'paused');
 await page.emulateMedia({reducedMotion:'reduce'});
 assert.equal(await page.locator('.blockchain-cube-rotor').evaluate(e=>getComputedStyle(e).animationName),'none');
 console.log(JSON.stringify({engine,rotationChanges:true,singleRight:true,rowsLeftRightAlternating:true,combatPauseRetained:true,reducedMotionRetained:true}));
}finally{await browser.close();}
