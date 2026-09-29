"""Build the 50 individual transparent game WebPs from the retained PNGs."""
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
SOURCES = ROOT / "assets/boss-masters"
TARGETS = ROOT / "frontend/public/ships/bosses"
TARGETS.mkdir(parents=True, exist_ok=True)

for number in range(1, 51):
    master = SOURCES / f"boss_{number:02}.png"
    if not master.exists():
        raise FileNotFoundError(master)
    ship = Image.open(master).convert("RGBA")
    width = 1536
    ship = ship.resize((width, round(ship.height * width / ship.width)), Image.Resampling.LANCZOS)
    pixels = np.asarray(ship).copy()
    pixels[:, :, 3][pixels[:, :, 3] < 4] = 0
    ship = Image.fromarray(pixels, "RGBA")
    target = TARGETS / f"boss_{number:02}.webp"
    temporary = target.with_suffix(".pending.webp")
    ship.save(temporary, "WEBP", quality=88, method=4)
    if temporary.stat().st_size < 10_000:
        raise RuntimeError(f"Optimizer wrote an incomplete image: {temporary}")
    temporary.replace(target)

print("Optimized 50 separate transparent boss WebPs at 1536 px width")
