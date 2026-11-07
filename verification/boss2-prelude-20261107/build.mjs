import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const lab = new URL('../memory-monitor-lab-20261106/', import.meta.url);
const original = readFileSync(new URL('build.mjs', lab), 'utf8');
const anchor = 'return controller(code);';
const replacement = `return instrumentPrelude(controller(code));
   if(path===root+'/frontend/src/pages/bossWeaponTextures.ts')return instrumentWeaponAtlas(code);`;
const importLine = 'import { instrumentPrelude, instrumentWeaponAtlas } from "../boss2-prelude-20261107/instrument.mjs";\n';
assert.equal(original.split(anchor).length, 2);
const testBuild = importLine + original.replace(anchor, replacement);
assert.equal(testBuild.slice(importLine.length).replace(replacement, anchor), original);

// Keep the shipped builder and frontend untouched. This temporary entry
// point exists only on the isolated test runner.
const entry = fileURLToPath(new URL(`build.prelude.${process.pid}.mjs`, lab));
writeFileSync(entry, testBuild, { flag: 'wx' });
try {
  execFileSync(process.execPath, [entry], { stdio: 'inherit' });
} finally {
  unlinkSync(entry);
}
