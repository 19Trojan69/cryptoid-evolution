import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {stripTypeScriptTypes} from 'node:module';
import {createHash} from 'node:crypto';
export const root=new URL('../../',import.meta.url).pathname.replace(/\/$/,'');
export const BASE='87f5dc28d1cb5054c0e40420848068eb0a156e56';
const renderer='frontend/src/pages/bossWeaponRenderer.ts';
export const original=execFileSync('git',['show',BASE+':'+renderer],{cwd:root,encoding:'utf8'});
export const candidate=readFileSync(root+'/'+renderer,'utf8');
const strip=s=>stripTypeScriptTypes(s,{mode:'strip'}).replace(/^import .*;\n/gm,'').replace(/\bexport /g,'');
const weapons=readFileSync(root+'/frontend/src/pages/bossWeapons.ts','utf8');
const manifest=readFileSync(root+'/frontend/src/pages/bossManifest.ts','utf8');
const heat=readFileSync(root+'/frontend/src/pages/bossTurretHeat.ts','utf8');
export function code(source){return `(()=>{${strip(weapons)}\n${strip(manifest)}\n${strip(heat)}\n${strip(source)}\nreturn {bossManifest,bossWeapons,drawBossWeapons,disposeBossWeapons,releaseBossWeaponSources,weaponCanvasSize};})()`;}
export const hashes={originalSha256:createHash('sha256').update(original).digest('hex'),candidateSha256:createHash('sha256').update(candidate).digest('hex')};
export function scope(){
 // Sparse local checkouts can have unstaged missing files; authoritative CI has
 // a complete checkout. Compare every committed source tree except this file.
 const actual=execFileSync('git',['ls-tree','-r','HEAD','frontend'],{cwd:root,encoding:'utf8'}).split('\n').filter(s=>s&&!s.endsWith('\t'+renderer));
 const before=execFileSync('git',['ls-tree','-r',BASE,'frontend'],{cwd:root,encoding:'utf8'}).split('\n').filter(s=>s&&!s.endsWith('\t'+renderer));
 assert.deepEqual(actual,before,'Only the weapon renderer may differ in frontend');
 for(const path of ['backend','api','assets','private-preview','vercel.json'])assert.equal(execFileSync('git',['rev-parse','HEAD:'+path],{cwd:root,encoding:'utf8'}),execFileSync('git',['rev-parse',BASE+':'+path],{cwd:root,encoding:'utf8'}));
 assert.equal(JSON.parse(execFileSync('git',['show','HEAD:vercel.json'],{cwd:root,encoding:'utf8'})).git.deploymentEnabled,false);
 return {sourceCommit:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),sourceTree:execFileSync('git',['rev-parse','HEAD^{tree}'],{cwd:root,encoding:'utf8'}).trim(),...hashes};
}
