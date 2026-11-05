import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,unlinkSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {blob} from './transform.mjs';

const root=resolve(new URL('../..',import.meta.url).pathname);
const [kind,engine,condition,replica]=process.argv.slice(2);
assert.ok(['flow','memory'].includes(kind));assert.ok(['chromium','webkit'].includes(engine));
assert.ok(['control','candidate'].includes(condition));assert.ok(['1','2'].includes(replica));
if(kind==='memory')assert.equal(engine,'chromium');
const originalPath=root+'/verification/critical-failure-journal-20261104/run.mjs';
const original=readFileSync(originalPath,'utf8');assert.equal(blob(original),'746ebc727c646c9e405872f3f6a44ca66fe86b6a');
let code=original;const changes=[];
const change=(a,b)=>{assert.equal(code.split(a).length,2,a);code=code.replace(a,b);changes.push([a,b]);};
change("const folder = root+'/verification/critical-failure-journal-20261104';",
 "const folder=root+'/verification/enemy-motion-direct-20261105';");
change("const output = folder+'/results/'+engine+'-flow';",`const output=folder+'/results/${kind}-${engine}-${condition}-r${replica}';`);
change("CRYPTOID_SOAK_SECONDS: '60'",`CRYPTOID_SOAK_SECONDS: '${kind==='memory'?180:60}'`);
let extra=`
change('  result.criticalReportVerified=true;', \`  assert.equal(info.enemyMotionCandidate.condition, '${condition}');
  result.enemyMotionCandidate=info.enemyMotionCandidate;
  result.comparisonReplica=${replica};
  result.internalComparisonOnly=true;
  result.criticalReportVerified=true;\`);
`;
if(kind==='flow')extra+=`
change("import assert from 'node:assert/strict';", "import assert from 'node:assert/strict';\\nimport {verifyEnemyMotionFidelity} from '../enemy-motion-direct-20261105/fidelity.mjs';");
change('row.pauseFreezeVerified = true;', \`row.pauseFreezeVerified = true;
    if(cycle===0) row.enemyMotionFidelity=await verifyEnemyMotionFidelity({page,
      guard:async()=>requireInactiveCheckpoint(await observe(),'paused')});\`);
`;
change('let restored = code;',extra+'\nlet restored = code;');
let restored=code;for(const[a,b]of [...changes].reverse())restored=restored.replace(b,a);
assert.equal(restored,original,'Original collector source, clocks, error and timing conditions retained');
const temporary=originalPath.replace(/\.mjs$/,`.enemy-motion-${process.pid}.mjs`);
try{writeFileSync(temporary,code);await import(pathToFileURL(temporary).href);}finally{unlinkSync(temporary);assert.equal(readFileSync(originalPath,'utf8'),original);}
