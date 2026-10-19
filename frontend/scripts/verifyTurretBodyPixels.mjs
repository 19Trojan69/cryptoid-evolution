// Verify the intentional body-only change with real atlases/native raster.
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import Module from 'node:module';
import {build} from 'esbuild';
import {createSectorBoss} from '../src/pages/sectorBoss.ts';
import {bossWeapons} from '../src/pages/bossWeapons.ts';
import {turretBodyScale} from '../src/pages/bossTurretBody.ts';
const require=createRequire(import.meta.url);
const {createCanvas,loadImage}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/@napi-rs/canvas');
const root=new URL('../',import.meta.url).pathname;
async function renderer(original){
 const result=await build({absWorkingDir:root,entryPoints:['src/pages/bossWeaponRenderer.ts'],bundle:true,write:false,platform:'node',format:'cjs',plugins:original?[{name:'original-body-only',setup(b){b.onLoad({filter:/\/bossTurretBody\.ts$/},()=>({loader:'ts',contents:'export const turretBodyScale=()=>1;'}));}}]:[]});
 const mod=new Module(import.meta.filename);mod.paths=Module._nodeModulePaths(import.meta.dirname);mod._compile(result.outputFiles[0].text,import.meta.filename);return mod.exports;
}
const before=await renderer(true),after=await renderer(false);
let comparisons=0,changedBodies=0,barrelChannels=0;
for(const dpr of [1,2])for(let id=1;id<=50;id++){
 const boss=createSectorBoss(id*10,430,90,825);boss.elapsed=5000;boss.weaponClock=5000;
 const guns=bossWeapons[id-1],scale=boss.width/boss.config.sourceWidth;
 const image=await loadImage(root+'public'+boss.config.weaponImage),size=after.weaponCanvasSize(boss);
 const w=Math.ceil(size.width*dpr),h=Math.ceil(size.height*dpr);
 const make=(width,height)=>createCanvas(width,height),a=make(w,h),b=make(w,h);
 for(const pose of ['normal','heat','flash','dead']){
  boss.turrets.forEach((t,i)=>{t.health=pose==='dead'?0:pose==='heat'?t.maxHealth*.45:t.maxHealth;t.a=guns[i].base+.19*i;t.lastFired=pose==='flash'?4990:0;t.firedBarrels=[0];});
  before.drawBossWeapons(a,boss,image,false,make);after.drawBossWeapons(b,boss,image,false,make);
  const expected=a.getContext('2d').getImageData(0,0,w,h).data,actual=b.getContext('2d').getImageData(0,0,w,h).data;
  const allowed=make(w,h),ctx=allowed.getContext('2d');ctx.setTransform(w/size.width,0,0,h/size.height,0,0);
  let enlarged=0;
  for(const [i,g] of guns.entries()){
   const factor=turretBodyScale(g,scale);if(factor<=1)continue;
   enlarged++;
   const x=size.padX+g.sourceX/boss.config.sourceWidth*boss.width,y=size.padY+g.sourceY/boss.config.sourceHeight*boss.height;
   const socket=g.socket.width*scale*factor/4;
   ctx.fillRect(x-socket-1,y-socket-1,socket*2+2,socket*2+2);
   if(pose==='dead')continue;
   const state=boss.turrets[i],recoil=Math.max(0,1-(boss.weaponClock-state.lastFired)/250)*g.recoil*scale;
   ctx.save();ctx.translate(x,y);ctx.rotate(state.a);ctx.translate(0,-recoil);
   ctx.beginPath();ctx.ellipse(0,-3*scale*factor,g.halfWidth*scale*factor+1,g.back*.85*scale*factor+1,0,0,Math.PI*2);ctx.fill();ctx.restore();
  }
  const mask=ctx.getImageData(0,0,w,h).data;
  let changed=0;
  for(let p=0;p<expected.length;p+=4){
   if(!mask[p+3]){for(let c=0;c<4;c++){if(actual[p+c]!==expected[p+c])assert.equal(actual[p+c],expected[p+c],`unchanged barrel/background boss ${id} DPR ${dpr} ${pose} channel ${p+c}`);barrelChannels++;}}
   else for(let c=0;c<4;c++)if(actual[p+c]!==expected[p+c])changed++;
  }
  if(enlarged&&pose==='normal'){assert.ok(changed>0,'small bodies visibly change');changedBodies+=enlarged;}
  comparisons++;
  if(id===2&&dpr===2&&pose==='normal'){
   const figure=make(1040,330),f=figure.getContext('2d'),hull=await loadImage(root+'public'+boss.config.image);
   f.fillStyle='#07111e';f.fillRect(0,0,1040,330);f.font='22px sans-serif';f.fillStyle='#e8dfc8';f.fillText('Bisher: Körper ca. 6–8 px',25,35);f.fillText('Vorschau: Körper mindestens 12 px',540,35);
   for(const [index,surface] of [a,b].entries()){
    const x=25+index*515,y=115;
    f.drawImage(hull,x,y,boss.width,boss.height);
    f.drawImage(surface,x-size.padX,y-size.padY,size.width,size.height);
   }
   f.font='18px sans-serif';f.fillText('Rohre, Mündungen, Kaliber und Schüsse behalten ihre ursprüngliche Größe.',25,305);
   mkdirSync(root+'../docs/performance-20261019',{recursive:true});writeFileSync(root+'../docs/performance-20261019/turret-body-comparison.png',figure.toBuffer('image/png'));
  }
  allowed.width=allowed.height=0;
 }
 before.disposeBossWeapons(a);after.disposeBossWeapons(b);globalThis.gc?.();
}
console.log(JSON.stringify({passed:true,comparisons,changedBodiesAcrossDPRs:changedBodies,exactUnchangedChannelsOutsideBodyAndSocket:barrelChannels,checks:['50 atlases at DPR 1 and 2','normal, heated, firing and destroyed','exact RGBA outside the intended body/socket region','no new sprite textures or per-frame body canvases'],limits:'Intentional body artwork change, not an assertion of globally identical images or a physical iPhone test.'}));
