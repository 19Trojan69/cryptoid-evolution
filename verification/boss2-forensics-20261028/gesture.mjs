// Desktop touch dispatch is explicitly not an OS edge-navigation reproduction.
export async function swipe(page, engine, edge = false, cancelled = false) {
  const field = page.locator('.game-field'), box = await field.boundingBox();
  if (!box) throw Error('Missing input surface');
  const points = Array.from({ length: 9 }, (_, i) => ({
    x: box.x + box.width * ((edge ? .99 : .75) * (1 - i / 8) + .075 * i / 8),
    y: box.y + box.height * .84,
  }));
  if (engine === 'chromium') {
    const session = await page.context().newCDPSession(page);
    try {
      await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [points[0]] });
      for (const point of points.slice(1)) {
        await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [point] });
        await page.waitForTimeout(8);
      }
      await session.send('Input.dispatchTouchEvent', { type: cancelled ? 'touchCancel' : 'touchEnd', touchPoints: [] });
    } finally { await session.detach(); }
    return 'chromium-cdp-touch';
  }
  await field.dispatchEvent('pointerdown', { pointerId: 27, pointerType: 'touch', isPrimary: true, buttons: 1, clientX: points[0].x, clientY: points[0].y });
  for (const point of points.slice(1)) {
    await field.dispatchEvent('pointermove', { pointerId: 27, pointerType: 'touch', isPrimary: true, buttons: 1, clientX: point.x, clientY: point.y });
    await page.waitForTimeout(8);
  }
  await field.dispatchEvent(cancelled ? 'pointercancel' : 'pointerup', { pointerId: 27, pointerType: 'touch', isPrimary: true, buttons: 0, clientX: points.at(-1).x, clientY: points.at(-1).y });
  return 'synthetic-dom-pointer-handler-only';
}
