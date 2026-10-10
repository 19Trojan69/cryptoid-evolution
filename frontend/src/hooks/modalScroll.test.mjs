import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import * as jsx from 'react/jsx-runtime';

test('closing quick access releases its route lock and restores the previous page overflow', () => {
  for (const original of ['', 'auto', 'scroll']) {
    const effects = [], listeners = new Map();
    class Element { isConnected = true; focus() {} }
    const body = Object.assign(new Element(), { style: { overflow: original } });
    const document = {
      body, activeElement: body,
      querySelector: () => null, querySelectorAll: () => [],
      addEventListener: (key, handler) => listeners.set(handler, key),
      removeEventListener: (_, handler) => listeners.delete(handler),
    };
    const react = {
      useState: initial => [typeof initial === 'function' ? initial() : initial, () => {}],
      useRef: current => ({ current }), useCallback: callback => callback,
      useEffect: callback => effects.push(callback),
    };
    const load = path => {
      const code = ts.transpileModule(readFileSync(new URL(path, import.meta.url), 'utf8'), {
        compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
      }).outputText;
      const exports = {};
      vm.runInNewContext(code, {
        exports, document, HTMLElement: Element,
        sessionStorage: { getItem: () => null },
        requestAnimationFrame: () => 1, cancelAnimationFrame: () => {},
        require: name => {
          if (name === 'react') return react;
          if (name === 'react/jsx-runtime') return jsx;
          if (name === 'react-router-dom') return {
            useBlocker: () => ({ state: 'unblocked' }),
            useLocation: () => ({ pathname: '/', search: '', hash: '' }),
            useNavigate: () => () => {},
          };
          if (name === '../i18n') return { useLocale: () => ({ t: value => value }) };
          if (name === './BlockchainIcon') return { default: () => null };
          throw new Error(`Unexpected import: ${name}`);
        },
      });
      return exports.default;
    };
    const QuickMenu = load('../components/QuickAccessMenu.tsx');
    const useModalNavigation = load('./useModalNavigation.ts');
    QuickMenu({ onClose() {}, onAction() {}, signedIn: false, canAdmin: false });
    useModalNavigation('quick', () => {});
    // React mounts child effects before parent effects. Duplicate saved values
    // used to leave "hidden" behind when these effects were cleaned up.
    const cleanups = effects.map(effect => effect());
    assert.equal(body.style.overflow, 'hidden', 'the modal still locks its background');
    cleanups.forEach(cleanup => cleanup?.());
    assert.equal(body.style.overflow, original, 'closing or unmounting restores page scrolling');
    assert.equal(listeners.size, 0, 'no menu key listener survives leaving the route');
  }
});
