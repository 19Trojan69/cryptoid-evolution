import { memo, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { SectorBoss } from "./sectorBoss";
import { drawBossWeapons, weaponCanvasSize, disposeBossWeapons, releaseBossWeaponSources } from "./bossWeaponRenderer";
import { preloadBossWeapons } from "./bossWeaponTextures";
import { reportBossResource } from "./bossResourceDiagnostics";
import { beginVisualPaint, endVisualPaint } from './renderWork';
import { gameRenderScale } from './renderResolution';

type StaticDraw = {
  config: SectorBoss["config"];
  image: HTMLImageElement;
  width: number;
  height: number;
  pixelsX: number;
  pixelsY: number;
  turrets: number;
};

export default memo(function BossWeaponsView({ boss, frozen = false }: { boss: SectorBoss; frozen?: boolean }) {
  const canvas = useRef<HTMLCanvasElement>(null),
    [texture, setTexture] = useState<{ id: number; image: HTMLImageElement } | null>(null);
  const drawn = useRef<number | null>(null);
  const staticDraw = useRef<StaticDraw | null>(null);
  useEffect(() => {
    let alive = true;
    void preloadBossWeapons(boss.config).then(
      image => {
        if (alive) setTexture({ id: boss.config.id, image });
      },
      () => {}
    );
    return () => {
      alive = false;
    };
  }, [boss.config]);
  const ready = texture?.id === boss.config.id;
  useEffect(() => {
    const current = canvas.current;
    if (!current) return;
    const invalidate = () => {
      staticDraw.current = null;
    };
    current.addEventListener("contextlost", invalidate);
    current.addEventListener("contextrestored", invalidate);
    return () => {
      current.removeEventListener("contextlost", invalidate);
      current.removeEventListener("contextrestored", invalidate);
      staticDraw.current = null;
      disposeBossWeapons(current);
      if (drawn.current !== null) reportBossResource("boss-canvas-release", { bossId: drawn.current });
    };
  }, []);
  useLayoutEffect(() => {
    const c = canvas.current;
    if (!c || !ready) return;
    const size = weaponCanvasSize(boss),
      dpr = gameRenderScale(window.devicePixelRatio);
    const w = Math.ceil(size.width * dpr),
      h = Math.ceil(size.height * dpr);
    if (c.width !== w || c.height !== h) {
      c.width = w;
      c.height = h;
      staticDraw.current = null;
    }
    const allDestroyed = boss.turrets.length > 0 && boss.turrets.every(t => t.health <= 0),
      previous = staticDraw.current;
    // All destroyed guns have only fixed sockets/scars. Retain these exact pixels
    // on the existing surface; live hull heat and reactor motion stay separate.
    if (
      allDestroyed &&
      previous?.config === boss.config &&
      previous.image === texture.image &&
      previous.width === boss.width &&
      previous.height === boss.height &&
      previous.pixelsX === w &&
      previous.pixelsY === h &&
      previous.turrets === boss.turrets.length
    )
      return;
    const paintStarted = beginVisualPaint();
    let success: boolean;
    try { success = drawBossWeapons(c, boss, texture.image, frozen); }
    finally { endVisualPaint('boss', paintStarted); }
    if (!success) {
      staticDraw.current = null;
      return;
    }
    if (allDestroyed) releaseBossWeaponSources(c);
    staticDraw.current = allDestroyed
      ? {
          config: boss.config,
          image: texture.image,
          width: boss.width,
          height: boss.height,
          pixelsX: w,
          pixelsY: h,
          turrets: boss.turrets.length,
        }
      : null;
    if (drawn.current !== boss.config.id) {
      drawn.current = boss.config.id;
      reportBossResource("boss-canvas-first-draw", {
        bossId: boss.config.id,
        bossCanvasWidth: c.width,
        bossCanvasHeight: c.height,
      });
    }
  }, [boss, frozen, ready, texture]);
  return (
    <>
      {!ready && <img className="boss-weapons-loading" src={boss.config.wreckImage} alt="" draggable={false} />}
      <canvas ref={canvas} className="boss-weapons-canvas" hidden={!ready} aria-hidden="true" />
    </>
  );
});
