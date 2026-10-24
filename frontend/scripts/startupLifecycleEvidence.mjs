// Local browser-audit tooling only. Never imported by the application.
// Read the existing bounded diagnostic ring; do not enable owner diagnostics,
// write storage, dismiss overlays, resume playback, or alter the game clock.
import assert from 'node:assert/strict';

/** Self-contained: Playwright serializes this function into the test document. */
export function collectLifecycleState({ sinceEpochMs = null } = {}) {
  const observedAtEpochMs = Date.now();
  const documentStartedAt = performance.timeOrigin;
  const interruptionReasons = ['frame-error', 'loop-stall', 'input-error',
    'javascript-error', 'unhandled-rejection', 'render-error'];
  const key = 'cryptoid_game_diagnostics_v1';
  const strings = ['reason', 'errorName', 'phase', 'encounter', 'status',
    'at', 'sourceCommit', 'sourceTree', 'restartHint'];
  const numbers = ['sector', 'block', 'width', 'height', 'enemies', 'projectiles',
    'effects', 'frameMs', 'workMs', 'lastSavedAt', 'elapsedMs'];
  const diagnostics = { key, state: 'absent', totalEntries: 0, entries: [] };
  try {
    const raw = window.localStorage.getItem(key);
    if (raw !== null) {
      if (raw.length > 131072) diagnostics.state = 'oversized';
      else {
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) diagnostics.state = 'invalid';
        else {
          diagnostics.state = 'read';
          diagnostics.totalEntries = parsed.length;
          diagnostics.entries = parsed.slice(-20).filter(entry => entry && typeof entry === 'object' && !Array.isArray(entry)).map(entry => {
            const safe = {};
            for (const field of strings) if (typeof entry[field] === 'string') safe[field] = entry[field].slice(0, 80);
            for (const field of numbers) if (typeof entry[field] === 'number' && Number.isFinite(entry[field])) safe[field] = entry[field];
            const at = Date.parse(safe.at || '');
            safe.inObservedFlow = Number.isFinite(sinceEpochMs) && Number.isFinite(documentStartedAt)
              && Number.isFinite(at) && at >= Math.max(sinceEpochMs, documentStartedAt) && at <= observedAtEpochMs;
            return safe;
          });
        }
      }
    }
  } catch (error) {
    diagnostics.state = error?.name === 'SyntaxError' ? 'invalid' : 'unavailable';
    diagnostics.errorName = String(error?.name || 'Error').slice(0, 60);
  }
  const describe = element => {
    if (!element) return null;
    const box = element.getBoundingClientRect();
    const style = window.getComputedStyle(element);
    return { tag: element.tagName.toLowerCase(), id: element.id || '',
      className: String(element.getAttribute('class') || '').slice(0, 240),
      role: element.getAttribute('role'),
      visible: box.width > 0 && box.height > 0 && style.display !== 'none'
        && style.visibility !== 'hidden' && style.visibility !== 'collapse' && style.opacity !== '0',
      box: [box.x, box.y, box.width, box.height], pointerEvents: style.pointerEvents,
      text: String(element.textContent || '').trim().slice(0, 2000),
      disabled: element.hasAttribute('disabled') };
  };
  const pause = document.querySelector('.pause-control');
  const pauseControl = describe(pause);
  let pauseHitTarget = null;
  if (pauseControl?.visible) {
    const [x, y, width, height] = pauseControl.box;
    const hit = document.elementFromPoint(x + width / 2, y + height / 2);
    if (hit) pauseHitTarget = { tag: hit.tagName.toLowerCase(), id: hit.id || '',
      className: String(hit.getAttribute('class') || '').slice(0, 240),
      insidePauseControl: hit === pause || pause.contains(hit) };
  }
  const shell = document.querySelector('.game-shell');
  return { observedAtEpochMs, documentStartedAt, readyState: document.readyState,
    visibilityState: document.visibilityState, focused: document.hasFocus(),
    route: window.location.pathname, rootChildren: document.getElementById('root')?.childElementCount ?? 0,
    shell: shell ? { effectsPaused: shell.getAttribute('data-effects-paused') } : null,
    pauseControl, pauseHitTarget, pauseOverlay: describe(document.querySelector('.pause-settings-overlay')),
    overlays: [...document.querySelectorAll('.game-overlay')].slice(0, 8).map(describe),
    diagnostics,
    // These are recorded events, not an inferred OS cause or a guessed pause reason.
    recordedInterruptions: diagnostics.entries.filter(entry => entry.inObservedFlow && interruptionReasons.includes(entry.reason)) };
}

async function bounded(operation, timeoutMs) {
  let timer;
  try {
    return await Promise.race([operation, new Promise((_, reject) => {
      timer = setTimeout(() => { const error = new Error('Lifecycle evidence timed out'); error.name = 'EvidenceTimeout'; reject(error); }, timeoutMs);
    })]);
  } finally { clearTimeout(timer); }
}

export async function captureLifecycleState(page, row, label, { timeoutMs = 3000 } = {}) {
  row.lifecycleSamples ??= [];
  let sample;
  try {
    const state = await bounded(page.evaluate(collectLifecycleState, { sinceEpochMs: row.lifecycleStartedAt ?? null }), timeoutMs);
    sample = { label, captured: true, ...state };
  } catch (error) {
    sample = { label, captured: false, errorName: String(error?.name || 'Error').slice(0, 60) };
  }
  // A short route has fewer than 16 samples. Never grow an unbounded audit ring.
  row.lifecycleSamples.push(sample);
  if (row.lifecycleSamples.length > 24) row.lifecycleSamples.splice(0, row.lifecycleSamples.length - 24);
  return sample;
}

export function assertLifecycleState(sample, expected, documentStartedAt) {
  assert.equal(sample.captured, true, 'Lifecycle state could not be captured');
  if (documentStartedAt !== undefined) assert.equal(sample.documentStartedAt, documentStartedAt, 'Unexpected document replacement');
  assert.equal(sample.recordedInterruptions.length, 0, 'A game interruption was recorded during this route flow');
  if (expected === 'active') {
    assert.equal(sample.shell?.effectsPaused, 'false', 'Game is not active');
    assert.ok(!sample.pauseOverlay?.visible, 'Unexpected pause overlay; do not auto-resume');
  } else if (expected === 'paused') {
    assert.equal(sample.pauseOverlay?.visible, true, 'Requested pause overlay is not visible');
  } else if (expected === 'home') {
    assert.equal(sample.shell, null, 'Game shell remains on Home');
    assert.ok(sample.rootChildren > 0, 'Home is empty');
  } else throw new Error('Unknown lifecycle expectation');
}

/** Called before context.close; a failure of either capture must not hide the original failure. */
export async function captureLifecycleFailure(page, row, error, { screenshotPath,
  timeoutMs = 3000, screenshotTimeoutMs = 5000 } = {}) {
  row.passed = false;
  row.failure = { stage: row.lifecycleStage || 'startup', name: String(error?.name || 'Error').slice(0, 60),
    message: String(error?.message || error).slice(0, 3000) };
  await captureLifecycleState(page, row, 'failure:' + row.failure.stage, { timeoutMs });
  row.failureScreenshot = { captured: false };
  if (!screenshotPath) { row.failureScreenshot.errorName = 'NoScreenshotPath'; return; }
  const screenshotStartedAtEpochMs = Date.now();
  try {
    // Native pixels, without fast-forwarding/disabling animations or hiding UI.
    await bounded(page.screenshot({ path: screenshotPath, timeout: screenshotTimeoutMs,
      animations: 'allow' }), screenshotTimeoutMs + 250);
    row.failureScreenshot = { captured: true, path: screenshotPath,
      startedAtEpochMs: screenshotStartedAtEpochMs, completedAtEpochMs: Date.now() };
  } catch (captureError) {
    row.failureScreenshot.errorName = String(captureError?.name || 'Error').slice(0, 60);
  }
}
