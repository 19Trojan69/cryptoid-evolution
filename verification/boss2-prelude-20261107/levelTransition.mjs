import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

export const processSampleMs = 100;
export const completionHoldMs = 5200;
const windowMs = [100, 700];
export const continueDestinations = {
  block1: { stage: 11, block: 1, encounter: 'normal', bossId: null, liveTurrets: null },
  boss2: { stage: 20, block: 10, encounter: 'boss-intro', bossId: 2, liveTurrets: 1 },
};
const laterWindowsMs = [[1800, 2400], [6200, 6800]];
export const continueTraceMs = 7200;

// Executed by Playwright in the test document. Keep numbers and strings only.
export function initLevelTrace(audioMode) {
  const marks = [];
  const samples = [];
  const audioCalls = [];
  let sampleTimer = null;
  if (audioMode) {
    window.__cryptoidContinueAudio = audioMode;
    const contexts = new WeakMap();
    let nextContext = 0;
    for (const operation of ['suspend', 'resume']) {
      const original = AudioContext.prototype[operation];
      AudioContext.prototype[operation] = function (...args) {
        if (marks.at(-1)?.name === 'continue-click') {
          if (!contexts.has(this)) contexts.set(this, ++nextContext);
          audioCalls.push({ operation, context: contexts.get(this), at: Date.now(),
            state: this.state, clockMs: this.currentTime * 1000 });
        }
        return Reflect.apply(original, this, args);
      };
    }
  }
  const read = () => ({
    at: Date.now(),
    bootId: window.__cryptoidBootId,
    timeOrigin: performance.timeOrigin,
    path: location.pathname,
    app: window.__cryptoidLabRead?.(),
    atlas: window.__cryptoidAtlasProbe?.read(),
  });
  const sample = () => { samples.push(read()); };
  window.__cryptoidLevelTrace = {
    marks,
    audioCalls,
    setSampling(active) {
      if (active && sampleTimer === null) {
        sample();
        sampleTimer = window.setInterval(sample, 150);
      } else if (!active && sampleTimer !== null) {
        window.clearInterval(sampleTimer);
        sampleTimer = null;
      }
    },
    takeSamples: () => samples.splice(0),
  };
  window.__cryptoidLevelBoundary = (name, details) => { marks.push({ name, ...read(), details }); };
  window.addEventListener('click', event => {
    if (event.isTrusted && event.target instanceof Element && event.target.closest('.level-completion .button-primary')) {
      window.__cryptoidLevelBoundary('continue-click');
    }
  }, { capture: true });
}

export function contentProcessStart(pid) {
  const stat = readFileSync(`/proc/${pid}/stat`, 'utf8');
  // Field 22 is the start tick. The parenthesized executable can contain spaces.
  const tick = Number(stat.slice(stat.lastIndexOf(') ') + 2).split(' ')[19]);
  assert.ok(Number.isSafeInteger(tick) && tick > 0, 'Missing WebKit process start tick');
  return tick;
}

const resources = ['paintedEntries', 'paintedBytes', 'canvasNodes', 'domCanvasLogicalBytes', 'canvasCacheBytes',
  'canvasSurfaceBytes', 'audioBufferBytes', 'audioVoices', 'enemies'];
const median = values => {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
};

export function summarizeContinueAudio({ marks, appSamples, audioCalls }, mode) {
  const click = marks.find(mark => mark.name === 'continue-click');
  const before = appSamples.filter(row => row.at >= click.at - windowMs[1] && row.at <= click.at - windowMs[0]);
  assert.ok(before.length >= 2 && before.every(({ app }) => app.audioState === 'running' && app.audioClockMs > 0
    && app.musicState === 'running' && app.musicClockMs > 0 && app.musicPaused), 'Expected both running contexts before Continue');
  for (const clock of ['audioClockMs', 'musicClockMs']) {
    assert.ok(before.at(-1).app[clock] > before[0].app[clock], `${clock} was frozen before Continue`);
  }
  const [start, end] = laterWindowsMs.at(-1);
  const after = appSamples.filter(row => row.at >= click.at + start && row.at <= click.at + end);
  assert.ok(after.length && after.every(({ app }) => app.audioState === 'running' && app.musicState === 'running'
    && app.audioClockMs > click.app.audioClockMs + 1000 && app.musicClockMs > click.app.musicClockMs + 1000
    && !app.musicPaused), 'Effects and music must be running after Continue');
  const firstMusic = appSamples.find(row => row.at >= click.at + 1800 && row.app.musicPaused === false);
  assert.ok(firstMusic && after.at(-1).app.musicMediaMs > firstMusic.app.musicMediaMs, 'Music playback did not advance');
  assert.deepEqual(audioCalls.map(({ operation, context }) => [operation, context]),
    mode === 'restart' ? [['suspend', 1], ['resume', 1], ['suspend', 2], ['resume', 2]] : [],
    'The native audio calls must actually differ between variants');
  const recoveryDelta = after.at(-1).app.audioRecoveries - click.app.audioRecoveries;
  assert.equal(recoveryDelta, mode === 'restart' ? 1 : 0, 'Unexpected audio recovery outside the intended Continue action');
  return { mode, audioCalls, recoveryDelta, clockBeforeMs: before.at(-1).app.audioClockMs,
    clockAtClickMs: click.app.audioClockMs, clockAfterMs: after.at(-1).app.audioClockMs,
    musicClockAtClickMs: click.app.musicClockMs, musicClockAfterMs: after.at(-1).app.musicClockMs,
    musicMediaAdvanceMs: after.at(-1).app.musicMediaMs - firstMusic.app.musicMediaMs };
}

export function summarizeLevelTransition({ marks, processSamples, appSamples }, identity, target) {
  const expectedMarks = ['bonus-end', 'summary-open', 'cleanup-before', 'cleanup-after', 'continue-click', 'continue-accepted'];
  if (target) expectedMarks.push('destination-ready');
  assert.deepEqual(marks.map(mark => mark.name), expectedMarks);
  const [bonus, summary, cleanupBefore, cleanupAfter, click, accepted, ready] = marks;
  const destination = continueDestinations[target ?? 'boss2'];
  assert.equal(bonus.app.phase, 'SECTOR_CLEAR');
  assert.equal(summary.app.status, 'paused');
  assert.ok([cleanupBefore, cleanupAfter, click].every(mark => mark.app.status === 'paused'));
  assert.equal(accepted.app.status, 'playing');
  if (target) {
    assert.deepEqual(ready.details, { section: destination.stage, block: destination.block });
    assert.equal(ready.app.stage, destination.stage);
    assert.equal(ready.app.level, 2);
    assert.equal(ready.app.status, 'playing');
    assert.equal(ready.app.phase, 'SECTOR_INTRO');
    assert.equal(ready.app.encounter, destination.encounter);
    assert.equal(ready.app.bossId, destination.bossId);
    assert.equal(ready.app.liveTurrets, destination.liveTurrets);
  }
  assert.ok(bonus.at + windowMs[1] < summary.at, 'Bonus window overlaps the level summary');
  assert.ok(cleanupAfter.at + completionHoldMs <= click.at, 'Continue clicked before the sampling hold');
  assert.ok(marks.every((mark, i) => !i || marks[i - 1].at <= mark.at), 'Nonmonotonic boundary timestamps');
  assert.ok([...marks, ...appSamples].every(row =>
    row.bootId === identity.bootId && row.timeOrigin === identity.timeOrigin && row.path === '/game'
      && row.app?.rulesMode === 'current' && row.atlas?.hasBoss1),
  'Document, game rules, or retired-atlas retention changed');
  assert.ok(processSamples.every(row =>
    row.contentPid === identity.contentPid && row.contentStart === identity.contentStart),
  'WebKit content process changed');

  const readWindow = (name, from, to, accept) => {
    const native = processSamples.filter(row => row.from >= from && row.to <= to);
    const counters = appSamples.filter(row => row.at >= from && row.at <= to);
    assert.ok(native.length >= 3, `Insufficient PSS samples in ${name}: ${native.length}`);
    assert.ok(counters.length >= 1, `No app counter sample in ${name}`);
    assert.ok(counters.every(({ app }) => accept(app)), `Unexpected gameplay state in ${name}`);
    const stats = key => {
      const values = native.map(row => row[key]);
      return { median: median(values), min: Math.min(...values), max: Math.max(...values) };
    };
    return { from, to, nativeSamples: native.length, appSamples: counters.length,
      stages: [...new Set(counters.map(({ app }) => app.stage))],
      statuses: [...new Set(counters.map(({ app }) => app.status))],
      phases: [...new Set(counters.map(({ app }) => `${app.encounter}/${app.phase}`))],
      contentPssKiB: stats('contentPssKiB'),
      contentRssKiB: stats('contentRssKiB'),
      app: Object.fromEntries(resources.map(key => {
        const values = counters.map(row => row.app[key]).filter(Number.isFinite);
        return [key, values.length ? median(values) : null];
      })) };
  };
  const compare = (name, begin, end, beforeState, afterState) => {
    const before = readWindow(`${name}-before`, begin.at - windowMs[1], begin.at - windowMs[0], beforeState);
    const after = readWindow(`${name}-after`, end.at + windowMs[0], end.at + windowMs[1], afterState);
    return { before, after, deltaPssKiB: after.contentPssKiB.median - before.contentPssKiB.median,
      deltaRssKiB: after.contentRssKiB.median - before.contentRssKiB.median };
  };
  const bonusPlaying = app => app.stage === 10 && app.encounter === 'bonus' && app.status === 'playing';
  const bonusPaused = app => app.stage === 10 && app.encounter === 'bonus' && app.status === 'paused';
  const bonusEnd = compare('bonus', bonus, bonus, app => bonusPlaying(app) && app.phase !== 'SECTOR_CLEAR',
    app => bonusPlaying(app) && app.phase === 'SECTOR_CLEAR');
  const cleanup = compare('cleanup', cleanupBefore, cleanupAfter, app => bonusPlaying(app) || bonusPaused(app), bonusPaused);
  const playingDestination = app => app.stage === destination.stage && app.status === 'playing';
  const resume = compare('continue', click, click, bonusPaused,
    app => bonusPlaying(app) || (playingDestination(app) && app.encounter === destination.encounter));
  if (target) {
    resume.destinationReadyMs = ready.at - click.at;
    resume.holdMs = click.at - cleanupAfter.at;
    resume.bonus = accepted.details;
    resume.later = laterWindowsMs.map(([start, end]) => {
      const window = readWindow(`continue+${start}–${end}ms`, click.at + start, click.at + end, playingDestination);
      return { offsetMs: [start, end], ...window,
        deltaPssKiB: window.contentPssKiB.median - resume.before.contentPssKiB.median,
        deltaRssKiB: window.contentRssKiB.median - resume.before.contentRssKiB.median };
    });
  }
  return { identity, bonusEnd, cleanup, resume,
    deltaWhilePausedPssKiB: resume.before.contentPssKiB.median - cleanup.after.contentPssKiB.median,
    deltaWholeTransitionPssKiB: resume.after.contentPssKiB.median - bonusEnd.before.contentPssKiB.median };
}
