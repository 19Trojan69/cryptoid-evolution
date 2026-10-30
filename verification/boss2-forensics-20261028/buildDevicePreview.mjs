import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { root, BASELINE, baselineController } from './fixture.mjs';
import { deviceController, deviceBoss, deviceHtml } from './devicePreviewTransform.mjs';
import { canvasEffectControl, canvasEffectControlEnabled } from '../boss2-canvas-effect-control-20261030/canvasControl.mjs';
import { flatSceneEnabled, flatVisualModule, flatGameScene, diagnosticSceneName } from '../boss2-flat-scene-control-20261030/flatTransform.mjs';
assert.equal(process.env.VERCEL_ENV, 'preview', 'Protected Preview only; production builds are denied');
const require = createRequire(root + '/frontend/package.json');
const { build } = require('vite'), react = require('@vitejs/plugin-react').default;
const directory = resolve(root, 'verification/boss2-forensics-20261028');
const output = resolve(root, 'verification/boss2-forensics-20261028/results/device-preview/site');
const original = readFileSync(root + '/frontend/src/pages/GamePage.tsx', 'utf8');
// Vercel's shallow source checkout need not contain an ancestor's tree. Keep
// the exact whole-source pin; do not turn a missing ancestor into a weak check.
assert.equal(createHash('sha256').update(baselineController(original)).digest('hex'),
  '625fecc2cb959e4ed4ba690f7867d0a07b247b9a136a8ce308afecaf6dcd94fa', 'Exact released controller fingerprint');
const git = ref => execFileSync('git', ['rev-parse', ref], { cwd: root, encoding: 'utf8' }).trim();
const identity = { sourceCommit: process.env.VERCEL_GIT_COMMIT_SHA || git('HEAD'), sourceTree: git('HEAD^{tree}'),
  workingTreeDirty: !!execFileSync('git', ['status', '--porcelain'], { cwd: root, encoding: 'utf8' }).trim(),
  diagnosticCanvasEffects: canvasEffectControlEnabled() ? 'existing-original-impact-fallback' : 'original-canvas-renderer',
  diagnosticScene: diagnosticSceneName() };
execFileSync(process.execPath, ['--experimental-strip-types', 'scripts/buildPaintedHulls.mjs'], { cwd: root + '/frontend', stdio: 'inherit' });
for (const key of Object.keys(process.env)) if (key.startsWith('VITE_')) delete process.env[key];
const envDir = resolve(directory, 'results/device-preview/empty-environment'); mkdirSync(envDir, { recursive: true });
await build({ configFile: false, root: root + '/frontend', envDir, mode: 'production',
  define: { __CRYPTOID_RELEASE__: JSON.stringify('PRIVATER BOSS-2-TEST'), __CRYPTOID_BUILD__: JSON.stringify(identity), 'import.meta.env.VITE_CRYPTOID_DIAGNOSTICS': '"0"' },
  resolve: { dedupe: ['react', 'react-dom', 'react-router-dom', 'axios'], alias: { '@mui/styled-engine': root + '/frontend/node_modules/@mui/styled-engine-sc' } },
  plugins: [react(), { name: 'isolated-device-boss2', enforce: 'pre', transform(code, id) {
    const path = id.split('?')[0];
    if (path === root + '/frontend/src/App.tsx') return `export { default } from ${JSON.stringify(directory + '/devicePreviewApp.jsx')};`;
    if (path === root + '/frontend/src/pages/GamePage.tsx') return deviceController(flatSceneEnabled() ? flatGameScene(code) : code);
    if (flatSceneEnabled()) { const visual = flatVisualModule(path); if (visual) return visual; }
    if (path === root + '/frontend/src/pages/CanvasEffects.tsx' && canvasEffectControlEnabled()) return canvasEffectControl(code);
    if (path === root + '/frontend/src/pages/sectorBoss.ts') return deviceBoss(code);
    if (path === root + '/frontend/src/hooks/useAuth.ts') return `export { useAuth } from ${JSON.stringify(directory + '/devicePreviewAuth.mjs')};`;
    if (path === root + '/frontend/src/lib/axiosClient.ts') return `export * from ${JSON.stringify(directory + '/devicePreviewTransport.mjs')};`;
    if (path === root + '/frontend/src/lib/aggregateUsage.ts') return 'export async function startAggregateUsage() {}';
  }, transformIndexHtml: { order: 'post', handler: deviceHtml } }],
  build: { outDir: output, emptyOutDir: true, sourcemap: false } });
writeFileSync(output + '/device-preview-sdk.js', `window.Pi={init(){},getPiHostAppInfo:async()=>({hostApp:'web'}),authenticate:async()=>{throw Error('Private guest test only')},signIn:async()=>{throw Error('Private guest test only')},createPayment(){throw Error('Payments disabled')}};\n`);
writeFileSync(output + '/robots.txt', 'User-agent: *\nDisallow: /\n');
writeFileSync(output + '/device-preview-info.json', JSON.stringify({ type: 'protected-isolated-boss2-device-preview', ...identity,
  controllerSha256: createHash('sha256').update(original).digest('hex'), normalizedControllerSha256: createHash('sha256').update(baselineController(original)).digest('hex'),
  actualPiAuthentication: false, liveBackend: false, realAccounts: false, payments: false, automaticUpload: false,
  guestOnly: true, syntheticDiagnosticCapability: true, collisionProtectionOptional: true, bossHealthFloorOptional: .4,
  singleFingerControls: true, controlsRequireFreshTap: true, contactDiagnostics: true, contactCaptureBeforeReact: true,
  contactObservationLimits: { pointerIdsHeldOnlyInMemory: 10, ordinaryPerSecond: 16, criticalPerSecond: 8, rawContactFieldsExported: false },
  nativeGameClocks: true, automaticResume: false, reloadOpensMenu: true, explicitMenuPreparation:true,initialSetupPause:true,
  coldDirectWebkitStartup:'Unresolved loop-stall before first frame; retained separately. Prepared start is a different condition.',
  sourceGameEditedByBuilder: false, buildOnlyTransforms: ['isolated menu/auth/transport', 'direct boss seed', 'optional protection/health floor', 'bounded pause observation'],
  nativeDeviceAccepted: false, whiteScreenFixed: false }, null, 2) + '\n');
console.log('CRYPTOID_DEVICE_PREVIEW_BUILD ' + JSON.stringify({ ...identity, output }));
