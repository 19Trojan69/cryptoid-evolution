import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { root } from '../boss2-forensics-20261028/fixture.mjs';
import { deviceController } from '../boss2-forensics-20261028/devicePreviewTransform.mjs';
import { instrumentMemoryInspection } from '../memory-retention-attribution-20261101/inspection.mjs';
import { localStyleSource } from './transform.mjs';
const ts = createRequire(root + '/frontend/package.json')('typescript');
const config = ts.readConfigFile(root + '/frontend/tsconfig.app.json', ts.sys.readFile); assert.equal(config.error, undefined);
const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, root + '/frontend', {}, root + '/frontend/tsconfig.app.json');
for (const condition of ['control', 'leaves']) {
  const controller = root + '/frontend/src/pages/GamePage.tsx';
  const virtual = new Map([[controller, deviceController(instrumentMemoryInspection(readFileSync(controller, 'utf8')))]]);
  for (const name of ['BossHullView', 'BossReactorView']) {
    const path = root + '/frontend/src/pages/' + name + '.tsx'; virtual.set(path, localStyleSource(readFileSync(path, 'utf8'), name, condition));
  }
  const options = { ...parsed.options, noEmit: true }, host = ts.createCompilerHost(options), get = host.getSourceFile.bind(host);
  host.getCurrentDirectory = () => root + '/frontend';
  host.getSourceFile = (file, version, ...rest) => virtual.has(resolve(file))
    ? ts.createSourceFile(file, virtual.get(resolve(file)), version, true) : get(file, version, ...rest);
  const diagnostics = ts.getPreEmitDiagnostics(ts.createProgram(parsed.fileNames, options, host));
  if (diagnostics.length) throw Error(ts.formatDiagnosticsWithColorAndContext(diagnostics,
    { getCanonicalFileName: f => f, getCurrentDirectory: () => root + '/frontend', getNewLine: () => '\n' }));
  console.log('CRYPTOID_LOCAL_STYLE_TYPES ' + JSON.stringify({ condition, passed: true, runtimeSourceFilesEdited: false }));
}
