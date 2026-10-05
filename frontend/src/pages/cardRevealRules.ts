import { ownedShipStage, type ShipStage } from './shipEvolution.ts';
export type CardReward = { key: string; ship?: string; stage?: ShipStage; boss?: number; stars?: number };
export function availableShipCards(ships: readonly {id:string;sprite:number}[], fleet: Record<string,Partial<Record<string,number>>|undefined>, used: readonly string[], upgrades: readonly string[]):CardReward[]{
 return ships.flatMap(ship=>{
  const hasHull=Object.values(fleet[ship.id]||{}).some(n=>(n||0)>0);
  const max=ownedShipStage(ship.sprite,upgrades),cards:CardReward[]=[];
  if(hasHull||used.includes(ship.id))cards.push({key:`${ship.id}-1`,ship:ship.id,stage:1});
  for(let stage=2;stage<=max;stage++)cards.push({key:`${ship.id}-${stage}`,ship:ship.id,stage:stage as ShipStage});
  return cards;
 });
}
export const unseenShipCards=(cards:CardReward[],seen:readonly string[])=>cards.filter(c=>!seen.includes(c.key));
