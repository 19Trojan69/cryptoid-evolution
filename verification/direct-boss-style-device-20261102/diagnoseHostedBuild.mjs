// Isolated hosting-build diagnostic only. Never serves a playable candidate.
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';
assert.equal(process.env.VERCEL_ENV, 'preview');
const root = resolve(new URL('../..', import.meta.url).pathname);
const configPath = root + '/vercel.json', originalConfig = readFileSync(configPath, 'utf8');
const diagnosticCommand = 'node verification/direct-boss-style-device-20261102/diagnoseHostedBuild.mjs';
const candidateCommand = 'node verification/direct-boss-style-device-20261102/buildDevicePreview.mjs';
assert.equal(originalConfig.split(diagnosticCommand).length, 2);
// Let the unchanged candidate guard inspect its exact declared build config.
writeFileSync(configPath, originalConfig.replace(diagnosticCommand, candidateCommand));
let outcome;
try {
  await import('./buildDevicePreview.mjs');
  outcome = { candidateBuildSucceeded: true };
} catch (error) {
  const clean = value => String(value ?? '').slice(0, 4096)
    .replace(/(?:Bearer\s+|[?&](?:token|_vercel_share)=)[^\s"'&]+/gi, '[redacted]');
  outcome = { candidateBuildSucceeded: false, error: { name: clean(error.name), code: clean(error.code),
    message: clean(error.message), stack: clean(error.stack) } };
} finally {
  writeFileSync(configPath, originalConfig);
}
const directory = root + '/verification/boss2-forensics-20261028/results/device-preview/site';
rmSync(directory, { recursive: true, force: true }); mkdirSync(directory, { recursive: true });
const result = { version: 1, diagnosticOnly: true, playableCandidate: false, ownerDataRead: false,
  environmentDumped: false, candidateSource: '5acefc1aa3ea224b656a76c415da39ece0ed84f0', ...outcome };
writeFileSync(directory + '/hosted-build-diagnostic.json', JSON.stringify(result, null, 2) + '\n');
writeFileSync(directory + '/index.html', '<!doctype html><html lang="de"><meta charset="utf-8"><meta name="robots" content="noindex,nofollow"><title>Build-Diagnose</title><p>Interne Build-Diagnose. Kein spielbarer Test.</p></html>');
console.log('CRYPTOID_HOSTED_BUILD_DIAGNOSTIC ' + JSON.stringify({ diagnosticOnly: true, playableCandidate: false,
  candidateBuildSucceeded: outcome.candidateBuildSucceeded }));
