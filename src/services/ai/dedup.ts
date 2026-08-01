export interface DedupMapOptions {
  windowMs?: number;
}

interface Entry<T> {
  promise: Promise<T>;
  expiresAt: number;
}

export class DedupMap<T> {
  private readonly map = new Map<string, Entry<T>>();
  private readonly windowMs: number;

  constructor(opts: DedupMapOptions = {}) {
    this.windowMs = opts.windowMs ?? 5_000;
  }

  get(key: string): Promise<T> | undefined {
    const entry = this.map.get(key);
    if (!entry) return undefined;
    if (Date.now() >= entry.expiresAt) {
      this.map.delete(key);
      return undefined;
    }
    return entry.promise;
  }

  set(key: string, promise: Promise<T>): void {
    this.map.set(key, { promise, expiresAt: Date.now() + this.windowMs });
  }

  clear(): void {
    this.map.clear();
  }

  size(): number {
    return this.map.size;
  }
}
