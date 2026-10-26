// Optional local Chrome memory-infra snapshots. The pinned protocol documents
// deterministic:true as forcing GC; every request explicitly uses false.
// Only allocator dumps are retained, with process IDs replaced by ordinals.
export async function chromiumMemoryProfile(browser, { allowPartial = false } = {}) {
  const session = await browser.newBrowserCDPSession(), requests = [], dumps = [], errors = [];
  const ordinals = new Map(), roles = new Map(); let truncated = false, entries = 0;
  const processNumber = pid => {
    if (!ordinals.has(pid)) ordinals.set(pid, ordinals.size + 1);
    return ordinals.get(pid);
  };
  const listener = ({ value }) => {
    for (const event of value) {
      if (event.ph === 'M' && event.name === 'process_name') roles.set(processNumber(event.pid), event.args.name);
      const allocators = event.args?.dumps?.allocators;
      if (!allocators) continue;
      const count = Object.keys(allocators).length;
      if (entries + count > 100000 || dumps.length >= 256) { truncated = true; continue; }
      entries += count;
      dumps.push({ guid: event.id ?? event.id2?.global ?? event.id2?.local, timestampUs: event.ts, process: processNumber(event.pid),
        level: event.args.dumps.level_of_detail, allocators, graph: event.args.dumps.allocators_graph ?? [] });
    }
  };
  session.on('Tracing.dataCollected', listener);
  await session.send('Tracing.start', { transferMode: 'ReportEvents', traceConfig: {
    recordMode: 'recordUntilFull', traceBufferSizeInKb: 16384, enableSampling: false,
    includedCategories: ['disabled-by-default-memory-infra'], excludedCategories: ['*'], memoryDumpConfig: { triggers: [] },
  } });
  return {
    async capture(point) {
      const startedUs = Number(process.hrtime.bigint() / 1000n);
      const request = await session.send('Tracing.requestMemoryDump', { deterministic: false, levelOfDetail: 'detailed' });
      requests.push({ point, startedUs, endedUs: Number(process.hrtime.bigint() / 1000n), ...request, deterministic: false });
      if (request.success) return;
      errors.push('Incomplete global memory dump: ' + point);
      // Explicit partial mode preserves available provider data. The runner
      // still fails allocator acceptance at the end; this is never a pass.
      if (!allowPartial) throw new Error('Native Chrome memory dump failed');
    },
    async finish() {
      const completed = new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('Native memory tracing completion timed out')), 10000);
        session.once('Tracing.tracingComplete', () => { clearTimeout(timer); resolve(); });
      });
      await session.send('Tracing.end'); await completed;
      session.off('Tracing.dataCollected', listener);
      const result = { requests, dumps, roles: [...roles].map(([process, role]) => ({ process, role })), entries, truncated, errors, allowPartial, forcedGC: false };
      await session.detach();
      if (truncated || !dumps.length) result.errors.push('Native allocator dump missing or truncated');
      return result;
    },
  };
}
