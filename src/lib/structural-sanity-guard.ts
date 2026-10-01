/* DARLEK CAAN RAG SYNTHESIS - Autonomous Generation G-182 [2026-09-20T04:14:06.309Z] */
/**
 * ── STRUCTURAL SANITY GUARD (PROGRAMMATIC AST & CODE INTEGRITY CHECK) ──
 * This module provides deterministic structural validation of code mutations.
 * It prevents regressions such as:
 *   1. Scrubbing/deleting existing functions instead of fixing bugs.
 *   2. Hallucinating imports of non-existent files or modules.
 *   3. Wrapping scripts in dummy abstraction classes.
 *   4. Massive code erasure.
 */

import { runAstDiffGate } from './ast-diff-gate';

export interface StructuralSanityViolation {
  category: 'FUNCTION_SCRUB' | 'HALLUCINATED_IMPORT' | 'CLASS_CONVERSION' | 'MASSIVE_ERASURE' | 'AST_DIFF_VIOLATION' | 'BRANDING_INJECTION';
  test: string;
  message: string;
  severity: 'high' | 'medium' | 'low';
}

export interface StructuralSanityResult {
  passed: boolean;
  score: number; // 0 to 100
  deletedFunctions: string[];
  hallucinatedImports: string[];
  violations: StructuralSanityViolation[];
}

const COMMON_PYTHON_BUILTINS: ReadonlySet<string> = new Set([
  'os', 'sys', 'math', 'json', 'time', 're', 'random', 'datetime', 'typing',
  'collections', 'itertools', 'functools', 'pathlib', 'logging', 'asyncio',
  'requests', 'numpy', 'pandas', 'pytest', 'unittest', 'flask', 'fastapi',
  'pydantic', 'torch', 'django', 'hashlib', 'sqlite3', 'urllib', 'base64',
  'abc', 'enum', 'dataclasses', 'copy', 'io', 'socket', 'threading', 'multiprocessing'
]);

const COMMON_JS_BUILTINS: ReadonlySet<string> = new Set([
  'react', 'react-dom', 'next', 'lucide-react', 'motion', 'framer-motion',
  'clsx', 'tailwind-merge', 'zod', 'axios', 'lodash', 'recharts', 'd3',
  'fs', 'path', 'os', 'crypto', 'util', 'stream', 'http', 'https', 'events',
  'buffer', 'url', 'querystring', 'child_process'
]);

const RESERVED_KEYWORDS: ReadonlySet<string> = new Set([
  'if', 'else', 'for', 'while', 'switch', 'catch', 'constructor',
  'return', 'type', 'interface', 'import', 'export', 'class', 'from', 'as', 'new', 'yield', 'await'
]);

// Pre-compiled regular expressions for optimal regex performance
const PY_DEF_REGEX = /def\s+([a-zA-Z_]\w*)\s*\(/g;
const JS_FN_REGEXES = [
  /(?:export\s+)?(?:async\s+)?function\s+([a-zA-Z_]\w*)/g,
  /(?:export\s+)?(?:const|let|var)\s+([a-zA-Z_]\w*)\s*=\s*(?:async\s*)?(?:<[^>]*>)?\s*(?:\([^)]*\)|[a-zA-Z_]\w*)\s*(?::\s*[^=]+)?\s*=>/g,
  /(?:public|private|protected|static|async|\s)+\s+([a-zA-Z_]\w*)\s*(?:<[^>]*>)?\s*\(/g,
];

const PY_IMPORT_REGEXES = [
  /from\s+([a-zA-Z0-9_.]+)\s+import/g,
  /import\s+([a-zA-Z0-9_.]+)/g,
];

const JS_IMPORT_REGEX = /(?:from|import)\s+['"]([^'"]+)['"]/g;

/**
 * Programmatically extracts function names from Python or JS/TS code with high efficiency.
 */
export function extractFunctionNames(code: string, isPython: boolean): string[] {
  const functions = new Set<string>();

  if (!code || typeof code !== 'string') {
    return [];
  }

  if (isPython) {
    PY_DEF_REGEX.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = PY_DEF_REGEX.exec(code)) !== null) {
      const fnName = match[1];
      if (fnName && (!fnName.startsWith('__') || fnName === '__init__')) {
        functions.add(fnName);
      }
    }
  } else {
    for (const regex of JS_FN_REGEXES) {
      regex.lastIndex = 0;
      let match: RegExpExecArray | null;
      while ((match = regex.exec(code)) !== null) {
        const fnName = match[1];
        if (fnName && !RESERVED_KEYWORDS.has(fnName) && fnName.length > 1) {
          functions.add(fnName);
        }
      }
    }
  }

  return Array.from(functions);
}

/**
 * Programmatically extracts local/internal module import paths from code.
 */
export function extractLocalImports(code: string, isPython: boolean): string[] {
  const localImports = new Set<string>();

  if (!code || typeof code !== 'string') {
    return [];
  }

  if (isPython) {
    for (const regex of PY_IMPORT_REGEXES) {
      regex.lastIndex = 0;
      let match: RegExpExecArray | null;
      while ((match = regex.exec(code)) !== null) {
        const mod = match[1].trim();
        const topMod = mod.split('.')[0] || '';
        if (
          mod.startsWith('.') ||
          mod.startsWith('src.') ||
          mod.startsWith('lib.') ||
          mod.startsWith('app.') ||
          (!COMMON_PYTHON_BUILTINS.has(topMod) && (mod.includes('.') || mod.startsWith('src') || mod.startsWith('lib')))
        ) {
          localImports.add(mod);
        }
      }
    }
  } else {
    JS_IMPORT_REGEX.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = JS_IMPORT_REGEX.exec(code)) !== null) {
      const impPath = match[1].trim();
      if (
        impPath.startsWith('.') ||
        impPath.startsWith('@/') ||
        impPath.startsWith('src/') ||
        impPath.startsWith('lib/')
      ) {
        localImports.add(impPath);
      }
    }
  }

  return Array.from(localImports);
}

/**
 * Normalizes import path into candidate file paths.
 */
function getCandidateFilePaths(impPath: string, isPython: boolean): string[] {
  const candidates: string[] = [impPath];

  if (isPython) {
    const asPath = impPath.replace(/\./g, '/');
    candidates.push(`${asPath}.py`);
    candidates.push(`${asPath}/__init__.py`);
    candidates.push(asPath);
  } else {
    let clean = impPath;
    if (clean.startsWith('@/')) {
      clean = `src/${clean.slice(2)}`;
    } else if (clean.startsWith('./') || clean.startsWith('../')) {
      clean = clean.replace(/^\.\//, '');
    }

    candidates.push(clean);
    candidates.push(`${clean}.ts`);
    candidates.push(`${clean}.tsx`);
    candidates.push(`${clean}.js`);
    candidates.push(`${clean}.jsx`);
    candidates.push(`${clean}/index.ts`);
    candidates.push(`${clean}/index.tsx`);
  }

  return candidates;
}

/**
 * Deterministic Structural Sanity Guard.
 */
export function validateStructuralSanity(
  originalCode: string,
  proposedCode: string,
  filePath: string,
  repoFiles: Array<string | { path: string }> = [],
  newFiles: Array<{ path: string; content?: string }> = []
): StructuralSanityResult {
  const safeOriginal = originalCode ?? '';
  const safeProposed = proposedCode ?? '';
  const isPython = filePath.endsWith('.py');
  const violations: StructuralSanityViolation[] = [];
  let score = 100;

  // 1. FUNCTION DELETION / SCRUBBING CHECK
  const origFuncs = extractFunctionNames(safeOriginal, isPython);
  const propFuncs = new Set(extractFunctionNames(safeProposed, isPython));
  const deletedFunctions = origFuncs.filter((f) => !propFuncs.has(f));

  if (origFuncs.length >= 3 && deletedFunctions.length > 0) {
    const scrubRatio = deletedFunctions.length / origFuncs.length;
    if (deletedFunctions.length >= 3 && scrubRatio > 0.4) {
      score -= Math.min(50, Math.round(scrubRatio * 100));
      violations.push({
        category: 'FUNCTION_SCRUB',
        test: 'Function Preservation Guard',
        message: `STRUCTURAL SCRUB: Original file contained ${origFuncs.length} functions, but proposed code deleted ${deletedFunctions.length} function(s) (${deletedFunctions.slice(0, 6).join(', ')}${deletedFunctions.length > 6 ? '...' : ''}).`,
        severity: 'high',
      });
    } else if (deletedFunctions.length > 0) {
      score -= 15;
      violations.push({
        category: 'FUNCTION_SCRUB',
        test: 'Function Preservation Warning',
        message: `Function(s) [${deletedFunctions.join(', ')}] were modified or removed in the proposed mutation.`,
        severity: 'medium',
      });
    }
  }

  // 2. HALLUCINATED IMPORT CHECK
  const localImports = extractLocalImports(safeProposed, isPython);
  const hallucinatedImports: string[] = [];

  const knownFiles = new Set<string>([
    ...repoFiles.map((f) => (typeof f === 'string' ? f : f.path).toLowerCase()),
    ...newFiles.map((f) => f.path.toLowerCase()),
    filePath.toLowerCase(),
  ]);

  if (knownFiles.size >= 5 && localImports.length > 0) {
    const knownFilesArray = Array.from(knownFiles);
    for (const imp of localImports) {
      const candidatePaths = getCandidateFilePaths(imp, isPython);
      const exists = candidatePaths.some((cand) => {
        const lowerCand = cand.toLowerCase();
        return knownFilesArray.some(
          (kf) => kf === lowerCand || kf.endsWith(`/${lowerCand}`) || kf.endsWith(lowerCand) || lowerCand.endsWith(kf)
        );
      });

      if (!exists) {
        hallucinatedImports.push(imp);
      }
    }

    if (hallucinatedImports.length >= 3) {
      score -= hallucinatedImports.length * 20;
      violations.push({
        category: 'HALLUCINATED_IMPORT',
        test: 'Import Target Verification',
        message: `HALLUCINATED IMPORT DETECTED: Proposed code imports module(s) [${hallucinatedImports.join(', ')}] which do NOT exist in the repository or newFiles list.`,
        severity: 'high',
      });
    } else if (hallucinatedImports.length > 0) {
      score -= hallucinatedImports.length * 10;
      violations.push({
        category: 'HALLUCINATED_IMPORT',
        test: 'Import Target Verification',
        message: `Import Target Warning: Module(s) [${hallucinatedImports.join(', ')}] not found in scanned file list.`,
        severity: 'medium',
      });
    }
  }

  // 3. MASSIVE CODE ERASURE CHECK
  const origTrimmedLen = safeOriginal.trim().length;
  const propTrimmedLen = safeProposed.trim().length;
  if (origTrimmedLen > 250 && propTrimmedLen < origTrimmedLen * 0.35) {
    score -= 40;
    violations.push({
      category: 'MASSIVE_ERASURE',
      test: 'Code Size & Coverage Check',
      message: `MASSIVE CODE ERASURE: Proposed code is ${Math.round((safeProposed.length / (safeOriginal.length || 1)) * 100)}% of original length (${safeOriginal.length} chars -> ${safeProposed.length} chars). Logic was likely scrubbed.`,
      severity: 'high',
    });
  }

  // 4. CLASS CONVERSION / DUMMY DELEGATION CHECK
  if (isPython) {
    const origClassCount = (safeOriginal.match(/class\s+/g) || []).length;
    const propClassCount = (safeProposed.match(/class\s+/g) || []).length;
    if (origClassCount === 0 && propClassCount > 0 && deletedFunctions.length >= 3) {
      score -= 30;
      violations.push({
        category: 'CLASS_CONVERSION',
        test: 'Anti-Abstraction Guard',
        message: `CLASS CONVERSION SCRUB: Standalone functions were deleted and wrapped into an abstraction class structure.`,
        severity: 'high',
      });
    }
  }

  // 5. AST DIFF GATE (DETERMINISTIC AST & BRANDING INJECTION CHECK)
  const astDiff = runAstDiffGate(safeOriginal, safeProposed, filePath);
  if (astDiff && astDiff.violations) {
    for (const astViolation of astDiff.violations) {
      if (astViolation.code === 'AST_SYMBOL_DROPPED' && violations.some((v) => v.category === 'FUNCTION_SCRUB')) {
        continue;
      }

      const cat: StructuralSanityViolation['category'] =
        astViolation.code === 'BRANDING_INJECTION' ? 'BRANDING_INJECTION' : 'AST_DIFF_VIOLATION';

      score -= astViolation.severity === 'high' ? 30 : 15;
      violations.push({
        category: cat,
        test: `AST Diff Gate (${astViolation.code})`,
        message: astViolation.message,
        severity: astViolation.severity,
      });
    }
  }

  score = Math.max(0, score);
  const passed = !violations.some((v) => v.severity === 'high');

  return {
    passed,
    score,
    deletedFunctions,
    hallucinatedImports,
    violations,
  };
}

// Autonomous RAG Resilience Guard
export const __rag_resilience_verified__ = Object.freeze({
  generation: 182,
  timestamp: "2026-09-20T04:14:06.309Z",
  ragEngine: "DARLEK_CAAN_HYBRID_RAG"
});