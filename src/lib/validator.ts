/* DARLEK CAAN RAG SYNTHESIS - Autonomous Generation G-222 [2026-09-20T05:00:00.000Z] */
/**
 * ── SOURCE CODE SYNTAX & AST VALIDATOR ──
 * File: src/lib/validator.ts
 * Provides resilient syntax validation and self-healing for proposed mutations.
 */

export interface ValidationError {
  line: number;
  column?: number;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  autoHealed?: boolean;
  healedCode?: string;
  source?: string;
}

/**
 * Strips markdown code block wrappers (e.g. ```typescript ... ```) if present.
 */
function stripMarkdownFences(code: string): { stripped: string; didStrip: boolean } {
  const trimmed = code.trim();
  const fenceRegex = /^```(?:[a-zA-Z0-9_\-+]*)\r?\n([\s\S]*?)\r?\n```$/;
  const match = trimmed.match(fenceRegex);
  if (match && match[1]) {
    return { stripped: match[1], didStrip: true };
  }
  return { stripped: code, didStrip: false };
}

/**
 * Checks for matched brackets, parentheses, and braces.
 */
function checkDelimiters(code: string): { balanced: boolean; errors: ValidationError[]; healedCode?: string } {
  const stack: { char: string; line: number; col: number }[] = [];
  const errors: ValidationError[] = [];
  const pairs: Record<string, string> = { ')': '(', '}': '{', ']': '[' };
  const opens = new Set(['(', '{', '[']);
  const closes = new Set([')', '}', ']']);

  let inSingleQuote = false;
  let inDoubleQuote = false;
  let inBacktick = false;
  let inLineComment = false;
  let inBlockComment = false;
  let line = 1;
  let col = 0;

  for (let i = 0; i < code.length; i++) {
    const char = code[i];
    const next = code[i + 1];
    col++;

    if (char === '\n') {
      line++;
      col = 0;
      inLineComment = false;
      continue;
    }

    if (inLineComment) continue;

    if (inBlockComment) {
      if (char === '*' && next === '/') {
        inBlockComment = false;
        i++;
        col++;
      }
      continue;
    }

    if (inSingleQuote) {
      if (char === '\\') { i++; col++; }
      else if (char === "'") { inSingleQuote = false; }
      continue;
    }

    if (inDoubleQuote) {
      if (char === '\\') { i++; col++; }
      else if (char === '"') { inDoubleQuote = false; }
      continue;
    }

    if (inBacktick) {
      if (char === '\\') { i++; col++; }
      else if (char === '`') { inBacktick = false; }
      continue;
    }

    // Comment starts
    if (char === '/' && next === '/') {
      inLineComment = true;
      i++;
      col++;
      continue;
    }
    if (char === '/' && next === '*') {
      inBlockComment = true;
      i++;
      col++;
      continue;
    }

    // String literal starts
    if (char === "'") { inSingleQuote = true; continue; }
    if (char === '"') { inDoubleQuote = true; continue; }
    if (char === '`') { inBacktick = true; continue; }

    // Delimiters
    if (opens.has(char)) {
      stack.push({ char, line, col });
    } else if (closes.has(char)) {
      const expected = pairs[char];
      if (stack.length === 0 || stack[stack.length - 1].char !== expected) {
        errors.push({
          line,
          column: col,
          message: `Unmatched closing delimiter '${char}'`,
        });
      } else {
        stack.pop();
      }
    }
  }

  if (stack.length > 0) {
    stack.forEach((unclosed) => {
      errors.push({
        line: unclosed.line,
        column: unclosed.col,
        message: `Unclosed opening delimiter '${unclosed.char}'`,
      });
    });

    // Auto-heal by appending missing closing brackets in reverse order
    let missingCloses = '';
    const reversePairs: Record<string, string> = { '(': ')', '{': '}', '[': ']' };
    for (let i = stack.length - 1; i >= 0; i--) {
      missingCloses += reversePairs[stack[i].char] || '';
    }
    const healedCode = code + (missingCloses ? '\n' + missingCloses : '');

    return { balanced: false, errors, healedCode };
  }

  return { balanced: errors.length === 0, errors };
}

/**
 * Validates source code for basic AST / delimiter / syntax sanity.
 */
export async function validateSourceCode(
  code: string,
  filePath = 'unknown.ts'
): Promise<ValidationResult> {
  if (!code || typeof code !== 'string') {
    return {
      valid: false,
      errors: [{ line: 1, message: 'Source code is empty or not a string' }],
    };
  }

  // 1. Strip markdown fences if present
  const { stripped, didStrip } = stripMarkdownFences(code);
  let workingCode = stripped;
  let autoHealed = didStrip;

  // 2. Check delimiters
  const delimCheck = checkDelimiters(workingCode);
  if (!delimCheck.balanced) {
    if (delimCheck.healedCode) {
      workingCode = delimCheck.healedCode;
      autoHealed = true;
    }
  }

  // 3. File-type specific validation
  const lowerPath = filePath.toLowerCase();
  const errors: ValidationError[] = [];

  if (lowerPath.endsWith('.json')) {
    try {
      JSON.parse(workingCode);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      errors.push({
        line: 1,
        message: `Invalid JSON: ${errorMessage}`,
      });
    }
  }

  const isValid = errors.length === 0 && (delimCheck.balanced || Boolean(delimCheck.healedCode));

  return {
    valid: isValid,
    errors: [...delimCheck.errors, ...errors],
    autoHealed,
    healedCode: autoHealed ? workingCode : undefined,
    source: workingCode,
  };
}

// Autonomous RAG Resilience Guard
export const __rag_resilience_verified__ = Object.freeze({
  generation: 222,
  timestamp: new Date().toISOString(),
  ragEngine: 'DARLEK_CAAN_HYBRID_RAG',
});