// Isolated local hook/readiness acceptance. No SDK, API, account or gameplay.
import {useEffect,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {usePreparedGameHulls} from '../../frontend/src/pages/usePreparedGameHulls';
import {preparedHullPlan} from '../../frontend/src/pages/hullSourcePlan';
import * as hulls from '../../frontend/src/pages/paintedShip';
import GameShipVisual from '../../frontend/src/pages/GameShipVisual';
import {loadShipArtwork} from '../../frontend/src/pages/shipArtwork';
import {loadCardImage,loadBossArtwork} from '../../frontend/src/pages/bossArtwork';
import {allPlayerColors} from '../../frontend/src/pages/shipFleet';
import '../../frontend/src/index.css';
import '../../frontend/src/fleetMenus.css';
function OffsetProbe(){const style=hulls.useShipVisualOffset(1,1);return <div id="offset-probe" style={style}/>;}
function Preview(){
 const [normal,setNormal]=useState(false),sector=normal?61:60,encounter=normal?'normal':'bonus';
 const [offsetKey,setOffsetKey]=useState(0);
 usePreparedGameHulls(sector,encounter,0,0,normal?0:1,2);
 const plan=preparedHullPlan(sector,encounter,0,0,normal?0:1,2).slice(0,6);
 useEffect(()=>{(window as any).__prefetchState={sector,hulls,loadCardImage,remountOffset:()=>setOffsetKey(k=>k+1),advance:()=>setNormal(true),artwork:()=>Promise.all(allPlayerColors.slice(0,8).map(color=>loadShipArtwork('/ships/evolution/ship_20_stage_3.png',color.id))),bossArtwork:()=>Promise.all([loadBossArtwork(1,256),loadBossArtwork(1,800)])};});
 return <main className="game-field" style={{width:393,height:744}}><OffsetProbe key={offsetKey}/>{plan.map((h,index)=><div key={`${h.sprite}:${h.color}`} className="cryptoid asteroid" style={{left:60+(index%3)*110,top:120+Math.floor(index/3)*160,width:90,height:90}}><GameShipVisual sprite={h.sprite} color={h.color} variant="enemy"/></div>)}<div className="player-ship" style={{left:200,top:600,width:110,height:110}}><GameShipVisual sprite={1} color="grey" variant="player"/></div></main>;
}
createRoot(document.getElementById('root')!).render(<Preview/>);
