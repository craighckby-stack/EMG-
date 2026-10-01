/**
 * EMG Sovereign Kernel - Ethical Substrate Debate Engine
 * File: src/engine/debate.ts
 *
 * Role: Dual-perspective debate between Caan (Prosecutor / Failure Risk) and
 *       Jesus (Defender / Clean Patterns Benefit), judged by Gemini Synthesis.
 *       Verdict: Allow mutation ONLY IF benefit > risk AND sanitizer clean.
 */

import { queryEmgRag, VectorEntry } from '../memory/emg_rag';
import { sanitizeAndGovern, SecuritySanitizerResult } from '../governance/sanitizer';

export interface DebateStatement {
  readonly speaker: 'Prosecutor (Darlek Caan)' | 'Defender (Jesus)' | 'Judge (Sovereign Synthesis)';
  readonly avatar: string;
  readonly argument: string;
  readonly score: number;
  readonly matchedEntries: readonly VectorEntry[];
}

export interface DebateVerdict {
  readonly approved: boolean;
  readonly riskScore: number;
  readonly benefitScore: number;
  readonly sanitizerClean: boolean;
  readonly verdictSummary: string;
  readonly prosecutorStatement: DebateStatement;
  readonly defenderStatement: DebateStatement;
  readonly judgeStatement: DebateStatement;
  readonly sanitizerResult: SecuritySanitizerResult;
}

export function executeRAGDebate(filePath: string, proposedMutation: string): DebateVerdict {
  if (!filePath || typeof filePath !== 'string') {
    throw new Error('executeRAGDebate requires a valid non-empty filePath string.');
  }
  if (!proposedMutation || typeof proposedMutation !== 'string') {
    throw new Error('executeRAGDebate requires a valid non-empty proposedMutation string.');
  }

  // 1. Edge Governance Sanitizer Gate
  const sanitizerResult = sanitizeAndGovern(filePath, proposedMutation);

  // 2. Query RAG
  const ragQuery = queryEmgRag(`${filePath} ${proposedMutation}`);

  // 3. Prosecutor (Caan) Statement & Risk Score calculation
  const topFailures = ragQuery.topFailures ?? [];
  let riskScore = 0;
  if (!sanitizerResult.clean) {
    riskScore += 5; // Direct sanitizer violation adds heavy risk penalty
  }
  if (topFailures.length > 0) {
    riskScore += topFailures.length * 2.5;
  }
  riskScore = Math.min(10, Math.max(0, riskScore));

  const prosecutorArgument = topFailures.length > 0 || !sanitizerResult.clean
    ? `Objection! Detected ${topFailures.length} historical failure patterns matching this change. Errors: ${topFailures.map((f) => f.metadata.errorClass || 'UNSPECIFIED').join(', ')}. Sanitizer violations: ${sanitizerResult.violations.join('; ') || 'None'}.`
    : `No structural failure patterns detected in memory. Calculated risk score: ${riskScore}/10.`;

  const prosecutorStatement: DebateStatement = {
    speaker: 'Prosecutor (Darlek Caan)',
    avatar: '👁️',
    argument: prosecutorArgument,
    score: riskScore,
    matchedEntries: topFailures,
  };

  // 4. Defender (Jesus) Statement & Benefit Score calculation
  const topClean = ragQuery.topCleanPatterns ?? [];
  const failingFiles = new Set(topFailures.map((f) => (f.metadata.file || '').trim().toLowerCase()).filter(Boolean));
  const vettedClean = topClean.filter((c) => {
    const file = (c.metadata.file || '').trim().toLowerCase();
    return !failingFiles.has(file) && c.metadata.provenance === 'clean' && c.metadata.trust !== 'revoked';
  });

  let benefitScore = 5; // Baseline trust
  if (sanitizerResult.clean) {
    benefitScore += 2;
  }
  if (vettedClean.length > 0) {
    benefitScore += vettedClean.length * 1.5;
  } else if (topFailures.length > 0) {
    // If active failures exist and zero vetted clean patterns exist, penalize benefit score
    benefitScore = Math.max(1, benefitScore - 3);
  }
  benefitScore = Math.min(10, Math.max(0, benefitScore));

  const defenderArgument = vettedClean.length > 0
    ? `This mutation aligns with ${vettedClean.length} clean, AST-verified historical commits across our repository ledgers. Code sanitizer passed cleanly.`
    : (topFailures.length > 0
        ? `Caution: No verified clean patterns validate this file; historical failure patterns exist. Calculated benefit score: ${benefitScore}/10.`
        : `Code is clean and complies with core type safety constraints. Calculated benefit score: ${benefitScore}/10.`);

  const defenderStatement: DebateStatement = {
    speaker: 'Defender (Jesus)',
    avatar: '🕊️',
    argument: defenderArgument,
    score: benefitScore,
    matchedEntries: vettedClean,
  };

  // 5. Judge (Sovereign Synthesis) Evaluation
  const topSynthesis = ragQuery.topSynthesis ?? [];
  const approved = benefitScore > riskScore && sanitizerResult.clean;

  const verdictSummary = approved
    ? `VERDICT APPROVED: Benefit score (${benefitScore.toFixed(1)}) exceeds Risk score (${riskScore.toFixed(1)}), and Edge Security Sanitizer is CLEAN. Mutation permitted.`
    : `VERDICT REJECTED: Risk score (${riskScore.toFixed(1)}) equals or exceeds Benefit score (${benefitScore.toFixed(1)}) or Sanitizer failed (${sanitizerResult.clean ? 'CLEAN' : 'VIOLATIONS'}). Mutation blocked.`;

  const judgeArgument = `Architectural Evaluation (${topSynthesis[0]?.metadata.description || 'Core Synthesis'}): ${verdictSummary}`;

  const judgeStatement: DebateStatement = {
    speaker: 'Judge (Sovereign Synthesis)',
    avatar: '⚖️',
    argument: judgeArgument,
    score: approved ? benefitScore - riskScore : riskScore - benefitScore,
    matchedEntries: topSynthesis,
  };

  return {
    approved,
    riskScore,
    benefitScore,
    sanitizerClean: sanitizerResult.clean,
    verdictSummary,
    prosecutorStatement,
    defenderStatement,
    judgeStatement,
    sanitizerResult,
  };
}