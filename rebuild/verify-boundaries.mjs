import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
const directory = new URL('.', import.meta.url).pathname, root = resolve(directory, '..');
const require = createRequire(resolve(root, 'frontend/package.json')), { build, transform } = require('esbuild');
const graph = await build({ entryPoints: ['battle', 'session', 'resources'].map(name => directory + 'core/' + name + '.ts'),
  absWorkingDir: root, outdir: 'unused-isolated-core', platform: 'node', format: 'esm', bundle: true, write: false, metafile: true, logLevel: 'silent' });
const forbiddenFiles = /(?:GamePage|shipFleet|paintedShip|useAuth|usePayments|axios|react(?:-dom)?|saveOutbox|ownerFlightRecorder)/i;
const effects = /\b(?:window|document|localStorage|sessionStorage)\s*(?:\.|\[)|(?<![\w.])(?:fetch|requestAnimationFrame|setInterval|setTimeout)\s*\(/;
for (const file of Object.keys(graph.metafile.inputs)) {
  assert.equal(forbiddenFiles.test(file), false, `Browser/account runtime imported into simulation: ${file}`);
  const source = readFileSync(resolve(root, file), 'utf8');
  const js = await transform(source, { loader: 'ts', legalComments: 'none' });
  assert.equal(effects.test(js.code), false, `Browser/network/storage effect in simulation: ${file}`);
}
console.log(JSON.stringify({ simulationModules: Object.keys(graph.metafile.inputs).length, forbiddenRuntimeImports: 0, browserNetworkStorageEffects: 0 }));
