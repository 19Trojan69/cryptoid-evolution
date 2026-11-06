import {preparedHullPlan,hullSourcePlan} from '../../frontend/src/pages/hullSourcePlan';
import {preloadHullSources,retainPreparedHulls} from '../../frontend/src/pages/paintedShip';
import {selectedShip} from '../../frontend/src/pages/shipFleet';
import {bossForLevel} from '../../frontend/src/pages/bossManifest';
import {preloadBossWeapons} from '../../frontend/src/pages/bossWeaponTextures';
export async function warmLabScene(scene){
 const selected=selectedShip(),first=preparedHullPlan(1,'normal',0,0,0,2);
 const leases=[retainPreparedHulls(first),retainPreparedHulls([{sprite:selected.skin.sprite,color:selected.color.id,stage:1}])];
 preloadHullSources(hullSourcePlan(1,'normal',0,0),first);
 const pending=[];
 if(scene!=='normal'){
   const plan=preparedHullPlan(20,'boss-intro',0,0,0,2),config=bossForLevel(20);
   leases.push(retainPreparedHulls(plan));preloadHullSources(hullSourcePlan(20,'boss-intro',0,0),plan);
   pending.push(preloadBossWeapons(config));const image=new Image();image.src=config.image;pending.push(image.decode());
 }
 let released=false;const release=()=>{if(released)return;released=true;for(const lease of leases)lease.release();};
 try{const [states]=await Promise.all([Promise.all(leases.map(l=>l.settled)),...pending]);if(states.flat().some(value=>!value))throw Error('Preparation incomplete');return {release};}
 catch(error){release();throw error;}
}
