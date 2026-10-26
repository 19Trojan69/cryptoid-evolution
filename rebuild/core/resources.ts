export type OwnedResource<T> = { value: T; bytes: number; dispose: () => void };
export type ResourceLease<T> = { value: T; release: () => void };
type Entry<T> = {
  key: string; bytes: number; reservation: number; refs: number; state: 'queued' | 'loading' | 'ready' | 'failed-disposal';
  controller: AbortController; produce: (signal: AbortSignal) => Promise<OwnedResource<T>>;
  promise: Promise<OwnedResource<T>>; resolve: (resource: OwnedResource<T>) => void; reject: (error: Error) => void;
  resource?: OwnedResource<T>;
};
export class ResourceCancelled extends Error { constructor() { super('Resource scope closed'); } }
export class ResourceBudgetExceeded extends Error { constructor() { super('Resource admission budget exceeded'); } }

/** Explicit per-app pool. Closing a scope never frees a still-running decode's
 * reservation: repeated scene changes cannot start unlimited late allocations. */
export class ResourcePool<T> {
  private readonly maxBytes: number;
  private readonly maxEntries: number;
  private readonly parallel: number;
  private entries = new Map<string, Entry<T>>();
  private queued: Entry<T>[] = [];
  private scopes = new Set<{ close: () => void }>();
  private active = 0;
  private closed = false;
  private disposalFailures = 0;

  constructor(limits: { maxBytes: number; maxEntries: number; parallel: number }) {
    if (![limits.maxBytes, limits.maxEntries, limits.parallel].every(n => Number.isSafeInteger(n) && n > 0)) throw new RangeError('Invalid resource limits');
    this.maxBytes = limits.maxBytes; this.maxEntries = limits.maxEntries; this.parallel = limits.parallel;
  }
  stats() {
    return { entries: this.entries.size, bytes: [...this.entries.values()].reduce((sum,e)=>sum+e.bytes,0),
      active: this.active, queued: this.queued.length, scopes: this.scopes.size, disposalFailures: this.disposalFailures, closed: this.closed };
  }
  createScope() {
    if (this.closed) throw new ResourceCancelled();
    let closed = false;
    const releases = new Set<() => void>();
    const scope = {
      acquire: async (key: string, bytes: number, produce: Entry<T>['produce']): Promise<ResourceLease<T>> => {
        if (closed || this.closed) throw new ResourceCancelled();
        if (!key || !Number.isSafeInteger(bytes) || bytes < 1) throw new TypeError('Invalid resource request');
        let entry = this.entries.get(key);
        if (entry?.controller.signal.aborted || entry?.state === 'failed-disposal') throw new ResourceCancelled();
        if (entry && entry.reservation !== bytes) throw new TypeError('Resource key reused with a different reservation');
        if (!entry) {
          if (this.entries.size >= this.maxEntries || this.stats().bytes + bytes > this.maxBytes) throw new ResourceBudgetExceeded();
          let resolve!: Entry<T>['resolve'], reject!: Entry<T>['reject'];
          const promise = new Promise<OwnedResource<T>>((yes,no)=>{resolve=yes;reject=no;});
          entry = {key,bytes,reservation:bytes,refs:0,state:'queued',controller:new AbortController(),produce,promise,resolve,reject};
          this.entries.set(key,entry); this.queued.push(entry);
        }
        entry.refs++;
        const owned = entry;
        let released = false;
        const release = () => {
          if (released) return; released = true; releases.delete(release); owned.refs--;
          if (owned.refs) return;
          if (owned.state === 'queued') {
            this.queued = this.queued.filter(e=>e!==owned); this.entries.delete(owned.key); owned.controller.abort(); owned.reject(new ResourceCancelled());
          } else if (owned.state === 'loading') owned.controller.abort();
          else this.retire(owned);
        };
        releases.add(release); this.pump();
        try {
          const resource = await owned.promise;
          if (closed || this.closed || released) { release(); throw new ResourceCancelled(); }
          return { value: resource.value, release };
        } catch (error) { release(); throw error; }
      },
      close: () => {
        if (closed) return; closed = true;
        for (const release of [...releases]) release();
        this.scopes.delete(scope);
      },
    };
    this.scopes.add(scope); return scope;
  }
  close() {
    if (this.closed) return; this.closed = true;
    for (const scope of [...this.scopes]) scope.close();
  }
  private retire(entry: Entry<T>) {
    if (this.entries.get(entry.key) !== entry || entry.state === 'failed-disposal') return;
    if (entry.resource) {
      try { entry.resource.dispose(); entry.resource = undefined; }
      catch { entry.state = 'failed-disposal'; this.disposalFailures++; return; }
    }
    this.entries.delete(entry.key);
  }
  private pump() {
    while (!this.closed && this.active < this.parallel && this.queued.length) {
      const entry = this.queued.shift()!; entry.state = 'loading'; this.active++;
      void this.load(entry);
    }
  }
  private async load(entry: Entry<T>) {
    // Yield before invoking user code so a scope closed in the same turn cannot
    // start an unnecessary decode. All producer failures settle the same promise.
    await Promise.resolve();
    try {
      if (entry.controller.signal.aborted) throw new ResourceCancelled();
      const resource = await entry.produce(entry.controller.signal);
      if (!resource || typeof resource.dispose !== 'function') {
        // Ownership is unknown. Quarantine its reservation instead of claiming
        // memory was freed; no repeated retry of an unsafe disposer.
        entry.state = 'failed-disposal'; this.disposalFailures++;
        entry.reject(new TypeError('Producer did not return an owned resource')); return;
      }
      entry.resource = resource;
      if (Number.isSafeInteger(resource.bytes) && resource.bytes > 0) entry.bytes = resource.bytes;
      if (!Number.isSafeInteger(resource.bytes) || resource.bytes < 1 || resource.bytes > entry.reservation) {
        this.retire(entry); entry.reject(new ResourceBudgetExceeded()); return;
      }
      if (entry.controller.signal.aborted || !entry.refs || this.closed) {
        this.retire(entry); entry.reject(new ResourceCancelled()); return;
      }
      entry.state = 'ready'; entry.resolve(resource);
    } catch (error) {
      // A throwing result getter is treated like a failed producer. Once a
      // resource exists, dispose it before releasing its charged reservation.
      if (entry.resource) this.retire(entry);
      else if (entry.state !== 'failed-disposal') this.entries.delete(entry.key);
      entry.reject(error instanceof Error ? error : new Error('Resource loading failed'));
    } finally { this.active--; this.pump(); }
  }
}
