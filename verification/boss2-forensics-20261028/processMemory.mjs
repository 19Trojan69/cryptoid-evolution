// Linux process evidence from outside the page. RSS sums can double-count shared
// pages; PSS is reported only when every selected process provides it.
import { readdirSync, readFileSync } from 'node:fs';
import { basename } from 'node:path';
export function memoryFromStatus(status, rollup = '') {
  const field = (text, name) => { const match = text.match(new RegExp('^' + name + ':\\s+(\\d+) kB$', 'm')); return match ? Number(match[1]) : null; };
  return { rssKiB: field(status, 'VmRSS'), peakRssKiB: field(status, 'VmHWM'), pssKiB: field(rollup, 'Pss') };
}
export function processRole(command) {
  if (/WebKitWebProces(?:s|\b)/.test(command)) return 'webkit-content';
  if (/WebKitNetworkPr(?:ocess|\b)/.test(command)) return 'webkit-network';
  if (/--type=renderer/.test(command)) return 'chromium-renderer';
  if (/--type=gpu-process/.test(command)) return 'chromium-gpu';
  if (/headless_shell|chrome-headless-shell|\/chrome(?:\x00|$)|MiniBrowser/.test(command)) return 'browser-other';
  return null;
}
export function sampleBrowserMemory(rootPid = process.pid, proc = '/proc') {
  if (process.platform !== 'linux' && proc === '/proc') return { available: false, reason: 'linux-proc-required', processes: [] };
  const all = new Map();
  try {
    for (const id of readdirSync(proc).filter(x => /^\d+$/.test(x))) {
      try {
        const status = readFileSync(`${proc}/${id}/status`, 'utf8');
        const parent = Number(status.match(/^PPid:\s+(\d+)/m)?.[1]);
        let command = '';
        try { command = readFileSync(`${proc}/${id}/cmdline`, 'utf8'); } catch { /* Keep ancestry across unreadable sandbox wrappers. */ }
        command ||= status.match(/^Name:\s+(.+)$/m)?.[1] || '';
        all.set(Number(id), { parent, status, command });
      } catch { /* A process can exit between reads. */ }
    }
  } catch { return { available: false, reason: 'proc-unreadable', processes: [] }; }
  const descendant = pid => {
    const seen = new Set();
    while (all.has(pid) && !seen.has(pid)) {
      if (pid === rootPid) return true;
      seen.add(pid); pid = all.get(pid).parent;
    }
    return false;
  };
  const processes = [], unclassifiedDescendants = [];
  for (const [pid, item] of all) {
    const role = processRole(item.command);
    if (!descendant(pid)) continue;
    if (!role) {
      if (pid !== rootPid && unclassifiedDescendants.length < 32) unclassifiedDescendants.push({ pid, parent: item.parent,
        executable: basename(item.command.split('\0')[0].split(/\s/)[0]).slice(0, 80) });
      continue;
    }
    let rollup = '';
    try { rollup = readFileSync(`${proc}/${pid}/smaps_rollup`, 'utf8'); } catch { /* Permission may exclude PSS. */ }
    processes.push({ pid, role, executable: basename(item.command.split('\0')[0].split(/\s/)[0]), ...memoryFromStatus(item.status, rollup) });
  }
  return { available: processes.length > 0, processes, unclassifiedDescendants,
    contentProcessObserved: processes.some(p => p.role === 'chromium-renderer' || p.role === 'webkit-content'),
    summedRssKiB: processes.length ? processes.reduce((n, p) => n + (p.rssKiB || 0), 0) : null,
    summedPssKiB: processes.length && processes.every(p => p.pssKiB !== null) ? processes.reduce((n, p) => n + p.pssKiB, 0) : null,
    limits: 'Linux descendants only; RSS may double-count shared pages. Not physical iOS/Android or GPU-resident memory.' };
}
