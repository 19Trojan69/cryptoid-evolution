import '../../frontend/src/index.css';
import { createBattle, stepBattle, type BattleState } from '../core/battle.ts';
import { CoreSession } from '../core/session.ts';
import { createFrameDriver } from '../core/frameDriver.ts';
import { ResourcePool } from '../core/resources.ts';
import { createBattleInput } from '../browser/input.ts';
import { prepareBattleRenderer } from '../browser/renderer.ts';
import type { Texture } from '../browser/textures.ts';

// Developer-only single-encounter fixture. It is never imported by the app and
// provides no API, account, save, purchase or payment integration.
document.body.innerHTML = `<main id="rebuild-fixture">
  <p>Interner Spielkern · Funktions- und Bildmigration noch unvollständig</p>
  <nav><button id="start-normal">Block 1 starten</button><button id="start-boss">Boss 4 starten</button>
    <button id="pause">Pause</button><button id="resume">Fortsetzen</button><button id="close">Schließen</button></nav>
  <output id="status" aria-live="polite">Bereit</output>
  <div id="field" tabindex="0" aria-label="Internes Kampffeld"><canvas id="actors"></canvas><div id="projectiles"></div></div>
  <output id="hud"></output></main>`;
const style = document.createElement('style');
style.textContent = `html,body{margin:0;min-height:100%;overflow:hidden;background:#071b2b}#rebuild-fixture{max-width:1050px;margin:auto;padding:8px 12px;color:#e9f6f5}
#rebuild-fixture>p{font-size:12px;margin:0 0 5px}#rebuild-fixture nav{display:flex;flex-wrap:wrap;gap:5px}#rebuild-fixture button{padding:5px 8px;font:12px sans-serif;background:#123747;color:#eff;border:1px solid #406575;border-radius:5px}
#status,#hud{display:block;min-height:20px;font-size:11px}#field{position:relative;margin:auto;overflow:hidden;touch-action:none;background:#041423;border:1px solid #254354;outline:none}
#actors,#projectiles{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}`;
document.head.appendChild(style);
const field = document.querySelector<HTMLDivElement>('#field')!, canvas = document.querySelector<HTMLCanvasElement>('#actors')!;
const projectileMount = document.querySelector<HTMLDivElement>('#projectiles')!, status = document.querySelector<HTMLOutputElement>('#status')!;
const hud = document.querySelector<HTMLOutputElement>('#hud')!;
const pool = new ResourcePool<Texture>({ maxBytes: 96 * 1024 * 1024, maxEntries: 64, parallel: 2 });
let sequence = 0, lifetime: AbortController | null = null;
let session: CoreSession<BattleState, { horizontal: number; vertical: number; pointer?: { x: number; y: number; touch: boolean } }> | null = null;
type PreparedRenderer = Awaited<ReturnType<typeof prepareBattleRenderer>>;
let renderer: PreparedRenderer | null = null;
let input: ReturnType<typeof createBattleInput> | null = null, driver: ReturnType<typeof createFrameDriver> | null = null;
let nextRenderFails = false, hudAt = 0, lastError: string | null = null, lastDisposed: ReturnType<PreparedRenderer['stats']> | null = null;
const events = { sound: 0, phase: 0, checkpoint: 0, hud: 0 };

function close() {
  sequence++; lifetime?.abort(); lifetime = null; driver?.dispose(); driver = null;
  input?.dispose(); input = null;
  renderer?.dispose(); if (renderer) lastDisposed = renderer.stats(); renderer = null;
  session?.dispose(); session = null; status.value = 'Geschlossen'; hud.value = '';
}
async function mount(stage: number) {
  close(); const ownSequence = sequence; lastError = null; nextRenderFails = false;
  lifetime = new AbortController(); const ownLifetime = lifetime;
  const geometry = { width: Math.min(1024, Math.max(200, window.innerWidth - 26)), height: Math.min(800, Math.max(300, window.innerHeight - 154)), hudBottom: 28, playerDiameter: 94 };
  field.style.width = `${geometry.width}px`; field.style.height = `${geometry.height}px`;
  const initial = createBattle({ stage, field: geometry });
  const ownSession = new CoreSession(`fixture-${ownSequence}`, initial, stepBattle), ticket = ownSession.loadingTicket(); session = ownSession;
  status.value = 'Originalbilder werden vorbereitet';
  try {
    const prepared = await prepareBattleRenderer(canvas, projectileMount, initial, pool, () => ownSession.pause('renderer-lost'), ownLifetime.signal);
    if (ownSequence !== sequence || ownLifetime.signal.aborted) { prepared.dispose(); return; }
    renderer = prepared; input = createBattleInput(field, geometry);
    if (!ownSession.loaded(ticket) || !ownSession.start()) { prepared.dispose(); return; }
    driver = createFrameDriver(ownSession, { now: () => performance.now(), visible: () => document.visibilityState === 'visible',
      input: () => input?.read() ?? { horizontal: 0, vertical: 0 },
      render: (state, atMs) => {
        if (nextRenderFails) { nextRenderFails = false; throw new Error('Controlled fixture renderer failure'); }
        prepared.present(state);
        if (atMs - hudAt >= 250 || !atMs) {
          hudAt = atMs; hud.value = `Level ${Math.floor((state.stage - 1) / 10) + 1} · Block ${(state.stage - 1) % 10 + 1} · Herzen ${state.hearts} · Punkte ${state.score}`;
        }
        // A single-encounter migration gate. This fixture does not pretend to
        // provide the unimplemented next-scene/bonus/save handoff.
        if (state.phase === 'clear' || state.phase === 'boss-stop') ownSession.pause('user');
        if (state.phase === 'defeat') ownSession.end();
      },
      events: batch => { for (const event of batch) events[event.type]++; },
      lifecycle: state => { status.value = state === 'paused' ? `Pausiert · ${ownSession.snapshot().pausedBy}` : state; },
      requestFrame: callback => requestAnimationFrame(callback), cancelFrame: id => cancelAnimationFrame(id),
      watch: (callback, ms) => window.setInterval(callback, ms), unwatch: id => clearInterval(id) });
    field.focus({ preventScroll: true });
  } catch (error) {
    if (ownSequence !== sequence || ownLifetime.signal.aborted) return;
    lastError = error instanceof Error ? error.name : 'Error';
    status.value = 'Vorbereitung fehlgeschlagen · Lauf bleibt geschlossen'; ownSession.dispose(); ownLifetime.abort();
  }
}
document.querySelector('#start-normal')!.addEventListener('click', () => { void mount(1); });
document.querySelector('#start-boss')!.addEventListener('click', () => { void mount(40); });
document.querySelector('#pause')!.addEventListener('click', () => driver?.pause());
document.querySelector('#resume')!.addEventListener('click', () => { driver?.resume(); field.focus({ preventScroll: true }); });
document.querySelector('#close')!.addEventListener('click', close);
document.addEventListener('visibilitychange', () => { if (document.visibilityState !== 'visible') { input?.clear(); driver?.hide(); } });
window.addEventListener('pagehide', close, { once: true });

// Test controls belong to this local fixture only, never the production bundle.
Object.assign(window, { __rebuild: { mount, close,
  failNextRender: () => { nextRenderFails = true; driver?.invalidate(); },
  read: () => ({ timeOrigin: performance.timeOrigin, route: location.pathname, sequence, lastError, events: { ...events },
    snapshot: session?.snapshot() ?? null, resources: renderer?.stats() ?? { pool: pool.stats(), closed: true }, lastDisposed,
    dom: document.querySelectorAll('*').length, canvas: { width: canvas.width, height: canvas.height } }) } });
