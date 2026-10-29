import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { root } from '../boss2-forensics-20261028/fixture.mjs';
import { diagnosticCssByCase, filterPreviewLabel } from './filterStyles.mjs';

assert.equal(process.env.VERCEL_ENV, 'preview', 'Diagnostic filter control is preview-only');
const config = JSON.parse(readFileSync(root + '/vercel.json', 'utf8'));
assert.equal(config.git.deploymentEnabled, false);
// The unchanged private builder performs its full original source checks.
await import('../boss2-forensics-20261028/buildDevicePreview.mjs');
const output = root + '/verification/boss2-forensics-20261028/results/device-preview/site';
const control = diagnosticCssByCase['all-css-filters-off'];
const css = control + '\n.device-preview-menu section::before { content: ' + JSON.stringify(filterPreviewLabel) +
  '; display: block; margin-bottom: 1rem; padding: .7rem; border: 1px solid #f6b554; color: #ffdfa8; font-weight: 700; }\n';
const htmlPath = output + '/index.html', original = readFileSync(htmlPath, 'utf8');
assert.equal(original.split('</head>').length, 2);
const link = '<link rel="stylesheet" href="/diagnostic-css-filter-control.css">';
const changed = original.replace('</head>', link + '</head>');
assert.equal(changed.replace(link, ''), original);
writeFileSync(output + '/diagnostic-css-filter-control.css', css);
writeFileSync(htmlPath, changed);
const infoPath = output + '/device-preview-info.json';
const info = JSON.parse(readFileSync(infoPath, 'utf8'));
info.diagnosticCssControl = { kind: 'all-css-filters-off', label: filterPreviewLabel,
  controlSha256: createHash('sha256').update(control).digest('hex'),
  stylesheetSha256: createHash('sha256').update(css).digest('hex'),
  deliberateVisualChanges: true, gameSourceChanged: false, simulationClocksChanged: false,
  originalCompiledGameModules: true, productionCandidate: false, whiteScreenFixed: false };
writeFileSync(infoPath, JSON.stringify(info, null, 2) + '\n');
console.log('CRYPTOID_FILTER_PREVIEW_BUILD ' + JSON.stringify({ sourceCommit: info.sourceCommit,
  sourceTree: info.sourceTree, diagnosticCssControl: info.diagnosticCssControl }));
