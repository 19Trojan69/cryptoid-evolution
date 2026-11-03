import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
const [candidateArg, outputArg] = process.argv.slice(2);
const candidate = resolve(candidateArg), output = resolve(outputArg);
mkdirSync(output, { recursive: true });
const sha256 = text => createHash('sha256').update(text).digest('hex');
const git = args => execFileSync('git', args, { cwd: candidate, encoding: 'utf8' }).trim();
assert.equal(git(['rev-parse', 'HEAD']), 'ac98e95166b0e2013186257904da46323840dab5');
const original = execFileSync('git', ['show', 'HEAD:frontend/src/index.css'], { cwd: candidate, encoding: 'utf8' });
const changed = readFileSync(resolve(candidate, 'frontend/src/index.css'), 'utf8');
assert.deepEqual(git(['diff','--name-only']).split('\n'), ['frontend/src/index.css']);
const lines = original.split('\n');
const at = lines.findIndex(line => line.startsWith('@media (max-width: 700px) { .starfield'));
assert.ok(at >= 0 && lines[at].includes('.game-hud { backdrop-filter: none; }'));
assert.ok(lines[at + 1].startsWith('.game-hud {') && lines[at + 1].includes('backdrop-filter: blur(10px)'));
const expected = [...lines]; [expected[at], expected[at + 1]] = [expected[at + 1], expected[at]];
assert.equal(changed, expected.join('\n'), 'Only move the unchanged mobile rule after the unchanged base rule');
const main = readFileSync(resolve(candidate, 'frontend/src/main.tsx'), 'utf8');
const paths = [...main.matchAll(/import '\.\/([^']+\.css)'/g)].map(match => match[1]);
assert.ok(paths.includes('index.css') && paths.includes('hudDepth.css'));
const styles = which => paths.map(path => path === 'index.css' ? which : readFileSync(resolve(candidate,'frontend/src',path),'utf8')).join('\n');
const markup = '<main class="game-route"><div class="game-shell"><div class="game-field"><header class="game-hud"><span class="hud-stat">LEVEL 2</span><span class="hud-stat score-hud">SHARDS 120</span></header></div></div></main>';
const require = createRequire(resolve(process.env.RUNNER_TEMP,'cryptoid-fix-tools/package.json'));
assert.equal(require('playwright/package.json').version, '1.62.1');
const {chromium,webkit} = require('playwright');
const results = [];
for (const [engine,type] of [['chromium',chromium],['webkit',webkit]]) {
  const browser = await type.launch({headless:true});
  try {
    for (const width of [390,430,700,701,844,1024]) {
      const page = await browser.newPage({viewport:{width,height:825},deviceScaleFactor:3});
      try {
        await page.route('**/*', route => route.abort());
        const observe = async css => {
          await page.setContent('<style>'+css+'</style>'+markup);
          return page.locator('.game-hud').evaluate(node => {
            const c = getComputedStyle(node), style = {};
            for(const key of c) style[key] = c.getPropertyValue(key);
            const r = node.getBoundingClientRect();
            return {filter:c.backdropFilter,style,box:{x:r.x,y:r.y,width:r.width,height:r.height}};
          });
        };
        const before = await observe(styles(original)), after = await observe(styles(changed));
        assert.equal(before.filter, 'blur(10px)');
        assert.equal(after.filter, width <= 700 ? 'none' : 'blur(10px)');
        for (const value of [before,after]) for (const key of Object.keys(value.style))
          if (key.includes('backdrop-filter')) delete value.style[key];
        assert.deepEqual(after.style,before.style, 'All other computed HUD properties remain identical');
        assert.deepEqual(after.box,before.box,'HUD layout remains identical');
        const result={engine,width,before:before.filter,after:after.filter,otherComputedPropertiesEqual:true,layoutEqual:true};
        results.push(result); console.log('CRYPTOID_HUD_CASCADE '+JSON.stringify(result));
      } finally {await page.close();}
    }
  } finally {await browser.close();}
}
const result={version:1,complete:true,source:'ac98e95166b0e2013186257904da46323840dab5',originalCssSha256:sha256(original),candidateCssSha256:sha256(changed),cases:results,
  fullGameRun:false,physicalAndroid:false,physicalIPhone:false,nativeProcessMemoryMeasured:false,whiteScreenFixed:false,
  limits:['Synthetic HUD fixture using all actual main-entry CSS imports; no game or account starts.',
  'External requests including fonts/images blocked equally; no screenshot or pixel identity claim.',
  'Computed styles/layout verify the cascade repair, not memory reduction or smartphone stability.']};
writeFileSync(resolve(output,'receipt.json'),JSON.stringify(result,null,2)+'\n');
console.log('CRYPTOID_HUD_CASCADE_RESULT '+JSON.stringify(result));
