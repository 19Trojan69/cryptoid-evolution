import test from 'node:test';
import assert from 'node:assert/strict';
import { FULL_SESSION_LIMITS } from './fullSessionFormat.ts';
import { FULL_SESSION_TEXT_PART_CHARS, fullSessionFileName, fullSessionText, fullSessionTextPart, shareableFullSessionFile } from './fullSessionTransfer.ts';

test('all numbered text parts reconstruct the exact complete recording, including Unicode boundaries and the last record', async () => {
  const original = JSON.stringify({ format: 'cryptoid-full-session-report', records: Array.from({ length: 2327 }, (_, i) => ({ seq: i + 1, data: 'x'.repeat(400) + '🛰️' })), integrity: { contiguous: true } });
  const capture = await fullSessionText(new Blob([original]), 'run-owner-1');
  const parts = Array.from({ length: capture.offsets.length - 1 }, (_, i) => JSON.parse(fullSessionTextPart(capture, i)));
  assert.ok(parts.length > 10);
  for (const [i, part] of parts.entries()) {
    assert.equal(part.format, 'cryptoid-full-session-text-part'); assert.equal(part.session, 'run-owner-1');
    assert.equal(part.part, i + 1); assert.equal(part.total, parts.length); assert.equal(part.characters, original.length);
    assert.ok(part.data.length <= FULL_SESSION_TEXT_PART_CHARS);
  }
  assert.equal(parts.map(p => p.data).join(''), original);
  assert.equal(JSON.parse(parts.map(p => p.data).join('')).records.at(-1).seq, 2327);
});

test('surrogate pairs are not split between manually copied parts', async () => {
  const original = 'x'.repeat(FULL_SESSION_TEXT_PART_CHARS - 1) + '🛰' + 'tail';
  const capture = await fullSessionText(new Blob([original]), 'run-1');
  assert.equal(capture.offsets[1], FULL_SESSION_TEXT_PART_CHARS - 1);
  assert.equal(JSON.parse(fullSessionTextPart(capture, 0)).data + JSON.parse(fullSessionTextPart(capture, 1)).data, original);
  assert.throws(() => fullSessionTextPart(capture, -1)); assert.throws(() => fullSessionTextPart(capture, 2));
});

test('file preparation never opens the OS picker and preserves the original bytes', async () => {
  let calls = 0;
  const host = { share() { calls++; return Promise.resolve(); }, canShare: data => data.files[0].type === 'application/json' };
  const blob = new Blob(['{"complete":true}']);
  const file = shareableFullSessionFile(blob, 'run-1', host);
  assert.equal(calls, 0); assert.equal(file.name, 'cryptoid-full-session-run-1.json');
  assert.equal(file.type, 'application/json'); assert.equal(await file.text(), await blob.text());
});

test('plain text file sharing retains the complete JSON when JSON files are unsupported', async () => {
  const blob = new Blob(['{"records":[1,2,3]}']);
  const file = shareableFullSessionFile(blob, 'run-1', { share: async () => {}, canShare: data => data.files[0].type === 'text/plain' });
  assert.equal(file.name, 'cryptoid-full-session-run-1.json.txt'); assert.equal(await file.text(), await blob.text());
});

test('missing, denied and throwing share capabilities leave the local alternatives available', () => {
  for (const host of [{}, { share: async () => {} }, { share: async () => {}, canShare: () => false }, { share: async () => {}, canShare: () => { throw Error('blocked'); } }])
    assert.equal(shareableFullSessionFile(new Blob(['data']), 'run-1', host), null);
});

test('export names and oversized text are rejected before reading any data', async () => {
  assert.throws(() => fullSessionFileName('../private'));
  let reads = 0;
  await assert.rejects(fullSessionText({ size: FULL_SESSION_LIMITS.bytes + 65_537, text() { reads++; } }, 'run-1'));
  assert.equal(reads, 0);
});
