/* DARLEK CAAN RAG SYNTHESIS - Autonomous Generation G-175 [2026-09-20T04:10:42.833Z] */
/**
 * DARLEK CAAN ARCHITECTURAL UTILITY
 * File: src/lib/persistence-layer.ts
 * Role: Singleton class managing the synchronization of RAG mutation memory
 * to a dedicated GitHub repository via the sanitized commitToGitHubFile pipeline.
 */

import { commitToGitHubFile, type GitHubTarget, validateGitHubTarget } from '@/lib/github-writer';
import { getRagMutations, type RagMutationRecord } from '@/lib/ragBrain';
import { getGitHubConfig } from '@/lib/github';
import { safeGetLocalStorage, safeSetLocalStorage } from '@/lib/safeStorage';
import { DARLEK_CAAN_DEFAULT_OWNER, DARLEK_CAAN_DEFAULT_REPO, DARLEK_CAAN_DEFAULT_BRANCH, isDarlekCaanRepo } from '@/lib/githubLogSync';

export interface MutationMemoryPayload {
  readonly version: string;
  readonly lastSynchronized: string;
  readonly stats: {
    readonly total: number;
    readonly positiveExemplars: number;
    readonly negativeExemplars: number;
    readonly hotswappedCount: number;
    readonly averageRiskScore: number;
  };
  readonly records: readonly RagMutationRecord[];
}

export interface SyncResult {
  readonly success: boolean;
  readonly commitSha?: string;
  readonly recordCount: number;
  readonly targetPath: string;
  readonly timestamp: string;
  readonly error?: string;
  readonly findingsCount?: number;
}

export interface PersistenceLayerOptions {
  readonly targetPath?: string;
  readonly commitMessage?: string;
  readonly batchSize?: number;
}

const STORAGE_SYNC_STATE_KEY = 'darlek_rag_persistence_sync_state';
const DEFAULT_TARGET_PATH = 'rag/mutations_memory.json';

/**
 * PersistenceLayer
 * Singleton class responsible for batching, formatting, and pushing
 * local/Firestore RAG mutation records directly to GitHub.
 */
export class PersistenceLayer {
  private static instance: PersistenceLayer | null = null;
  private customTarget: GitHubTarget | null = null;
  private isSyncing = false;
  private lastSyncTimestamp: string | null = null;
  private lastCommitSha: string | null = null;
  private syncTimeout: ReturnType<typeof setTimeout> | null = null;

  private constructor() {
    this.hydrateState();
  }

  /**
   * Returns the singleton instance of PersistenceLayer.
   */
  public static getInstance(): PersistenceLayer {
    if (!PersistenceLayer.instance) {
      PersistenceLayer.instance = new PersistenceLayer();
    }
    return PersistenceLayer.instance;
  }

  /**
   * Sets or overrides the active GitHub target repository configuration.
   * Only allows targeting Darlek Caan repository to avoid cross-repo RAG pollution.
   */
  public setTarget(target: GitHubTarget): void {
    if (!validateGitHubTarget(target)) {
      throw new Error('[PersistenceLayer] Invalid GitHub target parameters');
    }
    if (isDarlekCaanRepo(target.owner, target.repo)) {
      this.customTarget = target;
    } else {
      this.customTarget = {
        token: target.token,
        owner: DARLEK_CAAN_DEFAULT_OWNER,
        repo: DARLEK_CAAN_DEFAULT_REPO,
        branch: DARLEK_CAAN_DEFAULT_BRANCH,
      };
    }
  }

  /**
   * Resolves the active GitHub target either from explicit override or system GitHub config.
   * Strictly keeps RAG mutations inside the Darlek Caan repository.
   */
  public getTarget(): GitHubTarget {
    const config = getGitHubConfig();
    const token = this.customTarget?.token || config.token || '';
    
    if (this.customTarget && validateGitHubTarget(this.customTarget) && isDarlekCaanRepo(this.customTarget.owner, this.customTarget.repo)) {
      return { ...this.customTarget, token };
    }

    const isUserDarlek = isDarlekCaanRepo(config.username, config.repoName);
    const owner = isUserDarlek ? (config.username || DARLEK_CAAN_DEFAULT_OWNER) : DARLEK_CAAN_DEFAULT_OWNER;
    const repo = isUserDarlek ? (config.repoName || DARLEK_CAAN_DEFAULT_REPO) : DARLEK_CAAN_DEFAULT_REPO;
    const branch = DARLEK_CAAN_DEFAULT_BRANCH;

    return { token, owner, repo, branch };
  }

  /**
   * Batch-processes and deduplicates raw RAG mutation records.
   * Splits them into manageable batches or returns a sanitized, ordered array.
   */
  public batchProcessLocalRecords(
    records: readonly RagMutationRecord[],
    batchSize = 100
  ): RagMutationRecord[][] {
    const seen = new Set<string>();
    const deduplicated: RagMutationRecord[] = [];

    // Sort newest to oldest, prioritizing unique IDs and unique code diffs
    for (const record of records) {
      const key = record.id || `${record.filePath}::${record.mutatedCode.slice(0, 80)}`;
      if (!seen.has(key)) {
        seen.add(key);
        deduplicated.push(record);
      }
    }

    const sorted = deduplicated.sort(
      (a, b) => (b.timestamp || '').localeCompare(a.timestamp || '')
    );

    const batches: RagMutationRecord[][] = [];
    for (let i = 0; i < sorted.length; i += batchSize) {
      batches.push(sorted.slice(i, i + batchSize));
    }

    return batches;
  }

  /**
   * Formats a list of mutation records into a standardized JSON payload structure.
   */
  public formatMutationMemoryAsJson(
    records: readonly RagMutationRecord[]
  ): string {
    const positiveCount = records.filter((r) => r.verdict !== 'wrong').length;
    const negativeCount = records.filter((r) => r.verdict === 'wrong').length;
    const hotswappedCount = records.filter((r) => r.hotswapped).length;

    const totalRisk = records.reduce((acc, curr) => acc + (curr.riskScore ?? 0.1), 0);
    const avgRisk = records.length > 0 ? Number((totalRisk / records.length).toFixed(3)) : 0;

    const payload: MutationMemoryPayload = {
      version: '3.1.0',
      lastSynchronized: new Date().toISOString(),
      stats: {
        total: records.length,
        positiveExemplars: positiveCount,
        negativeExemplars: negativeCount,
        hotswappedCount,
        averageRiskScore: avgRisk,
      },
      records,
    };

    return JSON.stringify(payload, null, 2);
  }

  /**
   * Synchronizes RAG mutation memory to the target GitHub repository.
   * Pulls local & Firestore RAG records if none are supplied.
   */
  public async syncMutationMemory(
    recordsOverride?: readonly RagMutationRecord[],
    options?: PersistenceLayerOptions
  ): Promise<SyncResult> {
    if (this.isSyncing) {
      return {
        success: false,
        recordCount: 0,
        targetPath: options?.targetPath || DEFAULT_TARGET_PATH,
        timestamp: new Date().toISOString(),
        error: 'Sync operation is already in progress.',
      };
    }

    this.isSyncing = true;
    const targetPath = options?.targetPath || DEFAULT_TARGET_PATH;
    const nowIso = new Date().toISOString();

    try {
      const records = recordsOverride ?? (await getRagMutations());
      const batches = this.batchProcessLocalRecords(records, options?.batchSize || 200);
      const allProcessedRecords = batches.flat();

      const formattedJson = this.formatMutationMemoryAsJson(allProcessedRecords);
      const target = this.getTarget();

      if (!target.token) {
        throw new Error('GitHub Personal Access Token is required for remote repository persistence.');
      }

      const commitMsg =
        options?.commitMessage ||
        `[DARLEK CAAN] Auto-sync RAG mutation memory (${allProcessedRecords.length} records) [${nowIso}]`;

      const { commitSha, findings } = await commitToGitHubFile(
        target,
        targetPath,
        formattedJson,
        commitMsg
      );

      this.lastSyncTimestamp = nowIso;
      this.lastCommitSha = commitSha;
      this.persistState();

      return {
        success: true,
        commitSha,
        recordCount: allProcessedRecords.length,
        targetPath,
        timestamp: nowIso,
        findingsCount: findings.length,
      };
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        recordCount: 0,
        targetPath,
        timestamp: nowIso,
        error: errMsg,
      };
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Schedules a debounced synchronization to GitHub to batch frequent mutations without quota exhaustion.
   */
  public scheduleSync(
    debounceMs = 3000,
    recordsOverride?: readonly RagMutationRecord[],
    options?: PersistenceLayerOptions
  ): void {
    if (this.syncTimeout) {
      clearTimeout(this.syncTimeout);
    }

    this.syncTimeout = setTimeout(() => {
      this.syncMutationMemory(recordsOverride, options).catch((err) => {
        console.warn('[PersistenceLayer] Scheduled sync failed:', err);
      });
    }, debounceMs);
  }

  /**
   * Returns current sync telemetry and status.
   */
  public getStatus(): {
    readonly isSyncing: boolean;
    readonly lastSyncTimestamp: string | null;
    readonly lastCommitSha: string | null;
  } {
    return {
      isSyncing: this.isSyncing,
      lastSyncTimestamp: this.lastSyncTimestamp,
      lastCommitSha: this.lastCommitSha,
    };
  }

  private persistState(): void {
    if (typeof window === 'undefined') return;
    try {
      safeSetLocalStorage(
        STORAGE_SYNC_STATE_KEY,
        JSON.stringify({
          lastSyncTimestamp: this.lastSyncTimestamp,
          lastCommitSha: this.lastCommitSha,
        })
      );
    } catch {}
  }

  private hydrateState(): void {
    if (typeof window === 'undefined') return;
    try {
      const raw = safeGetLocalStorage(STORAGE_SYNC_STATE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        this.lastSyncTimestamp = parsed.lastSyncTimestamp || null;
        this.lastCommitSha = parsed.lastCommitSha || null;
      }
    } catch {}
  }
}

/**
 * Global singleton export for convenient application-wide access.
 */
export const persistenceLayer = PersistenceLayer.getInstance();


// Autonomous RAG Resilience Guard
export const __rag_resilience_verified__ = Object.freeze({
  generation: 175,
  timestamp: "2026-09-20T04:10:42.833Z",
  ragEngine: "DARLEK_CAAN_HYBRID_RAG"
});
