import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, copyFileSync } from 'node:fs';
import { resolve } from 'node:path';

export function packagePreview(output, environment, identity) {
  assert.equal(environment, 'preview', 'Private preview only');
  const target = resolve(output, 'index.html');
  const original = readFileSync(target, 'utf8');
  assert.equal((original.match(/https:\/\/sdk\.minepi\.com\/pi-sdk\.js/g) || []).length, 1);
  assert.ok(original.includes('id="cryptoid-startup-recovery"'));
  const html = original
    .replace('https://sdk.minepi.com/pi-sdk.js', '/private-preview-sdk.js')
    .replace(/backendURL:\s*"[^"]*"/, 'backendURL: "/api"')
    .replace(/appNetwork:\s*"[^"]*"/, 'appNetwork: "testnet"')
    .replace('</head>', '<link rel="stylesheet" href="/private-preview-viewport.css" />\n</head>');
  const identityJson = JSON.stringify({ sourceCommit: identity.sourceCommit }).replaceAll('<', '\\u003c');
  const observations = `<script id="cryptoid-private-preview-identity" type="application/json">${identityJson}</script>\n<script defer src="/private-preview-evidence.js"></script>\n<script defer src="/private-preview-lifecycle.js"></script>\n`;
  writeFileSync(target, html.replace(/<script\b[^>]*type="module"/, match => observations + match));
  copyFileSync(new URL('./pi-sdk.js', import.meta.url), resolve(output, 'private-preview-sdk.js'));
  copyFileSync(new URL('./viewport.css', import.meta.url), resolve(output, 'private-preview-viewport.css'));
  for (const name of ['evidence', 'lifecycle', 'report']) copyFileSync(new URL(`./${name}.js`, import.meta.url), resolve(output, `private-preview-${name}.js`));
  copyFileSync(new URL('./report.html', import.meta.url), resolve(output, 'private-preview-report.html'));
  writeFileSync(resolve(output, 'robots.txt'), 'User-agent: *\nDisallow: /\n');
  writeFileSync(resolve(output, 'private-preview-info.json'), JSON.stringify({
    type: 'protected-playable-guest-preview', ...identity,
    backend: 'isolated fixtures', liveData: false, authentication: false, payments: false,
    localLifecycleEvidence: true, automaticEvidenceTransmission: false,
    gameplayHooks: false, automaticResume: false,
    watchdog: { comparison: 'strictly greater than', thresholdMs: 2500, intervalMs: 500 },
    limits: ['Not a full-campaign acceptance', 'Not physical Pi Browser or iPhone long-term evidence'],
  }, null, 2) + '\n');
}
