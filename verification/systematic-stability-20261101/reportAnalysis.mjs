import assert from 'node:assert/strict';

const sha = value => typeof value === 'string' && /^[a-f0-9]{40}$/.test(value) ? value : null;
const nonnegative = value => Number.isFinite(value) && value >= 0;
const sameClock = (a, b) => !!a && !!b && a.id === b.id && a.source === b.source
  && a.startedAt === b.startedAt && a.updatedAt === b.updatedAt
  && a.elapsedMs === b.elapsedMs && a.mode === b.mode;

// Offline only. Return an allow-list of technical facts, never report contents,
// account data, input history, exception messages or an inferred native cause.
export function analyzeReport(report) {
  assert.ok(report && typeof report === 'object', 'Report object required');
  const full = report.format === 'cryptoid-full-session-report' ? report : report.fullSession;
  const rows = full?.records ?? [];
  const integrity = full ? Array.isArray(rows) && full.integrity?.contiguous === true
    && Array.isArray(full.integrity?.errors) && full.integrity.errors.length === 0
    && full.integrity.records === rows.length && full.summary?.count === rows.length
    && rows.every((row, index) => row.seq === index + 1 && nonnegative(row.clockMs)) : null;
  const samples = integrity ? rows.filter(row => row.kind === 'sample' && row.data?.pacing) : [];
  const pacingValid = samples.length > 0 && samples.every(row =>
    nonnegative(row.data.pacing.simulatedMs) && nonnegative(row.data.pacing.wallMs)
    && row.data.pacing.simulatedMs <= row.data.pacing.wallMs + 1);
  const clock = report.stopwatch?.latest;
  const brief = report.briefDiagnostics?.latest;
  const reportingSource = sha(report.source?.sourceCommit);
  const fullSource = sha(full?.summary?.build?.sourceCommit);
  const source = fullSource ?? (clock && sha(clock.source)) ?? reportingSource;
  const clockSourceMatches = !!clock && sha(clock.source) === reportingSource;
  const clockValid = clockSourceMatches && nonnegative(clock.elapsedMs)
    && Number.isFinite(clock.startedAt) && Number.isFinite(clock.updatedAt)
    && clock.updatedAt >= clock.startedAt
    && ['running', 'paused', 'hidden', 'stalled', 'ended'].includes(clock.mode);
  const briefMatches = clockValid && sameClock(clock, brief?.clock);
  const last = report.returnEvidence?.lastSession;
  const document = report.returnEvidence?.activeDocument;
  const bootEvents = report.returnEvidence?.reloadTrace?.events ?? [];
  const sourceMismatch = !!fullSource && !!reportingSource && fullSource !== reportingSource;
  const interruptionSignal = clockValid && clock.mode !== 'ended' && !sourceMismatch
    && last?.active === true && last.context?.status === 'playing'
    && Number.isFinite(last.at) && Number.isFinite(document?.startedAt)
    && document.startedAt >= last.at && document.startedAt - last.at <= 60_000
    && document.startedAt >= clock.updatedAt && document.startedAt - clock.updatedAt <= 60_000
    && Math.abs(clock.updatedAt - last.at) <= 60_000
    && bootEvents.some(event => event.kind === 'boot-after-active-session'
      && event.at >= document.startedAt && event.at - document.startedAt <= 60_000
      && event.context?.status === 'playing');
  const fullEnded = integrity === true && full.summary.state === 'closed'
    && rows.some(row => row.kind === 'end' && row.data?.operation === 'finish');
  const ended = clockValid && clock.mode === 'ended' || fullEnded;
  const options = briefMatches ? brief.options
    : report.testOptionsMatchedByStartTime === true ? report.testOptions : null;
  return {
    format: report.format ?? null,
    sourceCommit: source,
    sourceTree: fullSource ? sha(full.summary.build?.sourceTree) : clockSourceMatches ? sha(report.source?.sourceTree) : null,
    reportingSourceCommit: reportingSource,
    sourceMismatch,
    sourceWorkingTreeDirty: full?.summary?.build?.workingTreeDirty ?? report.source?.workingTreeDirty ?? null,
    fullRecordingPresent: !!full,
    recordIntegrityValid: integrity,
    records: full ? rows.length : null,
    recordedDocumentSpanMs: integrity && nonnegative(full.summary.lastAt - full.summary.startedAt)
      ? full.summary.lastAt - full.summary.startedAt : null,
    // Summed captured simulation windows are NOT continuous wall/stopwatch time.
    capturedSimulationMs: pacingValid ? samples.reduce((total, row) => total + row.data.pacing.simulatedMs, 0) : null,
    capturedActiveWallMs: pacingValid ? samples.reduce((total, row) => total + row.data.pacing.wallMs, 0) : null,
    simulationWindows: samples.length,
    savedStopwatchMs: clockValid ? clock.elapsedMs : null,
    savedStopwatchMode: clockValid ? clock.mode : null,
    briefMatchesStopwatch: !!briefMatches,
    normalEndRecorded: !!ended,
    abruptReturnSignal: !!interruptionSignal,
    outcome: ended ? 'recorded-end' : interruptionSignal ? 'active-session-followed-by-new-document'
      : full ? integrity ? 'open-or-limited-recording' : 'invalid-recording' : 'insufficient-matched-run-data',
    scene: clockSourceMatches || !clock && !full ? report.source?.diagnosticScene ?? null : null,
    matchedOptions: options ? { scene: options.scene ?? null,
      fullRecording: options.fullRecording ?? options.diagnostics ?? null, protection: options.protection ?? null } : null,
    // These are sampled maxima for the recorded subset, never total RAM or peaks.
    sampledMaxima: integrity ? Object.fromEntries(['cssPacedActive', 'paintedRetained', 'paintedPending',
      'canvasRegisteredEffects', 'canvasTextureEntries', 'audioVoices', 'audioClockStalls'].map(key => {
      const values = rows.map(row => row.data?.[key]).filter(nonnegative);
      return [key, values.length ? Math.max(...values) : null];
    })) : null,
    nativeTerminationCauseEstablished: false,
    continuousDeviceStabilityEstablished: false,
  };
}

export function summarizeReports(reports) {
  return summarizeAnalyses(reports.map(analyzeReport));
}

export function summarizeAnalyses(rows) {
  const sources = new Map();
  for (const row of rows) {
    if (!row.sourceCommit) continue;
    const key = JSON.stringify([row.sourceCommit, row.sourceTree, row.scene, row.matchedOptions]);
    const group = sources.get(key) ?? { sourceCommit: row.sourceCommit, sourceTree: row.sourceTree,
      scene: row.scene, matchedOptions: row.matchedOptions, reports: 0, recordedEnds: 0,
      abruptReturnSignals: 0, observedOutcomes: [], hasStableReleaseProof: false };
    group.reports++;
    group.recordedEnds += Number(row.normalEndRecorded);
    group.abruptReturnSignals += Number(row.abruptReturnSignal);
    if (!group.observedOutcomes.includes(row.outcome)) group.observedOutcomes.push(row.outcome);
    sources.set(key, group);
  }
  return { reports: rows, sourceConditions: [...sources.values()], whiteScreenFixed: false };
}
