const turn = 2 * Math.PI;
const looks = [
  { haze: '#d64c29', gas: '#ffab63', light: '#fff3cc', tilt: -.31, direction: 1 },
  { haze: '#2760ce', gas: '#71c9ff', light: '#e1fbff', tilt: .22, direction: -1 },
  { haze: '#861ba4', gas: '#df8bef', light: '#ffeaff', tilt: -.02, direction: 1 },
];

function randomSequence(seed) {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function arc(ctx, radius, stretch, start, end, weight, color, alpha) {
  ctx.globalAlpha = alpha;
  ctx.lineWidth = weight;
  ctx.strokeStyle = color;
  ctx.beginPath();
  ctx.ellipse(0, 0, radius * stretch, radius, 0, start, end);
  ctx.stroke();
}

function glow(ctx, x, y, rx, ry, color, alpha) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(rx, ry);
  const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
  gradient.addColorStop(0, color);
  gradient.addColorStop(.45, `${color}55`);
  gradient.addColorStop(1, `${color}00`);
  ctx.globalAlpha = alpha;
  ctx.fillStyle = gradient;
  ctx.fillRect(-1, -1, 2, 2);
  ctx.restore();
}

function diskFilaments(ctx, random, look, aspect, near) {
  for (let i = 0; i < 430; i++) {
    const orbit = 1.22 + random() ** .83 * 1.98;
    const angle = random() * Math.PI + (near ? 0 : Math.PI);
    const length = .04 + random() ** 2.4 * 1.05;
    const heat = (3.28 - orbit) / 2.1;
    const phase = random() * turn;
    const lit = Math.max(0, .57 - .38 * Math.cos(angle) + .19 * Math.sin(angle * 6 + phase));
    ctx.globalAlpha = (.045 + random() * .33) * heat * lit;
    ctx.strokeStyle = random() < heat * .25 ? look.light : look.gas;
    ctx.lineWidth = .003 + random() ** 2 * .016;
    ctx.beginPath();
    for (let step = 0; step <= 10; step++) {
      const a = angle + length * step / 10 * look.direction;
      const ripple = Math.sin(a * 7 + phase) * .022 + Math.sin(a * 15 + phase) * .008;
      const r = orbit + ripple - step * .004;
      const sine = Math.sin(a);
      const x = r * Math.cos(a);
      const y = r * aspect * sine + .28 * Math.max(0, sine) ** 3;
      if (step === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
}

export function paintVortex(ctx, width, height, unit, variant, seed) {
  const random = randomSequence(seed);
  const look = looks[variant % looks.length];
  const x = width / 2;
  const y = height * .185;
  const radius = Math.min(unit * (.126 + random() * .013), height * .105);
  const tilt = look.tilt + (random() - .5) * .12;
  const aspect = .24 + random() * .07;
  const curl = 2.25 + random() * .37;

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(tilt);
  ctx.scale(radius, radius);
  ctx.lineCap = 'round';
  glow(ctx, 0, 0, 3.8, 2.7, '#05040b', .88);
  glow(ctx, -.25, -.12, 3.3, 2.2, look.haze, .37);
  glow(ctx, -.32, .13, 3.6, .87, look.haze, .82);
  glow(ctx, -.17, .36, 2.46, .73, look.gas, .28);
  diskFilaments(ctx, random, look, aspect, false);

  // The far side of the disk appears again above the shadow due to lensing.
  const rim = ctx.createLinearGradient(-1.38, -.55, 1.2, -.37);
  rim.addColorStop(0, look.haze);
  rim.addColorStop(.34, look.light);
  rim.addColorStop(.69, look.gas);
  rim.addColorStop(1, look.haze);
  arc(ctx, 1.15, 1.02, -Math.PI, -.02, .34, look.haze, .22);
  arc(ctx, 1.10, 1.01, -Math.PI + .02, -.06, .135, look.gas, .30);
  for (let i = 0; i < 210; i++) {
    const r = 1.017 + random() ** 2 * .50;
    const angle = -Math.PI + random() * Math.PI;
    const width = .002 + random() * .018;
    const light = (1.52 - r) * (.75 + random() * .37);
    arc(ctx, r, 1 + random() * .12, angle, Math.min(.05, angle + .06 + random() ** 2 * .59), width, rim, light);
  }
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#020106';
  ctx.beginPath();
  ctx.arc(0, 0, 1, 0, turn);
  ctx.fill();
  arc(ctx, 1.012, 1, -Math.PI + .05, .52, .042, look.gas, .45);
  arc(ctx, 1.023, 1, -2.98, -.13, .017, rim, .92);
  arc(ctx, 1.058, 1.01, -2.61, -.86, .012, look.light, .53);

  diskFilaments(ctx, random, look, aspect, true);
  glow(ctx, -1.23, .41, .82, .25, look.light, .27);
  glow(ctx, 1.26, .37, .68, .22, look.gas, .29);
  ctx.restore();

  const motes = Array.from({ length: 23 }, () => ({
    phase: random(),
    angle: random() * turn,
    travel: .9 + random() * 1.5,
    rate: .14 + random() * .16,
    brightness: .24 + random() * .58,
  }));
  return { x, y, radius, look, tilt, curl, motes };
}

export function vortexPosition(vortex, y, pull) {
  const bearing = vortex.look.direction * vortex.curl * pull ** 1.55;
  const distance = (y - vortex.y) * (1 - pull) ** 1.25 + vortex.radius * .76 * pull;
  return {
    x: vortex.x - Math.sin(bearing) * distance,
    y: vortex.y + Math.cos(bearing) * distance,
    rotation: bearing * .96,
  };
}

export function drawIntake(ctx, vortex, y, pull, opacity) {
  if (pull < .41) return;
  const energy = Math.min(1, (pull - .41) * 4) * opacity;
  ctx.save();
  ctx.lineCap = 'round';
  ctx.strokeStyle = vortex.look.light;
  for (let lane = 0; lane < 3; lane++) {
    ctx.lineWidth = vortex.radius * (.009 + lane * .006);
    ctx.globalAlpha = energy * (.37 + lane * .18);
    ctx.beginPath();
    for (let step = 0; step < 8; step++) {
      const lead = .02 + step * (.022 + lane * .004);
      const point = vortexPosition(vortex, y - vortex.radius * (.4 + lane * .13), Math.min(1, pull + lead));
      if (step === 0) ctx.moveTo(point.x, point.y);
      else ctx.lineTo(point.x, point.y);
    }
    ctx.stroke();
  }
  ctx.restore();
}

export function drawVortexDust(ctx, vortex, time) {
  const { x, y, radius, tilt, look, motes } = vortex;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(tilt);
  ctx.scale(radius, radius);
  ctx.lineCap = 'round';
  ctx.strokeStyle = look.gas;
  ctx.fillStyle = look.light;
  for (const mote of motes) {
    const progress = (time * mote.rate + mote.phase) % 1;
    const alpha = Math.sin(progress * Math.PI) * mote.brightness;
    ctx.lineWidth = .008 + mote.brightness * .009;
    ctx.globalAlpha = alpha * .65;
    ctx.beginPath();
    let px = 0, py = 0;
    for (let step = 0; step < 5; step++) {
      const age = progress - (4 - step) * .018;
      const distance = 1.02 + mote.travel * (1 - age) ** 1.45;
      const angle = mote.angle + look.direction * (1.5 * age + 3.9 * age ** 2);
      px = Math.cos(angle) * distance * 1.15;
      py = Math.sin(angle) * distance * (.55 + .43 * age);
      if (step === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.arc(px, py, .013 + mote.brightness * .012, 0, turn);
    ctx.fill();
  }
  ctx.restore();
}
