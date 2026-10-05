import { shipSaveNetwork } from './shipFleet';
import { axiosClient } from '../lib/axiosClient';
import { retrySave } from '../lib/accountSave';
const key=(uid:string)=>`cryptoid_card_reveals_v1_${shipSaveNetwork}_${uid}`;
export function readCardReveals(uid:string):string[]{try{const value=JSON.parse(localStorage.getItem(key(uid))||'[]');return Array.isArray(value)?value.filter(v=>typeof v==='string'):[];}catch{return [];}}
export function acknowledgeCard(uid:string,id:string){try{localStorage.setItem(key(uid),JSON.stringify([...new Set([...readCardReveals(uid),id])]));}catch{/* A storage failure may repeat a presentation; it never grants ownership. */}}
const inMemory = new Map<string, Set<string>>();
export function mergeCardReveals(uid: string, ids: readonly string[]) {
 const merged = new Set([...readCardReveals(uid), ...(inMemory.get(uid) || []), ...ids]);
 inMemory.set(uid, merged);
 try { localStorage.setItem(key(uid), JSON.stringify([...merged])); } catch { /* Account persistence remains available. */ }
 return [...merged];
}
export function rememberCard(uid: string, id: string) { mergeCardReveals(uid, [id]); }
export function hasSeenCard(uid: string, id: string) { return readCardReveals(uid).includes(id) || inMemory.get(uid)?.has(id) === true; }
export async function syncCardReveals(uid: string) {
 if (uid === 'guest') return;
 const ids = mergeCardReveals(uid, []);
 if (ids.length) await retrySave(() => axiosClient.post('/progress/card-reveals', { ids }));
}
