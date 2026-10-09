import { Router } from 'express';
import { rewardNetwork } from '../rewardNetwork';
import { rankForLevel } from '../rewardRules';
import { avatarIds, profileKey, unlockedBadges } from '../pilotRules';
import { countryCodes } from '../countries';
import { sanitizeAvatar } from '../avatarImage';
import '../types/session';
const publicProfile=(user:any,network:string)=>{
 const p=user?.pilotProfileByNetwork?.[network]||{},badges=unlockedBadges(user,network);
 const stage=Math.max(1,user?.rewardsByNetwork?.[network]?.highestLevel||1,user?.playerByNetwork?.[network]?.highestSector||1);
 return {username:user.username,bio:typeof p.bio==='string'?p.bio:'',country:countryCodes.includes(p.country)?p.country:'',avatar:p.avatar||{kind:'builtin',id:'helmet-1'},level:Math.ceil(stage/10),serviceRank:rankForLevel(stage),badges,favorites:Array.isArray(p.favorites)?p.favorites.filter((id:any)=>badges.includes(id)).slice(0,3):[],network};
};
const projection=(network:string)=>({_id:0,username:1,[profileKey(network)]:1,[`rewardsByNetwork.${network}`]:1,[`playerByNetwork.${network}.fleet`]:1,[`playerByNetwork.${network}.highestSector`]:1,[`badgeEvidenceByNetwork.${network}`]:1});
export default function mountPilotEndpoints(router:Router){
 router.get('/me',async(req,res)=>{const uid=req.session.currentUser?.uid;if(!uid)return res.status(401).json({error:'not_authenticated'});const network=rewardNetwork(req);try{const user=await req.app.locals.userCollection.findOne({uid},{projection:projection(network)});if(!user)return res.status(404).json({error:'not_found'});return res.json(publicProfile(user,network));}catch{return res.status(503).json({error:'profile_unavailable'});}});
 router.get('/public/:username',async(req,res)=>{const username=req.params.username;if(!username||username.length>100)return res.status(400).json({error:'invalid_username'});const network=rewardNetwork(req);try{const user=await req.app.locals.userCollection.findOne({username},{projection:projection(network)});if(!user)return res.status(404).json({error:'not_found'});return res.json(publicProfile(user,network));}catch{return res.status(503).json({error:'profile_unavailable'});}});
 router.put('/me',async(req,res)=>{
  const uid=req.session.currentUser?.uid;if(!uid)return res.status(401).json({error:'not_authenticated'});
  const network=rewardNetwork(req),body=req.body;
  if(!body||typeof body.bio!=='string'||body.bio.length>160||typeof body.country!=='string'||body.country!==''&&!countryCodes.includes(body.country as any)||!Array.isArray(body.favorites)||body.favorites.length>3||new Set(body.favorites).size!==body.favorites.length)return res.status(400).json({error:'invalid_profile'});
  try{
   const users=req.app.locals.userCollection,user=await users.findOne({uid},{projection:projection(network)});if(!user)return res.status(404).json({error:'not_found'});
   const badges=unlockedBadges(user,network);if(body.favorites.some((id:any)=>!badges.includes(id)))return res.status(400).json({error:'badge_locked'});
   let avatar:any=null;
   if(body.avatar?.kind==='builtin'&&avatarIds.includes(body.avatar.id))avatar={kind:'builtin',id:body.avatar.id};
   else if(body.avatar?.kind==='upload')avatar={kind:'upload',image:await sanitizeAvatar(body.avatar.image)};
   else if(body.avatar!==null)return res.status(400).json({error:'invalid_avatar'});
   const p={bio:body.bio.trim(),country:body.country,favorites:body.favorites,avatar};
   await users.updateOne({uid},{$set:{[profileKey(network)]:p}});
   return res.json(publicProfile({...user,pilotProfileByNetwork:{...user.pilotProfileByNetwork,[network]:p}},network));
  }catch(e){return res.status(e instanceof Error&&e.message.startsWith('avatar_')?400:503).json({error:'profile_save_failed'});}
 });
}
