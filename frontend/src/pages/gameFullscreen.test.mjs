import assert from "node:assert/strict";
import test from "node:test";
import { leaveGameFullscreen, requestGameFullscreen } from "./gameFullscreen.ts";

// Replace only the browser boundary; production helpers are imported unchanged.
const setDocument = (t, value) => {
  const previous = Object.getOwnPropertyDescriptor(globalThis, "document");
  if (value === undefined) delete globalThis.document;
  else Object.defineProperty(globalThis, "document", { value, configurable: true });
  t.after(() => {
    if (previous) Object.defineProperty(globalThis, "document", previous);
    else delete globalThis.document;
  });
};
const settle = () => new Promise((resolve) => setImmediate(resolve));

for (const [name, action] of [["request", requestGameFullscreen], ["exit", leaveGameFullscreen]]) {
  test(`${name}: safely skips an environment without a document`, (t) => {
    setDocument(t, undefined);
    assert.doesNotThrow(action);
  });

  test(`${name}: safely skips an unavailable fullscreen API`, (t) => {
    setDocument(t, { fullscreenElement: name === "exit" ? {} : null, documentElement: {} });
    assert.doesNotThrow(action);
  });

  for (const [outcome, implementation] of [
    ["resolved promise", () => Promise.resolve()],
    ["rejected promise", () => Promise.reject(new Error("Fullscreen denied"))],
    ["synchronous exception", () => { throw new Error("Inactive document"); }],
    ["missing promise", () => undefined],
  ]) {
    test(`${name}: tolerates ${outcome} without interrupting navigation`, async (t) => {
      let calls = 0;
      const root = {};
      const doc = { fullscreenElement: name === "exit" ? root : null, documentElement: root };
      const receiver = name === "request" ? root : doc;
      receiver[name === "request" ? "requestFullscreen" : "exitFullscreen"] = function (...args) {
        assert.equal(this, receiver);
        assert.deepEqual(args, name === "request" ? [{ navigationUI: "hide" }] : []);
        calls += 1;
        return implementation();
      };
      setDocument(t, doc);
      assert.doesNotThrow(action);
      assert.equal(calls, 1);
      await settle(); // Unhandled rejections fail the Node test runner.
    });
  }
}

test("request: does not re-enter fullscreen when it is already active", (t) => {
  const requestFullscreen = t.mock.fn();
  setDocument(t, { fullscreenElement: {}, documentElement: { requestFullscreen } });
  requestGameFullscreen();
  assert.equal(requestFullscreen.mock.callCount(), 0);
});

test("exit: does not call the browser when fullscreen has already ended", (t) => {
  const exitFullscreen = t.mock.fn();
  setDocument(t, { fullscreenElement: null, exitFullscreen });
  leaveGameFullscreen();
  assert.equal(exitFullscreen.mock.callCount(), 0);
});
