"""Extract ship-specific anchors and coarse collision masks from the approved masters.

The game uses the optimized WebPs for both the drawn hull and its CSS alpha mask.
Run from the repository root after changing a master or its optimized WebP.
"""
import base64
import json
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = Path(__file__).resolve().parents[2]
IMAGES = ROOT / "frontend/public/ships/bosses"
DESIGNS = json.loads((ROOT / "doc/boss-fleet-design.json").read_text())
OUT = ROOT / "frontend/src/pages"

# These mouths are dark or adjacent to blue armor, so color segmentation alone
# cannot locate their centers. Coordinates were checked against the full masters.
ENGINE_OVERRIDES = {
    1: [(0.40, .065), (.60, .065)],
    5: [(.445, .07), (.555, .07)],
    6: [(.16, .08), (.50, .08), (.84, .08)],
    24: [(.315, .055), (.43, .055), (.57, .055), (.685, .055)],
    39: [(.345, .075), (.422, .075), (.50, .075), (.578, .075), (.655, .075)],
    48: [(.347, .075), (.423, .075), (.50, .064), (.577, .075), (.653, .075)],
}


def engine_mouths(a, count, number):
    if number in ENGINE_OVERRIDES:
        return ENGINE_OVERRIDES[number]
    h, w = a.shape[:2]
    r, g, b, alpha = [a[:, :, k].astype(float) for k in range(4)]
    blue = (b > 85) & (b > r * 1.35) & (g > r * 1.1) & (alpha > 100)
    blue[int(h * .23):] = False
    labels, n = ndimage.label(ndimage.binary_opening(blue, iterations=2))
    found = []
    for index in range(1, n + 1):
        ys, xs = np.where(labels == index)
        if len(xs) < 90 or np.ptp(xs) < 10 or np.ptp(ys) < 9 or np.ptp(xs) / max(1, np.ptp(ys)) > 3.3:
            continue
        found.append((len(xs), (float(xs.mean()) / w, float(ys.mean()) / h)))
    found.sort(reverse=True)
    return sorted([position for _, position in found[:count]])


def weapon_muzzles(alpha, number):
    """Trace the actual forward alpha contour at distinct wing gun stations."""
    h, w = alpha.shape
    stations = [.10, .27, .39, .50, .61, .73, .90]
    selected = stations[:1] + stations[-1:] if number <= 5 else stations[:2] + stations[-2:]
    if number >= 16:
        selected = stations[:3] + stations[-3:]
    if number >= 36:
        selected = stations
    points = []
    for station in selected:
        xc = round(station * (w - 1))
        # Restrict to the nearby gun/wing segment, then find the foremost
        # visible face. Symmetric sampling preserves the intended architecture.
        band = alpha[:, max(0, xc - w // 90):min(w, xc + w // 90)] > 180
        ys, xs = np.where(band)
        ys = ys[ys > h * .28]
        if not len(ys):
            continue
        tip = int(np.max(ys))
        # The muzzle is slightly inset to avoid shots appearing inside the art.
        points.append([round(xc / w, 4), round(min(1, (tip + 2) / h), 4)])
    return points


def fire_sites(alpha):
    h, w = alpha.shape
    solid = ndimage.binary_erosion(alpha > 195, iterations=max(2, round(h * .025)))
    points = []
    for y in [.29, .46, .61, .76]:
        for x in [.18, .34, .50, .66, .82]:
            px, py = int(x * w), int(y * h)
            if solid[py, px]:
                points.append([round(x * 100), round(y * 100)])
            else:
                ys, xs = np.where(solid[max(0, py - h // 12):min(h, py + h // 12), max(0, px - w // 22):min(w, px + w // 22)])
                if len(xs):
                    yy = ys[len(ys) // 2] + max(0, py - h // 12)
                    xx = xs[len(xs) // 2] + max(0, px - w // 22)
                    candidate = [round(xx / w * 100), round(yy / h * 100)]
                    if candidate not in points:
                        points.append(candidate)
    return points


entries, masks = [], []
for design in DESIGNS:
    number = design["id"]
    image = f"/ships/bosses/boss_{number:02}.webp"
    a = np.asarray(Image.open(IMAGES / f"boss_{number:02}.webp").convert("RGBA"))
    h, w = a.shape[:2]
    mouths = engine_mouths(a, design["engines"], number)
    if not 2 <= len(mouths) <= 6:
        raise ValueError(f"Boss {number}: expected 2–6 visible engines, found {mouths}")
    guns = weapon_muzzles(a[:, :, 3], number)
    if len(guns) < 2:
        raise ValueError(f"Boss {number}: no separate outer weapon stations")
    # Conservative mask: all four source pixels must be visible. This prevents
    # collision with the transparent voids of rings, split hulls and wings.
    small = Image.fromarray(a[:, :, 3]).resize((128, 48), Image.Resampling.BOX)
    bits = np.asarray(small) >= 176
    sites = [site for site in fire_sites(a[:, :, 3]) if bits[min(47, int(site[1] / 100 * 48)), min(127, int(site[0] / 100 * 128))]]
    if len(sites) < 5:
        raise ValueError(f"Boss {number}: insufficient opaque damage sites")
    masks.append(base64.b64encode(np.packbits(bits).tobytes()).decode("ascii"))
    tier = (number - 1) // 10
    pool = ["bolt", "orb", "lance", "split", "pulse"]
    if tier >= 1:
        pool += ["double", "burst"]
    if tier >= 3:
        pool += ["heavy", "rapid"]
    entries.append({
        "id": number, "level": number * 10, "image": image,
        "aspectRatio": round(w / h, 5),
        "widthScale": round(.73 + tier * .045 + (number % 5) * .007, 3),
        "heightScale": 1,
        "engineAnchors": [[round(x, 4), round(y, 4)] for x, y in mouths],
        "weaponAnchors": guns,
        "fireSites": sites,
        "projectilePool": pool,
        "explosionScale": round(.82 + number * .016, 3),
        "explosionStages": min(5, 2 + (number - 1) // 11),
    })

(OUT / "bossManifest.ts").write_text(
    "// Generated by scripts/build-boss-manifest.py from individual boss images.\n"
    "import type { BossProjectileKind } from './enemyFire.ts';\n"
    "export type BossConfig = { id: number; level: number; image: string; aspectRatio: number; "
    "widthScale: number; heightScale: number; engineAnchors: readonly (readonly [number, number])[]; "
    "weaponAnchors: readonly (readonly [number, number])[]; fireSites: readonly (readonly [number, number])[]; "
    "projectilePool: readonly BossProjectileKind[]; explosionScale: number; explosionStages: number };\n"
    "export const bossManifest: readonly BossConfig[] = " + json.dumps(entries, separators=(",", ":")) + ";\n"
    "export const bossForLevel = (level: number) => level >= 10 && level <= 500 && level % 10 === 0 ? bossManifest[level / 10 - 1] : undefined;\n"
)
(OUT / "bossMasks.ts").write_text(
    "// Alpha coverage, 128 columns x 48 rows, MSB first; generated from the 50 WebPs.\n"
    "export const bossMasks: readonly string[] = " + json.dumps(masks, separators=(",", ":")) + ";\n"
)
print(f"Wrote {len(entries)} individual manifests, engine/weapon anchors and hull masks")
