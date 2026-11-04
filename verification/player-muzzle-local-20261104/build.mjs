import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, unlinkSync, readdirSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { transformController, proof, digest } from './transform.mjs';
import { applyMobileHudCandidate } from './hudBaseline.mjs';

const root = resolve(new URL('../..', import.meta.url).pathname);
const condition = process.argv[2];
assert.equal(process.env.VERCEL_ENV, 'preview');
assert.ok(['control', 'leaf'].includes(condition));
const original = readFileSync(root + '/frontend/src/pages/GamePage.tsx', 'utf8');
transformController(original, original, condition);
const consumers = [];
function scan(dir) { for (const e of readdirSync(dir, { withFileTypes: true })) {
  const p = dir + '/' + e.name;
  if (e.isDirectory()) scan(p);
  else if (/\.(css|tsx?|mjs|jsx?)$/.test(e.name) && !/\.(test|spec)\./.test(e.name)) {
    const s = readFileSync(p, 'utf8');
    if (s.includes('--muzzle-light')) consumers.push(p.slice(root.length + 1));
  }
} }
scan(root + '/frontend/src');
assert.deepEqual(consumers.sort(), ['frontend/src/index.css', 'frontend/src/pages/GamePage.tsx']);
const css = readFileSync(root + '/frontend/src/index.css', 'utf8');
assert.equal(css.split('--muzzle-light').length, 2);
assert.match(css, /\.player-muzzle-flash \{[^}]*opacity: var\(--muzzle-light, 0\);/);

const paths = [], sources = [];
function temporary(originalPath, changed) {
  const path = originalPath.replace(/\.mjs$/, `.muzzle-${condition}-${process.pid}.mjs`);
  writeFileSync(path, changed); paths.push(path); return pathToFileURL(path).href;
}
function replaceOnce(text, before, after) {
  assert.equal(text.split(before).length, 2, before); return text.replace(before, after);
}
try {
  const basePath = root + '/verification/boss2-forensics-20261028/buildDevicePreview.mjs';
  const base = readFileSync(basePath, 'utf8');
  const transformUrl = pathToFileURL(root + '/verification/player-muzzle-local-20261104/transform.mjs').href;
  const recordPath = root + '/verification/player-muzzle-local-20261104/build-transform.json';
  const prefix = `import { transformController as muzzleTransform, proof as muzzleProof } from ${JSON.stringify(transformUrl)};\n`;
  const before = 'return deviceController(clockGapProbe ? instrumentClockFrames(diagnostic) : diagnostic);';
  const after = `const incoming = deviceController(clockGapProbe ? instrumentClockFrames(diagnostic) : diagnostic);
      const muzzle = muzzleProof(incoming, original, ${JSON.stringify(condition)});
      writeFileSync(${JSON.stringify(recordPath)}, JSON.stringify(muzzle, null, 2) + '\\n');
      return muzzleTransform(incoming, original, ${JSON.stringify(condition)});`;
  const baseUrl = temporary(basePath, prefix + replaceOnce(base, before, after));
  sources.push({ path: 'base-builder', sha256: digest(base) });
  const prepPath = root + '/verification/systematic-stability-20261101/prepareSoakBuild.mjs';
  const prep = readFileSync(prepPath, 'utf8');
  const prepUrl = temporary(prepPath, replaceOnce(prep,
    "await import('../boss2-forensics-20261028/buildDevicePreview.mjs');", 'await import(' + JSON.stringify(baseUrl) + ');'));
  sources.push({ path: 'clock-package-builder', sha256: digest(prep) });
  const phonePath = root + '/verification/direct-boss-style-device-20261102/buildDevicePreview.mjs';
  const phone = readFileSync(phonePath, 'utf8');
  const phoneUrl = temporary(phonePath, replaceOnce(phone,
    "await import('../systematic-stability-20261101/prepareSoakBuild.mjs');", 'await import(' + JSON.stringify(prepUrl) + ');'));
  sources.push({ path: 'phone-package-builder', sha256: digest(phone) });
  await import(phoneUrl);
  const dir = root + '/verification/boss2-forensics-20261028/results/device-preview/site';
  applyMobileHudCandidate(root, dir);
  const infoPath = dir + '/device-preview-info.json';
  const info = JSON.parse(readFileSync(infoPath, 'utf8'));
  const applied = JSON.parse(readFileSync(recordPath, 'utf8'));
  assert.equal(applied.condition, condition);
  assert.equal(info.qaLocalBossStyle.condition, 'leaves');
  assert.equal(info.mobileHudBackdropCandidate.value, 'none');
  info.playerMuzzleLocalCandidate = { ...applied, builderSources: sources,
    onlyDeclaredConsumersFound: consumers, originalCssSha256: digest(css),
    baselineDirectBossStyleAndHudRetained: true,
    commonHudHelperSha256: digest(readFileSync(root + '/verification/player-muzzle-local-20261104/hudBaseline.mjs')) };
  writeFileSync(infoPath, JSON.stringify(info, null, 2) + '\n');
  console.log('CRYPTOID_MUZZLE_BUILD ' + JSON.stringify(info.playerMuzzleLocalCandidate));
} finally {
  for (const path of paths.reverse()) unlinkSync(path);
  assert.equal(readFileSync(root + '/frontend/src/pages/GamePage.tsx', 'utf8'), original);
}
