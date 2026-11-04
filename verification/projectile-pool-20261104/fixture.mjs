import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { createRequire } from 'node:module';
import { transform, proof, digest } from './transform.mjs';

const root = resolve(new URL('../..', import.meta.url).pathname);
const engine = process.argv[2];
assert.ok(['chromium', 'webkit'].includes(engine));
const require = createRequire(root + '/frontend/package.json');
const esbuild = require('esbuild');
const browserRequire = createRequire(root + '/verification/boss2-forensics-20261028/package.json');
const pw = browserRequire('playwright');
const source = readFileSync(root + '/frontend/src/pages/projectilePresentation.ts', 'utf8');
const css = readFileSync(root + '/frontend/src/index.css', 'utf8');
assert.equal(digest(css), 'cf48ca4553ac7fa425f37e84a334acc3fec2f2163b72d31bfe9b35f7d33c27b5');
const scripts = {};
for (const condition of ['control', 'pool']) {
  const result = await esbuild.build({ stdin: { contents: transform(source, condition), loader: 'ts',
    resolveDir: root + '/frontend/src/pages' }, bundle: true, write: false, format: 'iife',
    globalName: 'projectile_' + condition, platform: 'browser' });
  scripts[condition] = result.outputFiles[0].text;
}
const browser = await pw[engine].launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 500, height: 850 } });
  await page.setContent('<style>' + css + '</style><div class="game-field" id="control"></div><div class="game-field" id="pool"></div>');
  await page.addStyleTag({ content: '.game-field {position:absolute!important;left:0!important;top:0!important;width:500px!important;height:850px!important;margin:0!important;}' });
  for (const s of Object.values(scripts)) await page.addScriptTag({ content: s });
  const result = await page.evaluate(async () => {
    const counts = { control: 0, pool: 0 }, samples = [];
    let current = null;
    const create = document.createElement.bind(document);
    document.createElement = function(name, ...args) {
      if (current && name === 'div') counts[current]++;
      return create(name, ...args);
    };
    const hosts = Object.fromEntries(['control', 'pool'].map(k => [k, document.getElementById(k)]));
    const api = {};
    for (const k of ['control', 'pool']) {
      current = k; api[k] = window['projectile_' + k].createProjectilePresentation(hosts[k]);
    }
    current = null;
    const styles = node => [null, '::before', '::after'].map(pseudo => {
      const s = getComputedStyle(node, pseudo);
      return Array.from(s, name => [name, s.getPropertyValue(name)]);
    });
    const state = n => {
      const classes = [undefined, 'light', 'medium', 'heavy', 'elite'];
      const bosses = [undefined, 'lance', 'rapid', 'orb', 'heavy', 'pulse', 'split', 'double', 'burst'];
      const weapons = [undefined, 'laser', 'pulse', 'plasma', 'heavy', 'siege', 'rocket'];
      return { shots: Array.from({ length: 6 }, (_, j) => ({ id: n*20+j, x: 20+j*27+n%41, y: 400-n%211,
        visualLevel: 1+(n+j)%5, empowered: (n+j)%3===0, damage: 3, vx: 0, vy: -10 })),
      enemyShots: Array.from({ length: 6 }, (_, j) => ({ id: n*20+j+10, x: 70+j*28, y: 100+n%211,
        radius: 2+(n+j)%13, vx: n%7-3, vy: 1+j%3,
        enemyClass: classes[(n+j)%classes.length], bossKind: bosses[(n+j)%bosses.length],
        weaponKind: weapons[(n+j)%weapons.length], weaponColor: (n+j)%2 ? '#e94578' : '#52f3d4',
        weaponWidth: 2+(n+j)%7 })) };
    };
    const compare = (label, expected) => {
      const a = [...hosts.control.querySelectorAll('.player-laser,.enemy-laser')];
      const b = [...hosts.pool.querySelectorAll('.player-laser,.enemy-laser')];
      if (a.length !== expected || b.length !== expected) throw Error('Visible shot count mismatch: '+label);
      for (let i=0;i<a.length;i++) {
        if (a[i].className !== b[i].className || JSON.stringify(styles(a[i])) !== JSON.stringify(styles(b[i]))) throw Error('Native style mismatch '+label+' #'+i);
        const rect = e => {const r=e.getBoundingClientRect();return [r.x,r.y,r.width,r.height];};
        if (JSON.stringify(rect(a[i])) !== JSON.stringify(rect(b[i]))) throw Error('Geometry mismatch '+label);
        if (a[i].getAnimations({subtree:true}).length || b[i].getAnimations({subtree:true}).length) throw Error('Unexpected authored shot animation; reuse needs a separate restart contract');
      }
      samples.push(label);
    };
    const present = value => {
      const before = JSON.stringify(value);
      for(const k of ['control','pool']) {current=k;api[k].present(value);}
      current=null;
      if (JSON.stringify(value)!==before) throw Error('Presentation changed simulation input');
      if(api.control.size!==value.shots.length+value.enemyShots.length || api.pool.size!==api.control.size) throw Error('Active size changed');
    };
    try {
      for(let n=0;n<2000;n++) {
        const value=state(n); present(value);
        // Same ID survives with mutated position and appearance, without remount.
        if(n%97===0) {
          const old=[...hosts.pool.querySelectorAll('.player-laser,.enemy-laser')];
          for(const s of [...value.shots,...value.enemyShots]) {s.x+=3;s.y-=7;s.visualLevel=5;s.weaponColor='#ffcc43';}
          present(value);
          const next=[...hosts.pool.querySelectorAll('.player-laser,.enemy-laser')];
          if(old.some((node,i)=>node!==next[i]))throw Error('Surviving shot was remounted');
        }
        if(n<64 || n%97===0)compare('frame-'+n,12);
      }
      const normal={...counts};
      if(normal.pool>14 || normal.control!==24002) throw Error('Bounded native creation/reuse proof failed '+JSON.stringify(normal));
      const burst=state(3000);
      for(let i=6;i<100;i++) {burst.shots.push({...burst.shots[0],id:90000+i});burst.enemyShots.push({...burst.enemyShots[0],id:100000+i});}
      present(burst); compare('large-burst',200);
      present({shots:[],enemyShots:[]}); compare('empty',0);
      const before=counts.pool;
      const next=state(3001);
      for(let i=6;i<100;i++) {next.shots.push({...next.shots[0],id:110000+i});next.enemyShots.push({...next.enemyShots[0],id:120000+i});}
      present(next);compare('after-pool-overflow',200);
      if(counts.pool-before!==136)throw Error('Pool retained more/less than its declared 64 detached nodes');
      for(const k of ['control','pool'])api[k].dispose();
      if(hosts.control.children.length || hosts.pool.children.length || api.control.size || api.pool.size)throw Error('Dispose left mounted shots');
      return {complete:true,syntheticNewShots:24000,normalAllocations:normal,comparedFrames:samples,
        nativeComputedMainAndPseudoStylesEqual:true,nativeGeometryEqual:true,simulationInputUnchanged:true,
        noAuthoredShotAnimations:true,survivingNodeIdentityPreserved:true,detachedPoolLimitVerified:64,
        overflowCreatesOnlyMissingNodes:true,disposeUnmountedAll:true};
    } finally {document.createElement=create;}
  });
  const out = root + '/verification/projectile-pool-20261104/results/fixture-' + engine;
  mkdirSync(out, { recursive: true });
  const receipt={...result,engine,engineVersion:browser.version(),playwrightVersion:browserRequire('playwright/package.json').version,
    source:proof(source,'pool'),cssSha256:digest(css),physicalDevice:false,resourceBenefitMeasured:false,whiteScreenFixed:false};
  writeFileSync(out+'/fixture.json',JSON.stringify(receipt,null,2)+'\n');
  console.log('PROJECTILE_POOL_FIXTURE '+JSON.stringify(receipt));
} finally {await browser.close();}
