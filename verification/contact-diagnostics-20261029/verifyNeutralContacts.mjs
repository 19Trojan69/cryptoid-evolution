import assert from 'node:assert/strict';

// Native Chromium input against the existing UI. Supplied touch radius and
// cancellation exercise browser event handling, not a physical palm or OS kill.
export async function verifyNeutralContacts(page, context, options) {
  const cdp = await context.newCDPSession(page);
  const field = await page.locator('.game-field').boundingBox();
  const button = await page.locator(options.buttonSelector).boundingBox();
  assert.ok(field && button);
  const start = { id: 71, x: field.x + field.width * .78, y: field.y + field.height * .74 };
  const second = { id: 72, x: field.x + field.width * .48, y: start.y + 5 };
  const control = { id: 71, x: button.x + button.width / 2, y: button.y + button.height / 2 };
  const send = (type, touchPoints) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints });
  const result = { complete: false, nativeChromiumTouch: true, physicalDevice: false,
    physicalPalmReproduced: false, osInterruptionReproduced: false, cases: [] };
  await page.evaluate(selector => {
    const rows = [], types = ['pointerdown', 'pointerup', 'pointercancel', 'lostpointercapture',
      'touchstart', 'touchend', 'touchcancel', 'click'];
    const on = event => {
      rows.push({ type: event.type, trusted: event.isTrusted,
        ...(typeof event.isPrimary === 'boolean' ? { primary: event.isPrimary } : {}),
        ...(event.touches ? { touches: event.touches.length } : {}),
        controlTarget: Boolean(event.target.closest?.(selector)) });
      if (rows.length > 192) rows.shift();
    };
    for (const type of types) window.addEventListener(type, on, true);
    window.__neutralContactQA = { rows, stop: () => {
      for (const type of types) window.removeEventListener(type, on, true);
    } };
  }, options.buttonSelector);
  const trace = () => page.evaluate(() => window.__neutralContactQA.rows.slice());
  const clearTrace = () => page.evaluate(() => { window.__neutralContactQA.rows.length = 0; });
  const run = async (name, action, expected = {}) => {
    // Independent cases start with all previous contacts released. Spacing
    // leaves the production diagnostic quota available for each case.
    await page.waitForTimeout(1100);
    await options.assertPlaying(); await options.assertReleased?.(); await clearTrace();
    await action(); await options.assertPlaying(); await options.assertReleased?.();
    const events = await trace();
    assert.ok(events.length && events.every(row => row.trusted), name + ': native browser events required');
    if (expected.two) {
      assert.ok(events.some(row => row.type === 'touchstart' && row.touches === 2), name + ': two touches observed');
      assert.ok(events.some(row => row.type === 'pointerdown' && row.primary === false), name + ': secondary pointer observed');
    }
    if (expected.cancel) {
      assert.ok(events.some(row => row.type === 'pointercancel'), name + ': pointer cancellation observed');
      assert.ok(events.some(row => row.type === 'touchcancel'), name + ': touch cancellation observed');
    }
    if (typeof expected.firstUpPrimary === 'boolean')
      assert.equal(events.find(row => row.type === 'pointerup')?.primary, expected.firstUpPrimary, name + ': release order');
    if (expected.thirdSecondary)
      assert.equal(events.filter(row => row.type === 'pointerdown').at(-1)?.primary, false, name + ': third contact remains secondary');
    const terminal = events.filter(row => ['touchend', 'touchcancel'].includes(row.type)).at(-1);
    assert.equal(terminal?.touches, 0, name + ': browser reports all contacts ended');
    result.cases.push({ name, passed: true, startedWithoutExistingContact: true,
      nativeEvents: events, twoContactsObserved: Boolean(expected.two), nativeCancellationObserved: Boolean(expected.cancel) });
  };
  try {
    await run('simultaneous field contacts without a previous steering finger', async () => {
      await send('touchStart', [start, second]); await options.assertPlaying(); await send('touchEnd', []);
    }, { two: true });
    await run('simultaneous control then field contact; primary lifts first', async () => {
      await send('touchStart', [control, second]); await send('touchEnd', [second]);
      await send('touchMove', [{ ...control, id: 72 }]); await options.assertPlaying(); await send('touchEnd', []);
    }, { two: true, firstUpPrimary: true });
    await run('simultaneous field then control contact; secondary lifts first', async () => {
      await send('touchStart', [start, { ...control, id: 72 }]); await send('touchEnd', [start]);
      await options.assertPlaying(); await send('touchEnd', []);
    }, { two: true, firstUpPrimary: false });
    await run('remaining secondary contact cannot re-arm controls with a third contact', async () => {
      await send('touchStart', [control, second]); await send('touchEnd', [second]);
      await send('touchStart', [second, { ...control, id: 73 }]); await options.assertPlaying();
      await send('touchEnd', [second]); await send('touchEnd', []);
    }, { two: true, firstUpPrimary: true, thirdSecondary: true });
    await run('one supplied wide contact crosses the weapons button', async () => {
      const shape = { radiusX: 80, radiusY: 12, rotationAngle: 80, force: .5 };
      await send('touchStart', [{ ...start, ...shape }]);
      await send('touchMove', [{ ...control, ...shape }]); await send('touchEnd', []);
    });
    await run('one fast left crossing with a single motion event', async () => {
      await send('touchStart', [{ ...start, y: control.y }]);
      await send('touchMove', [control]); await send('touchEnd', []);
    });
    await run('native cancellation of a steering contact', async () => {
      await send('touchStart', [start]); await send('touchCancel', []);
    }, { cancel: true });
    await run('native cancellation of a pending control tap', async () => {
      await send('touchStart', [control]); await send('touchCancel', []);
    }, { cancel: true });
    await run('native cancellation of simultaneous contacts', async () => {
      await send('touchStart', [start, { ...control, id: 72 }]); await send('touchCancel', []);
    }, { two: true, cancel: true });

    const before = await options.snapshot?.();
    await clearTrace();
    for (let cycle = 0; cycle < 12; cycle++) {
      await send('touchStart', [start, { ...control, id: 72 }]);
      if (cycle % 2) await send('touchCancel', []);
      else await send('touchEnd', []);
      await options.assertPlaying(); await options.assertReleased?.();
    }
    const after = await options.snapshot?.();
    result.repeatedSequence = { cycles: 12, cancelledCycles: 6, releasedCycles: 6, complete: true,
      before, after, nativeEvents: await trace() };
    await page.waitForTimeout(1100);
    await page.touchscreen.tap(control.x, control.y);
    await options.returnFromDeliberateTap(); await options.assertPlaying(); await options.assertReleased?.();
    result.freshSingleTapAfterAllCases = true;
    result.complete = true;
    return result;
  } finally {
    await page.evaluate(() => { window.__neutralContactQA?.stop(); delete window.__neutralContactQA; });
    await cdp.detach();
  }
}
