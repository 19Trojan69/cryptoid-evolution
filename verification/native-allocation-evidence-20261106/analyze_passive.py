from pathlib import Path
import json,zipfile,hashlib,statistics
base=Path(__file__).parent
receipt=json.loads((base/'passive-artifact-receipt.json').read_text())
p=base/'passive-original.zip';b=p.read_bytes()
assert len(b)==receipt['bytes'] and hashlib.sha256(b).hexdigest()==receipt['sha256']
with zipfile.ZipFile(p) as z:
 assert z.testzip() is None
 names=z.namelist()
 for n in names:assert not Path(n).is_absolute() and '..' not in Path(n).parts
 members={n:z.read(n) for n in names}
 r=json.loads(next(v for n,v in members.items() if n.endswith('result.json')))
assert r['complete'] is True
assert r['heaptrackInstrumentation'] is False and r['workerFileModified'] is False and r['gameClockEdited'] is False
assert r['sourceCommit']=='87f5dc28d1cb5054c0e40420848068eb0a156e56'
assert r['sourceTree']=='e1f5b13689129d6f19eb0ebc957cdf0ff62ea5a9'
assert r['originalWorkerElfSha256']=='cae96ae2b8f2668d9afab2bce22ac23d9a54f25e846909ddbc86fbcebfb2e925'
assert [c['cohort'] for c in r['cohorts']]==['control-page','prepared-menu','paused-scene']
summary={'version':1,'sourceCommit':r['sourceCommit'],'sourceTree':r['sourceTree'],'originalWorkerElfSha256':r['originalWorkerElfSha256'],
 'physicalDevice':False,'whiteScreenFixed':False,'heaptrackInjected':False,'cohorts':[],
 'artifact':receipt,'members':{n:{'bytes':len(v),'sha256':hashlib.sha256(v).hexdigest()} for n,v in members.items()},
 'mappingClassesAreNotAllocationOwners':True,'virtualSizeIsNotResidentMemory':True,'freshProcessStageDifferencesAreDescriptive':True}
seen=set()
for c in r['cohorts']:
 assert c['complete'] is True and len(c['snapshots'])==3
 if c['cohort']!='control-page':
  info=json.loads(next(v for n,v in members.items() if n.endswith(c['cohort']+'/build-info.json')))
  assert info['sourceCommit']==r['sourceCommit'] and info['sourceTree']==r['sourceTree'] and info['guestOnly']
  assert info['playerMuzzleLocalCandidate']['compiledVirtualControllerSha256']=='00e3796f3eb0bbaec3f2ae16bb5ac46a2d88c8abc6647fee0e1a5b634249a18d'
 if c['cohort']=='paused-scene':
  assert c['scene']['status']==c['finalScene']['status']=='paused'
  assert c['scene']['technicalPause'] is False and c['finalScene']['technicalPause'] is False
 groups={};perPoints=[];pss=[];rollup=[];mapped=[];pids=set();latency=[]
 for s in c['snapshots']:
  assert s['readFinishedAt']>=s['readStartedAt'];latency.append(s['readFinishedAt']-s['readStartedAt'])
  assert all(isinstance(x['pssKiB'],(float,int)) and x['pssKiB']>=0 for x in s['processes'])
  assert abs(sum(x['pssKiB'] for x in s['processes'])-s['processPssKiB'])<1e-6
  pss.append(s['processPssKiB']/1024);rollup.append(sum(x['rollupPssKiB'] for x in s['content'])/1024)
  point={}
  for process in s['content']:
   pids.add(process['pid']);assert process['originalElfVerified'] and process['profilerAbsent']
   sm=process['smaps'];assert sum(g['mappings'] for g in sm['groups'])==sm['mappings']
   for g in sm['groups']:
    for key in ['Size','Rss','Pss','Private_Dirty','Private_Clean','Shared_Dirty','Shared_Clean','Anonymous','Swap']:assert g[key]>=0
    assert g['Pss']<=g['Rss']<=g['Size']
    row=point.setdefault(g['kind'],{key:0 for key in ['Size','Rss','Pss','Private_Dirty','Private_Clean','Shared_Dirty','Shared_Clean','Anonymous','Swap']})
    for key in row:row[key]+=g[key]
  mapped.append(sum(g['Pss'] for g in point.values())/1024);perPoints.append(point)
  for key,g in point.items():groups.setdefault(key,[]).append(g)
 assert pids.isdisjoint(seen);seen.update(pids)
 meanGroups=[{'kind':key,**{k+'MiB':statistics.mean([point.get(key,{}).get(k,0)/1024 for point in perPoints]) for k in gs[0]}} for key,gs in groups.items()]
 assert abs(sum(g['PssMiB'] for g in meanGroups)-statistics.mean(mapped))<1e-7
 # Absent mapping classes are retained per raw point, not fabricated as allocator ownership.
 meanGroups.sort(key=lambda g:g['PssMiB'],reverse=True)
 summary['cohorts'].append({'cohort':c['cohort'],'pids':sorted(pids),'points':3,
  'meanBrowserPssMiB':statistics.mean(pss),'rangeBrowserPssMiB':[min(pss),max(pss)],
  'meanContentRollupPssMiB':statistics.mean(rollup),'meanContentMappedPssMiB':statistics.mean(mapped),
  'kernelReadWallMs':latency,'mappingGroups':meanGroups})
(base/'passive-independent-summary.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2)+'\n')
print(json.dumps([{k:v for k,v in c.items() if k!='mappingGroups'}|{'topMappingGroups':c['mappingGroups'][:8]} for c in summary['cohorts']],ensure_ascii=False,indent=2))
