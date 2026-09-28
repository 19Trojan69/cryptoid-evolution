"""Regenerate visible-art placement after adding ship evolution PNGs."""

from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "public" / "ships" / "evolution"
OUTPUT = ROOT / "src" / "pages" / "shipPreviewPlacement.ts"

rows = []
for path in sorted(ASSETS.glob("ship_*_stage_*.png")):
    image = Image.open(path).convert("RGBA")
    width, height = image.size
    alpha = image.getchannel("A")
    # Exclude nearly transparent glow when measuring the actual hull.
    bounds = alpha.point(lambda value: 255 if value > 32 else 0).getbbox()
    if bounds is None:
        continue
    left, top, right, bottom = bounds
    scale = min(1.18, .88 * width / (right - left), .88 * height / (bottom - top))
    x = (width / 2 - (left + right) / 2) * scale / width * 100
    y = (height / 2 - (top + bottom) / 2) * scale / height * 100
    ship, stage = path.stem.removeprefix("ship_").split("_stage_")
    rows.append(f'  "{int(ship)}-{stage}": [{x:.2f}, {y:.2f}, {scale:.3f}],')

OUTPUT.write_text(
    'import type { CSSProperties } from "react";\n'
    'import type { ShipStage } from "./shipEvolution";\n\n'
    '// Generated from the visible bounds of every ship evolution asset.\n'
    '// Regenerate with: python3 frontend/scripts/generate-ship-preview-placements.py\n'
    'const placements: Record<string, [number, number, number]> = {\n'
    + "\n".join(rows)
    + '\n};\n\n'
    'export const shipPreviewPlacement = (index: number, stage: ShipStage): CSSProperties => {\n'
    '  const [x, y, scale] = placements[`${index + 1}-${stage}`] ?? [0, 0, .88];\n'
    '  return { transform: `translate(${x}%, ${y}%) scale(${scale})` };\n'
    '};\n',
    encoding="utf-8",
)
