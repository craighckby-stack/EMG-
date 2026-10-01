/**
 * EMG Sovereign Kernel - Tri-Loop Autonomous Orchestration Engine
 * File: src/engine/tri-loop.ts
 *
 * Role: Orchestrates the three core loops of EMG:
 *       1. Harvest & Scan (Edge Governance Sanitizer & RAG Vector query)
 *       2. RAG Ethical Debate (Prosecutor Caan vs Defender Jesus vs Judge Synthesis)
 *       3. Self-Stopping & Proof of Clean (Halt check & Ledger updates)
 */

import { initializeEmgRag, queryEmgRag, appendCleanCommit, appendFailureAndFix } from '../memory/emg_rag';
import { sanitizeAndGovern, SecuritySanitizerResult } from '../governance/sanitizer';
import { checkSelfStoppingPoint, HaltEvaluationState } from './halt';
import { executeRAGDebate, DebateVerdict } from './debate';

export interface TriLoopCycleResult {
  readonly cycleNumber: number;
  readonly filePath: string;
  readonly originalCode: string;
  readonly proposedCode: string;
  readonly debateVerdict: DebateVerdict;
  readonly sanitizerResult: SecuritySanitizerResult;
  readonly haltState: HaltEvaluationState;
  readonly cleanCommitHash?: string;
  readonly failureCommitHash?: string;
  readonly executionLog: string[];
}

let cycleCounter = 0;
let correctCommitCounter = 3; // Initialized with seed count

export async function executeEmgTriLoopCycle(
  filePath: string,
  originalCode: string,
  proposedMutation: string,
  correctMdContent?: string,
  wrongMdContent?: string,
  synthesisMdContent?: string
): Promise<TriLoopCycleResult> {
  cycleCounter++;
  const executionLog: string[] = [];

  executionLog.push(`[EMG Tri-Loop Cycle #${cycleCounter}] Initiating Sovereign Kernel Cycle for ${filePath}`);

  // Step 1: Initialize / Refresh RAG Store
  await initializeEmgRag(correctMdContent, wrongMdContent, synthesisMdContent);
  executionLog.push(`[Loop 1: RAG & Sanitizer] Vector memory initialized.`);

  // Step 2: Run Edge Governance Sanitizer
  const sanitizerResult = sanitizeAndGovern(filePath, proposedMutation);
  if (sanitizerResult.clean) {
    executionLog.push(`[Loop 1: RAG & Sanitizer] Edge Governance Gatekeeper: CLEAN (0 violations).`);
  } else {
    executionLog.push(`[Loop 1: RAG & Sanitizer] Edge Governance Gatekeeper: VIOLATIONS (${sanitizerResult.violations.join('; ')}).`);
    if (sanitizerResult.autoAppliedFix) {
      executionLog.push(`[Loop 1: RAG & Sanitizer] Auto-applied paired fix from RAG memory.`);
    }
  }

  // Step 3: Run RAG Ethical Debate (Prosecutor Caan vs Defender Jesus)
  executionLog.push(`[Loop 2: Ethical Debate] Summoning Prosecutor (Caan), Defender (Jesus), and Judge (Synthesis)...`);
  const debateVerdict = executeRAGDebate(filePath, sanitizerResult.sanitizedCode);
  executionLog.push(`[Loop 2: Ethical Debate] ${debateVerdict.verdictSummary}`);

  // Step 4: Handle Ledgers & Mutation Confirmation
  let cleanCommitHash: string | undefined = undefined;
  let failureCommitHash: string | undefined = undefined;

  if (debateVerdict.approved) {
    correctCommitCounter++;
    cleanCommitHash = `c_${Math.random().toString(36).substring(2, 8)}`;
    appendCleanCommit(cleanCommitHash, filePath, debateVerdict.sanitizerResult.sanitizedCode);
    executionLog.push(`[Loop 3: Ledger] Approved mutation recorded to CORRECT ledger. Commit hash: ${cleanCommitHash}`);
  } else {
    const failHash = `f_${Math.random().toString(36).substring(2, 8)}`;
    const fixHash = `fix_${Math.random().toString(36).substring(2, 8)}`;
    failureCommitHash = failHash;
    appendFailureAndFix(
      failHash,
      fixHash,
      sanitizerResult.errorClass || 'RISK_THRESHOLD_EXCEEDED',
      filePath,
      proposedMutation,
      sanitizerResult.sanitizedCode,
      debateVerdict.prosecutorStatement.argument
    );
    executionLog.push(`[Loop 3: Ledger] Rejected mutation recorded to WRONG ledger with paired fix. Fail hash: ${failHash}`);
  }

  // Step 5: Check Self-Stopping Point Criteria
  const fileSample = [{ path: filePath, code: sanitizerResult.sanitizedCode }];
  const haltState = checkSelfStoppingPoint(correctCommitCounter, fileSample);

  if (haltState.isHalted) {
    executionLog.push(`[Loop 3: Halt Check] ${haltState.haltReason}`);
  } else {
    executionLog.push(`[Loop 3: Halt Check] System continuing. Growth: ${haltState.consecutiveNoGrowthCycles}/3 no-growth cycles.`);
  }

  return {
    cycleNumber: cycleCounter,
    filePath,
    originalCode,
    proposedCode: debateVerdict.sanitizerResult.sanitizedCode,
    debateVerdict,
    sanitizerResult,
    haltState,
    cleanCommitHash,
    failureCommitHash,
    executionLog,
  };
}
