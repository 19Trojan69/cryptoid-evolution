import { preparedHullPlan, hullSourcePlan } from '../../frontend/src/pages/hullSourcePlan.ts';
import { preloadHullSources, retainPreparedHulls } from '../../frontend/src/pages/paintedShip.ts';
import { selectedShip } from '../../frontend/src/pages/shipFleet.ts';
import { bossForLevel } from '../../frontend/src/pages/bossManifest.ts';
import { preloadBossWeapons } from '../../frontend/src/pages/bossWeaponTextures.ts';

// Explicit menu preparation only. No game is mounted and no clock is running.
// Cover the real guest's first render plus the following disclosed boss seed.
export async function warmDeviceScene() {
  const first=preparedHullPlan(1,'normal',0,0,0,2),boss=preparedHullPlan(20,'boss-intro',0,0,0,2);
  const selected=selectedShip(),plan=[...first,...boss,{sprite:selected.skin.sprite,color:selected.color.id,stage:1}];
  const lease=retainPreparedHulls(plan),config=bossForLevel(20);
  preloadHullSources(hullSourcePlan(1,'normal',0,0),first);
  preloadHullSources(hullSourcePlan(20,'boss-intro',0,0),boss);
  const hull=new Image();
  const ready=new Promise((resolve,reject)=>{
    hull.onload=()=>{hull.onload=hull.onerror=null;void hull.decode().then(resolve,reject);};
    hull.onerror=()=>{hull.onload=hull.onerror=null;reject(Error('Boss preparation failed'));};
    hull.src=config.image;
  });
  try {
    const [results]=await Promise.all([lease.settled,preloadBossWeapons(config),ready]);
    if(results.some(value=>!value))throw Error('Hull preparation incomplete');
    return lease;
  }catch(error){lease.release();throw error;}
}
