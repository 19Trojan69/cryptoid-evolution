// Native browser lifecycle check for the frozen pacing code; no game load.
const { readFileSync, writeFileSync, mkdirSync } = require('node:fs');
const { resolve } = require('node:path');
const { createHash } = require('node:crypto');
const { stripTypeScriptTypes } = require('node:module');
const root = resolve(__dirname, '../..');
const runtimeModules = process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES;
const { chromium, webkit } = require(require.resolve('playwright', { paths: [runtimeModules || root] }));
const sources = ['frontend/src/lib/nativeFrameEasing.ts', 'frontend/src/lib/cssFramePacing.ts'];
const expected = ['cb0b45871da02de5bf0bb02800dda10fb8193488', '5d9cc3e5b40792277d9813b2953196affbc0eaf3'];
const files = sources.map(path => {
  const source = readFileSync(resolve(root, path), 'utf8');
  const bytes = Buffer.from(source);
  const gitBlob = createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex');
  return { path, gitBlob, source };
});
if (files.some((file, index) => file.gitBlob !== expected[index])) throw Error('Frozen pacing source mismatch');
const bundle = '(() => {\n' + files.map(file => stripTypeScriptTypes(file.source
  .replace(/^import[^\n]+;\r?\n/gm, '').replace(/^export /gm, ''))).join('\n') +
  '\nwindow.__pacingProbe = { start: startCssFramePacing, pace: paceAnimation, stats: cssFramePacingStats };\n})()';
const result = { version: 1, base: 'b092f6462a623c3ad2c12e634963028d462c5fcf',
  hypothesis: 'Removed CSS and Web Animations remain strongly held by pacing Map',
  actualGameLoaded: false, physicalDeviceTest: false, nativeProcessMemoryMeasured: false,
  whiteScreenFixed: false, sources: files.map(({ path, gitBlob }) => ({ path, gitBlob })), engines: [] };

async function check(name, type) {
  let browser;
  const record = { name, complete: false };
  result.engines.push(record);
  try {
    browser = await type.launch({ headless: true, timeout: 20000 });
    record.version = browser.version();
    const page = await browser.newPage();
    await page.setContent('<!doctype html><style>@keyframes drift{from{transform:translateX(0)}to{transform:translateX(4px)}}.sample{width:10px;height:10px;background:blue}.css{animation:drift 1s linear infinite}.pseudo::before,.pseudo::after{content:"";display:block;width:2px;height:2px;animation:drift 1s ease-in-out infinite}.finite{animation:drift 40ms linear both}.transition{opacity:1;transition:opacity 1s linear}</style>');
    await page.addScriptTag({ content: bundle });
    record.cases = await page.evaluate(async () => {
      const p = window.__pacingProbe;
      const stop = p.start(document.body);
      const tick = () => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
      const cases = [];
      for (const kind of ['css', 'pseudo', 'paused-css', 'finite', 'transition', 'waapi', 'paused-waapi']) {
        const entry = { kind, cycles: 12, maximumRegistered: 0, registrations: 0, afterRemoval: [], qualified: true };
        for (let i = 0; i < entry.cycles; i++) {
          const configuredBefore = p.stats().configured;
          const node = document.createElement('div');
          node.className = 'sample ' + (kind === 'paused-css' ? 'css' : kind);
          document.body.appendChild(node);
          if (kind.includes('waapi')) p.pace(node.animate([{ opacity: 0.8 }, { opacity: 1 }], { duration: 1000, iterations: Infinity }));
          await tick();
          if (kind === 'transition') { node.style.opacity = '0.2'; await tick(); }
          const active = p.stats().active;
          entry.registrations += p.stats().configured - configuredBefore;
          entry.maximumRegistered = Math.max(entry.maximumRegistered, active);
          if (!active && kind !== 'finite') entry.qualified = false;
          if (kind.startsWith('paused-')) for (const animation of node.getAnimations({ subtree: true })) animation.pause();
          if (kind === 'finite') await wait(65);
          node.remove();
          await tick();
          entry.afterRemoval.push(p.stats().active);
        }
        await wait(100);
        entry.settledActive = p.stats().active;
        entry.connectedAnimations = document.body.getAnimations({ subtree: true }).length;
        entry.pass = entry.qualified && entry.settledActive === 0 && entry.afterRemoval.every(value => value === 0);
        if (kind === 'finite') entry.pass = entry.pass && entry.registrations > 0;
        cases.push(entry);
      }
      const beforeStop = p.stats(); stop();
      return { cases, beforeStop, afterStop: p.stats(), remainingNodes: document.body.children.length };
    });
    record.complete = record.cases.cases.every(test => test.pass) && record.cases.afterStop.active === 0;
  } catch (error) { record.error = { kind: error.name, detail: error.message.slice(0, 1500) }; }
  finally { if (browser) await browser.close(); }
}
(async () => {
  await check('chromium', chromium);
  await check('webkit', webkit);
  result.complete = result.engines.length === 2 && result.engines.every(engine => engine.complete);
  result.finishedAt = new Date().toISOString();
  const out = resolve(__dirname, 'results'); mkdirSync(out, { recursive: true });
  writeFileSync(resolve(out, 'animation-retention.json'), JSON.stringify(result, null, 2) + '\n');
  console.log(JSON.stringify(result));
  process.exitCode = result.complete ? 0 : 1;
})();
