import type { AxiosInstance } from 'axios';
import { sessionDiagnostic, sessionDiagnosticsActive } from './sessionDiagnosticEvents.ts';
import { providerRequestId, requestErrorCode } from './requestDiagnosticCodes.ts';

export function diagnosticEndpoint(url: unknown) {
  if (typeof url !== 'string') return 'other';
  if (url === '/hangar/start' || url === '/admin/start') return 'loadout';
  if (url === '/hangar/weapon/activate') return 'weapon';
  if (url === '/progress/checkpoint') return 'checkpoint';
  if (url === '/progress/boss-summary/prepare') return 'boss-summary-prepare';
  if (url === '/progress/boss-summary/continue') return 'boss-summary-continue';
  if (url === '/progress/recover') return 'recover';
  if (url === '/rewards/event') return 'reward';
  if (url === '/leaderboard/score' || url === '/leaderboard/checkpoint') return 'score';
  if (url === '/user/me') return 'session';
  return 'other';
}
// Observe timing/status, fixed public error categories and the platform request ID.
// Never persist bodies, identities, tokens, arbitrary headers, messages or URL queries.
// Preserve the original request and response; no retry or configuration mutation.
export function installSessionRequestDiagnostics(client: AxiosInstance) {
  const requests = new WeakMap<object, { request: number; endpoint: string; method: string; at: number }>();
  let serial = 0;
  client.interceptors.request.use(config => {
    try { if (sessionDiagnosticsActive()) {
      const method = String(config.method ?? '').toUpperCase();
      const value = { request: ++serial, endpoint: diagnosticEndpoint(config.url),
        method: ['GET','POST','PUT','PATCH','DELETE'].includes(method) ? method : 'OTHER', at: performance.now() };
      requests.set(config, value);
      sessionDiagnostic('request', { ...value, operation: 'start' });
    } } catch { /* Optional timing never changes the request. */ }
    return config;
  });
  const finish = (config: unknown, status: unknown, code: unknown, success: boolean, data?: unknown, requestId?: unknown, upstreamId?: unknown) => {
    if (!config || typeof config !== 'object') return;
    const value = requests.get(config);
    if (!value) return;
    requests.delete(config);
    sessionDiagnostic('request', { ...value, operation: success ? 'response' : 'failure',
      httpStatus: typeof status === 'number' ? status : 0, durationMs: Math.max(0, performance.now() - value.at),
      errorCode: requestErrorCode(data, status), providerRequestId: providerRequestId(requestId),
      upstreamRequestId: providerRequestId(upstreamId),
      outcome: success ? 'success' : code === 'ERR_CANCELED' ? 'cancelled' : code === 'ECONNABORTED' ? 'timeout'
        : typeof status === 'number' ? 'http' : 'network' });
  };
  client.interceptors.response.use(response => {
    try { finish(response.config, response.status, undefined, true, undefined, response.headers?.['x-vercel-id'], response.headers?.['x-cryptoid-upstream-request-id']); } catch { /* Preserve the response. */ }
    return response;
  }, (error: unknown) => {
    try {
      const value = error as { config?: unknown; response?: { status?: unknown; data?: unknown; headers?: Record<string, unknown> }; code?: unknown } | null;
      finish(value?.config, value?.response?.status, value?.code, false, value?.response?.data, value?.response?.headers?.['x-vercel-id'], value?.response?.headers?.['x-cryptoid-upstream-request-id']);
    } catch { /* Preserve the original rejection. */ }
    return Promise.reject(error);
  });
}

