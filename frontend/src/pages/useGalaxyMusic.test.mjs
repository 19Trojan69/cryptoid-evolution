import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

const code = ts.transpileModule(readFileSync(new URL('./useGalaxyMusic.ts', import.meta.url), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;

function fixture(t, { enabled = true, autoplay = false, volume = 50, active = true } = {}) {
  const hooks = [], effects = [], players = [];
  // Node requires the options object when removing a capture listener.
  class BrowserEvents extends EventTarget {
    removeEventListener(type, listener, capture = false) {
      super.removeEventListener(type, listener, { capture });
    }
  }
  const document = new BrowserEvents(), window = new BrowserEvents();
  document.hidden = false;
  window.setTimeout = setTimeout;
  window.clearTimeout = clearTimeout;
  let cursor = 0, gesture = false, view;
  const storage = new Map([['cryptoid_home_music', enabled ? 'on' : 'off']]);
  const react = {
    useState(initial) {
      const index = cursor++;
      hooks[index] ??= { value: typeof initial === 'function' ? initial() : initial };
      return [hooks[index].value, value => { hooks[index].value = value; }];
    },
    useRef(initial) {
      const index = cursor++;
      return hooks[index] ??= { current: initial };
    },
    useCallback(callback, deps) {
      const index = cursor++, previous = hooks[index];
      if (!previous || deps.some((dep, i) => dep !== previous.deps[i])) hooks[index] = { callback, deps };
      return hooks[index].callback;
    },
    useEffect(effect, deps) {
      const index = cursor++, previous = hooks[index];
      if (!previous || deps.some((dep, i) => dep !== previous.deps[i])) effects.push(() => {
        previous?.cleanup?.();
        hooks[index] = { deps, cleanup: effect() };
      });
    },
  };
  class MusicPlayer {
    playing = false;
    closed = false;
    attempts = 0;
    unlocks = 0;
    position = 0;
    constructor(source, value) { this.source = source; this.volume = value; players.push(this); }
    setVolume(value) { this.volume = value; }
    async unlock(restart) { assert.equal(gesture, true); assert.equal(restart, true); this.unlocks++; }
    async play() { this.attempts++; this.playing = !this.closed && (autoplay || gesture); return this.playing; }
    pause() { this.playing = false; }
    close() { this.pause(); this.closed = true; }
  }
  const exports = {};
  vm.runInNewContext(code, {
    exports, document, window, Element: class {},
    localStorage: { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value) },
    require: name => {
      if (name === 'react') return react;
      if (name === './musicPlayback') return { MusicPlayer };
      if (name === './musicPreferences') return {
        MUSIC_STORAGE_KEY: 'cryptoid_home_music', DEFAULT_MUSIC_VOLUME: 50, readMusicVolume: () => volume,
      };
      throw new Error(`Unexpected import ${name}`);
    },
  });
  const render = () => {
    cursor = 0;
    view = exports.useGalaxyMusic(active);
    effects.splice(0).forEach(effect => effect());
    return view;
  };
  const settle = async () => { await Promise.resolve(); await Promise.resolve(); return render(); };
  const input = async (type = 'touchend') => {
    gesture = true;
    document.dispatchEvent(new Event(type));
    gesture = false;
    return settle();
  };
  const toggle = async () => { gesture = true; view.toggle(); gesture = false; return settle(); };
  const unmount = () => hooks.forEach(hook => { hook.cleanup?.(); delete hook.cleanup; });
  t.after(unmount);
  render();
  return { players, document, window, storage, render, settle, input, toggle, unmount, get view() { return view; } };
}

for (const event of ['touchend', 'keydown', 'click']) {
  test(`blocked map autoplay retries during ${event} with the original player`, async t => {
    const host = fixture(t);
    assert.equal((await host.settle()).playing, false);
    assert.equal((await host.input(event)).playing, true);
    assert.equal(host.players.length, 1);
    assert.equal(host.players[0].unlocks, 1);
    assert.equal(host.players[0].volume, 20);
    host.players[0].position = 42;
    host.render();
    await host.input(event);
    assert.equal(host.players[0].position, 42);
    assert.equal(host.players[0].attempts, 2);
  });
}

test('saved off and zero volume stay quiet during map interaction', async t => {
  for (const options of [{ enabled: false }, { volume: 0 }, { active: false }]) {
    const host = fixture(t, options);
    await host.input();
    assert.equal(host.players.length, 0);
  }
});

test('music toggles persist and background recovery retains the playback position', async t => {
  const host = fixture(t);
  await host.toggle();
  assert.equal(host.view.playing, true);
  host.players[0].position = 73;
  host.document.hidden = true;
  host.document.dispatchEvent(new Event('visibilitychange'));
  assert.equal((await host.settle()).playing, false);
  await host.input();
  assert.equal(host.view.playing, false);
  host.document.hidden = false;
  host.document.dispatchEvent(new Event('visibilitychange'));
  await host.input();
  assert.equal(host.view.playing, true);
  assert.equal(host.players[0].position, 73);
  await host.toggle();
  assert.equal(host.storage.get('cryptoid_home_music'), 'off');
  await host.input();
  assert.equal(host.view.playing, false);
});

test('launch fade stops map music and cached-page return permits a fresh gesture', async t => {
  const host = fixture(t);
  await host.input();
  await host.view.fadeOut(new AbortController().signal);
  await host.input();
  assert.equal(host.view.playing, false);
  host.window.dispatchEvent(new Event('pageshow'));
  await host.input();
  assert.equal(host.view.playing, true);
  assert.equal(host.players.length, 1);
});

test('cancelled minigame launch restores the same playing map track', async t => {
  const host = fixture(t, { autoplay: true });
  await host.settle();
  const controller = new AbortController();
  const fading = host.view.fadeOut(controller.signal);
  controller.abort();
  await fading;
  await host.settle();
  assert.equal(host.view.playing, true);
  assert.equal(host.players[0].volume, 20);
});

test('navigation closes the player and removes its gesture listeners', async t => {
  const host = fixture(t);
  await host.input();
  host.unmount();
  const attempts = host.players[0].attempts;
  await host.input();
  assert.equal(host.players[0].closed, true);
  assert.equal(host.players[0].attempts, attempts);
  assert.equal(host.players.length, 1);
});
