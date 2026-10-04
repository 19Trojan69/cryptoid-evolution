import { useEffect, useState } from "react";
import WeaponTutorial from "./WeaponTutorial";
import { useLocale } from "../i18n";
import { shipEvolutionAsset } from "./shipEvolution";

const topics = [
  {
    id: "overview", label: "Game description", title: "Defend Earth. Evolve your fleet.",
    intro: "Cryptoid Evolution is an arcade space shooter. Pilot your ship, defeat formations and bosses, collect boosts and build your fleet.",
    details: ["Each level has nine visible Blocks, then a boss fight and a bonus round.", "Your ship fires automatically. Move to dodge and line up your shots.", "Open Rewards to see linked Blocks, boss stickers, stars, chain milestones, bonus medals and your current service rank."],
  },
  {
    id: "visuals", label: "Illustrated guide", title: "Ships at a glance",
    intro: "Recognize your ship stages and the boss hulls before your mission.",
    details: ["Standard, Advanced and Elite share the same ship design, with increasingly reinforced parts.", "Bosses have their own silhouettes, weapon turrets and engine positions. Their appearance differs from the normal ships."],
  },
  {
    id: "controls", label: "Controls", title: "Move and fire",
    intro: "Your ship fires automatically. Move to dodge and line up your shots.",
    details: [
      "On a touchscreen, steer with your thumb in the lower playfield. The ship stays visible above your touch point.",
      "On a keyboard, use the arrow keys or WASD. Move left and right, with limited room to dodge upward.",
      "The top HUD shows hearts, level, Shards, score and completed Blocks. Your active weapon is shown at the side; use the button at the top to pause.",
    ],
  },
  {
    id: "route", label: "Level path", title: "Nine Blocks, boss, bonus",
    intro: "Each level has nine visible Blocks, then a boss fight and a bonus round.",
    details: [
      "A Block contains one to three planned groups. Defeat every group to link the Block. Each cleared group earns 50 points once.",
      "Reinforcements are announced before entering. Up to six enemies are visible at once; new arrivals fire only after docking. Some Blocks stay short.",
      "After Block 9, the boss arrives. Defeat it to enter the bonus round; the next level begins with a fresh chain.",
    ],
  },
  {
    id: "survival", label: "Combat & hearts", title: "Survive the attacks",
    intro: "You start with three hearts. The mission ends when all are lost.",
    details: [
      "Each defeated boss grants one extra heart, even above three. Remaining hearts are saved.",
      "Avoid enemy ships and projectiles. An active shield absorbs an impact; otherwise a collision or an unguarded projectile can cost a heart.",
      "Advanced and Elite ship stages add protection against enemy projectiles per life. A ship collision still needs a shield to be absorbed.",
      "Enemy hulls have different strengths. Even the first boss needs sustained fire; bosses attack faster as their hull weakens.",
      "After the last turret is destroyed, the core warns you before firing slow pulses. Later bosses alternate patterns. Destroyed turrets stay disabled.",
      "Each boss turret has its own energy bar. Destroy it to stop its fire and earn extra points once. Larger turrets have more energy and award more points. Turret hits do not damage the hull. Destroying the hull defeats the boss even with turrets intact, but awards no points for those remaining turrets.",
    ],
  },
  {
    id: "boosts", label: "Weapons & boosts", title: "Use your equipment",
    intro: "Fly through glowing drops to collect boosts that activate immediately.",
    details: [
      "Shield absorbs hits, Overdrive doubles shot damage, Rapid Fire increases the firing rate and Weapon Upgrade raises the weapon stage. A short message explains each effect when collected.",
      "Weapon stages go from the free single laser to twin, rapid twin, triple and plasma fire. Nova Bomb clears visible enemies and shots; EMP freezes enemies briefly.",
      "Select owned Test-Pi weapons during the mission with the side button. Their outer ring shows the remaining time without a seconds counter; when it empties, the weapon disappears. Hold the button to see all owned weapons.",
      "Collected weapon upgrades activate immediately. If another timed weapon is available, its own side button lets you switch between them. Previously owned start boosts have a separate activation button.",
    ],
  },
  {
    id: "earnings", label: "Rewards", title: "Shards, points and bonus targets",
    intro: "Defeated enemies earn points and in-game Shards. Shards are added to your balance at mission end.",
    details: [
      "Two defeats within 500 ms: +50 Score and +20 Shards.",
      "Every defeat counts in only one pair. Four simultaneous defeats earn two combos; an unpaired third defeat can start the next pair. Combos also apply in boss battles and bonus rounds.",
      "Combo rewards are already included in your score and earned Shards. The bonus-round and mission summaries show the earned totals without crediting them again.",
      "Different enemy classes pay different amounts. Linking all nine Blocks awards a chain reward, and beating the boss awards more.",
      "The bonus round has 12 flying targets. Each hit earns a Shard; the result adds bonus Shards and points. At nine hits or more, a completed chain pays an extra Shard bonus.",
      "Five to eight hits earn a bronze medal, nine to eleven silver, and all twelve gold. A perfect round can also restore one lost heart.",
    ],
  },
  {
    id: "collection", label: "Collection & ranks", title: "Collect bosses and milestones",
    intro: "Open Rewards to see linked Blocks, boss stickers, stars, chain milestones, bonus medals and your current service rank.",
    details: [
      "There are 50 boss stickers. The first win against a boss unlocks its sticker; repeat wins raise it to two and then three stars.",
      "Your service rank rises with completed difficulty stages up to stage 500. The newest rank replaces the previous one beside your name and appears in the Top 100.",
      "Complete chains in different levels to earn milestones at 1, 3, 10, 25 and 50 chains. The best bonus medal for each level is shown in your collection.",
      "Testnet Rewards are for testing only and will not transfer to Mainnet. Mainnet Rewards start from zero and then stay saved permanently to your account.",
      "Testnet Shards and Standard ship purchases are also for testing and do not transfer to Mainnet. Your Mainnet balance and purchased fleet start from zero.",
    ],
  },
  {
    id: "hangar", label: "Hangar & Testnet", title: "Expand your fleet",
    intro: "Grey Scout is free. Use earned Shards for available Standard ships and their color variants.",
    details: [
      "On Testnet, ten Standard hulls are available, including Grey Scout. The remaining ten are visible as MAINNET READY and cannot be newly bought here.",
      "Advanced and Elite ship stages, armor and new start power-up purchases are marked MAINNET READY. Previously owned items remain usable.",
      "Only weapon shots can currently be purchased with Test-Pi. Test-Pi purchases require a connected Pi account; Shards and collectible awards have no Pi or cash value.",
    ],
  },
  {
    id: "features", label: "Progress & settings", title: "Find your way around",
    intro: "The home screen opens Hangar, Shop, Weapons, Power-ups, Progress, Rewards and Top 100.",
    details: [
      "Progress shows your best score, highest stage and defeated enemies. Rewards shows your collection and service rank; Top 100 lists online high scores with each player's rank.",
      "In System, choose language, touch-control side, sensitivity and ship start height. Music, effects volume and reduced visual effects have their own controls.",
      "Signed-in players receive completed Rewards immediately in their Pi account. Admin test runs do not add collection progress.",
    ],
  },
] as const;

export type GuideTopic = (typeof topics)[number]["id"];
type GameGuideProps = { onClose: () => void; initialTopic?: GuideTopic; backLabel?: string };

const GameGuide = ({ onClose, initialTopic = "controls", backLabel = "Back to system" }: GameGuideProps) => {
  const { t } = useLocale();
  const [selected, setSelected] = useState<GuideTopic>(initialTopic);
  const topic = topics.find(item => item.id === selected) ?? topics[0];
  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  return <div className="info-panel" role="dialog" aria-modal="true" aria-labelledby="info-title">
    <div className="info-panel-content guide-panel-content">
      <button className="close-button" type="button" onClick={onClose} aria-label={t(backLabel)}>×</button>
      <p className="eyebrow">{t("FIELD GUIDE")}</p>
      <h2 id="info-title">{t("How to Play")}</h2>
      <p className="guide-lead">{t("Choose a topic to learn the current rules before your mission.")}</p>
      <nav className="guide-topics" aria-label={t("Guide topics")}>
        {topics.map(item => <button key={item.id} type="button" className={selected === item.id ? "guide-topic is-active" : "guide-topic"} aria-pressed={selected === item.id} onClick={() => setSelected(item.id)}>{t(item.label)}</button>)}
      </nav>
      <section className="guide-detail" aria-live="polite" aria-labelledby="guide-section-title" key={topic.id}>
        <h3 id="guide-section-title">{t(topic.title)}</h3>
        <p>{t(topic.intro)}</p>
        {topic.id === "visuals" && <div className="guide-ship-gallery">{([1, 2, 3] as const).map(stage => <figure key={stage}><img src={shipEvolutionAsset(0, stage)} alt={t(stage === 1 ? "Standard ship" : stage === 2 ? "Advanced ship" : "Elite ship")} loading="lazy" /><figcaption>{t(stage === 1 ? "STANDARD" : stage === 2 ? "ADVANCED" : "ELITE")}</figcaption></figure>)}<figure className="guide-boss-example"><img src="/ships/bosses/boss_01.webp" alt={t("Boss ship")} loading="lazy" /><figcaption>{t("CORE WARDEN")}</figcaption></figure></div>}
        {(topic.id === "boosts" || topic.id === "controls") && <WeaponTutorial />}
        <ul>{topic.details.map(detail => <li key={detail}>{t(detail)}</li>)}</ul>
      </section>
      <button className="button button-secondary guide-back" type="button" onClick={onClose}>← {t(backLabel)}</button>
    </div>
  </div>;
};

export default GameGuide;
