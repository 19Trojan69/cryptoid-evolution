// Read-only public Testnet evidence; run after the existing release checks.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
const dir = new URL('../../docs/audio-clock-release-20261021/', import.meta.url);
const after = JSON.parse(fs.readFileSync(new URL('after.json', dir), 'utf8'));
const modules = await Promise.all(after.chunks.map(async ({ path }) => {
  const response = await fetch('https://cryptoid-evolution-testnet.vercel.app' + path, { signal: AbortSignal.timeout(20000) });
  assert.equal(response.status, 200);
  const text = await response.text();
  return { path, text, sha256: createHash('sha256').update(text).digest('hex') };
}));
for (const module of modules) assert.equal(module.sha256, after.chunks.find(c => c.path === module.path).sha256);
const runtime = modules.find(c => /performanceDiagnostics-/.test(c.path))?.text ?? '';
const game = modules.find(c => /GamePage-/.test(c.path))?.text ?? '';
const admin = modules.find(c => /AdminPage-/.test(c.path))?.text ?? '';
const reload = modules.find(c => /reloadDiagnostics-/.test(c.path))?.text ?? '';
const fields = ['audioClockMs', 'audioClockStalls', 'audioRecoveries', 'audioBlockedSounds', 'audioReapedVoices'];
const features = {
  foregroundClockWindow: runtime.includes('unchangedSince>=2e3') && runtime.includes('visibilityState!=="hidden"') && runtime.includes('this.lastAt>1e3'),
  coalescedSameContextRecovery: runtime.includes(',this.pending)return this.pending') && runtime.includes('.suspend().then(async()=>') && runtime.includes('this.generation'),
  scheduledEndFallback: runtime.includes('.endsAt+1') && runtime.includes('this.reapedVoices'),
  pauseReleasesFadingWeapons: /this\.clockHealth\.pause\(\);for\(const (\w+) of\[\.\.\.this\.weaponMixVoices\]\)\{try\{\1\.source\.stop\(\)\}catch\{\}this\.releaseWeaponVoice\(\1\)/.test(runtime),
  silentMusicPause: runtime.includes('this.pauseMuted=!0') && runtime.includes('.gain.value=0'),
  pendingMusicRecoveryShared: runtime.includes('if(this.playRequest&&this.clockHealth.blocked)return this.playRequest'),
  staleMusicEpoch: runtime.includes('!==this.playbackEpoch') && runtime.includes('this.playbackEpoch++'),
  ownerFieldsDeliveredAndSanitized: fields.every(f => [runtime, game, admin, reload].every(s => s.includes(f)))
};
for (const [feature, passed] of Object.entries(features)) assert.ok(passed, 'delivered audio feature ' + feature);
const result = { at: new Date().toISOString(), features, moduleHashesMatchRelease: true };
fs.writeFileSync(new URL('audio-features.json', dir), JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify(result, null, 2));
