import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

// Execute the production hook. Navigation settles explicitly, so an effect
// replay or re-render cannot hide two history operations behind a synchronous mock.
function harness() {
  const refs = [], effects = [], calls = [];
  let index = 0, location = { key: 'base', pathname: '/game', search: '', hash: '', state: null };
  const react = { useCallback: fn => fn, useRef: initial => refs[index++] ??= { current: initial }, useEffect: fn => effects.push(fn) };
  const blocker = { state: 'unblocked' };
  const exports = {};
  const context = { exports, require: name => name === 'react' ? react : {
    useLocation: () => location, useNavigate: () => (...args) => calls.push(args), useBlocker: () => blocker,
  }, document: { body: { style: {} }, activeElement: null, querySelector: () => null, querySelectorAll: () => [], addEventListener() {}, removeEventListener() {} },
    HTMLElement: class {}, requestAnimationFrame: () => 1, cancelAnimationFrame() {}, Event: class {} };
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(new URL('./useModalNavigation.ts', import.meta.url), 'utf8'),
    { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, context);
  return { calls, location: next => { location = { ...location, ...next }; },
    render(layer, replay = false) { index = 0; effects.length = 0; exports.default(layer, () => {}); const run = [...effects]; run.forEach(fn => fn()); if (replay) run.forEach(fn => fn()); } };
}

test('a reloaded or orphaned modal marker is removed on this route without going Back', () => {
  const h = harness(); h.location({ key: 'restored', state: { cryptoidModalGuard: true, preserved: 7 } });
  h.render(null, true);
  assert.equal(h.calls.length, 1);
  assert.equal(h.calls[0][0], '/game');
  assert.equal(h.calls[0][1].replace, true);
  assert.equal(h.calls[0][1].state.preserved, 7);
  assert.ok(!h.calls[0][1].state.cryptoidModalGuard);
});

test('the owned guard is pushed and popped exactly once, including replay while navigation is pending', () => {
  const h = harness(); h.render('pause', true); assert.equal(h.calls.length, 1);
  h.location({ key: 'guard', state: { cryptoidModalGuard: true } });
  h.render('pause'); assert.equal(h.calls.length, 1);
  h.render(null, true); h.render(null);
  assert.equal(h.calls.length, 2); assert.equal(h.calls[1][0], -1);
  h.location({ key: 'base', state: null }); h.render(null);
  assert.equal(h.calls.length, 2);
  h.render('weapons', true); assert.equal(h.calls.length, 3);
});

test('closing before the guard push settles still removes only that owned entry', () => {
  const h = harness(); h.render('pause'); h.render(null, true);
  assert.equal(h.calls.length, 1);
  h.location({ key: 'guard', state: { cryptoidModalGuard: true } }); h.render(null, true);
  assert.equal(h.calls.length, 2); assert.equal(h.calls[1][0], -1);
});
