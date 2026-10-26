// Local visual fixture only: renders the real shipped components with sample values.
import {useState} from 'react';
import {createRoot} from 'react-dom/client';
import '../../frontend/src/index.css';
import '../../frontend/src/gameViewport.css';
import '../../frontend/src/mobileMenus.css';
import '../../frontend/src/missionDialogMobile.css';
import '../../frontend/src/mobileDeepMenus.css';
import '../../frontend/src/hudDepth.css';
import '../../frontend/src/locales/typography.css';
import '../../frontend/src/selectionControls.css';
import '../../frontend/src/smartphoneUi.css';
import '../../frontend/src/cockpitMenus.css';
import GameRoute from '../../frontend/src/components/GameRoute';
import GameAccessGate from '../../frontend/src/components/GameAccessGate';
import SignIn from '../../frontend/src/components/SignIn';
import SystemSettings from '../../frontend/src/pages/SystemSettings';
import SectorBackdrop from '../../frontend/src/pages/SectorBackdrop';
import LevelCompletion from '../../frontend/src/pages/LevelCompletion';
import {useLocale} from '../../frontend/src/i18n';
function Preview(){
 const {t}=useLocale();const [music,setMusic]=useState(60),[effects,setEffects]=useState(80),[continued,setContinued]=useState(0);
 const view=new URLSearchParams(location.search).get('view')||'level';
 if(view==='signin')return <main className="landing-shell"><SignIn onSignIn={()=>{}} onModalClose={()=>{}}/></main>;
 return <GameRoute>{view==='access'?<GameAccessGate pending error={null} onRetry={()=>{}}/>:<main className="game-shell" data-effects-paused="true">
 <SectorBackdrop sector={50} player={{x:.5,y:.8}} paused/>
 <div className="preview-hud" style={{position:'absolute',top:12,left:14,right:14,zIndex:view==='settings'?1:50,display:'flex',justifyContent:'space-between',color:'#e3d2aa',fontFamily:'Oxanium,sans-serif',border:'1px solid #e3d2aa66',padding:14,borderRadius:12,background:'#0d2032'}}>♥ / 3 <b>LEVEL 5</b><b>◆ 43.384</b></div>
 {view==='settings'?<div className="game-overlay pause-settings-overlay" role="dialog" aria-modal="true" aria-labelledby="preview-pause"><div className="game-modal pause-settings-modal"><p className="eyebrow">{t('MISSION PAUSED')}</p><h1 id="preview-pause">{t('A short breather.')}</h1><p>{t('Level')} 5 · MAINNET CORE</p><SystemSettings compactMobile idPrefix="preview" musicVolume={music} effectsVolume={effects} changeMusicVolume={setMusic} changeEffectsVolume={setEffects}/><button className="button button-primary pause-resume-button" onClick={()=>setContinued(v=>v+1)}>{t('Resume')} ▶</button></div></div>:<LevelCompletion summary={{stage:50,score:52211,shards:1855,destroyed:329,hearts:3,combos:37}} name="MAINNET CORE" headline={<><b>{t('LEVEL')} 5</b><i>{t('COMPLETE')}</i></>} bonusHits={12} bonusResult={`+19 ${t('Shards')} · +6 ${t('CHAIN SHARDS')} · ${t('SHIELD')}`} bonusPoints={3000} bonusHeart={new URLSearchParams(location.search).get('heart')!=='0'} prepared saving={false} failed={false} continuing={false} onRetry={()=>{}} onContinue={()=>setContinued(v=>v+1)}/>}
 <output id="fixture-continued" hidden>{continued}</output>
 </main>}</GameRoute>;
}
createRoot(document.getElementById('root')!).render(<Preview/>);
