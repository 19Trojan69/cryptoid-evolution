import { shipCardAvailable } from './cardAvailability.ts';
import { ownedShipStage, type ShipStage } from './shipEvolution.ts';
export type CardReward = { key: string; ship?: string; stage?: ShipStage; boss?: number; stars?: number };
export function availableShipCards(ships: readonly {id:string;sprite:number}[], fleet: Record<string,Partial<Record<string,number>>|undefined>, _used: readonly string[], upgrades: readonly string[]):CardReward[]{
 return ships.flatMap(ship=>{
  const hasHull=Object.values(fleet[ship.id]||{}).some(n=>(n||0)>0);
  const max=ownedShipStage(ship.sprite,upgrades),cards:CardReward[]=[];
  if(shipCardAvailable(ship.sprite,1)&&hasHull)cards.push({key:`${ship.id}-1`,ship:ship.id,stage:1});
  for(let stage=2;hasHull&&stage<=max;stage++)if(shipCardAvailable(ship.sprite,stage as ShipStage))cards.push({key:`${ship.id}-${stage}`,ship:ship.id,stage:stage as ShipStage});
  return cards;
 });
}
export const unseenShipCards=(cards:CardReward[],seen:readonly string[])=>cards.filter(c=>!seen.includes(c.key));

/** First-ever mission only: a free starter is an acquisition, not a replay of the hangar. */
export function firstMissionStarterCards(profile: {
 version: number; fleet: Record<string, Partial<Record<string, number>> | undefined>;
 usedShipSkins?: readonly string[]; cardReveals?: readonly string[];
} | null): CardReward[] {
 if (!profile || profile.version !== 0 || profile.usedShipSkins?.length || profile.cardReveals?.includes('grey-scout-1')) return [];
 const owned = Object.keys(profile.fleet).filter(id => Object.values(profile.fleet[id] || {}).some(count => (count || 0) > 0));
 return owned.length === 1 && owned[0] === 'grey-scout' ? [{ key: 'grey-scout-1', ship: 'grey-scout', stage: 1 }] : [];
}
