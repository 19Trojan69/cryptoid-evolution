// Called only from the existing diagnostic build's native step. No scheduling,
// clock writes, DOM/state references, profiler, serialization or active scans.
let generation = 0;
export function createFrameProbe() {
  const id = ++generation;
  let frames = 0, playingFrames = 0, lastFrameAt = null, lastStatus = null, maxPlayingGapMs = 0;
  const gaps = [];
  const read = () => ({ generation: id, frames, playingFrames, lastFrameAt, lastStatus, maxPlayingGapMs, gaps: gaps.map(r => ({ ...r })) });
  return {
    record(time, gap, status) {
      if (!Number.isFinite(time) || time < 0 || !Number.isFinite(gap) || gap < 0) return;
      const playing = status === 'playing'; frames++; if (playing) playingFrames++;
      if (playing && lastStatus === 'playing') maxPlayingGapMs = Math.max(maxPlayingGapMs, gap);
      if (gap > 250) {
        gaps.push({ frame: frames, time, gap, status: typeof status === 'string' ? status.slice(0, 32) : null, priorStatus: lastStatus });
        if (gaps.length > 16) gaps.shift();
      }
      lastFrameAt = time; lastStatus = typeof status === 'string' ? status.slice(0, 32) : null;
    }, read,
  };
}
