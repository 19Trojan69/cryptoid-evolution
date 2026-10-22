// Read-only public Testnet release checks; retain only response hashes/counters.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { staticHullAsset } from '../src/pages/staticHullAssets.ts';
import { paintedHullRevision } from '../src/generated/paintedHullManifest.ts';

const [phase, commit, tree] = process.argv.slice(2);
assert.ok(['before', 'after'].includes(phase));
assert.match(commit, /^[a-f0-9]{40}$/); assert.match(tree, /^[a-f0-9]{40}$/);
const base = 'https://cryptoid-evolution-testnet.vercel.app';
const out = new URL('../../docs/canvas-static-url-release-20261022/', import.meta.url);
fs.mkdirSync(out, { recursive: true });
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
async function get(path) {
  const response = await fetch(base + path, { signal: AbortSignal.timeout(20000) });
  const bytes = Buffer.from(await response.arrayBuffer());
  return { path, status: response.status, bytes: bytes.length, sha256: sha(bytes), text: bytes.toString('utf8') };
}
const responses = await Promise.all(['/', '/api', '/api/admin/status',
  '/api/leaderboard/top?rules=1', '/api/leaderboard/top?rules=2', '/api/leaderboard/top?rules=3'].map(get));
assert.equal(responses[0].status, 200); assert.equal(responses[1].status, 200); assert.equal(responses[2].status, 401);
const entry = responses[0].text.match(/<script[^>]*src="(\/assets\/[^" ]+\.js)"/)?.[1]; assert.ok(entry);
const main = await get(entry); assert.equal(main.status, 200);
const paths = [...new Set(main.text.match(/assets\/(?:GamePage|AdminPage|powerUps|performanceDiagnostics|reloadDiagnostics|shipEvolution)-[A-Za-z0-9_-]+\.js/g) ?? [])];
const modules = await Promise.all(paths.map(path => get('/' + path)));
assert.equal(modules.length, 6);
const result = { at: new Date().toISOString(), phase, expectedSource: commit, expectedTree: tree, entry,
  results: responses.map(({ text, ...item }) => item),
  chunks: modules.map(({ text, ...item }) => ({ ...item, sourceIdentity: text.includes(commit), treeIdentity: text.includes(tree) })) };
for (const module of result.chunks) {
  assert.equal(module.status, 200);
  if (/GamePage|AdminPage/.test(module.path)) assert.ok(module.sourceIdentity && module.treeIdentity, module.path);
}
const game = modules.find(module => /GamePage-/.test(module.path)).text;
const requestedKeyGuard = /sourceUrl===[\w$]+&&[\w$]+\.scale===[\w$]+\.scale&&[\w$]+\.generation===[\w$]+/.test(game);
const reflectedSourceGuard = /hull\?\.src===/.test(game);
result.canvasReadiness = { requestedKeyGuard, reflectedSourceGuard,
  requestedKeyBundles: (game.match(/sourceUrl:[\w$]+,hull:/g) ?? []).length,
  matchingStaticRevision: game.includes(paintedHullRevision) && game.includes('/ships/painted/'),
  noTestHost: !game.includes('url-aware-native-hook-host') && !game.includes('Actual Canvas/style hook integration did not settle') };
assert.equal(result.canvasReadiness.matchingStaticRevision, true); assert.equal(result.canvasReadiness.noTestHost, true);
if (phase === 'before') {
  assert.equal(requestedKeyGuard, false); assert.equal(reflectedSourceGuard, true);
} else {
  assert.equal(requestedKeyGuard, true); assert.equal(reflectedSourceGuard, false);
  assert.equal(result.canvasReadiness.requestedKeyBundles, 2);
  const before = JSON.parse(fs.readFileSync(new URL('before.json', out), 'utf8'));
  assert.deepEqual(result.results.slice(1), before.results.slice(1), 'API and three leaderboard response hashes must match baseline');
  result.apiAndScoresEqual = true;
  const selections = [[0, 'gold', 1], [3, 'silver', 2], [7, 'ruby', 3],
    [11, 'metallic-blue', 1], [15, 'pink', 2], [19, 'white', 3]];
  result.staticFiles = await Promise.all(selections.map(async ([sprite, color, stage]) => {
    const asset = staticHullAsset(sprite, color, stage), response = await fetch(base + asset.url, { signal: AbortSignal.timeout(20000) });
    assert.equal(response.status, 200); assert.match(response.headers.get('content-type') ?? '', /image\/png/);
    const bytes = Buffer.from(await response.arrayBuffer()), expected = fs.readFileSync(new URL('../dist' + asset.url, import.meta.url));
    assert.equal(sha(bytes), sha(expected)); assert.equal(bytes.length, asset.bytes);
    assert.equal(bytes.readUInt32BE(16), 282); assert.equal(bytes.readUInt32BE(20), 282);
    return { path: asset.url, status: response.status, bytes: bytes.length, sha256: sha(bytes), width: 282, height: 282 };
  }));
  for (const name of ['memory-work', 'reactor-work', 'projectile-work', 'frame-pacing']) {
    const page = await get('/scripts/fixtures/' + name + '.html');
    assert.ok(!/id="(?:memory|reactor|projectile)-qa"|Native 60-Hz-Animationspr/.test(page.text), 'production excludes ' + name);
  }
  result.productionQaExcluded = true;
}
result.limits = 'Delivered source/guard, six PNG responses and API hashes. No physical iPhone memory, audio, FPS or final White Screen proof.';
fs.writeFileSync(new URL(phase + '.json', out), JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify(result, null, 2));
