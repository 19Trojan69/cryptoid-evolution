// Derived observations only. No storage, DOM, account data or native-crash claim.
const time = n => typeof n === 'number' && Number.isFinite(n) && n > 0 && n <= 1e15;
const sameDocument = (a, b) => time(a) && time(b) && Math.abs(a - b) <= 2;
export function crashRecoveryBoundary(summary, tail, lifecycle) {
  if (!tail) return { version: 1, status: 'tail-unavailable', nativeCauseKnown: false };
  const committed = time(summary?.lastAt) ? summary.lastAt : null;
  const observed = time(tail.lastObservedAt) ? tail.lastObservedAt : null;
  const lastAt = Math.max(committed ?? 0, observed ?? 0);
  const result = { version: 1, status: 'replacement-not-observed', nativeCauseKnown: false,
    whitePixelsObserved: false, previousDocumentStartedAt: tail.documentStartedAt ?? null,
    lastCommittedAt: committed, lastObservedAt: observed, lastEvidenceAt: lastAt || null };
  if (tail.state === 'closed' || summary?.state === 'closed') return { ...result, status: 'closed-run' };
  if (tail.evidenceSource !== 'current-tab' || lifecycle?.evidenceSource !== 'current-tab')
    return { ...result, status: 'tab-correlation-unavailable' };
  const events = Array.isArray(lifecycle.events) ? lifecycle.events : [];
  let previousDocument = tail.documentStartedAt;
  const findReplacement = origin => events.find(row => row.kind === 'document-start'
    && sameDocument(row.previousDocumentStartedAt, origin)
    && time(row.documentStartedAt) && row.documentStartedAt > origin + 2 && row.at >= lastAt);
  let replacement = findReplacement(previousDocument);
  if (!replacement && time(previousDocument) && time(tail.startedAt) && tail.startedAt <= lastAt
    && /^[a-f0-9]{40}$/.test(tail.build?.sourceCommit ?? '')) {
    // Legacy captures read timeOrigin independently. Bridge at most 5 ms only
    // with one actual same-tab start, the same source and an uninterrupted run
    // interval. Keep the ordinary 2 ms matcher and origin-fallback exclusion.
    const starts = events.filter(row => row.kind === 'document-start' && time(row.at)
      && time(row.documentStartedAt) && row.documentStartedAt <= row.at && row.at <= tail.startedAt
      && Math.abs(row.documentStartedAt - previousDocument) <= 5 && row.sourceCommit === tail.build.sourceCommit);
    if (starts.length === 1 && !events.some(row => row.kind === 'document-start'
      && row.at > starts[0].at && row.at <= lastAt)) {
      const captured = starts[0].documentStartedAt;
      replacement = findReplacement(captured);
      if (replacement) {
        result.documentCorrelation = 'same-tab-start-record';
        result.lifecycleDocumentStartedAt = captured;
        result.documentStartOffsetMs = captured - previousDocument;
        previousDocument = captured;
      }
    }
  }
  if (!replacement) return result;
  const nextEvents = events.filter(row => sameDocument(row.documentStartedAt, replacement.documentStartedAt));
  const home = nextEvents.find(row => row.route === 'home' && time(row.at));
  const previousEvents = events.filter(row => sameDocument(row.documentStartedAt, previousDocument));
  const lastReturn = Math.max(tail.startedAt ?? 0, ...previousEvents.filter(row => row.kind === 'pageshow'
    || row.kind === 'resume' || row.kind === 'visibility' && row.hidden === false).map(row => row.at));
  // A navigation timeOrigin may precede the old page's pagehide. Use the actual
  // next-document observation as the upper bound, not navigation start time.
  const departure = previousEvents.filter(row => (['pagehide', 'freeze'].includes(row.kind)
    || row.kind === 'visibility' && row.hidden === true) && row.at >= lastReturn && row.at <= replacement.at);
  return { ...result, status: departure.length ? 'replacement-with-lifecycle-signal' : 'replacement-without-lifecycle-signal',
    nextDocumentStartedAt: replacement.documentStartedAt,
    unobservedBeforeNextDocumentMs: Math.max(0, replacement.documentStartedAt - lastAt),
    previousEvidenceAfterNavigationStartMs: Math.max(0, lastAt - replacement.documentStartedAt),
    firstNextDocumentObservationAt: replacement.at,
    nextDocumentObservationDelayMs: Math.max(0, replacement.at - replacement.documentStartedAt),
    homeObservedAt: home?.at ?? null, firstObservedRoute: replacement.route,
    departureSignals: departure.map(row => ({ kind: row.kind, at: row.at })),
    limits: 'Document and DOM observations only. A missing final signal or new document does not identify an OS, memory, GPU or browser-process cause.' };
}
