// Local visual acceptance only; never an application route or production input.
import {createRoot} from 'react-dom/client';
import GameShipVisual from '../../frontend/src/pages/GameShipVisual';
import BossHealthView from '../../frontend/src/pages/BossHealthView';
import {createSectorBoss} from '../../frontend/src/pages/sectorBoss';
import {shipHullStyle} from '../../frontend/src/pages/shipFleet';
import type {ShipStage} from '../../frontend/src/pages/shipEvolution';
import '../../frontend/src/index.css';
import '../../frontend/src/fleetMenus.css';
const params=new URLSearchParams(location.search),stage=Number(params.get('stage')||1) as ShipStage,enemy=params.get('kind')==='enemy';
createRoot(document.getElementById('root')!).render(<main className="game-field qa-field">
  <style>{`.qa-field{width:100%;height:auto;max-width:none;min-height:100vh;overflow:visible;background:#061523;padding:18px;display:grid;grid-template-columns:repeat(4,1fr);gap:8px}.qa-cell{height:230px;position:relative;background:#0b2233;border:1px solid #25445a;border-radius:8px;overflow:visible}.qa-cell h2{font:12px monospace;margin:10px;color:#ffe1a5}.qa-cell .player-ship,.qa-cell .asteroid{left:50%;top:106px;width:156px;height:156px;--flame-length:15%;transform:translate(-50%,-50%)}.qa-cell .asteroid{width:96px;height:96px;top:102px}.qa-cell .material-hull::after{display:none}`}</style>
  {Array.from({length:20},(_,sprite)=><section className="qa-cell" key={sprite} data-sprite={sprite}><h2>{sprite.toString().padStart(2,'0')} · {enemy?'enemy':'player'} · stage {stage}</h2>
    <div className={enemy?`asteroid asteroid-${sprite%4>1?'large':'small'} cryptoid cryptoid-${['light','medium','heavy','elite'][sprite%4]}`:'player-ship player-ship-grey'} style={{...shipHullStyle(sprite,true)}}>
      <GameShipVisual sprite={sprite} color="grey" stage={stage} variant={enemy?'enemy':'player'}/>
      {enemy&&<span className="health-bar" role="progressbar"><b style={{width:'64%'}}/></span>}
    </div>
  </section>)}
  {[1,12,30,50].map(id=>{const boss=createSectorBoss(id*10,230,90,900);return <section key={'boss'+id} className="qa-cell"><h2>Boss {id} – unchanged bars</h2><div className="asteroid sector-boss" style={{width:boss.width,height:boss.height}}><BossHealthView boss={boss}/><div className="boss-core-check" style={{position:'absolute',top:80,width:boss.width,height:boss.height}}><BossHealthView boss={{...boss,turrets:boss.turrets.map(g=>({...g,health:0}))}}/></div></div></section>;})}
</main>);
