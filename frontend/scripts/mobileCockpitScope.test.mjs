import test from 'node:test';
import { restoreControlCenterGameChanges } from './controlCenterReviewedChanges.mjs';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { reviewedMobileGameChanges } from './mobileCockpitReviewedChanges.mjs';
const source = readFileSync(new URL('../src/pages/GamePage.tsx', import.meta.url), 'utf8');
const published = '4db6830951d23d3ef7a862f0ab5a59407b3b21c4e09106c0f7791c7a3158b246';
function digest(text) {
  text = restoreControlCenterGameChanges(text);
  for (const {before, after} of reviewedMobileGameChanges) {
    assert.equal(text.split(after).length - 1, 1, 'one exact reviewed change');
    text = text.replace(after,before);
  }
  return createHash('sha256').update(text).digest('hex');
}
test('only the reviewed menu and summary-placement changes depart from the published game', () => {
  assert.equal(digest(source), published);
  const changed = source.replace("stateRef.current.status = 'paused';", "stateRef.current.status = 'playing';");
  assert.notEqual(changed,source);
  assert.throws(() => assert.equal(digest(changed),published), 'genuine interruption pauses remain protected by exact scope or fingerprint');
});
