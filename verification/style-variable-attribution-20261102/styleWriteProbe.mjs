// Short observation only. No value readback, DOM scan, timer, frame or element
// list. Weak keys associate style declarations with primitive owner labels.
// Calls, receivers, arguments, return values and exceptions remain original.
export function installStyleWriteProbe(view = globalThis) {
  if (view.location?.protocol && !['http:', 'https:'].includes(view.location.protocol)) return;
  if (view.__styleWriteProbe) throw Error('Style-write probe already installed');
  const prototype = view.CSSStyleDeclaration.prototype;
  const setterDescriptor = Object.getOwnPropertyDescriptor(prototype, 'setProperty');
  const originals = [view.HTMLElement.prototype, view.SVGElement.prototype].map(proto => {
    const descriptor = Object.getOwnPropertyDescriptor(proto, 'style');
    if (!descriptor?.configurable || typeof descriptor.get !== 'function') throw Error('Style getter unsupported');
    return { proto, descriptor };
  });
  if (!setterDescriptor?.configurable || typeof setterDescriptor.value !== 'function') throw Error('Style setter unsupported');
  let owners = new WeakMap(), groups = new Map(), active = false, started = false, finished = false;
  let faults = 0, overflow = 0, failedCalls = 0, ignoredNonCustomCalls = 0;
  const label = element => {
    const classes = (element.getAttribute('class') || '').trim().split(/\s+/).filter(Boolean).slice(0, 4).join('.');
    return (String(element.tagName).toLowerCase() + (classes ? '.' + classes : '.no-class')).slice(0, 150);
  };
  for (const original of originals) {
    original.wrapped = function() {
      const style = original.descriptor.get.call(this);
      if (active) try {
        if (!owners.has(style)) owners.set(style, { label: label(this), last: new Map() });
      } catch { faults++; }
      return style;
    };
    Object.defineProperty(original.proto, 'style', { ...original.descriptor, get: original.wrapped });
  }
  const nativeSet = setterDescriptor.value;
  const wrappedSet = function(...args) {
    let returned;
    try { returned = nativeSet.apply(this, args); }
    catch (error) { if (active) failedCalls++; throw error; }
    if (active) try {
      const [property, value, priority] = args;
      if (typeof property !== 'string' || !property.startsWith('--')) { ignoredNonCustomCalls++; return returned; }
      const info = owners.get(this), owner = info?.label ?? 'unclassified-style-owner';
      const key = owner + '|' + property;
      if (!groups.has(key)) {
        if (groups.size >= 512 || property.length > 80) { overflow++; return returned; }
        groups.set(key, { owner, property, calls: 0, firstObservedArgument: 0,
          matchingPreviousArgument: 0, differentPreviousArgument: 0, unclassifiedArgument: 0 });
      }
      const row = groups.get(key); row.calls++;
      // Inspect primitive arguments only. Never invoke an application's custom
      // toString twice or claim these arguments measure applied/computed styles.
      if (!info || !['string', 'number'].includes(typeof value)
        || priority !== undefined && typeof priority !== 'string') { row.unclassifiedArgument++; return returned; }
      const argument = String(value), important = priority ?? '';
      const previous = info.last.get(property);
      if (!previous) row.firstObservedArgument++;
      else if (previous.value === argument && previous.priority === important) row.matchingPreviousArgument++;
      else row.differentPreviousArgument++;
      if (info.last.size >= 128 && !info.last.has(property)) overflow++;
      else info.last.set(property, { value: argument, priority: important });
    } catch { faults++; }
    return returned;
  };
  Object.defineProperty(prototype, 'setProperty', { ...setterDescriptor, value: wrappedSet });
  view.__styleWriteProbe = {
    begin() {
      if (started || finished) throw Error('Exactly one observed style-write interval');
      started = true; active = true;
    },
    finish() {
      if (finished) throw Error('Style-write probe already retired');
      active = false; finished = true;
      if (prototype.setProperty === wrappedSet) Object.defineProperty(prototype, 'setProperty', setterDescriptor);
      for (const original of originals) {
        if (Object.getOwnPropertyDescriptor(original.proto, 'style')?.get === original.wrapped)
          Object.defineProperty(original.proto, 'style', original.descriptor);
      }
      const result = { version: 1, started, shortApiObservationOnly: true,
        appliedOrComputedStyleValuesMeasured: false, priorArgumentOnly: true,
        extraStyleValueReads: false, ownerClassReadOnFirstObservedStyleAccess: true,
        extraDomScans: false, newTimersOrFrames: false, elementListsRetained: false,
        weakStyleKeysWithPrimitiveLabels: true, faults, overflow, failedCalls, ignoredNonCustomCalls,
        setPropertyRestored: prototype.setProperty === nativeSet,
        styleGettersRestored: originals.every(original =>
          Object.getOwnPropertyDescriptor(original.proto, 'style')?.get === original.descriptor.get),
        groups: [...groups.values()].sort((a, b) => b.calls - a.calls || (a.owner + a.property).localeCompare(b.owner + b.property)),
        interpretation: 'Counts of successful original CSS custom-property API calls and consecutive observed primitive arguments only. Not actual style invalidations, allocator ownership, a memory baseline or phone acceptance.' };
      owners = new WeakMap(); groups = new Map(); delete view.__styleWriteProbe;
      return result;
    },
  };
}
