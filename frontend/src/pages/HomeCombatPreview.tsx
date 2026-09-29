import { useEffect, useState, type CSSProperties } from "react";
import PaintedShip from "./PaintedShip";
import { playerColors, playerSkins, type PlayerColorId } from "./shipFleet";
import type { ShipStage } from "./shipEvolution";

const SCENE_MS = 32_000;
const stageFor = (scene: number, index: number): ShipStage => ((scene + index) % 3 + 1) as ShipStage;

const HomeCombatPreview = ({ defender }: { defender: { sprite: number; color: PlayerColorId; stage: ShipStage } }) => {
  const [scene, setScene] = useState(0);
  useEffect(() => {
    const timer = window.setInterval(() => setScene(current => current + 1), SCENE_MS);
    return () => window.clearInterval(timer);
  }, []);

  const enemies = Array.from({ length: 4 }, (_, index) => {
    const sprite = playerSkins[(((scene * 4 + index) * 7) % playerSkins.length)].sprite;
    const color = playerColors[(scene * 3 + index * 2) % playerColors.length];
    return { sprite, color: color.id, glow: color.glow, stage: stageFor(scene, index) };
  });
  const wingman = {
    sprite: playerSkins[(scene * 7 + 9) % playerSkins.length].sprite,
    color: playerColors[(scene * 3 + 5) % playerColors.length].id,
    stage: stageFor(scene, 5),
  };

  return <div className="home-combat-preview" role="img" aria-label="Animierte Raumschiff-Kampfszene in Aufsicht">
    <div className="home-combat-scene" key={scene} aria-hidden="true">
      {enemies.map((ship, index) => <span key={index} className={`home-combat-ship home-combat-enemy home-combat-enemy-${index + 1}`} style={{ "--combat-glow": ship.glow } as CSSProperties}><span className="home-combat-engine" /><PaintedShip className="home-combat-hull" sprite={ship.sprite} color={ship.color} stage={ship.stage} /></span>)}
      {[defender, wingman].map((ship, index) => <span key={index} className={`home-combat-ship home-combat-ally home-combat-ally-${index + 1}`} style={{ "--combat-glow": playerColors.find(color => color.id === ship.color)?.glow ?? "#8feeff" } as CSSProperties}><span className="home-combat-engine" /><PaintedShip className="home-combat-hull" sprite={ship.sprite} color={ship.color} stage={ship.stage} /></span>)}
      {Array.from({ length: 7 }, (_, index) => <i key={index} className={`home-combat-shot home-combat-shot-${index + 1}`} />)}
      <i className="home-combat-impact home-combat-impact-1" /><i className="home-combat-impact home-combat-impact-2" />
    </div>
  </div>;
};

export default HomeCombatPreview;
