type TechnicalStorage = { localStorage?: Pick<Storage, 'getItem'>; sessionStorage?: Pick<Storage, 'getItem'> };
export type StabilityReport = {
  version: number; format: string; generatedAt: string | null; available: boolean;
  activeDocument: { startedAt?: number; ageMs?: number; navigationType?: string; route?: string } | null;
  storage: Record<string, string>; events: Record<string, unknown>[];
  lastSession: Record<string, unknown> | null;
  reloadTrace: { windowMs: number; latestAt: number; events: Record<string, unknown>[] } | null;
  resourceTrend: { windowMs: number; sampleIntervalMs: number; latestAt: number; samples: Record<string, unknown>[] } | null;
  timingCapture: import('./timingReport.mjs').TimingCapture | null;
  limits: string;
};
export function technicalContext(value: unknown): Record<string, unknown> | null;
export function readStabilityReport(host: TechnicalStorage, now?: number): StabilityReport;
export function readOwnerStabilityReport(verifyOwner: () => Promise<{ canAdmin?: boolean }>, getHost: () => TechnicalStorage, active?: () => boolean, now?: number): Promise<StabilityReport | null>;
