// Reuse the actual GamePage harness; only the host driver is extended.
// No browser/GPU or real-touch claims. The pilot and extra lives are QA aids.
const fs=require('node:fs'),path=require('node:path'),Module=require('node:module');
let source=fs.readFileSync(path.join(__dirname,'verifySimulationStability.cjs'),'utf8');
const replace=(a,b)=>{if(!source.includes(a))throw new Error('Harness anchor changed: '+a);source=source.replace(a,b);};
replace('"import.meta.env": "{}",', '"import.meta.env": "{}", "import.meta.env.VITE_INSECT_BOSS_PREVIEW": \'"true"\',');
replace(' info:()=>(',` insectStart:()=>{const s=stateRef.current;Object.assign(s,createInitialState(),{sector:60,section:60,chainBlocks:8,status:'playing',encounter:'boss-intro',phase:'SECTOR_INTRO'});s.boss=createSectorBoss(60,fieldSizeRef.current.width,visibleTopRef.current,fieldSizeRef.current.height,true);adminRunRef.current=true;sectionElapsedRef.current=0;clearTimerRef.current=0;sectionSlotsRef.current=null;},
 insectDetail:()=>{const s=stateRef.current;return {insect:!!s.boss?.insect,turrets:s.boss?.turrets.map(g=>g.health),hp:s.boss?.health,encounter:s.encounter,escorts:s.asteroids.length};},
 insectPilot:()=>{const s=stateRef.current;if(!s.boss?.insect)return;const {width,height}=fieldSizeRef.current,i=s.boss.turrets.findIndex(g=>g.health>0),g=s.boss.weaponSlots[i];const target=i<0?s.boss.x:gunPosition(s.boss,g).x;const distance=target-s.player.x*width;s.player={x:s.player.x+Math.sign(distance)*Math.min(Math.abs(distance),.32*16)/width,y:.78};},
 resetCampaign:()=>{Object.assign(stateRef.current,createInitialState(),{status:'playing'});sectionElapsedRef.current=0;clearTimerRef.current=0;sectionSlotsRef.current=null;bossEscortSlotsRef.current=null;formationIndexRef.current=0;formationStartedRef.current=false;spawnTimerRef.current=0;flightRef.current=0;},
 info:()=>(`);
replace('      qa.protect();','      qa.protect();qa.insectPilot();');
replace('  try {\n    while (normal.length < count) {',`  try {
    qa.insectStart();let gunPhase=false,corePhase=false,completed=false,peak=0;
    for(let i=0;i<900;i++){
      await advance(250);qa.cards();const d=qa.insectDetail();peak=Math.max(peak,qa.info().hostile);
      assert.equal(d.escorts,0,'No escorts in either insect phase');
      if(d.turrets?.some(h=>h>0))gunPhase=true;
      if(d.turrets?.every(h=>h===0))corePhase=true;
      if(d.encounter==='boss-clear'){completed=true;break;}
    }
    assert.ok(gunPhase&&corePhase&&completed,'Real player projectiles must clear turrets then reactor: '+JSON.stringify(qa.insectDetail()));
    assert.ok(peak<=3);
    await advance(11000);qa.heart();await advance(2400);qa.cards();await advance(1000);
    assert.equal(qa.info().encounter,'bonus','Existing heart-to-bonus transition');
    console.log(JSON.stringify({insectReference:true,realProjectileVictory:true,turretAndReactorPhases:true,heartToBonus:true,peakHostile:peak}));
    qa.resetCampaign();
    while (normal.length < count) {`);
const filename=path.join(__dirname,'verifySimulationStability.cjs'),mod=new Module(filename,module);mod.filename=filename;mod.paths=module.paths;mod._compile(source,filename);
