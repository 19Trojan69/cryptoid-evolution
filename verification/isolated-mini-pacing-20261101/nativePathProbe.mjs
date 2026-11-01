// Short path proof only. The long memory runs never install these wrappers.
// Original calls/results and callback ownership are preserved. No timer, RAF,
// extra animation query or element is retained in the exported scalar state.
export function installNativePathProbe() {
  if (window.__isolatedMiniNativeProof) throw Error('Native proof already installed');
  const state = { miniStartEvents: 0, miniEndEvents: 0, miniQueriesTotal: 0,
    miniQueriesAtStart: 0, miniTimingUpdates: 0, otherTimingUpdates: 0 };
  const mini = element => !!element?.closest?.('.sector-boss .hull-mini-explosion');
  const add = EventTarget.prototype.addEventListener, remove = EventTarget.prototype.removeEventListener;
  const queries = Element.prototype.getAnimations, timing = KeyframeEffect.prototype.updateTiming;
  const wrappers = new WeakMap();
  let startDepth = 0;
  EventTarget.prototype.addEventListener = function(type, listener, options) {
    if (this !== document.body || !['animationstart', 'transitionrun'].includes(type) || !listener)
      return add.call(this, type, listener, options);
    let known = wrappers.get(listener); if (!known) { known = new Map(); wrappers.set(listener, known); }
    const key = type + ':' + Boolean(typeof options === 'boolean' ? options : options?.capture);
    let wrapped = known.get(key);
    if (!wrapped) {
      wrapped = function(event) {
        startDepth++;
        try { return typeof listener === 'function' ? listener.call(this, event) : listener.handleEvent(event); }
        finally { startDepth--; }
      };
      known.set(key, wrapped);
    }
    return add.call(this, type, wrapped, options);
  };
  EventTarget.prototype.removeEventListener = function(type, listener, options) {
    const key = type + ':' + Boolean(typeof options === 'boolean' ? options : options?.capture);
    const wrapped = this === document.body && listener ? wrappers.get(listener)?.get(key) : undefined;
    return remove.call(this, type, wrapped || listener, options);
  };
  Element.prototype.getAnimations = function(...args) {
    if (mini(this)) { state.miniQueriesTotal++; if (startDepth) state.miniQueriesAtStart++; }
    return queries.apply(this, args);
  };
  KeyframeEffect.prototype.updateTiming = function(...args) {
    if (mini(this.target)) state.miniTimingUpdates++; else state.otherTimingUpdates++;
    return timing.apply(this, args);
  };
  add.call(document, 'animationstart', event => { if (mini(event.target)) state.miniStartEvents++; }, true);
  add.call(document, 'animationend', event => { if (mini(event.target)) state.miniEndEvents++; }, true);
  window.__isolatedMiniNativeProof = () => ({ ...state });
}
