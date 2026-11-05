from pathlib import Path
import json,hashlib,statistics,zipfile,sys
base=Path(__file__).parent
archive=base/'original.zip'
assert archive.stat().st_size==49045
assert hashlib.sha256(archive.read_bytes()).hexdigest()=='97c336ffa3f03ed7c44149347bb5aac4eba2a61beb9745a4051d493f40d4dbe8'
with zipfile.ZipFile(archive) as z:
 assert z.testzip() is None
 names=z.namelist()
 for name in names:assert not Path(name).is_absolute() and '..' not in Path(name).parts
 data={name:z.read(name) for name in names}
observations={}
reports={}
for condition in ['control','milky-hidden']:
 obs=[n for n in names if n.endswith(condition+'/observation.json')]
 rep=[n for n in names if n.endswith(condition+'/synthetic-report.json')]
 assert len(obs)==len(rep)==1
 o=json.loads(data[obs[0]]);r=json.loads(data[rep[0]])
 assert o['complete'] is True and o['condition']==condition
 assert o['sourceCommit']=='dace335f944d25734464fb68890dc07f8fa50838'
 assert o['compiledControllerSha256']=='00e3796f3eb0bbaec3f2ae16bb5ac46a2d88c8abc6647fee0e1a5b634249a18d'
 assert o['normalExitVerified'] and o['normalReportVerified'] and o['oldContextClosed']
 assert o['renderSuppressionIsDiagnosisOnly'] and not o['pixelEquivalenceClaimed']
 assert o['whiteScreenFixed'] is False
 assert r['stopwatch']['latest']['mode']=='ended'
 for k in ['id','source','mode','elapsedMs']:
  assert r['criticalDiagnostics']['latest']['clock'][k]==r['stopwatch']['latest'][k]
 assert r['briefDiagnostics']['latest']['resourceCheckpoint']['clockId']==r['stopwatch']['latest']['id']
 for stage in o['stages']:
  values=[p['memory']['summedPssKiB']/1024 for p in stage['points']]
  assert abs(statistics.mean(values)-stage['pssMiB']['mean'])<1e-8
  for p in stage['points']:
   assert p['memory']['contentProcessObserved'] is True
   assert abs(sum(q['pssKiB'] for q in p['memory']['processes'])-p['memory']['summedPssKiB'])<1e-6
  if stage['after']['mounted']:
   assert len(stage['singleBackgroundProbe'])==1
   assert stage['singleBackgroundProbe'][0]['display']==('block' if condition=='control' else 'none')
   assert stage['singleBackgroundProbe'][0]['filter']=='blur(11px)'
 observations[condition]=o
 reports[condition]=r
def native(stage,kind):
 vals=[next(c['size'] for c in u['event']['categories'] if c['type']==kind)/1048576 for u in stage['nativeUpdates']]
 return {'samples':len(vals),'meanMiB':statistics.mean(vals),'minMiB':min(vals),'maxMiB':max(vals),'firstMiB':vals[0],'lastMiB':vals[-1]}
summary={'version':1,'originalZip':{'bytes':archive.stat().st_size,'sha256':hashlib.sha256(archive.read_bytes()).hexdigest()},
 'members':{n:{'bytes':len(b),'sha256':hashlib.sha256(b).hexdigest()} for n,b in data.items()},
 'sourceCommit':'dace335f944d25734464fb68890dc07f8fa50838','oneUnseededInstrumentedPair':True,
 'pixelEquivalenceClaimed':False,'physicalDevice':False,'whiteScreenFixed':False,'activeCaptureStartNotMatched':True,'coreVolleyWorkloadNotMatched':True,'phaseComparison':[]}
assert [s['label'] for s in observations['control']['stages']]==[s['label'] for s in observations['milky-hidden']['stages']]
for control,candidate in zip(observations['control']['stages'],observations['milky-hidden']['stages']):
 row={'stage':control['label']}
 for condition,s in [('control',control),('milkyHidden',candidate)]:
  pids=sorted({p['pid'] for point in s['points'] for p in point['memory']['processes'] if p['role']=='webkit-content'})
  row[condition]={'pssMiB':s['pssMiB'],'native':{kind:native(s,kind) for kind in ['javascript','images','layers','page','other','jit']},
   'contentPids':pids,'layerEstimateBytes':sum(l['memory'] for l in s['layerOwners']['layers']),
   'singleBackgroundProbe':s.get('singleBackgroundProbe'),
   'clockWindow':{edge:(s[edge].get('clock') or {}).get('latest',{}).get('elapsedMs') for edge in ['before','after']},
   'volleyWindow':{edge:(s[edge].get('scene') or {}).get('coreVolley') for edge in ['before','after']}}
 row['candidateMinusControlPssMeanMiB']=candidate['pssMiB']['mean']-control['pssMiB']['mean']
 summary['phaseComparison'].append(row)
for row in summary['phaseComparison']:assert set(row['control']['contentPids']).isdisjoint(row['milkyHidden']['contentPids'])
summary['nativePressureEvents']={k:o['nativePressureEvents'] for k,o in observations.items()}
summary['sourceAndNormalReportConditionsVerified']=True
target=Path(sys.argv[1]) if len(sys.argv)>1 else base/'independent-comparison.json'
target.write_text(json.dumps(summary,ensure_ascii=False,indent=2)+'\n')
print(json.dumps([{k:r[k] for k in ['stage','candidateMinusControlPssMeanMiB']}|{'control':r['control']['pssMiB'],'candidate':r['milkyHidden']['pssMiB']} for r in summary['phaseComparison']],ensure_ascii=False,indent=2))
