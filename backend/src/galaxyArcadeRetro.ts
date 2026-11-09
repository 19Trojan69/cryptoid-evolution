const arcadeThemes = {
  G01: {
    accent: "#8af6d1", sky: "#09182b", dust: "#152d44",
    planet: [77, 25, 15], shades: ["#142d40", "#1e4b58", "#2e696e", "#438b88", "#7eb9a1"],
  },
  G02: {
    accent: "#dfaafa", sky: "#170f2b", dust: "#2b1c43",
    planet: [72, 30, 18], shades: ["#2b2249", "#432d63", "#624580", "#805ba4", "#b389cb"],
  },
  G03: {
    accent: "#ffdc87", sky: "#111428", dust: "#282439",
    planet: [14, 20, 17], shades: ["#31263b", "#4f363d", "#74514a", "#9d6d53", "#c19868"],
  },
  G04: {
    accent: "#9adeff", sky: "#0e182d", dust: "#1c304a", orbit: "#667a9a",
    planet: [73, 22, 13], shades: ["#1c2943", "#2c415c", "#3c6182", "#5784a5", "#91a9c9"],
  },
  G05: {
    accent: "#9bdbff", sky: "#121335", dust: "#252455",
    planet: [78, 17, 14], shades: ["#212548", "#313968", "#405294", "#596ac1", "#8c9be0"],
  },
  G06: {
    accent: "#ffa5b6", sky: "#1b1027", dust: "#382033",
    planet: [76, 25, 17], shades: ["#362039", "#552b46", "#743b52", "#9a5864", "#c7857d"],
  },
  G07: {
    accent: "#dbf48a", sky: "#111b27", dust: "#213936",
    planet: [19, 24, 15], shades: ["#23333e", "#344940", "#4c6247", "#6d8054", "#9ba86e"],
  },
  G08: {
    accent: "#fbb3ec", sky: "#1d122f", dust: "#382341", orbit: "#885a83",
    planet: [77, 18, 15], shades: ["#382344", "#53305d", "#714276", "#92568d", "#bf83b1"],
  },
} as const;

const themeRules = Object.entries(arcadeThemes).map(([game, theme]) =>
  `#gameScreen[data-sector="${game}"] { --arcade-accent: ${theme.accent}; --arcade-border: ${theme.shades[3]}; --arcade-sky: ${theme.sky}; }`,
).join("\n");

const arcadeStyle = `<style>
  ${themeRules}
  #gameScreen[data-sector] .game-title b { font-family: var(--mono); letter-spacing: -.025em; }
  #gameScreen[data-sector] #roundId, #gameScreen[data-sector] .hud b.cyan,
  #gameScreen[data-sector] .pad-heading { color: var(--arcade-accent); }
  #gameScreen[data-sector] .hud { border-color: var(--arcade-border); box-shadow: inset 3px 0 var(--arcade-accent); }
  #gameScreen[data-sector] .stage { background: var(--arcade-sky); border-color: var(--arcade-border); }
  #gameScreen[data-sector] .pad-dot { border-color: var(--arcade-accent); }
  #gameScreen[data-sector] #timeMeter {
    background: repeating-linear-gradient(90deg, var(--arcade-accent) 0 8px, transparent 8px 10px);
  }
  #gameScreen[data-sector] #steering button { border-color: var(--arcade-border); }
</style>`;

const pixelBackdrops = `  const themes = ${JSON.stringify(arcadeThemes)};
  // The playfield stays at 192 × 256. The static scenery uses twice as large pixels.
  const backdrop = surface(world.width / 2, world.height / 2);
  const sky = backdrop.getContext('2d', { alpha: false });
  const dither = [0, .52, .72, .22];
  let paintedTheme;

  function paintBackdrop(theme) {
    if (paintedTheme === theme) return;
    paintedTheme = theme;
    const [cx, cy, radius] = theme.planet;
    const random = C.random(6974 + cx * 17 + cy);
    sky.fillStyle = theme.sky;
    sky.fillRect(0, 0, backdrop.width, backdrop.height);
    sky.fillStyle = theme.dust;
    for (let i = 0; i < 62; i++) {
      const y = Math.floor(random() * backdrop.height);
      const x = Math.floor(y * .32 + random() * 19);
      sky.fillRect(x, y, i % 9 === 0 ? 3 : 1, 1);
    }
    for (let i = 0; i < 64; i++) {
      sky.fillStyle = i % 19 === 0 ? theme.shades[4] : theme.shades[1 + i % 2];
      const x = Math.floor(random() * backdrop.width);
      const y = Math.floor(random() * backdrop.height);
      sky.fillRect(x, y, 1, 1);
    }

    function orbit(side) {
      const width = Math.round(radius * 1.6);
      sky.fillStyle = theme.orbit;
      for (let x = -width; x <= width; x++) {
        const arc = Math.sqrt(1 - (x / width) ** 2) * radius * .29;
        sky.fillRect(cx + x, cy + Math.round(side * arc - x * .19), 1, 1);
      }
    }

    if (theme.orbit) orbit(-1);
    for (let y = -radius; y <= radius; y++) {
      for (let x = -radius; x <= radius; x++) {
        const depth = 1 - (x * x + y * y) / (radius * radius);
        if (depth < 0) continue;
        const light = (-x * .62 - y * .68) / radius + Math.sqrt(depth) * .49;
        const band = (y + radius) % 6 < 2 ? .26 : 0;
        const shade = C.clamp(Math.floor(light * 3.6 + .7 + band + dither[(x & 1) + (y & 1) * 2]), 0, 4);
        sky.fillStyle = theme.shades[shade];
        sky.fillRect(cx + x, cy + y, 1, 1);
      }
    }
    if (theme.orbit) orbit(1);
  }

  graphics.background = function (context, game) {
    paintBackdrop(themes[game] || themes.G01);
    context.save();
    context.imageSmoothingEnabled = false;
    context.drawImage(backdrop, 0, 0, C.W, C.H);
    context.restore();
  };

`;

export function withArcadeRetroStyle(html: string) {
  return html
    .replace("</head>", `${arcadeStyle}</head>`)
    .replace(/  function starfield\(\) \{[\s\S]*?(?=  function pixelSprite\()/, pixelBackdrops)
    .replace("const scale = 38 / Math.max", "const scale = 32 / Math.max")
    .replace("function draw(context, session, dt, screenScale) {", "function draw(context, session, dt, screenScale, game) {")
    .replace("graphics.background(pixels);", "graphics.background(pixels, game);")
    .replace("G.background(g);g.restore();g.save();", "G.background(g, 'G0'+number);g.restore();g.save();")
    .replace("C.mode='intro';const m=C.modules[selected.id];", "C.mode='intro';$('gameScreen').dataset.sector=selected.id;const m=C.modules[selected.id];")
    .replace("C.retro.draw(ctx, C.session, dt, scale);", "C.retro.draw(ctx, C.session, dt, scale, selected?.id);");
}
