// Replay only the timing decisions extracted from exact official source.
// Synthetic RAF intervals are inputs, never measured device FPS or a campaign.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {execFileSync} from 'node:child_process';
import ts from 'typescript';
const official='51e59c3373a8dd4ba4985d5a9559acdcf2d6755a';
const root=new URL('../',import.meta.url).pathname;
const baseline=execFileSync('git',['show',`${official}:frontend/src/pages/GamePage.tsx`],{cwd:root,encoding:'utf8'});
const candidate=fs.readFileSync(root+'src/pages/GamePage.tsx','utf8');
const parse=text=>ts.createSourceFile('GamePage.tsx',text,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
const old=parse(baseline), next=parse(candidate);
const find=(node,predicate)=>{if(predicate(node))return node;let result;ts.forEachChild(node,child=>{result??=find(child,predicate);});return result;};
const variable=(file,name)=>find(file,node=>ts.isVariableDeclaration(node)&&ts.isIdentifier(node.name)&&node.name.text===name);
const printer=ts.createPrinter({removeComments:true});
const withoutHooks=(file,node)=>{
  const transformed=ts.transform(node,[context=>{
    const visit=node=>ts.isExpressionStatement(node)&&node.expression.getText(file).startsWith('performanceProbeRef.current?.')
      ? undefined:ts.visitEachChild(node,visit,context);
    return node=>ts.visitNode(node,visit);
  }]);
  const printed=printer.printNode(ts.EmitHint.Unspecified,transformed.transformed[0],file);transformed.dispose();return printed;
};
assert.equal(withoutHooks(next,variable(next,'simulate')),withoutHooks(old,variable(old,'simulate')),
  'the whole real simulation must match official source after removing optional timing hooks');
const entry=file=>find(file,node=>ts.isFunctionDeclaration(node)&&node.name?.text==='GameEntry');
assert.equal(printer.printNode(ts.EmitHint.Unspecified,entry(next),next),printer.printNode(ts.EmitHint.Unspecified,entry(old),old),
  'server-derived canAdmin entry gate remains unchanged');
const simulate=variable(old,'simulate');
const expr=name=>variable(simulate,name).initializer.getText(old);
const slow=find(simulate,node=>ts.isExpressionStatement(node)&&node.getText(old).startsWith('slowFramesRef.current ='));
const paint=find(simulate,node=>ts.isIfStatement(node)&&node.expression.getText(old).startsWith('damageTaken ||'));
const replay=new vm.Script(`{
  const frameGap=${expr('frameGap')}; const delta=${expr('delta')}; lastFrameRef.current=time;
  ${slow.getText(old)} const paintInterval=${expr('paintInterval')};
  const requested=${paint.expression.getText(old)};
  if(requested)lastPaintRef.current=time;
  result={frameGap,delta,paintInterval,slowFrames:slowFramesRef.current,requested};
}`);
function run(label,width,gaps,{damage=false}={}){
  const box=vm.createContext({width,lastFrameRef:{current:1000},lastPaintRef:{current:1000},slowFramesRef:{current:0},
    damageTaken:damage,state:{phase:'ATTACK_CYCLE',status:'playing'},previousPhase:'ATTACK_CYCLE',time:1000});
  let wall=0,simulated=0,requests=0,throttled=0,skipped=0;
  for(const gap of gaps){box.time+=gap;replay.runInContext(box);const r=box.result;
    wall+=r.frameGap;simulated+=r.delta;requests+=Number(r.requested);throttled+=Number(r.paintInterval===50);skipped+=Number(!r.requested);}
  return {label,width,inputCallbacks:gaps.length,inputWallMs:Math.round(wall),sceneRequests:requests,
    sceneRequestsPerSecond:Math.round(requests/wall*10000)/10,interval50Decisions:throttled,skippedRequests:skipped,
    simulatedProgressPercent:Math.round(simulated/wall*1000)/10,discardedSimulationMs:Math.round(wall-simulated)};
}
const cases=[
  run('steady 60-Hz input',430,Array(600).fill(1000/60)),
  run('steady 30-Hz input',430,Array(300).fill(1000/30)),
  run('steady 25-Hz input',430,Array(250).fill(40)),
  run('steady 20-Hz input',430,Array(200).fill(50)),
  run('alternating 16.7/50-ms input',430,Array.from({length:300},(_,i)=>i%2?50:1000/60)),
  run('desktop 60-Hz input',800,Array(600).fill(1000/60)),
  run('forced damage requests at 60-Hz input',430,Array(600).fill(1000/60),{damage:true}),
];
assert.equal(cases[0].sceneRequestsPerSecond,30);
assert.equal(cases[1].simulatedProgressPercent,100);
assert.equal(cases[2].simulatedProgressPercent,85);
assert.equal(cases[3].simulatedProgressPercent,68);
assert.equal(cases[3].interval50Decisions,198);
assert.equal(cases[5].sceneRequestsPerSecond,60);
assert.equal(cases[6].sceneRequests,600);
console.log(JSON.stringify({source:official,simulationParity:true,ownerGateParity:true,
  limits:'Synthetic timing-rule replay only. No workload, browser paint, GPU, iPhone FPS, thermal behavior or full campaign is simulated.',cases},null,2));
