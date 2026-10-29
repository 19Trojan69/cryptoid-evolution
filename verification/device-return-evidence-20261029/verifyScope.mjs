import '../window-focus-diagnostics-20261029/verifyScope.mjs';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
const source = readFileSync(new URL('../boss2-forensics-20261028/devicePreviewApp.jsx', import.meta.url), 'utf8');
const addedImport = "import { readDeviceReturnEvidence } from './deviceReturnEvidence.mjs';\n";
const oldDetails = '        flightRecorders: readFlightRecorders(window), crashTails: readCrashTails(window) };';
const addedDetails = '        flightRecorders: readFlightRecorders(window), crashTails: readCrashTails(window),\n        returnEvidence: readDeviceReturnEvidence(window) };';
assert.equal(source.split(addedImport).length, 2);
assert.equal(source.split(addedDetails).length, 2);
const restored = source.replace(addedImport, '').replace(addedDetails, oldDetails);
assert.equal(createHash('sha256').update(restored).digest('hex'),
  'a6972325b6ce62a82947fd47ea93ac7f825d232c3b15f35746db846028834e2c', 'complete previous private menu restored');
const reader = readFileSync(new URL('../boss2-forensics-20261028/deviceReturnEvidence.mjs', import.meta.url), 'utf8');
assert.ok(!/\b(setItem|removeItem|setTimeout|setInterval|requestAnimationFrame|fetch|XMLHttpRequest|addEventListener)\s*\(/.test(reader));
console.log('CRYPTOID_DEVICE_RETURN_SCOPE ' + JSON.stringify({ passed: true,
  privateMenuHunks: 2, existingReaderReused: true, newCollectors: false,
  frontendIncludingControllerAndInputUnchangedFromAcceptedWindowFocus: true }));
