type TechnicalStorage = { localStorage?: Pick<Storage, 'getItem'>; sessionStorage?: Pick<Storage, 'getItem'> };
export type StabilityReport = {
  version: number; format: string; generatedAt: string | null; available: boolean;
  storage: Record<string, string>; events: Record<string, unknown>[];
  lastSession: Record<string, unknown> | null; limits: string;
};
export function technicalContext(value: unknown): Record<string, unknown> | null;
export function readStabilityReport(host: TechnicalStorage, now?: number): StabilityReport;
export function readOwnerStabilityReport(verifyOwner: () => Promise<{ canAdmin?: boolean }>, getHost: () => TechnicalStorage, active?: () => boolean, now?: number): Promise<StabilityReport | null>;
