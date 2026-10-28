import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { createAccountFixture, instrumentController, BASELINE, root } from './fixture.mjs';

const source = readFileSync(root + '/frontend/src/pages/GamePage.tsx', 'utf8');
const published = execFileSync('git', ['show', BASELINE + ':frontend/src/pages/GamePage.tsx'], { cwd: root, encoding: 'utf8' });
assert.equal(source, published, 'Published game controller retained exactly');
const transformed = instrumentController(source);
const require = createRequire(root + '/frontend/package.json');
const ts = require('typescript');
const config = ts.readConfigFile(root + '/frontend/tsconfig.app.json', ts.sys.readFile);
assert.equal(config.error, undefined);
const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, root + '/frontend', {}, root + '/frontend/tsconfig.app.json');
const options = { ...parsed.options, noEmit: true };
const host = ts.createCompilerHost(options), originalSourceFile = host.getSourceFile.bind(host);
host.getCurrentDirectory = () => root + '/frontend';
host.getSourceFile = (file, languageVersion, ...rest) => resolve(file) === root + '/frontend/src/pages/GamePage.tsx'
  ? ts.createSourceFile(file, transformed, languageVersion, true)
  : originalSourceFile(file, languageVersion, ...rest);
const program = ts.createProgram(parsed.fileNames, options, host);
const diagnostics = ts.getPreEmitDiagnostics(program);
if (diagnostics.length) throw new Error(ts.formatDiagnosticsWithColorAndContext(diagnostics, {
  getCanonicalFileName: file => file, getCurrentDirectory: () => root + '/frontend', getNewLine: () => '\n',
}));
const { h, initialize } = createAccountFixture();
await initialize();
const start = await h.call('hangar', '/start', { action: 'resume', rulesVersion: 2, version: h.profile().version, startKey: 'duration-preflight-0001' });
assert.equal(start.code, 200);
assert.equal(start.body.startSector, 1);
assert.ok(start.body.scoreRunId);
const inventory = await h.call('hangar', '/inventory', null, { method: 'GET' });
assert.equal(inventory.code, 200);
assert.equal(inventory.body.weaponStock.weapon_plasma, 100);
console.log(JSON.stringify({ passed: true, publishedControllerRetained: true, instrumentedTypeScriptPassed: true, existingHandlerFixtureReused: true, realPi: false, realDatabase: false, syntheticStock: 100 }));
const direct = createAccountFixture();
await direct.initialize(20);
const boss = await direct.h.call('hangar', '/start', { action: 'resume', rulesVersion: 2, version: direct.h.profile().version, startKey: 'boss-direct-preflight-0001' });
assert.equal(boss.code, 200);
assert.equal(boss.body.startSector, 20);
assert.equal(boss.body.startPhase, 'boss');
console.log('Direct Boss 2 start accepted by unchanged real handlers in the synthetic fixture.');
