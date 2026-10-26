// Local component preview only; no SDK, account or service request.
import {createRoot} from 'react-dom/client';
import GameRoute from '../../frontend/src/components/GameRoute';
import LevelCompletion from '../../frontend/src/pages/LevelCompletion';
import '../../frontend/src/index.css';
import '../../frontend/src/cockpitMenus.css';
createRoot(document.getElementById('root')!).render(<GameRoute><main className="game-shell" data-effects-paused="true"><LevelCompletion
  summary={{stage:30,score:30000,shards:1500,destroyed:240,hearts:3,combos:40}} name="MEME NEBULA" headline={<><b>LEVEL 3</b><i>ABGESCHLOSSEN</i></>}
  bonusHits={12} bonusResult="+18 Bonus-Shards · +6 Ketten-Shards · SCHILD" bonusPoints={3000} bonusHeart={false}
  prepared saving={false} failed={false} continuing={false} onRetry={()=>{}} onContinue={()=>{}}
/></main></GameRoute>);
