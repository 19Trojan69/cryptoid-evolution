// One bounded scalar observation from each EXISTING diagnostic clock sample.
// This self-contained function is embedded only in the isolated build.
export function createClockTrace() {
  const rows = []; let dropped = 0;
  const number = value => Number.isFinite(value) && value >= 0 && value <= 1e12 ? value : null;
  const word = value => typeof value === 'string' && value.length <= 100 ? value : null;
  return {
    record(at, snapshot, view, focused, frame) {
      const clock = view.live ?? view.latest;
      const row = { at: number(at), mounted: !!snapshot, visible: snapshot?.visible !== false,
        focused: typeof focused === 'boolean' ? focused : null, status: word(snapshot?.status),
        frameAt: number(snapshot?.frameAt), clockId: word(clock?.id), mode: word(clock?.mode),
        elapsedMs: number(clock?.elapsedMs), unobservedGaps: number(clock?.unobservedGaps),
        frameGeneration: number(frame?.generation), frames: number(frame?.frames), playingFrames: number(frame?.playingFrames),
        maxPlayingGapMs: number(frame?.maxPlayingGapMs), lastFrameStatus: word(frame?.lastStatus) };
      row.frameAgeMs = row.at !== null && row.frameAt !== null && row.at >= row.frameAt ? row.at - row.frameAt : null;
      rows.push(row); if (rows.length > 96) { rows.shift(); dropped++; }
    },
    read: () => ({ version: 1, dropped, rows: rows.map(r => ({ ...r })) }),
  };
}

export function classifyClockTrace(trace, lastState) {
  const rows = trace?.rows ?? [];
  const edges = rows.flatMap((r, i) => {
    const p = rows[i - 1];
    return p && r.clockId && r.clockId === p.clockId && r.unobservedGaps > p.unobservedGaps
      ? [{ previous: p, current: r, following: rows.slice(i + 1).filter(n => n.clockId === r.clockId) }] : [];
  });
  const edge = edges.at(-1), continued = edge?.following.some(r => r.status === 'playing' && r.visible
    && r.frames > edge.current.frames && r.frameAt > edge.current.frameAt) ?? false;
  const last = rows.filter(r => r.clockId === edge?.current.clockId).at(-1);
  const sameFrameObserver = !!edge && Number.isSafeInteger(last?.frameGeneration)
    && last.frameGeneration === edge.current.frameGeneration && last.frameGeneration === edge.previous.frameGeneration;
  const noLongGameGap = sameFrameObserver && last?.maxPlayingGapMs !== null && last.maxPlayingGapMs <= 2500;
  return { clockGapEdges: edges.length, gameFramesObservedAfterLastGap: continued,
    noPlayingFrameGapAboveExistingWatchdogObserved: noLongGameGap,
    classification: !edge ? 'no-clock-gap-edge-captured'
      : lastState?.snapshot?.scene?.technicalPause ? 'clock-gap-with-observed-technical-pause'
      : continued && noLongGameGap ? 'clock-checkpoint-gap-with-continuing-game-frames'
      : 'clock-gap-with-unresolved-game-progress',
    unobservedIntervalCannotBeReconstructed: true, nativeTerminationCauseMeasured: false, whiteScreenFixed: false };
}
