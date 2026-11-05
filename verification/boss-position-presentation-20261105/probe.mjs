import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { positionStyle } from './position.mjs';
import { transform, originalBlob } from './transform.mjs';
const root = resolve(new URL('../..', import.meta.url).pathname);
const require = createRequire(root + '/verification/boss2-forensics-20261028/package.json');
const playwright = require('playwright');
const engine = process.argv[2];
assert.ok(['chromium', 'webkit'].includes(engine));
const source = readFileSync(root + '/frontend/src/pages/BossHullView.tsx', 'utf8');
const changed = transform(source);
const result = { version: 1, engine, complete: false, base: 'b092f6462a623c3ad2c12e634963028d462c5fcf',
  source: process.env.GITHUB_SHA || null, originalBossBlob: originalBlob,
  virtualBossSha256: createHash('sha256').update(changed).digest('hex'),
  geometryFixtureOnly: true, actualGameLoaded: false, physicalDeviceTest: false,
  fullArtworkVerified: false, nativeMemoryMeasured: false, whiteScreenFixed: false };
let browser;
try {
  browser = await playwright[engine].launch({ headless: true });
  result.browserVersion = browser.version();
  const page = await browser.newPage({ viewport: { width: 430, height: 825 }, deviceScaleFactor: 3 });
  await page.setContent('<!doctype html><style>body{margin:0}.owner{position:absolute;left:13.21px;top:7.17px;width:430px;height:825px}.item{position:absolute;box-sizing:border-box;width:233.37px;height:347.21px;transform:translate(-50%,-50%);background:linear-gradient(35deg,#07356a,#6fd0fa);border:1px solid white}.item>i{position:absolute;left:23.7%;top:19.2%;width:33.33%;height:47.77%;background:#aa6509}</style><div class="owner"><div class="item" id="original"><i></i></div><div class="item" id="candidate"><i></i></div></div>');
  result.geometry = await page.evaluate(({ position }) => {
    const move = (0, eval)('(' + position + ')');
    const a = document.querySelector('#original'), b = document.querySelector('#candidate');
    const fields = ['x', 'y', 'width', 'height', 'top', 'right', 'bottom', 'left'];
    const transforms = ['translate(-50%, -50%)', 'translate(-50%, -50%) rotate(17deg)', 'translate(-50%, -50%) translateY(43.21px)', 'translate(-50%, -50%) perspective(420px) rotateY(6deg)'];
    const summary = { cases: 0, exact: 0, maxDifference: 0, firstMismatch: null };
    const coordinates = [-400.337, -1.1, -0.1, -0.015625, 0, 0.001, 0.009, 0.015625, 0.1, 1.1, 13.21, 215.37, 429.998, 1000.123];
    for (let i=0; i<160; i++) coordinates.push(Math.sin(i*1.731)*410 + 215);
    for (const transform of transforms) for (let i=0;i<coordinates.length;i++) {
      const x=coordinates[i], y=coordinates[(i*7+3)%coordinates.length];
      a.style.transform=b.style.transform=transform;
      a.style.left=x+'px';a.style.top=y+'px';
      const baseline=[a,a.firstElementChild].map(node=>{const r=node.getBoundingClientRect();return fields.map(k=>r[k]);});
      {
        const style=move(x,y);
        b.style.left=style.left+'px';b.style.top=style.top+'px';b.style.translate=style.translate;
        const candidate=[b,b.firstElementChild].map(node=>{const r=node.getBoundingClientRect();return fields.map(k=>r[k]);});
        const difference=Math.max(...baseline.flat().map((v,index)=>Math.abs(v-candidate.flat()[index])));
        const row=summary;row.cases++;row.maxDifference=Math.max(row.maxDifference,difference);
        if(difference===0)row.exact++;else if(!row.firstMismatch)row.firstMismatch={x,y,transform,baseline,candidate};
      }
    }
    a.remove();b.remove();
    return { ...summary, candidateExact:summary.exact===summary.cases };
  }, { position: positionStyle.toString() });
  // No footprint test is valid until native geometry agrees exactly.
  if (engine==='chromium' && result.geometry.candidateExact) {
    const session=await page.context().newCDPSession(page);await session.send('Performance.enable');
    const metrics=async()=>Object.fromEntries((await session.send('Performance.getMetrics')).metrics.map(x=>[x.name,x.value]));
    const baseline=await metrics();
    const run=async condition=>page.evaluate(({condition})=>{
      const node=document.createElement('div');
      node.className='item';document.querySelector('.owner').appendChild(node);
      let checksum=0;
      for(let i=0;i<600;i++){const x=215+Math.sin(i*.11)*80,y=230+Math.cos(i*.17)*60;
        if(condition==='original'){node.style.left=x+'px';node.style.top=y+'px';}
        else {node.style.left=node.style.top='0px';node.style.translate=x+'px '+y+'px';}
        checksum+=node.getBoundingClientRect().x;
      }node.remove();return checksum;
    },{condition});
    await run('original');const middle=await metrics();await run('translate');const end=await metrics();
    const delta=(a,b)=>({LayoutCount:b.LayoutCount-a.LayoutCount,RecalcStyleCount:b.RecalcStyleCount-a.RecalcStyleCount});
    result.fixtureLayoutWork={stepsPerArm:600,forcedReadsForDiagnosticOnly:true,original:delta(baseline,middle),translate:delta(middle,end)};
    await session.detach();
  }
  result.complete=result.geometry.candidateExact;
} catch(error) { result.error={name:error.name,message:error.message,stack:error.stack}; }
finally {
  if(browser)await browser.close();
  const out=root+'/verification/boss-position-presentation-20261105/results';mkdirSync(out,{recursive:true});
  writeFileSync(out+'/'+engine+'.json',JSON.stringify(result,null,2)+'\n');
  console.log(JSON.stringify(result));
}
if(!result.complete)process.exitCode=1;
