import { execFileSync } from 'node:child_process';

export function selectRuntime(runtimes) {
  return runtimes.filter(r => r.isAvailable === true && r.identifier.startsWith('com.apple.CoreSimulator.SimRuntime.iOS-')
    && /^26\.2(?:\.|$)/.test(r.version)).sort((a, b) => b.version.localeCompare(a.version, undefined, { numeric: true }))[0];
}
export function parseServices(text) {
  return text.split('\n').flatMap(line => {
    const m = line.trim().match(/^(\d+)\s+(-?\d+)\s+(.+)$/);
    return m && /webkit|mobilesafari|mediaserverd|audiomxd/i.test(m[3])
      ? [{ pid: Number(m[1]), label: m[3] }] : [];
  });
}
export function parseRss(text, services) {
  const selected = new Map(services.map(row => [row.pid, row.label]));
  return text.split('\n').flatMap(line => {
    const m = line.trim().match(/^(\d+)\s+(\d+)\s+(\d+)\s+(.+)$/);
    if (!m || !selected.has(Number(m[1]))) return [];
    return [{ pid: Number(m[1]), parentPid: Number(m[2]), rssKiB: Number(m[3]),
      label: selected.get(Number(m[1])), executable: m[4] }];
  });
}
export function sampleNativeMemory(udid) {
  try {
    const services = parseServices(execFileSync('xcrun', ['simctl', 'spawn', udid, 'launchctl', 'list'],
      { encoding: 'utf8', timeout: 15000, maxBuffer: 2 ** 20 }));
    const rows = services.length ? parseRss(execFileSync('ps', ['-p', services.map(s => s.pid).join(','),
      '-o', 'pid=,ppid=,rss=,comm='], { encoding: 'utf8', timeout: 10000 }), services) : [];
    return { at: new Date().toISOString(), scope: 'selected simulator launchctl services; host process RSS',
      rows, webContentObserved: rows.some(row => /webcontent/i.test(row.label + row.executable)),
      fullBrowserMemoryMeasured: false, physicalDeviceMemoryMeasured: false, gpuMemoryMeasured: false };
  } catch (error) { return { at: new Date().toISOString(), rows: [], webContentObserved: false,
    error: String(error.message).slice(0, 1000) }; }
}
