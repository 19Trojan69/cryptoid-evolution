import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, unlinkSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import { proof, transform, digest } from './transform.mjs';

const root = resolve(new URL('../..', import.meta.url).pathname), condition = process.argv[2];
assert.ok(['control','pool'].includes(condition));
assert.equal(process.env.VERCEL_ENV, 'preview');
const modulePath=root+'/frontend/src/pages/projectilePresentation.ts';
const original=readFileSync(modulePath,'utf8'), treatment=proof(original,condition);
const ts=createRequire(root+'/frontend/package.json')('typescript');
const options={strict:true,noEmit:true,skipLibCheck:true,types:[],target:ts.ScriptTarget.ES2022,
  module:ts.ModuleKind.ESNext,moduleResolution:ts.ModuleResolutionKind.Bundler,
  allowImportingTsExtensions:true,jsx:ts.JsxEmit.ReactJSX,lib:['lib.es2022.d.ts','lib.dom.d.ts']};
function diagnostics(text) {
  const host=ts.createCompilerHost(options), read=host.readFile.bind(host);
  host.readFile=path=>resolve(path)===modulePath?text:read(path);
  return ts.getPreEmitDiagnostics(ts.createProgram([modulePath],options,host))
    .filter(x=>x.category===ts.DiagnosticCategory.Error)
    .map(x=>({file:x.file?.fileName?.replace(root,''),start:x.start,code:x.code,text:ts.flattenDiagnosticMessageText(x.messageText,'\n')}));
}
const baselineDiagnostics=diagnostics(original), candidateDiagnostics=diagnostics(transform(original,condition));
assert.deepEqual(candidateDiagnostics,baselineDiagnostics,'No new TypeScript errors in the real imported module graph');
const builderPath=root+'/verification/player-muzzle-local-20261104/build.mjs';
const builder=readFileSync(builderPath,'utf8');
const transformUrl=pathToFileURL(root+'/verification/projectile-pool-20261104/transform.mjs').href;
const recordPath=root+'/verification/projectile-pool-20261104/compiled-proof.json';
let code=builder;
function change(before,after){assert.equal(code.split(before).length,2,before);code=code.replace(before,after);}
change('const condition = process.argv[2];',"const condition = 'control';");
const old="  const base = readFileSync(basePath, 'utf8');";
const hook="  plugins: [react(), { name: 'isolated-device-boss2', enforce: 'pre', transform(code, id) {";
const injected=hook+`
    if (id.replaceAll('\\\\','/').endsWith('/src/pages/projectilePresentation.ts')) {
      const mode=process.env.CRYPTOID_PROJECTILE_POOL_CONDITION;
      writeFileSync(${JSON.stringify(recordPath)},JSON.stringify(projectileProof(code,mode),null,2)+'\\n');
      return projectileTransform(code,mode);
    }`;
change(old,`  const rawBase=readFileSync(basePath,'utf8');
  assert.equal(rawBase.split(${JSON.stringify(hook)}).length,2);
  const base=${JSON.stringify('import { transform as projectileTransform, proof as projectileProof } from '+JSON.stringify(transformUrl)+';\n')}+rawBase.replace(${JSON.stringify(hook)},${JSON.stringify(injected)});`);
const temporary=builderPath.replace(/\.mjs$/,`.projectile-${process.pid}.mjs`);
const previous=process.env.CRYPTOID_PROJECTILE_POOL_CONDITION;
try {
  process.env.CRYPTOID_PROJECTILE_POOL_CONDITION=condition;
  writeFileSync(temporary,code);
  await import(pathToFileURL(temporary).href);
  const compiled=JSON.parse(readFileSync(recordPath,'utf8'));
  assert.deepEqual(compiled,treatment);
  const path=root+'/verification/boss2-forensics-20261028/results/device-preview/site/device-preview-info.json';
  const info=JSON.parse(readFileSync(path,'utf8'));
  assert.equal(info.playerMuzzleLocalCandidate.condition,'control');
  info.projectilePoolCandidate={...compiled,baselineTypeScriptErrors:baselineDiagnostics,
    typeScriptDiagnosticsUnchanged:true,baseBuilderSha256:digest(builder),adaptedBuilderSha256:digest(code),
    originalGameControllerAndClockRetained:true,commonDirectBossStylesAndHudRetained:true};
  writeFileSync(path,JSON.stringify(info,null,2)+'\n');
  console.log('PROJECTILE_POOL_BUILD '+JSON.stringify(info.projectilePoolCandidate));
} finally {
  unlinkSync(temporary);
  if(previous===undefined)delete process.env.CRYPTOID_PROJECTILE_POOL_CONDITION;
  else process.env.CRYPTOID_PROJECTILE_POOL_CONDITION=previous;
  assert.equal(readFileSync(modulePath,'utf8'),original);
}
