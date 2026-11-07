// In the game, keep native gestures out of the viewport while leaving one-finger input alone.
export function lockLabGestures(document, onAttempt) {
  const capture = {capture: true, passive: false};
  const touchEvents = ['touchstart', 'touchmove', 'touchend', 'touchcancel'];
  const gestureEvents = ['gesturestart', 'gesturechange', 'gestureend'];
  let multiTouch = false;

  function touch(event) {
    const started = !multiTouch && event.touches.length > 1;
    if (started) multiTouch = true;
    if (!multiTouch) return;
    if (event.cancelable) event.preventDefault();
    if (started) onAttempt('touch', event.defaultPrevented);
    // A finger left on the screen is still part of the same gesture.
    if (event.touches.length === 0) multiTouch = false;
  }

  function gesture(event) {
    if (event.cancelable) event.preventDefault();
    if (event.type === 'gesturestart') onAttempt('webkit-gesture', event.defaultPrevented);
  }

  for (const type of touchEvents) document.addEventListener(type, touch, capture);
  for (const type of gestureEvents) document.addEventListener(type, gesture, capture);
  return () => {
    for (const type of touchEvents) document.removeEventListener(type, touch, capture);
    for (const type of gestureEvents) document.removeEventListener(type, gesture, capture);
  };
}
