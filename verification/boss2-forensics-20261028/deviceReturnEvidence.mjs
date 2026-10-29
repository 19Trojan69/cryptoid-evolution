import { readStabilityReport } from '../../frontend/src/pages/stabilityReport.mjs';

// Export existing records only. The origin-wide copy can belong to another tab;
// keep the return evidence tied to this tab and the currently loaded document.
export function readDeviceReturnEvidence(host, now = Date.now()) {
  const tab = {};
  for (const key of ['sessionStorage', 'performance', 'location']) {
    Object.defineProperty(tab, key, { get: () => host?.[key] });
  }
  const report = readStabilityReport(tab, now);
  return {
    version: 1,
    format: 'cryptoid-device-return-evidence',
    generatedAt: report.generatedAt,
    evidenceSource: report.reloadTrace ? 'current-tab' : 'absent-or-unavailable',
    storage: { reload: report.storage.reloadSession, session: report.storage.session },
    activeDocument: report.activeDocument,
    lastSession: report.lastSession,
    reloadTrace: report.reloadTrace,
    limits: [
      'Read-only export of existing, bounded technical records from this tab.',
      'Current document metadata is separate from the previously recorded game.',
      'A new document or absent final event does not establish an OS, memory, GPU or browser-process cause.',
      'No white pixels, physical touches, total process memory or native termination cause are measured.',
      'The final unwritten interval and records from another tab or deployment origin are unavailable.',
    ],
  };
}
