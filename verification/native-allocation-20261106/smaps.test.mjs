import test from 'node:test';import assert from 'node:assert/strict';import {summarizeSmaps} from './smaps.mjs';
const region=(header,pss)=>header+'\nSize: 100 kB\nRss: 80 kB\nPss: '+pss+' kB\nPrivate_Dirty: 40 kB\n';
test('keeps heap, anonymous and library PSS distinct without saving addresses',()=>{
 const s=summarizeSmaps(region('1000-2000 rw-p 0000 00:00 0 [heap]',50)+region('2000-3000 rw-p 0000 00:00 0',20)+region('3000-4000 r-xp 0000 08:01 2 /opt/browser/libWPEWebKit-1.0.so.3',10));
 assert.equal(s.mappings,3);assert.deepEqual(s.groups.map(x=>x.Pss),[50,20,10]);assert.ok(!JSON.stringify(s).includes('1000-2000'));assert.ok(!JSON.stringify(s).includes('/opt/browser'));
});
test('rejects empty or headerless kernel observations',()=>{assert.throws(()=>summarizeSmaps(''));assert.throws(()=>summarizeSmaps('Pss: 1 kB'));});
test('aggregates two mappings in the same category and keeps virtual size separate',()=>{const s=summarizeSmaps(region('1000-2000 rw-p 0000 00:00 0',12)+region('2000-3000 rw-p 0000 00:00 0',13));assert.equal(s.groups[0].Pss,25);assert.equal(s.groups[0].Size,200);});
