/**
 * EMG Sovereign Kernel - RAG Memory Vector System
 * File: src/memory/emg_rag.ts
 *
 * Role: Parses STUDIO_ATTACHMENT_CORRECT.md, STUDIO_ATTACHMENT_WRONG.md, and STUDIO_ATTACHMENT_SYNTHESIS.md,
 *       chunks by commit hash, deduplicates, vectorizes with metadata, and exposes query(currentFile + error).
 */

import { safeGetLocalStorage, safeSetLocalStorage } from '../lib/safeStorage';

export interface VectorMetadata {
  readonly commitHash?: string;
  readonly fixCommitHash?: string;
  readonly provenance: 'clean' | 'failure' | 'synthesis' | 'contradicted';
  readonly trust: 'high' | 'medium' | 'low' | 'revoked';
  readonly file?: string;
  readonly errorClass?: string;
  readonly description?: string;
  readonly fingerprint?: string;
  readonly invalidationReason?: string;
}

export interface VectorEntry {
  readonly id: string;
  readonly metadata: VectorMetadata;
  readonly content: string;
  readonly codeSnippet?: string;
  readonly pairedFixSnippet?: string;
  readonly ruleToAvoid?: string;
  readonly diagnosis?: string;
  readonly vector: number[];
}

export interface EmgQueryResult {
  readonly topFailures: VectorEntry[];
  readonly topFixes: VectorEntry[];
  readonly topCleanPatterns: VectorEntry[];
  readonly topSynthesis: VectorEntry[];
  readonly totalMatches: number;
}

// In-memory vector database
let vectorStore: VectorEntry[] = [];
let isInitialized = false;

/**
 * Simple TF-IDF / Token Frequency vectorizer for offline and embedding similarity.
 */
function textToVector(text: string): number[] {
  const tokens = text.toLowerCase().replace(/[^a-z0-9]/g, ' ').split(/\s+/).filter(Boolean);
  const freqMap: Record<string, number> = {};
  for (const t of tokens) {
    freqMap[t] = (freqMap[t] || 0) + 1;
  }
  // Standardized 64-dim projection hash
  const dims = new Array(64).fill(0);
  Object.entries(freqMap).forEach(([word, count]) => {
    let hash = 0;
    for (let i = 0; i < word.length; i++) {
      hash = (hash << 5) - hash + word.charCodeAt(i);
      hash |= 0;
    }
    const idx = Math.abs(hash) % 64;
    dims[idx] += count;
  });
  // Normalize
  const norm = Math.sqrt(dims.reduce((sum, val) => sum + val * val, 0)) || 1;
  return dims.map((val) => val / norm);
}

/**
 * Cosine similarity between two vectors.
 */
function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) return 0;
  let dot = 0;
  for (let i = 0; i < vecA.length; i++) {
    dot += (vecA[i] || 0) * (vecB[i] || 0);
  }
  return dot;
}

/**
 * Parses STUDIO_ATTACHMENT_CORRECT.md text content into clean vectors.
 */
export function parseCorrectMd(content: string): VectorEntry[] {
  const entries: VectorEntry[] = [];
  const blocks = content.split(/##\s+COMMIT:\s+/).filter(Boolean);

  for (const block of blocks) {
    const lines = block.split('\n');
    const commitHash = lines[0]?.trim() || 'c_' + Math.random().toString(36).substring(2, 8);
    const fileMatch = block.match(/- File:\s*(.+)/);
    const file = fileMatch ? fileMatch[1]?.trim() : '';
    const diffMatch = block.match(/```(?:typescript|tsx|javascript)?\n([\s\S]*?)```/s) || block.match(/```([\s\S]*?)```/s);
    const snippet = diffMatch ? diffMatch[1]?.trim() : '';

    entries.push({
      id: `correct_${commitHash}`,
      metadata: {
        commitHash,
        provenance: 'clean',
        trust: 'high',
        file,
      },
      content: block,
      codeSnippet: snippet,
      vector: textToVector(`${commitHash} ${file} ${block} ${snippet}`),
    });
  }

  return entries;
}

/**
 * Parses STUDIO_ATTACHMENT_WRONG.md text content into failure & fix vectors.
 */
export function parseWrongMd(content: string): VectorEntry[] {
  const entries: VectorEntry[] = [];
  const blocks = content.split(/##\s+FAILURE:\s+/).filter(Boolean);

  for (const block of blocks) {
    const lines = block.split('\n');
    const header = lines[0] || '';
    const commitMatch = header.match(/([a-zA-Z0-9]+)\s*\|\s*FIX:\s*([a-zA-Z0-9]+)/);
    const commitHash = commitMatch ? commitMatch[1] : 'f_' + Math.random().toString(36).substring(2, 8);
    const fixCommitHash = commitMatch ? commitMatch[2] : 'fix_' + Math.random().toString(36).substring(2, 8);

    const errorClassMatch = block.match(/- Error Class:\s*(.+)/);
    const errorClass = errorClassMatch ? errorClassMatch[1]?.trim() : 'GENERAL';

    const fileMatch = block.match(/- File:\s*(.+)/);
    const file = fileMatch ? fileMatch[1]?.trim() : '';

    const ruleMatch = block.match(/- Rule to Avoid:\s*(.+)/);
    const ruleToAvoid = ruleMatch ? ruleMatch[1]?.trim() : '';

    const snippets = [...block.matchAll(/```(?:typescript|tsx|javascript)?\n([\s\S]*?)```/g)];
    const failureSnippet = snippets[0]?.[1]?.trim() || '';
    const fixSnippet = snippets[1]?.[1]?.trim() || '';

    entries.push({
      id: `wrong_${commitHash}`,
      metadata: {
        commitHash,
        fixCommitHash,
        provenance: 'failure',
        trust: 'high',
        errorClass,
        file,
      },
      content: block,
      codeSnippet: failureSnippet,
      pairedFixSnippet: fixSnippet,
      ruleToAvoid,
      vector: textToVector(`${commitHash} ${errorClass} ${file} ${ruleToAvoid} ${block} ${failureSnippet}`),
    });
  }

  return entries;
}

/**
 * Parses STUDIO_ATTACHMENT_SYNTHESIS.md text content into synthesis vectors.
 */
export function parseSynthesisMd(content: string): VectorEntry[] {
  const entries: VectorEntry[] = [];
  const blocks = content.split(/##\s+SECTION:\s+/).filter(Boolean);

  for (const block of blocks) {
    const lines = block.split('\n');
    const sectionName = lines[0]?.trim() || 'GENERAL';

    entries.push({
      id: `synthesis_${sectionName}`,
      metadata: {
        provenance: 'synthesis',
        trust: 'high',
        description: sectionName,
      },
      content: block,
      vector: textToVector(`${sectionName} ${block}`),
    });
  }

  return entries;
}

/**
 * IndexedDB high-capacity persistence layer for EMG RAG vectors (supports 1GB+ storage).
 */
const IDB_NAME = 'EMG_SOVEREIGN_RAG_DB';
const IDB_STORE = 'vectors_store';

function openIndexedDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported in current runtime environment'));
      return;
    }
    const request = window.indexedDB.open(IDB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function saveVectorsToIndexedDB(vectors: VectorEntry[]): Promise<void> {
  try {
    const db = await openIndexedDB();
    const tx = db.transaction(IDB_STORE, 'readwrite');
    const store = tx.objectStore(IDB_STORE);
    store.clear();
    for (const v of vectors) {
      store.put(v);
    }
    await new Promise((res, rej) => {
      tx.oncomplete = res;
      tx.onerror = rej;
    });
  } catch (err) {
    console.warn('[EMG RAG] IndexedDB save failed, falling back to local memory:', err);
    try {
      safeSetLocalStorage('emg_rag_vectors', JSON.stringify(vectors.slice(0, 100)));
    } catch {}
  }
}

async function loadVectorsFromIndexedDB(): Promise<VectorEntry[]> {
  try {
    const db = await openIndexedDB();
    const tx = db.transaction(IDB_STORE, 'readonly');
    const store = tx.objectStore(IDB_STORE);
    const request = store.getAll();
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result as VectorEntry[]);
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('[EMG RAG] IndexedDB load failed, trying fallback:', err);
    const cachedStr = safeGetLocalStorage('emg_rag_vectors');
    if (cachedStr) {
      try {
        return JSON.parse(cachedStr) as VectorEntry[];
      } catch {}
    }
    return [];
  }
}

let ragSyncQueue: Promise<any> = Promise.resolve();

/**
 * Serializes the clean entries in vector memory to markdown format matching STUDIO_ATTACHMENT_CORRECT.md
 */
export function formatCorrectMdFromVectors(vectors: VectorEntry[]): string {
  const cleanEntries = vectors.filter((v) => v.metadata.provenance === 'clean' && v.metadata.trust !== 'revoked');
  if (cleanEntries.length === 0) return '';

  let out = '# STUDIO_ATTACHMENT_CORRECT.md — EMG Clean Vector Knowledge Base\n\nVerified patterns surviving AST and sanitizer gates.\n\n';
  for (const entry of cleanEntries) {
    const hash = entry.metadata.commitHash || entry.id.replace('correct_', '');
    const file = entry.metadata.file || 'unknown';
    const code = entry.codeSnippet || '';
    out += `## COMMIT: ${hash}\n- File: ${file}\n- Sanitizer: PASSED\n\`\`\`typescript\n${code.trim()}\n\`\`\`\n\n`;
  }
  return out.trim() + '\n';
}

/**
 * Serializes the failure & fix entries in vector memory to markdown format matching STUDIO_ATTACHMENT_WRONG.md
 */
export function formatWrongMdFromVectors(vectors: VectorEntry[]): string {
  const wrongEntries = vectors.filter((v) => v.metadata.provenance === 'failure');
  if (wrongEntries.length === 0) return '';

  let out = '# STUDIO_ATTACHMENT_WRONG.md — EMG Failure & Recovery Ledger\n\nPaired failure and recovery commits categorized by error class and preventative rules.\n\n';
  for (const entry of wrongEntries) {
    const failHash = entry.metadata.commitHash || entry.id.replace('wrong_', '');
    const fixHash = entry.metadata.fixCommitHash || `fix_${failHash}`;
    const errClass = entry.metadata.errorClass || 'LINT_GATE';
    const file = entry.metadata.file || 'unknown';
    const rule = entry.ruleToAvoid || 'Satisfy syntax constraints';
    const diag = entry.diagnosis ? `\n- Diagnosis: ${entry.diagnosis}` : '';
    const failCode = entry.codeSnippet || '';
    const fixCode = entry.pairedFixSnippet || '';

    out += `## FAILURE: ${failHash} | FIX: ${fixHash}\n- Error Class: ${errClass}\n- File: ${file}\n- Rule to Avoid: ${rule}${diag}\n`;
    if (failCode) {
      out += `\n### Failure Diff\n\`\`\`typescript\n${failCode.trim()}\n\`\`\`\n`;
    }
    if (fixCode) {
      out += `\n### Paired Fix Diff\n\`\`\`typescript\n${fixCode.trim()}\n\`\`\`\n`;
    }
    out += '\n---\n\n';
  }
  return out.trim() + '\n';
}

export const DEFAULT_EMG_REPO = 'craighckby-stack/EMG';

export interface RagPublishTarget {
  token: string;
  owner?: string;
  repo?: string;
  emgRepo?: string;
  branch?: string;
}

/**
 * Publishes updated RAG vectors and ledgers directly back to the dedicated EMG repository.
 * Strictly prevents cross-repository contamination when enhancing external repositories.
 * Uses Fresh-SHA fetch with exponential backoff on HTTP 409 conflicts.
 */
export async function publishRagToGithub(target?: RagPublishTarget): Promise<{
  success: boolean;
  commitSha?: string;
  syncedFiles?: string[];
  targetRepo?: string;
  error?: string;
}> {
  const executeSync = async (): Promise<{
    success: boolean;
    commitSha?: string;
    syncedFiles?: string[];
    targetRepo?: string;
    error?: string;
  }> => {
    let cleanRepo = '';
    let token = '';
    let branch = 'main';

    if (target?.token) {
      token = target.token;
      branch = target.branch || 'main';

      if (target.emgRepo && target.emgRepo.trim()) {
        cleanRepo = target.emgRepo.includes('/') ? target.emgRepo.trim() : `${target.owner || 'craighckby-stack'}/${target.emgRepo.trim()}`;
      } else if (target.repo && (target.repo.toLowerCase().includes('emg') || target.repo.toLowerCase().includes('darlek'))) {
        cleanRepo = target.repo.includes('/') ? target.repo.trim() : `${target.owner || 'craighckby-stack'}/${target.repo.trim()}`;
      } else {
        // Default to dedicated Sovereign Kernel EMG repository
        cleanRepo = DEFAULT_EMG_REPO;
      }
    } else {
      const stored = getStoredGithubTarget();
      if (!stored) {
        return { success: false, error: 'No GitHub Personal Access Token configured' };
      }
      cleanRepo = stored.emgRepo || DEFAULT_EMG_REPO;
      token = stored.token;
      branch = stored.branch || 'main';
    }

    if (!token || !cleanRepo) {
      return { success: false, error: 'GitHub PAT Token and EMG repository are required to publish RAG.' };
    }

    try {
      const { fetchFileContent, commitFileUpdate } = await import('../utils/github');
      const syncedFiles: string[] = [];
      let latestCommitSha = '';

      // Helper to commit a file with fresh-SHA retry loop
      const commitWithRetry = async (filePath: string, content: string, commitMsg: string): Promise<string> => {
        let retries = 5;
        while (retries > 0) {
          let sha = '';
          try {
            const remoteFile = await fetchFileContent(cleanRepo, filePath, token, branch);
            sha = remoteFile.sha;
          } catch {
            // File does not exist yet; will create new
            sha = '';
          }

          try {
            const res = await commitFileUpdate(cleanRepo, filePath, content, sha, token, commitMsg, branch);
            return res.commitSha;
          } catch (commitErr: any) {
            const errStr = String(commitErr?.message || commitErr);
            if (errStr.includes('409') && retries > 1) {
              retries--;
              await new Promise((r) => setTimeout(r, 1200 + Math.random() * 1000));
              continue;
            }
            throw commitErr;
          }
        }
        throw new Error(`Exceeded max retries committing ${filePath}`);
      };

      // 1. Sync vectors.jsonl
      const jsonlContent = vectorStore.map((v) => JSON.stringify(v)).join('\n');
      latestCommitSha = await commitWithRetry(
        'SOVEREIGN-KERNEL/memory/vectors.jsonl',
        jsonlContent,
        `EMG [RAG]: Synchronized vector database (${vectorStore.length} entries)`
      );
      syncedFiles.push('SOVEREIGN-KERNEL/memory/vectors.jsonl');

      // 2. Sync human-readable clean patterns inside SOVEREIGN-KERNEL/ only
      const correctMd = formatCorrectMdFromVectors(vectorStore);
      if (correctMd) {
        await commitWithRetry(
          'SOVEREIGN-KERNEL/memory/clean_patterns.md',
          correctMd,
          `EMG [RAG]: Updated clean pattern vectors (${vectorStore.filter((v) => v.metadata.provenance === 'clean').length} entries)`
        );
        syncedFiles.push('SOVEREIGN-KERNEL/memory/clean_patterns.md');
      }

      // 3. Sync human-readable failure patterns inside SOVEREIGN-KERNEL/ only
      const wrongMd = formatWrongMdFromVectors(vectorStore);
      if (wrongMd) {
        await commitWithRetry(
          'SOVEREIGN-KERNEL/memory/failure_patterns.md',
          wrongMd,
          `EMG [RAG]: Updated failure & recovery vectors (${vectorStore.filter((v) => v.metadata.provenance === 'failure').length} entries)`
        );
        syncedFiles.push('SOVEREIGN-KERNEL/memory/failure_patterns.md');
      }

      console.log(`[EMG RAG] Successfully synchronized ${syncedFiles.length} RAG artifacts to ${cleanRepo} (${latestCommitSha.slice(0, 8)})`);
      return { success: true, commitSha: latestCommitSha, syncedFiles };
    } catch (err: unknown) {
      console.warn('[EMG RAG] Failed to publish RAG vectors to GitHub repository:', err);
      return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
  };

  const op = ragSyncQueue.then(() => executeSync()).catch(() => executeSync());
  ragSyncQueue = op;
  return op;
}

function getStoredGithubTarget(): {
  token: string;
  owner?: string;
  repo?: string;
  emgRepo?: string;
  branch?: string;
} | null {
  if (typeof window === 'undefined') return null;
  try {
    const emgRepo = localStorage.getItem('emg_rag_repo') || sessionStorage.getItem('emg_rag_repo') || DEFAULT_EMG_REPO;
    const saved = localStorage.getItem('darlek_cann_system_state');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed?.githubToken && parsed?.githubRepo) {
        const repoStr = parsed.githubRepo.trim().replace(/^https:\/\/github\.com\//, '').replace(/\/$/, '');
        const [owner, repo] = repoStr.split('/');
        return {
          token: parsed.githubToken,
          owner: owner || 'craighckby-stack',
          repo: repo || 'Python',
          emgRepo,
          branch: parsed.githubBranch || 'main',
        };
      }
    }
    const token = localStorage.getItem('emg_github_token') || sessionStorage.getItem('emg_github_token');
    const repo = localStorage.getItem('emg_target_repo') || sessionStorage.getItem('emg_target_repo');
    if (token) {
      const repoStr = (repo || 'Python').trim().replace(/^https:\/\/github\.com\//, '').replace(/\/$/, '');
      const [owner, repoName] = repoStr.split('/');
      return {
        token,
        owner: owner || 'craighckby-stack',
        repo: repoName || repoStr,
        emgRepo,
        branch: 'main',
      };
    }
  } catch {}
  return null;
}

/**
 * Initializes the EMG RAG vector store from IndexedDB high-capacity memory or attachments.
 */
export async function initializeEmgRag(
  correctContent?: string,
  wrongContent?: string,
  synthesisContent?: string
): Promise<VectorEntry[]> {
  const cachedVectors = await loadVectorsFromIndexedDB();
  if (cachedVectors && cachedVectors.length > 0) {
    vectorStore = cachedVectors;
    reconcileContradictoryMemories(vectorStore);
    isInitialized = true;
    return vectorStore;
  }

  const cleanEntries = correctContent ? parseCorrectMd(correctContent) : [];
  const wrongEntries = wrongContent ? parseWrongMd(wrongContent) : [];
  const synthesisEntries = synthesisContent ? parseSynthesisMd(synthesisContent) : [];

  // Deduplicate by commit hash / entry ID
  const dedupMap = new Map<string, VectorEntry>();
  [...cleanEntries, ...wrongEntries, ...synthesisEntries].forEach((entry) => {
    dedupMap.set(entry.id, entry);
  });

  vectorStore = Array.from(dedupMap.values());
  reconcileContradictoryMemories(vectorStore);
  await saveVectorsToIndexedDB(vectorStore);
  isInitialized = true;
  return vectorStore;
}

/**
 * Queries the EMG RAG store for top matching failures, fixes, clean patterns, and synthesis.
 * Format: query(currentFile + error) => { top 3 failures, top 2 fixes, top 2 clean patterns, top 1 synthesis }
 */
export function queryEmgRag(currentFileAndError: string): EmgQueryResult {
  if (!isInitialized || vectorStore.length === 0) {
    const cachedStr = safeGetLocalStorage('emg_rag_vectors');
    if (cachedStr) {
      try {
        const cached = JSON.parse(cachedStr) as VectorEntry[];
        if (cached && cached.length > 0) {
          vectorStore = cached;
          isInitialized = true;
        }
      } catch {}
    }
  }

  const queryVec = textToVector(currentFileAndError);

  const scored = vectorStore.map((entry) => ({
    entry,
    score: cosineSimilarity(queryVec, entry.vector),
  }));

  scored.sort((a, b) => b.score - a.score);

  const failures = scored.filter((s) => s.entry.metadata.provenance === 'failure');
  // Epistemic Guard: Never return contradicted or revoked memories as clean patterns
  const cleans = scored.filter((s) => s.entry.metadata.provenance === 'clean' && s.entry.metadata.trust !== 'revoked');
  const syntheses = scored.filter((s) => s.entry.metadata.provenance === 'synthesis');

  const topFailures = failures.slice(0, 3).map((s) => s.entry);
  const topFixes = failures.filter((s) => Boolean(s.entry.pairedFixSnippet)).slice(0, 2).map((s) => s.entry);

  // Cross-File Contradiction Check: If any top failure originates from a file,
  // suppress any clean patterns from that file so stale memories cannot contradict active failure evidence
  const failingFiles = new Set(topFailures.map((f) => (f.metadata.file || '').trim().toLowerCase()).filter(Boolean));
  const vettedCleans = cleans.filter((s) => {
    const file = (s.entry.metadata.file || '').trim().toLowerCase();
    return !failingFiles.has(file);
  });

  const topCleanPatterns = vettedCleans.slice(0, 2).map((s) => s.entry);
  const topSynthesis = syntheses.slice(0, 1).map((s) => s.entry);

  return {
    topFailures,
    topFixes,
    topCleanPatterns,
    topSynthesis,
    totalMatches: scored.length,
  };
}

let syncDebounceTimer: any = null;

function scheduleDebouncedRagSync(target?: RagPublishTarget): void {
  if (typeof window === 'undefined') return;
  if (syncDebounceTimer) {
    clearTimeout(syncDebounceTimer);
  }
  // Debounce RAG sync by 5 seconds so updates are rapidly and reliably synced
  syncDebounceTimer = setTimeout(() => {
    publishRagToGithub(target).catch(() => {});
  }, 5000);
}

/**
 * Appends a newly confirmed clean commit to the RAG memory store and ledger.
 */
export function appendCleanCommit(
  commitHash: string,
  filePath: string,
  diffSnippet: string,
  target?: RagPublishTarget
): void {
  const newEntry: VectorEntry = {
    id: `correct_${commitHash}`,
    metadata: {
      commitHash,
      provenance: 'clean',
      trust: 'high',
      file: filePath,
    },
    content: `## COMMIT: ${commitHash}\n- File: ${filePath}\n- Sanitizer: PASSED\n\`\`\`typescript\n${diffSnippet}\n\`\`\``,
    codeSnippet: diffSnippet,
    vector: textToVector(`${commitHash} ${filePath} ${diffSnippet}`),
  };

  vectorStore = vectorStore.filter((e) => e.id !== newEntry.id);
  vectorStore.push(newEntry);
  saveVectorsToIndexedDB(vectorStore).catch(() => {});
  scheduleDebouncedRagSync(target);
}

/**
 * Searches RAG vector memory for an existing cached diagnosis and corrective rule.
 * Bypasses redundant LLM API calls when an identical error fingerprint or high-similarity
 * failure pattern is already stored in vector memory.
 */
export function findCachedDiagnosisInRag(
  filePath: string,
  fingerprint: string
): { diagnosis: string; correctivePattern: string } | null {
  if (vectorStore.length === 0) {
    const cachedStr = safeGetLocalStorage('emg_rag_vectors');
    if (cachedStr) {
      try {
        const cached = JSON.parse(cachedStr) as VectorEntry[];
        if (cached && cached.length > 0) {
          vectorStore = cached;
          isInitialized = true;
        }
      } catch {}
    }
  }

  // 1. Exact Fingerprint Lookup
  const exactMatch = vectorStore.find(
    (v) =>
      v.metadata.provenance === 'failure' &&
      v.metadata.fingerprint === fingerprint &&
      v.ruleToAvoid &&
      v.diagnosis
  );

  if (exactMatch && exactMatch.diagnosis && exactMatch.ruleToAvoid) {
    return {
      diagnosis: exactMatch.diagnosis,
      correctivePattern: exactMatch.ruleToAvoid,
    };
  }

  // 2. Cosine Similarity Vector Lookup (threshold > 0.82)
  const queryVec = textToVector(`${filePath} ${fingerprint}`);
  let bestMatch: VectorEntry | null = null;
  let highestScore = 0;

  for (const entry of vectorStore) {
    if (entry.metadata.provenance === 'failure' && entry.ruleToAvoid && (entry.diagnosis || entry.metadata.description)) {
      const score = cosineSimilarity(queryVec, entry.vector);
      if (score > highestScore && score > 0.82) {
        highestScore = score;
        bestMatch = entry;
      }
    }
  }

  if (bestMatch && bestMatch.ruleToAvoid) {
    return {
      diagnosis: bestMatch.diagnosis || bestMatch.metadata.description || `Cached failure pattern for ${filePath}`,
      correctivePattern: bestMatch.ruleToAvoid,
    };
  }

  return null;
}

/**
 * Epistemic Reconciliation: Invalidates stale "clean" vectors for a file when contradictory
 * failure evidence is established, preventing bad mutations from being reinforced as good exemplars.
 */
export function invalidateCleanVectorsForFile(
  filePath: string,
  reason: string,
  target?: RagPublishTarget
): number {
  if (!filePath) return 0;
  const normTarget = filePath.trim().toLowerCase();
  let invalidatedCount = 0;

  vectorStore = vectorStore.map((entry) => {
    const entryFile = (entry.metadata.file || '').trim().toLowerCase();
    if (
      entry.metadata.provenance === 'clean' &&
      (entryFile === normTarget || normTarget.endsWith(entryFile) || entryFile.endsWith(normTarget))
    ) {
      invalidatedCount++;
      return {
        ...entry,
        metadata: {
          ...entry.metadata,
          provenance: 'contradicted' as const,
          trust: 'revoked' as const,
          invalidationReason: reason,
        },
        content: `// [CONTRADICTED & REVOKED BY SUBSEQUENT FAILURE: ${reason}]\n` + entry.content,
      };
    }
    return entry;
  });

  if (invalidatedCount > 0) {
    saveVectorsToIndexedDB(vectorStore).catch(() => {});
    scheduleDebouncedRagSync(target);
  }

  return invalidatedCount;
}

/**
 * Reconciles contradictory memories across the vector store.
 * Identifies files with active failure vectors and revokes any conflicting clean patterns.
 */
export function reconcileContradictoryMemories(store?: VectorEntry[]): {
  reconciledCount: number;
  cleanCount: number;
  failureCount: number;
} {
  const current = store || vectorStore;
  const failureFiles = new Set<string>();

  for (const entry of current) {
    if (entry.metadata.provenance === 'failure' && entry.metadata.file) {
      failureFiles.add(entry.metadata.file.trim().toLowerCase());
    }
  }

  let reconciledCount = 0;
  const updated = current.map((entry) => {
    if (entry.metadata.provenance === 'clean' && entry.metadata.file) {
      const entryFile = entry.metadata.file.trim().toLowerCase();
      if (failureFiles.has(entryFile)) {
        reconciledCount++;
        return {
          ...entry,
          metadata: {
            ...entry.metadata,
            provenance: 'contradicted' as const,
            trust: 'revoked' as const,
            invalidationReason: 'Superseded by verified failure entry on the same file',
          },
        };
      }
    }
    return entry;
  });

  if (reconciledCount > 0) {
    vectorStore = updated;
    saveVectorsToIndexedDB(vectorStore).catch(() => {});
  }

  const cleanCount = vectorStore.filter((v) => v.metadata.provenance === 'clean' && v.metadata.trust !== 'revoked').length;
  const failureCount = vectorStore.filter((v) => v.metadata.provenance === 'failure').length;

  return { reconciledCount, cleanCount, failureCount };
}

/**
 * Appends a newly identified failure and paired fix to the RAG memory store and ledger.
 */
export function appendFailureAndFix(
  failHash: string,
  fixHash: string,
  errorClass: string,
  filePath: string,
  failSnippet: string,
  fixSnippet: string,
  ruleToAvoid: string,
  diagnosis?: string,
  fingerprint?: string,
  target?: RagPublishTarget
): void {
  // First, reconcile and invalidate any previously recorded "clean" vectors on this file
  invalidateCleanVectorsForFile(
    filePath,
    `Superseded by failure [${errorClass}]: ${ruleToAvoid}`,
    target
  );

  const newEntry: VectorEntry = {
    id: `wrong_${failHash}`,
    metadata: {
      commitHash: failHash,
      fixCommitHash: fixHash,
      provenance: 'failure',
      trust: 'high',
      errorClass,
      file: filePath,
      description: diagnosis,
      fingerprint,
    },
    content: `## FAILURE: ${failHash} | FIX: ${fixHash}\n- Error Class: ${errorClass}\n- File: ${filePath}\n- Rule to Avoid: ${ruleToAvoid}${diagnosis ? `\n- Diagnosis: ${diagnosis}` : ''}`,
    codeSnippet: failSnippet,
    pairedFixSnippet: fixSnippet,
    ruleToAvoid,
    diagnosis,
    vector: textToVector(`${failHash} ${errorClass} ${filePath} ${ruleToAvoid} ${diagnosis || ''} ${fingerprint || ''} ${failSnippet} ${fixSnippet}`),
  };

  vectorStore = vectorStore.filter((e) => e.id !== newEntry.id);
  vectorStore.push(newEntry);
  saveVectorsToIndexedDB(vectorStore).catch(() => {});
  scheduleDebouncedRagSync(target);
}

export function getAllEmgVectors(): VectorEntry[] {
  return [...vectorStore];
}