import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createSectorBoss,moveSectorBoss,bossHullExposed,damageSectorBoss,BOSS_ENTRY_MS} from './sectorBoss.ts';
import {advanceBossTurrets,damageBossTurret,gunPosition} from './bossTurrets.ts';
import {advanceBossCore} from './bossCore.ts';
import {advanceEnemyShot,enemyShotOutsideField,enemyShotHitsPlayer} from './enemyFire.ts';
import {contactWithBoss} from './bossContact.ts';
import {bossHitTarget} from './bossHitTarget.ts';
import {specialWeaponBox,specialWeaponMuzzle} from './bossSpecialWeapon.ts';
import {insectBossSchedule,insectDifficulty,insectLayout,ESCAPE_CENTER_WIDTH,INSECT_LOCK_MS} from './insectBoss.ts';
import {PLAYER_RADIUS,PLAYER_CONTACT_RADIUS,placePlayer} from './playerCombat.ts';

const views=[[320,568,80],[375,667,80],[390,760,90],[430,820,90],[768,920,90],[1024,600,60],[844,360,60]];

test('exact 50-mission schedule; reference opt-in never replaces legacy bosses or later slots',()=>{
 assert.equal(insectBossSchedule.length,50);assert.equal(new Set(insectBossSchedule.map(x=>x.name)).size,50);
 assert.deepEqual(insectBossSchedule.map(x=>x.level),Array.from({length:50},(_,i)=>10+i*10));
 for(let level=10;level<=500;level+=10){
  const old=createSectorBoss(level,390,90,760),opt=createSectorBoss(level,390,90,760,true);
  if(level===60){assert.ok(opt.insect);assert.equal(opt.turrets.length,4);assert.equal(old.insect,undefined);}
  else assert.deepEqual(old,opt);
 }
 for(const l of [-Infinity,NaN,0,60,500,100000]){const d=insectDifficulty(l);assert.ok(d.hullHP<=420);assert.ok(d.cadenceMs>=800);assert.ok(d.trackingScale<=1.25);assert.equal(d.escapeGap,112);assert.equal(d.maxShots,3);}
});

test('hull and maximum gun reach stay above the full unchanged player field throughout motion',()=>{
 for(const [w,h,top] of views){
  let b=createSectorBoss(60,w,top,h,true);const layout=insectLayout(w,h,top);
  for(let t=0;t<100000;t+=80){
   b=moveSectorBoss(b,80,w,h);
   assert.ok(b.y+b.height/2+PLAYER_CONTACT_RADIUS<h*.5,`${w}x${h}: body`);
   for(const g of b.weaponSlots){
    const pos=gunPosition(b,g),reach=Math.max(g.muzzle,g.back,g.halfWidth)*b.width/b.config.sourceWidth;
    assert.ok(pos.y+reach+PLAYER_CONTACT_RADIUS<h*.5,`${w}x${h}: weapon`);
   }
   for(const p of [{x:30/w,y:.5},{x:1-30/w,y:.5},{x:.5,y:.5},{x:.5,y:layout.playerBottom/h}])
    assert.equal(contactWithBoss(p,w,h,b,0).damage,0,`${w}x${h}: legal boundary`);
   assert.ok(Math.abs(b.x-w/2)+b.width/2<=w/2-30);
  }
 }
});

test('turrets retain real rotation, lock and warning; all four fire with bounded live shots and a continuously safe corridor',()=>{
 for(const [w,h,top] of views){
  let b=createSectorBoss(60,w,top,h,true),live=[],id=0;const fired=new Set();let total=0;
  for(let t=0;t<150000;t+=20){
   b=moveSectorBoss(b,20,w,h);
   live=live.map(s=>advanceEnemyShot(s,20)).filter(s=>!enemyShotOutsideField(s,w,h));
   // Deliberately change direction between phrases to exercise rotating guns.
   const player={x:.5+.3*Math.sin(t*.00031),y:.72+.12*Math.sin(t*.00012)};
   const out=advanceBossTurrets(b,player,w,h,20,3-live.length,id,live);
   id+=out.shots.length;live.push(...out.shots);total+=out.shots.length;
   assert.ok(live.length<=3);
   for(const e of out.events){assert.ok(e.error<.035);assert.ok(e.lock>=INSECT_LOCK_MS);fired.add(e.gunIndex);}
   for(const s of out.shots){assert.equal(s.faction,'enemy');assert.equal(s.damage,1);assert.equal(s.lifetimeMs,8000);assert.ok(s.collisionRadius<s.renderRadius);assert.ok(s.renderRadius<=16);}
   const lane=b.insect.lane==='left'?30:w-30-ESCAPE_CENTER_WIDTH;
   // Every projectile is checked at every y in the unchanged player zone,
   // including its swept body and player's radius. No sampling of x can hide a block.
   for(const s of live)for(const y of [h*.5,h*.6,h*.7,h*.8,h*.91]){
    const dt=(y-s.y)/s.vy;if(dt<0||dt>8000-(s.ageMs??0))continue;
    const x=s.x+s.vx*dt,pad=PLAYER_RADIUS+s.collisionRadius+9;
    assert.ok(x+pad<lane||x-pad>lane+ESCAPE_CENTER_WIDTH,`${w}x${h}: lane blocked`);
   }
  }
  assert.equal(fired.size,4,`${w}x${h}: all guns actually fire`);assert.ok(total>20);
 }
});

test('entry/pause/death/EMP calling contract prevents early or collapsed fire',()=>{
 const b=createSectorBoss(60,390,90,760,true);const p={x:.5,y:.88};
 assert.equal(advanceBossTurrets(b,p,390,760,80,3,0).shots.length,0);
 b.elapsed=BOSS_ENTRY_MS;
 assert.equal(advanceBossTurrets(b,p,390,760,0,3,0).shots.length,0);
 b.health=0;assert.equal(advanceBossTurrets(b,p,390,760,80,3,0).shots.length,0);
});

test('only live turrets take phase-one damage; exposed reactor alone accepts hull hits',()=>{
 const b=createSectorBoss(60,390,90,760,true);b.elapsed=2000;
 const hp=b.health;assert.equal(damageSectorBoss(b,999,3000),false);assert.equal(b.health,hp);
 const g=b.weaponSlots[0],pos=gunPosition(b,g);
 assert.equal(bossHitTarget(b,{x:pos.x,y:pos.y+50},{x:pos.x,y:pos.y-50})?.kind,'turret');
 b.turrets.forEach((_,i)=>damageBossTurret(b,i,999));assert.ok(bossHullExposed(b));
 assert.equal(bossHitTarget(b,{x:b.x-b.width*.4,y:b.y+b.height},{x:b.x-b.width*.4,y:b.y-b.height}),null);
 const bay=specialWeaponBox(b),y=b.y-b.height/2+bay.top;
 assert.equal(bossHitTarget(b,{x:b.x,y:y+bay.height+20},{x:b.x,y:y-20})?.kind,'hull');
 assert.equal(damageSectorBoss(b,1,5000),true);assert.equal(b.health,hp-2);
 assert.ok(advanceBossCore(b,{x:.5,y:.85},390,760,0,3,1).length===0);
 for(let i=0;i<200;i++)advanceBossCore(b,{x:.8,y:.85},390,760,20,3,1);
 assert.ok(b.core.volley>0);
});

test('new solid bodies sweep through the real hitbox and expire; ordinary boundaries never create damage',()=>{
 const base={id:1,x:195,y:450,vx:0,vy:.2,radius:13,renderRadius:13,collisionRadius:10.4,damage:1,faction:'enemy',projectileType:'insect-heavy',ageMs:0,lifetimeMs:8000};
 assert.equal(enemyShotHitsPlayer({...base,y:650},{x:.5,y:.75},390,760,base),true);
 assert.equal(enemyShotHitsPlayer({...base,x:250,y:650},{x:.5,y:.75},390,760,{...base,x:250}),false);
 assert.equal(enemyShotOutsideField(advanceEnemyShot(base,8000),390,3000),true);
 assert.equal(PLAYER_RADIUS,23);assert.equal(PLAYER_CONTACT_RADIUS,27);
 assert.deepEqual(placePlayer(-999,0,390,760),{x:30/390,y:.5});
});


test('the insect core muzzle matches the eye center; legacy muzzle stays at its barrel end',()=>{
 const eye=createSectorBoss(60,390,90,760,true),old=createSectorBoss(60,390,90,760);
 for(const [b,ratio] of [[eye,.5],[old,.925]]){const box=specialWeaponBox(b),m=specialWeaponMuzzle(b);assert.equal(m.y,b.y-b.height/2+box.top+box.height*ratio);}
});
