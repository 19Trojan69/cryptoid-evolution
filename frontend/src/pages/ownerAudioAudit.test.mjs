import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import { execFileSync } from "node:child_process";
import ts from "typescript";
import {
  armOwnerAudioAudit,
  createOwnerAudioAudit,
  ownerAudioDisabled,
  noteAudioEvent,
  noteAudioVoiceStart,
  noteAudioVoiceEnd,
  noteAudioVoiceRelease,
  captureAudioAuditEvents,
} from "./ownerAudioAudit.ts";
import { AUDIO_AUDIT_ARM_KEY, AUDIO_AUDIT_KEY, cleanAudioAudit, readAudioAudits } from "./audioAuditReport.mjs";
import { readOwnerStabilityReport } from "./stabilityReport.mjs";
import { GameAudio } from "./gameAudio.ts";
import { MusicPlayer } from "./musicPlayback.ts";
import { primeCardSound, playCardSound, closeCardAudioForAudit, cardAudioAuditSnapshot } from "./cardSound.ts";
const build = { sourceCommit: "a".repeat(40), sourceTree: "b".repeat(40), workingTreeDirty: true };
const playing = {
  status: "playing",
  sector: 73,
  phase: "FORMATION",
  encounter: "normal",
  adminPreview: true,
  documentHidden: false,
};
function fixture(mode = "original") {
  let clock = 0,
    wall = 10000;
  const data = new Map();
  const storage = {
    getItem: key => data.get(key) ?? null,
    setItem: (key, value) => data.set(key, value),
    removeItem: key => data.delete(key),
  };
  storage.setItem("cryptoid_admin_preview", "1");
  storage.setItem(AUDIO_AUDIT_ARM_KEY, JSON.stringify({ mode, at: wall }));
  const host = { sessionStorage: storage, localStorage: storage, __cryptoidBootId: "test-boot" };
  return {
    host,
    data,
    storage,
    get wall() {
      return wall;
    },
    advance: ms => {
      clock += ms;
      wall += ms;
    },
    create: (read = () => ({})) =>
      createOwnerAudioAudit(true, () => host, { now: () => clock, wallNow: () => wall, build, read }),
  };
}
test("fresh owner verification gates arming, cancellation, stale views and storage access", async () => {
  let reads = 0;
  const f = fixture();
  await assert.rejects(
    armOwnerAudioAudit(
      async () => ({ canAdmin: false }),
      () => {
        reads++;
        return f.host;
      },
      "off"
    ),
    /owner_access/
  );
  await assert.rejects(
    armOwnerAudioAudit(
      async () => {
        throw Error("denied");
      },
      () => {
        reads++;
        return f.host;
      },
      "off"
    )
  );
  assert.equal(
    await armOwnerAudioAudit(
      async () => ({ canAdmin: true }),
      () => {
        reads++;
        return f.host;
      },
      "off",
      () => false
    ),
    false
  );
  assert.equal(reads, 0);
  await armOwnerAudioAudit(
    async () => ({ canAdmin: true }),
    () => f.host,
    "original",
    () => true,
    10000
  );
  assert.equal(JSON.parse(f.storage.getItem(AUDIO_AUDIT_ARM_KEY)).mode, "original");
  await armOwnerAudioAudit(
    async () => ({ canAdmin: true }),
    () => f.host,
    "cancel"
  );
  assert.equal(f.storage.getItem(AUDIO_AUDIT_ARM_KEY), null);
  await assert.rejects(
    armOwnerAudioAudit(
      async () => ({ canAdmin: true }),
      () => f.host,
      "bad"
    ),
    /invalid_audio_mode/
  );
});
test("ordinary players cannot obtain the host; non-admin rounds never consume an arm", () => {
  assert.equal(
    createOwnerAudioAudit(
      false,
      () => {
        throw Error("must not access");
      },
      { build, read: () => ({}) }
    ),
    null
  );
  const f = fixture("off");
  f.storage.removeItem("cryptoid_admin_preview");
  assert.equal(f.create(), null);
  assert.ok(f.storage.getItem(AUDIO_AUDIT_ARM_KEY));
  assert.equal(ownerAudioDisabled(), false);
});
test("malformed, future, expired and denied arms fail closed", () => {
  for (const raw of [
    "null",
    "[]",
    "bad",
    "{}",
    JSON.stringify({ at: 10001, mode: "off" }),
    JSON.stringify({ at: 1, mode: "bad" }),
  ]) {
    const f = fixture();
    f.storage.setItem(AUDIO_AUDIT_ARM_KEY, raw);
    assert.equal(f.create(), null);
  }
  const expired = fixture();
  expired.advance(600001);
  assert.equal(expired.create(), null);
  assert.equal(
    createOwnerAudioAudit(
      true,
      () => ({
        get sessionStorage() {
          throw Error("denied");
        },
      }),
      { build, read: () => ({}) }
    ),
    null
  );
});
test("90 seconds finishes only the recording; off remains selected until route cleanup", () => {
  const f = fixture("off"),
    audit = f.create(() => ({ musicState: "none", effectsState: "none" }));
  try {
    assert.equal(ownerAudioDisabled(), true);
    assert.equal(f.create(), null);
    audit.tick(playing, 16);
    f.advance(90000);
    audit.tick(playing, 16);
    assert.equal(audit.export().finished, true);
    assert.equal(audit.export().reason, "limit");
    assert.equal(ownerAudioDisabled(), true);
    const frozen = JSON.stringify(audit.export().samples);
    noteAudioEvent("effects-start-request");
    f.advance(5000);
    audit.tick(playing, 16);
    assert.equal(JSON.stringify(audit.export().samples), frozen);
    assert.equal(readAudioAudits(f.host)[0].finished, true);
  } finally {
    audit.dispose();
  }
  assert.equal(ownerAudioDisabled(), false);
});
test("StrictMode cleanup re-arms an unused audit without duplicate comparison records", () => {
  const f = fixture();
  const first = f.create();
  first.dispose();
  assert.ok(f.storage.getItem(AUDIO_AUDIT_ARM_KEY));
  f.advance(3);
  const second = f.create();
  second.tick(playing, 16);
  second.dispose();
  assert.equal(f.storage.getItem(AUDIO_AUDIT_ARM_KEY), null);
  assert.equal(readAudioAudits(f.host).length, 1);
  assert.equal(readAudioAudits(f.host)[0].reason, "unmount");
});
test("only two bounded captures persist; clocks, startup events and technical fields survive", async () => {
  const f = fixture();
  const audit = f.create(() => ({
    effectsClockMs: 1,
    musicMediaMs: 20,
    token: "secret",
    rawUrl: "/private",
    gestureSeen: true,
  }));
  try {
    audit.tick(playing, 16);
    for (let i = 0; i < 1000; i++) {
      noteAudioEvent("effects-resume-request");
      f.advance(100);
      audit.tick(playing, 16);
    }
    const result = audit.export();
    assert.ok(result.samples.length <= 47);
    assert.equal(result.events.length, 32);
    assert.equal(result.events[0].atMs, 0);
    assert.equal(JSON.stringify(result).includes("secret"), false);
    assert.ok(f.storage.getItem(AUDIO_AUDIT_KEY).length < 128 * 1024);
  } finally {
    audit.dispose();
  }
  for (const mode of ["off", "original"]) {
    f.advance(1);
    await armOwnerAudioAudit(
      async () => ({ canAdmin: true }),
      () => f.host,
      mode,
      () => true,
      f.wall
    );
    const next = f.create();
    next.tick(playing, 16);
    next.dispose();
  }
  assert.equal(readAudioAudits(f.host).length, 2);
  assert.deepEqual(
    readAudioAudits(f.host).map(row => row.mode),
    ["off", "original"]
  );
  const report = await readOwnerStabilityReport(
    async () => ({ canAdmin: true }),
    () => f.host
  );
  assert.ok(report.audioCaptures.length > 0);
  const clean = cleanAudioAudit({
    environment: "owner-admin",
    mode: "off",
    recordedAt: 1,
    samples: [{ effectsClockMs: Infinity, counts: { token: 1 }, token: "secret" }],
    events: [{ kind: "private", atMs: 1 }],
  });
  assert.equal(JSON.stringify(clean).includes("secret"), false);
  assert.equal(clean.events.length, 0);
});
test("async completions cannot be attributed to a later audit", () => {
  const f = fixture(),
    first = f.create(),
    late = captureAudioAuditEvents();
  first.tick(playing, 16);
  first.dispose();
  f.storage.setItem(AUDIO_AUDIT_ARM_KEY, JSON.stringify({ mode: "original", at: 10000 }));
  const next = f.create();
  try {
    late("effects-resume-ok");
    next.tick(playing, 16);
    assert.equal(next.export().samples.at(-1).counts["effects-resume-ok"], undefined);
  } finally {
    next.dispose();
  }
});
test("storage/quota and optional snapshot failures never interrupt a playing frame", () => {
  const f = fixture(),
    audit = f.create(() => {
      throw Error("host failed");
    });
  try {
    f.storage.setItem = () => {
      throw Error("quota");
    };
    assert.doesNotThrow(() => {
      audit.tick(playing, 16);
      f.advance(90001);
      audit.tick(playing, 16);
    });
  } finally {
    audit.dispose();
  }
});
test("off-mode marks incomplete or failed native close acknowledgements instead of claiming clean shutdown", () => {
  const f = fixture("off"),
    audit = f.create();
  try {
    noteAudioEvent("effects-close-request");
    audit.tick(playing, 16);
    assert.equal(audit.export().samples.at(-1).offCleanupComplete, false);
    noteAudioEvent("effects-close-failed");
    f.advance(2001);
    audit.tick(playing, 16);
    assert.equal(audit.export().samples.at(-1).offCleanupFailed, true);
    assert.equal(audit.export().samples.at(-1).offCleanupComplete, false);
  } finally {
    audit.dispose();
  }
});
test("the audit introduces no timer, RAF, event listener, fetch, debug global or URL switch", () => {
  const source = fs.readFileSync(new URL("./ownerAudioAudit.ts", import.meta.url), "utf8");
  assert.doesNotMatch(
    source,
    /setTimeout\(|setInterval\(|requestAnimationFrame\(|addEventListener\(|fetch\(|location\.|URLSearchParams|__cryptoidDiagnostics/
  );
});
function audioHost() {
  const previous = {
    AudioContext: globalThis.AudioContext,
    Audio: globalThis.Audio,
    fetch: globalThis.fetch,
    localStorage: globalThis.localStorage,
  };
  const contexts = [],
    sources = [],
    elements = [];
  let requests = 0;
  const param = () => ({
    value: 1,
    setValueAtTime() {},
    exponentialRampToValueAtTime() {},
    setTargetAtTime(v) {
      this.value = v;
    },
    cancelScheduledValues() {},
  });
  const node = () => ({
    gain: param(),
    pan: param(),
    connect(out) {
      return out;
    },
    disconnect() {},
  });
  globalThis.localStorage = { getItem: () => null };
  globalThis.fetch = async () => {
    requests++;
    return { ok: false };
  };
  globalThis.AudioContext = class {
    state = "running";
    currentTime = 0;
    sampleRate = 48000;
    destination = {};
    constructor() {
      contexts.push(this);
    }
    async resume() {}
    async close() {
      this.state = "closed";
    }
    createGain() {
      return node();
    }
    createStereoPanner() {
      return node();
    }
    createMediaElementSource() {
      return node();
    }
    createBuffer(_channels, length, rate) {
      return {
        duration: length / rate,
        length,
        numberOfChannels: 1,
        copyToChannel() {},
        getChannelData: () => new Float32Array(length),
      };
    }
    createOscillator() {
      const s = { ...node(), frequency: param(), start() {}, stop() {} };
      sources.push(s);
      return s;
    }
    createBufferSource() {
      const s = { ...node(), playbackRate: param(), start() {}, stop() {} };
      sources.push(s);
      return s;
    }
  };
  globalThis.Audio = class {
    paused = true;
    ended = false;
    muted = false;
    currentTime = 0;
    duration = 100;
    volume = 1;
    constructor(src) {
      this.src = src;
      elements.push(this);
    }
    pause() {
      this.paused = true;
    }
    async play() {
      this.paused = false;
    }
    load() {}
    removeAttribute() {}
    addEventListener() {}
    removeEventListener() {}
  };
  return {
    contexts,
    sources,
    elements,
    get requests() {
      return requests;
    },
    restore() {
      closeCardAudioForAudit();
      Object.assign(globalThis, previous);
    },
  };
}
test("actual effects report overdue voices without stopping, clipping or cleaning any sound", async () => {
  const h = audioHost(),
    f = fixture();
  let audio;
  const audit = f.create(() => audio?.audioAuditSnapshot ?? {});
  try {
    audio = new GameAudio();
    await audio.start();
    audio.play("extraLife");
    assert.equal(h.sources.length, 7);
    audit.tick(playing, 16);
    h.contexts[0].currentTime = 5;
    f.advance(2001);
    audit.tick(playing, 16);
    let sample = audit.export().samples.at(-1);
    assert.equal(sample.effectsOverdue, 7);
    assert.equal(sample.counts.effectsStarted, 7);
    assert.equal(audio.activeVoiceCount, 7);
    for (const source of h.sources) source.onended();
    f.advance(2001);
    audit.tick(playing, 16);
    sample = audit.export().samples.at(-1);
    assert.equal(sample.counts.effectsEnded, 7);
    assert.equal(sample.counts.effectsReleased, 7);
    assert.equal(sample.effectsRegistered, 0);
  } finally {
    audio?.close();
    audit.dispose();
    h.restore();
  }
});
test("the actual off gate prevents effects/music/card starts even after the capture limit", async () => {
  const h = audioHost(),
    f = fixture("off"),
    audit = f.create();
  let effects, music;
  try {
    effects = new GameAudio();
    music = new MusicPlayer("/audio/battle-orbit.mp3", 50);
    for (let i = 0; i < 2; i++) {
      assert.equal(await effects.start(), false);
      assert.equal(await music.play(), false);
      assert.equal(await music.unlock(), false);
      primeCardSound();
      playCardSound();
      audit.tick(playing, 16);
      f.advance(90001);
    }
    assert.equal(h.contexts.length, 0);
    assert.equal(h.requests, 0);
    assert.equal(h.sources.length, 0);
    assert.ok(h.elements.every(e => e.paused));
  } finally {
    effects?.close();
    music?.close();
    audit.dispose();
    h.restore();
  }
});
test("original mode retains music at zero gain and records card clock and voice lifecycle", async () => {
  const h = audioHost(),
    f = fixture();
  let music;
  const audit = f.create(() => ({ ...music?.audioAuditSnapshot, ...cardAudioAuditSnapshot() }));
  try {
    music = new MusicPlayer("/audio/battle-orbit.mp3", 50);
    await music.play();
    music.setVolume(0);
    primeCardSound();
    playCardSound();
    audit.tick(playing, 16);
    f.advance(2001);
    h.contexts.forEach(ctx => (ctx.currentTime = 2));
    h.elements[0].currentTime = 2;
    audit.tick(playing, 16);
    const sample = audit.export().samples.at(-1);
    assert.equal(sample.musicGain, 0);
    assert.equal(sample.musicPaused, false);
    assert.equal(sample.musicMediaDeltaMs, 2000);
    assert.equal(sample.cardState, "running");
    assert.equal(sample.counts.cardStarted, 5);
    for (const source of h.sources) source.onended?.();
  } finally {
    music?.close();
    audit.dispose();
    h.restore();
  }
});
test("a rejected initial effects resume is visible as a failure and a stopped context clock", async () => {
  const h = audioHost(),
    f = fixture();
  const Base = globalThis.AudioContext;
  let effects;
  globalThis.AudioContext = class extends Base {
    state = "suspended";
    async resume() {
      throw Error("not allowed");
    }
  };
  const audit = f.create(() => effects?.audioAuditSnapshot ?? {});
  try {
    effects = new GameAudio();
    assert.equal(await effects.start(), false);
    audit.tick(playing, 16);
    f.advance(2001);
    audit.tick(playing, 16);
    const sample = audit.export().samples.at(-1);
    assert.equal(sample.effectsState, "suspended");
    assert.equal(sample.effectsClockDeltaMs, 0);
    assert.equal(sample.counts["effects-resume-request"], 1);
    assert.equal(sample.counts["effects-resume-failed"], 1);
  } finally {
    effects?.close();
    audit.dispose();
    h.restore();
  }
});
const source = fs.readFileSync(new URL("./GamePage.tsx", import.meta.url), "utf8");
const parse = text => ts.createSourceFile("GamePage.tsx", text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const ast = parse(source);
const find = (node, predicate) => {
  if (predicate(node)) return node;
  let result;
  ts.forEachChild(node, child => {
    result ??= find(child, predicate);
  });
  return result;
};
test("the whole simulation matches approved runtime after removing the single audio observation hook", () => {
  const base = parse(
    execFileSync("git", ["show", "53640c01a16c921645d05502d9e5b34f6dc6eeec:frontend/src/pages/GamePage.tsx"], {
      encoding: "utf8",
    })
  );
  const printed = file => {
    const simulate = find(file, n => ts.isVariableDeclaration(n) && n.name.getText(file) === "simulate");
    const result = ts.transform(simulate, [
      context => {
        const visit = n =>
          ts.isExpressionStatement(n) && n.getText(file).startsWith("ownerAudioAuditRef.current?.tick(")
            ? undefined
            : ts.visitEachChild(n, visit, context);
        return n => ts.visitNode(n, visit);
      },
    ]);
    const text = ts
      .createPrinter({ removeComments: true })
      .printNode(ts.EmitHint.Unspecified, result.transformed[0], file);
    result.dispose();
    return text;
  };
  assert.equal(printed(ast), printed(base));
  const entry = file =>
    ts.createPrinter({ removeComments: true }).printNode(
      ts.EmitHint.Unspecified,
      find(file, n => ts.isFunctionDeclaration(n) && n.name?.text === "GameEntry"),
      file
    );
  assert.equal(entry(ast), entry(base), "the server owner gate is unchanged");
});
test("actual layout setup retires primed engines before off-mode music setup; cleanup restores normal starts", async () => {
  const h = audioHost(),
    f = fixture("off");
  let cleanup, primed, music;
  try {
    primed = new GameAudio();
    await primed.start();
    music = new MusicPlayer("/audio/battle-orbit.mp3", 50);
    await music.play();
    primeCardSound();
    const callback = find(
      ast,
      n =>
        ts.isCallExpression(n) &&
        n.expression.getText(ast) === "useLayoutEffect" &&
        n.arguments[0].getText(ast).includes("const audit = createOwnerAudioAudit")
    ).arguments[0];
    const scope = {
      createOwnerAudioAudit: (verified, _get, options) =>
        createOwnerAudioAudit(verified, () => f.host, { ...options, now: () => 0, wallNow: () => 10000 }),
      ownerDiagnostics: true,
      shipSaveNetwork: "testnet",
      window: f.host,
      __CRYPTOID_BUILD__: build,
      ownerAudioAuditRef: { current: null },
      soundRef: { current: null },
      musicRef: { current: null },
      cardAudioAuditSnapshot,
      noteAudioEvent,
      readEffectsVolume: () => 35,
      readMusicVolume: () => 50,
      fieldSizeRef: { current: { width: 430, height: 825 } },
      shipStageRef: { current: 1 },
      stateRef: { current: { shots: [], enemyShots: [], asteroids: [] } },
      navigator: {},
      takePrimedGameAudio: () => primed,
      takeHandoffGameMusic: () => music,
      closeCardAudioForAudit,
    };
    const js = ts.transpileModule("(" + callback.getText(ast) + ")", {
      compilerOptions: { target: ts.ScriptTarget.ES2022 },
    }).outputText;
    cleanup = vm.runInNewContext(js, scope)();
    assert.ok(h.contexts.every(c => c.state === "closed"));
    const effect = find(
      ast,
      n =>
        ts.isCallExpression(n) &&
        n.expression.getText(ast) === "useEffect" &&
        n.arguments[0].getText(ast).includes('void fetch("/audio/boss-victory-v2.mp3")')
    ).arguments[0];
    const noMusic = ts.transpileModule("(" + effect.getText(ast) + ")", {
      compilerOptions: { target: ts.ScriptTarget.ES2022 },
    }).outputText;
    const before = h.contexts.length;
    vm.runInNewContext(noMusic, {
      musicEnabled: true,
      ownerAudioDisabled,
      fetch() {
        throw Error("off must not preload music");
      },
    })();
    primeCardSound();
    assert.equal(h.contexts.length, before);
    cleanup();
    cleanup = null;
    const normal = new GameAudio();
    assert.equal(await normal.start(), true);
    normal.close();
  } finally {
    cleanup?.();
    primed?.close();
    music?.close();
    h.restore();
  }
});
