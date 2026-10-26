import { advanceSummaryVisibility, canContinueBossSummary, type BossSummary } from '../../frontend/src/pages/bossSummaryTiming.ts';

export type StopIdentity = Readonly<{ runId: string; stage: number; stopId: number }>;
export type StopOperation = StopIdentity & Readonly<{ generation: number; kind: 'prepare' | 'continue' }>;
export type ContinuePermit = StopIdentity & Readonly<{ accepted: true }>;

/** Pure intermission gate. It does not save, navigate, load images or advance
 * combat. The adapter must provide the existing backend's confirmed receipts;
 * preparation alone and elapsed time can never accept Continue. */
export class BossStop {
  private readonly identity: StopIdentity;
  private readonly summary: Readonly<BossSummary>;
  private generation = 0;
  private visibleMs = 0;
  private prepared = false;
  private saving = false;
  private failed = false;
  private continuing = false;
  private continuationFailed = false;
  private accepted = false;
  private disposed = false;

  constructor(identity: StopIdentity, summary: BossSummary) {
    if (!/^[a-zA-Z0-9_-]{1,80}$/.test(identity.runId) || !Number.isInteger(identity.stage)
      || identity.stage < 10 || identity.stage > 500 || identity.stage % 10 || !Number.isSafeInteger(identity.stopId) || identity.stopId < 1
      || summary.stage !== identity.stage || !Object.values(summary).every(value => Number.isFinite(value) && value >= 0)) throw new TypeError('Invalid boss stop');
    this.identity = Object.freeze({ ...identity }); this.summary = Object.freeze({ ...summary });
  }
  beginPreparation(): StopOperation {
    if (this.disposed || this.accepted || this.continuing) throw new Error('Closed or continuing boss stop');
    this.saving = true; this.prepared = false; this.failed = false; this.continuationFailed = false;
    return Object.freeze({ ...this.identity, generation: ++this.generation, kind: 'prepare' });
  }
  finishPreparation(operation: StopOperation, readiness: { saved: boolean; cleaned: boolean; bonusReady: boolean }): boolean {
    if (!this.current(operation, 'prepare') || !this.saving) return false;
    this.saving = false;
    this.prepared = readiness.saved === true && readiness.cleaned === true && readiness.bonusReady === true;
    this.failed = !this.prepared; return this.prepared;
  }
  advanceVisible(deltaMs: number, visible: boolean): void {
    if (this.disposed || this.accepted || !this.prepared || !Number.isFinite(deltaMs) || deltaMs < 0) return;
    this.visibleMs = advanceSummaryVisibility(this.visibleMs, deltaMs, visible);
  }
  requestContinue(retryFailedContinuation = false): StopOperation | null {
    if (this.disposed || this.accepted || this.continuing || !this.prepared || this.saving
      || this.failed && !(retryFailedContinuation && this.continuationFailed)
      || !canContinueBossSummary(this.visibleMs, this.prepared, this.saving, false)) return null;
    this.continuing = true; this.failed = false; this.continuationFailed = false;
    return Object.freeze({ ...this.identity, generation: ++this.generation, kind: 'continue' });
  }
  finishContinue(operation: StopOperation, confirmed: boolean): ContinuePermit | null {
    if (!this.current(operation, 'continue') || !this.continuing) return null;
    this.continuing = false;
    if (!confirmed) { this.failed = true; this.continuationFailed = true; return null; }
    this.accepted = true;
    return Object.freeze({ ...this.identity, accepted: true });
  }
  snapshot() {
    return { ...this.identity, summary: { ...this.summary }, visibleMs: this.visibleMs, prepared: this.prepared,
      saving: this.saving, failed: this.failed, continuing: this.continuing, accepted: this.accepted, disposed: this.disposed,
      canContinue: !this.disposed && !this.accepted && canContinueBossSummary(this.visibleMs, this.prepared, this.saving || this.continuing, this.failed) };
  }
  dispose(): void { this.disposed = true; this.generation++; }
  private current(operation: StopOperation, kind: StopOperation['kind']): boolean {
    return !this.disposed && !this.accepted && operation.kind === kind && operation.generation === this.generation
      && operation.runId === this.identity.runId && operation.stage === this.identity.stage && operation.stopId === this.identity.stopId;
  }
}
