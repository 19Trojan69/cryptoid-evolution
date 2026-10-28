import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { createAccountFixture, instrumentController, root } from './fixture.mjs';
const require = createRequire(root + '/frontend/package.json');
const { createServer } = require('vite');

export async function createLabServer({ mode = 'direct', cacheDir, port = 0, diagnostics = true, note = () => {} } = {}) {
  assert.ok(['direct', 'warm'].includes(mode));
  const { h, initialize } = createAccountFixture();
  await initialize(mode === 'direct' ? 20 : 1);
  const requestCounts = {}, apiErrors = [];
  const bootstrap = `<script>
    window.__bossLabDirect = ${mode === 'direct'};
    window.__bossLabDocument = crypto.randomUUID();
    let labSeed = 0x281026;
    Math.random = () => { labSeed = (Math.imul(1664525,labSeed)+1013904223)>>>0; return labSeed/4294967296; };
    localStorage.setItem('cryptoid_language','en');
    localStorage.setItem('cryptoid_control_hand','right');
    localStorage.setItem('cryptoid_pi_session','1');
    sessionStorage.setItem('cryptoid_pi_access_token','isolated-boss-lab-token');
    localStorage.setItem('cryptoid_auto_reload:testnet:pilot-a',JSON.stringify({5:true}));
    window.Pi = {init(){},getPiHostAppInfo:async()=>({hostApp:'web'}),authenticate:async()=>({accessToken:'isolated-boss-lab-token',user:{uid:'pilot-a',username:'Isolated boss laboratory'}})};
    </script>`;
  const server = await createServer({ root: root + '/frontend', cacheDir, logLevel: 'error',
    server: { host: '127.0.0.1', port, strictPort: !!port, hmr: false, fs: { allow: [root] } },
    plugins: [{ name: 'isolated-boss-lab', enforce: 'pre',
      transform(code, id) { if (id.split('?')[0].endsWith('/pages/GamePage.tsx')) return instrumentController(code); },
      transformIndexHtml: { order: 'post', handler: html => {
        const altered = html.replace(/appNetwork:\s*"[^"]*"/, 'appNetwork: "testnet"')
          .replace(/backendURL:\s*"[^"]*"/, 'backendURL: "/api"')
          .replace(/<script\b[^>]*src=["']https:\/\/sdk\.minepi\.com\/[^"']+["'][^>]*><\/script>/g, '');
        return altered.replace('</head>', bootstrap + '</head>');
      } },
      configureServer(vite) {
        vite.middlewares.use(async (req, res, next) => {
          const url = new URL(req.url, 'http://127.0.0.1');
          if (!url.pathname.startsWith('/api/')) return next();
          requestCounts[url.pathname] = (requestCounts[url.pathname] || 0) + 1;
          const [group, ...parts] = url.pathname.slice(5).split('/');
          const chunks = []; let length = 0;
          try {
            for await (const chunk of req) { length += chunk.length; if (length > 1024 * 1024) throw Error('fixture-request-too-large'); chunks.push(chunk); }
            const text = Buffer.concat(chunks).toString('utf8'), body = text ? JSON.parse(text) : null;
            let response;
            if (group === 'user') response = { code: 200, body: { user: { uid: 'pilot-a', username: 'Isolated boss laboratory' }, canAdmin: diagnostics, adminMode: false } };
            else if (group === 'admin') response = { code: 200, body: { canAdmin: diagnostics, adminMode: false } };
            else if (group === 'usage') response = { code: 204 };
            else if (['progress', 'hangar', 'rewards', 'leaderboard'].includes(group))
              response = await h.call(group, '/' + parts.join('/'), body, { method: req.method });
            else response = { code: 404, body: { error: 'unhandled_isolated_endpoint' } };
            if (response.code >= 400) { const error = { path: url.pathname, status: response.code, code: response.body?.error }; apiErrors.push(error); note('api-error', error); }
            res.statusCode = response.code; res.setHeader('Content-Type', 'application/json');
            res.end(response.code === 204 ? '' : JSON.stringify(response.body));
          } catch (error) {
            apiErrors.push({ path: url.pathname, status: 500, code: 'fixture-error' });
            res.statusCode = 500; res.end('{"error":"isolated-fixture-error"}'); note('fixture-error', { message: error.message });
          }
        });
      },
    }],
  });
  await server.listen();
  return { server, origin: 'http://127.0.0.1:' + server.httpServer.address().port, apiErrors, requestCounts };
}
