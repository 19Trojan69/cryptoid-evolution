export const AUDIO_AUDIT_KEY: string;
export const AUDIO_AUDIT_ARM_KEY: string;
export const AUDIO_AUDIT_MAX_BYTES: number;
export const AUDIO_AUDIT_DURATION_MS: number;
export const audioAuditEventKinds: readonly string[];
export type AudioAuditReport = {
  version: number;
  environment: string;
  mode: string;
  recordedAt: number;
  startedAt?: number;
  updatedAt?: number;
  durationLimitMs?: number;
  finished: boolean;
  reason: string;
  samples: Record<string, unknown>[];
  events: { atMs: number; kind: string }[];
  limits: string;
  [key: string]: unknown;
};
export function cleanAudioAudit(value: unknown): AudioAuditReport | null;
export function readAudioAudits(host: {
  localStorage?: Pick<Storage, "getItem">;
  sessionStorage?: Pick<Storage, "getItem">;
}): AudioAuditReport[];
