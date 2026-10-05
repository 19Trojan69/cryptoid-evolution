/* Geometry and visible-pixel regression for every current card; no account or payment. */
const { chromium } = require(process.env.PLAYWRIGHT_MODULE_PATH || 'playwright');
const path = require('node:path'), fs = require('node:fs'), assert = require('node:assert/strict');
(async () => {
  const { createServer } = await import(path.resolve('frontend/node_modules/vite/dist/node/index.js'));
  const server = await createServer({ root: path.resolve('frontend'), server: { host: '127.0.0.1', port: 0 }, logLevel: 'error' });
  await server.listen();
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH, headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const page = await browser.newPage();
  const errors = [], results = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(() => { window.Pi = { init() {} }; localStorage.setItem('cryptoid_language','de'); });
  try {
    await page.goto(`http://127.0.0.1:${server.httpServer.address().port}`);
    await page.evaluate(async () => {
      const reactModule = await import('/node_modules/.vite/deps/react.js');
      const React = reactModule.default || reactModule;
      const domModule = await import('/node_modules/.vite/deps/react-dom_client.js');
      const { createRoot } = domModule.default || domModule;
      const { default: Card } = await import('/src/pages/CollectionCardView.tsx');
      const { bossCard, shipCard } = await import('/src/pages/collectionData.ts');
      const { playerSkins } = await import('/src/pages/shipFleet.ts');
      await import('/src/pages/collection.css');
      document.querySelector('#root').style.display = 'none';
      const host = document.createElement('div'); host.id = 'geometry-test'; document.body.append(host);
      // Reuse one React root to exercise transitions between different source dimensions.
      const root = createRoot(host);
      window.renderAuditCard = card => root.render(React.createElement(Card, { card }));
      window.auditCards = [...Array.from({ length: 50 }, (_, i) => bossCard(i + 1, 'de')),
        ...[1,2,3].flatMap(stage => playerSkins.map(ship => shipCard(ship.id, stage, true)))];
      const {loadShipArtwork}=await import('/src/pages/shipArtwork.ts');
      for(const [width,height,left,top,w,h] of [[900,600,710,90,80,330],[1200,320,70,190,850,65]]){
        const source=document.createElement('canvas');source.width=width;source.height=height;
        const ctx=source.getContext('2d');ctx.fillStyle='rgba(255,255,255,.004)';ctx.fillRect(0,0,1,1);
        ctx.fillStyle='#e0e8ef';ctx.fillRect(left,top,w,h);
        const art=await loadShipArtwork(source.toDataURL());
        const data=art.getContext('2d').getImageData(0,0,art.width,art.height).data;
        let L=art.width,T=art.height,R=-1,B=-1;
        for(let y=0;y<art.height;y++)for(let x=0;x<art.width;x++)if(data[(y*art.width+x)*4+3]>=5){L=Math.min(L,x);T=Math.min(T,y);R=Math.max(R,x);B=Math.max(B,y);}
        if(Math.abs((L+R+1)/2-art.width/2)>1||Math.abs((T+B+1)/2-art.height/2)>1)throw new Error('Future asymmetric artwork not centred');
      }
    });
    for (const width of [320,390,1440]) {
      await page.setViewportSize({ width, height: 900 });
      for (let index = 0; index < 110; index++) {
        await page.evaluate(index => { window.scrollTo(0,0); window.renderAuditCard(window.auditCards[index]); }, index);
        await page.waitForFunction(index => {
          const card = document.querySelector('#geometry-test .collection-card');
          const expected=window.auditCards[index], canvas=card?.querySelector('canvas');
          return card?.dataset.cardKey === expected.key && (card.querySelector('.boss-portrait') || canvas)?.dataset.ready === 'true'
            && (expected.bossId ? canvas?.dataset.bossId===String(expected.bossId) : canvas?.dataset.renderedSource===expected.image);
        }, index);
        const geometry = await page.evaluate(() => {
          const card = document.querySelector('#geometry-test .collection-card'), area = card.querySelector('.collection-card-art');
          const canvas = area.querySelector('canvas'), a = area.getBoundingClientRect(), c = canvas.getBoundingClientRect();
          const pixels = canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data;
          let left=canvas.width,top=canvas.height,right=-1,bottom=-1;
          for(let y=0;y<canvas.height;y++)for(let x=0;x<canvas.width;x++)if(pixels[(y*canvas.width+x)*4+3]>=5){
            left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);
          }
          const scale = Math.min(c.width/canvas.width,c.height/canvas.height);
          const x = c.left+(c.width-canvas.width*scale)/2, y = c.top+(c.height-canvas.height*scale)/2;
          const visible = {left:x+left*scale,right:x+(right+1)*scale,top:y+top*scale,bottom:y+(bottom+1)*scale};
          const overlaps = [...card.querySelectorAll('h3,h4,p,dl,.collection-serial')].filter(e=>{
            const r=e.getBoundingClientRect();return r.left<visible.right&&r.right>visible.left&&r.top<visible.bottom&&r.bottom>visible.top;
          }).map(e=>e.className||e.tagName);
          return {key:card.dataset.cardKey,dx:Math.abs((visible.left+visible.right-a.left-a.right)/2),dy:Math.abs((visible.top+visible.bottom-a.top-a.bottom)/2),
            visibleWidth:visible.right-visible.left,visibleHeight:visible.bottom-visible.top,fits:visible.left>=a.left&&visible.right<=a.right&&visible.top>=a.top&&visible.bottom<=a.bottom,overlaps};
        });
        assert.ok(geometry.dx < 1 && geometry.dy < 1 && geometry.fits, JSON.stringify({width,...geometry}));
        assert.deepEqual(geometry.overlaps, [], JSON.stringify({width,...geometry}));
        results.push({width,...geometry});
        if(width===390&&['nova-wing-1','grey-scout-1','dark-delta-1','verdant-1'].includes(geometry.key))
          await page.screenshot({path:path.resolve(process.env.AUDIT_OUTPUT||'audit-output',`centred-${geometry.key}.png`)});
      }
    }
    assert.deepEqual(errors, []);
    const out=path.resolve(process.env.AUDIT_OUTPUT||'audit-output');fs.mkdirSync(out,{recursive:true});
    fs.writeFileSync(path.join(out,'card-centering.json'),JSON.stringify({cases:results,errors},null,2));
    console.log(JSON.stringify({cards:110,futureAsymmetricFixtures:2,viewports:3,checks:results.length,centerTolerancePixels:1,textOverlaps:0,errors}));
  } finally { await browser.close(); await server.close(); }
})().catch(error=>{console.error(error);process.exit(1);});
