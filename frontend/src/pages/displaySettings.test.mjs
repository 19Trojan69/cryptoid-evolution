import { test } from 'node:test';
import assert from 'node:assert/strict';
import { applySavedDisplaySettings, readReducedEffects } from './displaySettings.ts';

test('device reduced-motion preference and the explicit effect setting both reduce decoration', () => {
  const saved = Object.fromEntries(['window','document','localStorage'].map(name => [name, globalThis[name]]));
  let deviceReduced = true, preference = null;
  globalThis.window = { matchMedia: () => ({ matches: deviceReduced }) };
  globalThis.document = { documentElement: { dataset: {} } };
  globalThis.localStorage = { getItem: () => preference };
  try {
    assert.equal(readReducedEffects(), true);
    preference = '0'; applySavedDisplaySettings();
    assert.equal(document.documentElement.dataset.motion, 'reduced', 'a device accessibility preference is respected');
    deviceReduced = false; preference = '1'; applySavedDisplaySettings();
    assert.equal(document.documentElement.dataset.motion, 'reduced');
    preference = '0'; applySavedDisplaySettings();
    assert.equal(document.documentElement.dataset.motion, 'standard');
  } finally { for (const [name,value] of Object.entries(saved)) if (value === undefined) delete globalThis[name]; else globalThis[name] = value; }
});
