import assert from 'node:assert/strict';
export const windowBounds=Object.freeze({start:60000,end:90000,startGrace:2000,endGrace:5000,binMs:5000});
export function phasePoint(s,source){
 assert.equal(s.hidden,false);assert.equal(s.mounted,true);assert.equal(s.scene?.status,'playing');
 assert.equal(s.scene.technicalPause,false);assert.equal(s.scene.ownerDiagnostics,false);
 assert.equal(s.scene.encounter,'boss-fight');assert.equal(s.scene.phase,'ATTACK_CYCLE');
 assert.equal(s.scene.sector,20);assert.equal(s.scene.bossId,2);assert.equal(s.scene.liveTurrets,0);assert.equal(s.scene.reactorOpen,true);
 const c=s.clock?.latest;assert.equal(c?.mode,'running');assert.equal(c.source,source);assert.equal(c.unobservedGaps,0);
 assert.ok(Number.isFinite(c.elapsedMs)&&c.elapsedMs>=0);assert.ok(Number.isFinite(s.scene.frameAt));
 assert.ok(Number.isInteger(s.scene.coreVolley)&&s.scene.coreVolley>0);
 return {elapsedMs:c.elapsedMs,clockId:c.id,source:c.source,clockUpdatedAt:c.updatedAt,timeOrigin:s.timeOrigin,
  frameAt:s.scene.frameAt,coreVolley:s.scene.coreVolley,phase:s.scene.phase,encounter:s.scene.encounter,
  enemies:s.scene.enemies,shots:s.scene.shots,hostileShots:s.scene.hostileShots,effects:s.scene.effects,bossHealth:s.scene.bossHealth};
}
export function validateWindow(stage,source){
 const b=windowBounds,before=phasePoint(stage.before,source),after=phasePoint(stage.after,source);
 assert.equal(before.clockId,after.clockId);assert.equal(before.timeOrigin,after.timeOrigin);
 assert.ok(before.elapsedMs>=b.start&&before.elapsedMs<=b.start+b.startGrace,'Capture must start near the declared active window');
 assert.ok(after.elapsedMs>=b.end&&after.elapsedMs<=b.end+b.endGrace,'Capture must cover the declared active window');
 assert.ok(after.frameAt>before.frameAt);assert.ok(after.coreVolley>before.coreVolley);
 const bins=Array.from({length:(b.end-b.start)/b.binMs},(_,i)=>({from:b.start+i*b.binMs,to:b.start+(i+1)*b.binMs,points:[]}));
 let previous=-Infinity;
 for(const p of stage.points){
  const q=p.phasePoint;assert.ok(q,'Every active PSS point needs a paired existing-game observation');
  assert.equal(q.source,source);assert.equal(q.clockId,before.clockId);assert.equal(q.timeOrigin,before.timeOrigin);
  assert.equal(q.phase,'ATTACK_CYCLE');assert.equal(q.encounter,'boss-fight');
  assert.ok(Number.isFinite(q.elapsedMs)&&q.elapsedMs>=previous,'Active checkpoints cannot go backwards');previous=q.elapsedMs;
  assert.ok(p.memory.contentProcessObserved);assert.ok(Number.isFinite(p.memory.summedPssKiB));
  if(q.elapsedMs>=b.start&&q.elapsedMs<b.end)bins[Math.floor((q.elapsedMs-b.start)/b.binMs)].points.push(p);
 }
 for(const bin of bins)assert.ok(bin.points.length,'All six predefined active-time bins must be observed');
 return {bounds:b,before,after,bins:bins.map(bin=>({from:bin.from,to:bin.to,samples:bin.points.length,
  meanPssMiB:bin.points.reduce((a,p)=>a+p.memory.summedPssKiB/1024,0)/bin.points.length,
  checkpointRange:[bin.points[0].phasePoint.elapsedMs,bin.points.at(-1).phasePoint.elapsedMs],
  volleyRange:[bin.points[0].phasePoint.coreVolley,bin.points.at(-1).phasePoint.coreVolley]})),
  workloadEqualityClaimed:false,pollingAndProtocolInstrumentation:true};
}
