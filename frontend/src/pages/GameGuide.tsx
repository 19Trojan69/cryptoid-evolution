import { useState } from "react";
import { useLocale } from "../i18n";

const topics = [
  {
    id: "controls", label: "Controls", title: "Move and fire",
    intro: "Your ship fires automatically. Keep moving and line up its shots with the enemy formation.",
    details: [
      "On a touchscreen, steer with your thumb in the lower playfield. The ship stays visible above your touch point; control side, sensitivity and start height can be changed in System.",
      "On a keyboard, use the arrow keys or WASD. Move left and right, with limited room to dodge upward.",
      "The HUD shows hearts, game level, Shards, score, weapon stage and completed Blocks. Pause at any time with the button at the top.",
    ],
  },
  {
    id: "route", label: "Level path", title: "Nine Blocks to the boss",
    intro: "One level consists of nine Blocks, a boss fight and a bonus round.",
    details: [
      "Enemy ships enter in changing flight patterns, take their places in a formation, then break away for attack runs. Clear the waves to finish each Block.",
      "Each completed Block extends the chain shown in the HUD. After Block 9, the boss arrives; there is no extra Block between the chain and the boss.",
      "Defeat the boss to unlock the bonus round. When it ends, the next level starts with a fresh nine-Block chain and new formations.",
    ],
  },
  {
    id: "survival", label: "Combat & hearts", title: "Survive the attack runs",
    intro: "You start with three hearts. The mission ends when none remain.",
    details: [
      "Dodge enemy ships and their shots. An active shield absorbs the next hit; without it, a ship collision costs one heart.",
      "Advanced and Elite ship stages add protection against enemy projectiles per life. Their protection does not replace a shield against ship collisions.",
      "Enemies have different hull strengths, and bosses take sustained fire. Bosses accelerate their attacks as their hull weakens; keep clear of their volleys.",
    ],
  },
  {
    id: "equipment", label: "Weapons & boosts", title: "Build your firepower",
    intro: "Pick up glowing drops by flying through them. Collected boosts activate immediately.",
    details: [
      "Shield absorbs a hit, Overdrive strengthens shots, Rapid Fire increases the firing rate and Weapon Upgrade raises your weapon stage. Collected effects last up to 20 seconds.",
      "Weapon stages progress from the single laser to twin, rapid twin, triple and plasma fire. The standard laser is free.",
      "Equipped bought weapons stay owned but run for five minutes from the start of each mission. Bought start boosts are used for one mission and activated with their on-screen button.",
    ],
  },
  {
    id: "rewards", label: "Rewards & hangar", title: "Earn Shards and grow your fleet",
    intro: "Defeated enemies and completed challenges earn in-game Shards and points.",
    details: [
      "Light, medium, elite and heavy enemies award different Shards. Completing all nine Blocks pays a chain reward; the boss and bonus targets pay more.",
      "The bonus round has 12 targets. Nine or more hits add a chain bonus; a perfect 12-hit round can restore one lost heart.",
      "Shards are saved at mission end. Grey Scout is free; additional standard ships and color variants join your fleet through Shards. Higher ship stages and Pi offers are shown separately in the Hangar when available.",
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
        <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" focusable="false"><path d="M3.5 10h12m-5-5 5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </button>
    </div>
  </div>;
};

export default GameGuide;
