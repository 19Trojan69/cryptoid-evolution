// Public read-only Testnet verification. Never contact Mainnet or account APIs.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
const phase=process.argv[2],commit=process.argv[3],tree=process.argv[4];
assert.ok(['before','after'].includes(phase));
const base='https://cryptoid-evolution-testnet.vercel.app';
const out=new URL('../../docs/normal-memory-release-20261021/',import.meta.url);
fs.mkdirSync(out,{recursive:true});
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
async function get(path){const r=await fetch(base+path,{signal:AbortSignal.timeout(20000)});const bytes=Buffer.from(await r.arrayBuffer());return {path,status:r.status,bytes:bytes.length,sha256:sha(bytes),text:bytes.toString('utf8')};}
const paths=['/','/api','/api/admin/status','/api/leaderboard/top?rules=1','/api/leaderboard/top?rules=2','/api/leaderboard/top?rules=3'];
const responses=await Promise.all(paths.map(get));
const entry=responses[0].text.match(/<script[^>]*src="(\/assets\/[^" ]+\.js)"/)?.[1];assert.ok(entry);
assert.equal(responses[0].status,200);assert.equal(responses[2].status,401);
const result={at:new Date().toISOString(),entry,results:responses.map(({text,...item})=>item)};
if(phase==='after'){
  const before=JSON.parse(fs.readFileSync(new URL('before.json',out),'utf8'));
  assert.deepEqual(result.results.slice(1),before.results.slice(1),'API and leaderboard responses preserved');
  assert.match(commit,/^[a-f0-9]{40}$/);assert.match(tree,/^[a-f0-9]{40}$/);
  const main=await get(entry),chunks=[...new Set(main.text.match(/assets\/(?:GamePage|AdminPage|powerUps)-[A-Za-z0-9_-]+\.js/g)??[])];
  assert.ok(chunks.length>=2);const modules=await Promise.all(chunks.map(p=>get('/'+p)));
  result.chunks=modules.map(({text,...item})=>({...item,sourceIdentity:text.includes(commit),treeIdentity:text.includes(tree)}));
  for(const r of result.chunks.filter(r=>/GamePage|AdminPage/.test(r.path)))assert.ok(r.sourceIdentity&&r.treeIdentity,`delivered identity ${r.path}`);
  const game=modules.find(r=>/GamePage-/.test(r.path))?.text??'';
  const weapons=modules.find(r=>/powerUps-/.test(r.path))?.text??'';
  result.deliveredMemoryFeatures={
    normalRasterCap:/Number\.isFinite\(\w+\)&&\w+>0\?Math\.min\(1\.5,\w+\):1/.test(weapons),
    bossUsesNormalCap:/\w+\(window\.devicePixelRatio\),\w+=Math\.ceil\(\w+\.width\*\w+\)/.test(weapons),
    effectUsesSharedCap:/\w+=\(\)=>\w+\(window\.devicePixelRatio\)/.test(game),
    paintedCache24Entries12MiB6Unused:/new \w+\(24,12\*1024\*1024,\w+=>URL\.revokeObjectURL\(\w+\),6\)/.test(game),
    twoUnusedHulls:/for\(;\w+>2&&\w+\(\);\)\w+--/.test(game),
    textureTrimProtectsConsumers:/if\(!\(\w+\.size\|\|\w+\.size\)\)for/.test(game),
    fourWarmTextures:/if\(\w+\.size<=4\)break/.test(game),
    retiredCanvasZeroed:/\w+\.canvas\.width=\w+\.canvas\.height=0/.test(game)
  };
  for(const [name,passed] of Object.entries(result.deliveredMemoryFeatures))assert.ok(passed,`delivered feature ${name}`);
  const qa=await Promise.all(['memory-work','reactor-work','projectile-work','frame-pacing'].map(p=>get('/scripts/fixtures/'+p+'.html')));
  for(const r of qa)assert.ok(!/id="(?:memory|reactor|projectile)-qa"|Native 60-Hz-Animationspr/.test(r.text),`production excludes ${r.path}`);
  result.productionQaExcluded=true;result.apiAndScoresEqual=true;
}
fs.writeFileSync(new URL(phase+'.json',out),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result,null,2));
