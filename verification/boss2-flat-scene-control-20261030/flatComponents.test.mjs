import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(new URL('../../frontend/package.json', import.meta.url));
const React = require('react'), { renderToStaticMarkup } = require('react-dom/server'), ts = require('typescript');
const source = readFileSync(new URL('./flatComponents.jsx', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, { fileName: 'flatComponents.jsx', compilerOptions: {
  jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, allowJs: true } }).outputText;
const output = { exports: {} };
new Function('require', 'module', 'exports', compiled)(require, output, output.exports);
const components = output.exports;
const render = (name, props) => renderToStaticMarkup(React.createElement(components[name], props));
function freeze(value) { if (value && typeof value === 'object') { Object.values(value).forEach(freeze); Object.freeze(value); } return value; }
const boss = () => freeze({ x: 84, y: 95, width: 310, height: 205, health: 40, maxHealth: 100, config: { id: 2 } });
test('boss and fall geometry retain the original outer positions and sizes without mutating the model', () => {
  const model = boss(), before = JSON.stringify(model), html = render('BossHullView', { boss: model, ready: true, title: 'Boss' });
  assert.match(html, /left:84px;top:95px;width:310px;height:205px;transform:translate\(-50%, -50%\)/);
  assert.match(html, /aria-valuenow="40"/); assert.equal(JSON.stringify(model), before);
  const fall = freeze({ x: 20, y: 30, bossShipWidth: 210, bossHeight: 140, bossModel: model });
  const falling = render('BossHullView', { boss: null, fall });
  assert.match(falling, /left:20px;top:30px;width:210px;height:140px/);
  assert.equal(render('BossHullView', { boss: null }), '');
});
test('all replacement visuals are declarative shapes without images, SVG, Canvas or background URLs', () => {
  const html = [render('BossHullView', { boss: boss(), ready: true }),
    ...['player', 'enemy', 'bonus'].map(variant => render('GameShipVisual', { variant })),
    render('BonusRockLayer', { rocks: freeze([{ id: 1, x: 50, y: 60, radius: 12 }]), effects: freeze([{ id: 2, x: 51, y: 61 }]) }),
    render('Starfield', {}), render('SectorBackdrop', {})].join('');
  assert.doesNotMatch(html, /<(?:canvas|img|svg|video|audio)\b|url\(/);
  assert.match(html, /left:50px;top:60px;width:24px;height:24px/);
  assert.match(html, /diagnostic-flat-player/); assert.match(html, /diagnostic-flat-enemy/);
  assert.equal(render('Starfield', {}), ''); assert.equal(render('SectorBackdrop', {}), '');
});
