"""Inspect already downloaded synthetic captures; no browser/device/game runs."""
from array import array
from collections import Counter, deque
import gzip
import hashlib
import json
from pathlib import Path
import sys
import zipfile

SELECTED = {'AudioBuffer', 'AudioBufferSourceNode', 'AudioContext', 'CSSAnimation',
            'KeyframeEffect', 'CanvasRenderingContext2D', 'DOMRectReadOnly'}


def inspect_heap(data):
    meta = data['snapshot']['meta']
    fields, edge_fields = meta['node_fields'], meta['edge_fields']
    types, edge_types = meta['node_types'][0], meta['edge_types'][0]
    nodes, edges, strings = data['nodes'], data['edges'], data['strings']
    width, edge_width = len(fields), len(edge_fields)
    assert len(nodes) % width == len(edges) % edge_width == 0
    nt, nn, nc, ni = [fields.index(k) for k in ['type', 'name', 'edge_count', 'id']]
    et, en, to = [edge_fields.index(k) for k in ['type', 'name_or_index', 'to_node']]
    count, first, offsets, position = Counter(), {}, array('I', [0]), 0
    for index in range(len(nodes)//width):
        start = index*width
        name = strings[nodes[start+nn]]
        position += nodes[start+nc]*edge_width
        offsets.append(position)
        if types[nodes[start+nt]] == 'native' and name in SELECTED:
            count[name] += 1
            first.setdefault(name, index)
    assert position == len(edges)
    # A shortest root path, excluding edges explicitly marked weak. This is
    # neither a dominator calculation nor a retained-size/native-RAM metric.
    n = len(nodes)//width
    previous, incoming = array('i', [-2])*n, array('i', [-1])*n
    previous[0] = -1
    queue, remaining = deque([0]), set(first.values())
    while queue and remaining:
        index = queue.popleft()
        for offset in range(offsets[index], offsets[index+1], edge_width):
            kind = edge_types[edges[offset+et]]
            if kind == 'weak':
                continue
            assert edges[offset+to] % width == 0
            target = edges[offset+to]//width
            assert 0 <= target < n
            if previous[target] != -2:
                continue
            previous[target], incoming[target] = index, offset
            queue.append(target)
            remaining.discard(target)
    paths = {}
    for name, index in first.items():
        if name not in ['AudioContext', 'CanvasRenderingContext2D', 'DOMRectReadOnly']:
            continue
        path = []
        while index >= 0:
            offset = incoming[index]
            edge = None
            if offset >= 0:
                kind = edge_types[edges[offset+et]]
                label = edges[offset+en] if kind in ['element', 'hidden'] else strings[edges[offset+en]]
                edge = kind+':'+str(label)
            path.append({'type': types[nodes[index*width+nt]], 'name': strings[nodes[index*width+nn]],
                         'nodeId': nodes[index*width+ni], 'incoming': edge})
            index = previous[index]
        paths[name] = list(reversed(path))
    return {'nodes': n, 'edges': len(edges)//edge_width,
            'nativeCounts': {name: count[name] for name in sorted(SELECTED)}, 'firstObjectShortestPaths': paths}


def inspect_zip(path):
    results = []
    with zipfile.ZipFile(path) as archive:
        assert archive.testzip() is None
        attribution_name = next(x for x in archive.namelist() if x.endswith('/attribution.json'))
        capture = json.loads(archive.read(attribution_name))
        assert capture['complete'] and capture['observedActiveMs'] >= 1200000
        for receipt in capture['snapshots']:
            member = attribution_name.rsplit('/', 1)[0]+'/'+receipt['file']
            compressed = archive.read(member)
            raw = gzip.decompress(compressed)
            assert len(compressed) == receipt['compressedBytes']
            assert len(raw) == receipt['bytes']
            assert hashlib.sha256(compressed).hexdigest() == receipt['sha256']
            data = json.loads(raw)
            row = inspect_heap(data)
            assert row['nodes'] == receipt['nodes']
            row.update(phase=receipt['label'], compressedSha256=receipt['sha256'],
                       rawSha256=hashlib.sha256(raw).hexdigest(), afterExplicitInactiveGc=True)
            results.append(row)
    return {'archive': path.name, 'archiveSha256': hashlib.sha256(path.read_bytes()).hexdigest(),
            'runId': 41769708523, 'sourceCommit': capture['sourceCommit'], 'heaps': results}


if __name__ == '__main__':
    paths = [Path(value) for value in sys.argv[1:]]
    assert paths, 'Pass the original downloaded synthetic memory ZIP archives'
    report = {'version': 1, 'inputs': [inspect_zip(path) for path in paths],
              'limits': ['Existing Linux Chromium inactive snapshots after explicit GC.',
                         'Counts and shortest graph paths only; not dominator retained size or phone/GPU memory.',
                         'A native count without a growth trend is not a demonstrated leak.'],
              'nativeWhiteScreenCauseEstablished': False}
    print(json.dumps(report, indent=2))
