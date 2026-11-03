import { createHash } from 'node:crypto';

// Flush each bounded record before a synchronous child writes inherited stdout.
// Otherwise a queued large console.log can be mixed with that child's output.
export function createEvidenceWriter(write = data => new Promise((resolve, reject) => {
  process.stdout.write(data, error => error ? reject(error) : resolve());
})) {
  let sequence = 0;
  const emit = (kind, value) => write(Buffer.from('CRYPTOID_IOS_' + kind + ' ' + JSON.stringify(value) + '\n'));
  return async (kind, value) => {
    const encoded = JSON.stringify(value);
    if (Buffer.byteLength(encoded) <= 12000) return emit(kind, value);
    const characters = Array.from(encoded), total = Math.ceil(characters.length / 2000);
    const id = String(++sequence) + '-' + kind;
    const sha256 = createHash('sha256').update(encoded).digest('hex');
    for (let index = 0; index < total; index++) await emit('CHUNK', { id, kind, index, total, sha256,
      data: characters.slice(index * 2000, (index + 1) * 2000).join('') });
  };
}
