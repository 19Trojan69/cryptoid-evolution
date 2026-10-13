import { blockFlights } from './blockFlights.ts';
import { enemyAppearance } from './shipFleet.ts';
import { BONUS_TARGET_COUNT, bonusShowcaseShip } from './bonusChallenge.ts';
import { bossEscortCount, reactorEscortCount, bossEscortRosterIndex } from './bossEscorts.ts';
import { bossForLevel } from './bossManifest.ts';
import type { ShipResource } from './paintedShip';

const normalShips = (sector:number,rulesVersion:number):ShipResource[] =>
 Array.from({length:blockFlights(sector,rulesVersion).reduce((a,b)=>a+b,0)},(_,index)=>({...enemyAppearance(sector,index),stage:1}));
const bonusShips = (sector:number):ShipResource[] =>
 Array.from({length:BONUS_TARGET_COUNT},(_,index)=>({...bonusShowcaseShip(index,sector),stage:1}));
const escortShips = (sector:number,wave:number):ShipResource[] =>
 Array.from({length:Math.max(bossEscortCount(sector),reactorEscortCount(sector))},(_,index)=>({...enemyAppearance(sector,bossEscortRosterIndex(index,wave)),stage:1}));

// A finite lookahead, never a campaign-wide preload. The whole normal block is
// pinned so its second/third formation cannot trigger a new preparation gate.
export function sceneResourcePlan(sector:number,encounter:string,wave:number,rulesVersion:number) {
 const ships:ShipResource[]=[],upcoming:ShipResource[]=[];
 let upcomingBoss;
 if(encounter==='normal') {
  ships.push(...normalShips(sector,rulesVersion));
  if(sector<500) {
   upcomingBoss=bossForLevel(sector+1);
   if(upcomingBoss)upcoming.push(...escortShips(sector+1,0),...escortShips(sector+1,1),...bonusShips(sector+1));
   else upcoming.push(...normalShips(sector+1,rulesVersion));
  }
 } else if(encounter==='bonus') {
  ships.push(...bonusShips(sector));
  if(sector<500)upcoming.push(...normalShips(sector+1,rulesVersion));
 } else {
  ships.push(...escortShips(sector,wave));
  upcoming.push(...escortShips(sector,wave+1),...bonusShips(sector));
  if(sector<500)upcoming.push(...normalShips(sector+1,rulesVersion));
 }
 return {ships,upcoming,upcomingBoss};
}
