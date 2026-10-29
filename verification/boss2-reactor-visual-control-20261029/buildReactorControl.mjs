import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { root } from '../boss2-forensics-20261028/fixture.mjs';

assert.equal(process.env.VERCEL_ENV, 'preview', 'Reactor display control is protected-preview only');
assert.equal(JSON.parse(readFileSync(root + '/vercel.json', 'utf8')).git.deploymentEnabled, false);
await import('../boss2-stopwatch-20261029/buildStopwatchPreview.mjs');
const output = root + '/verification/boss2-forensics-20261028/results/device-preview/site';
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
function inventory(directory, prefix = '') {
  return readdirSync(directory, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name)).flatMap(entry => {
    const relative = prefix + entry.name, path = directory + '/' + entry.name;
    assert.ok(!entry.isSymbolicLink(), 'No output symlinks');
    return entry.isDirectory() ? inventory(path, relative + '/') : [{ path: relative, sha256: hash(readFileSync(path)) }];
  });
}
const before = inventory(output);
const infoPath = output + '/device-preview-info.json';
const info = JSON.parse(readFileSync(infoPath, 'utf8'));
const css = readFileSync(new URL('./reactorControl.css', import.meta.url), 'utf8');
const htmlPath = output + '/index.html', original = readFileSync(htmlPath, 'utf8');
assert.equal(original.split('</head>').length, 2);
const link = '<link id="diagnostic-reactor-control" rel="stylesheet" href="/diagnostic-reactor-control.css">';
const changed = original.replace('</head>', link + '</head>');
assert.equal(changed.replace(link, ''), original);
writeFileSync(output + '/diagnostic-reactor-control.css', css);
writeFileSync(htmlPath, changed);
const retained = before.filter(entry => !['index.html', 'device-preview-info.json'].includes(entry.path));
for (const entry of retained) assert.equal(hash(readFileSync(output + '/' + entry.path)), entry.sha256, entry.path);
info.diagnosticReactorControl = {
  version: 1, kind: 'svg-reactor-display-none', selector: '.game-shell .boss-special-weapon',
  label: 'GRAFIKTEST: SVG-Reaktor ausgeblendet; CSS-Filter ausgeschaltet',
  stylesheetSha256: hash(css), previousIndexSha256: hash(original),
  retainedOutputFiles: retained.length, retainedOutputInventorySha256: hash(JSON.stringify(retained)),
  changedExistingOutputs: ['index.html', 'device-preview-info.json'],
  additionalOutput: 'diagnostic-reactor-control.css',
  svgRemainsMounted: true, reactUpdatesRemain: true, originalCompiledModules: true,
  sourceGameChanged: false, simulationClocksChanged: false, inputChanged: false, audioChanged: false,
  cssFiltersStillDisabled: true, stopwatchPreserved: true,
  productionCandidate: false, nativeDeviceAccepted: false, whiteScreenFixed: false,
};
writeFileSync(infoPath, JSON.stringify(info, null, 2) + '\n');
console.log('CRYPTOID_REACTOR_CONTROL_BUILD ' + JSON.stringify({ sourceCommit: info.sourceCommit,
  sourceTree: info.sourceTree, control: info.diagnosticReactorControl }));
