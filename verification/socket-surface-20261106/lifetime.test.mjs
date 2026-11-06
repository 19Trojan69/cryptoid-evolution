import test from 'node:test';
import assert from 'node:assert/strict';
import {code,candidate,original} from './source.mjs';
const api=(source,userAgent)=>Function('navigator','return '+code(source))(userAgent===undefined?undefined:{userAgent});
const context=()=>new Proxy({},{get:()=>()=>{}});
const canvas=(width,height,denied=false)=>({width,height,getContext:()=>denied?null:context()});
function model(api){const config=api.bossManifest[0];return {config,width:344,height:129,weaponClock:3000,turrets:api.bossWeapons[0].map(g=>({health:100,maxHealth:100,a:g.base,lastFired:0,lock:0,firedBarrels:[0]}))};}
for(const [name,ua,reduced] of [
 ['Chromium Android','Mozilla/5.0 (Linux; Android 15) AppleWebKit/537.36 Chrome/151.0 Mobile Safari/537.36',true],
 ['headless Chromium','Mozilla/5.0 HeadlessChrome/151.0.7922.34 Safari/537.36',true],
 ['desktop Chrome','Mozilla/5.0 Chrome/151.0 Safari/537.36',true],
 ['Safari','Mozilla/5.0 AppleWebKit/605.1.15 Version/26.5 Safari/605.1.15',false],
 ['iOS Chrome','Mozilla/5.0 AppleWebKit/605.1.15 CriOS/151.0 Mobile/15E148 Safari/604.1',false],
 ['iOS Chrome with compatibility token','Mozilla/5.0 Chrome/151.0 CriOS/151.0 Safari/605.1.15',false],
 ['Firefox','Mozilla/5.0 Gecko/20100101 Firefox/145.0',false],
 ['absent browser',undefined,false],
])test(name+' uses only its verified socket allocation path',()=>{
 const sizes=[];
 for(const source of [original,candidate]){
  const renderer=api(source,ua),boss=model(renderer),out=canvas(496,310),owned=[];
  assert.equal(renderer.drawBossWeapons(out,boss,{},false,(w,h)=>{const c=canvas(w,h);owned.push(c);return c;}),true);
  sizes.push(owned[0].width*owned[0].height);
  const count=owned.length;assert.equal(renderer.drawBossWeapons(out,boss,{},false,(w,h)=>{const c=canvas(w,h);owned.push(c);return c;}),true);assert.equal(owned.length,count);
  renderer.disposeBossWeapons(out);assert.ok([...owned,out].every(c=>c.width===0&&c.height===0));
 }
 if(reduced)assert.ok(sizes[1]<sizes[0]);else assert.equal(sizes[1],sizes[0]);
});
test('denied socket context releases the smaller allocation and permits an ordinary retry',()=>{
 const renderer=api(candidate,'Chrome/151.0'),boss=model(renderer),out=canvas(496,310),owned=[];
 assert.equal(renderer.drawBossWeapons(out,boss,{},false,(w,h)=>{const c=canvas(w,h,true);owned.push(c);return c;}),false);
 assert.ok(owned.every(c=>c.width===0&&c.height===0));
 assert.equal(renderer.drawBossWeapons(out,boss,{},false,(w,h)=>{const c=canvas(w,h);owned.push(c);return c;}),true);
 renderer.releaseBossWeaponSources(out);assert.ok(owned.every(c=>c.width===0&&c.height===0));
 assert.equal(renderer.drawBossWeapons(out,boss,{},false,(w,h)=>{const c=canvas(w,h);owned.push(c);return c;}),true);
 renderer.disposeBossWeapons(out);assert.ok([...owned,out].every(c=>c.width===0&&c.height===0));
});
