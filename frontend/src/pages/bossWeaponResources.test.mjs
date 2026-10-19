import test from 'node:test';
import assert from 'node:assert/strict';
import {createSectorBoss} from './sectorBoss.ts';
import {drawBossWeapons,disposeBossWeapons} from './bossWeaponRenderer.ts';

function fixture(fail=()=>false){
 const allocated=[],draws=[];
 const context=new Proxy({drawImage:(image)=>draws.push(image)},{get:(target,key)=>key in target?target[key]:()=>{}});
 const make=(width=600,height=400)=>{const canvas={width,height,getContext:()=>fail(allocated.indexOf(canvas))?null:context};allocated.push(canvas);return canvas;};
 return {allocated,draws,make};
}
test('a missing base context releases its allocation and retries successfully',()=>{
 let missing=true;const f=fixture(()=>missing),canvas={width:600,height:400,getContext:()=>({})},boss=createSectorBoss(20,430,90,825),atlas={};
 assert.equal(drawBossWeapons(canvas,boss,atlas,false,f.make),false);
 assert.equal(f.allocated.length,1);assert.equal(f.allocated[0].width,0);assert.equal(f.allocated[0].height,0);
 missing=false;canvas.getContext=f.make().getContext;
 assert.equal(drawBossWeapons(canvas,boss,atlas,false,f.make),true);disposeBossWeapons(canvas);
});
test('failed heat contexts use the atlas and release failed surfaces instead of drawing empty canvases',()=>{
 const f=fixture(index=>index>0),canvas={width:600,height:400,getContext:()=>new Proxy({drawImage:image=>f.draws.push(image)},{get:(o,k)=>k in o?o[k]:()=>{}})},boss=createSectorBoss(20,430,90,825),atlas={};
 boss.turrets.forEach(t=>{t.health=t.maxHealth*.5;});
 assert.equal(drawBossWeapons(canvas,boss,atlas,false,f.make),true);
 assert.equal(f.allocated.length,1+boss.turrets.length);
 for(const failed of f.allocated.slice(1)){assert.equal(failed.width,0);assert.equal(failed.height,0);assert.equal(f.draws.includes(failed),false);}
 assert.ok(f.draws.includes(atlas));disposeBossWeapons(canvas);
});
test('same image reuses the base; changed image/logical dimensions dispose and rebuild it',()=>{
 const f=fixture(),canvas=f.make(),boss=createSectorBoss(20,430,90,825),atlas={};
 drawBossWeapons(canvas,boss,atlas,false,f.make);const original=f.allocated[1],count=f.allocated.length;
 drawBossWeapons(canvas,boss,atlas,false,f.make);assert.equal(f.allocated.length,count);
 const replacement={};drawBossWeapons(canvas,boss,replacement,false,f.make);assert.equal(f.allocated.length,count+1);assert.equal(original.width,0);assert.equal(original.height,0);
 const previous=f.allocated.at(-1);boss.width+=.01;
 drawBossWeapons(canvas,boss,replacement,false,f.make);assert.equal(f.allocated.length,count+2);assert.equal(previous.width,0);assert.equal(previous.height,0);
 disposeBossWeapons(canvas);for(const c of f.allocated){assert.equal(c.width,0);assert.equal(c.height,0);}
});
