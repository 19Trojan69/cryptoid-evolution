const assert = require('node:assert/strict');
let clock = 1000;
const storage = () => {let data=new Map();return {getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,String(v)),removeItem:k=>data.delete(k),clear:()=>data.clear()};};
global.localStorage=storage();global.sessionStorage=storage();
global.window={localStorage,sessionStorage,__ENV:{appNetwork:'testnet'},location:{hostname:'cryptoid-evolution-testnet.vercel.app'},matchMedia:()=>({matches:false}),devicePixelRatio:1,setTimeout:()=>1,clearTimeout:()=>{},setInterval:()=>1,clearInterval:()=>{}};
global.Image=class{decode(){return Promise.resolve();}set src(v){this.url=v;}};
global.document={visibilityState:'visible',documentElement:{dataset:{},style:{setProperty(){}}}};
Object.defineProperty(global,'navigator',{value:{userAgent:'Node engine verification',language:'de',languages:['de']}});
const e=require('./engine.cjs');
function mount(){localStorage.clear();sessionStorage.clear();e.effects.length=0;e.GamePage();e.effects.find(fn=>fn.toString().includes('startGuardedGameLoop'))();engineStep(clock+=16);engineDebug.setAdmin();return engineDebug;}
const tick=(d,ms,action)=>{for(let t=0;t<ms;t+=16){action?.(d.raw());engineStep(clock+=16);}return d.snapshot();};
const safe=st=>{st.player={x:.9,y:.88};st.enemyShots=[];st.shots=[];};
const report=[];
const d=mount();tick(d,900);assert.ok(d.raw().asteroids.length);assert.ok(d.raw().asteroids.every(a=>[25,36,50].includes(a.radius)));tick(d,900);assert.ok(d.raw().asteroids.some(a=>a.shipClass==='heavy'));report.push('First ships under one second; complete first flight retains original mixed class radii 25/36/50.');
tick(d,18000,safe);assert.equal(d.snapshot().intro.weaponIssued,false);assert.equal(d.raw().powerUps.length,0);
const seedEnemy={...d.raw().asteroids[0]},random=Math.random;
try { Math.random=()=>0;
 for(let kill=0;kill<3;kill++){
  d.raw().asteroids=[{...seedEnemy,id:700+kill,x:195,y:220,entryTargetX:195,entryTargetY:220,entryElapsed:seedEnemy.entryDuration,formationElapsed:300,health:1,attackPattern:null,attackDelay:0},{...seedEnemy,id:799,x:360,y:500,entryTargetX:360,entryTargetY:500,entryElapsed:seedEnemy.entryDuration,formationElapsed:300,health:1000,maxHealth:1000,attackPattern:null,attackDelay:0}];
  d.raw().shots=[{id:800+kill,x:195,y:229,speedX:0,damage:1000,empowered:false}];
  tick(d,16,st=>{st.enemyShots=[];st.player={x:.9,y:.88};});
 }
} finally {Math.random=random;}
const pickup=d.raw().powerUps.find(p=>p.type==='weapon');assert.ok(pickup);pickup.y=.88*760;d.raw().player={x:pickup.x/390,y:.88};tick(d,16,st=>{st.enemyShots=[];st.shots=[];});assert.equal(d.raw().weaponLevel,2);assert.equal(d.raw().pickupWeaponMs,20000);assert.equal(d.raw().maxHearts,3);report.push('No automatic 18-second drop. Actual ship defeats create the original weapon pickup: Single to Twin, unchanged duration and hearts.');
d.pause();const p=d.snapshot();tick(d,50000);assert.equal(d.snapshot().intro.clock,p.intro.clock);assert.equal(d.raw().pickupWeaponMs,p.pickupWeaponMs);assert.equal(d.raw().score,p.score);d.resume();tick(d,32,safe);assert.equal(d.raw().powerUpTypes.filter(t=>t==='weapon').length,1);report.push('Pause/resume freezes clocks, score and power-up timer; no repeated drop.');
const st=d.raw();const rock=e.spawnBonusRock(900,st.sector,390,760,95,.9,55);Object.assign(rock,{x:190,y:500,health:2});st.rocks=[rock];st.shots=[{id:800,x:190,y:509,speedX:0,damage:2,empowered:false}];const before={score:st.score,shards:st.shards,destroyed:st.destroyed};tick(d,16,s=>{s.enemyShots=[];});assert.equal(st.score,before.score+rock.points);assert.equal(st.shards,before.shards);assert.equal(st.destroyed,before.destroyed);assert.equal(st.rocks.length,0);assert.ok(st.rockEffects.some(f=>f.final));tick(d,64,safe);assert.equal(st.score,before.score+rock.points);report.push('Swept shot destroys rock and awards its small bonus exactly once, without Shards/defeats.');
// The old proxy decoder must retain optional metadata inside the existing combo field.
const live=e.spawnBonusRock(901,1,390,760,95,.2,12);live.health=1;st.rocks=[live];st.combo.variety={...d.snapshot().intro,rocks:st.rocks};
const checkpoint={version:1,clock:performance.now(),sequence:1,stage:st.sector,encounter:st.encounter,width:390,height:760,state:Object.fromEntries(['asteroids','bonusTargets','bonusHits','boss','shots','enemyShots','player','powerUps','powerUpTypes','pickupNotice','combo','chainBlocks','chainResult','bonusResult','projectileGuard','pendingStartPower','playerHullFires','playerHit','phase'].map(k=>[k,st[k]])),refs:Object.fromEntries(Object.entries(d.refs()).map(([k,v])=>[k,v.current])),formationStarted:d.formationStarted(),slots:d.slots(),escortSlots:null};
const saved=e.readCombatCheckpoint(JSON.parse(JSON.stringify(checkpoint)));assert.ok(saved);const meta=e.readCombatVariety(saved.state.combo.variety);assert.ok(meta);assert.equal(meta.weaponIssued,false);assert.equal(meta.rocks[0].health,1);const clockBefore=meta.clock;d.restoreCombat(saved);assert.equal(d.snapshot().intro.clock,clockBefore);assert.equal(d.raw().rocks[0].health,1);assert.equal(d.snapshot().intro.asteroidDue,meta.asteroidDue);report.push('Established checkpoint/proxy format retains event clock, issued drop and live-rock health; resume does not replay points.');
d.restart();assert.equal(d.raw().score,0);assert.equal(d.raw().rocks.length,0);assert.equal(d.raw().rockEffects.length,0);assert.equal(d.snapshot().intro.clock,0);report.push('Restart cleans all rocks, fragments, pickups, clocks and points.');
const boosted=mount();Object.assign(boosted.raw(),{weaponLevel:5,weaponCap:5,paidWeaponLevel:5,paidWeaponMs:60000,weaponSource:'paid',weaponTimers:[0,0,0,0,0,60000],unlockedWeapons:[1,5],hearts:5,maxHearts:5,projectileGuard:2});tick(boosted,19000,safe);assert.equal(boosted.raw().powerUps.length,0);assert.equal(boosted.raw().weaponLevel,5);assert.equal(boosted.raw().maxHearts,5);assert.equal(boosted.raw().projectileGuard,2);report.push('Maxed loadout gets no spontaneous boost; weapon, armor and hull guard retained.');
// Pickups remain collectable across every kind of encounter transition.
const carried=mount();
for (const [section,sector,encounter,nextSector,nextEncounter] of [[1,1,'normal',2,'normal'],[9,9,'normal',10,'boss-intro'],[10,10,'boss-clear',10,'bonus'],[10,10,'bonus',11,'normal']]) {
 const state=carried.raw(), pickup={id:850,type:'shield',x:100,y:300};
 Object.assign(state,{section,sector,encounter,phase:'SECTOR_CLEAR',bossHeartCollected:true,powerUps:[pickup],powerUpTypes:['shield'],shieldCharges:0,overdriveMs:12000,rapidFireMs:11000,pickupWeaponMs:10000,player:{x:.9,y:.88}});
 carried.refs().clearTimer.current=100000;
 tick(carried,16,safe);
 assert.equal(state.sector,nextSector);assert.equal(state.encounter,nextEncounter);
 assert.equal(state.powerUps.length,1);assert.equal(state.powerUps[0].id,pickup.id);
 assert.ok(Math.abs(state.powerUps[0].y-(pickup.y+16*.052))<1e-9);
 const beforeFall=state.powerUps[0].y;
 tick(carried,160,safe);assert.equal(state.powerUps.length,1);assert.ok(Math.abs(state.powerUps[0].y-(beforeFall+160*.052))<1e-9);
 assert.equal(state.overdriveMs,12000);assert.equal(state.rapidFireMs,11000);assert.equal(state.pickupWeaponMs,10000);
 if (encounter==='bonus') {assert.deepEqual(state.powerUpTypes,['shield']);assert.equal(carried.refs().dropsCreated.current,1);}
}
for(const [encounter,phase] of [['normal','SECTOR_INTRO'],['normal','ENTRY'],['normal','FORMATION'],['normal','SECTOR_CLEAR'],['boss-intro','SECTOR_INTRO'],['boss-clear','SECTOR_CLEAR'],['bonus','SECTOR_INTRO'],['bonus','SECTOR_CLEAR']]) {
 const state=carried.raw();Object.assign(state,{sector:1,section:1,encounter,phase,boss:null,bossHeartCollected:false,powerUps:[{id:850,type:'shield',x:100,y:300}],player:{x:.9,y:.88},overdriveMs:12000,rapidFireMs:11000,pickupWeaponMs:10000});
 carried.refs().clearTimer.current=0;carried.refs().sectionElapsed.current=0;
 tick(carried,480,safe);
 assert.equal(state.powerUps.length,1);assert.ok(Math.abs(state.powerUps[0].y-(300+480*.052))<1e-8);
 assert.equal(state.overdriveMs,12000);assert.equal(state.rapidFireMs,11000);assert.equal(state.pickupWeaponMs,10000);
}
const carryState=carried.raw();carryState.boss=e.createSectorBoss(10,390,95,760);carryState.sector=10;carryState.encounter='boss-fight';
carried.destroyBoss();assert.equal(carryState.encounter,'boss-clear');assert.equal(carryState.powerUps[0].id,850);
const pausedY=carryState.powerUps[0].y;carried.pause();tick(carried,50000);assert.equal(carryState.powerUps[0].y,pausedY);assert.equal(carryState.overdriveMs,12000);carried.resume();
carryState.powerUps[0].y=.88*760;carryState.player={x:100/390,y:.88};tick(carried,16);assert.equal(carryState.powerUps.length,0);assert.equal(carryState.shieldCharges,1);tick(carried,16);assert.equal(carryState.shieldCharges,1);
carried.restart();assert.equal(carried.raw().powerUps.length,0);
report.push('Pickups survive block/boss/bonus/level switches and boss destruction, keep falling continuously during transitions, protect active boost timers and freeze only on actual pause, remain collectable exactly once, retain drop limits, and clear on restart.');
const timedPickup=mount();tick(timedPickup,800,safe);
timedPickup.raw().powerUps=[{id:851,type:'rapid',x:351,y:.88*760}];
tick(timedPickup,16,safe);assert.equal(timedPickup.raw().powerUps.length,0);assert.equal(timedPickup.raw().rapidFireMs,20000);
tick(timedPickup,400,safe);assert.equal(timedPickup.formationStarted(),false);assert.equal(timedPickup.raw().rapidFireMs,20000);
tick(timedPickup,4000,safe);assert.equal(timedPickup.formationStarted(),true);assert.ok(timedPickup.raw().rapidFireMs<20000&&timedPickup.raw().rapidFireMs>0);
report.push('Pickup collected during formation setup retains its full 20 seconds; countdown starts only when the formation is ready.');
const campaign=mount();const visited=new Set();let sawBoss=0,sawBonus=0,heavyAt=null,carriedTransitions=0;
for(let i=0;i<1600000;i++){
 const s=campaign.raw(),info=campaign.snapshot();visited.add(s.sector);s.enemyShots=[];s.shots=[];s.player={x:.92,y:.9};
 if(s.encounter==='boss-clear')s.player={...campaign.rewardPosition()};
 if(s.asteroids.some(a=>a.shipClass==='heavy')&&heavyAt===null)heavyAt=info.intro.clock;
 if(s.asteroids.length&&s.asteroids.every(a=>a.entryElapsed>=a.entryDuration)&&info.sectionMs>4500){s.destroyed+=s.asteroids.length;s.asteroids=[];}
 if(s.encounter==='boss-fight'&&s.boss){s.boss.turrets.forEach(t=>t.health=0);s.boss.health=1;s.shots=[{id:2000000+i,x:s.boss.x,y:s.boss.y+5,speedX:0,damage:1000,empowered:false}];}
 if(s.encounter==='boss-clear')sawBoss=Math.max(sawBoss,s.sector/10);
 if(s.encounter==='bonus'){sawBonus=Math.max(sawBonus,s.sector/10);s.bonusTargets=[];}
 const wasClear=s.phase==='SECTOR_CLEAR', previousStage=s.sector, previousEncounter=s.encounter;
 if(wasClear)s.powerUps=[{id:3000000+i,type:'rapid',x:35,y:300}];
 const carriedId=s.powerUps[0]?.id;
 engineStep(clock+=16);
 if(wasClear&&(s.sector!==previousStage||s.encounter!==previousEncounter)&&s.status!=='victory') {assert.ok(s.powerUps.some(p=>p.id===carriedId));carriedTransitions++;}
 if(s.status==='victory')break;
 if(s.status!=='playing')throw Error('Unexpected campaign status '+s.status+' at '+s.sector);
}
assert.ok(heavyAt<60000);assert.equal(visited.size,500);assert.equal(sawBoss,50);assert.equal(sawBonus,50);assert.equal(campaign.raw().status,'victory');assert.ok(carriedTransitions>=500);report.push('Actual transition loop traverses 500 stages, all 50 bosses and bonus rounds to victory; scripted first heavy before minute one.');
console.log(JSON.stringify({passed:report},null,2));
