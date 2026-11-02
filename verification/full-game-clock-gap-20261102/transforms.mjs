import assert from 'node:assert/strict';
import { createClockTrace } from './clockTrace.mjs';
const frameImport = "import { createFrameProbe as createClockGapFrameProbe } from '" + new URL('./frameProbe.mjs', import.meta.url).pathname + "';\n";
const setup = "    const qaClockFrames = createClockGapFrameProbe();\n    (window as any).__clockFrameProbe = qaClockFrames.read;\n";
const cleanup = "      if ((window as any).__clockFrameProbe === qaClockFrames.read) delete (window as any).__clockFrameProbe;\n";
const record = "      qaClockFrames.record(time, lastMeasuredFrameRef.current, state.status);\n";
export function instrumentClockFrames(source) {
  assert.equal(source.includes('createClockGapFrameProbe'), false, 'One observer installation only');
  const a = '    const step = (time: number) => {', b = "      const state = stateRef.current, wasPlaying = state.status === 'playing';\n";
  const c = '      if (wakeGameLoopRef.current === stop.wake) wakeGameLoopRef.current = null;';
  for (const anchor of [a, b, c]) assert.equal(source.split(anchor).length, 2, 'One exact existing frame/lifecycle boundary');
  const changed = frameImport + source.replace(a, setup + a).replace(b, b + record).replace(c, cleanup + c);
  assert.equal(changed.replace(frameImport, '').replace(setup, '').replace(record, '').replace(cleanup, ''), source);
  return changed;
}
export function instrumentClockSamples(source) {
  assert.equal(source.includes('qaClockTrace'), false, 'One observer installation only');
  const anchor = '    const view = clock.observe(snapshot);\n';
  assert.equal(source.split(anchor).length, 2);
  const prefix = 'const qaClockTrace = (' + createClockTrace.toString() + ')();\nwindow.__clockGapTrace = qaClockTrace.read;\n';
  const hook = '    try { qaClockTrace.record(host.performance.now(), snapshot, view, doc.hasFocus(), host.__clockFrameProbe?.()); } catch { /* Diagnostic read cannot interrupt the clock. */ }\n';
  const changed = prefix + source.replace(anchor, anchor + hook);
  assert.equal(changed.replace(prefix, '').replace(hook, ''), source);
  return changed;
}
export function clockGapConfig(args = process.argv.slice(2)) {
  if (args[0] !== '--clock-probe') return null;
  assert.equal(args.length, 5);
  const [, engine, condition, replicaText, phase] = args, replica = Number(replicaText);
  assert.ok(['chromium', 'webkit'].includes(engine)); assert.ok(['control', 'leaves'].includes(condition));
  assert.ok([1, 2].includes(replica)); assert.ok(['short', 'long'].includes(phase));
  return { version: 1, engine, condition, replica, phase, seconds: phase === 'short' ? 60 : 1200 };
}
