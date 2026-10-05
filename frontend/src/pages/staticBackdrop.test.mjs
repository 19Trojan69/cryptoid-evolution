import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

const source = name => readFileSync(new URL(name, import.meta.url), 'utf8');
const css = source('../index.css');
test('the fixed globe uses a bundled image without canvas work or a clock', () => {
  const globe = source('./EarthGlobe.tsx');
  assert.match(globe, /<img[^>]+src="\/planets\/earth.png"/);
  assert.ok(existsSync(new URL('../../public/planets/earth.png', import.meta.url)));
  assert.doesNotMatch(globe, /setInterval|requestAnimationFrame|getImageData|putImageData|Date\.now|https?:\/\//);
  assert.doesNotMatch(source('./Shop.tsx'), /<EarthNetwork/);
});
test('the boss nebula has multiple fixed colors and no drift or player parallax', () => {
  const rule = css.match(/\.nebula-cloud \{([^}]+)\}/)[1];
  assert.equal((rule.match(/background:([^;]+)/)[1].match(/radial-gradient/g)||[]).length, 6);
  assert.match(rule, /animation: none/);
  assert.match(rule, /transform: none/);
  assert.match(rule, /will-change: auto/);
  assert.doesNotMatch(css, /@keyframes nebula-drift/);
  assert.match(css, /\.starfield \{[^}]+transform: none/);
  assert.match(css, /\.space-scene \.space-world\.planet-earth \{ transform: translate3d\(-50%, -50%, 0\);/);
});
test('only one meteor passes every 30 seconds, and motion preferences remain respected', () => {
  const stars = source('./Starfield.tsx');
  assert.equal((stars.match(/<i className="shooting-star /g)||[]).length, 1);
  assert.match(css, /\.shooting-star \{[^}]+animation: meteor-cross 30s linear infinite/);
  assert.match(css, /0%, 94% \{ opacity: 0/);
  assert.match(css, /\.starfield-paused[^}]+animation-play-state: paused/);
  assert.match(css, /html\[data-motion="reduced"\] \.shooting-star \{ display: none/);
});
