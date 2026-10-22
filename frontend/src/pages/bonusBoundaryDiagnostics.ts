export type BonusBoundaryKind = 'bonus-clear-rewards-complete'
  | 'bonus-clear-scene-requested' | 'bonus-clear-scene-committed'
  | 'bonus-clear-frame-after-commit';

type BoundaryState = { sector: number; phase: string; encounter: string; status: string };
type BoundaryContext = Pick<BoundaryState, 'sector' | 'phase' | 'encounter' | 'status'>;

// Created only for the verified owner. Observe existing simulation/layout calls;
// never retain the game state, schedule work, invoke rewards or change rendering.
export function createBonusBoundaryDiagnostics(record: (kind: BonusBoundaryKind, context: BoundaryContext) => void) {
  let sector = -1, observed = false, rewarded = false, requested = false, committed = false, followed = false;
  const matches = (state: BoundaryState) => observed && state.sector === sector
    && state.encounter === 'bonus' && state.phase === 'SECTOR_CLEAR' && state.status === 'playing';
  const emit = (kind: BonusBoundaryKind, state: BoundaryState) => {
    try { record(kind, { sector: state.sector, phase: state.phase, encounter: state.encounter, status: state.status }); }
    catch { /* Optional local diagnostics cannot interrupt play. */ }
  };
  return {
    observedClear(state: BoundaryState) {
      if (state.encounter !== 'bonus' || state.phase !== 'SECTOR_CLEAR' || state.status !== 'playing') return;
      sector = state.sector; observed = true;
      rewarded = requested = committed = followed = false;
    },
    rewardsCompleted(state: BoundaryState) {
      if (!matches(state) || rewarded) return;
      // The synchronous reward branch returned; queued account saves may still
      // be pending. This milestone never claims durable reward confirmation.
      rewarded = true; emit('bonus-clear-rewards-complete', state);
    },
    sceneRequested(state: BoundaryState) {
      if (!matches(state) || !rewarded || requested) return;
      requested = true; emit('bonus-clear-scene-requested', state);
    },
    sceneCommitted(state: BoundaryState) {
      if (!matches(state) || !requested || committed) return;
      committed = true; emit('bonus-clear-scene-committed', state);
    },
    frame(state: BoundaryState) {
      if (!matches(state) || !committed || followed) return;
      followed = true;
      // A subsequent game RAF is still not proof of a GPU-presented frame.
      emit('bonus-clear-frame-after-commit', state);
    },
  };
}
