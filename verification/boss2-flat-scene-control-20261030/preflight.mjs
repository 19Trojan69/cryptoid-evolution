import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { root } from '../boss2-forensics-20261028/fixture.mjs';
import { deviceController, deviceBoss } from '../boss2-forensics-20261028/devicePreviewTransform.mjs';
import { flatGameScene } from './flatTransform.mjs';
const ts = createRequire(root + '/frontend/package.json')('typescript');
const config = ts.readConfigFile(root + '/frontend/tsconfig.app.json', ts.sys.readFile); assert.equal(config.error, undefined);
const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, root + '/frontend', {}, root + '/frontend/tsconfig.app.json');
const options = { ...parsed.options, noEmit: true }, host = ts.createCompilerHost(options), read = host.getSourceFile.bind(host);
host.getCurrentDirectory = () => root + '/frontend';
host.getSourceFile = (file, language, ...rest) => {
  const path = resolve(file);
  const transform = path === root + '/frontend/src/pages/GamePage.tsx' ? source => deviceController(flatGameScene(source))
    : path === root + '/frontend/src/pages/sectorBoss.ts' ? deviceBoss : null;
  return transform ? ts.createSourceFile(file, transform(readFileSync(path, 'utf8')), language, true) : read(file, language, ...rest);
};
const program = ts.createProgram(parsed.fileNames, options, host), diagnostics = ts.getPreEmitDiagnostics(program);
if (diagnostics.length) throw Error(ts.formatDiagnosticsWithColorAndContext(diagnostics, { getCanonicalFileName: x => x, getCurrentDirectory: () => root + '/frontend', getNewLine: () => '\n' }));
console.log('CRYPTOID_FLAT_TYPES ' + JSON.stringify({ passed: true, transformedControllerAndBoss: true, originalSourcesWritten: false }));
