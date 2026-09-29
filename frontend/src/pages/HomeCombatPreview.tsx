import { useEffect, useState, type CSSProperties } from "react";
import PaintedShip from "./PaintedShip";
import { allPlayerColors, playerColors, playerSkins, shipNozzleStyles, type PlayerColorId } from "./shipFleet";
import type { ShipStage } from "./shipEvolution";

const SCENE_MS = 20_000;
const stageFor = (scene: number, index: number): ShipStage => ((scene + index) % 3 + 1) as ShipStage;

const HomeCombatPreview = ({ defender }: { defender: { sprite: number; color: PlayerColorId; stage: ShipStage } }) => {
  const [scene, setScene] = useState(0);
  useEffect(() => {
    const timer = window.setInterval(() => setScene(current => current + 1), SCENE_MS);
    return () => window.clearInterval(timer);
  }, []);

  const otherSkins = playerSkins.filter(skin => skin.sprite !== defender.sprite);
  const otherColors = playerColors.filter(color => color.id !== defender.color);
  const enemies = Array.from({ length: 2 }, (_, index) => {
    const sprite = otherSkins[(scene * 3 + index * 7) % otherSkins.length].sprite;
    const color = otherColors[(scene * 2 + index * 3) % otherColors.length];
    return { sprite, color: color.id, glow: color.glow, stage: stageFor(scene, index) };
  });
  const defenderGlow = allPlayerColors.find(color => color.id === defender.color)?.glow ?? "#8feeff";
  const engineTrails = (sprite: number) => shipNozzleStyles(sprite).map((style, index) =>
    <i key={index} className="home-combat-engine" style={style} />);
  const shots = (pattern: number) => <span className={`home-combat-weapons home-combat-pattern-${pattern}`}>
    <i className="home-combat-shot" /><i className="home-combat-shot" /><i className="home-combat-shot" />
  </span>;

  return <div className="home-combat-preview" role="img" aria-label="Drei unterschiedliche Raumschiffe in einer animierten Kampfszene von oben">
    <div className="home-combat-scene" key={scene} aria-hidden="true">
      {enemies.map((ship, index) => <span key={index} className={`home-combat-ship home-combat-enemy home-combat-enemy-${index + 1}`} style={{ "--combat-glow": ship.glow } as CSSProperties}>
        <span className="home-combat-body">{engineTrails(ship.sprite)}<PaintedShip className="home-combat-hull" sprite={ship.sprite} color={ship.color} stage={ship.stage} /></span>
        {shots((scene + index) % 3)}
      </span>)}
      <span className="home-combat-ship home-combat-ally-1" style={{ "--combat-glow": defenderGlow } as CSSProperties}>
        <span className="home-combat-body">{engineTrails(defender.sprite)}<PaintedShip className="home-combat-hull" sprite={defender.sprite} color={defender.color} stage={defender.stage} /></span>
        {shots((scene + 2) % 3)}
      </span>
      <i className="home-combat-impact home-combat-impact-1" /><i className="home-combat-impact home-combat-impact-2" />
    </div>
  </div>;
};

export default HomeCombatPreview;
