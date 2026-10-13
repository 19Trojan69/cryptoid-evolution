// Actual GamePage transition/shot logic with the established Node host stubs.
// No real browser, native audio, account writes or FPS inference.
const assert = require('node:assert/strict');
let clock=1000;
const storage=()=>{const data=new Map();return {getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,String(v)),removeItem:k=>data.delete(k),clear:()=>data.clear()};};
global.localStorage=storage();global.sessionStorage=storage();
global.window={localStorage,sessionStorage,__ENV:{appNetwork:'testnet'},location:{hostname:'cryptoid-evolution-testnet.vercel.app'},matchMedia:()=>({matches:false}),devicePixelRatio:1,setTimeout:()=>1,clearTimeout(){},setInterval:()=>1,clearInterval(){}};
global.Image=class {decode(){return Promise.resolve();}set src(value){this.url=value;}};
global.document={visibilityState:'visible',documentElement:{dataset:{},style:{setProperty(){}}}};
Object.defineProperty(global,'navigator',{value:{userAgent:'Node pickup origin fixture',language:'de',languages:['de']}});
const engine=require('./engine.cjs');
const safe=state=>{state.player={x:.9,y:.88};state.enemyShots=[];state.shots=[];};
function mount(){localStorage.clear();sessionStorage.clear();engine.effects.length=0;engine.GamePage();engine.effects.find(fn=>fn.toString().includes('startGuardedGameLoop'))();engineStep(clock+=16);engineDebug.setAdmin();return engineDebug;}
function tick(run,ms,action=safe){for(let elapsed=0;elapsed<ms;elapsed+=16){action?.(run.raw());engineStep(clock+=16);}}
function target(run){tick(run,4500);const state=run.raw(),enemy=state.asteroids[0];assert.ok(enemy);Object.assign(enemy,{x:195,y:250,entryTargetX:195,entryTargetY:250,attackPattern:null,entryElapsed:enemy.entryDuration+1000,formationElapsed:enemy.formationDuration,health:10,maxHealth:10,cloaked:false});state.asteroids=[enemy];state.rocks=[];state.powerUps=[];state.player={x:.9,y:.88};return enemy;}
function shot(run,enemy,damage){run.raw().shots=[{id:90000,x:enemy.x,y:enemy.y+4,speedX:0,damage,empowered:false}];run.raw().enemyShots=[];engineStep(clock+=16);}
const results=[];
const idle=mount();tick(idle,45000,state=>{safe(state);assert.equal(state.powerUps.length,0,'No ship defeat: no automatic pickup after 18 seconds or later');});assert.equal(idle.raw().destroyed,0);assert.equal(idle.raw().powerUps.length,0);assert.deepEqual(idle.raw().powerUpTypes,[]);results.push('45 seconds without defeats never creates a floating pickup.');
const active=mount(),enemy=target(active),originalRandom=Math.random;
try {
 Math.random=()=>0;
 shot(active,enemy,1);assert.equal(active.raw().destroyed,0);assert.equal(active.raw().powerUps.length,0,'Damage without defeat never creates a pickup');
 const expectedDestroyed=active.raw().destroyed+1;shot(active,enemy,100);
 assert.equal(active.raw().destroyed,expectedDestroyed);assert.equal(active.raw().powerUps.length,1);
 const drop=active.raw().powerUps[0],explosion=active.raw().effects.findLast(effect=>effect.kind==='explosion'||effect.kind==='shatter');assert.ok(explosion);assert.equal(drop.x,explosion.x);assert.equal(drop.y,explosion.y,'Pickup originates at the defeated ship');results.push('Only a lethal projectile hit creates the eligible drop at the defeated ship.');
 const issued=active.refs().dropsCreated.current;tick(active,16);assert.equal(active.refs().dropsCreated.current,issued,'No repeated grant on the next frame');
 const upgradeRun=mount(),upgradeEnemy=target(upgradeRun);upgradeRun.raw().powerUpTypes=['shield','overdrive','rapid'];shot(upgradeRun,upgradeEnemy,100);
 assert.equal(upgradeRun.raw().powerUps[0]?.type,'weapon','Weapon pickup is not reserved for the removed timer');results.push('A regular defeat can issue the existing weapon upgrade before the former timed grant.');
 const upgrade=upgradeRun.raw().powerUps[0];upgrade.y=760*.58;upgradeRun.raw().player={x:upgrade.x/390,y:.58};tick(upgradeRun,16,state=>{state.shots=[];state.enemyShots=[];});
 assert.equal(upgradeRun.raw().powerUps.length,0);assert.equal(upgradeRun.raw().pickupWeaponLevel,2);assert.equal(upgradeRun.raw().pickupWeaponMs,20000);results.push('Collected defeat pickup keeps the original 20-second duration and upgrade value.');
 const resumed=mount();tick(resumed,900);const state=resumed.raw();state.combo.variety={...resumed.snapshot().intro,clock:19000,weaponIssued:false};
 const checkpoint={version:1,clock:performance.now(),sequence:1,stage:state.sector,encounter:state.encounter,width:390,height:760,state:Object.fromEntries(['asteroids','bonusTargets','bonusHits','boss','shots','enemyShots','player','powerUps','powerUpTypes','pickupNotice','combo','chainBlocks','chainResult','bonusResult','projectileGuard','pendingStartPower','playerHullFires','playerHit','phase'].map(key=>[key,state[key]])),refs:Object.fromEntries(Object.entries(resumed.refs()).map(([key,ref])=>[key,ref.current])),formationStarted:resumed.formationStarted(),slots:resumed.slots(),escortSlots:null};
 const saved=engine.readCombatCheckpoint(JSON.parse(JSON.stringify(checkpoint)));assert.ok(saved);resumed.restoreCombat(saved);tick(resumed,1000);assert.equal(resumed.raw().powerUps.length,0,'Restored timer state does not create a new pickup');results.push('A legacy checkpoint past the timed threshold resumes without automatic or duplicate pickups.');
} finally {Math.random=originalRandom;}
console.log(JSON.stringify({passed:true,mode:'Actual GamePage with synthetic host/clock and deterministic projectile fixtures; not a mobile playtest',checks:results},null,2));
