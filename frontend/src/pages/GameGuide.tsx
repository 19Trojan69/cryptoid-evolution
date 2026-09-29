import { useState } from "react";
import { useLocale } from "../i18n";

const topics = [
  {
    id: "controls", label: "Controls", title: "Move and fire",
    intro: "Your ship fires automatically. Move to dodge and line up your shots.",
    details: [
      "On a touchscreen, steer with your thumb in the lower playfield. The ship stays visible above your touch point.",
      "On a keyboard, use the arrow keys or WASD. Move left and right, with limited room to dodge upward.",
      "The HUD shows hearts, level, Shards, score, weapon stage and completed Blocks. Use the button at the top to pause.",
    ],
  },
  {
    id: "route", label: "Level path", title: "Nine Blocks, boss, bonus",
    intro: "Each level has nine visible Blocks, then a boss fight and a bonus round.",
    details: [
      "Each Block is one encounter: enemies enter, form a recognizable pattern and break away for attack runs. Defeat the formation to link that Block.",
      "The nine formations include ranks, V, W, ring, wave, X, A, columns and diamond. Later levels can add reinforcements to Blocks 7–9.",
      "After Block 9, the boss arrives. Defeat it to enter the bonus round; the next level begins with a fresh chain.",
    ],
  },
  {
    id: "survival", label: "Combat & hearts", title: "Survive the attacks",
    intro: "You start with three hearts. The mission ends when all are lost.",
    details: [
      "Avoid enemy ships and projectiles. An active shield absorbs an impact; otherwise a collision or an unguarded projectile can cost a heart.",
      "Advanced and Elite ship stages add protection against enemy projectiles per life. A ship collision still needs a shield to be absorbed.",
      "Enemy hulls have different strengths. Even the first boss needs sustained fire; bosses attack faster as their hull weakens.",
    ],
  },
  {
    id: "boosts", label: "Weapons & boosts", title: "Use your equipment",
    intro: "Fly through glowing drops to collect boosts that activate immediately.",
    details: [
      "Shield absorbs hits, Overdrive doubles shot damage, Rapid Fire increases the firing rate and Weapon Upgrade raises the weapon stage. Collected effects last up to 20 seconds.",
      "Weapon stages go from the free single laser to twin, rapid twin, triple and plasma fire. Nova Bomb clears visible enemies and shots; EMP freezes enemies briefly.",
      "Owned and equipped Test-Pi shots last five minutes from the start of each mission. Previously owned start boosts can be activated with their on-screen button for one mission.",
    ],
  },
  {
    id: "earnings", label: "Rewards", title: "Shards, points and bonus targets",
    intro: "Defeated enemies earn points and in-game Shards. Shards are added to your balance at mission end.",
    details: [
      "Different enemy classes pay different amounts. Linking all nine Blocks awards a chain reward, and beating the boss awards more.",
      "The bonus round has 12 flying targets. Each hit earns a Shard; the result adds bonus Shards and points. At nine hits or more, a completed chain pays an extra Shard bonus.",
      "Five to eight hits earn a bronze medal, nine to eleven silver, and all twelve gold. A perfect round can also restore one lost heart.",
    ],
  },
  {
    id: "collection", label: "Collection & ranks", title: "Collect bosses and milestones",
    intro: "Open Progress to see boss stickers, stars, chain milestones and bonus medals.",
    details: [
      "There are 50 boss stickers. The first win against a boss unlocks its sticker; repeat wins raise it to two and then three stars.",
      "Your rank rises with different bosses defeated: Rookie, Pilot (1), Navigator (3), Commander (10), Veteran (25) and Legend (50).",
      "Complete chains in different levels to earn milestones at 1, 3, 10, 25 and 50 chains. The best bonus medal for each level is shown in your collection.",
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
    intro: "The home screen opens Hangar, Shop, Weapons, Power-ups, Progress and Top 100.",
    details: [
      "Progress shows your best score, highest stage, defeated enemies, rank and collection. Top 100 lists the online high scores.",
      "In System, choose language, touch-control side, sensitivity and ship start height. Music, effects volume and reduced visual effects have their own controls.",
      "Boss stickers, chain badges and bonus medals are stored on this device. Admin test runs do not add collection progress.",
    ],
  },
] as const;

type GameGuideProps = { onClose: () => void; onStart: () => void };

const GameGuide = ({ onClose, onStart }: GameGuideProps) => {
  const { t } = useLocale();
  const [selected, setSelected] = useState<(typeof topics)[number]["id"]>("controls");
  const topic = topics.find(item => item.id === selected) ?? topics[0];

  return <div className="info-panel" role="dialog" aria-modal="true" aria-labelledby="info-title">
    <div className="info-panel-content guide-panel-content">
      <button className="close-button" type="button" onClick={onClose} aria-label={t("Close")}>×</button>
      <p className="eyebrow">{t("FIELD GUIDE")}</p>
      <h2 id="info-title">{t("How to Play")}</h2>
      <p className="guide-lead">{t("Choose a topic to learn the current rules before your mission.")}</p>
      <nav className="guide-topics" aria-label={t("Guide topics")}>
        {topics.map(item => <button key={item.id} type="button" className={selected === item.id ? "guide-topic is-active" : "guide-topic"} aria-pressed={selected === item.id} onClick={() => setSelected(item.id)}>{t(item.label)}</button>)}
      </nav>
      <section className="guide-detail" aria-live="polite" aria-labelledby="guide-section-title" key={topic.id}>
        <h3 id="guide-section-title">{t(topic.title)}</h3>
        <p>{t(topic.intro)}</p>
        <ul>{topic.details.map(detail => <li key={detail}>{t(detail)}</li>)}</ul>
      </section>
      <button className="button button-primary guide-start" type="button" onClick={onStart}>
        {t("Enter mission")}
        <span className="guide-start-icon" aria-hidden="true">
          <svg viewBox="0 0 32 32" fill="none" focusable="false">
            <path d="M16 2.5 29.5 16 16 29.5 2.5 16 16 2.5Z" stroke="currentColor" strokeWidth="1.5" />
            <path d="M9 16h13m-5.5-5.5L22 16l-5.5 5.5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </button>
    </div>
  </div>;
};

export default GameGuide;
