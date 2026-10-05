// Isolated browser regression checks; no real Pi account, wallet or database is used.
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const { chromium } = require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES + '/playwright');
const repo = path.resolve(__dirname, '../..');
const { hangarCatalog } = require(path.join(repo, 'backend/build/hangarCatalog.js'));
const { weaponPayment, creditWeaponOrders, emptyWeaponStock } = require(path.join(repo, 'backend/build/weaponStock.js'));

(async () => {
  const { createServer } = await import(path.join(repo, 'frontend/node_modules/vite/dist/node/index.js'));
  const entry = `import React from 'react'; import {createRoot} from 'react-dom/client'; import '/src/index.css'; import '/src/mobileMenus.css'; import '/src/mobileDeepMenus.css'; import MissionWeaponShop from '/src/pages/MissionWeaponShop.tsx'; createRoot(document.getElementById('root')).render(React.createElement('div',{className:'game-shell'},React.createElement('div',{className:'game-overlay pause-settings-overlay'},React.createElement('div',{className:'weapon-selection-dialog'},React.createElement(MissionWeaponShop,{authenticated:true,admin:false,timers:[],onInventory:async()=>{},onClose:()=>{}})))));`;
  const server = await createServer({ plugins: [{name: "isolated-shop-entry", resolveId(id) {if(id === "/qa-entry.tsx") return id;}, load(id) {if(id === "/qa-entry.tsx") return entry;}}], root: path.join(repo, 'frontend'), logLevel: 'error', server: { host: '127.0.0.1', port: 0, hmr: false } });
  await server.listen();
  const origin = 'http://testnet.localhost:' + server.httpServer.address().port;
  const browser = await chromium.launch({ executablePath: process.env.CRYPTOID_CHROMIUM || '/tmp/cryptoid-chromium', headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage', '--host-resolver-rules=MAP testnet.localhost 127.0.0.1'] });
  const results = [];
  const out = process.env.CRYPTOID_QA_DIR || '/tmp/cryptoid-shop-qa';
  fs.mkdirSync(out, { recursive: true });
  try {
    for (const width of [390, 320, 1280]) {
      const context = await browser.newContext({ viewport: { width, height: width < 700 ? 844 : 900 }, isMobile: width < 700, hasTouch: width < 700 });
      const requests = [], errors = [], orders = [];
      let stock = emptyWeaponStock(), approveFailure = false, completionFailure = false;
      await context.addInitScript(() => {
        localStorage.setItem('cryptoid_language', 'de');
        window.__ENV = { backendURL: '/api' };
        window.qa = { calls: [], creates: [], authCount: 0, scenario: 'success' };
        window.Pi = {
          authenticate: async (scopes, incomplete) => {
            window.qa.calls.push('authenticate'); window.qa.authCount++; window.qa.incomplete = incomplete;
            if (window.qa.scenario === 'recovery') incomplete({ identifier: 'recovered' });
            return { accessToken: 'isolated-test-token', user: { uid: 'local-test', username: 'Test', roles: [] } };
          },
          createPayment: (data, callbacks) => {
            window.qa.calls.push('create'); window.qa.creates.push(data); window.qa.callbacks = callbacks;
          },
        };
      });
      await context.route('**/*', async route => {
        const url = new URL(route.request().url());
        if (url.origin !== origin) return route.abort();
        if (url.pathname === '/qa-shop') return route.fulfill({ contentType: 'text/html', body: await server.transformIndexHtml('/qa-shop', `<html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><div id="root"></div><script type="module" src="/qa-entry.tsx"></script></body></html>`) });
        if (url.pathname === '/qa-entry.tsx') {
          return route.continue();

        }
        if (!url.pathname.startsWith('/api/')) return route.continue();
        requests.push({ path: url.pathname, body: route.request().postDataJSON() });
        let data = {}, status = 200;
        if (url.pathname.endsWith('/hangar/catalog')) data = { offers: hangarCatalog };
        else if (url.pathname.endsWith('/hangar/inventory')) {
          stock = creditWeaponOrders(stock, orders, 'testnet');
          data = { ownedWeapons: Object.keys(stock.balances), weaponStock: stock.balances };
        } else if (url.pathname.endsWith('/user/signin')) data = { user: { uid: 'local-test' } };
        else if (url.pathname.endsWith('/payments/approve')) {
          if (approveFailure) { status = 502; data = { error: 'payment_approval_failed', diagnostic: { code: 'testnet_api_key_missing' } }; }
          else data = { approved: true };
        } else if (url.pathname.endsWith('/payments/complete')) {
          if (completionFailure) { status = 502; data = { error: 'payment_not_confirmed' }; }
          else {
            const page = context.pages()[0];
            const purchase = await page.evaluate(() => window.qa.creates.at(-1));
            const offer = hangarCatalog.find(o => o.id === purchase.metadata.productId);
            assert.equal(weaponPayment(offer, purchase.metadata).amount, purchase.amount);
            orders.push({ pi_payment_id: route.request().postDataJSON().paymentId, paid: true, product_id: offer.id, payment_network: 'Pi Testnet', weapon_model: 2, quantity: purchase.metadata.quantity });
            data = { completed: true };
          }
        } else if (url.pathname.endsWith('/payments/incomplete')) {
          orders.push({ pi_payment_id: 'recovered', paid: true, product_id: 'weapon_twin', payment_network: 'Pi Testnet', weapon_model: 2, quantity: 1 });
          data = { completed: true };
        } else if (url.pathname.endsWith('/payments/cancelled_payment')) data = { cancelled: true };
        else { status = 404; data = { error: 'Unexpected request' }; }
        return route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(data) });
      });
      const page = await context.newPage();
      page.setDefaultTimeout(12000);
      page.on('pageerror', error => { errors.push(error.message); console.error('PAGE',error.message); });
      await page.goto(origin + '/qa-shop');
      const card = page.locator('.mission-weapon-card[data-level="2"]');
      const buy = card.locator('.weapon-buy-button');
      await buy.waitFor();
      await page.waitForFunction(() => !document.querySelector('.weapon-buy-button').disabled);
      assert.equal(await page.locator('.weapon-fire-preview').count(), 5);
      assert.equal(await card.locator('.weapon-fire-preview-volley').count(), 4);
      await card.getByRole('button', { name: 'Menge: 10', exact: true }).click();
      assert.equal(await card.locator('input').inputValue(), '10');
      assert.match(await buy.innerText(), /1,00/);
      const dimensions = await card.evaluate(el => ({ card: el.getBoundingClientRect().height, buttons: [...el.querySelectorAll('button')].map(b => b.getBoundingClientRect().height), overflow: el.scrollWidth > el.clientWidth + 1 }));
      assert(dimensions.buttons.every(h => h >= 40 && h <= 44), JSON.stringify(dimensions));
      assert(!dimensions.overflow, 'Card must not overflow horizontally');
      await page.screenshot({ path: path.join(out, `shop-${width}.png`) });
      await buy.evaluate(button => { button.click(); button.click(); });
      await page.waitForFunction(() => window.qa.creates.length === 1);
      assert(await buy.isDisabled());
      assert.match(await card.locator('[role="status"]').innerText(), /Zahlung wird geöffnet/);
      assert.deepEqual(await page.evaluate(() => window.qa.calls), ['authenticate', 'create']);
      assert.equal(requests.filter(r => r.path === '/api/user/signin').length, 1);
      await page.evaluate(() => window.qa.callbacks.onReadyForServerApproval('purchase-1'));
      await page.evaluate(() => window.qa.callbacks.onReadyForServerCompletion('purchase-1', 'tx-1'));
      await page.waitForFunction(() => !document.querySelector('.weapon-buy-button').disabled);
      assert.match(await card.locator('.mission-stock').innerText(), /10/);
      await buy.click();
      await page.waitForFunction(() => window.qa.creates.length === 2);
      assert.equal(await page.evaluate(() => window.qa.authCount), 1, 'Repeated purchases reuse the SDK session');
      await page.evaluate(() => window.qa.callbacks.onCancel('purchase-2'));
      assert(!(await buy.isDisabled()));
      assert.match(await card.locator('[role="status"]').innerText(), /abgebrochen/);
      approveFailure = true;
      await buy.click();
      await page.waitForFunction(() => window.qa.creates.length === 3);
      await page.evaluate(() => window.qa.callbacks.onReadyForServerApproval('purchase-3'));
      assert.match(await card.locator('[role="alert"]').innerText(), /testnet_api_key_missing/);
      assert(!(await buy.isDisabled()));
      approveFailure = false; completionFailure = true;
      await buy.click();
      await page.waitForFunction(() => window.qa.creates.length === 4);
      await page.evaluate(() => window.qa.callbacks.onReadyForServerCompletion('purchase-4', 'tx-4'));
      assert.match(await card.locator('[role="alert"]').innerText(), /payment_not_confirmed/);
      assert.match(await card.locator('.mission-stock').innerText(), /10/);
      completionFailure = false;
      await page.evaluate(() => { window.qa.scenario = 'recovery'; });
      await buy.click();
      await page.waitForFunction(() => !document.querySelector('.weapon-buy-button').disabled);
      assert.equal(await page.evaluate(() => window.qa.creates.length), 4, 'Recover without another charge');
      assert.match(await card.locator('.mission-stock').innerText(), /11/);
      await page.evaluate(() => { window.qa.scenario = 'success'; });
      await buy.click();
      await page.waitForFunction(() => window.qa.creates.length === 5);
      await page.evaluate(() => { window.qa.incomplete({ identifier: 'recovered' }); window.qa.callbacks.onError(new Error('Previous payment incomplete')); });
      await page.waitForFunction(() => document.querySelector('.weapon-purchase-status')?.textContent?.includes('bestätigt'));
      assert.match(await card.locator('.mission-stock').innerText(), /11/);
      assert.equal(await page.evaluate(() => window.qa.creates.length), 5);
      await card.locator('input').fill('100');
      assert(await buy.isDisabled());
      assert.deepEqual(errors, []);
      results.push({ width, ...dimensions, scenarios: ['login restoration', 'quantity 10', 'instant status', 'confirmation', 'session reuse', 'cancel', 'approval failure', 'unconfirmed payment', 'incomplete recovery', 'later incomplete callback', 'double-tap guard', 'quantity validation'], errors });
      await context.close();
    }
    console.log(JSON.stringify(results, null, 2));
  } catch (error) { for (const ctx of browser.contexts()) for (const p of ctx.pages()) { await p.screenshot({path:path.join(out,'failure.png')}); console.error((await p.locator('body').innerText()).slice(0,2000)); } throw error; } finally { await browser.close(); await server.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
