import { createStopwatch, formatStopwatch, CHECKPOINT_MS } from './stopwatchState.mjs';

const SOURCE = '__CRYPTOID_STOPWATCH_SOURCE__';

// Loaded only by the protected diagnostic build. One small checkpoint per
// second, one scoped observer, and lifecycle flushes; no game RAF/input hooks.
export function mountStopwatch(host = window) {
  const doc = host.document;
  if (doc.querySelector('[data-diagnostic-stopwatch]')) return () => {};
  const store = {
    getItem: key => host.localStorage.getItem(key),
    setItem: (key, value) => host.localStorage.setItem(key, value),
  };
  const clock = createStopwatch({ source: SOURCE, storage: store,
    now: () => host.performance.now(), wallNow: () => Date.now() });
  const panel = doc.createElement('div');
  panel.className = 'diagnostic-stopwatch';
  panel.setAttribute('role', 'group');
  panel.setAttribute('data-diagnostic-stopwatch', '1');
  panel.setAttribute('aria-label', 'Test-Stoppuhr');
  const heading = doc.createElement('strong'), value = doc.createElement('span');
  const status = doc.createElement('small'), note = doc.createElement('p'), prior = doc.createElement('small');
  value.className = 'diagnostic-stopwatch-value'; value.setAttribute('data-stopwatch-value', '');
  value.setAttribute('role', 'timer'); value.setAttribute('aria-live', 'off');
  status.setAttribute('data-stopwatch-status', '');
  note.className = 'diagnostic-stopwatch-note'; prior.className = 'diagnostic-stopwatch-previous';
  panel.append(heading, value, status, note, prior);
  let shell = null, stopped = false, lastRender = '';
  const root = doc.getElementById('root');
  const observer = new host.MutationObserver(() => sample());
  const observe = next => {
    shell = next;
    observer.disconnect();
    if (root) observer.observe(root, { childList: true });
    if (shell) observer.observe(shell, { attributes: true, attributeFilter: ['data-effects-paused'] });
  };
  const render = view => {
    const inGame = !!shell, record = inGame ? view.live : view.latest;
    const mode = record?.startedAt ? record.mode : 'ready';
    const label = inGame ? 'Testzeit' : 'Letzte Testzeit';
    const text = !view.storageAvailable ? 'Lokales Speichern nicht verfügbar'
      : !record?.startedAt ? 'Startet mit „Fortsetzen“'
      : !inGame ? record.mode === 'ended' ? 'Test beendet · Zeit gespeichert' : 'Letzter gespeicherter Stand'
      : ({ running: 'Läuft', paused: 'Pausiert', hidden: 'Angehalten', stalled: 'Kein Spielfortschritt', ended: 'Beendet' })[mode];
    const detail = !inGame && record?.startedAt
      ? 'Bleibt nach dem Beenden sichtbar. Nach einem harten Abbruch wird der letzte lokal gesicherte Stand gezeigt; der genaue Abbruchzeitpunkt kann später liegen.'
      : 'Bei Pausen steht die Uhr. Die letzte Zeit wird etwa jede Sekunde lokal gesichert.';
    const previous = !inGame && view.previous ? `Voriger Lauf: ${formatStopwatch(view.previous.elapsedMs)}` : '';
    const shown = formatStopwatch(record?.elapsedMs ?? 0);
    const key = JSON.stringify([inGame, shown, text, previous, mode, view.storageAvailable]);
    if (lastRender !== key) {
      panel.dataset.location = inGame ? 'game' : 'menu';
      panel.dataset.mode = mode;
      panel.dataset.saved = String(view.storageAvailable);
      heading.textContent = label; value.textContent = shown; status.textContent = text;
      note.textContent = detail; prior.textContent = previous; prior.hidden = !previous;
      lastRender = key;
    }
    const parent = shell ?? doc.querySelector('.device-preview-menu section');
    if (parent && panel.parentElement !== parent) {
      if (inGame) parent.append(panel);
      else parent.insertBefore(panel, parent.querySelector('label'));
    }
  };
  function sample() {
    if (stopped) return;
    const current = doc.querySelector('.game-shell');
    if (current !== shell) observe(current);
    let snapshot = null;
    if (shell) {
      try {
        const state = host.__crossDeviceTest?.inspect();
        if (state) snapshot = { token: shell, status: state.status, frameAt: state.frameAt,
          visible: doc.visibilityState !== 'hidden' };
      } catch { /* A diagnostic clock cannot interrupt the game. */ }
    }
    const view = clock.observe(snapshot);
    render(view);
    host.dispatchEvent(new host.CustomEvent('cryptoid:diagnostic-clock', { detail: view }));
  }
  const pagehide = () => sample();
  const visibility = () => sample();
  observe(doc.querySelector('.game-shell'));
  sample();
  const interval = host.setInterval(sample, CHECKPOINT_MS);
  doc.addEventListener('visibilitychange', visibility);
  host.addEventListener('pagehide', pagehide);
  return () => {
    if (stopped) return;
    pagehide(); stopped = true;
    host.clearInterval(interval); observer.disconnect();
    doc.removeEventListener('visibilitychange', visibility);
    host.removeEventListener('pagehide', pagehide); panel.remove();
  };
}

if (typeof window !== 'undefined' && typeof document !== 'undefined') mountStopwatch();

