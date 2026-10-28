import test from 'node:test';
import assert from 'node:assert/strict';
import { summarizeHeap, compareHeaps } from './heapObjects.mjs';
const sample = () => ({ snapshot: { meta: { node_fields: ['name', 'self_size', 'type', 'detachedness'],
  node_types: ['string', 'number', ['object', 'native', 'string'], 'number'] } },
  strings: ['HTMLDivElement', 'Object', 'https://private.invalid/token', '<div private="value">'],
  nodes: [0, 40, 1, 2, 1, 24, 0, 0, 2, 400, 2, 0, 3, 16, 1, 1] });
test('heap aggregation follows metadata and excludes string/markup values', () => {
  const result = summarizeHeap(sample());
  assert.equal(result.nodes, 4); assert.equal(result.selfBytes, 480);
  assert.deepEqual(result.classes.find(row => row.name === 'HTMLDivElement').detachednessFlags, { 2: 1 });
  assert.equal(result.classes.find(row => row.name === 'HTMLTag_div').selfBytes, 16);
  assert.ok(!JSON.stringify(result).includes('private'));
  const broken = sample(); broken.nodes.push(0); assert.throws(() => summarizeHeap(broken));
});
test('heap differences report self sizes and count changes, without invented retained sizes', () => {
  const before = summarizeHeap(sample()), data = sample(); data.nodes.push(0, 40, 1, 2);
  const delta = compareHeaps(before, summarizeHeap(data));
  assert.equal(delta.nodesDelta, 1); assert.equal(delta.selfBytesDelta, 40);
  assert.equal(delta.classes[0].name, 'HTMLDivElement'); assert.equal(delta.classes[0].countDelta, 1);
  assert.equal(delta.classes[0].retainedBytes, undefined);
});
test('class rank changes do not turn an omitted exported class into a false new allocation',()=>{
  const data=sample();data.strings=[];data.nodes=[];
  for(let i=0;i<160;i++){data.strings.push('Class'+i);data.nodes.push(i,160-i,0,0);}
  const before=summarizeHeap(data);data.nodes[159*4+1]=1000;
  const after=summarizeHeap(data),delta=compareHeaps(before,after).classes.find(x=>x.name==='Class159');
  assert.equal(delta.countDelta,0);assert.equal(delta.selfBytesDelta,999);
  assert.equal(before.classes.length,150);assert.ok(!JSON.stringify(before).includes('comparisonClasses'));
});
