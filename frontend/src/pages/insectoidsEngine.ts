import { insectoidRoster } from './insectoidRoster.ts';
import { createSectorBoss, moveSectorBoss, damageSectorBoss, type SectorBoss } from './sectorBoss.ts';
import { advanceBossTurrets, damageBossTurret } from './bossTurrets.ts';
import { advanceBossCore } from './bossCore.ts';
import { bossHitTarget } from './bossHitTarget.ts';
import { enemyShotHitsPlayer, enemyShotOutsideField, type EnemyShot } from './enemyFire.ts';
import { placePlayer, shipHitsEnemy, PLAYER_RADIUS, PLAYER_SPEED_PX_MS, fireInterval, volleyOffsets, SHOT_SPEED_PX_MS, type PlayerPosition } from './playerCombat.ts';
import { contactWithBoss } from './bossContact.ts';

export type InsectoidsPhase = 'round'|'boss-warning'|'boss'|'boss-explosion'|'heart'|'bonus'|'victory'|'defeat';
type Enemy = {active:boolean;id:number;type:number;hp:number;x:number;y:number;fromY:number;targetX:number;targetY:number;age:number;fire:number;radius:number};
type Shot = {active:boolean;hostile:boolean;shot:EnemyShot;previous:EnemyShot;damage:number;age:number};
export type Spark = {active:boolean;x:number;y:number;vx:number;vy:number;life:number;total:number;size:number;color:string};
export type InsectoidsAudio = (kind:'pulse'|'plasma'|'heavy'|'siege'|'hit'|'explosion'|'pickup'|'player',pan:number)=>void;
const emptyShot=():EnemyShot=>({id:0,x:0,y:0,vx:0,vy:0,radius:2});

/** A bounded simulation for the independent test mission. One owner, no timers,
 * networking, accounts, navigation or persistent reward writes. All normal shots,
 * enemies and impact particles are recycled in fixed-size pools. */
export class InsectoidsEngine {
  width:number; height:number;
  phase:InsectoidsPhase='round'; paused=false; fault=''; round=1; score=0; hearts=3;
  time=0; phaseTime=0; invulnerable=0; weaponLevel=1; boss:SectorBoss|null=null;
  player:PlayerPosition={x:.5,y:.82}; previousPlayer:PlayerPosition={x:.5,y:.82};
  target:PlayerPosition={x:.5,y:.82};
  enemies:Enemy[]=Array.from({length:6},()=>({active:false,id:0,type:0,hp:0,x:0,y:0,fromY:0,targetX:0,targetY:0,age:0,fire:0,radius:20}));
  shots:Shot[]=Array.from({length:36},()=>({active:false,hostile:false,shot:emptyShot(),previous:emptyShot(),damage:1,age:0}));
  sparks:Spark[]=Array.from({length:96},()=>({active:false,x:0,y:0,vx:0,vy:0,life:0,total:0,size:1,color:'#cfff64'}));
  peak={enemies:0,shots:0,hostile:0,sparks:0};
  virusShots=0;bossShots=0;destroyedTypes=new Set<number>();
  private liveHostile:EnemyShot[]=[];
  private fireClock=0;private nextId=1;private seed=4719;private explosionStage=-1;private bonusClock=0;private heartCollected=false;
  audio?:InsectoidsAudio;

  constructor(width:number,height:number,weaponLevel=1,directBoss=false){
    this.width=width;this.height=height;this.weaponLevel=Math.max(1,Math.min(5,weaponLevel));
    if(directBoss)this.enterBoss();else this.startRound();
  }
  private random(){this.seed=(Math.imul(this.seed,1664525)+1013904223)>>>0;return this.seed/4294967296;}
  private transition(phase:InsectoidsPhase){this.phase=phase;this.phaseTime=0;}
  private clearShots(){for(const s of this.shots)s.active=false;this.liveHostile.length=0;}
  private startRound(){
    this.transition('round');this.clearShots();
    for(let i=0;i<this.enemies.length;i++){
      const e=this.enemies[i],type=((this.round-1)*6+i)%20,d=insectoidRoster[type];
      const x=this.width*(.22+(i%3)*.28),y=this.height*(i<3?.19:.31);
      Object.assign(e,{active:true,id:this.nextId++,type,hp:d.hp,x,y:-80-i*45,fromY:-80-i*45,targetX:x,targetY:y,age:0,fire:1800+i*340,radius:d.radius});
    }
  }
  private enterBoss(){
    this.clearShots();for(const e of this.enemies)e.active=false;
    this.boss=createSectorBoss(60,this.width,32,this.height,true);
    this.transition('boss-warning');
  }
  resize(width:number,height:number){
    if(width<160||height<240)return;
    const sx=width/this.width,sy=height/this.height;this.width=width;this.height=height;
    for(const e of this.enemies){e.x*=sx;e.y*=sy;e.targetX*=sx;e.targetY*=sy;e.fromY*=sy;}
    for(const s of this.shots)if(s.active){s.shot.x*=sx;s.shot.y*=sy;s.previous.x=s.shot.x;s.previous.y=s.shot.y;}
    for(const p of this.sparks)if(p.active){p.x*=sx;p.y*=sy;}
    if(this.boss){this.boss.insect!.visibleTop=32;this.boss=moveSectorBoss(this.boss,0,width,height);}
    this.player=placePlayer(this.player.x*width,this.player.y*height,width,height);this.previousPlayer={...this.player};
  }
  point(x:number,y:number){this.target=placePlayer(x,y,this.width,this.height);}
  pause(reason=''){this.paused=true;this.fault=reason;}
  resume(){this.paused=false;this.fault='';}
  dispose(){this.clearShots();for(const e of this.enemies)e.active=false;for(const s of this.sparks)s.active=false;this.audio=undefined;}
  private addShot(s:EnemyShot,hostile:boolean,damage=1){
    const entry=this.shots.find(s=>!s.active);if(!entry)return false;
    Object.assign(entry.shot,{weaponKind:undefined,weaponWidth:undefined,weaponColor:undefined,bossKind:undefined,caliber:undefined,sourceGun:undefined,ageMs:0,lifetimeMs:8000,projectileType:undefined,collisionRadius:undefined,renderRadius:undefined,faction:undefined,damage:1},s);
    Object.assign(entry.previous,entry.shot);entry.active=true;entry.hostile=hostile;entry.damage=damage;entry.age=0;return true;
  }
  private burst(x:number,y:number,count:number,color:string,power=1){
    let used=0;for(const s of this.sparks){if(s.active)continue;
      const a=this.random()*Math.PI*2,speed=(.025+this.random()*.09)*power;
      Object.assign(s,{active:true,x,y,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed,life:350+this.random()*600,total:950,size:1+this.random()*3*power,color});
      if(++used>=count)break;
    }
  }
  private hitPlayer(x:number,y:number){
    if(this.invulnerable>0||this.hearts<=0)return;
    this.hearts--;this.invulnerable=1300;this.burst(x,y,12,'#ff914c');this.audio?.('hit',0);
    if(this.hearts<=0){this.transition('defeat');this.clearShots();}
  }
  /** One deterministic fixed step. The UI owns accumulated wall time. */
  step(dt:number){
    if(this.paused||this.phase==='victory'||this.phase==='defeat'||dt<=0)return;
    dt=Math.min(34,dt);this.time+=dt;this.phaseTime+=dt;this.invulnerable=Math.max(0,this.invulnerable-dt);
    this.previousPlayer.x=this.player.x;this.previousPlayer.y=this.player.y;
    const dx=(this.target.x-this.player.x)*this.width,dy=(this.target.y-this.player.y)*this.height,dist=Math.hypot(dx,dy),travel=Math.min(dist,PLAYER_SPEED_PX_MS*dt);
    if(dist){this.player.x+=dx/dist*travel/this.width;this.player.y+=dy/dist*travel/this.height;}
    this.liveHostile.length=0;for(const s of this.shots)if(s.active&&s.hostile)this.liveHostile.push(s.shot);

    if(this.phase==='round'){
      let alive=0;
      for(const e of this.enemies){if(!e.active)continue;alive++;e.age+=dt;
        const entry=Math.min(1,e.age/1250),smooth=entry*entry*(3-2*entry);
        e.x=e.targetX+Math.sin((e.age+e.id*101)*.0008)*Math.min(10,this.width*.02);
        e.y=e.fromY+(e.targetY-e.fromY)*smooth;
        if(entry<1)continue;
        if(shipHitsEnemy(this.player,this.width,this.height,e))this.hitPlayer(e.x,e.y);
        e.fire-=dt;
        if(e.fire<=0&&this.liveHostile.length<4){
          const ax=this.player.x*this.width-e.x,ay=this.player.y*this.height-e.y,d=Math.hypot(ax,ay),speed=.17+(e.type%3)*.012;
          const shot:EnemyShot={id:this.nextId++,x:e.x,y:e.y+e.radius*.6,vx:ax/d*speed,vy:ay/d*speed,radius:5,collisionRadius:4,renderRadius:7,damage:1,faction:'enemy',projectileType:'virus',lifetimeMs:8000};
          if(this.addShot(shot,true)){this.liveHostile.push(shot);this.virusShots++;this.audio?.('pulse',e.x/this.width*2-1);}
          e.fire=insectoidRoster[e.type].fireMs;
        }
      }
      if(!alive){
        // A short transition remains in the field; never navigate to a menu.
        if(this.phaseTime>=650){if(this.round<9){this.round++;this.startRound();}else this.enterBoss();}
      }else this.phaseTime=0;
    }
    if(this.phase==='boss-warning'&&this.phaseTime>=2400)this.transition('boss');
    if(this.phase==='boss'&&this.boss){
      const previous=this.boss;this.boss=moveSectorBoss(this.boss,dt,this.width,this.height);
      if(contactWithBoss(this.player,this.width,this.height,this.boss,this.invulnerable,previous,this.previousPlayer).damage)this.hitPlayer(this.player.x*this.width,this.player.y*this.height);
      const out=advanceBossTurrets(this.boss,this.player,this.width,this.height,dt,3-this.liveHostile.length,this.nextId,this.liveHostile);
      for(const shot of out.shots)if(this.addShot(shot,true)){this.nextId++;this.liveHostile.push(shot);this.bossShots++;}
      for(const e of out.events)this.audio?.(e.kind==='laser'||e.kind==='rocket'?'pulse':e.kind,e.pan);
      const core=advanceBossCore(this.boss,this.player,this.width,this.height,dt,3-this.liveHostile.length,this.nextId,this.liveHostile);
      for(const s of core)if(this.addShot(s,true)){this.nextId++;this.bossShots++;this.audio?.('siege',0);}
    }
    if(this.phase==='round'||this.phase==='boss'){
      this.fireClock+=dt;const interval=fireInterval(this.weaponLevel,0);
      if(this.fireClock>=interval){
        this.fireClock-=interval;this.audio?.('player',0);const offsets=volleyOffsets(this.weaponLevel);
        for(let i=0;i<offsets.length;i++)this.addShot({id:this.nextId++,x:this.player.x*this.width+offsets[i],y:this.player.y*this.height-20,vx:offsets.length===3?(i-1)*.1:0,vy:-SHOT_SPEED_PX_MS,radius:3},false,this.weaponLevel>=5?2:1);
      }
    }
    for(const p of this.shots){if(!p.active)continue;
      p.previous.x=p.shot.x;p.previous.y=p.shot.y;p.shot.x+=p.shot.vx*dt;p.shot.y+=p.shot.vy*dt;p.age+=dt;p.shot.ageMs=p.age;
      if(enemyShotOutsideField(p.shot,this.width,this.height)){p.active=false;continue;}
      if(p.hostile){
        if(enemyShotHitsPlayer(p.shot,this.player,this.width,this.height,p.previous,this.previousPlayer)){p.active=false;this.hitPlayer(p.shot.x,p.shot.y);}
      }else if(this.phase==='round'){
        for(const e of this.enemies){if(!e.active||e.age<1250)continue;
          const dx=p.shot.x-e.x,lo=Math.min(p.previous.y,p.shot.y),hi=Math.max(p.previous.y,p.shot.y);
          if(Math.abs(dx)>e.radius*.7+3||e.y<lo-e.radius*.7||e.y>hi+e.radius*.7)continue;
          p.active=false;e.hp-=p.damage;this.burst(p.shot.x,p.shot.y,e.hp<=0?14:3,insectoidRoster[e.type].color);
          if(e.hp<=0){e.active=false;this.score+=100+insectoidRoster[e.type].hp*25;this.destroyedTypes.add(e.type);this.audio?.('explosion',e.x/this.width*2-1);}break;
        }
      }else if(this.phase==='boss'&&this.boss){
        const hit=bossHitTarget(this.boss,p.previous,p.shot);if(!hit)continue;p.active=false;
        if(hit.kind==='turret'){
          const points=damageBossTurret(this.boss,hit.index,p.damage);this.score+=points;
          this.burst(hit.x,hit.y,points?22:3,points?'#ffb44c':'#beff42');this.audio?.(points?'explosion':'hit',0);
        }else if(damageSectorBoss(this.boss,p.damage,this.time)){
          this.burst(hit.x,hit.y,4,'#baff41');
          if(this.boss.health<=0){this.transition('boss-explosion');this.clearShots();this.score+=2500;this.explosionStage=-1;}
        }
      }else if(this.phase==='bonus'){
        // The bonus reuses a small bounded target pool, with no hostile fire.
        for(const e of this.enemies)if(e.active&&Math.hypot(p.shot.x-e.x,p.shot.y-e.y)<e.radius+5){e.active=false;p.active=false;this.score+=200;this.burst(e.x,e.y,10,'#e8ce70');this.audio?.('pickup',0);break;}
      }
    }
    if(this.phase==='boss-explosion'&&this.boss){
      const stage=Math.min(4,Math.floor(this.phaseTime/500));
      if(stage>this.explosionStage){this.explosionStage=stage;this.burst(this.boss.x+(this.random()-.5)*this.boss.width*.6,this.boss.y+(this.random()-.5)*this.boss.height*.5,stage===4?36:16,stage%2?'#e2ff51':'#ff8745',stage===4?2:1);this.audio?.('explosion',0);}
      if(this.phaseTime>3200){this.boss=null;this.transition('heart');this.invulnerable=1000;}
    }
    if(this.phase==='heart'&&Math.hypot((this.player.x-.5)*this.width,(this.player.y-.66)*this.height)<PLAYER_RADIUS+20){
      this.hearts=Math.min(3,this.hearts+1);this.heartCollected=true;this.audio?.('pickup',0);this.transition('bonus');this.bonusClock=0;
      for(let i=0;i<6;i++)Object.assign(this.enemies[i],{active:true,x:this.width*(i+1)/7,y:-40-i*50,radius:15,age:0});
    }
    if(this.phase==='bonus'){
      this.bonusClock+=dt;this.fireClock+=dt;
      if(this.fireClock>=220){this.fireClock=0;this.addShot({id:this.nextId++,x:this.player.x*this.width,y:this.player.y*this.height-20,vx:0,vy:-SHOT_SPEED_PX_MS,radius:3},false);}
      for(const e of this.enemies)if(e.active){e.y+=dt*.13;e.x+=Math.sin((this.time+e.id*100)*.001)*dt*.018;if(e.y>this.height+30)e.active=false;}
      if(this.bonusClock>10000){this.transition('victory');this.clearShots();for(const e of this.enemies)e.active=false;}
    }
    let enemies=0,shots=0,hostile=0,sparks=0;
    for(const e of this.enemies)if(e.active)enemies++;
    for(const s of this.shots)if(s.active){shots++;if(s.hostile)hostile++;}
    for(const s of this.sparks)if(s.active){s.life-=dt;if(s.life<=0)s.active=false;else{s.x+=s.vx*dt;s.y+=s.vy*dt;s.vy+=dt*.00003;sparks++;}}
    this.peak.enemies=Math.max(this.peak.enemies,enemies);this.peak.shots=Math.max(this.peak.shots,shots);this.peak.hostile=Math.max(this.peak.hostile,hostile);this.peak.sparks=Math.max(this.peak.sparks,sparks);
  }
  get collectedHeart(){return this.heartCollected;}
}
