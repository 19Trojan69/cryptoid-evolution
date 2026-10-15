import { PERFORMANCE_TRACE_KEY } from "./performanceDiagnostics.ts";

// Export the running/last in-memory session too: embedded browsers can deny
// Web Storage even though the game and its memory-only test inventory work.
export function diagnosticExport(host: {
  __cryptoidDiagnostics?: { export: () => unknown };
  __cryptoidLatestTrace?: unknown;
  __cryptoidPreviousTrace?: unknown;
  localStorage?: Pick<Storage, "getItem">;
  sessionStorage?: Pick<Storage, "getItem">;
}) {
  let trace: unknown = null;
  try {
    trace = host.__cryptoidDiagnostics?.export() ?? host.__cryptoidLatestTrace ?? null;
  } catch {
    /* Continue with saved data. */
  }
  for (const key of ["localStorage", "sessionStorage"] as const) {
    if (trace) break;
    try {
      trace = JSON.parse(host[key]?.getItem(PERFORMANCE_TRACE_KEY) ?? "null");
    } catch {
      /* Optional storage. */
    }
  }
  return {
    baseline: "1c1c7f9b6c5e8ac7d41b9bf1c4b44036cc196220",
    trace,
    previous: host.__cryptoidPreviousTrace ?? null,
    available: trace !== null || !!host.__cryptoidPreviousTrace,
  };
}
