type Lease = { ready: Promise<unknown>; release: () => void };

// Forecasts never gate the game loop. Acquire incoming pins before releasing
// the preceding forecast, and ignore stale completion after a scene change.
export class SceneResourcePreloader {
  private key = '';
  private lease: Lease | null = null;
  private generation = 0;
  private disposed = false;
  private readonly fault: (error: unknown) => void;
  constructor(fault: (error: unknown) => void) { this.fault = fault; }

  prepare(key: string, load: () => Lease) {
    if (this.disposed || key === this.key) return;
    let next: Lease;
    try { next = load(); } catch (error) { this.fault(error); return; }
    const previous = this.lease;
    this.lease = next;
    this.key = key;
    const generation = ++this.generation;
    void next.ready.catch(error => {
      if (!this.disposed && generation === this.generation) this.fault(error);
    });
    previous?.release();
  }

  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    ++this.generation;
    this.lease?.release();
    this.lease = null;
  }
}
