/**
 * EMG Core v49 Neural Code and Documentation Optimizer Engine
 * File Path: "src/lib/diagnostic-utils.ts"
 * Optimized for readability, modern TypeScript idioms, and robust defensive execution.
 */

const EVOLUTION_LOG_PREFIX = '[DARLEK-CANN-EVOLUTION]' as const;
const INVALID_MESSAGE_WARNING = `${EVOLUTION_LOG_PREFIX}: Invalid message type passed to logEvolution` as const;

// Global pre-compiled regex instance for zero-reallocation parsing performance
const SINGLE_LINE_COMMENT_PATTERN: RegExp = /\/\/[^\r\n]*(\r?\n|$)/g;

/**
 * Validates whether a given unknown value is a non-empty primitive string.
 * Employs strict type narrowing for runtime safety.
 */
const isValidString = (value: unknown): value is string => {
  return typeof value === 'string' && value.length > 0;
};

/**
 * Logs an evolution diagnostic message with a standardized sovereign prefix.
 * Validates inputs defensively to prevent runtime anomalies.
 * 
 * @param message - The diagnostic message to record.
 */
export const logEvolution = (message: string): void => {
  if (!isValidString(message)) {
    console.warn(INVALID_MESSAGE_WARNING);
    return;
  }
  
  console.log(`${EVOLUTION_LOG_PREFIX}: ${message}`);
};

/**
 * Sanitizes source code by removing single-line comments with maximum memory efficiency.
 * Re-uses cached regex patterns and handles empty/malformed inputs safely.
 * 
 * @param sourceCode - The raw source code string to sanitize.
 * @returns The sanitized source code devoid of single-line comments.
 */
export const sanitizeCode = (sourceCode: string): string => {
  if (!isValidString(sourceCode)) {
    return '';
  }

  // Reset lastIndex to prevent stateful regex matching bugs globally
  SINGLE_LINE_COMMENT_PATTERN.lastIndex = 0;
  
  return sourceCode.replace(SINGLE_LINE_COMMENT_PATTERN, '$1');
};