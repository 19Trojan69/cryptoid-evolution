// Protected-preview-only raster comparison. No account, save or gameplay API.
import { createSectorBoss, moveSectorBoss } from '../../src/pages/sectorBoss';
import { drawBossWeapons, weaponCanvasSize, disposeBossWeapons } from '../../src/pages/bossWeaponRenderer';
import { drawImpact } from '../../src/pages/CanvasEffects';
import { normalExplosionArt } from '../../src/pages/normalEffectArtwork';
import { layerSvg } from '../../src/pages/normalEffectMath.mjs';
import { gameRenderScale } from '../../src/pages/renderResolution';

const root=document.getElementById('memory-qa')!;
root.innerHTML='<h1>Normale Spielauflösung</h1><p>Links: bisherige Pixeldichte. Rechts: normale Auflösung. Gleiche Grafik, Größe und Animation.</p><div id="cases"></div><pre id="result">Prüfung läuft …</pre>';
const style=document.createElement('style');
style.textContent='body{margin:20px;background:#071622;color:#edf7fb;font:15px system-ui}h1{font-size:24px}.pair{display:flex;flex-wrap:wrap;gap:18px;margin:18px 0}.tile{border:1px solid #547180;padding:12px;width:380px}.art{position:relative;width:380px;height:180px;overflow:hidden;background:#081d30}canvas,img{position:absolute;pointer-events:none}pre{white-space:pre-wrap}';
document.head.append(style);
const output=document.getElementById('result')!;
const image=async(src:string)=>{const img=new Image();img.src=src;await img.decode();return img;};
const pair=(label:string)=>{
  const row=document.createElement('section');row.innerHTML=`<h2>${label}</h2><div class="pair"><div class="tile">Bisher<div class="art"></div></div><div class="tile">Normal<div class="art"></div></div></div>`;
  document.getElementById('cases')!.append(row);return [...row.querySelectorAll<HTMLDivElement>('.art')];
};
const owned:HTMLCanvasElement[]=[];
const canvas=(width:number,height:number,scale:number)=>{const c=document.createElement('canvas');c.width=Math.ceil(width*scale);c.height=Math.ceil(height*scale);c.style.width=`${width}px`;c.style.height=`${height}px`;owned.push(c);return c;};
async function run(){
  let checks=0;const backingStores=[];
  for(const id of [1,2]){
    const boss=moveSectorBoss(createSectorBoss(id*10,380,96,825),10000,380,825);
    const hull=await image(boss.config.image),atlas=await image(boss.config.weaponImage);
    const boxes=pair(`Boss ${id}`),size=weaponCanvasSize(boss);
    for(const [index,scale] of [2,gameRenderScale(3)].entries()){
      const box=boxes[index],shell=document.createElement('div');shell.style.cssText=`position:absolute;left:${(380-boss.width)/2}px;top:48px;width:${boss.width}px;height:${boss.height}px`;
      const img=hull.cloneNode() as HTMLImageElement;img.style.cssText='width:100%;height:100%';shell.append(img);
      const c=canvas(size.width,size.height,scale);c.style.left=`${-size.padX}px`;c.style.top=`${-size.padY}px`;
      if(!drawBossWeapons(c,boss,atlas))throw new Error('Boss draw failed');
      shell.append(c);box.append(shell);backingStores.push({kind:`boss-${id}`,scale,bytes:c.width*c.height*4});checks++;
    }
  }
  const hull=await image('/ships/evolution/ship_01_stage_1.png');
  for(const age of [120,500,1000]){
    const boxes=pair(`Explosion · ${age} ms`);
    for(const [index,scale] of [3,gameRenderScale(3)].entries()){
      const assets:any={hull};
      for(const kind of ['fire','smoke'] as const){
        const geometry=layerSvg(normalExplosionArt[kind],80,scale),url=URL.createObjectURL(new Blob([geometry.svg],{type:'image/svg+xml'}));
        try{const img=await image(url),c=canvas(geometry.pixels/scale,geometry.pixels/scale,scale);c.getContext('2d')!.drawImage(img,0,0);assets[kind]={...geometry,canvas:c};}finally{URL.revokeObjectURL(url);}
      }
      const c=canvas(380,180,scale),ctx=c.getContext('2d')!;ctx.scale(scale,scale);
      drawImpact(ctx,{effect:{x:190,y:90,debrisSize:64,target:'enemy'},assets,pieces:[]},age);
      boxes[index].append(c);backingStores.push({kind:`effect-${age}`,scale,bytes:c.width*c.height*4});checks++;
    }
  }
  output.textContent=JSON.stringify({passed:true,checks,renderScale:gameRenderScale(3),backingStores,build:__CRYPTOID_BUILD__,limits:'Native Chrome raster/asset check and visual comparison, not iPhone process memory, heat, perceived FPS or proof of a Whitescreen fix.'},null,2);
}
window.addEventListener('pagehide',()=>{for(const c of owned)disposeBossWeapons(c);},{once:true});
run().catch(error=>{output.textContent=JSON.stringify({passed:false,error:String(error)},null,2);});
