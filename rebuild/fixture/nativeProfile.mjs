// Optional read-only Inspector attribution for this local Linux WPE fixture.
// Patch only this Node process's module compilation, never installed files.
export function armNativeProfile(require) {
  const Module = require('node:module'), { readFileSync } = require('node:fs');
  const original = Module._extensions['.js'];
  const profile = { errors: [], latest: null, canvases: new Map(), session: null, patched: false };
  Module._extensions['.js'] = function(module, file) {
    if (!file.endsWith('/playwright-core/lib/coreBundle.js')) return original(module, file);
    const source = readFileSync(file, 'utf8'), start = source.indexOf('WKSession = class extends'), end = source.indexOf('\n    };', start);
    const section = source.slice(start, end), marker = 'async send(method, params2) {';
    if (start < 0 || end < start || section.split(marker).length !== 2) { profile.errors.push('Native Inspector hook unavailable'); return original(module, file); }
    const patched = section.replace(marker, marker + "\nif(method==='Page.enable'&&!this.__rebuildProfile){this.__rebuildProfile=true;queueMicrotask(()=>globalThis.__rebuildArmNativeProfile?.(this));}");
    profile.patched = true; module._compile(source.slice(0, start) + patched + source.slice(end), file);
    Module._extensions['.js'] = original;
  };
  globalThis.__rebuildArmNativeProfile = session => {
    profile.session = session;
    session.on('Memory.trackingUpdate', ({ event }) => { profile.latest = event; });
    session.on('Canvas.canvasAdded', ({ canvas }) => {
      if (profile.canvases.size >= 2048) { profile.errors.push('Canvas attribution truncated'); return; }
      profile.canvases.set(canvas.canvasId, { type: canvas.contextType, memoryCost: canvas.memoryCost });
    });
    session.on('Canvas.canvasRemoved', ({ canvasId }) => profile.canvases.delete(canvasId));
    session.on('Canvas.canvasMemoryChanged', ({ canvasId, memoryCost }) => { const canvas = profile.canvases.get(canvasId); if (canvas) canvas.memoryCost = memoryCost; });
    void (async () => {
      try { await session.send('Memory.enable'); await session.send('Memory.startTracking'); await session.send('Canvas.enable'); }
      catch (error) { profile.errors.push(String(error)); }
    })();
  };
  return { snapshot: () => ({ patched: profile.patched, errors: [...profile.errors], latest: profile.latest,
    canvasCount: profile.canvases.size, canvasBytes: [...profile.canvases.values()].reduce((sum, c) => sum + (c.memoryCost || 0), 0) }) };
}
