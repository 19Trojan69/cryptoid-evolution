export const OWNER_TIMING_KEY: string;
export const OWNER_TIMING_ARM_KEY: string;
export const OWNER_TIMING_DURATION_MS: number;
export const OWNER_TIMING_ARM_TTL_MS: number;
export const OWNER_TIMING_MAX_BYTES: number;
export type TimingCapture = { version: number; environment: string; metadata: Record<string, unknown>; finished: boolean;
  samples: Record<string, unknown>[]; events: Record<string, unknown>[]; diagnosticWork: Record<string, number>; limits: string };
export function cleanTimingCapture(input: unknown): TimingCapture | null;
export function readTimingCapture(host: { localStorage?: Pick<Storage,'getItem'>; sessionStorage?: Pick<Storage,'getItem'> }): TimingCapture | null;
