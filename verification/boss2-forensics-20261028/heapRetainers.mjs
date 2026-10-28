import assert from 'node:assert/strict';
import { heapClassName } from './heapObjects.mjs';
const properties = new Set(('current memoizedState memoizedProps pendingProps alternate stateNode children return child sibling next queue pending baseState ref updateQueue dependencies lastEffect callback listener listeners value values entries cache pins records assets hull fire smoke canvas images textures sourceImages readyImages readyTextures effectVoices weaponMixVoices bossVoices samples source gain pan buffer onended effects shots enemyShots asteroids powerUps detail target document window performance state root _owner _currentValue _currentValue2 __crossDeviceTest inspect protect park prototype constructor __proto__').split(' '));
for(const name of ['stateRef','soundRef','musicRef','performanceProbeRef','full','tail','probe','lastGraphics','observed','events','trace','lastSnapshot','pendingPaints','pendingSources','visualCenters'])properties.add(name);

// Only synthetic laboratory graphs enter this function. Raw node IDs, string
// values, DOM attributes and unapproved property names never enter the report.
export function inspectRetainers(snapshot, baseline = null) {
  const meta = snapshot?.snapshot?.meta, nodes = snapshot?.nodes, edges = snapshot?.edges;
  assert.ok(meta && Array.isArray(nodes) && Array.isArray(edges));
  const width = meta.node_fields.length, edgeWidth = meta.edge_fields.length;
  const field = (list, name) => { const n = list.indexOf(name); assert.ok(n >= 0, 'Missing heap field ' + name); return n; };
  const nt = field(meta.node_fields,'type'), nn = field(meta.node_fields,'name'), ni = field(meta.node_fields,'id'),
    ns = field(meta.node_fields,'self_size'), ne = field(meta.node_fields,'edge_count');
  const et = field(meta.edge_fields,'type'), en = field(meta.edge_fields,'name_or_index'), ed = field(meta.edge_fields,'to_node');
  assert.ok(width && edgeWidth && nodes.length % width === 0 && edges.length % edgeWidth === 0);
  const count = nodes.length / width;
  assert.ok(count > 0 && count <= 1_000_000 && edges.length / edgeWidth <= 10_000_000, 'Heap graph analysis budget');
  const nodeTypes = meta.node_types[nt], edgeTypes = meta.edge_types[et];
  const ids = new Set(), classes = new Map(), members = new Map(), starts = new Uint32Array(count + 1);
  let edgeOffset = 0;
  const describe = index => {
    const offset = index * width, type = nodeTypes[nodes[offset + nt]];
    return type === 'native' || type === 'object'
      ? { type, name: heapClassName(snapshot.strings[nodes[offset + nn]], type) }
      : { type: ['synthetic','closure','array','string','concatenated string','sliced string','code','hidden','number','regexp','symbol','bigint','object shape'].includes(type) ? type : 'other' };
  };
  for (let i = 0; i < count; i++) {
    const offset = i * width, row = describe(i); starts[i] = edgeOffset;
    const length = nodes[offset + ne]; assert.ok(Number.isSafeInteger(length) && length >= 0);
    edgeOffset += length * edgeWidth; assert.ok(edgeOffset <= edges.length);
    if (!row.name) continue;
    const id = nodes[offset + ni], bytes = nodes[offset + ns];
    assert.ok(Number.isSafeInteger(id) && Number.isSafeInteger(bytes) && bytes >= 0);
    if (id > 0) ids.add(id);
    const key = row.type + ':' + row.name, group = classes.get(key) ?? { ...row, count:0, selfBytes:0 };
    group.count++; group.selfBytes += bytes; classes.set(key,group);
    if (baseline && id > 0 && !baseline.ids.has(id)) {
      const list = members.get(key) ?? []; if (list.length < 3) list.push(i); members.set(key,list);
    }
  }
  starts[count] = edgeOffset; assert.equal(edgeOffset,edges.length,'Complete heap edge table');
  const state = { ids, classes }; // Private, in-memory baseline for the same isolate.
  if (!baseline) return { state, report:{ baseline:true, classifiedObjects:ids.size, paths:[] } };
  const growth = [...classes.entries()].map(([key,row]) => ({ key, ...row,
    countDelta:row.count-(baseline.classes.get(key)?.count||0),
    selfBytesDelta:row.selfBytes-(baseline.classes.get(key)?.selfBytes||0) }))
    .filter(row=>row.countDelta>0 && members.has(row.key)).sort((a,b)=>b.selfBytesDelta-a.selfBytesDelta).slice(0,8);
  const parent = new Int32Array(count).fill(-1), incoming = new Int32Array(count).fill(-1), queue = new Uint32Array(count), depths = new Uint32Array(count);
  let read=0,write=1;parent[0]=0;queue[0]=0;
  while(read<write) {
    const from=queue[read++];
    for(let e=starts[from];e<starts[from+1];e+=edgeWidth) {
      if(edgeTypes[edges[e+et]]==='weak')continue;
      const target=edges[e+ed];assert.ok(Number.isSafeInteger(target)&&target>=0&&target<nodes.length&&target%width===0);
      const to=target/width;
      if(parent[to]!==-1)continue;
      parent[to]=from;incoming[to]=e;depths[to]=depths[from]+1;queue[write++]=to;
    }
  }
  const paths=[];
  for(const group of growth)for(const candidate of members.get(group.key).slice(0,2)) {
    const chain=[];let at=candidate,steps=0;
    if(parent[at]===-1){paths.push({type:group.type,name:group.name,reachableViaNonWeakEdges:false});continue;}
    while(true) {
      if(steps<11||depths[at]<5) {
        const e=incoming[at],kind=e>=0?edgeTypes[edges[e+et]]:'root';
        const raw=e>=0&&kind!=='element'?snapshot.strings[edges[e+en]]:undefined;
        const via=['property','context'].includes(kind)&&properties.has(raw)?kind+'.'+raw
          : ['root','property','context','internal','hidden','element','shortcut'].includes(kind)?kind:'other';
        chain.push({via,...describe(at)});
      }
      if(at===0)break;
      at=parent[at];steps++;assert.ok(steps<count,'No cycle in traversal parents');
    }
    chain.reverse();const depth=depths[candidate]+1,omitted=depth-chain.length;
    if(omitted>0)chain.splice(5,0,{via:'omitted',type:'omitted',count:omitted});
    paths.push({type:group.type,name:group.name,reachableViaNonWeakEdges:true,novelty:'not-in-warm-baseline',
      depth,omittedNodes:omitted,path:chain});
  }
  return { state, report:{ baseline:false, classifiedObjects:ids.size,
    growth:growth.map(({key,...row})=>row),paths,
    scope:'Bounded shortest snapshot paths from synthetic root, excluding edges tagged weak. May include synthetic/native/inspector roots. Paths are candidates, not dominators, retained sizes, allocation stacks or proof that the object is unnecessary. Raw IDs/strings and unapproved property names are omitted.' } };
}
