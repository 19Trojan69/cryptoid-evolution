import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useLocale } from '../i18n';
import BossPortrait from './BossPortrait';
import { bossName } from './bossNames';
import { bossLore } from './bossLore';
import { bossManifest } from './bossManifest';
import { bossWeapons, type BossWeaponKind } from './bossWeapons';
import { turretHealth } from './bossTurrets';
import { levelDifficulty } from './levelDifficulty';
import { bossDifficulty } from './bossDifficulty';
import './bossDossier.css';

const weaponLabels: Record<BossWeaponKind, [string, string]> = {
  laser: ['Laser', 'Laser'], pulse: ['Impulskanone', 'Pulse cannon'],
  plasma: ['Plasmakanone', 'Plasma cannon'], heavy: ['Schwere Kanone', 'Heavy cannon'],
  siege: ['Belagerungskanone', 'Siege cannon'], rocket: ['Raketenwerfer', 'Rocket launcher'],
};

export default function BossDossier({ id, stars, onClose }: { id: number; stars: number; onClose: () => void }) {
  const { locale, t } = useLocale();
  const de = locale.toLowerCase().startsWith('de');
  const say = (german: string, english: string) => de ? german : t(english);
  const dialog = useRef<HTMLDialogElement>(null);
  const close = useRef<HTMLButtonElement>(null);
  const lore = bossLore(id, locale);
  const config = bossManifest.find(boss => boss.id === id);
  const guns = bossWeapons[id - 1];
  const valid = Boolean(stars > 0 && lore && config && guns);
  useEffect(() => {
    if (!valid) return;
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const element = dialog.current;
    element?.showModal();
    close.current?.focus({ preventScroll: true });
    return () => { element?.close(); if (previous?.isConnected) previous.focus({ preventScroll: true }); };
  }, [valid, id]);
  if (!valid || !lore || !config || !guns) return null;
  const difficulty = levelDifficulty(config.level);
  const pressure = bossDifficulty(id);
  const format = (value: number) => value.toLocaleString(locale, { maximumFractionDigits: 1 });
  return createPortal(<dialog ref={dialog} className="boss-dossier" aria-labelledby="boss-dossier-title"
    onCancel={event => { event.preventDefault(); event.stopPropagation(); onClose(); }}>
    <div className="boss-dossier-shell">
      <header className="boss-dossier-header">
        <div><p className="boss-dossier-eyebrow">{say('FEINDAKTE · ENTSCHLÜSSELT', 'ENEMY DOSSIER · DECRYPTED')}</p>
          <h2 id="boss-dossier-title">#{String(id).padStart(2, '0')} · {bossName(id)}</h2>
          <p>{lore.title}</p></div>
        <span className="boss-dossier-hostile">{say('FEINDLICH', 'HOSTILE')}</span>
      </header>
      <div className="boss-dossier-scroll" tabIndex={0} aria-label={say('Schiffsgeschichte und Kampfdaten', 'Ship story and combat data')}>
        <figure className="boss-dossier-hero"><BossPortrait id={id} /><figcaption>{say('Aktuelles Schiff mit montierten Geschützen', 'Current ship with mounted weapons')}</figcaption></figure>
        <p className="boss-dossier-stars" aria-label={say(`${stars} von 3 Sternen`, t("{value0} of 3 stars", {value0: stars}))}>{'★'.repeat(Math.min(3, stars))}{'☆'.repeat(Math.max(0, 3 - stars))} <span>{say('Deine Auszeichnung', 'Your award')}</span></p>
        <section aria-labelledby="boss-lore-heading"><h3 id="boss-lore-heading">{say('Die Geschichte', 'The story')}</h3>
          <p className="boss-dossier-note">{say('Fiktive Geschichte aus dem Cryptoid-Universum. Keine zusätzlichen Kampffähigkeiten.', 'Fiction from the Cryptoid universe. Does not add combat abilities.')}</p>
          {lore.story.map((paragraph, index) => <p key={index}>{paragraph}</p>)}
        </section>
        <section aria-labelledby="boss-data-heading"><h3 id="boss-data-heading">{say('Tatsächliche Kampfdaten', 'Actual combat data')}</h3>
          <p className="boss-dossier-note">{say('Direkt aus der aktuellen Spielkonfiguration. Panzerung = Lebenspunkte, nicht Materialstärke; Kaliber = relativer Spielwert, nicht Millimeter.', 'Read from the current game configuration. Armour means health points, not material thickness; calibre is a relative game value, not millimetres.')}</p>
          <dl className="boss-dossier-stats">
            <div><dt>{say('Boss-Stufe', 'Boss stage')}</dt><dd>{id} / 50</dd></div>
            <div><dt>{say('Rumpfpanzerung', 'Hull armour')}</dt><dd>{format(difficulty.bossHealth)} {say('LP', 'HP')}</dd></div>
            <div><dt>{say('Geschütztürme', 'Turrets')}</dt><dd>{guns.length}</dd></div>
            <div><dt>{say('Läufe gesamt', 'Total barrels')}</dt><dd>{guns.reduce((sum, gun) => sum + gun.barrels.length, 0)}</dd></div>
          </dl>
          <p>{say('Zuerst alle Geschütze zerstören. Danach wird der Rumpf verwundbar und nimmt doppelten Schaden; die zentrale Spezialwaffe öffnet sich.', 'Destroy every turret first. The hull then becomes vulnerable and takes double damage; the central special weapon opens.')}</p>
          <h4>{say('Montierte Bewaffnung', 'Mounted armament')}</h4>
          <p className="boss-dossier-note">{say('Die Waffen richten sich unabhängig aus und schießen erst nach Zielerfassung. Die unten angegebene Pause folgt einer abgeschlossenen Salve; Zielsuche und das gemeinsame Projektil-Limit können sie verlängern.', 'Weapons aim independently and fire only after target lock. The delay below follows a completed volley; targeting and the shared projectile limit may extend it.')}</p>
          <ol className="boss-dossier-guns">{guns.map((gun, index) => {
            const left = gun.sourceX / config.sourceWidth;
            const position = left < .4 ? say('Links', 'Left') : left > .6 ? say('Rechts', 'Right') : say('Mitte', 'Centre');
            const full = gun.interval * (2500 - difficulty.progress * 420) / 2500 * pressure.cadenceScale;
            return <li key={gun.key}><h5><span className="boss-dossier-swatch" style={{ backgroundColor: gun.shotColor }} />{index + 1}. {de ? gun.name : t(weaponLabels[gun.kind][1])} · {position}</h5>
              <p>{de ? weaponLabels[gun.kind][0] : t(weaponLabels[gun.kind][1])} · {say('Kaliber', 'Calibre')} {gun.caliber} · {gun.barrels.length} {say('Läufe', 'barrels')} · {gun.rows} {say('Salvenreihen', 'volley rows')}</p>
              <p>{say('Panzerung', 'Armour')}: {turretHealth(id, gun)} {say('LP', 'HP')} · {say('Salvenpause', 'Volley delay')}: {format(full)} s</p>
            </li>;
          })}</ol>
          <h4>{say('Zentrale Spezialwaffe', 'Central special weapon')}</h4>
          <p>{say('Impulswaffe, Kaliber 8. Erste Warnphase: 1,8 s. Danach', 'Pulse weapon, calibre 8. Initial warning: 1.8 s. Afterwards')} {format(pressure.coreInterval / 1000)} s {say('zwischen Salven, sofern Projektilplätze frei sind.', 'between volleys when projectile slots are available.')}</p>
          <p>{id <= 10 ? say('Gezielte Einzelschüsse.', 'Aimed single shots.') : id <= 30 ? say('Gezielte Einzelschüsse wechseln mit einem Zweifach-Fächer.', 'Aimed single shots alternate with a two-shot fan.') : say('Gezielte Einzelschüsse wechseln mit einem Vierfach-Fächer.', 'Aimed single shots alternate with a four-shot fan.')}</p>
        </section>
      </div>
      <footer className="boss-dossier-footer"><button ref={close} type="button" onClick={onClose}>← {say('Zurück zur Sammlung', 'Back to collection')}</button></footer>
    </div>
  </dialog>, document.body);
}
