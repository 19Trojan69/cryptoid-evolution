// Compare actual before/after Canvas command streams. No real GPU/FPS inference.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {execFileSync}=require('node:child_process'),ts=require('typescript');
const root=path.resolve(__dirname,'..'),repo=path.dirname(root);
const {createSectorBoss}=require('../src/pages/sectorBoss.ts');
function renderer(before){
 const source=before?execFileSync('git',['show','16fcfb43aad836de0e38f684c0d4cade82b78976:frontend/src/pages/bossWeaponRenderer.ts'],{cwd:repo,encoding:'utf8'}):fs.readFileSync(path.join(root,'src/pages/bossWeaponRenderer.ts'),'utf8');
 let visited=0;const made=[];
 const normalize=x=>x?.ctx?{width:x.width,height:x.height,commands:x.ctx.commands}:x;
 const canvas=(width,height)=>{
  const c={width,height},commands=[];
  c.ctx=new Proxy({commands},{get:(obj,key)=>{
   if(key in obj)return obj[key];
   if(key==='createLinearGradient')return(...args)=>{const stops=[];commands.push(['gradient',args]);return{args,stops,addColorStop:(...v)=>stops.push(v)};};
   return(...args)=>commands.push([key,JSON.parse(JSON.stringify(args.map(normalize)))]);
  },set:(obj,key,value)=>{commands.push(['set',key,JSON.parse(JSON.stringify(normalize(value)))]);obj[key]=value;return true;}});
  c.getContext=()=>c.ctx;made.push(c);return c;
 };
 class CountedMap extends Map { *[Symbol.iterator](){for(const item of super[Symbol.iterator]()){visited++;yield item;}} }
 const context={exports:{},Map:CountedMap,require:name=>require(path.join(root,'src/pages',name))};
 vm.runInNewContext(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,context);
 return{api:context.exports,canvas,made,visited:()=>visited};
}
const before=renderer(true),after=renderer(false);let cases=0,totalCommands=0;const hashes=[];
for(const level of [10,250,500]){
 const boss=createSectorBoss(level,390,90,844),size=before.api.weaponCanvasSize(boss);
 const a=before.canvas(Math.ceil(size.width*2),Math.ceil(size.height*2)),b=after.canvas(a.width,a.height);
 for(const heat of [0,1,4,8,4,0])for(const frozen of [false,true]){
  boss.weaponClock+=16;
  boss.turrets.forEach((gun,i)=>{gun.health=gun.maxHealth*(1-heat/8*.99);gun.a=i*.13;gun.lock=i%2?170:0;gun.lastFired=boss.weaponClock-(i%3?45:300);gun.firedBarrels=[0];if(heat===4&&i%4===0)gun.health=0;});
  a.ctx.commands.length=b.ctx.commands.length=0;
  before.api.drawBossWeapons(a,boss,{id:'original-texture'},frozen,before.canvas);
  after.api.drawBossWeapons(b,boss,{id:'original-texture'},frozen,after.canvas);
  assert.deepEqual(b.ctx.commands,a.ctx.commands);cases++;totalCommands+=b.ctx.commands.length;
  hashes.push(crypto.createHash('sha256').update(JSON.stringify(b.ctx.commands)).digest('hex'));
 }
 before.api.disposeBossWeapons(a);after.api.disposeBossWeapons(b);
}
assert.ok(before.made.every(c=>c.width===0&&c.height===0));assert.ok(after.made.every(c=>c.width===0&&c.height===0));
assert.ok(before.visited()>0);assert.equal(after.visited(),0);
const result={passed:true,mode:'actual Canvas draw commands with controlled Node contexts; no pixel rasterization/native GPU/frame-time proof',cases,levels:[10,250,500],identicalCommands:totalCommands,combinedHash:crypto.createHash('sha256').update(hashes.join('')).digest('hex'),beforeHeatCacheEntriesScanned:before.visited(),afterHeatCacheEntriesScanned:after.visited(),beforeCanvasesCreated:before.made.length,afterCanvasesCreated:after.made.length,allSurfacesDisposed:true};
if(process.env.CRYPTOID_BOSS_RENDER_OUT)fs.writeFileSync(process.env.CRYPTOID_BOSS_RENDER_OUT,JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
