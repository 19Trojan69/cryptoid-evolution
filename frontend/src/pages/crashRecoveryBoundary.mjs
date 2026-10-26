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
  const replacement = events.find(row => row.kind === 'document-start'
    && sameDocument(row.previousDocumentStartedAt, tail.documentStartedAt)
    && time(row.documentStartedAt) && row.documentStartedAt > tail.documentStartedAt + 2 && row.at >= lastAt);
  if (!replacement) return result;
  const nextEvents = events.filter(row => sameDocument(row.documentStartedAt, replacement.documentStartedAt));
  const home = nextEvents.find(row => row.route === 'home' && time(row.at));
  const previousEvents = events.filter(row => sameDocument(row.documentStartedAt, tail.documentStartedAt));
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
