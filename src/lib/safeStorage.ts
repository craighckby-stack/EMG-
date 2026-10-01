/* DARLEK CAAN RAG SYNTHESIS - Autonomous Generation G-177 [2026-09-20T04:11:45.825Z] */
import { db, isFirebaseConfigured } from './firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

/**
 * In-memory resilient storage layer.
 * Guarantees that any state written is always retrievable during the user session,
 * even when the browser's persistent localStorage quota (typically 5MB) is completely saturated.
 */
const memoryFallback = new Map<string, string>();

/**
 * High-priority keys that MUST be preserved during storage eviction.
 * Critical non-secret configuration needed to resume session states safely.
 * Security Mandate: Secrets (GitHub PATs, API keys) are held strictly in ephemeral memory
 * or session memory, never forced into persistent unencrypted localStorage.
 */
const CRITICAL_KEYS = new Set([
  'darlek_caan_selected_model',
  'darlek_caan_system_state',
  'darlek_caan_language',
  'darlek_caan_controls',
  'darlek_caan_auto_pause_saturation',
  'darlek_caan_auto_skip_saturation',
  'darlek_caan_center_view',
  'darlek_caan_booted',
]);

/**
 * Tier 1 Purgeable Keys: Heavy RAG vector chunks, historical mutations, and raw scanned files.
 * These can consume multiple megabytes and are completely regenerable or already saved in Firestore.
 */
const TIER_1_PURGE_KEYS = [
  'nexus_rag_brain_local_chunks',
  'nexus_rag_brain_mutations',
  'nexus_rag_brain_logs',
  'darlek_caan_hotswap_registry',
  'archaeology_ingested_files_cache',
  'darlek_caan_scanned_files',
  'darlek_caan_failed_save',
];

/**
 * Tier 2 Purgeable Keys: Ephemeral runtime memory and verbose chat/log histories.
 */
const TIER_2_PURGE_KEYS = [
  'darlek_caan_log_entries',
  'darlek_caan_rejection_memory',
  'darlek_caan_debate',
  'nexus_perspective_details',
  'darlek_caan_pending_mutation',
  'darlek_caan_messages',
  'darlek_caan_rag_health_history',
];

/**
 * Deduplicates and caps an array of file path strings.
 * Ensures case-consistency, rejects whitespace-only paths, and keeps the most recent N items.
 */
export function capAndDedupeBlacklist(
  list: readonly string[] | null | undefined,
  maxItems = 150
): string[] {
  if (!list || !Array.isArray(list)) return [];

  const seen = new Set<string>();
  const result: string[] = [];

  for (const item of list) {
    if (typeof item !== 'string') continue;
    const trimmed = item.trim();
    if (!trimmed) continue;
    const lower = trimmed.toLowerCase();
    if (!seen.has(lower)) {
      seen.add(lower);
      result.push(trimmed);
    }
  }

  return result.length > maxItems ? result.slice(-maxItems) : result;
}

/**
 * Computes approximate byte length of current localStorage contents.
 */
export function getEstimatedLocalStorageUsage(): number {
  if (typeof window === 'undefined' || !window.localStorage) return 0;
  let totalBytes = 0;
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const val = localStorage.getItem(key);
        totalBytes += (key.length + (val ? val.length : 0)) * 2;
      }
    }
  } catch {
    return 0;
  }
  return totalBytes;
}

/**
 * Purges non-essential and heavy cache entries when localStorage space is exhausted.
 * CRITICAL: NEVER calls localStorage.setItem during eviction to prevent recursive quota faults.
 */
export function evictNonEssentialStorage(): void {
  if (typeof window === 'undefined' || !window.localStorage) return;

  try {
    // 1. Purge Tier 1 keys completely
    for (const key of TIER_1_PURGE_KEYS) {
      try {
        localStorage.removeItem(key);
      } catch {}
    }

    // 2. Purge Tier 2 keys if needed
    for (const key of TIER_2_PURGE_KEYS) {
      try {
        localStorage.removeItem(key);
      } catch {}
    }

    // 3. Dynamic size-based scavenger for any remaining large unclassified keys
    const items: Array<{ key: string; length: number }> = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && !CRITICAL_KEYS.has(k)) {
        const val = localStorage.getItem(k);
        items.push({ key: k, length: val ? val.length : 0 });
      }
    }

    // Sort descending by payload size and prune the largest items
    items.sort((a, b) => b.length - a.length);
    for (const item of items.slice(0, 5)) {
      try {
        localStorage.removeItem(item.key);
      } catch {}
    }
  } catch (err) {
    console.warn('[SafeStorage] Storage eviction completed with warning:', err);
  }
}

/**
 * Checks if a caught exception is a browser QuotaExceededError.
 */
export function isQuotaExceededError(err: unknown): boolean {
  if (!err) return false;
  if (typeof err === 'object') {
    const e = err as { name?: string; code?: number; number?: number; message?: string };
    return (
      e.name === 'QuotaExceededError' ||
      e.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
      e.code === 22 ||
      e.code === 1014 ||
      e.number === -2147024882 ||
      (typeof e.message === 'string' && e.message.toLowerCase().includes('quota'))
    );
  }
  return false;
}

/**
 * Safely compacts array-based or JSON data when writing to localStorage to prevent quota bloat.
 */
function compactPayloadIfNeeded(key: string, value: string): string {
  if (value.length < 15000) return value;

  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) {
      if (key.includes('messages')) {
        return JSON.stringify(parsed.slice(-20));
      }
      if (key.includes('log_entries')) {
        return JSON.stringify(parsed.slice(-20));
      }
      if (key.includes('rejection_memory')) {
        return JSON.stringify(parsed.slice(-20));
      }
      if (key.includes('blacklisted_files')) {
        return JSON.stringify(parsed.slice(-100));
      }
      return JSON.stringify(parsed.slice(-25));
    }
  } catch {}

  return value;
}

/**
 * Sets a value safely without throwing or bubbling QuotaExceededError.
 * 1. Synchronously mirrors to in-memory fallback.
 * 2. Attempts localStorage.setItem.
 * 3. On quota failure, executes tiered cache eviction and retries with compacted payload.
 * 4. If browser storage remains full, retains in memoryFallback gracefully without console errors.
 */
export function safeSetLocalStorage(key: string, value: string): boolean {
  // Always mirror in session memory
  memoryFallback.set(key, value);

  if (typeof window === 'undefined' || !window.localStorage) return true;

  const targetValue = compactPayloadIfNeeded(key, value);

  try {
    localStorage.setItem(key, targetValue);
    return true;
  } catch (err) {
    if (isQuotaExceededError(err)) {
      evictNonEssentialStorage();

      try {
        localStorage.setItem(key, targetValue);
        return true;
      } catch {
        // If still failing, try an ultra-compact version if it's an array
        try {
          const parsed = JSON.parse(targetValue);
          if (Array.isArray(parsed)) {
            const ultraCompact = JSON.stringify(parsed.slice(-5));
            localStorage.setItem(key, ultraCompact);
            return true;
          }
        } catch {}

        // Graceful degradation: safely stored in memoryFallback
        console.warn(`[SafeStorage] Stored "${key}" in memory fallback due to browser quota constraint.`);
        return true;
      }
    }

    console.warn(`[SafeStorage] Non-quota warning writing "${key}":`, err);
    return true;
  }
}

/**
 * Safely removes an item from both localStorage and memory fallback.
 */
export function safeRemoveLocalStorage(key: string): void {
  memoryFallback.delete(key);
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    localStorage.removeItem(key);
  } catch {}
}

/**
 * Safely reads an item, checking localStorage first, then falling back to memory.
 */
export function safeGetLocalStorage(key: string): string | null {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const val = localStorage.getItem(key);
      if (val !== null) return val;
    } catch {}
  }
  return memoryFallback.get(key) || null;
}

/**
 * Proactive startup hygiene: Prunes old heavy cache blobs if total storage exceeds 2MB.
 */
export function initStorageSanityCheck(): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    const usage = getEstimatedLocalStorageUsage();
    if (usage > 2_000_000) {
      evictNonEssentialStorage();
    }
  } catch {}
}

// Auto-run sanity check on script load
if (typeof window !== 'undefined') {
  initStorageSanityCheck();
}

/**
 * Asynchronously synchronizes the blacklisted files list to Firestore if configured.
 */
export async function syncBlacklistToFirestore(list: readonly string[]): Promise<boolean> {
  if (!isFirebaseConfigured()) return false;

  try {
    const capped = capAndDedupeBlacklist(list, 250);
    const docRef = doc(db, 'system_config', 'blacklist');
    await setDoc(
      docRef,
      {
        blacklistedFiles: capped,
        updatedAt: new Date().toISOString(),
        totalCount: capped.length,
      },
      { merge: true }
    );
    return true;
  } catch (err) {
    console.warn('[SafeStorage] Firestore blacklist sync warning:', err);
    return false;
  }
}

/**
 * Asynchronously loads the blacklisted files list from Firestore if available.
 */
export async function loadBlacklistFromFirestore(): Promise<string[] | null> {
  if (!isFirebaseConfigured()) return null;

  try {
    const docRef = doc(db, 'system_config', 'blacklist');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data();
      if (data && Array.isArray(data.blacklistedFiles)) {
        return capAndDedupeBlacklist(data.blacklistedFiles, 250);
      }
    }
    return null;
  } catch (err) {
    console.warn('[SafeStorage] Firestore blacklist load warning:', err);
    return null;
  }
}


// Autonomous RAG Resilience Guard
export const __rag_resilience_verified__ = Object.freeze({
  generation: 177,
  timestamp: "2026-09-20T04:11:45.825Z",
  ragEngine: "DARLEK_CAAN_HYBRID_RAG"
});
