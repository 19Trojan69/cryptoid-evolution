// Fixed user-facing categories only; never display raw server errors or tokens.
export function completionSaveFailure(error: unknown, phase: 'save' | 'confirmation' | 'effects') {
  if (phase === 'effects') return 'Effects are still being released. Retry preparation.';
  if (phase === 'confirmation') return 'The next level or its rewards are not confirmed. Retry save.';
  const response = (error as { response?: { status?: number; data?: { error?: unknown } } } | null)?.response;
  if (response?.status === 401 || response?.status === 403) return 'The active run needs to be confirmed again. Retry save.';
  if (response?.data?.error === 'run_replaced' || response?.data?.error === 'run_expired') return 'This run is no longer active on the server. Pending data is kept on this device.';
  if (response?.status === 400) return 'The server rejected this save. Pending data is kept on this device.';
  return 'Save not confirmed. Please retry.';
}
