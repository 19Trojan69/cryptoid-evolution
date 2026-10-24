// @ts-nocheck
// This transport has no database, persistence, credentials or outbound requests.
export function previewReply(method, pathname, environment) {
  if (environment !== 'preview') return { status: 403, body: { error: 'private_preview_only' } };
  if (method === 'GET' && pathname === '/api/user/me') return { status: 200, body: { user: null, canAdmin: false, adminMode: false } };
  if (method === 'GET' && pathname === '/api/hangar/catalog') return { status: 200, body: { offers: [] } };
  if (method === 'GET' && pathname === '/api/leaderboard/top') return { status: 200, body: { leaders: [], network: 'testnet' } };
  if (method === 'POST' && pathname === '/api/usage/collect') return { status: 200, body: { ok: true } };
  return { status: 403, body: { error: 'private_preview_test_data_only' } };
}

export default function handler(req, res) {
  const url = new URL(req.url || '/', 'https://private-preview.invalid');
  const rewritten = url.pathname === '/api/index' ? url.searchParams.get('path') : null;
  const pathname = rewritten === null ? url.pathname : '/api/' + rewritten.replace(/^\/+/, '');
  const result = previewReply(req.method, pathname, process.env.VERCEL_ENV);
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive');
  res.statusCode = result.status;
  res.end(JSON.stringify(result.body));
}
