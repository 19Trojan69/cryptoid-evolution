import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { root } from './fixture.mjs';
import { deviceController, deviceBoss } from './devicePreviewTransform.mjs';
const ts=createRequire(root+'/frontend/package.json')('typescript');
const config=ts.readConfigFile(root+'/frontend/tsconfig.app.json',ts.sys.readFile);
assert.equal(config.error,undefined);
const parsed=ts.parseJsonConfigFileContent(config.config,ts.sys,root+'/frontend',{},root+'/frontend/tsconfig.app.json');
const options={...parsed.options,noEmit:true},host=ts.createCompilerHost(options),read=host.getSourceFile.bind(host);
host.getCurrentDirectory=()=>root+'/frontend';
host.getSourceFile=(file,language,...rest)=>{
  const path=resolve(file),transform=path===root+'/frontend/src/pages/GamePage.tsx'?deviceController:path===root+'/frontend/src/pages/sectorBoss.ts'?deviceBoss:null;
  return transform?ts.createSourceFile(file,transform(readFileSync(path,'utf8')),language,true):read(file,language,...rest);
};
const program=ts.createProgram(parsed.fileNames,options,host),diagnostics=ts.getPreEmitDiagnostics(program);
if(diagnostics.length)throw Error(ts.formatDiagnosticsWithColorAndContext(diagnostics,{getCanonicalFileName:x=>x,getCurrentDirectory:()=>root+'/frontend',getNewLine:()=>'\n'}));
console.log('CRYPTOID_DEVICE_TYPES '+JSON.stringify({passed:true,originalGameSourcesWritten:false,instrumentedControllerAndBoss:true}));
