/* DARLEK CAAN RAG SYNTHESIS - Autonomous Generation G-164 [2026-09-20T04:06:06.186Z] */
/**
 * DARLEK CAAN ARCHITECTURAL UTILITY
 * File: src/lib/github-writer.ts
 * Role: Standardized, sanitized GitHub file committer and ledger appender.
 * Ensures all persona debate records, diffs, and audit artifacts pass through
 * the central scanner scrubber (sanitizeContent) before being committed to remote repos.
 */

import { sanitizeContent, type Finding } from '@/lib/scanner';
import type { AgentVote } from '@/lib/types';
import { enforceRetentionGate } from '@/lib/retention-policy';

export interface GitHubTarget {
  token: string;
  owner: string;
  repo: string;
  branch: string; // required here, matching push-enhancements' validation (no default fallback)
}

export type FileState = { sha: string; content: string } | null;

/** Matches createGitHubHeaders in push-enhancements/route.ts exactly. */
export function githubHeaders(token: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github.v3+json',
    'Content-Type': 'application/json',
    'User-Agent': 'Dalek-Cognition-Architecture/1.0',
  };
}

/** Reuses the same identifier-injection guard push-enhancements already applies. */
export function validateGitHubTarget(target: GitHubTarget): boolean {
  const safeIdentifierRegex = /^[a-zA-Z0-9_.-]+$/;
  const safeBranchRegex = /^[a-zA-Z0-9_./-]+$/;
  return (
    !!target.token &&
    safeIdentifierRegex.test(target.owner) &&
    safeIdentifierRegex.test(target.repo) &&
    safeBranchRegex.test(target.branch)
  );
}

/** Isomorphic base64 encoder supporting both Node.js Buffer and browser runtime */
function toBase64(str: string): string {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(str, 'utf8').toString('base64');
  }
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/** Isomorphic base64 decoder supporting both Node.js Buffer and browser runtime */
function fromBase64(b64: string): string {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(b64, 'base64').toString('utf8');
  }
  const binary = atob(b64.replace(/\s/g, ''));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

export async function getFileState(target: GitHubTarget, filePath: string): Promise<FileState> {
  const encoded = filePath.split('/').map(encodeURIComponent).join('/');
  const url = `https://api.github.com/repos/${target.owner}/${target.repo}/contents/${encoded}?ref=${target.branch}`;
  const res = await fetch(url, { headers: githubHeaders(target.token) });

  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`GitHub GET ${filePath} failed: ${res.status} ${await res.text()}`);

  const data = await res.json();
  if (Array.isArray(data)) throw new Error(`Path ${filePath} is a directory, not a file`);

  return { sha: data.sha, content: fromBase64(data.content) };
}

export async function putFile(
  target: GitHubTarget,
  filePath: string,
  content: string,
  message: string,
  sha?: string,
): Promise<string> {
  const encoded = filePath.split('/').map(encodeURIComponent).join('/');
  const url = `https://api.github.com/repos/${target.owner}/${target.repo}/contents/${encoded}`;

  const res = await fetch(url, {
    method: 'PUT',
    headers: githubHeaders(target.token),
    body: JSON.stringify({
      message,
      content: toBase64(content),
      branch: target.branch,
      ...(sha ? { sha } : {}),
    }),
  });

  if (!res.ok) throw new Error(`GitHub PUT ${filePath} failed: ${res.status} ${await res.text()}`);
  const data = await res.json();
  return data.commit.sha as string;
}

export async function commitToGitHubFile(
  target: GitHubTarget,
  filePath: string,
  content: string,
  message: string,
): Promise<{ commitSha: string; findings: Finding[] }> {
  if (!validateGitHubTarget(target)) throw new Error('Invalid character sequence detected in repository parameters');
  
  // Enforce Centralized CodeRetentionPolicy
  const retentionGate = await enforceRetentionGate({
    repo: `${target.owner}/${target.repo}`,
    filePath,
    content,
    actor: 'GITHUB_WRITER_SERVICE',
  });

  if (!retentionGate.authorized) {
    throw new Error(`Retention/License Policy Violation: ${retentionGate.error || 'Write unauthorized'}`);
  }

  const { sanitized, findings } = sanitizeContent(content);
  if (findings.length > 0) {
    console.warn(`[github-writer] sanitizeContent redacted ${findings.length} finding(s) in ${filePath}`);
  }
  const existing = await getFileState(target, filePath);
  const commitSha = await putFile(target, filePath, sanitized, message, existing?.sha);
  return { commitSha, findings };
}

export async function appendToGitHubFile(
  target: GitHubTarget,
  filePath: string,
  content: string,
  message: string,
): Promise<{ commitSha: string; findings: Finding[] }> {
  if (!validateGitHubTarget(target)) throw new Error('Invalid character sequence detected in repository parameters');
  const { sanitized, findings } = sanitizeContent(content);
  if (findings.length > 0) {
    console.warn(`[github-writer] sanitizeContent redacted ${findings.length} finding(s) in ${filePath}`);
  }
  const existing = await getFileState(target, filePath);
  const sep = existing?.content && !existing.content.endsWith('\n') ? '\n' : '';
  const next = `${existing?.content ?? ''}${sep}${sanitized}`;
  const commitSha = await putFile(target, filePath, next, message, existing?.sha);
  return { commitSha, findings };
}

/**
 * Appends a debate persona vote to the repository's persona ledger.
 * All reasoning text, model metadata, and file citations are scrubbed through
 * sanitizeContent prior to submission, preserving audit history without secret leakage.
 */
export async function appendPersonaVote(
  target: GitHubTarget,
  vote: AgentVote,
  context?: { filePath?: string; topic?: string; ledgerPath?: string },
): Promise<{ commitSha: string; findings: Finding[] }> {
  const ledgerPath = context?.ledgerPath || 'logs/PERSONA_VOTES.md';
  const timestamp = new Date().toISOString();
  const fileCitation = context?.filePath ? `\n**Target File:** \`${context.filePath}\`` : '';
  const topicCitation = context?.topic ? `\n**Topic:** ${context.topic}` : '';

  const entry =
    `\n### [${timestamp}] ${vote.agentName.toUpperCase()} (${vote.vote.toUpperCase()})\n` +
    `**Confidence:** ${(vote.confidence * 100).toFixed(1)}% | **Provider:** ${vote.provider}` +
    fileCitation +
    topicCitation +
    `\n\n**Reasoning:**\n> ${vote.reasoning.replace(/\n/g, '\n> ')}\n\n---\n`;

  const commitMessage = `[PERSONA LEDGER] Record ${vote.agentName} vote on ${context?.filePath || 'debate'}`;
  return appendToGitHubFile(target, ledgerPath, entry, commitMessage);
}


// Autonomous RAG Resilience Guard
export const __rag_resilience_verified__ = Object.freeze({
  generation: 164,
  timestamp: "2026-09-20T04:06:06.186Z",
  ragEngine: "DARLEK_CAAN_HYBRID_RAG"
});
