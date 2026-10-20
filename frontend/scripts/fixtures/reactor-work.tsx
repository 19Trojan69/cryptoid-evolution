// Protected-preview-only comparison. No account API, gameplay mutation or debug global.
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import Before from './reactor-before';
import After from '../../src/pages/BossReactorView';
import { createSectorBoss, moveSectorBoss, type SectorBoss } from '../../src/pages/sectorBoss';
import { startCssFramePacing } from '../../src/lib/cssFramePacing';
import { requestGameFrame } from '../../src/lib/frameScheduler';
import '../../src/index.css';
import '../../src/fleetMenus.css';

const shell=document.getElementById('reactor-qa')!;
shell.innerHTML='<h1>Boss-Reaktor: Original und optimierter Stand</h1><p>Native SVG-/DOM-Prüfung. Keine iPhone-Speicher-, Temperatur- oder FPS-Messung.</p><p id="case-label"></p><div class="comparison"><section><h2>Original</h2><div id="before"></div></section><section><h2>Optimiert</h2><div id="after"></div></section></div><p><button id="closed">Geschlossen</button> <button id="opening">Öffnen</button> <button id="firing">Schuss</button></p><pre id="result">Prüfung läuft …</pre>';
const style=document.createElement('style');
style.textContent='html,body{height:auto!important;min-height:100%;overflow:auto!important}body{padding:24px;background:#071622;color:#edf7fb;font:16px system-ui}h1,h2,p{position:static!important;margin:14px 0}.comparison{display:flex;gap:24px;flex-wrap:wrap}.comparison section{min-width:330px;padding:20px;border:1px solid #6594a4}.hull{position:relative;margin:20px auto;isolation:isolate}.hull>img{width:100%;height:100%;object-fit:fill}pre{white-space:pre-wrap}button{padding:10px 18px}';
document.head.append(style);
const oldRoot=createRoot(document.getElementById('before')!),newRoot=createRoot(document.getElementById('after')!);
const output=document.getElementById('result')!,label=document.getElementById('case-label')!;
const stop=startCssFramePacing(document.body);
window.addEventListener('pagehide',()=>{stop();oldRoot.unmount();newRoot.unmount();},{once:true});
const make=(id:number,width=430)=>moveSectorBoss(createSectorBoss(id*10,width,96,825),10000,width,825);
let current=make(1),comparisons=0;
function render(boss:SectorBoss){
  const frame=(Reactor:typeof Before)=><div className="hull" style={{width:boss.width,height:boss.height}}><img src={boss.config.image} alt="Boss-Rumpf"/><Reactor boss={boss}/></div>;
  flushSync(()=>{oldRoot.render(frame(Before));newRoot.render(frame(After));});
}
function normalized(container:string){
  const svg=document.querySelector(`#${container} svg`)!;
  const prefix=svg.querySelector('linearGradient')!.id.replace(/-steel$/,'');
  return svg.outerHTML.replaceAll(prefix,'reactor-qa');
}
function show(mode:'closed'|'opening'|'firing'){
  current=make(1);current.turrets.forEach(g=>{g.health=mode==='closed'?g.maxHealth:0;});
  current.core={elapsed:mode==='opening'?450:mode==='firing'?80:0,volley:mode==='firing'?1:0};
  render(current);label.textContent=`Boss 01 · ${mode}`;
}
document.getElementById('closed')!.addEventListener('click',()=>show('closed'));
document.getElementById('opening')!.addEventListener('click',()=>show('opening'));
document.getElementById('firing')!.addEventListener('click',()=>show('firing'));
async function ready(url:string){const image=new Image();image.src=url;await image.decode();}
async function run(){
  const ids=[1,2,10,25,50],widths=[320,430,820];
  await Promise.all(ids.map(id=>ready(make(id).config.image)));
  let retainedSvg:Element|null=null;
  const check=(boss:SectorBoss)=>{
    render({...boss});
    if(normalized('before')!==normalized('after'))throw new Error(`SVG mismatch: boss ${boss.config.id}`);
    comparisons++;
    const node=document.querySelector('#after svg')!;
    if(retainedSvg&&retainedSvg!==node)throw new Error('SVG host replaced');retainedSvg=node;
  };
  for(const id of ids)for(const width of widths){
    const boss=make(id,width);check(boss);
    boss.x+=10;boss.elapsed+=33;check(boss);
    boss.turrets.forEach(g=>{g.health=0;});boss.core={elapsed:0,volley:0};check(boss);
    boss.core.elapsed=450;check(boss);boss.core.elapsed=1800;check(boss);
    boss.core.volley=1;boss.core.elapsed=0;check(boss);
    boss.core.elapsed=90;check(boss);boss.core.elapsed=180;check(boss);
    boss.core.lastShotColor='#76aaff';check(boss);
    label.textContent=`Geprüft: Boss ${id} · ${width}px · ${comparisons} Vergleiche`;
    await new Promise<void>(resolve=>requestGameFrame(()=>resolve()));
  }
  show('firing');
  output.textContent=JSON.stringify({passed:true,comparisons,bosses:ids,widths,svgHostRetained:true,build:__CRYPTOID_BUILD__,limits:'Native Chrome DOM/SVG comparison; no physical iPhone crash, GPU/native memory, heat or FPS proof.'},null,2);
}
run().catch(error=>{output.textContent=JSON.stringify({passed:false,error:String(error),comparisons},null,2);});
