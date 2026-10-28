import { restoreFormationNoticeChanges } from './formationNoticeReviewedChanges.mjs';
// Five exact controller changes against published e9ca7d2; no generic normalization.
export const fairShipStageGameChanges = [
  {
    "before": "import { openingKillPickup } from \"./pickupOrigin\";\nimport { projectileGuardForStage, projectileImpact, stageWeaponLevel, selectedShipStage, type ShipStage } from \"./shipEvolution\";\nimport { GameAudio, hasPrimedGameAudio, takePrimedGameAudio } from \"./gameAudio\";\n",
    "after": "import { openingKillPickup } from \"./pickupOrigin\";\nimport { projectileGuardForStage, projectileImpact, powerUpPickupRadius, stageWeaponLevel, selectedShipStage, type ShipStage } from \"./shipEvolution\";\nimport { GameAudio, hasPrimedGameAudio, takePrimedGameAudio } from \"./gameAudio\";\n"
  },
  {
    "before": "                if (impact.damage > 0) playerImpact = { x: moved.x, y: moved.y };\n                if (impact.blockedByHull) {\n                  state.effects.push({ id: nextIdRef.current++, x: state.player.x * width, y: state.player.y * height, kind: \"shield\", startedAt: time, target: \"player\" });\n                  soundRef.current?.play(\"shield\");\n                }\n              }\n",
    "after": "                if (impact.damage > 0) playerImpact = { x: moved.x, y: moved.y };\n              }\n"
  },
  {
    "before": "            gameHaptics.explosion();\n            // The stage pool belongs to this mission; losing/healing a heart never refills it.\n            if (destroyed) state.projectileGuard = 0;\n            state.weaponCap = Math.max(1, state.weaponCap - 1);\n",
    "after": "            gameHaptics.explosion();\n            // Retire legacy hull protection; only actual shields can absorb hits.\n            state.projectileGuard = 0;\n            state.weaponCap = Math.max(1, state.weaponCap - 1);\n"
  },
  {
    "before": "        state.powerUps = state.powerUps.filter(pickup => {\n          if (Math.hypot(pickup.x - state.player.x * width, pickup.y - state.player.y * height) > 34) return true;\n          Object.assign(state, activateCollectedPower(state, pickup.type));\n",
    "after": "        state.powerUps = state.powerUps.filter(pickup => {\n          if (Math.hypot(pickup.x - state.player.x * width, pickup.y - state.player.y * height) > powerUpPickupRadius(shipStageRef.current)) return true;\n          Object.assign(state, activateCollectedPower(state, pickup.type));\n"
  },
  {
    "before": "              {game.weaponSource !== \"paid\" && game.paidWeaponMs > 0 && <div className=\"weapon-slot weapon-slot-reserve\" data-source=\"paid\"><TimedRing remainingMs={game.paidWeaponMs} durationMs={PURCHASED_WEAPON_DURATION_MS} /><button type=\"button\" className=\"edge-action edge-action-weapon weapon-cycle\" disabled={game.status !== \"playing\"} onClick={openWeaponSelection} aria-label={`${t(\"Select\")}: ${weaponNames[stageWeaponLevel(shipStage, game.paidWeaponLevel)]}`}><span className=\"weapon-cycle-glyph\" aria-hidden=\"true\">{weaponGlyphs[stageWeaponLevel(shipStage, game.paidWeaponLevel)]}</span><small>{weaponNames[stageWeaponLevel(shipStage, game.paidWeaponLevel)]}</small></button></div>}\n              {shipStage > 1 && <span className=\"weapon-hull-hits\" aria-label={`${t(\"Projectile hits left\")}: ${game.projectileGuard}`}>✦ {game.projectileGuard}/{projectileGuardForStage(shipStage)}</span>}\n            </div>\n",
    "after": "              {game.weaponSource !== \"paid\" && game.paidWeaponMs > 0 && <div className=\"weapon-slot weapon-slot-reserve\" data-source=\"paid\"><TimedRing remainingMs={game.paidWeaponMs} durationMs={PURCHASED_WEAPON_DURATION_MS} /><button type=\"button\" className=\"edge-action edge-action-weapon weapon-cycle\" disabled={game.status !== \"playing\"} onClick={openWeaponSelection} aria-label={`${t(\"Select\")}: ${weaponNames[stageWeaponLevel(shipStage, game.paidWeaponLevel)]}`}><span className=\"weapon-cycle-glyph\" aria-hidden=\"true\">{weaponGlyphs[stageWeaponLevel(shipStage, game.paidWeaponLevel)]}</span><small>{weaponNames[stageWeaponLevel(shipStage, game.paidWeaponLevel)]}</small></button></div>}\n            </div>\n"
  }
];

export function restoreFairShipStageGameChanges(source) {
  source = restoreFormationNoticeChanges(source);
  for (const { before, after } of [...fairShipStageGameChanges].reverse()) {
    if (source.split(after).length !== 2) throw Error('Expected one exact fair ship-stage change');
    source = source.replace(after, before);
  }
  return source;
}
