// Offline-only atlas transformation. Runtime retains one atlas per boss and
// exactly the existing sprite/shadow/socket draw calls; no new game surfaces.
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { createCanvas, loadImage } = require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES + "/@napi-rs/canvas");
const sharp = require("../../backend/node_modules/sharp");
const root = new URL("../../", import.meta.url).pathname;
const base = "bf13968bf7b6bfcccc04799c975f9e355c5c6652";
const source = execFileSync("git", ["show", base + ":frontend/src/pages/bossWeapons.ts"], {
  cwd: root,
  encoding: "utf8",
});
const guns = JSON.parse(source.match(/\[\] = (\[.*\]);/)[1]);
// The existing medium-body band starts around 24 source units of half-width.
// Do not promote weapon caliber or scale a barrel to reach this body floor.
export const MIN_BODY_HALF_WIDTH = 24;
export const MIN_BODY_BACK = 20;
const report = { base, changedGuns: 0, changedBosses: 0, oldAtlasBytes: 0, newAtlasBytes: 0, bosses: [] };
const pending = [];

function extract(image, rect) {
  const canvas = createCanvas(rect.width, rect.height),
    c = canvas.getContext("2d");
  c.drawImage(image, rect.x, rect.y, rect.width, rect.height, 0, 0, rect.width, rect.height);
  return canvas;
}
function bodyClip(c, g, x, y, sx = 1, sy = 1) {
  // The two outer body ellipses from boss-upgrade-renderer.cjs. Body-front is
  // smaller than back in the approved artwork; barrels lie outside this mask.
  c.beginPath();
  c.ellipse(x + 2 * sx, y + 6 * sy, g.halfWidth * 2 * sx, g.back * 0.88 * 2 * sy, 0, 0, Math.PI * 2);
  c.ellipse(x, y - 6 * sy, g.halfWidth * 2 * sx, g.back * 0.85 * 2 * sy, 0, 0, Math.PI * 2);
  c.clip();
}
function trimSocket(canvas) {
  // Enlarging a small mount also enlarges its old transparent padding. Remove
  // only symmetric fully transparent borders, retaining its exact center.
  const c = canvas.getContext("2d"),
    data = c.getImageData(0, 0, canvas.width, canvas.height).data;
  let x0 = canvas.width,
    y0 = canvas.height,
    x1 = 0,
    y1 = 0;
  for (let y = 0; y < canvas.height; y++)
    for (let x = 0; x < canvas.width; x++)
      if (data[(y * canvas.width + x) * 4 + 3]) {
        x0 = Math.min(x0, x);
        x1 = Math.max(x1, x);
        y0 = Math.min(y0, y);
        y1 = Math.max(y1, y);
      }
  const dx = Math.max(0, Math.min(x0, canvas.width - x1 - 1) - 2),
    dy = Math.max(0, Math.min(y0, canvas.height - y1 - 1) - 2);
  const out = createCanvas(canvas.width - dx * 2, canvas.height - dy * 2);
  out.getContext("2d").putImageData(c.getImageData(dx, dy, out.width, out.height), 0, 0);
  return out;
}
function enlarge(sourceTile, g, sx, sy, pivot, pad = 0) {
  const x = (g.spritePivot.x + pad) * 2,
    y = (g.spritePivot.y + pad) * 2;
  const left = Math.ceil(Math.max(0, g.halfWidth * 2 * sx + 4 - x));
  const top = Math.ceil(Math.max(0, g.back * 2 * sy + 8 - y));
  const right = Math.ceil(Math.max(0, x + (g.halfWidth * 2 + 4) * sx - sourceTile.width));
  const bottom = Math.ceil(Math.max(0, y + (g.back * 2 + 8) * sy - sourceTile.height));
  const out = createCanvas(sourceTile.width + left + right, sourceTile.height + top + bottom),
    c = out.getContext("2d");
  // Integer pixel transfer avoids an alpha roundtrip on unchanged barrel pixels.
  c.putImageData(sourceTile.getContext("2d").getImageData(0, 0, sourceTile.width, sourceTile.height), left, top);
  const body = createCanvas(sourceTile.width, sourceTile.height),
    bc = body.getContext("2d");
  bodyClip(bc, g, x, y);
  bc.drawImage(sourceTile, 0, 0);
  c.drawImage(body, left + x * (1 - sx), top + y * (1 - sy), body.width * sx, body.height * sy);
  if (pivot) {
    pivot.x += left / 2;
    pivot.y += top / 2;
  }
  return { tile: out, left, top };
}

function pack(items, width, height) {
  // MaxRects: use existing atlas whitespace instead of growing GPU textures.
  for (const order of ["height", "area", "width"])
    for (const score of ["short", "area", "long"]) {
      const free = [{ x: 2, y: 2, width: width - 2, height: height - 2 }];
      let success = true;
      const measure = t =>
        order === "height"
          ? t.height * 4096 + t.width
          : order === "width"
            ? t.width * 4096 + t.height
            : t.width * t.height;
      for (const item of [...items].sort((a, b) => measure(b.tile) - measure(a.tile))) {
        const w = item.tile.width + 2,
          h = item.tile.height + 2;
        const rank = r =>
          score === "area"
            ? r.width * r.height - w * h
            : score === "long"
              ? Math.max(r.width - w, r.height - h)
              : Math.min(r.width - w, r.height - h);
        const fit = free
          .filter(r => r.width >= w && r.height >= h)
          .sort((a, b) => rank(a) - rank(b) || a.width * a.height - b.width * b.height)[0];
        if (!fit) {
          success = false;
          break;
        }
        Object.assign(item.rect, { x: fit.x, y: fit.y });
        const used = { x: fit.x, y: fit.y, width: w, height: h },
          next = [];
        for (const r of free) {
          if (used.x >= r.x + r.width || used.x + w <= r.x || used.y >= r.y + r.height || used.y + h <= r.y) {
            next.push(r);
            continue;
          }
          if (used.x > r.x) next.push({ ...r, width: used.x - r.x });
          if (used.x + w < r.x + r.width) next.push({ ...r, x: used.x + w, width: r.x + r.width - used.x - w });
          if (used.y > r.y) next.push({ ...r, height: used.y - r.y });
          if (used.y + h < r.y + r.height) next.push({ ...r, y: used.y + h, height: r.y + r.height - used.y - h });
        }
        free.splice(
          0,
          free.length,
          ...next.filter(
            (r, i) =>
              !next.some(
                (o, j) =>
                  i !== j &&
                  o.x <= r.x &&
                  o.y <= r.y &&
                  o.x + o.width >= r.x + r.width &&
                  o.y + o.height >= r.y + r.height &&
                  (j < i || o.width !== r.width || o.height !== r.height)
              )
          )
        );
      }
      if (success) return;
    }
  throw new Error(
    `Atlas cannot fit without growing: ${width}x${height}, tiles ${items.map(i => `${i.tile.width}x${i.tile.height}`).join(",")}`
  );
}

for (const [index, stations] of guns.entries()) {
  if (!stations.some(g => g.halfWidth < MIN_BODY_HALF_WIDTH)) continue;
  const filename = `frontend/public/ships/bosses/evolved/boss-${String(index + 1).padStart(2, "0")}-guns.webp`;
  const originalBytes = execFileSync("git", ["show", base + ":" + filename], { cwd: root, maxBuffer: 20e6 });
  const original = await loadImage(originalBytes);
  const rawOriginal = await sharp(originalBytes).ensureAlpha().raw().toBuffer();
  const rawTile = r => {
    const out = Buffer.alloc(r.width * r.height * 4);
    for (let y = 0; y < r.height; y++)
      rawOriginal.copy(
        out,
        y * r.width * 4,
        ((r.y + y) * original.width + r.x) * 4,
        ((r.y + y) * original.width + r.x + r.width) * 4
      );
    return out;
  };
  const items = [];
  let changed = 0;
  function place(tile, raw) {
    const rect = { x: 0, y: 0, width: tile.width, height: tile.height };
    items.push({ tile, rect, raw });
    return rect;
  }
  for (const g of stations) {
    const old = { sprite: g.sprite, shadow: g.shadow, socket: g.socket, spritePivot: { ...g.spritePivot } };
    const preserved = { sprite: rawTile(g.sprite), shadow: rawTile(g.shadow), socket: rawTile(g.socket) };
    let sprite = extract(original, g.sprite),
      shadow = extract(original, g.shadow),
      socket = extract(original, g.socket);
    if (g.halfWidth < MIN_BODY_HALF_WIDTH) {
      const sx = MIN_BODY_HALF_WIDTH / g.halfWidth,
        sy = Math.max(1, MIN_BODY_BACK / g.back);
      const oldPivot = { ...g.spritePivot };
      const a = enlarge(sprite, g, sx, sy, null);
      const b = enlarge(shadow, g, sx, sy, null, 12);
      // Renderer positions the shadow relative to the sprite pivot. Keep the
      // original relative offset, including any newly needed transparent pad.
      const left = Math.max(a.left, b.left),
        top = Math.max(a.top, b.top);
      const padTo = value => {
        if (value.left === left && value.top === top) return value.tile;
        const t = createCanvas(value.tile.width + left - value.left, value.tile.height + top - value.top);
        t.getContext("2d").putImageData(
          value.tile.getContext("2d").getImageData(0, 0, value.tile.width, value.tile.height),
          left - value.left,
          top - value.top
        );
        return t;
      };
      sprite = padTo(a);
      shadow = padTo(b);
      g.spritePivot = { x: oldPivot.x + left / 2, y: oldPivot.y + top / 2 };
      const mount = createCanvas(Math.ceil(socket.width * sx), Math.ceil(socket.height * sx));
      mount.getContext("2d").drawImage(socket, 0, 0, mount.width, mount.height);
      socket = trimSocket(mount);
      g.body = { halfWidth: MIN_BODY_HALF_WIDTH, back: Math.max(MIN_BODY_BACK, g.back) };
      changed++;
    }
    for (const [key, tile] of Object.entries({ sprite, shadow, socket })) {
      let raw = preserved[key];
      if (g.body) {
        raw = await sharp(tile.toBuffer("image/png")).ensureAlpha().raw().toBuffer();
        if (key !== "socket") {
          // Native Canvas internally premultiplies alpha. Restore the original
          // decoded RGBA outside the body before lossless encoding, avoiding
          // repeated premultiply/unpremultiply rounding on untouched barrels.
          const pad = key === "shadow" ? 12 : 0;
          const px = (old.spritePivot.x + pad) * 2,
            py = (old.spritePivot.y + pad) * 2;
          const dx = Math.round((g.spritePivot.x - old.spritePivot.x) * 2),
            dy = Math.round((g.spritePivot.y - old.spritePivot.y) * 2);
          for (let y = 0; y < old[key].height; y++)
            for (let x = 0; x < old[key].width; x++) {
              if (
                y < Math.ceil((old.spritePivot.y + pad + g.body.back * 0.88 + 4) * 2) &&
                y - py >= (-g.body.back - 5) * 2 &&
                Math.abs(x - px) <= (g.body.halfWidth + 3) * 2
              )
                continue;
              preserved[key].copy(
                raw,
                ((y + dy) * tile.width + x + dx) * 4,
                (y * old[key].width + x) * 4,
                (y * old[key].width + x + 1) * 4
              );
            }
        }
      }
      g[key] = place(tile, raw);
    }
  }
  pack(items, original.width, original.height);
  const atlas = { width: original.width, height: original.height },
    rawAtlas = Buffer.alloc(atlas.width * atlas.height * 4);
  for (const { tile, rect, raw } of items)
    for (let y = 0; y < tile.height; y++)
      raw.copy(rawAtlas, ((rect.y + y) * atlas.width + rect.x) * 4, y * tile.width * 4, (y + 1) * tile.width * 4);
  // Lossless: unmodified guns and exposed barrel pixels remain exact RGBA.
  pending.push({
    filename,
    bytes: await sharp(rawAtlas, { raw: { width: atlas.width, height: atlas.height, channels: 4 } })
      .webp({ lossless: true, effort: 4 })
      .toBuffer(),
  });
  report.changedGuns += changed;
  report.changedBosses++;
  report.oldAtlasBytes += original.width * original.height * 4;
  report.newAtlasBytes += atlas.width * atlas.height * 4;
  report.bosses.push({ id: index + 1, changed, oldHeight: original.height, newHeight: atlas.height });
}
const header = source
  .slice(0, source.indexOf("export const bossWeapons:"))
  .replace("socket:AtlasRect}", "socket:AtlasRect;body?:{halfWidth:number;back:number}}");
for (const { filename, bytes } of pending) fs.writeFileSync(path.join(root, filename), bytes);
fs.writeFileSync(
  path.join(root, "frontend/src/pages/bossWeapons.ts"),
  header + "export const bossWeapons: readonly (readonly BossGunConfig[])[] = " + JSON.stringify(guns) + ";\n"
);
console.log(JSON.stringify(report, null, 2));
