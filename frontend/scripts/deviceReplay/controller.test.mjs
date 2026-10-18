import test from 'node:test';
import assert from 'node:assert/strict';
import { createDeviceReplay, REPLAY_PHASES } from './controller.mjs';

function fixture(options={}) {
  let time=0, status='playing', resets=0;
  const starts=[], progress=[], reports=[];
  const replay=createDeviceReplay({now:()=>time,warmupMs:100,phaseMs:200,
    onProgress:p=>progress.push(p),onFinish:r=>reports.push(r),...options});
  replay.install({start:m=>starts.push(m.name),read:()=>({status}),
    sustain:()=>{if(resets){resets--;return true;}return false;}});
  return {replay,starts,progress,reports,setStatus:s=>{status=s;},reset:()=>{resets++;},
    frame:(gap,delta=Math.min(34,gap))=>{time+=gap;replay.clock(time,gap,delta);replay.afterFrame(time,.4);},
    volley:()=>replay.volley(time)};
}

test('warmup is excluded; all four phases complete once with cap accounting',()=>{
  const f=fixture();f.frame(100);
  for(let phase=0;phase<4;phase++){
    f.volley();f.frame(50);f.volley();f.frame(50);f.frame(50);f.frame(50);
  }
  assert.equal(f.reports.length,1);
  const report=f.reports[0];assert.equal(report.completed,true);assert.equal(report.elapsedWallMs,900);
  assert.equal(report.phases.length,4);assert.deepEqual(f.starts,[REPLAY_PHASES[0].name,...REPLAY_PHASES.map(p=>p.name)]);
  for(const p of report.phases){
    assert.equal(p.frames,4);assert.equal(p.measuredFrameMs,200);assert.equal(p.acceptedSimulationMs,136);
    assert.equal(p.clippedSimulationMs,64);assert.equal(p.acceptedTimeRatio,.68);
    assert.equal(p.meanDeliveredFps,20);assert.equal(p.volleys,2);assert.equal(p.volleyGapP95Ms,50);
  }
  f.frame(50);f.replay.abort();assert.equal(f.reports.length,1);
});

test('zero reset gap is omitted; normal 60 Hz frames retain all elapsed time',()=>{
  const f=fixture();f.frame(100);f.frame(0);f.frame(16);f.frame(17);f.replay.abort('stopped');
  const p=f.reports[0].phases[0];assert.equal(p.frames,2);assert.equal(p.acceptedTimeRatio,1);
  assert.equal(p.clippedSimulationMs,0);assert.equal(p.frameP95Ms,17);
});

test('background abort and unexpected game pause produce partial reports',()=>{
  const f=fixture();f.frame(100);f.frame(20);f.replay.abort('backgrounded');
  assert.equal(f.reports[0].completed,false);assert.equal(f.reports[0].reason,'backgrounded');
  assert.equal(f.reports[0].phases.length,1);
  const g=fixture();g.setStatus('paused');g.frame(10);
  assert.equal(g.reports[0].reason,'game-interrupted');assert.equal(g.reports[0].phases.length,0);
});

test('invalid clock cannot silently produce a completed result',()=>{
  const f=fixture();f.frame(100);f.frame(50,50);
  assert.equal(f.reports[0].reason,'invalid-clock');assert.equal(f.reports[0].issues.length,1);
});

test('sample memory stays bounded while totals keep counting',()=>{
  const f=fixture({phaseMs:100000});f.frame(100);f.reset();
  for(let i=0;i<5000;i++){f.frame(10);f.volley();}
  f.replay.abort();const p=f.reports[0].phases[0];
  assert.equal(p.frameQuantileSamples,4096);assert.equal(p.frames,5000);
  assert.equal(p.measuredFrameMs,50000);assert.equal(p.volleys,5000);assert.equal(p.fixtureResets,1);
});

test('per-phase settling is excluded from clock, work and volley statistics',()=>{
  const f=fixture({phases:[{name:'settle',durationMs:200,settleMs:100}]});
  f.frame(100);f.volley();f.frame(50);f.volley();
  f.frame(50);f.volley();f.frame(50);f.volley();f.frame(50);
  const p=f.reports[0].phases[0];assert.equal(p.wallMs,200);
  assert.equal(p.frames,2);assert.equal(p.measuredFrameMs,100);assert.equal(p.volleys,2);
  assert.equal(p.clippedSimulationMs,32);assert.equal(p.volleyGapP95Ms,50);
});
