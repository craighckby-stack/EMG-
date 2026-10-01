import { fetchFileContent, commitFileUpdate } from './github';
import { findCachedDiagnosisInRag, appendFailureAndFix, invalidateCleanVectorsForFile } from '../memory/emg_rag';

export async function computeSHA256(str: string): Promise<string> {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const msgBuffer = new TextEncoder().encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(16).padStart(64, '0');
}

export function computeStringHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return hash.toString();
}

export type PostmortemSource = 'oracle-harness' | 'mutation-cycle';

export interface PostmortemEntryV2 {
  file: string;
  date: string;
  source: PostmortemSource;
  evidence: string;
  diagnosis: string;
  correctivePattern: string;
  occurrenceCount: number;
  status: 'active' | 'struck' | 'escalated' | 'ignored';
  fingerprint: string;
}

export interface PostmortemResult {
  content: string;
  hash: string;
  isEscalated: boolean;
  occurrenceCount: number;
  status: 'active' | 'escalated' | 'ignored' | 'clean_verified';
  fingerprint: string;
}

/**
 * Normalizes error messages by stripping volatile line/column numbers, timestamps,
 * hex addresses, and file paths to create a stable error signature for deduplication.
 */
export function fingerprintError(file: string, evidence: string): string {
  let normalized = evidence
    .replace(/Line \d+, Col \d+/gi, "Line _, Col _")
    .replace(/:\d+:\d+/g, ":_:_")
    .replace(/line \d+/gi, "line _")
    .replace(/0x[0-9a-fA-F]+/g, "0x_")
    .replace(/\/[^:\s]+\.(ts|tsx|js|jsx|c|h|cpp|py)/gi, "<file>")
    .replace(/\s+/g, " ")
    .trim();

  // If evidence is dominated by truncation syntax cascades (unclosed delimiters/EOF errors),
  // collapse into a unified error category signature ('EOF_TRUNCATION') to prevent counter fragmentation.
  const evLower = evidence.toLowerCase();
  if (
    evLower.includes('unclosed opening delimiter') ||
    evLower.includes('unterminated string') ||
    evLower.includes('unterminated template') ||
    evLower.includes('unexpected eof') ||
    evLower.includes('unexpected end of input') ||
    evLower.includes('syntax_unclosed') ||
    evLower.includes('unclosed delimiter') ||
    (evLower.includes('expected') && evLower.includes('delimiter'))
  ) {
    normalized = "EOF_TRUNCATION";
  }

  return `${file}::${normalized}`;
}

const OCCURRENCE_ESCALATION_THRESHOLD = 3;

export function classifyEntry(priorCount: number): 'active' | 'escalated' {
  return priorCount >= OCCURRENCE_ESCALATION_THRESHOLD ? 'escalated' : 'active';
}

/**
 * Checks if evidence indicates an isolated compilation context missing dependencies
 * rather than an actual code generation defect.
 */
export function isIsolationError(evidence: string): boolean {
  const evLower = evidence.toLowerCase();
  return (
    evLower.includes('no such file or directory') ||
    evLower.includes('undeclared') ||
    evLower.includes('unknown type name') ||
    evLower.includes('implicit declaration') ||
    evLower.includes('cannot find module') ||
    evLower.includes('cannot find name')
  );
}

/**
 * Generalized rule matcher for known compiler/linter error shapes.
 * Tightened to prevent over-broad matching against raw code snippets.
 */
export function deriveConstraintFromEvidence(
  evidence: string,
  filePath: string
): { diagnosis: string; correctivePattern: string; isKnownCategory: boolean } {
  const evLower = evidence.toLowerCase();

  // 1. Isolation Artifact Check
  if (isIsolationError(evidence)) {
    return {
      diagnosis: 'Isolated compilation unit missing external dependencies or header imports.',
      correctivePattern: '[MANUAL_OVERRIDE] Isolated compilation context missing dependencies. Ignoring error.',
      isKnownCategory: true,
    };
  }

  // 2. Token Limit & Output Truncation
  if (
    evLower.includes('truncated') ||
    evLower.includes('output token limit') ||
    evLower.includes('unterminated string') ||
    evLower.includes('unterminated template') ||
    evLower.includes('unexpected end of input') ||
    evLower.includes('syntax_unclosed') ||
    evLower.includes("'} expected'") ||
    evLower.includes("')' expected") ||
    evLower.includes("']' expected")
  ) {
    return {
      diagnosis: `Model generation exceeded maximum output token threshold for ${filePath}, terminating mid-string/delimiter before EOF.`,
      correctivePattern: `File ${filePath} requires chunked diff generation or modular decomposition. Do NOT regenerate full file in a single completion pass.`,
      isKnownCategory: true,
    };
  }

  // 3. Unverifiable Self-Praise / Marketing
  if (
    evLower.includes('self-praise') ||
    evLower.includes('unverifiable claim') ||
    evLower.includes('hardened') ||
    evLower.includes('production-grade') ||
    evLower.includes('leak-free') ||
    evLower.includes('fully optimized') ||
    evLower.includes('state-of-the-art')
  ) {
    return {
      diagnosis: 'Model inserted subjective promotional claims or unverified self-praise in comments/docstrings.',
      correctivePattern: 'Do NOT emit self-praising or unverifiable claims in comments or documentation (e.g. "Fully optimized", "Hardened", "Leak-free"). Maintain neutral, factual technical descriptions.',
      isKnownCategory: true,
    };
  }

  // 3b. Ungrounded Quantitative Claims
  if (
    evLower.includes('no_ungrounded_quantitative_claims') ||
    evLower.includes('ungrounded numeric claim') ||
    evLower.includes('untraceable computation')
  ) {
    return {
      diagnosis: `Model asserted specific numeric findings (percentages, cycle counts, benchmark scores) in ${filePath} without a corresponding computation, external call, or data source in the generated diff.`,
      correctivePattern: `When generating analysis/evaluation output in ${filePath}, do not state precise statistics unless the value is assigned from an actual computed expression, function call, or fetched result in the same output. Stub or placeholder implementations must say so explicitly (e.g. "not yet computed") rather than inventing plausible-sounding numbers.`,
      isKnownCategory: true,
    };
  }

  // 3c. Unimplemented Stub Masquerading As Analysis
  if (
    evLower.includes('no_unimplemented_stub_masquerading_as_analysis') ||
    evLower.includes('single hardcoded stub return')
  ) {
    return {
      diagnosis: `Model implemented an analysis/evaluation method (${filePath}) as a single-line hardcoded return stub without actual data inspection or branching computation.`,
      correctivePattern: `When implementing methods named evaluate(), analyze(), or audit() in ${filePath}, include actual conditional evaluation, variable computation, or evidence inspection logic. Stub methods must explicitly throw NotImplementedError or mark status as unverified rather than returning fake evaluation payloads.`,
      isKnownCategory: true,
    };
  }

  // 4. Missing Type Annotation
  if (
    evLower.includes('missing property type') ||
    evLower.includes('type expected') ||
    evLower.includes('property declaration is missing') ||
    evLower.includes('invalid_type_annotation') ||
    /\btype\s+annotation\s+missing\b/i.test(evidence)
  ) {
    return {
      diagnosis: `Explicit type annotation omitted from property or variable binding in ${filePath}.`,
      correctivePattern: `Always specify explicit TypeScript type annotations on property declarations and exported bindings in ${filePath}.`,
      isKnownCategory: true,
    };
  }

  // 5. C++ Keywords in C
  if (
    evLower.includes('noexcept') ||
    evLower.includes('constexpr') ||
    (evLower.includes("expected ';'") && evLower.includes('declarator'))
  ) {
    return {
      diagnosis: 'Model emitted C++ specific keywords (e.g. noexcept, constexpr) inside a pure C unit.',
      correctivePattern: 'Do NOT emit C++ keywords (e.g. noexcept, constexpr) in pure C translation units.',
      isKnownCategory: true,
    };
  }

  // 6. Tightened Redundant Bounds Check (Requires explicit linter diagnostic phrases)
  if (
    evLower.includes('dead condition') ||
    evLower.includes('redundant check') ||
    evLower.includes('redundant guard') ||
    evLower.includes('inner bounds guard')
  ) {
    return {
      diagnosis: 'Redundant inner bounds guard inserted inside an already bounded loop or condition.',
      correctivePattern: 'Do NOT emit redundant inner bounds guards when outer loop condition already guarantees iteration bounds.',
      isKnownCategory: true,
    };
  }

  // 7. Tightened Unused Macro Check (Requires explicit unreferenced macro linter phrases)
  if (
    evLower.includes('unused macro') ||
    evLower.includes('unreferenced macro') ||
    evLower.includes('macro never applied') ||
    evLower.includes('defined but not used')
  ) {
    return {
      diagnosis: 'Preprocessor macro defined without active invocations in the translation unit.',
      correctivePattern: 'Do NOT define helper macros without applying them in active execution paths.',
      isKnownCategory: true,
    };
  }

  // 8. Test Fixture / Apparatus Leaks
  if (
    evLower.includes('stale_defect') ||
    evLower.includes('seeded defect') ||
    evLower.includes('scaffolding') ||
    evLower.includes('bugs.md')
  ) {
    return {
      diagnosis: 'Test fixture scaffolding or obsolete defect descriptions leaked into file documentation.',
      correctivePattern: 'Do NOT leak test fixture scaffolding, prediction tags, or obsolete defect descriptions into candidate file docstrings.',
      isKnownCategory: true,
    };
  }

  // 8b. PEP 585 Legacy Typing in Python
  if (
    evLower.includes('pep585_legacy_typing') ||
    evLower.includes('legacy typing import')
  ) {
    return {
      diagnosis: `Model imported deprecated legacy collections (List, Dict, Tuple, Set, Union) from typing in ${filePath} instead of modern Python 3.9+ built-in generics.`,
      correctivePattern: `Use Python 3.9+ built-in generic collections (list[int], dict[str, Any], tuple[...], set[T]) and PEP 604 union syntax (A | B) in ${filePath}. Do NOT import List, Dict, Tuple, Set, or Union from typing.`,
      isKnownCategory: true,
    };
  }

  // 8c. Redundant TypeVar bound=Any
  if (
    evLower.includes('redundant_typevar_bound') ||
    evLower.includes('bound=any')
  ) {
    return {
      diagnosis: `Model defined TypeVar with redundant 'bound=Any' in ${filePath}.`,
      correctivePattern: `Declare TypeVars as TypeVar('T') without bound=Any; TypeVar is unbounded by default in Python.`,
      isKnownCategory: true,
    };
  }

  // 9. Unmatched Fallback -> Requires Dynamic LLM Extraction with RAG Cache
  const firstLine = evidence.trim().split('\n')[0] || 'Syntax verification failure';
  return {
    diagnosis: `Compiler/linter verification failure on ${filePath}: ${firstLine}`,
    correctivePattern: `When mutating ${filePath}, strictly satisfy AST parser constraints for rule: ${firstLine}`,
    isKnownCategory: false,
  };
}

/**
 * Dynamic Root-Cause Extraction with RAG Vector Cache:
 * 1. Checks static classifier for known error categories.
 * 2. Queries RAG vector store for previously cached diagnoses matching the fingerprint.
 * 3. Dispatches LLM request ONLY for genuinely novel error shapes.
 * 4. Saves newly extracted diagnoses back into RAG vector store for instant future reuse.
 */
export async function extractDiagnosis(
  file: string,
  evidence: string
): Promise<{ diagnosis: string; correctivePattern: string }> {
  // Step 1: Static Classifier Check
  const derived = deriveConstraintFromEvidence(evidence, file);
  if (derived.isKnownCategory) {
    return { diagnosis: derived.diagnosis, correctivePattern: derived.correctivePattern };
  }

  // Step 2: RAG Vector Store Cache Lookup (Zero LLM Calls)
  const fp = fingerprintError(file, evidence);
  try {
    const cachedRag = findCachedDiagnosisInRag(file, fp);
    if (cachedRag) {
      console.log(`[RAG Cache Hit] Retrieved diagnosis directly from vector memory for ${fp}. Skipped LLM call.`);
      return cachedRag;
    }
  } catch (ragErr) {
    console.warn('[Postmortem RAG Lookup Warning]', ragErr);
  }

  // Step 3: Call LLM for genuinely novel error shapes
  try {
    const prompt = `You are a neural postmortem diagnostician for code generation failures.
Do NOT restate the error. Do NOT start rules with "Never repeat code patterns that produce this error."

Compiler/Linter Evidence:
${evidence}

Target File: ${file}

Respond strictly in JSON format:
{
  "diagnosis": "<Specific generation mechanism that caused failure — name the technical mechanism, not the symptom>",
  "correctivePattern": "<One imperative, testable instruction that future prompts must follow to avoid this specific error>"
}`;

    const res = await fetch('/api/optimize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: prompt,
        filePath: file,
        goal: 'readability',
      }),
    });

    if (res.ok) {
      const data = await res.json();
      const rawText = data.optimizedCode || data.summary || '';
      const jsonMatch = rawText.match(/\{[\s\S]*"diagnosis"[\s\S]*"correctivePattern"[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.diagnosis && parsed.correctivePattern) {
          const result = {
            diagnosis: parsed.diagnosis.trim(),
            correctivePattern: parsed.correctivePattern.trim(),
          };

          // Step 4: Persist extracted diagnosis into RAG Vector Store
          try {
            const failHash = `rag_diag_${Math.random().toString(36).substring(2, 8)}`;
            appendFailureAndFix(
              failHash,
              `fix_${failHash}`,
              'NOVEL_LLM_DIAGNOSIS',
              file,
              evidence.slice(0, 300),
              '',
              result.correctivePattern,
              result.diagnosis,
              fp
            );
          } catch {}

          return result;
        }
      }
    }
  } catch (err) {
    console.warn('[Postmortem] Dynamic LLM diagnosis extraction fallback:', err);
  }

  return { diagnosis: derived.diagnosis, correctivePattern: derived.correctivePattern };
}

/**
 * Discrete Section-Block In-Place Replacer:
 * Splits POSTMORTEMS.md into discrete section blocks to ensure matching entries
 * are updated in-place without erasing surrounding or intervening postmortem records.
 */
function updateOrAppendPostmortemBlock(
  pmContent: string,
  filePath: string,
  fp: string,
  timestamp: string,
  source: string,
  symptom: string,
  lintEvidence: string,
  diagnosis: string,
  rule: string
): { updatedContent: string; occurrenceCount: number; isEscalated: boolean; status: 'active' | 'escalated' } {
  const blocks = pmContent.split(/\n(?=### )/);
  const fpSearchTag = `**FINGERPRINT:** \`${fp}\``;

  let targetBlockIndex = -1;
  let priorCount = 0;

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i] || '';
    if (block.includes(filePath) && block.includes(fpSearchTag)) {
      targetBlockIndex = i;
      const countMatch = block.match(/\(Occurrences: (\d+)\)/);
      if (countMatch && countMatch[1]) {
        priorCount = parseInt(countMatch[1], 10);
      } else {
        priorCount = 1;
      }
      break;
    }
  }

  const occurrenceCount = priorCount + 1;
  const isEscalated = occurrenceCount >= OCCURRENCE_ESCALATION_THRESHOLD;
  const status: 'active' | 'escalated' = isEscalated ? 'escalated' : 'active';

  const updatedBlock = `### ❌ [${timestamp}] ${filePath} \`source: ${source}\`\n` +
    `**Symptom:** ${symptom}\n` +
    `**EVIDENCE (Machine-Copied Fact):**\n\`\`\`\n${lintEvidence.trim()}\n\`\`\`\n` +
    `**DIAGNOSIS:** ${diagnosis}\n` +
    `**CONSTRAINT (Model Generalization):** ${rule}\n` +
    `**FINGERPRINT:** \`${fp}\` (Occurrences: ${occurrenceCount})\n` +
    `**STATUS:** ${isEscalated ? `⚠️ ESCALATED (Threshold of ${OCCURRENCE_ESCALATION_THRESHOLD} recurrences reached. Structural chunking / diff required)` : 'ACTIVE'}`;

  if (targetBlockIndex >= 0) {
    blocks[targetBlockIndex] = updatedBlock.trim();
  } else {
    blocks.push(updatedBlock.trim());
  }

  return {
    updatedContent: blocks.join('\n\n').trim() + '\n',
    occurrenceCount,
    isEscalated,
    status,
  };
}

let writeQueue: Promise<any> = Promise.resolve();

/**
 * Main Postmortem Ledger Writer with In-Place Discrete Block Deduplication,
 * Fresh-Fetch 409 Retry Merge, and Escalation Tracking.
 */
export function writePostmortem(
  repo: string,
  filePath: string,
  type: 'Success' | 'Failure',
  lintEvidence: string,
  token: string,
  branch?: string,
  options?: {
    source?: PostmortemSource;
    constraintRule?: string;
    symptom?: string;
    commitToGit?: boolean;
  }
): Promise<PostmortemResult> {
  const executeWrite = async (): Promise<PostmortemResult> => {
    const pmPath = 'docs/POSTMORTEMS.md';
    const timestamp = new Date().toISOString().split('T')[0];
    const source = options?.source || 'mutation-cycle';
    const fp = fingerprintError(filePath, lintEvidence);

    // Epistemic Reconciliation: When a failure occurs, immediately invalidate stale "clean" vectors on this file
    if (type === 'Failure') {
      try {
        invalidateCleanVectorsForFile(
          filePath,
          `Postmortem failure: ${options?.symptom || lintEvidence.slice(0, 100)}`
        );
      } catch (ragErr) {
        console.warn('[Postmortem RAG Invalidate Error]', ragErr);
      }
    }

    // 1. Check for Isolation Artifact Errors -> BYPASS LEDGER TO PREVENT FALSE ESCALATION
    if (type === 'Failure' && isIsolationError(lintEvidence)) {
      console.log(`[Postmortem Bypass] Isolated compilation artifact detected for ${filePath}. Skipping ledger escalation.`);
      return {
        content: '',
        hash: 'isolation_bypass',
        isEscalated: false,
        occurrenceCount: 0,
        status: 'ignored',
        fingerprint: fp,
      };
    }

    // Extract diagnosis once before retry loop
    let extractedDiagnosis = { diagnosis: '', correctivePattern: '' };
    if (type === 'Failure') {
      extractedDiagnosis = await extractDiagnosis(filePath, lintEvidence);
    }

    let retries = 5;
    while (retries > 0) {
      let pmContent = '';
      let pmSha = '';

      try {
        const fileData = await fetchFileContent(repo, pmPath, token, branch);
        pmContent = fileData.content;
        pmSha = fileData.sha;
      } catch (e) {
        pmContent = '# Neural Engine Post-Mortems\n\n## Auto-Generated Lessons & Negative Constraints\n';
      }

      // 2. Perform Block-Level In-Place Merge on FRESHLY FETCHED pmContent
      let updatedContent = '';
      let occurrenceCount = 1;
      let isEscalated = false;
      let finalStatus: 'active' | 'escalated' | 'clean_verified' = type === 'Success' ? 'clean_verified' : 'active';

      if (type === 'Failure') {
        const defaultSymptom = lintEvidence.includes('LINT REJECT') || lintEvidence.includes('SECRET_LEAKAGE') || lintEvidence.includes('UNGROUNDED') || lintEvidence.includes('STUB')
          ? 'Sanitizer Gate / Semantic Lint Rejected'
          : 'Verification Gate / AST Validation Rejected';

        const blockResult = updateOrAppendPostmortemBlock(
          pmContent,
          filePath,
          fp,
          timestamp,
          source,
          options?.symptom || defaultSymptom,
          lintEvidence,
          extractedDiagnosis.diagnosis,
          options?.constraintRule || extractedDiagnosis.correctivePattern
        );
        updatedContent = blockResult.updatedContent;
        occurrenceCount = blockResult.occurrenceCount;
        isEscalated = blockResult.isEscalated;
        finalStatus = blockResult.status;
      } else {
        const successEntry = `\n### ✅ [${timestamp}] ${filePath} \`source: ${source}\`\n` +
          `**Symptom:** Successful Verification Pass\n` +
          `**EVIDENCE:** Pattern survived compiler and heuristic gates.\n` +
          `**CONSTRAINT:** ${options?.constraintRule || lintEvidence}\n` +
          `**STATUS:** CLEAN_VERIFIED\n`;
        updatedContent = pmContent.trim() + successEntry;
      }

      const hash = await computeSHA256(updatedContent);

      // Only commit post-mortems to GitHub if explicitly enabled or when escalated to permanent skip list.
      // Transient failures during automated mutation cycles are kept in local state / memory to prevent git history pollution.
      const shouldCommit = options?.commitToGit !== undefined
        ? options.commitToGit
        : (isEscalated || source !== 'mutation-cycle');

      if (shouldCommit) {
        try {
          await commitFileUpdate(
            repo,
            pmPath,
            updatedContent,
            pmSha,
            token,
            `EMG [${source}]: ${type === 'Failure' ? `Updated post-mortem (${finalStatus}, count: ${occurrenceCount})` : 'Logged clean post-mortem'} for ${filePath}`,
            branch
          );
        } catch (commitErr: any) {
          if (commitErr.message && commitErr.message.includes('409') && retries > 1) {
            retries--;
            await new Promise((r) => setTimeout(r, 1000 + Math.random() * 1000));
            continue;
          }
          throw commitErr;
        }
      }

      return {
        content: updatedContent,
        hash,
        isEscalated,
        occurrenceCount,
        status: finalStatus,
        fingerprint: fp,
      };
    }

    throw new Error('Failed to write postmortem: Max retries exceeded on 409 Conflict.');
  };

  const op = writeQueue.then(() => executeWrite()).catch(() => executeWrite());
  writeQueue = op;
  return op;
}
