import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {resolve} from 'node:path';
import {enemyController,visual} from './transform.mjs';
const root=resolve(new URL('../..',import.meta.url).pathname);
const ts=createRequire(root+'/frontend/package.json')('typescript');
const helper=root+'/verification/enemy-motion-direct-20261105/presentation.ts';
const p=ts.createProgram([helper],{strict:true,noEmit:true,skipLibCheck:true,types:[],target:ts.ScriptTarget.ES2022});
const errors=ts.getPreEmitDiagnostics(p).filter(x=>x.category===ts.DiagnosticCategory.Error);
assert.deepEqual(errors.map(x=>ts.flattenDiagnosticMessageText(x.messageText,'\n')),[]);
for(const condition of ['control','candidate'])for(const[name,transform]of [['GamePage',enemyController],['GameShipVisual',visual]]){
 const s=transform(readFileSync(root+'/frontend/src/pages/'+name+'.tsx','utf8'),condition);
 const out=ts.transpileModule(s,{fileName:name+'.tsx',reportDiagnostics:true,
  compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext,jsx:ts.JsxEmit.ReactJSX}});
 assert.deepEqual((out.diagnostics??[]).filter(x=>x.category===ts.DiagnosticCategory.Error).map(x=>ts.flattenDiagnosticMessageText(x.messageText,'\n')),[]);
}
console.log('Strict helper types and both complete virtual TSX syntax paths passed; not a whole-project type check.');
