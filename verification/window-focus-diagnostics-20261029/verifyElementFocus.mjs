import assert from 'node:assert/strict';

export async function verifyElementFocus(page, context, options) {
  await options.assertPlaying();
  let cdp;
  const field = await page.locator('.game-field').boundingBox(); assert.ok(field);
  const first = { id: 91, x: field.x + field.width * .75, y: field.y + field.height * .7 };
  const second = { id: 92, x: field.x + field.width * .5, y: field.y + field.height * .7 };
  const result = { complete: false, physicalDevice: false, nativeMultitouch: options.nativeMultitouch === true };
  await page.waitForTimeout(1100);
  result.startedAt = await page.evaluate(() => {
    const events = [];
    const on = event => { if (events.length < 32) events.push({ window: event.target === window,
      element: event.target instanceof Element, trusted: event.isTrusted }); };
    window.addEventListener('blur', on, true);
    window.__elementFocusQA = { events, stop: () => window.removeEventListener('blur', on, true) };
    return Date.now();
  });
  try {
    if (result.nativeMultitouch) {
      cdp = await context.newCDPSession(page);
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [first] });
    }
    await page.locator(options.firstSelector).focus();
    await page.locator(options.secondSelector).focus();
    assert.equal(await page.evaluate(selector => document.activeElement?.matches(selector), options.secondSelector), true,
      'browser focus moved to the next control');
    await options.assertPlaying();
    if (result.nativeMultitouch) {
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [first, second] });
      await options.assertTwoContacts?.();
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    }
    result.events = await page.evaluate(() => window.__elementFocusQA.events.slice());
    assert.ok(result.events.some(e => e.element && e.trusted), 'a genuine element blur occurred');
    assert.equal(result.events.filter(e => e.window).length, 0, 'browser window did not lose focus');
    await options.assertNoDiagnosticWindowBlur?.();
    await options.assertPlaying();
    result.endedAt = await page.evaluate(() => Date.now()); result.complete = true;
    return result;
  } finally {
    await page.evaluate(() => { window.__elementFocusQA?.stop(); delete window.__elementFocusQA; });
    if (cdp) await cdp.detach();
  }
}
