import { shipSaveNetwork } from './shipFleet';
const key=(uid:string)=>`cryptoid_card_reveals_v1_${shipSaveNetwork}_${uid}`;
export function readCardReveals(uid:string):string[]{try{const value=JSON.parse(localStorage.getItem(key(uid))||'[]');return Array.isArray(value)?value.filter(v=>typeof v==='string'):[];}catch{return [];}}
export function acknowledgeCard(uid:string,id:string){try{localStorage.setItem(key(uid),JSON.stringify([...new Set([...readCardReveals(uid),id])]));}catch{/* A storage failure may repeat a presentation; it never grants ownership. */}}
