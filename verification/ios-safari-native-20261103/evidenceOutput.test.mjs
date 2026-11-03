import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createEvidenceWriter } from './evidenceOutput.mjs';

test('Large multiline evidence survives bounded records without splitting Unicode or losing bytes', async () => {
  const lines = [], write = createEvidenceWriter(data => lines.push(data.toString('utf8')));
  const value = { text: 'Safari 🛰️\n"quoted"\\'.repeat(12000), complete: false };
  await write('RESULT', value);
  const parts = lines.map(line => {
    assert.ok(Buffer.byteLength(line) < 16384);
    assert.ok(line.startsWith('CRYPTOID_IOS_CHUNK '));
    return JSON.parse(line.slice('CRYPTOID_IOS_CHUNK '.length));
  });
  assert.ok(parts.length > 1);
  for (const [index, part] of parts.entries()) {
    assert.equal(part.index, index); assert.equal(part.total, parts.length);
    assert.equal(part.kind, 'RESULT'); assert.equal(part.id, parts[0].id);
  }
  const original = parts.map(part => part.data).join('');
  assert.deepEqual(JSON.parse(original), value);
  assert.equal(createHash('sha256').update(original).digest('hex'), parts[0].sha256);
});

test('Small scalar observations stay ordinary single records', async () => {
  const lines = [], write = createEvidenceWriter(data => lines.push(data.toString('utf8')));
  await write('POINT', { activeMs: 1000 });
  assert.deepEqual(lines, ['CRYPTOID_IOS_POINT {"activeMs":1000}\n']);
});
