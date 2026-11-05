import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { serveDevicePreview } from '../boss2-forensics-20261028/devicePreviewServer.mjs';
const server = await serveDevicePreview();
// The original server uses an ephemeral port. Forward only this guest-only
// server at a fixed loopback URL; the app rejects other navigation origins.
import { createServer, request } from 'node:http';
const forward = createServer((req, res) => {
  const upstream = request(server.origin + req.url, { method: req.method, headers: req.headers }, reply => {
    res.writeHead(reply.statusCode, reply.headers); reply.pipe(res);
  });
  upstream.on('error', () => res.writeHead(502).end());
  req.pipe(upstream);
});
await new Promise((done, fail) => forward.once('error', fail).listen(4173, '127.0.0.1', done));
writeFileSync(resolve(new URL('./results/guest-origin.txt', import.meta.url).pathname), 'http://127.0.0.1:4173\n');
console.log('Isolated guest loopback server ready');
