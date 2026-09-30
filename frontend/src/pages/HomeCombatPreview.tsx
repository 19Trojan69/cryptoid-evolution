import { useEffect, useState, type CSSProperties } from "react";
import PaintedShip from "./PaintedShip";
import { allPlayerColors, playerColors, playerSkins, shipNozzleStyles, type PlayerColorId } from "./shipFleet";
import type { ShipStage } from "./shipEvolution";

const SCENE_MS = 12_000;
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
  return <div className="home-combat-preview" role="img" aria-label="Drei unterschiedliche Raumschiffe in einer animierten Kampfszene von oben">
    <div className="home-combat-scene" key={scene} aria-hidden="true" style={{ "--scene-direction": scene % 2 ? -1 : 1, "--scene-drift": `${(scene % 3 - 1) * 5}px` } as CSSProperties}>
      <span className="home-combat-ship home-combat-lead" style={{ "--combat-glow": enemies[0].glow } as CSSProperties}>
        <span className="home-combat-body">{engineTrails(enemies[0].sprite)}<PaintedShip className="home-combat-hull" sprite={enemies[0].sprite} color={enemies[0].color} stage={enemies[0].stage} /></span>
        <i className="home-combat-damage" />
      </span>
      <span className="home-combat-ship home-combat-cross" style={{ "--combat-glow": enemies[1].glow } as CSSProperties}>
        <span className="home-combat-body">{engineTrails(enemies[1].sprite)}<PaintedShip className="home-combat-hull" sprite={enemies[1].sprite} color={enemies[1].color} stage={enemies[1].stage} /></span>
      </span>
      <span className="home-combat-ship home-combat-ally-1" style={{ "--combat-glow": defenderGlow } as CSSProperties}>
        <span className="home-combat-body">{engineTrails(defender.sprite)}<PaintedShip className="home-combat-hull" sprite={defender.sprite} color={defender.color} stage={defender.stage} /></span>
      </span>
      <i className="home-combat-bolt home-combat-bolt-1" /><i className="home-combat-bolt home-combat-bolt-2" /><i className="home-combat-bolt home-combat-bolt-3" />
      <i className="home-combat-bolt home-combat-cross-bolt-1" /><i className="home-combat-bolt home-combat-cross-bolt-2" />
      <span className="home-combat-destruction"><i /><i /><i /><i /></span>
    </div>
  </div>;
};

export default HomeCombatPreview;
