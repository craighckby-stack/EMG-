/**
 * EMG Sovereign Kernel - Edge Security Sanitizer & Governance Gatekeeper
 * File: src/governance/sanitizer.ts
 */

import { queryEmgRag } from '../memory/emg_rag';

export type ErrorClass = 'HARDCODED_CRED' | 'SECRET_LEAKAGE' | 'PII' | 'AST_PARSE' | 'UNGROUNDED_CLAIMS' | 'UNIMPLEMENTED_STUB' | 'CLEAN';

export interface SecuritySanitizerResult {
  readonly clean: boolean;
  readonly sanitizedCode: string;
  readonly errorClass?: ErrorClass;
  readonly violations: readonly string[];
  readonly autoAppliedFix?: string;
}

export interface QuantitativeClaim {
  match: string;
  index: number;
  kind: "percentage" | "cycle_count" | "benchmark_score" | "multiplier" | "generic_precise_stat" | "floating_confidence";
}

const SECRET_PATTERNS: readonly RegExp[] = [
  /AIzaSy[A-Za-z0-9_-]{33}/g, // Google / Gemini API Keys
  /ghp_[A-Za-z0-9]{36}/g,     // GitHub Personal Access Token
  /sk-[A-Za-z0-9]{32,48}/g,    // OpenAI API Key
  /AKIA[0-9A-Z]{16}/g,        // AWS Access Key ID
  /\[REDACTED_PRIVATE_KEY_BLOCK\]/g,
  /https:\/\/hooks\.slack\.com\/services\/T[A-Za-z0-9_]+\/B[A-Za-z0-9_]+\/[A-Za-z0-9_]+/g,
];

const PII_PATTERNS: readonly RegExp[] = [
  /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, // Email addresses
  /\b\d{3}-\d{2}-\d{4}\b/g,                          // SSN
];

const HARDCODED_CRED_REGEX = /(?:api[_-]?key|secret|password|auth[_-]?token)\s*[:=]\s*["'][A-Za-z0-9_~.+-]{16,}["']/gi;

const CLAIM_PATTERNS: Array<{ regex: RegExp; kind: QuantitativeClaim["kind"] }> = [
  { regex: /\b\d{1,3}(\.\d+)?%/g, kind: "percentage" },
  { regex: /\b(within|after|over)\s+\d+\s+(generation|training|mutation|iteration)s?\b/gi, kind: "cycle_count" },
  { regex: /\b\d+(\.\d+)?x\s+(faster|slower|improvement|reduction|increase)\b/gi, kind: "multiplier" },
  { regex: /\b(score[d]?|accuracy|latency|throughput)\s+(of\s+)?\d+(\.\d+)?\b/gi, kind: "benchmark_score" },
  { regex: /\bexactly\s+\d+(\.\d+)?\b/gi, kind: "generic_precise_stat" },
  { regex: /\b(confidence(?:_score)?|accuracy_score)\s*[:=]\s*0\.\d{2,4}\b/gi, kind: "floating_confidence" },
  { regex: /\b\*\*Confidence(?:\s+Score)?:\*\*\s*0\.\d{2,4}\b/gi, kind: "floating_confidence" },
];

function extractProseRegions(text: string): Array<{ text: string; offset: number }> {
  const regions: Array<{ text: string; offset: number }> = [];
  const patterns = [
    /"""[\s\S]*?"""/g,           // Python docstrings
    /\/\*\*[\s\S]*?\*\//g,       // JSDoc/TSDoc blocks
    /\/\/.*$/gm,                 // line comments
    /#.*$/gm,                    // Python comments
    /\b(?:confidence|confidence_score)\s*[:=]\s*0\.\d{2,4}\b/gi, // Hardcoded confidence score fields
  ];
  for (const p of patterns) {
    let m: RegExpExecArray | null;
    const re = new RegExp(p.source, p.flags);
    while ((m = re.exec(text)) !== null) {
      regions.push({ text: m[0], offset: m.index });
    }
  }
  return regions;
}

export function findUngroundedClaims(generatedText: string): QuantitativeClaim[] {
  const proseRegions = extractProseRegions(generatedText);
  const claims: QuantitativeClaim[] = [];

  for (const region of proseRegions) {
    for (const { regex, kind } of CLAIM_PATTERNS) {
      let m: RegExpExecArray | null;
      const re = new RegExp(regex.source, regex.flags);
      while ((m = re.exec(region.text)) !== null) {
        claims.push({ match: m[0], index: region.offset + m.index, kind });
      }
    }
  }
  return claims;
}

export function isLikelyGrounded(claim: QuantitativeClaim, fullText: string): boolean {
  const windowStart = Math.max(0, claim.index - 300);
  const windowEnd = Math.min(fullText.length, claim.index + 300);
  const window = fullText.slice(windowStart, windowEnd);

  const groundingSignals = [
    /await\s+\w+\(/,          // async call
    /=\s*[\w.]+\(.*\)/,       // assignment from function call
    /self\.\w+\.\w+/,         // reading computed attribute
    /json\.load|fetch\(|requests\.|api\./i,
    /\bmeasured\b|\bcomputed\b|\bbenchmark_result\b|\bfrom_evidence\b/i,
  ];

  return groundingSignals.some((sig) => sig.test(window));
}

export function checkUngroundedQuantitativeClaims(generatedText: string): string | null {
  const claims = findUngroundedClaims(generatedText);
  const ungrounded = claims.filter((c) => !isLikelyGrounded(c, generatedText));

  if (ungrounded.length === 0) return null;

  const examples = ungrounded.slice(0, 3).map((c) => `"${c.match}" (${c.kind})`).join(", ");
  return `[LINT REJECT: NO_UNGROUNDED_QUANTITATIVE_CLAIMS] Detected ${ungrounded.length} specific numeric claim(s) with no traceable computation, call, or fetched value nearby: ${examples}. Output must not assert precise statistics (percentages, cycle counts, benchmark scores, confidence scores) unless derived from an actual computation or data source in the same diff.`;
}

/**
 * Companion Sanitizer Rule: NO_UNIMPLEMENTED_STUB_MASQUERADING_AS_ANALYSIS
 */
export function checkUnimplementedStubAnalysis(code: string): string | null {
  const stubPatterns = [
    /def\s+(?:evaluate|analyze|audit|synthesize|estimate)\s*\([^)]*\)\s*:\s*(?:\n\s*|\n\s*"""[\s\S]*?"""\s*\n\s*)return\s+(?:EvidenceEntry|dict|\{|\w+\()\s*(?:persona=[^,]+,\s*)?(?:confidence_score|confidence|score)\s*=\s*(?:0\.\d+|0|None|\[\]|"\w+")\s*\)?/g,
    /async?\s+(?:evaluate|analyze|audit|synthesize|estimate)\s*\([^)]*\)\s*(?::\s*[^{]+)?\{\s*return\s*\{\s*(?:persona|confidence|score)\s*:\s*(?:0\.\d+|0|None|null|"\w+")\s*\}\s*;?\s*\}/g,
  ];

  for (const pattern of stubPatterns) {
    if (pattern.test(code)) {
      return `[LINT REJECT: NO_UNIMPLEMENTED_STUB_MASQUERADING_AS_ANALYSIS] Detected analysis/evaluation method whose implementation is a single hardcoded stub return statement. Methods claiming to evaluate or analyze must contain verifiable computation, data inspection, or dynamic evaluation logic.`;
    }
  }

  return null;
}

/**
 * Validates AST balance for basic JSX/TS syntax safety with optimized memory overhead.
 */
function checkAstParseBalance(code: string): { readonly valid: boolean; readonly error?: string } {
  let braceCount = 0;
  let bracketCount = 0;
  let parenCount = 0;
  const len = code.length;

  for (let i = 0; i < len; i++) {
    const char = code.charCodeAt(i);
    if (char === 123) braceCount++;      // '{'
    else if (char === 125) braceCount--; // '}'
    else if (char === 91) bracketCount++; // '['
    else if (char === 93) bracketCount--; // ']'
    else if (char === 40) parenCount++;  // '('
    else if (char === 41) parenCount--;  // ')'

    if (braceCount < 0 || bracketCount < 0 || parenCount < 0) {
      return { valid: false, error: 'Unbalanced structural closing delimiter' };
    }
  }

  if (braceCount !== 0 || bracketCount !== 0 || parenCount !== 0) {
    return { valid: false, error: `Unbalanced delimiters: braces=${braceCount}, brackets=${bracketCount}, parens=${parenCount}` };
  }

  return { valid: true };
}

/**
 * Calculates Shannon entropy of a string to detect randomized high-entropy secrets/tokens.
 */
function calculateShannonEntropy(str: string): number {
  if (!str) return 0;
  const len = str.length;
  const freqs: Record<string, number> = Object.create(null);
  
  for (let i = 0; i < len; i++) {
    const char = str[i];
    freqs[char] = (freqs[char] || 0) + 1;
  }

  let entropy = 0;
  for (const char in freqs) {
    const p = (freqs[char] as number) / len;
    entropy -= p * Math.log2(p);
  }
  return entropy;
}

/**
 * Scans code for high-entropy tokens (e.g. raw secret keys or tokens with Shannon entropy > 4.5).
 */
function scanHighEntropyTokens(code: string): { readonly found: boolean; readonly tokens: readonly string[] } {
  const tokenRegex = /["']([A-Za-z0-9_\-~.+=]{24,})["']/g;
  const matches = code.matchAll(tokenRegex);
  const highEntropyTokens: string[] = [];

  for (const match of matches) {
    const candidate = match[1];
    if (candidate) {
      const entropy = calculateShannonEntropy(candidate);
      if (entropy > 4.5 && !candidate.startsWith('http') && !candidate.startsWith('/') && !candidate.includes(' ')) {
        highEntropyTokens.push(candidate);
      }
    }
  }

  return {
    found: highEntropyTokens.length > 0,
    tokens: highEntropyTokens,
  };
}

/**
 * Core Security Sanitizer & Edge Governance Gatekeeper.
 */
export function sanitizeAndGovern(filePath: string, proposedCode: string): SecuritySanitizerResult {
  const violations: string[] = [];
  let sanitizedCode = proposedCode;
  let primaryErrorClass: ErrorClass | undefined = undefined;

  // 1. Check Secret Leakage & Hardcoded Credentials
  let hasSecretLeak = false;
  for (const pattern of SECRET_PATTERNS) {
    if (pattern.test(proposedCode)) {
      hasSecretLeak = true;
      sanitizedCode = sanitizedCode.replace(pattern, '[REDACTED_SECRET_KEY]');
    }
  }

  if (hasSecretLeak) {
    violations.push('SECRET_LEAKAGE: Detected hardcoded API keys/secrets.');
    primaryErrorClass = 'SECRET_LEAKAGE';
  }

  if (HARDCODED_CRED_REGEX.test(proposedCode)) {
    violations.push('HARDCODED_CRED: Detected hardcoded credentials or auth tokens.');
    if (!primaryErrorClass) primaryErrorClass = 'HARDCODED_CRED';
  }

  // Shannon Entropy Secret Scan
  const entropyScan = scanHighEntropyTokens(proposedCode);
  if (entropyScan.found) {
    violations.push(`SECRET_LEAKAGE: Detected ${entropyScan.tokens.length} high-entropy token(s) (Shannon entropy > 4.5).`);
    for (const tok of entropyScan.tokens) {
      sanitizedCode = sanitizedCode.replaceAll(tok, '[REDACTED_HIGH_ENTROPY_SECRET]');
    }
    if (!primaryErrorClass) primaryErrorClass = 'SECRET_LEAKAGE';
  }

  // 2. Check PII
  for (const pattern of PII_PATTERNS) {
    if (pattern.test(proposedCode)) {
      violations.push('PII: Detected unredacted Personal Identifiable Information (email/SSN).');
      sanitizedCode = sanitizedCode.replace(pattern, '[REDACTED_PII]');
      if (!primaryErrorClass) primaryErrorClass = 'PII';
    }
  }

  // 3. Check AST Parse
  const astResult = checkAstParseBalance(proposedCode);
  if (!astResult.valid) {
    violations.push(`AST_PARSE: ${astResult.error}`);
    if (!primaryErrorClass) primaryErrorClass = 'AST_PARSE';
  }

  // 4. Check Ungrounded Quantitative Claims
  const quantitativeClaimViolation = checkUngroundedQuantitativeClaims(proposedCode);
  if (quantitativeClaimViolation) {
    violations.push(quantitativeClaimViolation);
    if (!primaryErrorClass) primaryErrorClass = 'UNGROUNDED_CLAIMS';
  }

  // 5. Check Unimplemented Stub Analysis
  const stubAnalysisViolation = checkUnimplementedStubAnalysis(proposedCode);
  if (stubAnalysisViolation) {
    violations.push(stubAnalysisViolation);
    if (!primaryErrorClass) primaryErrorClass = 'UNIMPLEMENTED_STUB';
  }

  // 6. Paired Fix Auto-Recovery Check from RAG
  let autoAppliedFix: string | undefined = undefined;
  if (violations.length > 0 || primaryErrorClass) {
    try {
      const ragQuery = queryEmgRag(`${filePath} ${primaryErrorClass || ''} ${violations.join(' ')}`);
      if (ragQuery.topFixes.length > 0 && ragQuery.topFixes[0]?.pairedFixSnippet) {
        autoAppliedFix = ragQuery.topFixes[0].pairedFixSnippet;
        sanitizedCode = autoAppliedFix;
      }
    } catch {
      // Fallback safely if RAG query encounters runtime issues
    }
  }

  const clean = violations.length === 0;

  return {
    clean,
    sanitizedCode,
    errorClass: primaryErrorClass || (clean ? 'CLEAN' : undefined),
    violations,
    autoAppliedFix,
  };
}

export class EdgeGovernanceGatekeeper {
  public static evaluateProposal(filePath: string, proposedCode: string): SecuritySanitizerResult {
    return sanitizeAndGovern(filePath, proposedCode);
  }
}
