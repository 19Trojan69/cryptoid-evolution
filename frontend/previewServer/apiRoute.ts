import { env } from 'cloudflare:workers';
import { handleDiagnostics } from './diagnosticsService';
export const dynamic = 'force-dynamic';
async function handle(request: Request) {
  try {
    if (!env.DB) throw Error('unavailable');
    return await handleDiagnostics(request, env.DB);
  } catch {
    return Response.json({ error: 'backup unavailable' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
}
export const GET = handle;
export const POST = handle;
