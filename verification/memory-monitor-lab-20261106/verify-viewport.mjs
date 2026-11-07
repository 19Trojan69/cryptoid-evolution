import assert from 'node:assert/strict';

function viewport(page) {
  return page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(() => {
    const view = window.visualViewport;
    resolve({scale: view.scale, left: view.offsetLeft, top: view.offsetTop, x: scrollX, y: scrollY});
  }))));
}

async function checkFit(page) {
  const {route, shell, screen} = await page.evaluate(() => {
    const bounds = selector => {
      const {left, top, width, height} = document.querySelector(selector).getBoundingClientRect();
      return [left, top, width, height];
    };
    return {route: bounds('.lab-game-route'), shell: bounds('.game-shell'), screen: [0, 0, innerWidth, innerHeight]};
  });
  assert.deepEqual(route, screen, 'The game route must fill the available viewport');
  assert.deepEqual(shell, route, 'The whole playfield must fit inside the fixed route');
}

function nativeTouch(session) {
  const send = (type, ...touchPoints) => session.send('Input.dispatchTouchEvent', {type, touchPoints});
  const move = (x, y, id = 0) => ({x, y, id});
  return {
    async pinchAndPan(page, x, y) {
      await send('touchStart', move(x - 18, y));
      await send('touchStart', move(x - 18, y), move(x + 18, y, 1));
      for (let spread = 28; spread <= 118; spread += 10) {
        await send('touchMove', move(x - spread, y), move(x + spread, y, 1));
      }
      const pinched = await viewport(page);
      for (let shift = 10; shift <= 60; shift += 10) {
        await send('touchMove', move(x - 118 + shift, y), move(x + 118 + shift, y, 1));
      }
      const panned = await viewport(page);
      await send('touchEnd');
      return {pinched, panned};
    },
    async drag(x, y, dx, dy) {
      await send('touchStart', move(x, y));
      for (let step = 1; step <= 8; step++) {
        await send('touchMove', move(x + dx * step / 8, y + dy * step / 8));
      }
      await send('touchEnd');
    },
  };
}

// Playwright's WebKit touchscreen can tap, but it cannot send a native two-finger sequence.
function webKitEvents(page, selector) {
  return page.locator(selector).evaluate(target => {
    let previous = [];
    const eventCanceled = (type, touches) => {
      const event = new Event(type, {bubbles: true, cancelable: true});
      if (touches) {
        const active = touches.map((clientY, identifier) => ({clientX: 195, clientY, identifier, target}));
        Object.defineProperties(event, {
          touches: {value: active},
          changedTouches: {value: type === 'touchend' ? previous.slice(active.length) : active},
        });
        previous = active;
      }
      return !target.dispatchEvent(event);
    };
    return [eventCanceled('touchstart', [200]), eventCanceled('touchstart', [200, 300]),
      eventCanceled('touchmove', [185, 315]), eventCanceled('touchend', [185]),
      eventCanceled('touchmove', [175]), eventCanceled('touchend', []),
      eventCanceled('touchstart', [200]), eventCanceled('touchend', []),
      eventCanceled('gesturestart'), eventCanceled('gesturechange'), eventCanceled('gestureend')];
  });
}

export async function verifyViewport(page, context, origin, engine) {
  const errors = [], requests = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('crash', () => errors.push('page-crash'));
  await context.route('**/*', route => {
    const url = new URL(route.request().url());
    if (url.origin === origin || ['fonts.googleapis.com', 'fonts.gstatic.com'].includes(url.hostname)) return route.continue();
    requests.push(url.origin);
    return route.abort();
  });
  const touch = engine === 'chromium' ? nativeTouch(await context.newCDPSession(page)) : null;
  if (!touch) await page.addInitScript(() => {
    // Exercise the web-view fallback when the host rejects fullscreen.
    Element.prototype.requestFullscreen = () => Promise.reject(new DOMException('Host denied fullscreen', 'NotAllowedError'));
  });
  await page.goto(origin, {waitUntil: 'domcontentloaded'});
  await page.getByLabel('Testschutz gegen Lebensverlust', {exact: true}).check();
  await page.getByRole('button', {name: 'Test vorbereiten', exact: true}).click();
  await page.getByRole('button', {name: 'Testspiel starten', exact: true}).tap();
  await page.waitForFunction(() => window.__cryptoidLabRead?.().status === 'paused');
  await page.waitForFunction(() => window.__cryptoidReloadState.events.some(event => event.kind === 'lab-fullscreen-start'));
  const fullscreen = await page.evaluate(() => window.__cryptoidReloadState.events.find(event => event.kind === 'lab-fullscreen-start').outcome);
  assert.equal(fullscreen, touch ? 'changed' : 'denied');
  await checkFit(page);
  if (touch) {
    assert.equal(await page.evaluate(() => document.fullscreenElement === document.documentElement), true);
    // Test the pinch with native fullscreen off, as in the iPhone report.
    await page.evaluate(() => document.exitFullscreen());
    await checkFit(page);
  }
  const baseline = await viewport(page);
  assert.deepEqual(baseline, {scale: 1, left: 0, top: 0, x: 0, y: 0});
  const read = () => page.evaluate(() => ({boot: window.__cryptoidBootId, ...window.__cryptoidLabRead()}));
  await page.locator('.pause-resume-button').tap();
  await page.waitForFunction(() => window.__cryptoidLabRead?.().status === 'playing');
  const before = await read();
  const expectNoMotion = async (x, y) => {
    assert.deepEqual(await touch.pinchAndPan(page, x, y), {pinched: baseline, panned: baseline});
  };
  const expectedEvents = [false, true, true, true, true, true, false, false, true, true, true];
  if (touch) {
    await expectNoMotion(195, 540);
    await expectNoMotion(195, 30);
    const left = () => page.locator('.player-ship').evaluate(ship => parseFloat(ship.style.left));
    const initialLeft = await left();
    await touch.drag(195, 615, 95, 0);
    await page.waitForFunction(start => parseFloat(document.querySelector('.player-ship').style.left) > start + 10, initialLeft);
  } else {
    for (const selector of ['.game-field', '.game-hud', '.lab-monitor button']) {
      const events = await webKitEvents(page, selector);
      // The older field double-tap guard can also cancel the last one-finger tap.
      if (selector === '.game-field') events.splice(6, 2, false, false);
      assert.deepEqual(events, expectedEvents);
    }
  }
  await page.waitForFunction(frames => window.__cryptoidLabRead().frames > frames + 5, before.frames);
  const after = await read();
  assert.equal(after.boot, before.boot);
  assert.equal(after.status, 'playing');
  assert.equal(page.url(), origin + '/game');

  await page.locator('.pause-control').tap();
  await page.locator('.pause-weapon-shop-button').tap();
  const drawer = page.locator('.mission-shop-scroll');
  // Locate the drawer after its entrance animation has moved it onto the screen.
  await drawer.scrollIntoViewIfNeeded();
  const box = await drawer.boundingBox();
  assert.ok(box && await drawer.evaluate(element => element.scrollHeight > element.clientHeight));
  assert.equal(await drawer.evaluate(element => getComputedStyle(element).touchAction), 'pan-y');
  if (touch) {
    await expectNoMotion(Math.round(box.x + box.width / 2), Math.round(box.y + box.height / 2));
    assert.equal(await drawer.evaluate(element => element.scrollTop), 0);
    await drawer.evaluate(element => element.addEventListener('scrollend', () => {
      element.dataset.testScrollComplete = 'true';
    }, {once: true}));
    await touch.drag(box.x + box.width / 2, box.y + box.height * .8, 0, -Math.min(160, box.height * .5));
    // A tap during native momentum stops scrolling before it activates a button.
    await page.waitForFunction(() => {
      const body = document.querySelector('.mission-shop-scroll');
      return body.dataset.testScrollComplete === 'true' && body.scrollTop > 15;
    });
  } else {
    assert.deepEqual(await webKitEvents(page, '.mission-shop-scroll'), expectedEvents);
    const allowed = await drawer.evaluate(element => {
      for (const [type, clientY] of [['touchstart', 300], ['touchmove', 200]]) {
        const event = new Event(type, {bubbles: true, cancelable: true});
        Object.defineProperty(event, 'touches', {value: [{clientY}]});
        if (!element.dispatchEvent(event)) return false;
      }
      return true;
    });
    assert.equal(allowed, true, 'A one-finger pan inside the scrollable drawer must be allowed');
  }
  await page.locator('.mission-return').tap();
  await page.waitForFunction(() => window.__cryptoidLabRead().status === 'playing');
  const gestures = await page.evaluate(() => window.__cryptoidReloadState.events.filter(event => event.kind === 'lab-multitouch'));
  assert.ok(gestures.some(event => event.trigger === 'touch'));
  if (!touch) assert.ok(gestures.some(event => event.trigger === 'webkit-gesture' && event.defaultPrevented));

  // Leave via the game's normal controls and use the unlocked overview as a positive control.
  await page.locator('.home-control').tap();
  await page.getByRole('button', {name: 'Leave game', exact: true}).tap();
  await page.getByRole('heading', {name: 'Speicherlabor', exact: true}).waitFor();
  assert.equal(await page.evaluate(() => document.documentElement.classList.contains('game-viewport-locked')), false);
  assert.equal(await page.evaluate(() => window.__cryptoidBootId), before.boot);
  let overviewScale;
  if (touch) {
    const control = await touch.pinchAndPan(page, 195, 185);
    overviewScale = control.pinched.scale;
    assert.ok(overviewScale > 1.1, 'The same input must really zoom the unlocked overview');
  } else {
    assert.deepEqual(await webKitEvents(page, '.lab-menu h1'), Array(expectedEvents.length).fill(false));
  }
  assert.deepEqual(errors, []);
  assert.deepEqual(requests, []);
  return {fullscreen, input: touch ? 'trusted-two-finger' : 'synthetic-multitouch-and-webkit-events',
    viewport: baseline, overviewScale, gestureEvents: gestures.length, sameDocument: true, pausedDrawer: true};
}
