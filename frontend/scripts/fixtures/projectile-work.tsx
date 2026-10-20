// Protected-preview-only native comparison, no account API or gameplay globals.
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import Before from './projectile-before';
import { createProjectilePresentation } from '../../src/pages/projectilePresentation';
import { advanceShipMotion, engineFlamePercent, idleShipMotion } from '../../src/pages/shipRealism';
import type { PlayerShot } from '../../src/pages/playerCombat';
import type { EnemyShot, BossProjectileKind } from '../../src/pages/enemyFire';
import type { BossWeaponKind } from '../../src/pages/bossWeapons';
import { requestGameFrame } from '../../src/lib/frameScheduler';
import { cssFramePacingStats, startCssFramePacing } from '../../src/lib/cssFramePacing';
import '../../src/index.css';
import '../../src/fleetMenus.css';

const shell = document.getElementById('projectile-qa')!;
shell.innerHTML = '<h1>Schüsse und Triebwerke: nativer Vergleich</h1><p>Originale Schussgrafik gegen Darstellung im Spieltakt. Kein iPhone-Temperatur- oder Absturznachweis.</p><div class="compare"><section><h2>Original</h2><div id="before" class="field"></div></section><section><h2>Optimiert</h2><div id="after" class="field"></div></section></div><div class="compare"><section id="old-engines"><h2>Originale Triebwerke</h2><div class="cryptoid"><i class="exhaust"></i><i class="exhaust"></i></div><div class="player-ship"><i class="player-engine"></i><i class="player-engine"></i></div></section><section id="new-engines" class="game-field"><h2>Optimierte Triebwerke</h2><div class="cryptoid"><i class="exhaust"></i><i class="exhaust"></i></div><div class="player-ship"><i class="player-engine"></i><i class="player-engine"></i></div></section></div><pre id="result">Prüfung läuft …</pre>';
const style = document.createElement('style');
style.textContent = 'html,body{height:auto!important;overflow:auto!important}body{padding:24px;background:#071622;color:#edf7fb;font:16px system-ui}h1,h2,p{position:static!important;margin:14px 0}.compare{display:flex;gap:20px;flex-wrap:wrap}.compare>section{width:450px;min-height:150px;flex:none;padding:10px;border:1px solid #698aa3}.field{position:relative;width:430px;height:260px;overflow:hidden;background:#07111d}.game-field{position:relative!important;height:auto!important;min-height:150px!important;overflow:hidden}.compare .cryptoid,.compare .player-ship{position:relative;display:inline-block;left:0;top:0;width:100px;height:70px;transform:none;--flame-length:10%;--nozzle-y:20%;--nozzle-x:50%;--ship-glow:#82d6ff}.compare .exhaust:nth-child(2),.compare .player-engine:nth-child(2){--nozzle-x:70%}pre{white-space:pre-wrap}';
document.head.append(style);
const before = document.getElementById('before')!, after = document.getElementById('after')!;
const output = document.getElementById('result')!, original = createRoot(before);
const mount = document.createElement('div'); mount.style.display = 'contents'; after.append(mount);
const presenter = createProjectilePresentation(mount), stop = startCssFramePacing(document.body);
const checks: { label: string; passed: boolean; detail?: unknown }[] = [];
function check(label: string, passed: boolean, detail?: unknown) { checks.push({label,passed,detail}); if(!passed)throw new Error(label); }
function draw(shots: PlayerShot[], enemyShots: EnemyShot[]) {
  flushSync(() => original.render(<Before game={{shots,enemyShots}} />));
  presenter.present({shots,enemyShots});
}
const properties = ['width','height','transform','background-image','border-radius','border-width','box-shadow','filter','opacity'];
let comparisons = 0, maxBoundsError = 0;
function compare() {
  const a = before.querySelectorAll('.player-laser,.enemy-laser'), b = after.querySelectorAll('.player-laser,.enemy-laser');
  if(a.length!==b.length)throw new Error('count mismatch');
  for(let i=0;i<a.length;i++) {
    if(a[i].className!==b[i].className)throw new Error('class mismatch');
    const oldBox=a[i].getBoundingClientRect(),newBox=b[i].getBoundingClientRect(),oldField=before.getBoundingClientRect(),newField=after.getBoundingClientRect();
    maxBoundsError=Math.max(maxBoundsError,Math.abs(oldBox.left-oldField.left-newBox.left+newField.left),Math.abs(oldBox.top-oldField.top-newBox.top+newField.top),Math.abs(oldBox.width-newBox.width),Math.abs(oldBox.height-newBox.height));
    for(const pseudo of [null,'::before','::after']) {
      const oldStyle=getComputedStyle(a[i],pseudo),newStyle=getComputedStyle(b[i],pseudo);
      for(const key of properties) if(oldStyle.getPropertyValue(key)!==newStyle.getPropertyValue(key))throw new Error(`${key} mismatch (${pseudo})`);
    }
    comparisons++;
  }
}
async function run() {
  const player: PlayerShot={id:1,x:90,y:120,speedX:0,damage:1,empowered:false};
  const enemy: EnemyShot={id:2,x:260,y:120,vx:.15,vy:.2,radius:6};
  for(let visualLevel=1;visualLevel<=5;visualLevel++)for(const empowered of [false,true]){draw([{...player,visualLevel,empowered}],[enemy]);compare();}
  for(const enemyClass of ['light','medium','heavy','elite'] as const){draw([player],[{...enemy,enemyClass}]);compare();}
  for(const bossKind of ['bolt','orb','lance','split','pulse','double','burst','heavy','rapid'] as BossProjectileKind[]){draw([player],[{...enemy,bossKind}]);compare();}
  for(const weaponKind of ['laser','pulse','plasma','heavy','siege','rocket'] as BossWeaponKind[]){draw([player],[{...enemy,weaponKind,weaponColor:'#75d9ee',weaponWidth:7}]);compare();}
  check('Alle Schussformen, Farben, Rotation und Pseudoelemente entsprechen dem Original',comparisons===58&&maxBoundsError<.02,{comparisons,maxBoundsError});
  draw([],[]);check('Treffer-/Phasenentfernung leert beide Schussgruppen',presenter.size===0&&after.querySelectorAll('.player-laser,.enemy-laser').length===0);
  const oldEngines=document.getElementById('old-engines')!,newEngines=document.getElementById('new-engines')!;
  let oldTransitions=0,newTransitions=0;
  const oldRun=()=>{oldTransitions++;},newRun=()=>{newTransitions++;};
  oldEngines.addEventListener('transitionrun',oldRun);newEngines.addEventListener('transitionrun',newRun);
  let motion=idleShipMotion(),frames=0,oldMoves=0,newMoves=0,lastOld='',lastNew='';
  const pacedBefore=cssFramePacingStats().configured;
  await new Promise<void>(resolve=>{
    const frame=()=>{
      motion=advanceShipMotion(motion,Math.sin(frames*.1)*8,4,1000/60);
      const flame=`${engineFlamePercent(motion.thrust)}%`;
      for(const node of document.querySelectorAll<HTMLElement>('#old-engines .cryptoid,#old-engines .player-ship,#new-engines .cryptoid,#new-engines .player-ship'))node.style.setProperty('--flame-length',flame);
      player.x=40+frames*2;
      if(frames%2===0)flushSync(()=>original.render(<Before game={{shots:[{...player}],enemyShots:[]}} />));
      presenter.present({shots:[player],enemyShots:[]});
      const oldPosition=(before.querySelector('.player-laser') as HTMLElement).style.left;
      const newPosition=(after.querySelector('.player-laser') as HTMLElement).style.translate;
      if(oldPosition!==lastOld)oldMoves++;if(newPosition!==lastNew)newMoves++;
      lastOld=oldPosition;lastNew=newPosition;
      if(++frames<120)requestGameFrame(frame);else resolve();
    };
    requestGameFrame(frame);
  });
  oldEngines.removeEventListener('transitionrun',oldRun);newEngines.removeEventListener('transitionrun',newRun);
  check('Bewegte Schüsse nutzen jeden Spieltakt bei weiterhin halbem Szenentakt',oldMoves===60&&newMoves===120,{frames,oldMoves,newMoves});
  check('Bereits geglätteter Schub erzeugt keine neuen Höhen-Transitions',oldTransitions>100&&newTransitions===0,{oldTransitions,newTransitions,configuredDelta:cssFramePacingStats().configured-pacedBefore});
  await new Promise(resolve=>setTimeout(resolve,300));
  const oldFlames=oldEngines.querySelectorAll('.exhaust,.player-engine'),newFlames=newEngines.querySelectorAll('.exhaust,.player-engine');
  const flameProperties=['width','height','background-image','clip-path','filter','border-radius','transform'];
  check('Triebwerksgrafik und endgültige Schubhöhe bleiben erhalten',Array.from(oldFlames).every((node,i)=>{
    const a=getComputedStyle(node),b=getComputedStyle(newFlames[i]);
    return flameProperties.every(key=>a.getPropertyValue(key)===b.getPropertyValue(key));
  }));
  const count=after.querySelectorAll('.player-laser').length,writes=(after.querySelector('.player-laser') as HTMLElement).style.cssText;
  for(let i=0;i<120;i++)presenter.present({shots:[player],enemyShots:[]});
  check('Unveränderte Pausenposition bleibt stabil',count===1&&(after.querySelector('.player-laser') as HTMLElement).style.cssText===writes);
  output.textContent=JSON.stringify({passed:true,checks,build:__CRYPTOID_BUILD__,limits:'Native Chrome DOM/style/bounds and transition counts; no physical iPhone heat, native/GPU memory, presented FPS or crash proof.'},null,2);
}
window.addEventListener('pagehide',()=>{stop();presenter.dispose();original.unmount();},{once:true});
run().catch(error=>{output.textContent=JSON.stringify({passed:false,error:String(error),checks},null,2);});
