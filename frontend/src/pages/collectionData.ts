import { translate } from '../i18n.ts';
import { normalizeLocale } from '../locales/config.ts';
import { collectionBackground, shipCardBackground } from './cardBackgrounds';
import { playerSkins } from './shipFleet';
import { shipEvolutionAsset, stagePickupRadiusBonus, type ShipStage } from './shipEvolution';
import { playerShipStory } from './shipLore';
import { bossManifest } from './bossManifest';
import { bossName } from './bossNames';
import { bossLore } from './bossLore';
import { bossWeapons } from './bossWeapons';
import { turretHealth } from './bossTurrets';
import { levelDifficulty } from './levelDifficulty';
import { bossDifficulty } from './bossDifficulty';
import type { CollectionLore } from './collectionLore';

export type CollectionCard = { key: string; name: string; subtitle: string; serial: string; tier: number; category: string; image: string; background: string; story: string[]; equipment: string[]; stats: [string,string][]; bossId?: number; color?: import("./shipFleet").PlayerColorId };
export function shipCard(id: string, stage: ShipStage, language: boolean | string, pack?: CollectionLore): CollectionCard {
 const locale = typeof language === 'boolean' ? (language ? 'de' : 'en') : normalizeLocale(language) ?? 'en';
 const de = locale === 'de', t = (source: string, params?: Record<string, string | number>) => translate(locale, source, params);
 const ship = playerSkins.find(s => s.id === id)!;
 const say = (a: string,b: string) => de?a:t(b);
 const category = de ? ['Standard','Advanced','Elite'][stage-1] : t(['STANDARD','ADVANCED','ELITE'][stage-1]);
 const weapon = stage === 1 ? say('Einzelschuss','Single fire') : stage === 2 ? say('Doppelschuss','Twin fire') : say('Verstärkter Zwillingslaser','Stronger twin laser');
 return { key: `${id}-${stage}`, name: ship.name, subtitle: stage === 1 ? say('Die ursprüngliche Baureihe','The original hull') : say(`Aufrüstung · ${category}`,t("Upgrade · {value0}", {value0: category})), serial:`P-${String(ship.sprite+1).padStart(2,'0')}/${stage}`, tier:stage, category, image:shipEvolutionAsset(ship.sprite,stage),background:shipCardBackground(id,stage), story:playerShipStory(id,stage,locale,pack), stats:[[say('Basiswaffe','Base weapon'),weapon],[t("Power-up pickup radius"),`+${stagePickupRadiusBonus(stage)}%`]], equipment:[weapon + '. ' + say('Dauerhafte Grundausstattung dieser Ausführung.','Permanent base loadout of this edition.'), t("Ship stages do not absorb hits. Active shields protect separately; armor determines your maximum hearts. The larger pickup radius applies only to normal power-ups, not boss hearts or bonus targets."), say('Ein aktiver Schild schützt zusätzlich gegen Geschosse und Schiffskollisionen. Zeitlich begrenzte Waffen und Power-ups werden separat gesammelt oder gekauft und gehören nicht zu dieser Aufrüstung.','An active shield also protects against shots and ship collisions. Timed weapons and power-ups are collected or purchased separately and are not included in this upgrade.')] };
}
export function bossCard(id: number, locale: string, pack?: CollectionLore): CollectionCard {
 const language=normalizeLocale(locale) ?? 'en', t=(source:string,params?:Record<string,string|number>)=>translate(language,source,params);
 const de=language==='de',say=(a:string,b:string)=>de?a:t(b);
 const config=bossManifest.find(b=>b.id===id)!, lore=bossLore(id,locale,pack)!, guns=bossWeapons[id-1];
 const difficulty=levelDifficulty(config.level), pressure=bossDifficulty(id);
 const names={laser:say('Laser','Laser'),pulse:say('Impuls','Pulse'),plasma:say('Plasma','Plasma'),heavy:say('Schwere Kanone','Heavy cannon'),siege:say('Belagerung','Siege'),rocket:say('Raketenwerfer','Rocket launcher')};
 const groups=new Map<string,{count:number;text:string}>();
 const format = (value: number) => value.toLocaleString(language, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
 const formatHealth = new Intl.NumberFormat(language, { maximumFractionDigits: 6 }).format;
 for (const gun of guns) {
   const pause = gun.interval * (2500 - difficulty.progress * 420) / 2500 * pressure.cadenceScale;
   const text = `${names[gun.kind]} · ${say('Kaliber','Calibre')} ${gun.caliber} · ${say('Läufe','barrels')}: ${gun.barrels.length} · ${say('Salvenreihen','volley rows')}: ${gun.rows} · ${formatHealth(turretHealth(id,gun))} ${say('LP','HP')} · ${format(pause)} s`;
   const existing = groups.get(text);
   if (existing) existing.count++;
   else groups.set(text, { count: 1, text });
 }
 return {
   key: `boss-${id}`, bossId: id, name: bossName(id), subtitle: lore.title, serial: `B-${String(id).padStart(2,'0')}/50`,
   tier: Math.ceil(id / 10), category: say('FEINDLICH · BOSS','HOSTILE · BOSS'), image: config.image,
   background: collectionBackground(`boss-${id}`), story: lore.story,
   stats: [[say('Boss-Stufe','Boss stage'),`${id}/50`],[t('Reactor health'),`${formatHealth(difficulty.bossHealth)} ${say('LP','HP')}`],[say('Geschütze','Turrets'),String(guns.length)]],
   equipment: [
     ...Array.from(groups.values(), group => `${group.count} × ${group.text}`),
     t('Destroy all turrets first. After the reactor opens, shoot it directly. Each reactor hit deals double damage.'),
     say(`Zentralwaffe: Impuls, Kaliber 8. Erste Warnung 1,8 s; danach ${format(pressure.coreInterval / 1000)} s Salvenabstand.`,
       t('Central weapon: pulse, calibre 8. Initial warning 1.8 s; then {value0} s volley interval.', { value0: format(pressure.coreInterval / 1000) })),
     id <= 10 ? say('Gezielte Einzelschüsse.','Aimed single shots.')
       : say(`Einzelschüsse wechseln mit ${id <= 30 ? 2 : 4}-fachen Fächern.`, t('Single shots alternate with {value0}-shot fans.', { value0: id <= 30 ? 2 : 4 })),
     say('LP sind Spiel-Lebenspunkte, Kaliber ist ein relativer Spielwert. Salvenpausen gelten bei intakten Geschützen; Zielsuche und das gemeinsame Projektil-Limit können sie verlängern.',
       'HP means game health; calibre is a relative game value. Volley delays apply to intact turrets; targeting and the shared projectile limit may extend them.'),
   ],
 };
}
