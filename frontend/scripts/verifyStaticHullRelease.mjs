// Read-only official Testnet verification. Never access Mainnet or account data.
import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { staticHullAsset } from '../src/pages/staticHullAssets.ts';
import { paintedHullRevision } from '../src/generated/paintedHullManifest.ts';

const directory = new URL('../../docs/static-hull-release-20261022/', import.meta.url);
const after = JSON.parse(await readFile(new URL('after.json', directory), 'utf8'));
const digest = value => createHash('sha256').update(value).digest('hex');
const modules = await Promise.all(after.chunks.map(async item => {
  const response = await fetch('https://cryptoid-evolution-testnet.vercel.app' + item.path,
    { signal: AbortSignal.timeout(20000) });
  assert.equal(response.status, 200);
  const text = await response.text();
  assert.equal(digest(text), item.sha256);
  return { path: item.path, text };
}));
const game = modules.find(item => /GamePage-/.test(item.path))?.text ?? '';
const audio = modules.find(item => /performanceDiagnostics-/.test(item.path))?.text ?? '';
const features = {
  matchingStaticRevision: game.includes(paintedHullRevision) && game.includes('/ships/painted/'),
  removedOldHullEncoder: !game.includes('Ship encoding failed') && game.includes('Painted ship image unavailable'),
  decodedByteAccounting: /\.bytes\+\w+\.naturalWidth\*\w+\.naturalHeight\*4/.test(game),
  decodeBeforeCache: /typeof \w+\.decode={2,3}"function"&&await \w+\.decode\(\)/.test(game),
  staticUrlCacheBudget: /new \w+\(24,12\*1024\*1024,\(\)=>\{\},6\)/.test(game),
  effectsPublishConnectedGraph: /\.connect\(\w+\.destination\),this.effectsBus=\w+,this.limiter=\w+\}catch/.test(audio),
  effectsFailedGraphDisconnects: /\}catch\{try\{\w+\?\.disconnect\(\)\}catch\{\}try\{\w+\?\.disconnect\(\)\}catch\{\}return \w+\("effects-resume-failed"\),!1/.test(audio),
  musicReadinessGate: audio.includes('this.graphReady&&this.context.state==="running"'),
  musicRetainsFailedBoundGraph: /return this.mediaSource=\w+,this.gain=\w+,this.audio.pause\(\),!1/.test(audio),
  musicGainAllocatedBeforeBinding: /try\{return \w+\?\?=\w+\.createGain\(\),[^}]+\w+\?\?=\w+\.createMediaElementSource\(this.audio\)/.test(audio),
};
for (const [name, passed] of Object.entries(features)) assert.ok(passed, name);
// Six representative files across the complete sprite/stage range, including legacy colours.
// All 1740 local production outputs have separately been checked byte-for-byte.
const selections = [[0, 'gold', 1], [3, 'silver', 2], [7, 'ruby', 3],
  [11, 'metallic-blue', 1], [15, 'pink', 2], [19, 'white', 3]];
const files = await Promise.all(selections.map(async ([sprite, color, stage]) => {
  const asset = staticHullAsset(sprite, color, stage);
  assert.ok(asset);
  const response = await fetch('https://cryptoid-evolution-testnet.vercel.app' + asset.url,
    { signal: AbortSignal.timeout(20000) });
  assert.equal(response.status, 200);
  assert.match(response.headers.get('content-type') ?? '', /image\/png/);
  const bytes = Buffer.from(await response.arrayBuffer());
  const expected = await readFile(new URL('../dist' + asset.url, import.meta.url));
  assert.equal(bytes.length, asset.bytes);
  assert.equal(digest(bytes), digest(expected));
  assert.equal(bytes.readUInt32BE(16), 282); assert.equal(bytes.readUInt32BE(20), 282);
  return { path: asset.url, status: response.status, bytes: bytes.length, sha256: digest(bytes), width: 282, height: 282 };
}));
const result = { at: new Date().toISOString(), features, staticFiles: files,
  moduleHashesMatchRelease: true,
  limits: 'Six served PNGs, delivered features and source identity. Not iPhone audio, native memory, FPS or White Screen proof.' };
await writeFile(new URL('static-features.json', directory), JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify(result, null, 2));
