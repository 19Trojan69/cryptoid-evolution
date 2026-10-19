import assert from "node:assert/strict";
import fs from "node:fs";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { bossWeapons } from "../src/pages/bossWeapons.ts";
import { createSectorBoss } from "../src/pages/sectorBoss.ts";
import { gunPosition, gunMuzzle } from "../src/pages/bossTurrets.ts";
import { bossHitTarget } from "../src/pages/bossHitTarget.ts";
import { drawBossWeapons, weaponCanvasSize, disposeBossWeapons } from "../src/pages/bossWeaponRenderer.ts";

const require = createRequire(import.meta.url);
const { createCanvas, loadImage } = require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES + "/@napi-rs/canvas");
const root = new URL("../../", import.meta.url).pathname;
const base = "bf13968bf7b6bfcccc04799c975f9e355c5c6652";
const git = file => execFileSync("git", ["show", base + ":" + file], { cwd: root, maxBuffer: 20e6 });
const original = JSON.parse(
  git("frontend/src/pages/bossWeapons.ts")
    .toString()
    .match(/\[\] = (\[.*\]);/)[1]
);
const toCanvas = image => {
  const c = createCanvas(image.width, image.height);
  c.getContext("2d").drawImage(image, 0, 0);
  return c;
};
function pixels(image, r) {
  return image.getContext("2d").getImageData(r.x, r.y, r.width, r.height).data;
}
let changed = 0,
  stableTiles = 0,
  barrelChannels = 0,
  bodyHits = 0,
  unchangedMuzzles = 0,
  renderFrames = 0;
const sheet = createCanvas(1280, 980),
  sc = sheet.getContext("2d");
sc.fillStyle = "#08101e";
sc.fillRect(0, 0, sheet.width, sheet.height);
sc.fillStyle = "#e4edfa";
sc.font = "22px sans-serif";
sc.fillText("Kleine Turmkörper: vorher / nachher — Rohre gleich groß", 24, 34);
let example = 0;
for (let id = 1; id <= 50; id++) {
  const filename = `frontend/public/ships/bosses/evolved/boss-${String(id).padStart(2, "0")}-guns.webp`;
  const oldImage = toCanvas(await loadImage(git(filename))),
    image = toCanvas(await loadImage(root + filename));
  assert.equal(image.width, oldImage.width, `boss ${id} atlas width`);
  assert.equal(image.height, oldImage.height, `boss ${id} atlas height: no texture growth`);
  const rects = bossWeapons[id - 1].flatMap(g => [g.sprite, g.shadow, g.socket]);
  for (const [i, r] of rects.entries()) {
    assert.ok(r.x >= 2 && r.y >= 2 && r.x + r.width <= image.width && r.y + r.height <= image.height);
    for (const other of rects.slice(i + 1)) {
      assert.ok(
        r.x + r.width <= other.x ||
          other.x + other.width <= r.x ||
          r.y + r.height <= other.y ||
          other.y + other.height <= r.y,
        `boss ${id} atlas tiles must not overlap`
      );
    }
  }
  const boss = createSectorBoss(id * 10, 430, 90, 825);
  boss.y = 300;
  boss.elapsed = 2000;
  for (const [i, g] of bossWeapons[id - 1].entries()) {
    const old = original[id - 1][i];
    const ignore = new Set(["sprite", "shadow", "socket", "spritePivot", "body"]);
    for (const key of Object.keys(old))
      if (!ignore.has(key)) assert.deepEqual(g[key], old[key], `${id}:${i} immutable ${key}`);
    const small = old.halfWidth < 24;
    assert.equal(!!g.body, small, `${id}:${i} body selection`);
    if (!small) {
      assert.deepEqual(g.spritePivot, old.spritePivot);
      for (const key of ["sprite", "shadow", "socket"]) {
        assert.equal(g[key].width, old[key].width);
        assert.equal(g[key].height, old[key].height);
        assert.deepEqual(pixels(image, g[key]), pixels(oldImage, old[key]), `${id}:${i} unchanged ${key} exact RGBA`);
        stableTiles++;
      }
    } else {
      changed++;
      assert.deepEqual(g.body, { halfWidth: 24, back: Math.max(20, old.back) });
      const ox = Math.round((g.spritePivot.x - old.spritePivot.x) * 2),
        oy = Math.round((g.spritePivot.y - old.spritePivot.y) * 2);
      for (const key of ["sprite", "shadow"]) {
        const a = pixels(oldImage, old[key]),
          b = pixels(image, g[key]);
        const pad = key === "shadow" ? 12 : 0;
        // Strict equality everywhere beyond the larger body's documented bound,
        // including the exposed shafts, collars, muzzle and their contact shadow.
        const start = Math.ceil((old.spritePivot.y + pad + g.body.back * 0.88 + 4) * 2);
        for (let y = start; y < old[key].height; y++)
          for (let x = 0; x < old[key].width; x++)
            for (let ch = 0; ch < 4; ch++) {
              assert.equal(
                b[((y + oy) * g[key].width + x + ox) * 4 + ch],
                a[(y * old[key].width + x) * 4 + ch],
                `${id}:${i} ${key} barrel RGBA (${x},${y},${ch})`
              );
              barrelChannels++;
            }
      }
      const scale = boss.width / boss.config.sourceWidth,
        p = gunPosition(boss, g);
      boss.turrets.forEach((t, j) => {
        t.health = j === i ? t.maxHealth : 0;
      });
      const inner = Math.max(3, old.halfWidth * scale),
        outer = g.body.halfWidth * scale;
      assert.ok(outer > inner, `${id}:${i} genuinely wider target at phone width`);
      for (const angle of [0, 0.6, -1.2, 2.3]) {
        boss.turrets[i].a = angle;
        const world = (x, y) => ({
          x: p.x + Math.cos(angle) * x - Math.sin(angle) * y,
          y: p.y + Math.sin(angle) * x + Math.cos(angle) * y,
        });
        const added = world((inner + outer) / 2, 0);
        assert.equal(bossHitTarget(boss, added, added)?.index, i, `${id}:${i} added rotated body hit`);
        bodyHits++;
        const front = (g.body.back * 0.88 + 3) * scale + 2;
        const end = g.muzzle * scale + 2;
        if (end > front + 0.1) {
          const besideBarrel = world((inner + outer) / 2, (front + end) / 2);
          assert.equal(bossHitTarget(boss, besideBarrel, besideBarrel), null, `${id}:${i} no phantom wider barrel`);
        }
      }
      if (example < 8 && [2, 7, 14, 25, 44, 50].includes(id)) {
        const col = example % 2,
          row = Math.floor(example / 2),
          x = col * 640 + 20,
          y = row * 230 + 64;
        sc.fillStyle = "#b6c8e1";
        sc.font = "17px sans-serif";
        sc.fillText(`Boss ${id} · Geschütz ${i + 1}`, x, y);
        for (const [j, [im, gun]] of [
          [oldImage, old],
          [image, g],
        ].entries()) {
          sc.save();
          sc.translate(x + 110 + j * 270, y + 62);
          const r = gun.sprite;
          sc.drawImage(
            im,
            r.x,
            r.y,
            r.width,
            r.height,
            -gun.spritePivot.x * 1.5,
            -gun.spritePivot.y * 1.5,
            r.width * 0.75,
            r.height * 0.75
          );
          sc.restore();
          sc.fillStyle = "#899eb9";
          sc.fillText(j ? "Nachher" : "Vorher", x + 75 + j * 270, y + 192);
        }
        example++;
      }
    }
    for (let b = 0; b < g.barrels.length; b++)
      for (const recoil of [0, g.recoil]) {
        assert.deepEqual(
          gunMuzzle(boss, g, boss.turrets[i], b, recoil),
          gunMuzzle(boss, old, boss.turrets[i], b, recoil)
        );
        unchangedMuzzles++;
      }
  }
  boss.turrets.forEach(t => {
    t.health = t.maxHealth;
  });
  const size = weaponCanvasSize(boss);
  for (const dpr of [1, 1.5, 2, 3]) {
    const canvas = createCanvas(Math.ceil(size.width * Math.min(dpr, 2)), Math.ceil(size.height * Math.min(dpr, 2)));
    for (const fraction of [1, 0.5, 0]) {
      boss.turrets.forEach((t, i) => {
        t.health = t.maxHealth * fraction;
        t.a = i % 2 ? -1.2 : 1.2;
      });
      assert.equal(drawBossWeapons(canvas, boss, image, false, createCanvas), true);
      renderFrames++;
    }
    disposeBossWeapons(canvas);
  }
}
assert.equal(changed, 177);
assert.equal(bodyHits, 708);
const output = process.argv[2];
if (output) fs.writeFileSync(output, sheet.toBuffer("image/png"));
console.log(
  JSON.stringify({
    changed,
    stableTiles,
    barrelChannels,
    bodyHits,
    unchangedMuzzles,
    renderFrames,
    allAtlasDimensionsUnchanged: true,
  })
);
