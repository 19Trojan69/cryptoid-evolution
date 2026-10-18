// Mounted consumers pin resources, including while creation is pending. Only
// unused entries can be evicted; an on-screen blob URL is never revoked.
export class ResourceCache<T> {
  private entries = new Map<string, { value: T; bytes: number }>();
  private pins = new Map<string, number>();
  private maxEntries: number;
  private maxBytes: number;
  private dispose: (value: T) => void;
  constructor(maxEntries: number, maxBytes: number, dispose: (value: T) => void = () => {}) {
    this.maxEntries = maxEntries; this.maxBytes = maxBytes; this.dispose = dispose;
  }
  get(key: string) {
    const entry = this.entries.get(key);
    if (!entry) return undefined;
    this.entries.delete(key); this.entries.set(key, entry);
    return entry.value;
  }
  set(key: string, value: T, bytes = 0) {
    const previous = this.entries.get(key);
    if (previous && previous.value !== value) this.dispose(previous.value);
    this.entries.delete(key); this.entries.set(key, { value, bytes }); this.trim();
  }
  retain(key: string) {
    this.pins.set(key, (this.pins.get(key) ?? 0) + 1);
    let released = false;
    return () => {
      if (released) return;
      released = true;
      const count = (this.pins.get(key) ?? 1) - 1;
      if (count) this.pins.set(key, count); else this.pins.delete(key);
      this.trim();
    };
  }
  delete(key: string) {
    if (this.pins.has(key)) return;
    const entry = this.entries.get(key);
    if (entry) { this.entries.delete(key); this.dispose(entry.value); }
  }
  trim() {
    let bytes = this.bytes;
    for (const [key, entry] of this.entries) {
      if (this.entries.size <= this.maxEntries && bytes <= this.maxBytes) break;
      if (this.pins.has(key)) continue;
      this.entries.delete(key); bytes -= entry.bytes; this.dispose(entry.value);
    }
  }
  retained(key: string) { return this.pins.has(key); }
  get size() { return this.entries.size; }
  get bytes() { let bytes = 0; for (const entry of this.entries.values()) bytes += entry.bytes; return bytes; }
  // Read-only counters for owner diagnostics. They do not expose cache keys or values.
  get retainedEntries() { return this.pins.size; }
  get retainCount() { let total = 0; for (const count of this.pins.values()) total += count; return total; }
}
