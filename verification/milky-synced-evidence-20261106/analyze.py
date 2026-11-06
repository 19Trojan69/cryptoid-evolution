from pathlib import Path
import json,hashlib,zipfile,statistics,sys
base=Path(__file__).parent
source='e1e2b0aa29a49711f98890b6a8147ab1e0f43a7c'
orders=['control-first','hidden-first']
result={'version':1,'sourceCommit':source,'activeWindowMs':[60000,90000],'binWidthMs':5000,
 'physicalDevice':False,'pixelEquivalenceClaimed':False,'whiteScreenFixed':False,
 'workloadEqualityClaimed':False,'rawNativeCategoriesAreNotPssOrAllocationOwnership':True,'artifacts':{},'pairs':[]}
def mean(xs):return statistics.mean(xs)
for order in orders:
 archive=base/(order+'.zip')
 receipt=next(x for x in json.loads((base/'artifact-receipt.json').read_text()) if x['order']==order)
 assert archive.stat().st_size==receipt['bytes']
 assert hashlib.sha256(archive.read_bytes()).hexdigest()==receipt['sha256']
 with zipfile.ZipFile(archive) as z:
  assert z.testzip() is None
  names=z.namelist()
  for n in names:assert not Path(n).is_absolute() and '..' not in Path(n).parts
  members={n:z.read(n) for n in names}
 result['artifacts'][order]={'bytes':archive.stat().st_size,'sha256':hashlib.sha256(archive.read_bytes()).hexdigest(),
  'members':{n:{'bytes':len(v),'sha256':hashlib.sha256(v).hexdigest()} for n,v in members.items()}}
 pair={'order':order,'runs':{}}
 for condition in ['control','milky-hidden']:
  get=lambda suffix:next(v for n,v in members.items() if n.endswith('/'+condition+'/'+suffix))
  o=json.loads(get('observation.json'));report=json.loads(get('synthetic-report.json'));build=json.loads(get('build-info.json'))
  assert o['complete'] is True and o['pairOrder']==order and o['condition']==condition
  assert o['sourceCommit']==build['sourceCommit']==source
  assert o['sourceTree']==build['sourceTree']=='52cd5b85b77b5c212d9d3937772779ec4a689056'
  assert o['compiledControllerSha256']=='00e3796f3eb0bbaec3f2ae16bb5ac46a2d88c8abc6647fee0e1a5b634249a18d'
  assert o['extraPeriodicGameInspector'] and o['readOnlyHostWarmupPolling'] and o['readOnlyActivePointPolling']
  assert o['normalExitVerified'] and o['normalReportVerified'] and o['oldContextClosed']
  assert report['stopwatch']['latest']['mode']=='ended'
  for k in ['id','source','mode','elapsedMs']:
   assert report['criticalDiagnostics']['latest']['clock'][k]==report['stopwatch']['latest'][k]
  assert report['briefDiagnostics']['latest']['resourceCheckpoint']['clockId']==report['stopwatch']['latest']['id']
  stages=[]
  for s in o['stages']:
   ps=[p['memory']['summedPssKiB']/1024 for p in s['points']]
   assert abs(mean(ps)-s['pssMiB']['mean'])<1e-8
   for p in s['points']:
    assert p['memory']['contentProcessObserved']
    assert abs(sum(q['pssKiB'] for q in p['memory']['processes'])-p['memory']['summedPssKiB'])<1e-6
   if s['after']['mounted']:
    assert len(s['singleBackgroundProbe'])==1
    assert s['singleBackgroundProbe'][0]['display']==('block' if condition=='control' else 'none')
   stages.append({'label':s['label'],'pssMiB':s['pssMiB'],
    'contentPids':sorted({q['pid'] for p in s['points'] for q in p['memory']['processes'] if q['role']=='webkit-content'})})
  s=next(s for s in o['stages'] if s['label']=='playing-original-boss')
  before=s['before'];after=s['after'];a=before['clock']['latest'];b=after['clock']['latest']
  assert 60000<=a['elapsedMs']<=62000 and 90000<=b['elapsedMs']<=95000
  assert a['id']==b['id'] and before['timeOrigin']==after['timeOrigin']
  for v in [before,after]:
   assert v['hidden'] is False and v['mounted'] and v['scene']['status']=='playing'
   assert v['scene']['phase']=='ATTACK_CYCLE' and v['scene']['encounter']=='boss-fight' and v['scene']['reactorOpen']
   assert v['scene']['sector']==20 and v['scene']['bossId']==2 and v['scene']['liveTurrets']==0
   assert v['scene']['technicalPause'] is False and v['clock']['latest']['unobservedGaps']==0
  eligible=[];previous=-1
  for p in s['points']:
   q=p['phasePoint'];assert q['source']==source and q['clockId']==a['id'] and q['timeOrigin']==before['timeOrigin']
   assert q['elapsedMs']>=previous;previous=q['elapsedMs']
   assert q['phase']=='ATTACK_CYCLE' and q['encounter']=='boss-fight'
   assert p['observationStartedAt']<=p['observationFinishedAt']
   if 60000<=q['elapsedMs']<90000:eligible.append(p)
  bins=[]
  for i in range(6):
   lo=60000+i*5000;hi=lo+5000;points=[p for p in eligible if lo<=p['phasePoint']['elapsedMs']<hi];assert points
   old=o['activeWindow']['bins'][i];pss=[p['memory']['summedPssKiB']/1024 for p in points]
   assert old['samples']==len(points) and abs(old['meanPssMiB']-mean(pss))<1e-8
   content=[sum(q['pssKiB'] for q in p['memory']['processes'] if q['role']=='webkit-content')/1024 for p in points]
   bins.append({'from':lo,'to':hi,'samples':len(points),'meanPssMiB':mean(pss),'meanContentPssMiB':mean(content),
    'checkpointRange':[points[0]['phasePoint']['elapsedMs'],points[-1]['phasePoint']['elapsedMs']],
    'volleyRange':[points[0]['phasePoint']['coreVolley'],points[-1]['phasePoint']['coreVolley']],
    'enemyRange':[min(p['phasePoint']['enemies'] for p in points),max(p['phasePoint']['enemies'] for p in points)],
    'pssRangeMiB':[min(pss),max(pss)]})
  native={}
  for typ in ['javascript','images','other','layers','page','jit']:
   vals=[next(c['size'] for c in u['event']['categories'] if c['type']==typ)/1048576 for u in s['nativeUpdates']]
   native[typ]={'samples':len(vals),'meanMiB':mean(vals),'rangeMiB':[min(vals),max(vals)]}
  pair['runs'][condition]={'engine':o['engineVersion'],'stages':stages,'bins':bins,
   'equalBinMeanPssMiB':mean([x['meanPssMiB'] for x in bins]),
   'equalBinMeanContentPssMiB':mean([x['meanContentPssMiB'] for x in bins]),
   'capturedPssMs':[a['elapsedMs'],b['elapsedMs']],
   'volleyWindow':[before['scene']['coreVolley'],after['scene']['coreVolley']],
   'nativeFullActiveStageMiB':native,'pressureEvents':o['nativePressureEvents'],
   'firstStageAt':o['stages'][0]['startedAt'],'finishedAt':o['finishedAt']}
 first,second=(['control','milky-hidden'] if order=='control-first' else ['milky-hidden','control'])
 assert pair['runs'][first]['finishedAt']<pair['runs'][second]['firstStageAt']
 c=pair['runs']['control'];h=pair['runs']['milky-hidden']
 assert set(c['stages'][4]['contentPids']).isdisjoint(h['stages'][4]['contentPids'])
 pair['hiddenMinusControlEqualBinMeanPssMiB']=h['equalBinMeanPssMiB']-c['equalBinMeanPssMiB']
 pair['binDeltasMiB']=[x['meanPssMiB']-y['meanPssMiB'] for x,y in zip(h['bins'],c['bins'])]
 result['pairs'].append(pair)
target=base/'independent-comparison.json';target.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
print(json.dumps([{'order':p['order'],'deltaMiB':p['hiddenMinusControlEqualBinMeanPssMiB'],'binDeltasMiB':p['binDeltasMiB'],
 'runs':{k:{key:r[key] for key in ['equalBinMeanPssMiB','capturedPssMs','volleyWindow']} for k,r in p['runs'].items()}} for p in result['pairs']],ensure_ascii=False,indent=2))
