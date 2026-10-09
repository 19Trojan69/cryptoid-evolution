import { standardShips } from './playerSave';
export const avatarIds = ['helmet-1','helmet-2','helmet-3','helmet-4','robot-1','robot-2','robot-3','alien-1','alien-2','alien-3','alien-4','trojan-wolf'] as const;
export const badgeIds = ['first-boss','ten-bosses','perfect-formation','high-combo','full-fleet','final-boss'] as const;
export type BadgeId = typeof badgeIds[number];
export const profileKey = (network:string) => `pilotProfileByNetwork.${network}`;
export const unlockedBadges = (user:any, network:string): BadgeId[] => {
 const wins=user?.rewardsByNetwork?.[network]?.bossWins||{};
 const bosses=Object.entries(wins).filter(([id,n])=>Number.isInteger(Number(id))&&Number(id)>=1&&Number(id)<=50&&typeof n==='number'&&Number.isSafeInteger(n)&&n>0);
 const evidence=user?.badgeEvidenceByNetwork?.[network]||{};
 const bossCount=Math.max(bosses.reduce((sum,[,n])=>sum+Math.min(3,Number(n)),0),Number.isSafeInteger(evidence.bossDefeats)?evidence.bossDefeats:0);
 const fleet=user?.playerByNetwork?.[network]?.fleet||{};
 return badgeIds.filter(id=>id==='first-boss'?bosses.length>=1:id==='ten-bosses'?bossCount>=10:id==='final-boss'?bosses.some(([id])=>id==='50'):id==='full-fleet'?standardShips.every(skin=>Object.values(fleet[skin]||{}).some(n=>typeof n==='number'&&Number.isSafeInteger(n)&&n>0)):id==='perfect-formation'?evidence.perfectFormation===true:evidence.highCombo===true);
};
// Block damage baseline is written at section start, never replaced by checkpoints.
export const verifiedBlockBadges = (player:any,event:any,snapshot:any): { perfectFormation?:true; highCombo?:true } => {
 const mission=player?.mission || (player?.lastStart?.badgeMetrics===1 ? {sector:player.lastStart.startSector,phase:"normal",damageAtStart:0,destroyedAtStart:0,snapshot:{hearts:3+(player.lastStart.armorBonus||0),destroyed:0}} : null), baseline=mission?.damageAtStart;
 const previous=mission?.snapshot;
 if(event.kind!=='block'||!snapshot||mission?.sector!==event.stage||mission?.phase!=='normal')return {};
 const destroyed=snapshot.destroyed-(mission?.destroyedAtStart ?? snapshot.destroyed);
 const damageOK=Number.isSafeInteger(snapshot.damageCount)&&Number.isSafeInteger(baseline)&&baseline>=0&&snapshot.damageCount>=baseline;
 const comboOK=Number.isSafeInteger(snapshot.comboTotal)&&snapshot.comboTotal>=10&&snapshot.comboTotal<=Math.floor(snapshot.destroyed/2)&&snapshot.score>=snapshot.comboTotal*50;
 return { ...(damageOK&&snapshot.damageCount===baseline&&snapshot.hearts>=previous?.hearts&&destroyed>0?{perfectFormation:true}:{}), ...(comboOK?{highCombo:true}:{}) };
};
