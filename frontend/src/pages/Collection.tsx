import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLocale } from '../i18n';
import { loadAccountSave } from '../lib/accountSave';
import { axiosClient } from '../lib/axiosClient';
import { playerSkins } from './shipFleet';
import { shipEvolutionAsset, type ShipStage } from './shipEvolution';
import { bossManifest } from './bossManifest';
import { bossName } from './bossNames';
import BossPortrait from './BossPortrait';
import { playerCardUnlocked } from './collectionRules';
import { bossCard, shipCard, type CollectionCard } from './collectionData';
import './collection.css';

type Ownership={used:string[];upgrades:string[];wins:Record<string,number>};
export default function Collection({uid,onClose}:{uid?:string;onClose:()=>void}){
 const {locale}=useLocale(),de=locale.startsWith('de'),say=(a:string,b:string)=>de?a:b;
 const [category,setCategory]=useState(0),[selected,setSelected]=useState<CollectionCard|null>(null);
 const [ownership,setOwnership]=useState<Ownership>({used:[],upgrades:[],wins:{}}),[status,setStatus]=useState('loading'),[retry,setRetry]=useState(0);
 const exportVersion=useRef(0);
 const [busy,setBusy]=useState(false),[exportError,setExportError]=useState(false),[download,setDownload]=useState<string|null>(null);
 const dialog=useRef<HTMLDialogElement>(null),close=useRef<HTMLButtonElement>(null),scroller=useRef<HTMLDivElement>(null);
 useEffect(()=>{const previous=document.activeElement as HTMLElement|null;dialog.current?.showModal();close.current?.focus();return()=>{dialog.current?.close();previous?.isConnected&&previous.focus();};},[]);
 useEffect(()=>{let alive=true;setStatus('loading');setOwnership({used:[],upgrades:[],wins:{}});
  if(!uid){setStatus('ready');return;}
  void Promise.all([loadAccountSave(),axiosClient.get<{ownedShipUpgrades?:string[]}>('/hangar/inventory'),axiosClient.get<{progress:{bossWins:Record<string,number>}}>('/rewards/me')]).then(([save,inventory,rewards])=>{if(alive){setOwnership({used:save.usedShipSkins||[],upgrades:inventory.data.ownedShipUpgrades||[],wins:rewards.data.progress.bossWins});setStatus('ready');}},()=>{if(alive)setStatus('error');});
  return()=>{alive=false;};
 },[uid,retry]);
 useEffect(()=>()=>{if(download)URL.revokeObjectURL(download);},[download]);
 useEffect(()=>{exportVersion.current++;scroller.current?.scrollTo(0,0);setDownload(null);setExportError(false);setBusy(false);return()=>{exportVersion.current++;};},[selected,category]);
 const categories=[say('Bosse','Bosses'),'Standard','Advanced','Elite'];
 const entries=category===0?bossManifest.map(b=>({key:`boss-${b.id}`,name:bossName(b.id),image:b.image,unlocked:(ownership.wins[b.id]||0)>0,tier:Math.ceil(b.id/10),serial:`B-${String(b.id).padStart(2,'0')}`,make:()=>bossCard(b.id,locale),boss:b.id})):playerSkins.map(ship=>({key:`${ship.id}-${category}`,name:ship.name,image:shipEvolutionAsset(ship.sprite,category as ShipStage),unlocked:playerCardUnlocked(ship.id,ship.sprite,category as ShipStage,ownership.used,ownership.upgrades),tier:category,serial:`P-${String(ship.sprite+1).padStart(2,'0')}/${category}`,make:()=>shipCard(ship.id,category as ShipStage,de),boss:0}));
 const save=async()=>{if(!selected||busy)return;setBusy(true);setExportError(false);const version=exportVersion.current;try{const {exportCollectionCard}=await import('./collectionExport');const blob=await exportCollectionCard(selected,de);if(version===exportVersion.current)setDownload(URL.createObjectURL(blob));}catch{if(version===exportVersion.current)setExportError(true);}finally{if(version===exportVersion.current)setBusy(false);}};
 return createPortal(<dialog ref={dialog} className="collection-dialog" aria-labelledby="collection-title" onCancel={e=>{e.preventDefault();e.stopPropagation();selected?setSelected(null):onClose();}}>
  <header className="collection-header"><div><p>{say('DAS FLOTTENARCHIV','THE FLEET ARCHIVE')}</p><h2 id="collection-title">{selected?selected.name:say('Deine Sammlung','Your collection')}</h2></div><span aria-hidden="true">✧</span></header>
  <div ref={scroller} className="collection-scroll">
   {!selected?<>
    <p className="collection-intro">{say('Entdecke 50 Bosse und 60 Schiffskarten. Jede freigeschaltete Karte erzählt ihre Geschichte und lässt sich mit ihrer Ausstattung als PNG speichern.','Discover 50 bosses and 60 ship cards. Each unlocked card tells its story and can be saved with its equipment as a PNG.')}</p>
    <div className="collection-tabs" role="group" aria-label={say('Kategorien','Categories')}>{categories.map((name,index)=><button type="button" key={name} aria-pressed={category===index} onClick={()=>setCategory(index)}>{name}</button>)}</div>
    <p className="collection-rule">{category===0?say('Besiege einen Boss, um seine Karte zu entschlüsseln.','Defeat a boss to decrypt its card.'):category===1?say('Die Standardkarte wird beim ersten Einsatz dieses Schiffs freigeschaltet.','The Standard card unlocks on the first mission using that ship.'):say('Die Karte wird durch den Kauf dieser Aufrüstung freigeschaltet. Elite setzt Advanced voraus.','Purchase this upgrade to unlock its card. Elite requires Advanced.')}</p>
    {!uid&&<p className="collection-rule">{say('Melde dich an, um deine freigeschalteten Karten zu laden.','Sign in to load your unlocked cards.')}</p>}
    {status==='loading'?<p role="status">{say('Sammlung wird geladen …','Loading collection …')}</p>:status==='error'?<div role="alert"><p>{say('Die Sammlung konnte nicht geladen werden.','Could not load your collection.')}</p><button type="button" onClick={()=>setRetry(n=>n+1)}>{say('Erneut versuchen','Retry')}</button></div>:<>
     <p className="collection-count">{entries.filter(e=>e.unlocked).length}/{entries.length} {say('FREIGESCHALTET','UNLOCKED')}</p>
     <div className="collection-grid">{entries.map(entry=><button type="button" key={entry.key} className={`collection-tile tier-${entry.tier} ${entry.unlocked?'':'is-locked'}`} disabled={!entry.unlocked} onClick={()=>setSelected(entry.make())}>
      <span className="collection-serial">{entry.serial} <span>{'✦'.repeat(entry.tier)}</span></span>
      <div className="collection-art">{entry.unlocked&&entry.boss?<BossPortrait id={entry.boss}/>:<img src={entry.image} alt="" loading="lazy"/>}</div>
      <strong>{entry.name}</strong><small>{entry.unlocked?say('Karte öffnen','Open card'):say('GESPERRT','LOCKED')}</small>
     </button>)}</div></>}
   </>:<article className={`collection-card tier-${selected.tier}`}>
    <div className="collection-serial">{selected.serial}<span>{'✦'.repeat(selected.tier)}</span></div><p className="collection-category">{selected.category}</p><h3>{selected.name}</h3><p className="collection-subtitle">{selected.subtitle}</p>
    <div className="collection-card-art">{selected.bossId?<BossPortrait id={selected.bossId}/>:<img src={selected.image} alt={selected.name}/>}</div>
    {selected.bossId&&<p className="collection-stars">{'★'.repeat(Math.min(3,ownership.wins[selected.bossId]||0))}</p>}
    <dl className="collection-stats">{selected.stats.map(([label,value])=><div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
    <h4>{say('Die Geschichte','The story')}</h4>{selected.story.map((p,i)=><p key={i}>{p}</p>)}
    <h4>{say('Aktuelle Ausstattung','Current equipment')}</h4>{selected.equipment.map((p,i)=><p key={i}>{p}</p>)}
    <p className="collection-note">{say('Geschichte und Herkunft sind fiktiv. Ausstattungsangaben entsprechen den Spielregeln. Karten verleihen keine zusätzlichen Spielvorteile.','Story and origin are fictional. Equipment follows the game rules. Cards do not grant extra gameplay advantages.')}</p>
   </article>}
  </div>
  <footer className="collection-footer">
   {selected&&<>{exportError&&<p role="alert">{say('Export fehlgeschlagen. Bitte erneut versuchen.','Export failed. Please retry.')}</p>}{download?<a className="collection-download" href={download} download={`cryptoid-${selected.key}.png`}>{say('PNG herunterladen','Download PNG')} ↓</a>:<button type="button" disabled={busy} onClick={()=>void save()}>{busy?say('Karte wird erstellt …','Creating card …'):say('Download vorbereiten','Prepare download')}</button>}</>}
   <button ref={close} type="button" onClick={()=>selected?setSelected(null):onClose()}>{selected?say('← Zurück zur Sammlung','← Back to collection'):say('Zurück zur Startseite','Back to home')}</button>
  </footer>
 </dialog>,document.body);
}
