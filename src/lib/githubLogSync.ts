/**
 * DARLEK CAAN ARCHITECTURAL SERVICE
 * File: src/lib/githubLogSync.ts
 * Role: Full-time background synchronization daemon that automatically persists
 *       all Firebase, RAG brain, system telemetry, and learning logs to the dedicated
 *       DARLEK CAAN repository in 'rag/' and 'logs/' directories.
 *       Strictly prevents cross-repository contamination when enhancing external repos
 *       and appends/merges with existing knowledge files rather than rewriting them.
 */

import { getLearningLogs, type LearningLog } from './learningLogs';
import { getRagLogs, getRagMutations, getBrainChunks, type RagLogRecord, type RagMutationRecord, type BrainChunk } from './ragBrain';
import { msDosEngine } from './msDosEngine';
import { getGitHubConfig } from './github';

export const DARLEK_CAAN_DEFAULT_OWNER = 'craighckby-stack';
export const DARLEK_CAAN_DEFAULT_REPO = 'DARLEK-CAAN-Cognitive-Engine';
export const DARLEK_CAAN_DEFAULT_BRANCH = 'main';

export interface LogSyncResult {
  readonly success: boolean;
  readonly syncedFiles: readonly string[];
  readonly totalLogsCount: number;
  readonly commitSha?: string;
  readonly error?: string;
  readonly timestamp: string;
}

let syncTimeout: ReturnType<typeof setTimeout> | null = null;
let isSyncing = false;
let lastSyncTimestamp: string | null = null;

let activeRuntimeConfig: { token?: string; owner?: string; repo?: string; branch?: string } | undefined = undefined;

/**
 * Checks if a repository name / owner belongs to Darlek Caan.
 */
export function isDarlekCaanRepo(owner?: string, repo?: string): boolean {
  if (!repo) return true;
  const clean = repo.toLowerCase().replace(/[^a-z0-9]/g, '');
  return clean.includes('darlek') || clean.includes('caan');
}

/**
 * Updates the active in-memory GitHub sync configuration from live system state.
 * Filters out foreign repositories so log/rag sync always points to Darlek Caan.
 */
export function setRuntimeGitHubSyncConfig(config: { token?: string; owner?: string; repo?: string; branch?: string }): void {
  const isDarlek = !config.repo || isDarlekCaanRepo(config.owner, config.repo);
  activeRuntimeConfig = {
    token: config.token || activeRuntimeConfig?.token,
    owner: isDarlek ? (config.owner || DARLEK_CAAN_DEFAULT_OWNER) : DARLEK_CAAN_DEFAULT_OWNER,
    repo: isDarlek ? (config.repo || DARLEK_CAAN_DEFAULT_REPO) : DARLEK_CAAN_DEFAULT_REPO,
    branch: isDarlek ? (config.branch || DARLEK_CAAN_DEFAULT_BRANCH) : DARLEK_CAAN_DEFAULT_BRANCH,
  };
}

export function getRuntimeGitHubSyncConfig(): { token?: string; owner?: string; repo?: string; branch?: string } | undefined {
  return activeRuntimeConfig;
}

/**
 * Resolves the immutable Darlek Caan repository target.
 * Guarantees that logs and RAG memories NEVER contaminate external enhanced repos.
 */
export function resolveDarlekCaanTarget(configOverride?: {
  token?: string;
  owner?: string;
  repo?: string;
  branch?: string;
}): { token: string; owner: string; repo: string; branch: string } {
  const globalConfig = getGitHubConfig();
  const token = configOverride?.token || activeRuntimeConfig?.token || globalConfig.token || '';
  
  // If the override is specifically a Darlek repo, allow it; otherwise lock to Darlek Caan defaults
  const isOverrideDarlek = configOverride?.repo && isDarlekCaanRepo(configOverride.owner, configOverride.repo);
  const owner = isOverrideDarlek ? (configOverride?.owner || DARLEK_CAAN_DEFAULT_OWNER) : DARLEK_CAAN_DEFAULT_OWNER;
  const repo = isOverrideDarlek ? (configOverride?.repo || DARLEK_CAAN_DEFAULT_REPO) : DARLEK_CAAN_DEFAULT_REPO;
  const branch = isOverrideDarlek ? (configOverride?.branch || DARLEK_CAAN_DEFAULT_BRANCH) : DARLEK_CAAN_DEFAULT_BRANCH;

  return { token, owner, repo, branch };
}

/**
 * Reads an existing local file safely across server and client runtimes.
 */
async function readExistingLocalFile(relativeFilePath: string): Promise<string | null> {
  if (typeof window === 'undefined') {
    try {
      const fs = await import(/* @vite-ignore */ 'fs');
      const path = await import(/* @vite-ignore */ 'path');
      const fullPath = path.resolve(process.cwd(), relativeFilePath);
      if (fs.existsSync(fullPath)) {
        return fs.readFileSync(fullPath, 'utf-8');
      }
    } catch {
      // Fallback
    }
  }
  return null;
}

/**
 * Writes an existing local file safely in server runtimes.
 */
async function writeLocalFileSafely(relativeFilePath: string, content: string): Promise<void> {
  if (typeof window === 'undefined') {
    try {
      const fs = await import(/* @vite-ignore */ 'fs');
      const path = await import(/* @vite-ignore */ 'path');
      const fullPath = path.resolve(process.cwd(), relativeFilePath);
      const parentDir = path.dirname(fullPath);
      if (!fs.existsSync(parentDir)) {
        fs.mkdirSync(parentDir, { recursive: true });
      }
      fs.writeFileSync(fullPath, content, 'utf-8');
    } catch {
      // Fallback
    }
  }
}

/**
 * Formats a comprehensive markdown summary of all Firebase RAG state
 * for human and agent inspection directly inside the GitHub repository.
 */
function generateRagSnapshotMarkdown(
  brainChunks: readonly BrainChunk[],
  ragMutations: readonly RagMutationRecord[],
  learningLogs: readonly LearningLog[],
  timestamp: string
): string {
  const correctMutations = ragMutations.filter((m) => m.verdict !== 'wrong');
  const wrongMutations = ragMutations.filter((m) => m.verdict === 'wrong');

  let md = `# DARLEK CAAN RAG KNOWLEDGE SNAPSHOT\n\n`;
  md += `*Autonomous Live Mirror from Firebase Firestore & Local Vector Store*\n`;
  md += `*Last Synchronized:* \`${timestamp}\`\n\n`;
  md += `## 📊 Knowledge Base Metrics\n\n`;
  md += `- **Active Vector Brain Chunks:** \`${brainChunks.length}\`\n`;
  md += `- **Total Mutation Pairs Logged:** \`${ragMutations.length}\`\n`;
  md += `  - ✅ **Positive Exemplars (Approved/Working Fixes):** \`${correctMutations.length}\`\n`;
  md += `  - ❌ **Negative Exemplars (Operator Rejections & Coherence Gate Vetoes):** \`${wrongMutations.length}\`\n`;
  md += `- **Postmortems & Invariant Constraints:** \`${learningLogs.length}\`\n\n`;

  md += `## 🧠 Recent Knowledge Chunks (dalek_rag_brain)\n\n`;
  if (brainChunks.length === 0) {
    md += `*No vector chunks indexed yet.*\n\n`;
  } else {
    brainChunks.slice(0, 15).forEach((chunk, idx) => {
      md += `### ${idx + 1}. \`${chunk.fileName || chunk.sourceName || 'anonymous'}\` (Gen ${chunk.generation || 1})\n`;
      md += `*Source:* \`${chunk.sourceName}\` | *Indexed:* \`${chunk.timestamp || 'N/A'}\`\n\n`;
      md += `\`\`\`typescript\n${(chunk.codeText || '').slice(0, 350)}${(chunk.codeText || '').length > 350 ? '\n// ... [truncated]' : ''}\n\`\`\`\n\n`;
    });
  }

  md += `## 🧬 Mutation Exemplars (Deterministic Pattern Memory)\n\n`;
  if (ragMutations.length === 0) {
    md += `*No mutations recorded yet.*\n\n`;
  } else {
    ragMutations.slice(0, 15).forEach((m, idx) => {
      const isWrong = m.verdict === 'wrong';
      md += `### ${idx + 1}. ${isWrong ? '❌ [NEGATIVE EXEMPLAR - REJECTED PATTERN]' : '✅ [POSITIVE EXEMPLAR - APPROVED FIX]'}: \`${m.filePath}\`\n`;
      md += `- **Verdict:** \`${m.verdict || 'correct'}\`\n`;
      md += `- **Risk Score:** \`${m.riskScore ?? 'N/A'}\` | **Gen:** \`${m.generation ?? 1}\`\n`;
      if (m.rejectionReason) md += `- **Rejection Reason:** ${m.rejectionReason}\n`;
      if (m.rationale) md += `- **Rationale:** ${m.rationale}\n`;
      md += `\`\`\`typescript\n${(m.mutatedCode || '').slice(0, 350)}${(m.mutatedCode || '').length > 350 ? '\n// ... [truncated]' : ''}\n\`\`\`\n\n`;
    });
  }

  md += `## 🛡️ Architectural Postmortems & Constraints\n\n`;
  if (learningLogs.length === 0) {
    md += `*No postmortems recorded yet.*\n\n`;
  } else {
    learningLogs.slice(0, 15).forEach((log) => {
      md += `### [${log.type.toUpperCase()}] ${log.title}\n`;
      md += `- **Symptom:** ${log.symptom || 'N/A'}\n`;
      md += `- **Constraint:** \`${log.constraint || 'Maintain strict zero-error invariant'}\`\n\n`;
    });
  }

  return md;
}

/**
 * Merges new learning logs and postmortems with existing markdown content,
 * appending new entries without duplicating or overwriting historical notes.
 */
function mergePostmortemsMarkdown(existingMd: string | null, logs: readonly LearningLog[]): string {
  const timestamp = new Date().toISOString();
  const header = `# DALEK CAAN REPOSITORY POSTMORTEMS & LESSONS LOG\n*Auto-synchronized from Firebase & RAG Brain on: ${timestamp}*\n\n---\n\n`;

  if (!existingMd || !existingMd.includes('### ')) {
    if (logs.length === 0) return `${header}No postmortems recorded yet.\n`;
    const sections = logs.map((log) => (
      `### [${(log.timestamp || timestamp).slice(0, 10)}] ${log.title}\n\n` +
      `**Type:** ${log.type.toUpperCase()}\n\n` +
      `**Symptom:** ${log.symptom || 'Not specified'}\n\n` +
      `**EVIDENCE (Machine-Copied Fact):**\n\`\`\`\n${log.evidence || 'No direct evidence snippet recorded.'}\n\`\`\`\n\n` +
      `**CONSTRAINT (Model Generalization):** ${log.constraint || 'Maintain strict zero-error invariant.'}\n\n---\n`
    )).join('\n');
    return header + sections;
  }

  // Find logs not yet present in existing markdown
  const newSections: string[] = [];
  for (const log of logs) {
    const titleKey = log.title.trim();
    if (titleKey && !existingMd.includes(titleKey)) {
      newSections.push(
        `### [${(log.timestamp || timestamp).slice(0, 10)}] ${log.title}\n\n` +
        `**Type:** ${log.type.toUpperCase()}\n\n` +
        `**Symptom:** ${log.symptom || 'Not specified'}\n\n` +
        `**EVIDENCE (Machine-Copied Fact):**\n\`\`\`\n${log.evidence || 'No direct evidence snippet recorded.'}\n\`\`\`\n\n` +
        `**CONSTRAINT (Model Generalization):** ${log.constraint || 'Maintain strict zero-error invariant.'}\n\n---\n`
      );
    }
  }

  if (newSections.length === 0) {
    return existingMd;
  }

  const cleanBase = existingMd.endsWith('\n') ? existingMd : `${existingMd}\n\n`;
  return `${cleanBase}${newSections.join('\n')}`;
}

/**
 * Merges existing telemetry log text with newly arrived lines.
 */
function mergeTelemetryLogText(
  existingLog: string | null,
  dosLines: readonly { time: string; addr: string; tag: string; message: string }[]
): string {
  const timestamp = new Date().toISOString();
  const header = '======================================================================\n' +
    `DARLEK CAAN CONTINUOUS TELEMETRY LOG BUFFER [SYNCED: ${timestamp}]\n` +
    '======================================================================\n\n';

  const baseText = existingLog && existingLog.includes('DARLEK CAAN CONTINUOUS TELEMETRY') ? existingLog : header;
  const newLines: string[] = [];

  dosLines.forEach((line) => {
    const formatted = `[${line.time}] [${line.addr}] [${line.tag.padEnd(10, ' ')}] ${line.message}`;
    if (!baseText.includes(formatted)) {
      newLines.push(formatted);
    }
  });

  if (newLines.length === 0) return baseText;
  const sep = baseText.endsWith('\n') ? '' : '\n';
  return `${baseText}${sep}${newLines.join('\n')}\n`;
}

/**
 * Gathers all logs across Firebase, RAG brain, and telemetry engines
 * and merges them with existing files in 'rag/' and 'logs/' so that history
 * is accumulated without rewriting or creating disconnected files.
 */
export async function buildLogPayloadFiles(): Promise<Array<{ path: string; content: string }>> {
  const learningLogs = await getLearningLogs();
  const ragLogs = await getRagLogs();
  const ragMutations = await getRagMutations();
  const brainChunks = await getBrainChunks();
  const dosLines = msDosEngine.getState().lines;

  const nowIso = new Date().toISOString();

  // 1. MERGE RAG KNOWLEDGE BASE (rag/rag_knowledge_base.json)
  let accumulatedChunks = [...brainChunks];
  const existingKbRaw = await readExistingLocalFile('rag/rag_knowledge_base.json');
  if (existingKbRaw) {
    try {
      const parsed = JSON.parse(existingKbRaw);
      const priorChunks = Array.isArray(parsed?.chunks) ? parsed.chunks : [];
      const chunkMap = new Map<string, BrainChunk>();
      priorChunks.forEach((c: BrainChunk) => chunkMap.set(c.id || `${c.fileName}_${c.sourceName}_${(c.codeText || '').slice(0, 60)}`, c));
      accumulatedChunks.forEach((c) => chunkMap.set(c.id || `${c.fileName}_${c.sourceName}_${(c.codeText || '').slice(0, 60)}`, c));
      accumulatedChunks = Array.from(chunkMap.values());
    } catch {}
  }
  const ragKnowledgeBasePayload = {
    metadata: {
      generatedAt: nowIso,
      collection: 'dalek_rag_brain',
      totalChunks: accumulatedChunks.length,
      engine: 'DARLEK_CAAN_VECTOR_RAG',
    },
    chunks: accumulatedChunks,
  };

  // 2. MERGE MUTATIONS MEMORY (rag/mutations_memory.json & logs/mutations.json)
  let accumulatedMutations = [...ragMutations];
  const existingMutRaw = await readExistingLocalFile('rag/mutations_memory.json') || await readExistingLocalFile('logs/mutations.json');
  if (existingMutRaw) {
    try {
      const parsed = JSON.parse(existingMutRaw);
      const priorMutations = Array.isArray(parsed?.mutations) ? parsed.mutations : (Array.isArray(parsed?.records) ? parsed.records : []);
      const mutMap = new Map<string, RagMutationRecord>();
      priorMutations.forEach((m: RagMutationRecord) => mutMap.set(m.id || `${m.filePath}_${(m.mutatedCode || '').slice(0, 60)}`, m));
      accumulatedMutations.forEach((m) => mutMap.set(m.id || `${m.filePath}_${(m.mutatedCode || '').slice(0, 60)}`, m));
      accumulatedMutations = Array.from(mutMap.values());
    } catch {}
  }
  const correctCount = accumulatedMutations.filter((m) => m.verdict !== 'wrong').length;
  const wrongCount = accumulatedMutations.filter((m) => m.verdict === 'wrong').length;
  const mutationsPayload = {
    metadata: {
      generatedAt: nowIso,
      totalMutations: accumulatedMutations.length,
      correctCount,
      wrongCount,
      engine: 'DARLEK_CAAN_RAG_KERNEL',
    },
    mutations: accumulatedMutations,
  };

  // 3. MERGE LEARNING LOGS (rag/learning_postmortems.json & logs/learning_logs.json)
  let accumulatedLearningLogs = [...learningLogs];
  const existingLearnRaw = await readExistingLocalFile('rag/learning_postmortems.json') || await readExistingLocalFile('logs/learning_logs.json');
  if (existingLearnRaw) {
    try {
      const parsed = JSON.parse(existingLearnRaw);
      const priorLogs = Array.isArray(parsed?.learningLogs) ? parsed.learningLogs : [];
      const logMap = new Map<string, LearningLog>();
      priorLogs.forEach((l: LearningLog) => logMap.set(l.id || `${l.title}_${l.timestamp}`, l));
      accumulatedLearningLogs.forEach((l) => logMap.set(l.id || `${l.title}_${l.timestamp}`, l));
      accumulatedLearningLogs = Array.from(logMap.values());
    } catch {}
  }
  const learningLogsPayload = {
    metadata: {
      generatedAt: nowIso,
      totalEntries: accumulatedLearningLogs.length,
      engine: 'DARLEK_CAAN_POSTMORTEM_LEDGER',
    },
    learningLogs: accumulatedLearningLogs,
  };

  // 4. MERGE POSTMORTEMS MARKDOWN (logs/POSTMORTEMS.md)
  const existingPostmortemsMd = await readExistingLocalFile('logs/POSTMORTEMS.md');
  const postmortemsMd = mergePostmortemsMarkdown(existingPostmortemsMd, accumulatedLearningLogs);

  // 5. MERGE SYSTEM LOGS & TELEMETRY (logs/system_logs.json & logs/rag_brain_logs.json)
  let accumulatedSystemLogs = [...ragLogs];
  const existingSysRaw = await readExistingLocalFile('logs/system_logs.json');
  if (existingSysRaw) {
    try {
      const parsed = JSON.parse(existingSysRaw);
      const priorSysLogs = Array.isArray(parsed?.systemLogs) ? parsed.systemLogs : [];
      const sysMap = new Map<string, RagLogRecord>();
      priorSysLogs.forEach((l: RagLogRecord) => sysMap.set(l.id || `${l.type}_${l.timestamp}`, l));
      accumulatedSystemLogs.forEach((l) => sysMap.set(l.id || `${l.type}_${l.timestamp}`, l));
      accumulatedSystemLogs = Array.from(sysMap.values());
    } catch {}
  }
  const systemLogsPayload = {
    metadata: {
      generatedAt: nowIso,
      engine: 'DARLEK_CAAN_RAG_KERNEL',
      totalLogs: accumulatedSystemLogs.length + accumulatedLearningLogs.length,
      totalMutations: accumulatedMutations.length,
      totalBrainChunks: accumulatedChunks.length,
    },
    systemLogs: accumulatedSystemLogs,
    telemetryBuffer: dosLines.slice(-150),
  };

  // 6. MERGE ACTIVE TELEMETRY LOG (logs/active_telemetry.log)
  const existingTelemetryText = await readExistingLocalFile('logs/active_telemetry.log');
  const telemetryLog = mergeTelemetryLogText(existingTelemetryText, dosLines);

  // 7. COMPREHENSIVE LIVE RAG SNAPSHOT MARKDOWN (logs/FIREBASE_RAG_SNAPSHOT.md)
  const ragSnapshotMd = generateRagSnapshotMarkdown(accumulatedChunks, accumulatedMutations, accumulatedLearningLogs, nowIso);

  const files = [
    {
      path: 'rag/rag_knowledge_base.json',
      content: JSON.stringify(ragKnowledgeBasePayload, null, 2),
    },
    {
      path: 'rag/mutations_memory.json',
      content: JSON.stringify(mutationsPayload, null, 2),
    },
    {
      path: 'rag/learning_postmortems.json',
      content: JSON.stringify(learningLogsPayload, null, 2),
    },
    {
      path: 'logs/FIREBASE_RAG_SNAPSHOT.md',
      content: ragSnapshotMd,
    },
    {
      path: 'logs/system_logs.json',
      content: JSON.stringify(systemLogsPayload, null, 2),
    },
    {
      path: 'logs/learning_logs.json',
      content: JSON.stringify(learningLogsPayload, null, 2),
    },
    {
      path: 'logs/mutations.json',
      content: JSON.stringify(mutationsPayload, null, 2),
    },
    {
      path: 'logs/rag_brain_logs.json',
      content: JSON.stringify(accumulatedSystemLogs, null, 2),
    },
    {
      path: 'logs/POSTMORTEMS.md',
      content: postmortemsMd,
    },
    {
      path: 'logs/active_telemetry.log',
      content: telemetryLog,
    },
  ];

  // Write all accumulated files locally to disk in server mode
  for (const f of files) {
    await writeLocalFileSafely(f.path, f.content);
  }

  return files;
}

/**
 * Commits and synchronizes all system, Firebase, and RAG logs into GitHub
 * in the repository's dedicated `logs/` and `rag/` folders.
 * Strictly guarantees that RAG files are stored only in the Darlek Caan repository.
 */
export async function syncAllLogsToGitHub(configOverride?: {
  token?: string;
  owner?: string;
  repo?: string;
  branch?: string;
}): Promise<LogSyncResult> {
  if (isSyncing) {
    return {
      success: false,
      syncedFiles: [],
      totalLogsCount: 0,
      error: 'Sync already in progress',
      timestamp: new Date().toISOString(),
    };
  }

  isSyncing = true;
  try {
    const { token, owner, repo, branch } = resolveDarlekCaanTarget(configOverride);

    const filesToSync = await buildLogPayloadFiles();

    // Call GitHub Bulk Commit to store accumulated files under logs/ and rag/ in Darlek Caan repository
    const response = await fetch('/api/github/bulk-commit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token,
        owner,
        repo,
        branch,
        files: filesToSync,
        commitMessage: `[DARLEK CAAN] Auto-sync Firebase RAG & logs to ${owner}/${repo} [${new Date().toISOString()}]`,
      }),
    });

    const data = await response.json();
    lastSyncTimestamp = new Date().toISOString();

    if (!response.ok || !data.success) {
      console.warn('[GitHub Log Sync] Sync responded with non-ok or demo mode:', data);
      return {
        success: false,
        syncedFiles: filesToSync.map((f) => f.path),
        totalLogsCount: filesToSync.length,
        error: data.error || 'GitHub sync returned unsuccessful status',
        timestamp: lastSyncTimestamp,
      };
    }

    msDosEngine.addLog(
      'LOG_SYNC',
      `Firebase RAG & accumulated memory auto-stored in ${owner}/${repo} under 'rag/' & 'logs/' [${filesToSync.length} files committed]`
    );

    return {
      success: true,
      syncedFiles: filesToSync.map((f) => f.path),
      totalLogsCount: filesToSync.length,
      commitSha: data.commitSha,
      timestamp: lastSyncTimestamp,
    };
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.warn('[GitHub Log Sync] Log sync error:', err);
    return {
      success: false,
      syncedFiles: [],
      totalLogsCount: 0,
      error: errorMessage,
      timestamp: new Date().toISOString(),
    };
  } finally {
    isSyncing = false;
  }
}

/**
 * Schedules a debounced background sync so rapid log additions batch efficiently
 * and persistently sync to the Darlek Caan repository without spamming the API.
 */
export function scheduleGitHubLogSync(debounceMs = 3000, configOverride?: {
  token?: string;
  owner?: string;
  repo?: string;
  branch?: string;
}): void {
  if (configOverride) {
    setRuntimeGitHubSyncConfig(configOverride);
  }
  if (syncTimeout) {
    clearTimeout(syncTimeout);
  }
  syncTimeout = setTimeout(() => {
    syncAllLogsToGitHub(configOverride).catch(() => {});
  }, debounceMs);
}

export function getLastGitHubLogSyncTime(): string | null {
  return lastSyncTimestamp;
}
