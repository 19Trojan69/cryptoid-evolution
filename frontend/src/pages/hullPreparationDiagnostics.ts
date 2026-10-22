import { sessionDiagnostic, sessionDiagnosticsActive } from '../lib/sessionDiagnosticEvents.ts';
import { paintedHullColors } from '../generated/paintedHullManifest.ts';

export const HULL_DIAGNOSTIC_STEPS = [
  'plan-preloaded', 'plan-retain-before', 'plan-retained', 'plan-release-before', 'plan-released',
  'source-create-before', 'source-load-start', 'source-loaded', 'source-load-failed',
  'source-center-before', 'source-center-after', 'source-center-failed', 'source-ready', 'source-work-failed',
  'source-surface-release-before', 'source-surface-released',
  'variant-create-before', 'variant-load-start', 'variant-loaded', 'variant-load-failed',
  'variant-decode-before', 'variant-decode-after', 'variant-ready', 'variant-cancelled', 'variant-unavailable',
] as const;
type HullStep = typeof HULL_DIAGNOSTIC_STEPS[number];
type HullObservation = { imageJob?: number; sprite?: number; hullStage?: number; paintIndex?: number;
  sector?: number; encounter?: string };
let serial = 0;

// Only fixed catalogue indices leave this module. A raw URL, exception, account
// or image object is never sent to the owner recorder. Ordinary play is inert.
export function hullSourceJob(url: string): HullObservation | undefined {
  if (!sessionDiagnosticsActive()) return;
  const source = /^\/ships\/evolution\/ship_(\d{2})_stage_([1-3])\.png$/.exec(url);
  const sprite = source ? Number(source[1]) - 1 : -1;
  return { imageJob: ++serial, ...(sprite >= 0 && sprite < 20 ? { sprite, hullStage: Number(source![2]) } : {}) };
}
export function hullVariantJob(sprite: number, color: string, stage: number): HullObservation | undefined {
  if (!sessionDiagnosticsActive()) return;
  return { imageJob: ++serial, sprite, hullStage: stage, paintIndex: paintedHullColors.findIndex(value => value === color) };
}
export function hullPreparationStep(step: HullStep, details: HullObservation | undefined) {
  if (!details || !sessionDiagnosticsActive()) return;
  sessionDiagnostic('boundary', { ...details, operation: 'hull-plan-progress', step });
}
