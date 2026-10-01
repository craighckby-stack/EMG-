/**
 * DARLEK CANN ARCHITECTURAL SERVICE
 * File: src/lib/evolutionLock.ts
 * Role: Global Mutex / Execution Lock for Autonomous Evolution, Debate, and Hotswap engines.
 *       Coordinates between the MS-DOS autonomous background hotswap loop, manual operator
 *       actions, and server-side propose/debate API routes to prevent concurrent LLM and RAG collisions.
 */

export interface LockStatus {
  readonly isProcessing: boolean;
  readonly owner: string | null;
  readonly acquiredAt: number | null;
  readonly expiresAt: number | null;
  readonly remainingMs: number;
}

class EvolutionLockManager {
  private isProcessing = false;
  private owner: string | null = null;
  private acquiredAt: number | null = null;
  private expiresAt: number | null = null;
  private defaultTtlMs = 60_000; // 60s default timeout to prevent deadlocks
  private listeners = new Set<(status: LockStatus) => void>();

  /**
   * Checks whether the lock is currently held and has not expired.
   */
  public isLocked(): boolean {
    if (!this.isProcessing) return false;
    const now = Date.now();
    if (this.expiresAt && now > this.expiresAt) {
      this.forceRelease('TIMEOUT_EXPIRED');
      return false;
    }
    return true;
  }

  public getOwner(): string | null {
    if (!this.isLocked()) return null;
    return this.owner;
  }

  public getStatus(): LockStatus {
    const locked = this.isLocked();
    const now = Date.now();
    return {
      isProcessing: locked,
      owner: locked ? this.owner : null,
      acquiredAt: locked ? this.acquiredAt : null,
      expiresAt: locked ? this.expiresAt : null,
      remainingMs: locked && this.expiresAt ? Math.max(0, this.expiresAt - now) : 0,
    };
  }

  /**
   * Synchronous in-memory lock acquisition.
   * Returns true if lock was successfully acquired.
   */
  public acquire(owner: string, ttlMs = this.defaultTtlMs): boolean {
    const now = Date.now();
    if (this.isLocked()) {
      if (this.owner === owner) {
        // Re-entrant lock by same owner: extend lease
        this.expiresAt = now + ttlMs;
        this.notify();
        return true;
      }
      return false;
    }

    this.isProcessing = true;
    this.owner = owner;
    this.acquiredAt = now;
    this.expiresAt = now + ttlMs;
    this.notify();
    return true;
  }

  /**
   * Synchronous in-memory lock release.
   */
  public release(owner: string): boolean {
    if (!this.isProcessing) return true;
    if (this.owner && this.owner !== owner && owner !== 'FORCE_RELEASE') {
      console.warn(`[EvolutionLock] Attempted release by "${owner}" but lock is owned by "${this.owner}"`);
      return false;
    }
    this.forceRelease();
    return true;
  }

  public forceRelease(reason?: string) {
    if (reason) {
      console.log(`[EvolutionLock] Lock released: ${reason} (previous owner: ${this.owner})`);
    }
    this.isProcessing = false;
    this.owner = null;
    this.acquiredAt = null;
    this.expiresAt = null;
    this.notify();
  }

  /**
   * Asynchronously waits for lock to clear within the given timeout.
   */
  public async waitForFree(timeoutMs = 10_000, pollIntervalMs = 250): Promise<boolean> {
    const start = Date.now();
    while (this.isLocked()) {
      if (Date.now() - start > timeoutMs) return false;
      await new Promise((res) => setTimeout(res, pollIntervalMs));
    }
    return true;
  }

  /**
   * Full-stack acquisition helper:
   * Acquires local in-memory lock, and if running in the browser, also synchronizes with the server
   * lock endpoint (/api/evolution/lock) so that server routes and other clients are coordinated.
   */
  public async acquireAsync(owner: string, ttlMs = this.defaultTtlMs): Promise<boolean> {
    // 1. Check & acquire local memory lock
    if (!this.acquire(owner, ttlMs)) {
      return false;
    }

    // 2. If in browser environment, synchronize with backend server lock
    if (typeof window !== 'undefined' && typeof fetch === 'function') {
      try {
        const res = await fetch('/api/evolution/lock', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'acquire', owner, ttlMs }),
        });
        if (res.ok) {
          const data = await res.json();
          if (!data.success) {
            // Server was already locked by another process
            this.release(owner);
            return false;
          }
        }
      } catch (err) {
        // Local acquisition still holds even if network lock call fails
        console.warn('[EvolutionLock] Failed to sync lock acquisition to server:', err);
      }
    }

    return true;
  }

  /**
   * Full-stack release helper:
   * Releases local in-memory lock and notifies the server.
   */
  public async releaseAsync(owner: string): Promise<boolean> {
    this.release(owner);

    if (typeof window !== 'undefined' && typeof fetch === 'function') {
      try {
        await fetch('/api/evolution/lock', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'release', owner }),
        });
      } catch (err) {
        console.warn('[EvolutionLock] Failed to sync lock release to server:', err);
      }
    }

    return true;
  }

  /**
   * Remote server check (for client use):
   * Queries the server to see if a server-side process holds the lock.
   */
  public async checkServerLock(): Promise<LockStatus> {
    if (typeof window !== 'undefined' && typeof fetch === 'function') {
      try {
        const res = await fetch('/api/evolution/lock');
        if (res.ok) {
          const data = await res.json();
          if (data && data.isProcessing) {
            // Mirror server lock into local state
            this.isProcessing = true;
            this.owner = data.owner;
            this.acquiredAt = data.acquiredAt;
            this.expiresAt = data.expiresAt;
            return data;
          }
        }
      } catch {
        // Fallback to local
      }
    }
    return this.getStatus();
  }

  public subscribe(listener: (status: LockStatus) => void): () => void {
    this.listeners.add(listener);
    listener(this.getStatus());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    const status = this.getStatus();
    this.listeners.forEach((l) => {
      try {
        l(status);
      } catch (err) {
        console.warn('[EvolutionLock] Listener notification error:', err);
      }
    });
  }
}

// Global Singleton
export const evolutionLock = new EvolutionLockManager();
