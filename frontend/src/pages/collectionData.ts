import { collectionBackground, shipCardBackground } from './cardBackgrounds';
import { playerSkins } from './shipFleet';
import { shipEvolutionAsset, projectileGuardForStage, type ShipStage } from './shipEvolution';
import { playerShipStory } from './shipLore';
import { bossManifest } from './bossManifest';
import { bossName } from './bossNames';
import { bossLore } from './bossLore';
import { bossWeapons } from './bossWeapons';
import { turretHealth } from './bossTurrets';
import { levelDifficulty } from './levelDifficulty';
import { bossDifficulty } from './bossDifficulty';

export type CollectionCard = { key: string; name: string; subtitle: string; serial: string; tier: number; category: string; image: string; background: string; story: string[]; equipment: string[]; stats: [string,string][]; bossId?: number };
export function shipCard(id: string, stage: ShipStage, de: boolean): CollectionCard {
 const ship = playerSkins.find(s => s.id === id)!;
 const say = (a: string,b: string) => de?a:b;
 const category = ['Standard','Advanced','Elite'][stage-1];
 const weapon = stage === 1 ? say('Einzelschuss','Single fire') : stage === 2 ? say('Doppelschuss','Twin fire') : say('Verstärkter Zwillingslaser','Stronger twin laser');
 return { key: `${id}-${stage}`, name: ship.name, subtitle: stage === 1 ? say('Die ursprüngliche Baureihe','The original hull') : say(`Aufrüstung · ${category}`,`Upgrade · ${category}`), serial:`P-${String(ship.sprite+1).padStart(2,'0')}/${stage}`, tier:stage, category, image:shipEvolutionAsset(ship.sprite,stage),background:shipCardBackground(id,stage), story:playerShipStory(id,stage,de), stats:[[say('Basiswaffe','Base weapon'),weapon],[say('Freie Projektiltreffer je Leben','Free projectile hits per life'),String(projectileGuardForStage(stage))]], equipment:[weapon + '. ' + say('Dauerhafte Grundausstattung dieser Ausführung.','Permanent base loadout of this edition.'), say(`Rumpfschutz: ${projectileGuardForStage(stage)} gegnerische Projektiltreffer pro Leben werden abgefangen. Direkte Schiffskollisionen sind dadurch nicht geschützt.`,`Hull protection absorbs ${projectileGuardForStage(stage)} enemy projectile hits per life. It does not protect against direct ship collisions.`), say('Ein aktiver Schild schützt zusätzlich gegen Geschosse und Schiffskollisionen. Zeitlich begrenzte Waffen und Power-ups werden separat gesammelt oder gekauft und gehören nicht zu dieser Aufrüstung.','An active shield also protects against shots and ship collisions. Timed weapons and power-ups are collected or purchased separately and are not included in this upgrade.')] };
}
export function bossCard(id: number, locale: string): CollectionCard {
 const de=locale.startsWith('de'),say=(a:string,b:string)=>de?a:b;
 const config=bossManifest.find(b=>b.id===id)!, lore=bossLore(id,locale)!, guns=bossWeapons[id-1];
 const difficulty=levelDifficulty(config.level), pressure=bossDifficulty(id);
 const names={laser:say('Laser','Laser'),pulse:say('Impuls','Pulse'),plasma:say('Plasma','Plasma'),heavy:say('Schwere Kanone','Heavy cannon'),siege:say('Belagerung','Siege'),rocket:say('Raketenwerfer','Rocket launcher')};
 const groups=new Map<string,{count:number;text:string}>();
 for(const gun of guns){const pause=gun.interval*(2500-difficulty.progress*420)/2500*pressure.cadenceScale; const text=`${names[gun.kind]} · ${say('Kaliber','calibre')} ${gun.caliber} · ${gun.barrels.length} ${say('Läufe','barrels')} · ${gun.rows} ${say('Salvenreihen','volley rows')} · ${turretHealth(id,gun)} ${say('LP','HP')} · ${pause.toFixed(1)} s`; const existing=groups.get(text); if(existing)existing.count++;else groups.set(text,{count:1,text});}
 return {key:`boss-${id}`,bossId:id,name:bossName(id),subtitle:lore.title,serial:`B-${String(id).padStart(2,'0')}/50`,tier:Math.ceil(id/10),category:say('FEINDLICH · BOSS','HOSTILE · BOSS'),image:config.image,background:collectionBackground(`boss-${id}`),story:lore.story,stats:[[say('Boss-Stufe','Boss stage'),`${id}/50`],[say('Rumpfpanzerung','Hull armour'),`${difficulty.bossHealth.toFixed(1)} ${say('LP','HP')}`],[say('Geschütze','Turrets'),String(guns.length)]],equipment:[...Array.from(groups.values(),g=>`${g.count} × ${g.text}`),say('Zuerst alle Geschütze zerstören. Danach öffnet sich die zentrale Waffe; der Rumpf ist verwundbar und nimmt doppelten Schaden.','Destroy every turret first. The central weapon then opens; the hull becomes vulnerable and takes double damage.'),say(`Zentralwaffe: Impuls, Kaliber 8. Erste Warnung 1,8 s; danach ${ (pressure.coreInterval/1000).toFixed(1)} s Salvenabstand.`,`Central weapon: pulse, calibre 8. Initial warning 1.8 s; then ${(pressure.coreInterval/1000).toFixed(1)} s volley interval.`), id<=10?say('Gezielte Einzelschüsse.','Aimed single shots.'):say(`Einzelschüsse wechseln mit ${id<=30?2:4}-fachen Fächern.`,`Single shots alternate with ${id<=30?2:4}-shot fans.`),say('LP sind Spiel-Lebenspunkte, Kaliber ist ein relativer Spielwert. Salvenpausen gelten bei intakten Geschützen; Zielsuche und das gemeinsame Projektil-Limit können sie verlängern.','HP means game health; calibre is a relative game value. Volley delays apply to intact turrets; targeting and the shared projectile limit may extend them.')]};
}
