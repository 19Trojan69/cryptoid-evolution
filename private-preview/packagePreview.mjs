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
  writeFileSync(target, html);
  copyFileSync(new URL('./pi-sdk.js', import.meta.url), resolve(output, 'private-preview-sdk.js'));
  copyFileSync(new URL('./viewport.css', import.meta.url), resolve(output, 'private-preview-viewport.css'));
  writeFileSync(resolve(output, 'robots.txt'), 'User-agent: *\nDisallow: /\n');
  writeFileSync(resolve(output, 'private-preview-info.json'), JSON.stringify({
    type: 'protected-playable-guest-preview', ...identity,
    backend: 'isolated fixtures', liveData: false, authentication: false, payments: false,
    gameplayHooks: false, automaticResume: false,
    watchdog: { comparison: 'strictly greater than', thresholdMs: 2500, intervalMs: 500 },
    limits: ['Not a full-campaign acceptance', 'Not physical Pi Browser or iPhone long-term evidence'],
  }, null, 2) + '\n');
}
