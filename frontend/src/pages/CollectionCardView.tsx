import { useLocale } from '../i18n';
import BossPortrait from './BossPortrait';
import type { CollectionCard } from './collectionData';
export default function CollectionCardView({card,stars=0}:{card:CollectionCard;stars?:number}){
 const {locale}=useLocale(),de=locale.startsWith('de'),say=(a:string,b:string)=>de?a:b;
 return <article className={`collection-card tier-${card.tier}`} style={{backgroundImage:`linear-gradient(180deg,rgba(5,12,24,.15),rgba(5,12,24,.55) 380px,rgba(5,12,24,.92) 700px),url("${card.background}")`}}>
    <div className="collection-serial">{card.serial}<span>{'✦'.repeat(card.tier)}</span></div><p className="collection-category">{card.category}</p><h3>{card.name}</h3><p className="collection-subtitle">{card.subtitle}</p>
    <div className="collection-card-art">{card.bossId?<BossPortrait id={card.bossId}/>:<img src={card.image} alt={card.name}/>}</div>
    {card.bossId&&<p className="collection-stars">{'★'.repeat(Math.min(3,stars))}</p>}
    <dl className="collection-stats">{card.stats.map(([label,value])=><div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
    <h4>{say('Die Geschichte','The story')}</h4>{card.story.map((p,i)=><p key={i}>{p}</p>)}
    <h4>{say('Aktuelle Ausstattung','Current equipment')}</h4>{card.equipment.map((p,i)=><p key={i}>{p}</p>)}
    <p className="collection-note">{say('Geschichte und Herkunft sind fiktiv. Ausstattungsangaben entsprechen den Spielregeln. Karten verleihen keine zusätzlichen Spielvorteile.','Story and origin are fictional. Equipment follows the game rules. Cards do not grant extra gameplay advantages.')}</p>
   </article>;
}
