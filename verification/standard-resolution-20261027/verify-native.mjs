import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync, mkdirSync, unlinkSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';

const root = resolve(new URL('../..', import.meta.url).pathname), require = createRequire(root + '/frontend/package.json');
const { createServer } = require('vite'), { webkit } = require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES + '/playwright');
const baseline = '7433e560c2fd8575a501997d290157f3e3b2005f';
const output = root + '/verification/standard-resolution-20261027/results';
mkdirSync(output, { recursive: true });
const report = { baseline, referenceDensity: 1, previousDensity: 1.5, localOnly: true, physicalDevice: false,
  temperatureMeasured: false, checks: [], samples: [], errors: [] };
const check = (name, value) => { assert.ok(value, name); report.checks.push(name); };
const sources = { impact: 'CanvasEffects.tsx', rock: 'BonusRockLayer.tsx', boss: 'BossWeaponsView.tsx' };
const sourceAt = file => execFileSync('git', ['show', `${baseline}:frontend/src/pages/${file}`], { cwd: root, encoding: 'utf8' });
let server, browser;
try {
  server = await createServer({ root: root + '/frontend', cacheDir: output + '/vite-native', logLevel: 'error',
    optimizeDeps: { noDiscovery: true, include: ['react', 'react-dom/client'] },
    server: { host: '127.0.0.1', port: 0, hmr: false, fs: { allow: [root] } },
    plugins: [{ name: 'exact-source-standard-density-controls', enforce: 'pre',
      resolveId(id) {
        const match = /^standard-(impact|rock|boss)-(reference|previous)$/.exec(id);
        if (match) return root + `/frontend/src/pages/Standard_${match[1]}_${match[2]}.tsx`;
      },
      load(id) {
        const match = /Standard_(impact|rock|boss)_(reference|previous)\.tsx$/.exec(id);
        if (!match) return;
        const scale = match[2] === 'reference' ? 1 : 1.5;
        const original = sourceAt(sources[match[1]]);
        const source = match[1] === 'rock'
          ? original.replace('Math.min(1.5,window.devicePixelRatio||1)', `Math.min(${scale},window.devicePixelRatio||1)`)
          : original.replace(/import \{\s*gameRenderScale\s*\} from ['"]\.\/renderResolution['"];?/,
            `const gameRenderScale=(ratio=1)=>Number.isFinite(ratio)&&ratio>0?Math.min(${scale},ratio):1;`);
        if (match[1] !== 'rock' || scale !== 1.5) assert.notEqual(source, original);
        return source;
      },
    }] });
  writeFileSync(root + '/frontend/standard-resolution-local.html', '<!doctype html><html><head><style>html,body{margin:0;background:#07182b}.sector-boss{transform:none}.boss-weapons-canvas{position:absolute;left:-22%;top:-70%;width:144%;height:240%;pointer-events:none}</style></head><body><div id="root"></div><script type="module" src="/@fs/' + root + '/verification/standard-resolution-20261027/preview.tsx"></script></body></html>');
  await server.listen();
  const origin = 'http://127.0.0.1:' + server.httpServer.address().port;
  const base = root + '/verification/native-browsers/webkit-2336/minibrowser-wpe';
  const libs = process.env.CRYPTOID_WEBKIT_LIBS || root + '/verification/effect-path-reuse-20261027/local-libraries/extracted/usr/lib/x86_64-linux-gnu';
  browser = await webkit.launch({ headless: true, executablePath: base + '/bin/MiniBrowser', env: { ...process.env,
    WEBKIT_EXEC_PATH: base + '/bin', WEBKIT_INJECTED_BUNDLE_PATH: base + '/lib', WEBKIT_INSPECTOR_RESOURCES_PATH: base + '/share',
    LD_LIBRARY_PATH: `${base}/lib:${base}/sys/lib:${libs}`, GST_PLUGIN_SYSTEM_PATH_1_0: libs + '/gstreamer-1.0',
    GST_PLUGIN_SCANNER: libs + '/gstreamer1.0/gstreamer-1.0/gst-plugin-scanner', GST_REGISTRY_1_0: output + '/registry.bin' } });
  report.engine = browser.version();
  let exactPairs = 0;
  for (const [width, height, ratio, stage] of [[393, 744, 3, 10], [393, 628, 2.625, 500], [768, 1024, 2, 250], [430, 825, 1, 70]]) {
    const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: ratio });
    const page = await context.newPage();
    page.on('pageerror', error => report.errors.push(error.message));
    await page.route('**/*', route => new URL(route.request().url()).origin === origin ? route.continue() : route.fulfill({ status: 200, body: '' }));
    await page.clock.install();
    await page.goto(origin + '/standard-resolution-local.html');
    await page.waitForFunction(() => !!window.__standard);
    console.log(JSON.stringify({ width, height, ratio, step: 'fixture ready' }));
    // Let the real existing preparation queue settle before freezing its timers.
    await page.evaluate(value => window.__standard.prepare(value), { width, height, stage });
    console.log(JSON.stringify({ width, height, ratio, step: 'original resources prepared' }));
    // Freeze before React mounts so all three original startedAt values match.
    await page.clock.pauseAt(await page.evaluate(() => Date.now() + 100));
    await page.evaluate(() => window.__standard.mount());
    await page.clock.runFor(16);
    await page.waitForFunction(() => window.__standard.ready(), null, { timeout: 5000 });
    console.log(JSON.stringify({ width, height, ratio, step: 'all actual components ready' }));
    await page.clock.runFor(100);
    const compare = async label => {
      const data = await page.evaluate(() => window.__standard.inspect());
      const [reference, candidate, previous] = data.rows;
      assert.equal(data.scale, 1);
      for (const key of ['normal-effects-surface', 'bonus-rock-layer', 'boss-weapons-canvas']) {
        assert.deepEqual(candidate.canvases[key].pixels, reference.canvases[key].pixels, `${label} ${key}: reference density`);
        assert.equal(candidate.canvases[key].hash, reference.canvases[key].hash, `${label} ${key}: original draw at new density`);
        assert.deepEqual(candidate.canvases[key].css, previous.canvases[key].css, `${label} ${key}: unchanged visible bounds`);
        exactPairs++;
      }
      assert.deepEqual(candidate.canvases['boss-weapons-canvas'].pixels, [Math.ceil(data.size.width), Math.ceil(data.size.height)]);
      report.samples.push({ label, ratio, stage, ...data });
      return data;
    };
    const start = await compare('first active impact');
    console.log(JSON.stringify({ width, height, ratio, step: 'first images compared' }));
    const normal = start.rows[1].canvases['normal-effects-surface'];
    check(`${width}x${height}/${ratio}: active impact has one raster pixel per CSS point`,
      normal.nonempty && normal.pixels[0] === Math.ceil(normal.css[2]) && normal.pixels[1] === Math.ceil(normal.css[3]));
    for (const age of [120, 500, 1000]) { await page.clock.runFor(age === 120 ? 20 : age === 500 ? 380 : 500); await compare('impact ' + age); }
    await page.evaluate(() => window.__standard.damage()); await compare('heated and rotated turrets');
    await page.evaluate(() => window.__standard.damage(true)); await compare('destroyed turret sockets');
    await page.evaluate(() => window.__standard.update({ paused: true })); await page.clock.runFor(50);
    const paused = await page.evaluate(() => window.__standard.inspect()); await page.clock.runFor(5000);
    const stopped = await page.evaluate(() => window.__standard.inspect());
    check(`${width}x${height}/${ratio}: pause keeps original impact pixels and draw count`,
      stopped.rows[1].resources.draws === paused.rows[1].resources.draws && stopped.rows[1].canvases['normal-effects-surface'].hash === paused.rows[1].canvases['normal-effects-surface'].hash);
    await page.evaluate(() => window.__standard.update({ paused: false })); await page.clock.runFor(100);
    const resumed = await compare('explicit resume');
    check(`${width}x${height}/${ratio}: explicit resume keeps drawing`, resumed.rows[1].resources.draws > paused.rows[1].resources.draws);
    await page.evaluate(() => window.__standard.update({ kind: 'rock' })); await page.clock.runFor(50);
    for (const age of [0, 90, 240, 500, 740]) {
      await page.evaluate(age => window.__standard.update({ age }), age); const rock = await compare('rocks and dust ' + age);
      assert.deepEqual(rock.rows[1].canvases['bonus-rock-layer'].pixels, [width, height]);
      if (ratio > 1) check(`${width}x${height}/${ratio}/${age}: smaller actual rock backing than previous default`,
        rock.rows[1].canvases['bonus-rock-layer'].pixels.reduce((a, b) => a * b) / rock.rows[2].canvases['bonus-rock-layer'].pixels.reduce((a, b) => a * b) < .445);
    }
    await page.evaluate(() => window.__standard.update({ empty: true })); await page.clock.runFor(1999);
    await page.evaluate(() => window.__standard.update({ age: 1 }));
    check(`${width}x${height}/${ratio}: empty rock surface retains existing grace`, (await page.evaluate(() => window.__standard.inspect())).rows[1].canvases['bonus-rock-layer'].pixels[0] === width);
    await page.clock.runFor(1); await page.evaluate(() => window.__standard.update({ age: 2 }));
    const idle = await page.evaluate(() => window.__standard.inspect());
    check(`${width}x${height}/${ratio}: existing idle release still reaches 1x1`, idle.rows[1].canvases['bonus-rock-layer'].pixels.every(v => v === 1));
    // Explicit prop resize, without a new frame loop or density setting.
    await page.evaluate(() => window.__standard.update({ empty: false, kind: 'rock', width: 320, height: 700, age: 90 }));
    const resized = await compare('first frame after regrowth and resize');
    check(`${width}x${height}/${ratio}: first resized rock frame uses current logical bounds`, resized.rows[1].canvases['bonus-rock-layer'].pixels[0] === 320 && resized.rows[1].canvases['bonus-rock-layer'].pixels[1] === 700);
    await page.evaluate(() => window.__standard.update({ kind: 'impact', id: 2 })); await page.waitForFunction(() => window.__standard.ready());
    await page.evaluate(() => window.__standard.lose()); await page.waitForSelector('[data-original="candidate"]');
    check(`${width}x${height}/${ratio}: context loss preserves original DOM fallback`, (await page.evaluate(() => window.__standard.inspect())).rows[1].resources.registeredEffects === 0);
    const cleanup = await page.evaluate(() => window.__standard.unmount());
    check(`${width}x${height}/${ratio}: unmount releases all actual component surfaces`, cleanup.allReleased && cleanup.stats.every(s => s.registeredEffects === 0 && s.cacheBytes === 0 && s.surfaceBytes === 0));
    await context.close();
  }
  check('no native JavaScript page errors', report.errors.length === 0);
  report.exactPixelPairs = exactPairs; report.complete = true;
} catch (error) { report.failure = { message: error.message, stack: error.stack }; throw error; }
finally {
  try { unlinkSync(root + '/frontend/standard-resolution-local.html'); } catch {}
  await browser?.close(); await server?.close();
  writeFileSync(output + '/native.json', JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({ complete: report.complete, checks: report.checks.length, exactPixelPairs: report.exactPixelPairs, failure: report.failure?.message }));
}
