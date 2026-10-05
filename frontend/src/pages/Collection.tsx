import { bossCardAvailable, shipCardAvailable } from './cardAvailability';
import CollectionCardView from './CollectionCardView';
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
import { bossCard, shipCard } from './collectionData';
import './collection.css';
import './shopPurchase.css';

type Ownership={used:string[];upgrades:string[];wins:Record<string,number>};
export default function Collection({uid,onClose}:{uid?:string;onClose:()=>void}){
 const {locale}=useLocale(),de=locale.startsWith('de'),say=(a:string,b:string)=>de?a:b;
 const [category,setCategory]=useState(0),[selectedKey,setSelected]=useState<string|null>(null);
 const [ownership,setOwnership]=useState<Ownership>({used:[],upgrades:[],wins:{}}),[status,setStatus]=useState('loading'),[retry,setRetry]=useState(0);
 const exportVersion=useRef(0);
 const swipe=useRef<{x:number;y:number}|null>(null);
 const [busy,setBusy]=useState(false),[exportError,setExportError]=useState(false),[download,setDownload]=useState<string|null>(null);
 const dialog=useRef<HTMLDialogElement>(null),close=useRef<HTMLButtonElement>(null),scroller=useRef<HTMLDivElement>(null);
 useEffect(()=>{const previous=document.activeElement as HTMLElement|null;dialog.current?.showModal();close.current?.focus();return()=>{dialog.current?.close();previous?.isConnected&&previous.focus();};},[]);
 useEffect(()=>{let alive=true;setStatus('loading');setOwnership({used:[],upgrades:[],wins:{}});
  if(!uid){setStatus('ready');return;}
  void Promise.all([loadAccountSave(),axiosClient.get<{ownedShipUpgrades?:string[]}>('/hangar/inventory'),axiosClient.get<{progress:{bossWins:Record<string,number>}}>('/rewards/me')]).then(([save,inventory,rewards])=>{if(alive){setOwnership({used:[...new Set([...(save.usedShipSkins||[]),...Object.keys(save.fleet).filter(id=>Object.values(save.fleet[id]||{}).some(n=>n>0))])],upgrades:inventory.data.ownedShipUpgrades||[],wins:rewards.data.progress.bossWins});setStatus('ready');}},()=>{if(alive)setStatus('error');});
  return()=>{alive=false;};
 },[uid,retry]);
 useEffect(()=>()=>{if(download)URL.revokeObjectURL(download);},[download]);
 useEffect(()=>{exportVersion.current++;scroller.current?.scrollTo(0,0);setDownload(null);setExportError(false);setBusy(false);return()=>{exportVersion.current++;};},[selectedKey,category,uid]);
 const categories=[say('Bosse','Bosses'),'Standard','Advanced','Elite'];
 const entries=category===0?bossManifest.map(b=>({key:`boss-${b.id}`,name:bossName(b.id),image:b.image,available:bossCardAvailable(b.id),unlocked:bossCardAvailable(b.id)&&(ownership.wins[b.id]||0)>0,tier:Math.ceil(b.id/10),serial:`B-${String(b.id).padStart(2,'0')}`,make:()=>bossCard(b.id,locale),boss:b.id})):playerSkins.map(ship=>({key:`${ship.id}-${category}`,name:ship.name,image:shipEvolutionAsset(ship.sprite,category as ShipStage),available:shipCardAvailable(ship.sprite,category as ShipStage),unlocked:shipCardAvailable(ship.sprite,category as ShipStage)&&playerCardUnlocked(ship.id,ship.sprite,category as ShipStage,ownership.used,ownership.upgrades),tier:category,serial:`P-${String(ship.sprite+1).padStart(2,'0')}/${category}`,make:()=>shipCard(ship.id,category as ShipStage,de),boss:0}));
 const selectedIndex=entries.findIndex(entry=>entry.key===selectedKey);
 const activeEntry=selectedIndex>=0?entries[selectedIndex]:null;
 const selected=activeEntry?.unlocked?activeEntry.make():null;
 const moveCard=(direction:number)=>{
  const next=selectedIndex+direction;
  if(activeEntry&&next>=0&&next<entries.length)setSelected(entries[next].key);
 };
 const save=async()=>{if(!selected||busy)return;setBusy(true);setExportError(false);const version=exportVersion.current;try{const {exportCollectionCard}=await import('./collectionExport');const blob=await exportCollectionCard(selected,de);if(version===exportVersion.current)setDownload(URL.createObjectURL(blob));}catch{if(version===exportVersion.current)setExportError(true);}finally{if(version===exportVersion.current)setBusy(false);}};
 return createPortal(<dialog ref={dialog} className="collection-dialog" aria-labelledby="collection-title" onCancel={e=>{e.preventDefault();e.stopPropagation();activeEntry?setSelected(null):onClose();}} onKeyDown={e=>{if(!activeEntry||e.altKey||e.ctrlKey||e.metaKey)return;if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();e.stopPropagation();moveCard(e.key==='ArrowRight'?1:-1);}}}>
  <header className="collection-header"><div><p>{say('DAS FLOTTENARCHIV','THE FLEET ARCHIVE')}</p><h2 id="collection-title">{activeEntry?activeEntry.name:say('Deine Sammlung','Your collection')}</h2></div><span aria-hidden="true">✧</span></header>
  <div ref={scroller} className={`collection-scroll ${activeEntry?'collection-swipe':''}`} onTouchStart={e=>{swipe.current=activeEntry&&e.touches.length===1?{x:e.touches[0].clientX,y:e.touches[0].clientY}:null;}} onTouchCancel={()=>{swipe.current=null;}} onTouchEnd={e=>{const start=swipe.current;swipe.current=null;if(!start||e.changedTouches.length!==1)return;const dx=e.changedTouches[0].clientX-start.x,dy=e.changedTouches[0].clientY-start.y;if(Math.abs(dx)>60&&Math.abs(dx)>Math.abs(dy)*1.5)moveCard(dx<0?1:-1);}}>
   {!activeEntry?<>
    <p className="collection-intro">{say('Entdecke 50 Bosse und 60 Schiffskarten. Jede freigeschaltete Karte erzählt ihre Geschichte und lässt sich mit ihrer Ausstattung als PNG speichern.','Discover 50 bosses and 60 ship cards. Each unlocked card tells its story and can be saved with its equipment as a PNG.')}</p>
    <div className="collection-tabs" role="group" aria-label={say('Kategorien','Categories')}>{categories.map((name,index)=><button type="button" key={name} aria-pressed={category===index} onClick={()=>setCategory(index)}>{name}</button>)}</div>
    <p className="collection-rule">{category===0?say('Die ersten drei Bosskarten sind freischaltbar. Besiege den jeweiligen Boss. Weitere Karten bleiben bis zur Freigabe als Silhouetten sichtbar.','The first three boss cards can be unlocked by defeating their boss. Other cards remain silhouettes until release.'):category===1?say('Die Karte gehört zu einem erhaltenen Standardschiff. Neue Karten erscheinen beim Spieleinstieg oder nach dem Kauf.','This card belongs to an acquired Standard ship. New cards appear at mission entry or after purchase.'):say('Die Karte wird durch den Kauf dieser Aufrüstung freigeschaltet. Elite setzt Advanced voraus.','Purchase this upgrade to unlock its card. Elite requires Advanced.')}</p>
    {!uid&&<p className="collection-rule">{say('Melde dich an, um deine freigeschalteten Karten zu laden.','Sign in to load your unlocked cards.')}</p>}
    {status==='loading'?<p role="status">{say('Sammlung wird geladen …','Loading collection …')}</p>:status==='error'?<div role="alert"><p>{say('Die Sammlung konnte nicht geladen werden.','Could not load your collection.')}</p><button type="button" onClick={()=>setRetry(n=>n+1)}>{say('Erneut versuchen','Retry')}</button></div>:<>
     <p className="collection-count">{entries.filter(e=>e.unlocked).length}/{entries.length} {say('FREIGESCHALTET','UNLOCKED')}</p>
     <div className="collection-grid">{entries.map(entry=><button type="button" key={entry.key} className={`collection-tile tier-${entry.tier} ${entry.unlocked?'':'is-locked'}`} aria-label={`${entry.name} · ${entry.unlocked?say('Karte öffnen','Open card'):entry.available?say('GESPERRT','LOCKED'):say('MAINNET READY','MAINNET READY')}`} onClick={()=>setSelected(entry.key)}>
      <span className="collection-serial">{entry.serial} <span>{'✦'.repeat(entry.tier)}</span></span>
      <div className="collection-art">{entry.unlocked&&entry.boss?<BossPortrait id={entry.boss}/>:<img src={entry.image} alt="" loading="lazy"/>}</div>
      <strong>{entry.name}</strong><small className={!entry.unlocked && !entry.available ? "mainnet-ready-badge" : undefined}>{entry.unlocked?say('Karte öffnen','Open card'):!entry.available?say('MAINNET READY','MAINNET READY'):say('GESPERRT','LOCKED')}</small>
     </button>)}</div></>}
   </>:selected?<CollectionCardView card={selected} stars={selected.bossId ? ownership.wins[selected.bossId] || 0 : 0}/>:<article className="collection-card collection-locked-detail">
    <span className="collection-serial">{activeEntry.serial}</span><h3>{activeEntry.name}</h3>
    <div className="collection-card-art"><img src={activeEntry.image} alt={say('Gesperrte Schiffssilhouette','Locked ship silhouette')}/></div>
    <h4 className={!activeEntry.available ? "mainnet-ready-badge" : undefined}>{activeEntry.available?say('GESPERRT','LOCKED'):say('MAINNET READY','MAINNET READY')}</h4>
    <p>{activeEntry.available?say('Erhalte dieses Schiff oder besiege diesen Boss, um Geschichte, Ausstattung und Download freizuschalten.','Acquire this ship or defeat this boss to unlock its story, equipment and download.'):say('Diese Karte ist für die spätere Freigabe vorbereitet. Geschichte, Ausstattung und Download bleiben gesperrt.','This card is prepared for a future release. Its story, equipment and download remain locked.')}</p>
   </article>}
  </div>
  <footer className="collection-footer">
   {activeEntry&&<nav className="collection-card-navigation" aria-label={say('Karten durchblättern','Browse cards')}>
    <button type="button" disabled={selectedIndex===0} onClick={()=>moveCard(-1)} aria-label={say('Vorherige Karte','Previous card')}>←</button>
    <span aria-live="polite">{categories[category]} · {selectedIndex+1}/{entries.length}<small>{say('Seitlich wischen','Swipe sideways')}</small></span>
    <button type="button" disabled={selectedIndex===entries.length-1} onClick={()=>moveCard(1)} aria-label={say('Nächste Karte','Next card')}>→</button>
   </nav>}
   {selected&&<>{exportError&&<p role="alert">{say('Export fehlgeschlagen. Bitte erneut versuchen.','Export failed. Please retry.')}</p>}{download?<a className="collection-download" href={download} download={`cryptoid-${selected.key}.png`}>{say('PNG herunterladen','Download PNG')} ↓</a>:<button type="button" disabled={busy} onClick={()=>void save()}>{busy?say('Karte wird erstellt …','Creating card …'):say('Download vorbereiten','Prepare download')}</button>}</>}
   <button ref={close} type="button" onClick={()=>activeEntry?setSelected(null):onClose()}>{activeEntry?say('← Zurück zur Sammlung','← Back to collection'):say('Zurück zur Startseite','Back to home')}</button>
  </footer>
 </dialog>,document.body);
}
