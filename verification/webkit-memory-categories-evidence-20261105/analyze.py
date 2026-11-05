from pathlib import Path
import hashlib,json,statistics,zipfile,sys
base=Path(__file__).parent
blob=(base/'original.zip').read_bytes()
assert len(blob)==24322
assert hashlib.sha256(blob).hexdigest()=='3ee581995988039bf84bd95c9c88a38f5827d8413f1a7486198643cb9b38f80c'
with zipfile.ZipFile(base/'original.zip') as z:
 assert z.testzip() is None
 assert set(z.namelist())=={'build-info.json','observation.json','synthetic-report.json'}
 members={n:z.read(n) for n in z.namelist()}
o=json.loads(members['observation.json']);report=json.loads(members['synthetic-report.json'])
assert o['complete'] is True and o['whiteScreenFixed'] is False
assert o['sourceCommit']=='fa6239bedb24b4e417d28ec8a94a7195acd168d6'
assert o['normalExitVerified'] and o['normalReportVerified'] and o['oldContextClosed']
assert report['stopwatch']['latest']['mode']=='ended'
for k in ['id','source','mode','elapsedMs']:
 assert report['criticalDiagnostics']['latest']['clock'][k]==report['stopwatch']['latest'][k]
assert report['briefDiagnostics']['latest']['resourceCheckpoint']['clockId']==report['stopwatch']['latest']['id']
stages=[]
for s in o['stages']:
 values=[p['memory']['summedPssKiB']/1024 for p in s['points']]
 assert len(values)==s['pssMiB']['samples']
 for key,value in [('mean',statistics.mean(values)),('min',min(values)),('max',max(values))]:
  assert abs(value-s['pssMiB'][key])<1e-8
 bypid={}
 for p in s['points']:
  assert p['memory']['contentProcessObserved'] is True
  assert abs(sum(x['pssKiB'] for x in p['memory']['processes'])-p['memory']['summedPssKiB'])<1e-6
  for process in p['memory']['processes']:
   bypid.setdefault((process['pid'],process['role']),[]).append(process['pssKiB']/1024)
 categories={}
 for u in s['nativeUpdates']:
  assert set(c['type'] for c in u['event']['categories'])=={'javascript','jit','images','layers','page','other'}
  for c in u['event']['categories']:
   assert isinstance(c['size'],(int,float)) and c['size']>=0
   categories.setdefault(c['type'],[]).append(c['size']/1048576)
 layers=s['layerOwners']['layers']
 stages.append({'label':s['label'],'pssMiB':s['pssMiB'],
  'processes':[{'pid':pid,'role':role,'meanPssMiB':statistics.mean(v)} for (pid,role),v in sorted(bypid.items())],
  'nativeMiB':{k:{'samples':len(v),'first':v[0],'last':v[-1],'min':min(v),'max':max(v),'mean':statistics.mean(v)} for k,v in categories.items()},
  'layerCount':len(layers),'layerBackingEstimateBytes':sum(l['memory'] for l in layers),
  'largestLayerEstimates':[{'node':l['node'],'memory':l['memory'],'reasons':l.get('reasons')} for l in sorted(layers,key=lambda l:l['memory'],reverse=True)[:5]]})
old={p['pid'] for s in stages[:-1] for p in s['processes'] if p['role']=='webkit-content'}
new={p['pid'] for p in stages[-1]['processes'] if p['role']=='webkit-content'}
assert old.isdisjoint(new)
summary={'version':1,'offlineOnly':True,'originalZipBytes':len(blob),'originalZipSha256':hashlib.sha256(blob).hexdigest(),
 'members':{n:{'bytes':len(b),'sha256':hashlib.sha256(b).hexdigest()} for n,b in members.items()},
 'sourceCommit':o['sourceCommit'],'sourceTree':o['sourceTree'],'compiledControllerSha256':o['compiledControllerSha256'],
 'stages':stages,'nativePressureEvents':o['nativePressureEvents'],
 'oldContentPids':sorted(old),'freshContentPids':sorted(new),'contentProcessReplacedAfterContextClose':True,
 'categoryPssAndLayerEstimatesNotAdditive':True,'otherCategoryIsNotAllocationOwnership':True,
 'nullCategoryIsNotProofOfNoMemory':True,'whiteScreenFixed':False,'physicalDevice':False}
target=Path(sys.argv[1]) if len(sys.argv)>1 else base/'independent-summary.json'
target.write_text(json.dumps(summary,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'stages':len(stages),'rawPssRecomputed':True,'normalReportVerified':True,'oldContentPids':sorted(old),'freshContentPids':sorted(new),'output':str(target)}))
