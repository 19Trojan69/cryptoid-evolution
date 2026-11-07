import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

export const processSampleMs = 100;
export const completionHoldMs = 5200;
const windowMs = [100, 700];

// Executed by Playwright in the test document. Keep numbers and strings only.
export function initLevelTrace() {
  const marks = [];
  const read = () => ({
    at: Date.now(),
    bootId: window.__cryptoidBootId,
    timeOrigin: performance.timeOrigin,
    path: location.pathname,
    app: window.__cryptoidLabRead?.(),
    atlas: window.__cryptoidAtlasProbe?.read(),
  });
  window.__cryptoidLevelTrace = { marks, read };
  window.__cryptoidLevelBoundary = name => { marks.push({ name, ...read() }); };
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
  'canvasSurfaceBytes', 'audioBufferBytes', 'audioVoices'];
const median = values => {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
};

export function summarizeLevelTransition({ marks, processSamples, appSamples }, identity) {
  assert.deepEqual(marks.map(mark => mark.name),
    ['bonus-end', 'summary-open', 'cleanup-before', 'cleanup-after', 'continue-click', 'continue-accepted']);
  const [bonus, summary, cleanupBefore, cleanupAfter, click, accepted] = marks;
  assert.equal(bonus.app.phase, 'SECTOR_CLEAR');
  assert.equal(summary.app.status, 'paused');
  assert.ok([cleanupBefore, cleanupAfter, click].every(mark => mark.app.status === 'paused'));
  assert.equal(accepted.app.status, 'playing');
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
  const resume = compare('continue', click, click, bonusPaused,
    app => bonusPlaying(app) || (app.stage === 20 && app.encounter === 'boss-intro' && app.status === 'playing'));
  return { identity, bonusEnd, cleanup, resume,
    deltaWhilePausedPssKiB: resume.before.contentPssKiB.median - cleanup.after.contentPssKiB.median,
    deltaWholeTransitionPssKiB: resume.after.contentPssKiB.median - bonusEnd.before.contentPssKiB.median };
}
