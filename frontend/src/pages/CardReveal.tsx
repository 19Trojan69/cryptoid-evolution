import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLocale } from '../i18n';
import { bossCard, shipCard } from './collectionData';
import type { CardReward } from './cardRevealRules';
import CollectionCardView from './CollectionCardView';
import { playCardSound, primeCardSound } from './cardSound';
import './collection.css';

export default function CardReveal({reward,remaining=1,onContinue}:{reward:CardReward;remaining?:number;onContinue:()=>void}){
 const {locale,t}=useLocale(),de=locale.startsWith('de'),say=(a:string,b:string)=>de?a:t(b);
 const dialog=useRef<HTMLDialogElement>(null),next=useRef<HTMLButtonElement>(null),played=useRef<string|null>(null);
 const [needsSound,setNeedsSound]=useState(false);
 const card=useMemo(()=>reward.boss?bossCard(reward.boss,locale):shipCard(reward.ship!,reward.stage||1,locale),[reward,locale]);
 useEffect(()=>{const previous=document.activeElement as HTMLElement|null;const el=dialog.current;el?.showModal();next.current?.focus({preventScroll:true});return()=>{el?.close();if(previous?.isConnected)previous.focus({preventScroll:true});};},[]);
 useEffect(()=>{let timer:number|undefined;if(played.current!==reward.key){played.current=reward.key;timer=window.setTimeout(()=>setNeedsSound(!playCardSound()),0);}dialog.current?.querySelector('.collection-scroll')?.scrollTo(0,0);return()=>{if(timer!==undefined)window.clearTimeout(timer);};},[reward.key]);
 const enableSound=()=>{primeCardSound();window.setTimeout(()=>setNeedsSound(!playCardSound()),0);};
 return createPortal(<dialog ref={dialog} className="collection-dialog card-reveal-dialog" aria-labelledby="card-reveal-title" onCancel={event=>{event.preventDefault();event.stopPropagation();}} onPointerDown={event=>event.stopPropagation()}>
  <header className="collection-header"><div><p>{say('SAMMELKARTE ERHALTEN','COLLECTOR CARD RECEIVED')}</p><h2 id="card-reveal-title">{card.name}</h2></div><span aria-hidden="true">✦</span></header>
  <div className="collection-scroll"><div className="card-reveal-arrival" key={reward.key}><CollectionCardView card={card} stars={reward.stars}/></div></div>
  <footer className="collection-footer">{needsSound&&<button type="button" onClick={enableSound}>{say('Kartenklang aktivieren','Enable card sound')}</button>}<button ref={next} type="button" onClick={onContinue}>{say('Fortsetzen','Continue')}{remaining>1?` · ${remaining-1} ${say('weitere Karte(n)','more card(s)')}`:''} →</button></footer>
 </dialog>,document.body);
}
