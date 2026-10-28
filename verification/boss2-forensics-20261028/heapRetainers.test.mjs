import test from 'node:test';
import assert from 'node:assert/strict';
import { inspectRetainers } from './heapRetainers.mjs';
const meta={node_fields:['type','name','id','self_size','edge_count'],node_types:[['synthetic','object','native','string'],'string','number','number','number'],
  edge_fields:['type','name_or_index','to_node'],edge_types:[['internal','property','weak'],'string_or_number','node']};
const strings=['root','Window','Map','HTMLImageElement','private-value-123','cache','entries','private-field-456'];
const before=()=>({snapshot:{meta},strings,nodes:[0,0,1,0,1, 1,1,3,8,1, 1,2,5,8,0],edges:[0,0,5,1,5,10]});
const after=()=>({snapshot:{meta},strings,nodes:[0,0,1,0,2, 1,1,3,8,1, 1,2,5,8,1, 2,3,7,40,1, 3,4,9,1000,0],
  edges:[0,0,5,2,7,15,1,5,10,1,6,15,1,7,20]});
test('retainer paths follow non-weak reachability, identify new objects and hide values/IDs',()=>{
  const baseline=inspectRetainers(before());const result=inspectRetainers(after(),baseline.state).report;
  assert.equal(result.growth[0].name,'HTMLImageElement');assert.equal(result.growth[0].countDelta,1);
  assert.deepEqual(result.paths[0].path.map(x=>x.via),['root','internal','property.cache','property.entries']);
  assert.equal(result.paths[0].depth,4);assert.ok(!JSON.stringify(result).includes('private-value-123'));
  assert.ok(!JSON.stringify(result).includes('private-field-456'));assert.equal(result.paths[0].id,undefined);
});
test('malformed graph edges and budget overruns cannot be accepted as successful analysis',()=>{
  const data=after();data.edges[2]=99999;
  assert.throws(()=>inspectRetainers(data,inspectRetainers(before()).state));
  const missing=before();missing.edges=[];assert.throws(()=>inspectRetainers(missing));
});
