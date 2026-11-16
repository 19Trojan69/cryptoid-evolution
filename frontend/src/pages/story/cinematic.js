import { drawIntake, drawVortexDust, paintVortex, vortexPosition } from './storyVortex.js';

const clamp = (value, low, high) => Math.max(low, Math.min(value, high));
const range = (value, from, to) => clamp((value - from) / (to - from), 0, 1);
const smooth = (value, from, to) => {
  const x = range(value, from, to);
  return x * x * (3 - 2 * x);
};
const typeface = 'Barlow, Arial, sans-serif';

function cover(ctx, image, w, h) {
  const zoom = Math.max(w / image.width, h / image.height);
  const sw = image.width * zoom;
  const sh = image.height * zoom;
  ctx.drawImage(image, (w - sw) / 2, (h - sh) * 0.24, sw, sh);
}

function tracked(ctx, label, x, y, spacing) {
  const letters = Array.from(label);
  const widths = letters.map(letter => ctx.measureText(letter).width);
  let left = x - (widths.reduce((a, b) => a + b, 0) + (letters.length - 1) * spacing) / 2;
  ctx.textAlign = 'left';
  for (let index = 0; index < letters.length; index++) {
    ctx.fillText(letters[index], left, y);
    left += widths[index] + spacing;
  }
}

export function createCinematic(ctx, assets, timeline, createSurface, appearance, presentation) {
  let backdrop;
  let vortex;
  let width;
  let height;
  let unit;
  let typeSize;
  let rows = [];
  let anchors = [];
  const lastWord = timeline.groups.at(-1).words.at(-1).end;
  const firstWord = timeline.groups[0].words[0].start;
  const contactTime = timeline.groups.find(group => group.kind === 'contact')?.words.at(-1).start;
  const revealTime = Math.min(lastWord + .42, timeline.duration - 1.3);

  function resize(w, h) {
    width = w;
    height = h;
    unit = Math.min(w, h * 0.83);
    typeSize = unit * 0.059;
    const maxWidth = Math.min(w * 0.715, h * 0.79);
    rows = [];
    anchors = [{ time: 0, row: firstWord < .15 ? -.13 : -3.1 }];
    let position = 0;

    for (const group of timeline.groups) {
      const accent = group.kind !== 'story';
      const font = `${accent ? 800 : 600} ${typeSize * (accent ? 1.08 : 1)}px ${typeface}`;
      ctx.font = font;
      let line = [];

      function addLine() {
        if (!line.length) return;
        const start = line[0].start;
        const row = position++;
        const text = line.map(word => word.text).join(' ');
        const width = ctx.measureText(text).width;
        let advance = 0;
        let prefix = '';
        let index = 0;
        const letters = Array.from(text, letter => {
          prefix += letter;
          const next = ctx.measureText(prefix).width;
          const x = (advance + next - width) * .5;
          const order = ((index++ * 17 + row * 11 + appearance.seed) % 31) / 31;
          advance = next;
          return { letter, x, order };
        });
        rows.push({
          text,
          width,
          letters,
          font,
          position: row,
          kind: group.kind,
          start,
          end: line.at(-1).end,
        });
        const prior = anchors.at(-1);
        anchors.push({ time: Math.max(start, prior.time + 0.035), row: row - 0.10 });
        line = [];
      }

      for (const word of group.words) {
        const candidate = [...line, word].map(item => item.text).join(' ');
        if (line.length && ctx.measureText(candidate).width > maxWidth) addLine();
        line.push(word);
      }
      addLine();
      position += accent ? 0.76 : 0.55;
    }

    const finalRow = rows.at(-1).position;
    anchors.push({ time: Math.max(lastWord + 0.15, anchors.at(-1).time + 0.12), row: finalRow + 0.20 });
    anchors.push({ time: Math.max(revealTime + 1.2, lastWord + 1.35), row: finalRow + 10 });

    if (backdrop) backdrop.width = backdrop.height = 0;
    backdrop = createSurface(w, h);
    const base = backdrop.getContext('2d');
    base.fillStyle = '#060b13';
    base.fillRect(0, 0, w, h);
    cover(base, assets.nebula, w, h);
    const shadow = base.createLinearGradient(0, 0, 0, h);
    shadow.addColorStop(0, 'rgba(3, 7, 14, .38)');
    shadow.addColorStop(.34, 'rgba(3, 7, 14, .52)');
    shadow.addColorStop(.64, 'rgba(3, 7, 14, .69)');
    shadow.addColorStop(1, 'rgba(3, 7, 14, .94)');
    base.fillStyle = shadow;
    base.fillRect(0, 0, w, h);
    const vignette = base.createRadialGradient(w * .5, h * .42, unit * .09, w * .5, h * .42, Math.hypot(w, h) * .58);
    vignette.addColorStop(0, 'rgba(1, 4, 9, 0)');
    vignette.addColorStop(.64, 'rgba(1, 4, 9, .12)');
    vignette.addColorStop(1, 'rgba(1, 4, 9, .8)');
    base.fillStyle = vignette;
    base.fillRect(0, 0, w, h);
    vortex = paintVortex(base, w, h, unit, appearance.variant, appearance.seed);
  }

  function scrollAt(time) {
    const nextIndex = anchors.findIndex(anchor => time <= anchor.time);
    if (nextIndex < 0) return anchors.at(-1).row;
    if (nextIndex === 0) return anchors[0].row;
    const a = anchors[nextIndex - 1];
    const b = anchors[nextIndex];
    return a.row + (b.row - a.row) * range(time, a.time, b.time);
  }

  function openingTitle(time) {
    const opacity = smooth(time, 0, 0.65) * (1 - smooth(time, Math.max(1.05, firstWord - 0.3), Math.max(3.15, firstWord + 1.65)));
    if (opacity <= 0) return;
    const y = height * 0.277;
    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.fillStyle = '#f5cc80';
    ctx.font = `800 ${unit * .058}px ${typeface}`;
    ctx.textBaseline = 'middle';
    tracked(ctx, presentation.heading, width / 2, y, unit * .005);
    ctx.strokeStyle = 'rgba(245, 204, 128, .42)';
    ctx.lineWidth = unit * .0015;
    ctx.beginPath();
    ctx.moveTo(width / 2 - unit * .15, y + unit * .057);
    ctx.lineTo(width / 2 + unit * .15, y + unit * .057);
    ctx.stroke();
    ctx.restore();
  }

  function clipOutsideVortex() {
    ctx.beginPath();
    ctx.rect(0, 0, width, height);
    ctx.arc(vortex.x, vortex.y, vortex.radius, 0, Math.PI * 2);
    ctx.clip('evenodd');
  }

  function pullLetters(row, y, pull, stretch, scale, opacity) {
    for (const { letter, x, order } of row.letters) {
      if (letter === ' ') continue;
      const progress = smooth(pull, .12 + order * .31, .93 + order * .045);
      const alpha = opacity * (1 - smooth(progress, .68, .96));
      if (alpha < .015) continue;
      const position = vortexPosition(vortex, y, progress, x * stretch);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(position.x, position.y);
      ctx.rotate(position.rotation + (order - .5) * progress * 1.6);
      ctx.scale(stretch * (1 - .8 * progress), scale * (1 - .59 * progress));
      ctx.fillText(letter, 0, 0);
      ctx.restore();
    }
  }

  function crawl(time, reveal, reducedMotion) {
    const scroll = scrollAt(time);
    const opticalHorizon = height * .205;
    const focus = height * .56;
    const vanishingDistance = focus - opticalHorizon;
    const active = rows.findIndex(row => time >= row.start && time <= row.end);
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    if (reducedMotion) {
      const row = rows[active < 0 ? Math.max(0, rows.findLastIndex(row => row.start <= time)) : active];
      if (row && time <= lastWord + .3) {
        ctx.globalAlpha = 1 - reveal;
        ctx.fillStyle = '#ffda8e';
        ctx.font = row.font;
        ctx.fillText(row.text, width / 2, focus);
      }
    } else {
      clipOutsideVortex();
      for (const [index, row] of rows.entries()) {
        const depth = 1 - (row.position - scroll) * .115;
        if (depth <= 0) continue;
        const scale = 1 / depth;
        const y = opticalHorizon + scale * vanishingDistance;
        if (y < height * .243 || y > height * .852) continue;
        // Keep the scroll on the narration clock and warp only its distant projection.
        const pull = 1 - smooth(y, height * .368, height * .480);
        if (pull > .99) continue;
        const distanceFade = smooth(y, height * .294, height * .517) + smooth(pull, .1, .65) * .27;
        const entranceFade = 1 - smooth(y, height * .739, height * .848);
        const opacity = distanceFade * entranceFade * (1 - reveal);
        if (opacity < .015) continue;
        drawIntake(ctx, vortex, y, pull, opacity);
        const stretch = Math.min(scale ** .77, width * .922 / row.width);
        const verticalScale = scale * .88;
        ctx.save();
        ctx.font = row.font;
        ctx.shadowBlur = pull < .12 ? unit * .013 : 0;
        ctx.shadowColor = 'rgba(0, 0, 0, .91)';
        ctx.fillStyle = index === active || row.kind !== 'story' ? '#ffe1a0' : '#f0c575';
        if (pull < .12) {
          ctx.globalAlpha = opacity;
          ctx.translate(width / 2, y);
          ctx.scale(stretch, verticalScale);
          ctx.fillText(row.text, 0, 0);
        } else pullLetters(row, y, pull, stretch, verticalScale, opacity);
        ctx.restore();
      }
    }
    ctx.restore();
  }

  function ship(centerY, shipWidth, alpha, lit) {
    const image = lit ? assets.ship : assets.outline;
    if (!image) return;
    const shipHeight = shipWidth * image.height / image.width;
    const glow = ctx.createRadialGradient(width / 2, centerY, unit * .016, width / 2, centerY, shipWidth * .61);
    glow.addColorStop(0, lit ? 'rgba(60, 166, 188, .31)' : 'rgba(65, 132, 174, .22)');
    glow.addColorStop(.55, 'rgba(40, 143, 172, .09)');
    glow.addColorStop(1, 'rgba(22, 55, 87, 0)');
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = glow;
    ctx.fillRect(0, centerY - shipWidth * .61, width, shipWidth * 1.23);
    ctx.drawImage(image, (width - shipWidth) / 2, centerY - shipHeight / 2, shipWidth, shipHeight);
    ctx.restore();
  }

  function fire(left, top, w, h, time) {
    for (const [index, gun] of assets.muzzles.entries()) {
      const elapsed = time - revealTime - 1.22 - index * .19;
      if (elapsed < 0) continue;
      const age = elapsed % gun.interval;
      if (age > 1.1) continue;
      const x = left + gun.x * w;
      const y = top + gun.y * h;
      const travel = age * unit * 1.22;
      const frontX = x + gun.dx * travel;
      const frontY = y + gun.dy * travel;
      const trail = Math.min(travel, unit * .095);
      ctx.save();
      ctx.lineCap = 'round';
      ctx.shadowBlur = unit * .024;
      ctx.shadowColor = gun.color;
      ctx.strokeStyle = gun.color;
      ctx.lineWidth = unit * .012;
      ctx.beginPath();
      ctx.moveTo(frontX - gun.dx * trail, frontY - gun.dy * trail);
      ctx.lineTo(frontX, frontY);
      ctx.stroke();
      ctx.fillStyle = '#fff3ce';
      ctx.beginPath();
      ctx.arc(age < .045 ? x : frontX, age < .045 ? y : frontY, unit * (age < .045 ? .017 : .005), 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  function boss(reveal, time, unlocked, firing = false) {
    if (!reveal) return;
    const titleY = height * .624;
    const shipWidth = Math.min(width * .87, height * .93) * (.75 + .25 * reveal + Math.min(Math.max(0, time - timeline.duration), 3) * .009);
    const centerY = height * (.358 + reveal * .055);
    ship(centerY, shipWidth, reveal, unlocked);
    if (unlocked && firing && assets.ship && assets.muzzles) {
      const shipHeight = shipWidth * assets.ship.height / assets.ship.width;
      fire((width - shipWidth) / 2, centerY - shipHeight / 2, shipWidth, shipHeight, time);
    }
    ctx.save();
    ctx.globalAlpha = reveal;
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#edbd72';
    ctx.font = `700 ${unit * .029}px ${typeface}`;
    tracked(ctx, `BOSS ${String(presentation.boss.id).padStart(2, '0')}`, width / 2, titleY - unit * .099, unit * .0095);
    ctx.font = `900 ${unit * .141}px ${typeface}`;
    ctx.fillStyle = '#fff1d3';
    ctx.shadowColor = 'rgba(0, 0, 0, .8)';
    ctx.shadowBlur = unit * .023;
    tracked(ctx, presentation.boss.name.toUpperCase(), width / 2, titleY, unit * .0073);
    ctx.shadowBlur = 0;
    ctx.font = `600 ${unit * .0245}px ${typeface}`;
    ctx.fillStyle = '#a9bac8';
    tracked(ctx, presentation.boss.subtitle.toUpperCase(), width / 2, titleY + unit * .105, unit * .0053);
    ctx.restore();
  }

  function draw(time, reducedMotion = false, unlocked = false) {
    if (!backdrop) return;
    ctx.drawImage(backdrop, 0, 0);
    if (!reducedMotion) {
      ctx.save();
      clipOutsideVortex();
      drawVortexDust(ctx, vortex, time);
      ctx.restore();
    }
    const reveal = smooth(time, revealTime, revealTime + 2.35);
    const distantShip = (contactTime === undefined ? 0 : smooth(time, contactTime, contactTime + 3.4)) * (1 - reveal);
    if (distantShip > 0) ship(height * .293, Math.min(width * .53, height * .53), distantShip * .21, false);
    if (time < firstWord + 3.3) openingTitle(time);
    if (reveal < 1) crawl(time, reveal, reducedMotion);
    if (presentation.boss && contactTime !== undefined) boss(reveal, time, unlocked, !reducedMotion);
  }

  return { resize, draw, dispose: () => { if (backdrop) backdrop.width = backdrop.height = 0; backdrop = undefined; } };
}
