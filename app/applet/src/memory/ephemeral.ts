/**
 * Ephemeral memory storage with pressure-based decay.
 * Manages transient DNA mutations, temporary vectors, and memory pressure.
 */

export interface DNA {
  readonly hash: string;
  readonly payload: unknown;
  readonly entropy: number;
  readonly timestamp: number;
  readonly ancestry?: string;
}

const DECAY_INTERVAL_MS = 10000;
const BASE_LIFESPAN_MS = 3600000;
const ENTROPY_LIFESPAN_MULTIPLIER_MS = 7200000;
const HIGH_PRESSURE_THRESHOLD = 0.7;
const HIGH_PRESSURE_MULTIPLIER = 10;
const LOW_ENTROPY_THRESHOLD = 0.2;

export class EphemeralStorage {
  private readonly state: Map<string, DNA> = new Map<string, DNA>();
  private memoryPressure: number = 0;
  private decayTimer: ReturnType<typeof setInterval> | null = null;

  constructor() {
    if (typeof globalThis !== 'undefined' && typeof globalThis.setInterval === 'function') {
      this.decayTimer = globalThis.setInterval(() => this.applyDecay(), DECAY_INTERVAL_MS);
    }
  }

  public setMemoryPressure(pressure: number): void {
    if (typeof pressure !== 'number' || Number.isNaN(pressure)) {
      return;
    }
    this.memoryPressure = Math.max(0, Math.min(1, pressure));
    if (this.memoryPressure > HIGH_PRESSURE_THRESHOLD) {
      this.applyDecay();
    }
  }

  public getMemoryPressure(): number {
    return this.memoryPressure;
  }

  public persist(dna: DNA): void {
    if (!dna || typeof dna.hash !== 'string') {
      return;
    }
    this.state.set(dna.hash, dna);
  }

  private applyDecay(): void {
    const now = Date.now();
    const pressureMultiplier = this.memoryPressure > HIGH_PRESSURE_THRESHOLD 
      ? HIGH_PRESSURE_MULTIPLIER 
      : 1;

    for (const [hash, dna] of this.state.entries()) {
      const entropyBonus = dna.entropy * ENTROPY_LIFESPAN_MULTIPLIER_MS;
      const baseLifespan = BASE_LIFESPAN_MS + entropyBonus;
      const effectiveLifespan = baseLifespan / pressureMultiplier;

      const isLowEntropyNoise = dna.entropy < LOW_ENTROPY_THRESHOLD;
      const shouldPurgeImmediately = isLowEntropyNoise && this.memoryPressure > HIGH_PRESSURE_THRESHOLD;

      if (shouldPurgeImmediately || (now - dna.timestamp) > effectiveLifespan) {
        this.state.delete(hash);
      }
    }
  }

  public get(hash: string): DNA | undefined {
    if (typeof hash !== 'string') {
      return undefined;
    }
    return this.state.get(hash);
  }

  public getAll(): DNA[] {
    return Array.from(this.state.values());
  }

  public size(): number {
    return this.state.size;
  }

  public clear(): void {
    this.state.clear();
  }

  public dispose(): void {
    if (this.decayTimer !== null) {
      if (typeof globalThis !== 'undefined' && typeof globalThis.clearInterval === 'function') {
        globalThis.clearInterval(this.decayTimer);
      } else {
        clearInterval(this.decayTimer as unknown as NodeJS.Timeout);
      }
      this.decayTimer = null;
    }
    this.state.clear();
  }
}

export const ephemeralStorage: EphemeralStorage = new EphemeralStorage();