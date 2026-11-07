import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { appendFileSync, createReadStream, existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { extname, resolve } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { sampleBrowserMemory } from '../boss2-forensics-20261028/processMemory.mjs';
import { completionHoldMs, contentProcessStart, initLevelTrace, processSampleMs, summarizeLevelTransition } from './levelTransition.mjs';

const order = process.argv[2];
assert.ok(['keep-first', 'release-first', 'level-transition'].includes(order));
const levelTransition = order === 'level-transition';
const modes = order === 'keep-first' ? ['keep', 'release'] : ['release', 'keep'];
const repetitions = Number(process.argv[3] ?? 4);
assert.ok(Number.isInteger(repetitions) && repetitions >= 1 && repetitions <= 8);
const { webkit } = createRequire(new URL('../transition-motion-20261106/package.json', import.meta.url))('playwright');
const output = new URL('results/', import.meta.url).pathname;
mkdirSync(output, { recursive: true });
const site = new URL('../memory-monitor-lab-20261106/site/', import.meta.url).pathname;
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
  '.webp': 'image/webp', '.png': 'image/png', '.svg': 'image/svg+xml', '.mp3': 'audio/mpeg', '.wav': 'audio/wav' };
const server = createServer((req, res) => {
  let file = resolve(site, '.' + decodeURIComponent(new URL(req.url, 'http://localhost').pathname));
  if (!file.startsWith(site) && file + '/' !== site) return res.writeHead(403).end();
  if (!existsSync(file) || statSync(file).isDirectory()) file = resolve(site, 'index.html');
  res.setHeader('Content-Type', mime[extname(file)] || 'application/octet-stream');
  createReadStream(file).pipe(res);
});
await new Promise((resolve, reject) => {
  server.once('error', reject);
  server.listen(0, '127.0.0.1', resolve);
});
const origin = 'http://127.0.0.1:' + server.address().port;
const bossKinds = ['lab-boss2-last-turret-destroyed', 'lab-boss2-reactor-committed', 'lab-boss2-first-reactor-hit',
  'reactor-first-shot-created', 'reactor-first-shot-audio-returned', 'reactor-first-shot-scene-committed',
  'lab-boss2-first-escort-spawned', 'lab-boss2-second-escort-spawned'];
const secondEscort = bossKinds.at(-1);
const bins = [[0, 5000], [5000, 10000], [10000, 15000], [15000, 20000]];

function memory() {
  const observed = sampleBrowserMemory();
  const content = observed.processes.filter(process => process.role === 'webkit-content');
  assert.equal(content.length, 1, 'Expected one observable Linux WebKit content process');
  assert.ok(content[0].pssKiB > 0 && observed.summedPssKiB > 0, 'Missing process PSS cannot become zero');
  return { contentPid: content[0].pid, contentPssKiB: content[0].pssKiB, contentRssKiB: content[0].rssKiB, browserPssKiB: observed.summedPssKiB,
    processes: observed.processes, unclassified: observed.unclassifiedDescendants };
}

function summarize(rows) {
  const stats = key => ({ minKiB: Math.min(...rows.map(row => row[key])), maxKiB: Math.max(...rows.map(row => row[key])),
    meanKiB: rows.reduce((sum, row) => sum + row[key], 0) / rows.length });
  return { count: rows.length, content: stats('contentPssKiB'), browser: stats('browserPssKiB') };
}

async function play(mode, label = `${order}-${mode}`) {
  const browser = await webkit.launch({ headless: true });
  const run = { mode, engine: browser.version(), complete: false, events: [], stageMilestones: [], phases: [],
    measurements: 0, viewport: [430, 825], dpr: 3, physicalPhone: false, regularSectorsSkipped: true };
  const sampleFile = resolve(output, `${label}.jsonl`);
  const trace = { marks: [], processSamples: [], appSamples: [] };
  const phaseRows = new Map();
  writeFileSync(sampleFile, '');
  const record = row => {
    appendFileSync(sampleFile, JSON.stringify(row) + '\n');
    run.measurements++;
    const key = row.state ? `${row.state.stage}/${row.state.encounter}` : row.phase;
    if (!phaseRows.has(key)) phaseRows.set(key, []);
    phaseRows.get(key).push(row);
  };
  let fatal = null, page, processTimer;
  try {
    const context = await browser.newContext({ viewport: { width: 430, height: 825 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
    // Use the same bundled font fallbacks in both arms and prevent external traffic.
    await context.route('**/*', route => new URL(route.request().url()).origin === origin ? route.continue() : route.abort());
    page = await context.newPage();
    page.setDefaultTimeout(45000);
    page.on('pageerror', error => { fatal ??= `${error.name}: ${error.message}`; });
    page.on('crash', () => { fatal ??= 'renderer-crash'; });
    await page.addInitScript(atlasMode => { window.__cryptoidAtlasMode = atlasMode; }, mode);
    if (levelTransition) await page.addInitScript(initLevelTrace);
    await page.goto(origin, { waitUntil: 'domcontentloaded' });
    const { bootId, timeOrigin } = await page.evaluate(() => ({ bootId: window.__cryptoidBootId, timeOrigin: performance.timeOrigin }));
    assert.ok(bootId);
    await page.getByLabel('Startpunkt', { exact: true }).selectOption('normal');
    await page.getByLabel('Testschutz gegen Lebensverlust', { exact: true }).check();
    const initialMemory = memory();
    const identity = { bootId, timeOrigin, contentPid: initialMemory.contentPid, contentStart: contentProcessStart(initialMemory.contentPid) };
    const checkedMemory = () => {
      const observed = memory();
      const contentStart = contentProcessStart(observed.contentPid);
      assert.equal(observed.contentPid, identity.contentPid, 'Content process changed during the game');
      assert.equal(contentStart, identity.contentStart, 'Content process start tick changed during the game');
      return { ...observed, contentStart };
    };
    const sampleTransitionMemory = () => {
      try {
        const from = Date.now();
        const { contentPid, contentStart, contentPssKiB, contentRssKiB } = checkedMemory();
        assert.ok(contentRssKiB > 0, 'Missing content process RSS');
        trace.processSamples.push({ from, to: Date.now(), contentPid, contentStart, contentPssKiB, contentRssKiB });
      } catch (error) { fatal ??= String(error); }
    };
    record({ phase: 'menu-before-preparation', at: Date.now(), ...initialMemory });
    await page.getByRole('button', { name: 'Test vorbereiten', exact: true }).click();
    const start = page.getByRole('button', { name: 'Testspiel starten', exact: true });
    await start.waitFor();
    record({ phase: 'prepared-menu', at: Date.now(), ...checkedMemory() });
    await start.click();
    await page.waitForFunction(() => window.__cryptoidPreludeRead?.().status === 'paused');
    await page.locator('.pause-resume-button').click();

    const started = Date.now(), sampledPhases = new Set(), aligned = [];
    let lastSample = 0, lastProgress = 0, pausedAt = 0, lastFrame = -1, lastFrameAt = Date.now();
    let lastPhase = '', matched = false;
    while (Date.now() - started < 4 * 60000) {
      if (fatal) throw Error(fatal);
      const row = await page.evaluate(({ boot, originTime, kinds, anchor }) => {
        if (window.__cryptoidBootId !== boot || performance.timeOrigin !== originTime || !window.__cryptoidPreludeRead) {
          throw Error('Unexpected document or controller replacement');
        }
        const state = window.__cryptoidPreludeRead();
        const steps = (window.__cryptoidReloadState?.events ?? []).filter(event => event.bootId === boot && kinds.includes(event.kind));
        const anchorMs = steps.find(event => event.kind === anchor)?.context.activeMs ?? null;
        const field = document.querySelector('.game-field');
        if (state.status === 'playing' && field) {
          const rect = field.getBoundingClientRect();
          const park = anchorMs !== null && steps.some(event => event.kind === 'lab-boss2-first-reactor-hit');
          const x = park ? .075 : Math.max(.075, Math.min(.925, state.aim.x));
          field.dispatchEvent(new PointerEvent(state.steering ? 'pointermove' : 'pointerdown', {
            pointerId: 11, pointerType: 'mouse', isPrimary: true, buttons: 1, bubbles: true, cancelable: true,
            clientX: rect.left + x * rect.width, clientY: rect.top + state.aim.y * rect.height,
          }));
        }
        const trace = window.__cryptoidLevelTrace;
        const cleanupAt = trace?.marks.find(mark => mark.name === 'cleanup-after')?.at;
        const clickAt = trace?.marks.find(mark => mark.name === 'continue-click')?.at;
        const sample = trace && (state.encounter === 'bonus' || state.stage === 20) && (!clickAt || Date.now() - clickAt < 4000)
          ? trace.read() : null;
        return { state, steps, anchorMs, cleanupAt, sample, atlas: window.__cryptoidAtlasProbe?.read() ?? null,
          active: window.__cryptoidLabRun?.state === 'running',
          card: !!document.querySelector('.card-reveal-dialog'), completion: !!document.querySelector('.level-completion') };
      }, { boot: bootId, originTime: timeOrigin, kinds: bossKinds, anchor: secondEscort });
      const state = row.state;
      assert.ok(row.active && !['game-over', 'destroying', 'victory'].includes(state.status), 'Unexpected end of the running test');
      if (row.sample) {
        trace.appSamples.push(row.sample);
        if (!processTimer) {
          sampleTransitionMemory();
          processTimer = setInterval(sampleTransitionMemory, processSampleMs);
        }
      } else if (processTimer) {
        clearInterval(processTimer);
        processTimer = null;
      }
      if (!run.stageMilestones.includes(state.stage)) run.stageMilestones.push(state.stage);
      run.events = row.steps;
      run.atlas = row.atlas;
      if (state.stage === 20 && state.bossId === 2 && state.liveTurrets === 1 && state.bossHealth === state.bossMaxHealth) matched = true;
      const key = `${state.stage}/${state.encounter}/${state.phase}`;
      if (key !== lastPhase) { run.phases.push({ key, activeMs: state.activeMs }); lastPhase = key; }
      if (state.status === 'playing') {
        if (state.frames !== lastFrame) lastFrameAt = Date.now();
        lastFrame = state.frames;
        assert.ok(Date.now() - lastFrameAt < 5500, 'Renderer stopped advancing the active frame counter');
        pausedAt = 0;
      } else {
        lastFrameAt = Date.now();
        pausedAt ||= Date.now();
        assert.ok(Date.now() - pausedAt < 15000, 'Unexpected or unresolved pause');
        const button = row.card ? page.locator('.card-reveal-dialog .collection-footer button').last()
          : row.completion && (!levelTransition || Date.now() - row.cleanupAt >= completionHoldMs)
            ? page.locator('.level-completion .button-primary') : null;
        if (button && await button.isVisible() && await button.isEnabled()) await button.click({ timeout: 5000 });
      }
      const offset = row.anchorMs === null ? null : state.activeMs - row.anchorMs;
      if (Date.now() - lastSample >= 1100 || !sampledPhases.has(key)) {
        const app = row.sample?.app ?? await page.evaluate(() => window.__cryptoidLabRead());
        const data = { at: Date.now(), phase: key, state, app, atlas: row.atlas, offsetMs: offset, ...checkedMemory() };
        record(data);
        lastSample = Date.now();
        sampledPhases.add(key);
        if (offset !== null && offset < 20000 && state.encounter === 'boss-fight' && state.status === 'playing') aligned.push(data);
      }
      if (Date.now() - lastProgress >= 30000) {
        lastProgress = Date.now();
        console.log('PRELUDE_PROGRESS ' + JSON.stringify({ order, label, mode, stage: state.stage, phase: state.encounter, activeMs: Math.round(state.activeMs) }));
      }
      if (offset !== null && offset >= 20000) {
        assert.equal(state.encounter, 'boss-fight');
        run.finishActiveMs = Math.round(state.activeMs);
        break;
      }
      await delay(240);
    }
    assert.ok(run.finishActiveMs, 'Time budget expired before the matched Boss 2 window');
    assert.ok(matched, 'Both arms must observe the same one-turret Boss 2 start');
    assert.ok(bossKinds.every(kind => run.events.some(event => event.kind === kind)), 'Boss 2 event sequence incomplete');
    assert.deepEqual(run.stageMilestones, [10, 20]);
    assert.ok(['boss-fight', 'boss-clear', 'bonus'].every(encounter => phaseRows.has(`10/${encounter}`)), 'The real Boss 1 and bonus phases must be observed');
    const keepsBoss1 = mode === 'keep';
    assert.deepEqual(run.atlas?.cleanup, { before: true, after: keepsBoss1, pending: false });
    run.bins = bins.map(([from, to]) => {
      const rows = aligned.filter(row => row.offsetMs >= from && row.offsetMs < to);
      assert.ok(rows.length >= 2, `Insufficient samples in active window ${from}–${to}`);
      assert.ok(rows.every(row => row.atlas?.hasBoss1 === keepsBoss1 && row.atlas.hasBoss2 && !row.atlas.pendingBoss2),
        'Wrong weapon atlas cache state during the aligned Boss 2 window');
      return { from, to, ...summarize(rows), weapons: [...new Set(rows.map(row => row.state.weapon))],
        reactorHealth: [rows[0].state.bossHealth, rows.at(-1).state.bossHealth] };
    });
    if (levelTransition) {
      trace.marks = await page.evaluate(() => window.__cryptoidLevelTrace.marks);
      run.levelTransition = summarizeLevelTransition(trace, identity);
    }
    run.complete = true;
  } catch (error) {
    run.failure = String(error);
    if (page && !page.isClosed()) run.lastView = await page.locator('body').innerText({ timeout: 3000 }).then(text => text.slice(0, 1500)).catch(() => null);
  } finally {
    clearInterval(processTimer);
    if (levelTransition) {
      if (!trace.marks.length && page && !page.isClosed()) {
        trace.marks = await page.evaluate(() => window.__cryptoidLevelTrace?.marks ?? []).catch(() => []);
      }
      writeFileSync(resolve(output, `${label}-trace.json`), JSON.stringify(trace) + '\n');
    }
    run.phaseMemory = [...phaseRows].map(([phase, rows]) => ({ phase, ...summarize(rows) }));
    writeFileSync(resolve(output, `${label}.json`), JSON.stringify(run, null, 2) + '\n');
    await browser.close();
  }
  return run;
}

try {
  if (levelTransition) {
    const build = JSON.parse(readFileSync(resolve(site, 'lab-info.json'), 'utf8'));
    assert.equal(build.baseRuntime, 'd9e0897a9396dd8f1f0a9c4a9a0536aa1fb7208d');
    assert.equal(build.gameRules, 'current-testnet-rules');
    assert.ok(build.guestOnly && !build.liveBackend && !build.actualPiAuthentication && !build.payments);
    const runs = [];
    for (let index = 1; index <= repetitions; index++) {
      const label = `${order}-${index}`;
      const run = await play('keep', label);
      runs.push(run);
      console.log('LEVEL_TRANSITION_RUN ' + JSON.stringify({ label, complete: run.complete,
        failure: run.failure, transition: run.levelTransition }));
    }
    const complete = runs.every(run => run.complete);
    writeFileSync(resolve(output, 'level-transition-summary.json'), JSON.stringify({ build, runs, complete }, null, 2) + '\n');
    if (!complete) process.exitCode = 1;
  } else {
    const runs = {};
    for (const mode of modes) runs[mode] = await play(mode);
    const pair = { order, ...runs, complete: modes.every(mode => runs[mode].complete) };
    writeFileSync(resolve(output, `${order}-pair.json`), JSON.stringify(pair, null, 2) + '\n');
    console.log('PRELUDE_PAIR ' + JSON.stringify({ order, complete: pair.complete,
      runs: modes.map(mode => ({ mode, engine: runs[mode].engine, activeMs: runs[mode].finishActiveMs,
        samples: runs[mode].measurements, stages: runs[mode].stageMilestones, atlas: runs[mode].atlas, bins: runs[mode].bins,
        phaseMemory: runs[mode].phaseMemory, failure: runs[mode].failure })) }));
    if (!pair.complete) process.exitCode = 1;
  }
} finally {
  await new Promise(resolve => server.close(resolve));
}
