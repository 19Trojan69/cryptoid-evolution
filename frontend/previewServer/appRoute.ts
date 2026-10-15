import previewHtml from './preview.html?raw';
export const dynamic = 'force-dynamic';
export function GET() {
  return new Response(previewHtml, { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } });
}
