/**
 * EMG Sovereign Kernel - Self Stopping Point Engine
 * File: src/engine/halt.ts
 *
 * Role: Evaluates halting criteria based on correct ledger growth, RAG query results, and sanitizer state.
 */

import { queryEmgRag } from '../memory/emg_rag';
import { sanitizeAndGovern } from '../governance/sanitizer';

export interface HaltEvaluationState {
  readonly consecutiveNoGrowthCycles: number;
  readonly correctLedgerCount: number;
  readonly wrongRetrievalCount: number;
  readonly sanitizerClean: boolean;
  readonly isHalted: boolean;
  readonly haltReason?: string;
}

let historyGrowthTracker: number[] = [];
const MAX_HISTORY_LENGTH = 5;
const REQUIRED_NO_GROWTH_CYCLES = 3;

/**
 * Evaluates whether EMG should trigger a clean halt point.
 */
export function checkSelfStoppingPoint(
  currentCorrectCount: number,
  currentFileSample: readonly { readonly path: string; readonly code: string }[]
): HaltEvaluationState {
  historyGrowthTracker.push(currentCorrectCount);
  if (historyGrowthTracker.length > MAX_HISTORY_LENGTH) {
    historyGrowthTracker.shift();
  }

  let consecutiveNoGrowthCycles = 0;
  if (historyGrowthTracker.length >= REQUIRED_NO_GROWTH_CYCLES) {
    const len = historyGrowthTracker.length;
    const c1 = historyGrowthTracker[len - 3] ?? 0;
    const c2 = historyGrowthTracker[len - 2] ?? 0;
    const c3 = historyGrowthTracker[len - 1] ?? 0;

    if (c1 === c2 && c2 === c3) {
      consecutiveNoGrowthCycles = REQUIRED_NO_GROWTH_CYCLES;
    }
  }

  let totalWrongRetrievals = 0;
  let allSanitizerClean = true;

  for (const fileItem of currentFileSample) {
    const sanResult = sanitizeAndGovern(fileItem.path, fileItem.code);
    if (!sanResult.clean) {
      allSanitizerClean = false;
    }

    const ragRes = queryEmgRag(`${fileItem.path} ${fileItem.code}`);
    totalWrongRetrievals += ragRes.topFixes.length;
  }

  const isHalted =
    consecutiveNoGrowthCycles >= REQUIRED_NO_GROWTH_CYCLES &&
    totalWrongRetrievals === 0 &&
    allSanitizerClean;

  const haltReason = isHalted
    ? 'HALT: CORRECT growth 0, WRONG retrieval 0, sanitizer clean'
    : undefined;

  return {
    consecutiveNoGrowthCycles,
    correctLedgerCount: currentCorrectCount,
    wrongRetrievalCount: totalWrongRetrievals,
    sanitizerClean: allSanitizerClean,
    isHalted,
    haltReason,
  };
}

export function resetHaltTracker(): void {
  historyGrowthTracker = [];
}