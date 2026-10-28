// Protected guest preview only. No production backend, database or Pi imports.
export function previewReply(method: string, path: string, environment: string | undefined) {
  if (environment !== 'preview') return { status: 403, body: { error: 'private_preview_only' } };
  if (method === 'GET' && path === '/api/user/me') return { status: 200, body: { user: null, canAdmin: false, adminMode: false } };
  if (method === 'GET' && path === '/api/hangar/catalog') return { status: 200, body: { offers: [] } };
  if (method === 'GET' && path === '/api/leaderboard/top') return { status: 200, body: { leaders: [], network: 'testnet' } };
  if (method === 'POST' && path === '/api/usage/collect') return { status: 204 };
  return { status: 403, body: { error: 'isolated_guest_test_denied' } };
}
export default function handler(req: { method?: string; url?: string }, res: { statusCode: number; setHeader(name: string, value: string): void; end(value?: string): void }) {
  const url = new URL(req.url || '/', 'https://isolated.invalid');
  const path = url.searchParams.has('path') ? '/api/' + url.searchParams.get('path') : url.pathname;
  const reply = previewReply(req.method || 'GET', path, process.env.VERCEL_ENV);
  res.statusCode = reply.status;
  res.setHeader('Cache-Control', 'no-store'); res.setHeader('Content-Type', 'application/json');
  res.end(reply.body ? JSON.stringify(reply.body) : undefined);
}
