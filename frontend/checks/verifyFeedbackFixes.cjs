const assert=require('node:assert/strict');
let clock=1000;
const storage=()=>{const m=new Map();return {getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k),clear:()=>m.clear()};};
global.localStorage=storage();global.sessionStorage=storage();
global.window={localStorage,sessionStorage,__ENV:{appNetwork:'testnet'},location:{hostname:'testnet.localhost'},matchMedia:()=>({matches:false}),devicePixelRatio:1,setTimeout:()=>1,clearTimeout(){},setInterval:()=>1,clearInterval(){}};
global.Image=class{set src(v){this.url=v;}decode(){return Promise.resolve();}};
global.document={visibilityState:'visible',documentElement:{dataset:{},style:{setProperty(){}}}};
Object.defineProperty(global,'navigator',{value:{userAgent:'Node feedback verification',language:'de',languages:['de']},configurable:true});
Object.defineProperty(global,'performance',{value:{now:()=>clock,getEntriesByType:()=>[]},configurable:true});
const e=require('./engine.cjs');
function mount(){localStorage.clear();sessionStorage.clear();e.effects.length=0;e.GamePage();e.effects.find(fn=>fn.toString().includes('startGuardedGameLoop'))();engineStep(clock+=16);engineDebug.setAdmin();return engineDebug;}
const tick=(d,ms,action)=>{for(let t=0;t<ms;t+=16){action?.(d.raw());engineStep(clock+=16);}return d.snapshot();};
const protect=s=>{s.hearts=99;s.player={x:.92,y:.91};s.enemyShots=[];s.shots=[];};
const checks=[];
function aimAtCarrier(d,health=1){const s=d.raw();assert.ok(s.asteroids.length);const carrier={...s.asteroids[0],x:195,y:200,entryTargetX:195,entryTargetY:200,health,maxHealth:health,attackPattern:null,attackDelay:0,attackElapsed:0,returnElapsed:0};carrier.entryElapsed=carrier.entryDuration;carrier.formationElapsed=carrier.formationDuration;s.asteroids=[carrier];s.enemyShots=[];s.shots=[{id:700001,x:195,y:210,speedX:0,damage:1,empowered:false}];return carrier;}
const d=mount();tick(d,30000,protect);assert.equal(d.raw().powerUps.length,0);assert.equal(d.snapshot().intro.weaponIssued,false);checks.push('30 seconds without a lethal shot creates no floating timed power-up.');
const carrier=aimAtCarrier(d);tick(d,16);assert.equal(d.raw().powerUps.length,1);const drop=d.raw().powerUps[0],blast=d.raw().effects.find(x=>x.sprite===carrier.sprite&&(x.kind==='explosion'||x.kind==='shatter'));
assert.ok(blast);assert.equal(drop.x,blast.x);assert.equal(drop.y,blast.y);assert.equal(drop.type,'weapon');assert.equal(d.snapshot().intro.weaponIssued,true);checks.push('The due opening benefit is emitted exactly at the defeated hull/explosion.');
d.raw().player={x:drop.x/390,y:drop.y/760};tick(d,16,s=>{s.enemyShots=[];s.shots=[];});assert.equal(d.raw().weaponLevel,2);assert.equal(d.raw().pickupWeaponMs,20000);checks.push('Carrier pickup still grants the original 20-second Twin upgrade.');
const nonlethal=mount();tick(nonlethal,30000,protect);aimAtCarrier(nonlethal,2);tick(nonlethal,16);assert.equal(nonlethal.raw().powerUps.length,0);assert.equal(nonlethal.snapshot().intro.weaponIssued,false);checks.push('A non-lethal hit never emits the reserved benefit.');
const boss=mount(),s=boss.raw();Object.assign(s,{sector:30,section:30,encounter:'boss-fight',phase:'ATTACK_CYCLE',boss:e.createSectorBoss(30,390,80,760),asteroids:[],shots:[],enemyShots:[],effects:[],powerUps:[],hearts:3,maxHearts:3,player:{x:.9,y:.9}});s.boss.elapsed=6000;
boss.destroyBoss();assert.equal(s.encounter,'boss-clear');assert.equal(s.boss,null);assert.equal(s.enemyShots.length,0);assert.equal(s.asteroids.length,0);
for(let y=.5;y<=.91;y+=.027)for(let x=.08;x<=.92;x+=.056){s.player={x,y};tick(boss,16);assert.equal(s.hearts,3,'descent/wreck cannot damage player');assert.equal(s.status,'playing');}
checks.push('Every point of a dense legal player-area grid is harmless during boss descent.');
s.player={x:.9,y:.9};tick(boss,11000);assert.equal(s.encounter,'boss-clear');assert.equal(s.hearts,3);s.player={x:.5,y:.58};tick(boss,3100);assert.equal(s.encounter,'bonus');assert.equal(s.status,'playing');assert.equal(s.hearts,3);checks.push('Boss fall, blast, waiting heart, collection and bonus transition complete without damage or deadlock.');
(async()=>{
 const {bindGameInput}=await import('../src/pages/gameInput.ts');
 const target=()=>{const handlers=new Map();return {handlers,addEventListener:(k,f)=>handlers.set(k,f),removeEventListener:k=>handlers.delete(k)};};
 const field={...target(),getBoundingClientRect:()=>({left:0,top:0,width:390,height:760}),setPointerCapture(){},hasPointerCapture:()=>false},win={...target(),PointerEvent:class{}},doc={...target(),visibilityState:'visible'};
 field.ownerDocument=doc;doc.defaultView=win;
 const faults=[];const controls=bindGameInput(field,{pointer:{current:null},origin:{current:null},playing:()=>s.status==='playing',aboveFinger:()=>false,sensitivity:()=>1,area:()=> 'normal',position:p=>s.player=p,fault:e=>faults.push(e)},win,doc);
 const event={pointerId:1,pointerType:'touch',isPrimary:true,buttons:1,clientX:80,clientY:650,cancelable:true,preventDefault(){},target:{closest:()=>null}};
 field.handlers.get('pointerdown')(event);field.handlers.get('pointermove')({...event,clientX:180});assert.ok(s.player.x>80/390);assert.equal(faults.length,0);controls.dispose();assert.equal(field.handlers.size+win.handlers.size+doc.handlers.size,0);
 checks.push('Real steering handlers accept input after the boss/bonus transition and release every listener on disposal.');
 console.log(JSON.stringify({passed:true,checks},null,2));
})().catch(e=>{console.error(e);process.exitCode=1;});
