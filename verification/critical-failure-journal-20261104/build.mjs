import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, unlinkSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { proof, digest } from './transform.mjs';

const root = resolve(new URL('../..', import.meta.url).pathname);
assert.equal(process.env.VERCEL_ENV, 'preview');
const folder = root+'/verification/critical-failure-journal-20261104';
const browserPath = root+'/verification/boss2-brief-report-20261030/briefBrowser.mjs';
const appPath = root+'/verification/boss2-forensics-20261028/devicePreviewApp.jsx';
const browser = readFileSync(browserPath, 'utf8'), app = readFileSync(appPath, 'utf8');
const expected = proof(browser, app);
mkdirSync(folder+'/results/build', { recursive: true });
const builderPath = root+'/verification/player-muzzle-local-20261104/build.mjs';
const builder = readFileSync(builderPath, 'utf8');
let code = builder;
function change(before, after) { assert.equal(code.split(before).length, 2, before); code = code.replace(before, after); }
change('const condition = process.argv[2];', "const condition = 'control';");
const hook = "    const path = id.split('?')[0];";
const transformed = hook+`
    if (path === root + '/verification/boss2-brief-report-20261030/briefBrowser.mjs') {
      const changed=journalBrowser(code);
      writeFileSync(${JSON.stringify(folder+'/results/build/browser.json')},JSON.stringify({originalSha256:journalDigest(code),transformedSha256:journalDigest(changed)}));
      return changed;
    }
    if (path === root + '/verification/boss2-forensics-20261028/devicePreviewApp.jsx') {
      const changed=journalApp(code);
      writeFileSync(${JSON.stringify(folder+'/results/build/app.json')},JSON.stringify({originalSha256:journalDigest(code),transformedSha256:journalDigest(changed)}));
      return changed;
    }`;
const prefix = 'import { browserSource as journalBrowser, appSource as journalApp, digest as journalDigest } from '+
  JSON.stringify(pathToFileURL(folder+'/transform.mjs').href)+';\n';
change("  const base = readFileSync(basePath, 'utf8');", `  const rawBase=readFileSync(basePath,'utf8');
  assert.equal(rawBase.split(${JSON.stringify(hook)}).length,2);
  const base=${JSON.stringify(prefix)}+rawBase.replace(${JSON.stringify(hook)},${JSON.stringify(transformed)});`);
const temporary = builderPath.replace(/\.mjs$/, `.critical-${process.pid}.mjs`);
try {
  writeFileSync(temporary, code); await import(pathToFileURL(temporary).href);
  const browserCompiled = JSON.parse(readFileSync(folder+'/results/build/browser.json', 'utf8'));
  const appCompiled = JSON.parse(readFileSync(folder+'/results/build/app.json', 'utf8'));
  assert.deepEqual(browserCompiled, { originalSha256: expected.originalBrowserSha256, transformedSha256: expected.transformedBrowserSha256 });
  assert.deepEqual(appCompiled, { originalSha256: expected.originalAppSha256, transformedSha256: expected.transformedAppSha256 });
  const infoPath = root+'/verification/boss2-forensics-20261028/results/device-preview/site/device-preview-info.json';
  const info = JSON.parse(readFileSync(infoPath, 'utf8'));
  assert.equal(info.playerMuzzleLocalCandidate.condition, 'control');
  assert.equal(info.qaLocalBossStyle.condition, 'leaves');
  assert.equal(info.mobileHudBackdropCandidate.value, 'none');
  info.criticalFailureJournal = { ...expected, criticalStateSha256: digest(readFileSync(folder+'/criticalState.mjs')),
    baseBuilderSha256: digest(builder), adaptedBuilderSha256: digest(code),
    legacyBriefFormatRetained: true, normalReportIncludesJournal: true,
    originalGameControllerAndClockRetained: true, commonDirectBossStylesAndHudRetained: true };
  writeFileSync(infoPath, JSON.stringify(info, null, 2)+'\n');
  console.log('CRITICAL_JOURNAL_BUILD '+JSON.stringify(info.criticalFailureJournal));
} finally {
  unlinkSync(temporary);
  assert.equal(readFileSync(browserPath, 'utf8'), browser);
  assert.equal(readFileSync(appPath, 'utf8'), app);
}
