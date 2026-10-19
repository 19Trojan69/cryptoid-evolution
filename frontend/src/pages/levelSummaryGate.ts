type SummaryState = { sector: number; encounter: string; phase: string; status: string };
export const isLevelSummary = (state: SummaryState) => state.encounter === 'bonus' && state.phase === 'SECTOR_CLEAR';

// No new gameplay status or persisted checkpoint format. The existing clear
// sequence finishes first; only its final advance waits for explicit input.
export function createLevelSummaryGate() {
  let readySector: number | null = null;
  let requested = false;
  const ready = (state: SummaryState) => isLevelSummary(state) && readySector === state.sector;
  return {
    ready,
    waiting: (state: SummaryState) => ready(state) && !requested,
    settle(state: SummaryState) {
      if (!isLevelSummary(state) || ready(state)) return false;
      readySector = state.sector;
      requested = false;
      return true;
    },
    request(state: SummaryState) {
      if (state.status !== 'playing' || !ready(state) || requested) return false;
      requested = true;
      return true;
    },
    reset() { readySector = null; requested = false; },
  };
}
