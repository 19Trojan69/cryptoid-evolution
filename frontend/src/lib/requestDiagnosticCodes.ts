// Only fixed public application/platform categories, never a response payload.
export const REQUEST_DIAGNOSTIC_CODES = ['save_before_activation', 'run_replaced', 'run_expired', 'activation_conflict',
  'weapon_already_active', 'weapon_stock_empty', 'inventory_changed', 'activation_unavailable', 'invalid_activation',
  'invalid_checkpoint', 'invalid_flight', 'checkpoint_stage_changed', 'save_regressed', 'save_changed', 'save_unavailable',
  'invalid_save', 'weapon_not_owned', 'invalid_lives', 'not_authenticated', 'not_authorized', 'account_required',
  'boss_summary_pending', 'boss_summary_wait', 'boss_summary_stage_changed', 'invalid_boss_summary', 'invalid_boss_summary_confirmation', 'no_active_run', 'invalid_reward_event', 'reward_prerequisite_missing', 'reward_update_busy', 'reward_unavailable',
  'FUNCTION_INVOCATION_FAILED', 'INTERNAL_FUNCTION_INVOCATION_FAILED', 'FUNCTION_INVOCATION_TIMEOUT',
  'NO_RESPONSE_FROM_FUNCTION', 'INTERNAL_FUNCTION_NOT_READY', 'FUNCTION_THROTTLED', 'unknown-http-error'] as const;
const publicAliases: Record<string, string> = { 'Invalid reward event': 'invalid_reward_event',
  'Finish the previous stage first': 'reward_prerequisite_missing', 'Reward update busy; retry': 'reward_update_busy',
  'Could not save reward': 'reward_unavailable', 'Run has been replaced': 'run_replaced', 'No active signed-in run': 'no_active_run' };
export function requestErrorCode(data: unknown, status: unknown) {
  if (typeof status !== 'number' || status < 400) return undefined;
  if (data && typeof data === 'object') {
    const code = (data as { error?: unknown }).error;
    if (typeof code === 'string') {
      if ((REQUEST_DIAGNOSTIC_CODES as readonly string[]).includes(code)) return code;
      if (Object.hasOwn(publicAliases, code)) return publicAliases[code];
    }
  }
  if (typeof data === 'string' && status >= 500) {
    for (const code of REQUEST_DIAGNOSTIC_CODES) if (/^[A-Z_]+$/.test(code) && new RegExp(`\\b${code}\\b`).test(data)) return code;
  }
  return 'unknown-http-error';
}
export function providerRequestId(value: unknown) {
  return typeof value === 'string' && value.length <= 200 && value.includes('::') && /^[a-z0-9:_-]+$/.test(value) ? value : undefined;
}
