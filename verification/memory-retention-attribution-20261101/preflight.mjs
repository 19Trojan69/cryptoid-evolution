import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { root } from '../boss2-forensics-20261028/fixture.mjs';
import { deviceController } from '../boss2-forensics-20261028/devicePreviewTransform.mjs';
import { instrumentMemoryInspection } from './inspection.mjs';
const ts = createRequire(root + '/frontend/package.json')('typescript');
const path = root + '/frontend/src/pages/GamePage.tsx';
const original = readFileSync(path, 'utf8');
const virtual = deviceController(instrumentMemoryInspection(original));
const config = ts.readConfigFile(root + '/frontend/tsconfig.app.json', ts.sys.readFile);
assert.equal(config.error, undefined);
const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, root + '/frontend', {}, root + '/frontend/tsconfig.app.json');
const options = { ...parsed.options, noEmit: true }, host = ts.createCompilerHost(options);
const get = host.getSourceFile.bind(host);
host.getCurrentDirectory = () => root + '/frontend';
host.getSourceFile = (file, version, ...rest) => resolve(file) === path
  ? ts.createSourceFile(file, virtual, version, true) : get(file, version, ...rest);
const program = ts.createProgram(parsed.fileNames, options, host), diagnostics = ts.getPreEmitDiagnostics(program);
if (diagnostics.length) throw Error(ts.formatDiagnosticsWithColorAndContext(diagnostics,
  { getCanonicalFileName: file => file, getCurrentDirectory: () => root + '/frontend', getNewLine: () => '\n' }));
console.log('CRYPTOID_ATTRIBUTION_TYPES ' + JSON.stringify({ passed: true, sourceRuntimeEdited: false }));
