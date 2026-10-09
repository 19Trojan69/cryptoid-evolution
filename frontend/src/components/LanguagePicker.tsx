import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { languages, useLocale, type Locale } from '../i18n';
const flags: Partial<Record<Locale,string>> = {en:'🇬🇧',de:'🇩🇪',es:'🇪🇸',fr:'🇫🇷',pt:'🇵🇹',it:'🇮🇹',pl:'🇵🇱',tr:'🇹🇷',ru:'🇷🇺',hr:'🇭🇷',cs:'🇨🇿',sk:'🇸🇰',hu:'🇭🇺',ro:'🇷🇴',sr:'🇷🇸',uk:'🇺🇦',th:'🇹🇭',zh:'🇨🇳',vi:'🇻🇳'};
export default function LanguagePicker({onClose}:{onClose:()=>void}){
 const {locale,automatic,choose,t}=useLocale();const [search,setSearch]=useState('');const dialog=useRef<HTMLDialogElement>(null);
 useEffect(()=>{const previous=document.activeElement as HTMLElement|null;const d=dialog.current;d?.showModal();d?.querySelector<HTMLInputElement>('input')?.focus();return()=>{d?.close();if(previous?.isConnected)previous.focus();};},[]);
 const select=(code:Locale|null)=>{choose(code);onClose();};
 return createPortal(<dialog ref={dialog} className="language-picker metallic-dialog" aria-labelledby="language-picker-title" onCancel={e=>{e.preventDefault();e.stopPropagation();onClose();}}>
 <header><h2 id="language-picker-title">{t('Language')}</h2><button type="button" onClick={onClose} aria-label={t('Close')}>×</button></header>
 <input type="search" value={search} onChange={e=>setSearch(e.target.value)} placeholder={t('Search languages')} aria-label={t('Search languages')}/>
 <div className="language-picker-options"><button className="language-picker-row" type="button" aria-pressed={automatic} onClick={()=>select(null)}><span aria-hidden="true">◎</span><b>{t('Automatic (device language)')}</b><i aria-hidden="true">{automatic?'✓':''}</i></button>
 {Object.entries(languages).filter(([code,label])=>`${code} ${label}`.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase())).map(([code,label])=><button className="language-picker-row" type="button" key={code} lang={code==='zh'?'zh-Hans':code} aria-pressed={!automatic&&locale===code} onClick={()=>select(code as Locale)}><span aria-hidden="true">{flags[code as Locale]}</span><b>{label}</b><i aria-hidden="true">{!automatic&&locale===code?'✓':''}</i></button>)}</div>
 </dialog>,document.body);
}
