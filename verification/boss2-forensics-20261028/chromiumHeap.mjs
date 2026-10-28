// Optional Node-side CDP measurement. No page timer, forced GC or heap snapshot.
export function cleanHeapUsage(value) {
  const output = {};
  for (const key of ['usedSize', 'totalSize', 'embedderHeapUsedSize', 'backingStorageSize'])
    if (typeof value?.[key] === 'number' && Number.isFinite(value[key]) && value[key] >= 0 && value[key] < 1e13) output[key] = value[key];
  return typeof output.usedSize === 'number' && typeof output.totalSize === 'number' ? output : null;
}
export function startChromiumHeapSampler(session, emit, timers = globalThis) {
  let stopped = false, pending = null, count = 0, errors = 0, skipped = 0;
  const sample = () => {
    if (stopped) return;
    if (pending) { skipped++; return; }
    pending = Promise.resolve().then(() => session.send('Runtime.getHeapUsage')).then(value => {
      const clean = cleanHeapUsage(value);
      if (!stopped && clean) { emit({ at: new Date().toISOString(), ...clean }); count++; }
      else if (!stopped) errors++;
    }).catch(() => { errors++; }).finally(() => { pending = null; });
  };
  const timer = timers.setInterval(sample, 1000); timer.unref?.(); sample();
  return async () => {
    stopped = true; timers.clearInterval(timer);
    // Closing the dedicated CDP session also rejects a stalled request.
    try { await session.detach(); } catch { errors++; }
    if (pending) await pending;
    return { samples: count, errors, skipped, scope: 'Current Chromium renderer V8 isolate; not total browser/GPU memory.' };
  };
}
