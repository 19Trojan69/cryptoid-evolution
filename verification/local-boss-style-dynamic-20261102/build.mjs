import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { root } from '../boss2-forensics-20261028/fixture.mjs';
import { localStyleSource, localStyleProof } from '../local-boss-style-20261102/transform.mjs';
const require = createRequire(root + '/frontend/package.json');
const { build } = require('vite'), react = require('@vitejs/plugin-react').default;
const directory = root + '/verification/local-boss-style-dynamic-20261102';
const output = directory + '/results/site';
const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim();
const names = ['BossHullView', 'BossReactorView'];
const sources = Object.fromEntries(names.map(n => [n, readFileSync(root + '/frontend/src/pages/' + n + '.tsx', 'utf8')]));
const css = readFileSync(root + '/frontend/src/index.css', 'utf8');
assert.equal(/\[\s*style(?:\s|\]|[~|^$*=])/i.test(css), false, 'No style-presence selector may be normalized away');
const expected = JSON.parse(readFileSync(root + '/verification/local-boss-style-20261102/evidence/expected-builds.json', 'utf8'));
const proofs = Object.fromEntries(['control', 'leaves'].map(c => [c, localStyleProof(sources, c)]));
assert.deepEqual(proofs, expected, 'Exactly the previously measured virtual candidate');
const observedTransforms = new Map();
for (const key of Object.keys(process.env)) if (key.startsWith('VITE_')) delete process.env[key];
const envDir = directory + '/results/empty-environment'; mkdirSync(envDir, { recursive: true });
await build({ configFile: false, root: directory, publicDir: root + '/frontend/public', envDir, mode: 'production',
  define: { __CRYPTOID_RELEASE__: JSON.stringify('ISOLATED COMPONENT UPDATE CHECK'), __CRYPTOID_BUILD__: JSON.stringify({}) },
  resolve: { dedupe: ['react', 'react-dom'], alias: {
    react: root + '/frontend/node_modules/react', 'react-dom': root + '/frontend/node_modules/react-dom',
  } },
  plugins: [{ name: 'exact-paired-local-style-components', enforce: 'pre',
    resolveId(source, importer) {
      if (source.startsWith('qa-local-style:')) {
        const c = source.slice('qa-local-style:'.length); assert.ok(['control', 'leaves'].includes(c));
        return root + '/frontend/src/pages/BossHullView.tsx?qaLocalStyle=' + c;
      }
      if (source === './BossReactorView' && importer?.includes('BossHullView.tsx?qaLocalStyle='))
        return root + '/frontend/src/pages/BossReactorView.tsx?qaLocalStyle=' + importer.split('qaLocalStyle=')[1];
    },
    transform(code, id) {
      const [path, query] = id.split('?');
      if (!query?.startsWith('qaLocalStyle=')) return;
      const name = path.split('/').at(-1).slice(0, -4); assert.ok(names.includes(name));
      const condition = query.slice('qaLocalStyle='.length), transformed = localStyleSource(code, name, condition);
      const blob = createHash('sha1').update('blob ' + Buffer.byteLength(transformed) + '\0').update(transformed).digest('hex');
      assert.equal(blob, expected[condition].transformedBlobs[name]);
      observedTransforms.set(condition + '/' + name, blob); return transformed;
    },
  }, react()],
  build: { outDir: output, emptyOutDir: true, sourcemap: false },
});
assert.deepEqual([...observedTransforms.keys()].sort(), ['control/BossHullView', 'control/BossReactorView', 'leaves/BossHullView', 'leaves/BossReactorView'],
  'Both actual Hull imports must resolve their own declared Reactor condition');
const result = { version: 1, sourceCommit: git('rev-parse', 'HEAD'), sourceTree: git('rev-parse', 'HEAD^{tree}'),
  componentProofs: proofs, observedCompilerTransforms: Object.fromEntries(observedTransforms), cssBlob: git('hash-object', 'frontend/src/index.css'),
  actualInstalledPackages: Object.fromEntries(['react', 'react-dom', 'vite', 'typescript'].map(n => [n, require(n + '/package.json').version])),
  lockSha256: createHash('sha256').update(readFileSync(root + '/frontend/yarn.lock')).digest('hex'),
  componentInputTestOnly: true, originalCssRetained: true, syntheticInputSequence: true,
  validationContract: 2, inlineHeightCheck: 'exact-engine-cssom-serialization', nativeHeightCheck: 'exact-control-candidate-equality',
  normalization: ['paired React useId prefixes', 'declared thrust/charge property redistribution', 'empty style only on charge consumers after removing declared opacity'],
  gameControllerStarted: false, gameClockStarted: false, liveBackend: false, authentication: false, payments: false,
  physicalDevice: false, runtimeSourceFilesEdited: false, whiteScreenFixed: false };
writeFileSync(output + '/build-info.json', JSON.stringify(result, null, 2) + '\n');
console.log('CRYPTOID_DYNAMIC_COMPONENT_BUILD ' + JSON.stringify({ sourceCommit: result.sourceCommit, exactPreviouslyMeasuredCandidate: true,
  gameControllerStarted: false, runtimeSourceFilesEdited: false, whiteScreenFixed: false }));
