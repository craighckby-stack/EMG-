/**
 * DARLEK CANN ARCHITECTURAL HEADER
 * File: server.ts
 * Role: Core system component participating in autonomous cognitive evolution cycles.
 * Architecture: Type-safe modular unit with resilient state interfaces.
 */

import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import dotenv from 'dotenv';
import ts from 'typescript';
import { spawnSync } from 'child_process';
import { validateEnv } from './lib/env-validator';

dotenv.config();

function isMarkdownFile(filePath: string): boolean {
  if (!filePath || typeof filePath !== 'string') return false;
  const normalized = filePath.trim().toLowerCase();
  if (/\.(md|markdown|mdx|txt)$/i.test(normalized)) return true;
  if (
    /\.(js|jsx|ts|tsx|mjs|cjs|json|py|rs|go|c|cpp|h|hpp|css|scss|html|yaml|yml|sh|bash|zsh|toml|ini|env|sql|xml|svg|wasm)$/i.test(
      normalized
    )
  ) {
    return false;
  }
  const basename = normalized.split('/').pop()?.split('\\').pop() || '';
  return /^(readme|license|changelog|contributing|authors|notice|security)(\.[a-z0-9_-]+)?$/i.test(basename);
}

// Server-side Secret & Token Sanitizer
function sanitizeServerSecrets(rawText: string): { text: string; count: number } {
  if (!rawText || typeof rawText !== 'string') return { text: '', count: 0 };
  let text = rawText;
  let count = 0;

  const patterns = [
    { name: 'ghp', regex: /\bghp_[a-zA-Z0-9]{36,255}\b/g, rep: '[REDACTED_GH_PAT]' },
    { name: 'gh_pat', regex: /\bgithub_pat_[a-zA-Z0-9_]{80,255}\b/g, rep: '[REDACTED_GH_FINE_PAT]' },
    { name: 'gho', regex: /\bgho_[a-zA-Z0-9]{36,255}\b/g, rep: '[REDACTED_GH_OAUTH]' },
    { name: 'gh_token', regex: /\b(?:ghu|ghs|ghr)_[a-zA-Z0-9]{36,255}\b/g, rep: '[REDACTED_GH_SERVER_TOKEN]' },
    { name: 'gemini', regex: /\bAIza[0-9A-Za-z-_]{35}\b/g, rep: '[REDACTED_GEMINI_KEY]' },
    { name: 'openai', regex: /\bsk-(?:proj-|live-|test-|admin-)?[a-zA-Z0-9_\-]{24,}\b/g, rep: '[REDACTED_OPENAI_KEY]' },
    { name: 'anthropic', regex: /\bsk-ant-[a-zA-Z0-9_\-]{24,}\b/g, rep: '[REDACTED_ANTHROPIC_KEY]' },
    { name: 'stripe', regex: /\b(?:sk|rk|pk)_(?:live|test)_[0-9a-zA-Z]{24,}\b/g, rep: '[REDACTED_STRIPE_KEY]' },
    { name: 'aws', regex: /\b(?:AKIA|ABIA|ACCA|ASIA)[0-9A-Z]{16}\b/g, rep: '[REDACTED_AWS_KEY]' },
    { name: 'privkey', regex: /-----BEGIN (?:[A-Z0-9 ]+ )?PRIVATE KEY-----[\s\S]*?-----END (?:[A-Z0-9 ]+ )?PRIVATE KEY-----/g, rep: '[REDACTED_PRIVATE_KEY_BLOCK]' },
    { name: 'jwt', regex: /\beyJ[a-zA-Z0-9_-]{10,}\.eyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}\b/g, rep: '[REDACTED_JWT_TOKEN]' },
  ];

  for (const p of patterns) {
    const matches = text.match(p.regex);
    if (matches) {
      count += matches.length;
      text = text.replace(p.regex, p.rep);
    }
  }

  return { text, count };
}

// Run startup diagnostic health check via lib/env-validator
const envValidation = validateEnv();
if (!envValidation.valid) {
  console.warn(`[DIAGNOSTIC] Missing environment configuration variables: ${envValidation.missing.join(', ')}`);
} else {
  console.log(`[DIAGNOSTIC] Environment validation succeeded. Kernel initialized in ${process.env.NODE_ENV || 'development'} mode.`);
}

async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || '3000', 10);

  app.use(express.json({ limit: '10mb' }));

  // Diagnostic health endpoint
  app.get('/api/diagnostic', (_req, res) => {
    const check = validateEnv();
    res.json({
      kernel: 'EMG Core',
      status: check.valid ? 'HEALTHY' : 'DEGRADED',
      missing: check.missing,
      nodeEnv: process.env.NODE_ENV || 'development',
      debugMode: process.env.DEBUG_MODE === 'true',
      memoryPath: process.env.MEMORY_PATH || './memory',
      timestamp: new Date().toISOString(),
    });
  });

  // Check API status and environment injection
  app.get('/api/status', (_req, res) => {
    const serverKey = process.env.GEMINI_API_KEY;
    const hasServerKey = Boolean(serverKey && serverKey.trim().length > 0 && serverKey !== 'MY_GEMINI_API_KEY');

    res.json({
      status: 'ok',
      hasServerGeminiKey: hasServerKey,
      autoInjected: hasServerKey,
      defaultModel: 'gemini-3.7-flash',
      supportedModels: [
        { id: 'gemini-3.7-flash', label: 'Gemini 3.7 Flash (Default, State-of-the-Art)', description: 'Ultra-fast & cutting-edge code synthesis' },
        { id: 'gemini-3.6-flash', label: 'Gemini 3.6 Flash', description: 'Fast, high efficiency neural generation' },
        { id: 'gemini-3.1-pro-preview', label: 'Gemini 3.1 Pro (Deep Complex Reasoning)', description: 'Maximum reasoning depth for complex ASTs' },
      ],
    });
  });

  // GitHub user repositories proxy
  app.post('/api/github/user-repos', async (req, res) => {
    try {
      const { token } = req.body;
      if (!token || typeof token !== 'string') {
        return res.status(400).json({ error: 'GitHub Token is required.' });
      }
      const response = await fetch(
        'https://api.github.com/user/repos?per_page=100&sort=updated&affiliation=owner,collaborator,organization_member',
        {
          headers: {
            Accept: 'application/vnd.github.v3+json',
            Authorization: `Bearer ${token.trim()}`,
            'User-Agent': 'EMG-Core',
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        return res.status(response.status).json({
          error: `GitHub error (${response.status}): ${errorText}`,
        });
      }

      const data = await response.json();
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err?.message || 'Failed to fetch repositories' });
    }
  });

  // GitHub repo details proxy
  app.post('/api/github/repo-details', async (req, res) => {
    try {
      const { repo, token } = req.body;
      if (!repo) {
        return res.status(400).json({ error: 'Repository name is required.' });
      }
      const cleanRepo = repo.trim().replace(/^https:\/\/github\.com\//, '').replace(/\/$/, '');
      const headers: Record<string, string> = {
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'EMG-Core',
      };
      if (token && typeof token === 'string' && token.trim()) {
        headers.Authorization = `Bearer ${token.trim()}`;
      }

      const response = await fetch(`https://api.github.com/repos/${cleanRepo}`, { headers });
      if (!response.ok) {
        const errorText = await response.text();
        return res.status(response.status).json({
          error: `GitHub error (${response.status}): ${errorText}`,
        });
      }
      const data = await response.json();
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err?.message || 'Failed to fetch repository details' });
    }
  });

  // GitHub repo file tree proxy
  app.post('/api/github/repo-tree', async (req, res) => {
    try {
      const { repo, branch, token } = req.body;
      if (!repo) {
        return res.status(400).json({ error: 'Repository name is required.' });
      }
      const cleanRepo = repo.trim().replace(/^https:\/\/github\.com\//, '').replace(/\/$/, '');
      const targetBranch = branch || 'main';
      const headers: Record<string, string> = {
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'EMG-Core',
      };
      if (token && typeof token === 'string' && token.trim()) {
        headers.Authorization = `Bearer ${token.trim()}`;
      }

      const response = await fetch(
        `https://api.github.com/repos/${cleanRepo}/git/trees/${targetBranch}?recursive=1`,
        { headers }
      );
      if (!response.ok) {
        const errorText = await response.text();
        return res.status(response.status).json({
          error: `GitHub error (${response.status}): ${errorText}`,
        });
      }
      const data = await response.json();
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err?.message || 'Failed to fetch repository tree' });
    }
  });

  // GitHub file content proxy
  app.post('/api/github/file-content', async (req, res) => {
    try {
      const { repo, filePath, token, branch } = req.body;
      if (!repo || !filePath) {
        return res.status(400).json({ error: 'Repository and filePath are required.' });
      }
      const cleanRepo = repo.trim().replace(/^https:\/\/github\.com\//, '').replace(/\/$/, '');
      const headers: Record<string, string> = {
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'EMG-Core',
      };
      if (token && typeof token === 'string' && token.trim()) {
        headers.Authorization = `Bearer ${token.trim()}`;
      }

      let url = `https://api.github.com/repos/${cleanRepo}/contents/${filePath}`;
      if (branch && typeof branch === 'string' && branch.trim()) {
        url += `?ref=${encodeURIComponent(branch.trim())}`;
      }

      const response = await fetch(url, { headers });
      if (!response.ok) {
        const errorText = await response.text();
        return res.status(response.status).json({
          error: `GitHub error (${response.status}): ${errorText}`,
        });
      }
      const data = await response.json();
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err?.message || 'Failed to fetch file content' });
    }
  });

  // GitHub commit file proxy
  app.post('/api/github/commit-file', async (req, res) => {
    try {
      const { repo, filePath, content, sha, token, commitMessage, branch } = req.body;
      if (!repo || !filePath || !token) {
        return res.status(400).json({ error: 'Repository, filePath, and token are required for commit.' });
      }
      const cleanRepo = repo.trim().replace(/^https:\/\/github\.com\//, '').replace(/\/$/, '');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        Accept: 'application/vnd.github.v3+json',
        Authorization: `Bearer ${token.trim()}`,
        'User-Agent': 'EMG-Core',
      };

      const reqBody: any = {
        message: commitMessage || `EMG Core: Update ${filePath}`,
        content,
        sha,
      };
      if (branch && branch.trim()) {
        reqBody.branch = branch.trim();
      }

      const response = await fetch(
        `https://api.github.com/repos/${cleanRepo}/contents/${filePath}`,
        {
          method: 'PUT',
          headers,
          body: JSON.stringify(reqBody),
        }
      );
      if (!response.ok) {
        const errorText = await response.text();
        return res.status(response.status).json({
          error: `GitHub commit error (${response.status}): ${errorText}`,
        });
      }
      const data = await response.json();
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err?.message || 'Failed to commit file update' });
    }
  });

  // Optimize endpoint using @google/genai
  app.post('/api/optimize', async (req, res) => {
    try {
      const { code, filePath, customApiKey, goal, model, postmortemConstraints } = req.body;

      if (!code || typeof code !== 'string') {
        return res.status(400).json({ error: 'Missing source code to optimize.' });
      }

      const apiKey = (customApiKey && customApiKey.trim().length > 0)
        ? customApiKey.trim()
        : process.env.GEMINI_API_KEY?.trim();

      // Map any deprecated model names seamlessly
      let targetModel = model || 'gemini-3.7-flash';
      if (targetModel === 'gemini-2.5-flash' || targetModel === 'gemini-2.0-flash' || targetModel === 'gemini-1.5-flash') {
        targetModel = 'gemini-3.6-flash';
      }

      if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
        return res.status(400).json({
          error: 'No Gemini API key detected. Please configure GEMINI_API_KEY in Secrets or provide a key in the settings panel.',
          needsKey: true,
        });
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const isMarkdown = isMarkdownFile(filePath);

      const codeDirectives: Record<string, string> = {
        performance: 'Focus heavily on execution speed, memory footprint reduction, caching, avoiding unnecessary allocations, loop unrolling where sensible, and data structure efficiency.',
        security: 'Focus on defensive input validation, eliminating potential injection/overflow vulnerabilities, volatile memory safety, and strict bounds checking.',
        'type-safety': 'Focus on exhaustive TypeScript types, eliminating "any", strict generic constraints, narrowing, and robust runtime contracts.',
        readability: 'Focus on pristine modern idioms, descriptive naming, modular decomposition, and clean architectural clarity.',
        comprehensive: 'Perform a comprehensive overhaul: optimize performance, maximize type-safety, enhance memory efficiency, and ensure robust error handling.',
      };

      const markdownDirectives: Record<string, string> = {
        performance: 'Enhance structure with skimmable executive summaries, streamlined tables of contents, and concise section breakdowns.',
        security: 'Ensure security guidelines, disclosure sections, vulnerability reporting instructions, and best practice warnings are clearly formatted.',
        'type-safety': 'Ensure all code snippets within the document have explicit language tags, correct type signatures in examples, and clean markdown block formatting.',
        readability: 'Improve prose clarity, eliminate ambiguity, standardize markdown heading hierarchy, fix spelling/grammar, and align tables.',
        comprehensive: 'Perform a comprehensive documentation overhaul: polish prose, fix formatting/grammar, standardize headings, and ensure all code snippets are properly annotated.',
      };

      const directive = isMarkdown
        ? (markdownDirectives[goal] || markdownDirectives['comprehensive'])
        : (codeDirectives[goal] || codeDirectives['comprehensive']);

      const postmortemBlock = (postmortemConstraints && postmortemConstraints.trim())
        ? `\nCRITICAL CONSTRAINTS FROM PAST POST-MORTEMS (MUST FOLLOW):\n${postmortemConstraints}\n`
        : '';

      const isPython = (filePath || '').toLowerCase().endsWith('.py');
      const pythonDirectives = isPython
        ? `
8. PYTHON MODERN TYPING (PEP 585 & PEP 604):
   - For Python 3.9+, strictly use built-in generic collections (list[int], dict[str, Any], tuple[...], set[T]) and PEP 604 union syntax (A | B, int | None).
   - NEVER import or use List, Dict, Tuple, Set, Union from 'typing' (which triggers PEP 585 / Ruff UP006 & UP035 deprecations).
   - In TypeVar definitions, do NOT use redundant 'bound=Any' (use TypeVar("T"), not TypeVar("T", bound=Any)).
9. STRICT PRESERVATION OF AUTHORSHIP & CREDITS:
   - Retain all existing author, creator, contributor, date, license, and copyright comments (e.g., "Author:", "@author", "Date:"). Do NOT strip open-source attribution blocks from module or function docstrings.
10. PROHIBITION ON ARTIFICIAL RUNTIME TYPE GUARDS / PARAMETER RESTRICTIONS:
   - NEVER inject artificial runtime 'isinstance()' checks or raise TypeErrors on function arguments unless they were already present in the original code.
   - Respect Python duck typing and polymorphic inputs (e.g. str | bytes | IO[str], file streams, StringIO, path objects). Narrowing types or asserting 'if not isinstance(x, str): raise TypeError(...)' breaks valid callers and stream handling.
   - In algorithmic, mathematical, or recursive functions, do NOT inject redundant 'isinstance()' checks inside recursive calls or tight loops that degrade asymptotic algorithmic speed. Rely on clean type annotations instead.
11. PUBLIC API TYPING & GENERATOR CONVENTIONS:
   - For generator functions in library public APIs, annotate return type as 'Iterator[T]' (from collections.abc), NOT verbose 'Generator[T, None, None]'.
   - NEVER add unused typing imports (e.g. importing 'Callable' or 'Any' when they are not referenced anywhere in annotations or code).
12. PYTHON 3.12+ RAW STRING DOCSTRINGS & REGEX LITERALS:
   - Any docstring, comment, or string containing regex patterns or backslash escapes (e.g. \\s, \\d, \\w, \\b) MUST use a raw string literal (r"""...""" or r'''...''') to prevent Python 3.12+ SyntaxWarning/SyntaxError for invalid escape sequences.
13. SAFE TEST SUITES:
   - In pytest/unittest test files, do NOT place raw module-level file reads or assertions that crash test discovery when assets are missing. Keep I/O inside test functions or pytest fixtures.
14. CROSS-FUNCTION BEHAVIORAL PARITY & DOMAIN SYMMETRY:
   - Audit sibling functions within the same module for input domain consistency and mathematical symmetry.
   - If one function handles a broader or generalized input domain (e.g., negative numbers via abs(), zero, or general edge cases) while a sibling function artificially restricts or crashes on valid inputs with bare asserts, unify and generalize the input handling across the module.
   - Do NOT merely wrap an artificial limitation in a prettier ValueError if the algorithm can be cleanly generalized using the symmetrical techniques already demonstrated by its sibling functions in the same file.
15. MANDATORY 'from __future__ import annotations' & IMPORT-SAFE TYPE ANNOTATIONS:
   - When adding modern type annotations in Python, ALWAYS include 'from __future__ import annotations' as the very first import statement in the module (immediately after docstrings).
   - NEVER invent or use non-existent submodules in type annotations (e.g. use 'sql.TokenList' or 'sql.Statement', NEVER 'sql.statement.TokenList').
   - Only reference types that are directly imported or exist on the imported namespace.
16. STRICT PRESERVATION OF TEST CASES & ZERO TEST DELETION:
   - In test files, NEVER delete, truncate, stub out, or weaken existing test methods, assertions, or test cases. Every single existing test function and test assertion must remain present and intact.
   - NEVER replace a full test suite with an illustrative sample snippet or a 1-line reproduction.
17. MANDATORY FULL-FILE EMISSION (NEVER OMIT IMPORTS OR HEADERS):
   - You MUST output the ENTIRE file from the very first line (including all shebangs, license headers, module docstrings, and imports) to the very last line.
   - NEVER start output after imports or assume imports are retained. Omitting imports causes fatal NameError crashes at runtime.
18. ZERO HALLUCINATED SIBLING IMPORTS:
   - NEVER import classes, functions, or submodules from sibling packages that do not exist. Always verify the imports present in the original codebase.`
        : '';

      const prompt = `You are EMG Core Neural Code and Documentation Optimizer Engine.
File Path: "${filePath || (isMarkdown ? 'README.md' : 'source.ts')}"
Optimization Goal: ${(goal || 'comprehensive').toUpperCase()} - ${directive}
${postmortemBlock}
Original ${isMarkdown ? 'Markdown Document' : 'Source Code'}:
\`\`\`
${code}
\`\`\`

CRITICAL Requirements:
1. Optimize, modernize, and enhance this ${isMarkdown ? 'markdown document' : 'source code'} strictly according to the goal.
2. ${
  isMarkdown
    ? 'Preserve all essential links, factual information, and document structure while improving clarity, formatting, and completeness.'
    : 'Maintain all business logic, export names, function signatures, and external API contracts intact. Ensure all brackets, braces, parentheses, quotes, and language syntax are 100% syntactically valid and balanced.'
}
3. ${
  isMarkdown
    ? 'Output the complete optimized markdown between @@@START and @@@END.'
    : 'Output raw executable source code ONLY between delimiters @@@START and @@@END. Do NOT include markdown code fences (like ```javascript) inside @@@START and @@@END. Do NOT output conversational or introductory text.'
}
4. ABSOLUTE PROHIBITION ON UNVERIFIABLE SELF-PRAISE: Do NOT include self-praising adjectives or marketing claims in comments, headers, or docstrings (such as "production-grade", "hardened", "leak-free", "fully optimized", "state-of-the-art"). Keep all code documentation strictly technical, neutral, and factual.
5. ABSOLUTE PROHIBITION ON UNGROUNDED QUANTITATIVE CLAIMS: Do NOT invent fabricated-sounding statistics, percentages, benchmark scores, or cycle counts in comments or docstrings (such as "340% latency reduction", "accuracy of 0.85", "within 4 cycles") unless derived from an actual computation or data source in the diff. Mark stubs/placeholders explicitly ("not yet computed").
6. TRUNCATION PREVENTATIVE RULE: Output complete, unbroken source code from start to end. Keep template literals concise and do not emit monolithic multi-line template strings that risk output token truncation.
7. COMMENT, DOCSTRING & LICENSE PRESERVATION: Do NOT delete or truncate existing comments, explanatory notes, module-level docstrings, or copyright/license headers (SPDX, MIT, Apache, BSD). Preserve them verbatim. Do NOT collapse multi-line docstrings into one line.
8. TEST PRESERVATION INVIOLABILITY: In any test file (or code containing test functions/assertions), you must NEVER delete, omit, or comment out any test case, test function, or assertion. Every test case must remain present and executable.
9. TARGET FRAMEWORK & MULTI-LANGUAGE SAFETY:
   - C# (.NET): Target framework is .NET 8 LTS. Do NOT use .NET 9+ exclusive types such as System.Threading.Lock. Always use 'private readonly object _lock = new object();'. Ensure property accessor syntax is '{ get; init; }' or '{ get; set; }', never '{ get.init; }'. Never invent undefined types or mutate interface signatures in isolation.
   - Go: Do not invent non-existent types, struct fields, or methods (e.g., ConflictStrategy, metrics.Enabled, agentmesh.Identity). Maintain standard Go package and export visibility.
   - Python: Ensure all type annotations (Any, Optional, Union, Callable, etc.) have explicit imports from typing. Never reference pytest without importing it.
   - JavaScript/TypeScript: Never alter test assertions to use 'process.env.* || \'\'' or empty strings that make assertions trivially true or tautological.
10. POSIX TRAILING NEWLINE: Ensure the source code terminates with a single trailing newline.
11. SATURATION EQUILIBRIUM PROTOCOL: If the provided code is already idiomatic, type-safe, well-documented, and completely optimal under the goal, do NOT invent cosmetic or churn edits. Output ONLY: @@@START NO_CHANGES_NEEDED @@@END
12. Output a 1-sentence summary of enhancements immediately after @@@SUMMARY:${pythonDirectives}`;

      const startTime = performance.now();

      // List of candidate models to try with robust fallbacks
      const candidateModels = [
        targetModel,
        'gemini-3.7-flash',
        'gemini-3.6-flash',
        'gemini-flash-lite-latest',
        'gemini-2.5-flash',
        'gemini-1.5-flash',
        'gemini-3.1-pro-preview',
      ].filter((m, idx, arr) => arr.indexOf(m) === idx);

      let response: any = null;
      let lastErr: any = null;
      let usedModel = targetModel;

      for (const m of candidateModels) {
        try {
          const genConfig: any = {
            temperature: 0.2,
          };

          if (m === 'gemini-3.1-pro-preview') {
            genConfig.thinkingConfig = { thinkingLevel: ThinkingLevel.HIGH };
            // Do not set maxOutputTokens for high thinking mode
          } else {
            genConfig.maxOutputTokens = 8192;
          }

          response = await ai.models.generateContent({
            model: m,
            contents: prompt,
            config: genConfig,
          });
          usedModel = m;
          break;
        } catch (err: any) {
          lastErr = err;
          // If model has error (rate-limit, not found, or 503), try the next candidate model
          continue;
        }
      }

      if (!response) {
        const rawErrMsg = String(lastErr?.message || lastErr || '').toLowerCase();
        const isCapacityOrRateLimit =
          rawErrMsg.includes('429') ||
          rawErrMsg.includes('503') ||
          rawErrMsg.includes('unavailable') ||
          rawErrMsg.includes('resource_exhausted') ||
          rawErrMsg.includes('quota exceeded') ||
          rawErrMsg.includes('rate-limits') ||
          rawErrMsg.includes('high demand') ||
          rawErrMsg.includes('quota');

        if (isCapacityOrRateLimit) {
          const isQuota = rawErrMsg.includes('quota') || rawErrMsg.includes('resource_exhausted');
          // Extract retry delay if available in the error message
          let retryDelay = '';
          const match = rawErrMsg.match(/retry in\s+([0-9.]+)s/i);
          if (match && match[1]) {
            retryDelay = ` (retry in ~${Math.ceil(parseFloat(match[1]))}s)`;
          }

          const prefix = isQuota ? 'Gemini API Quota Exceeded' : 'Gemini API model capacity / high demand reached';

          return res.status(429).json({
            error: `${prefix}${retryDelay}. The loop has been auto-paused. Please wait a moment or switch models.`,
            isRateLimit: true,
            isQuota,
            raw: String(lastErr?.message || lastErr || ''),
          });
        }

        throw lastErr || new Error('All model candidates are currently experiencing high demand.');
      }

      const rawText = response.text || '';
      let optimized = '';
      let summary = isMarkdown
        ? 'Enhanced documentation structure, standard headings, and language tags.'
        : 'Applied neural performance and architecture optimizations.';

      // Check if output was cut off mid-generation due to max output tokens ceiling
      const candidateFinish = response.candidates?.[0]?.finishReason;
      const wasTokenTruncated = candidateFinish === 'MAX_TOKENS' || candidateFinish === 'LENGTH';

      if (rawText.includes('@@@SUMMARY:')) {
        const summaryPart = rawText.split('@@@SUMMARY:')[1].trim().split('\n')[0];
        if (summaryPart) {
          summary = summaryPart;
        }
      }

      if (rawText.includes('@@@START')) {
        let snippet = rawText.split('@@@START')[1] || '';
        if (snippet.includes('@@@END')) {
          snippet = snippet.split('@@@END')[0] || '';
        } else if (snippet.includes('@@@SUMMARY:')) {
          snippet = snippet.split('@@@SUMMARY:')[0] || '';
        }
        optimized = snippet.trim();
      } else {
        let cleaned = rawText;
        if (cleaned.includes('@@@SUMMARY:')) {
          cleaned = cleaned.split('@@@SUMMARY:')[0];
        }
        cleaned = cleaned.trim();

        // Extract from markdown code fence if present
        // If multiple code fences exist, pick the longest block so we never accidentally take a 1-line snippet
        if (!isMarkdown) {
          const fenceMatches = Array.from(cleaned.matchAll(/```(?:[a-zA-Z0-9_-]+)?\s*\n([\s\S]*?)(?:\n```|$)/g)) as RegExpMatchArray[];
          if (fenceMatches.length > 0) {
            const longest = fenceMatches.reduce((max: string, m: RegExpMatchArray) => {
              const content = m[1] || '';
              return content.length > max.length ? content : max;
            }, '');
            if (longest.trim().length > 0) {
              cleaned = longest.trim();
            }
          } else if (cleaned.startsWith('```')) {
            cleaned = cleaned.replace(/^```[a-z0-9_-]*\n?/i, '').replace(/\n?```$/i, '').trim();
          }
        }
        optimized = cleaned;
      }

      // Strip residual delimiters or outer markdown fences
      if (optimized.includes('@@@SUMMARY:')) {
        optimized = optimized.split('@@@SUMMARY:')[0].trim();
      }
      if (optimized.includes('@@@END')) {
        optimized = optimized.split('@@@END')[0].trim();
      }
      // Remove any leaked protocol delimiters or markers
      optimized = optimized.replace(/@@@END/g, '').replace(/@@@START/g, '');
      // Strip any trailing '@' symbols or delimiter clusters
      optimized = optimized.replace(/@+\s*$/, '').trim();

      if (!isMarkdown && optimized.startsWith('```')) {
        optimized = optimized.replace(/^```[a-z0-9_-]*\n?/i, '').replace(/\n?```$/i, '').trim();
        optimized = optimized.replace(/@+\s*$/, '').trim();
      }

      // Explicit secondary check for Python source code files
      if (filePath && /\.py$/i.test(filePath)) {
        optimized = optimized.replace(/@+\s*$/, '').trim();
      }

      // Handle SATURATION EQUILIBRIUM PROTOCOL: Model signaled 0 diffs needed
      let isEquilibrium = false;
      if (optimized.trim() === 'NO_CHANGES_NEEDED' || optimized.includes('NO_CHANGES_NEEDED')) {
        optimized = code.trim();
        summary = 'Convergence equilibrium: Code is already optimal and requires no changes (0 diffs).';
        isEquilibrium = true;
      }

      // Reject token-limit truncated outputs and revert to baseline
      if (wasTokenTruncated && code && code.trim().length >= 5) {
        console.warn(`[SAFETY GATE] Model generation hit MAX_TOKENS ceiling on ${filePath || 'file'}. Preserving baseline.`);
        optimized = code.trim();
        summary = 'Preserved baseline source code: Model response was cut off mid-generation by output token limit.';
      }

      // Catastrophic Truncation & Destructive Deletion Guard
      if (code && typeof code === 'string' && code.trim().length > 10 && !isMarkdown) {
        const origLines = code.trim().split('\n');
        const optLines = optimized.trim().split('\n');

        // Check 1: Severe line count drop (>30% reduction on files >= 15 lines)
        if (origLines.length >= 15 && optLines.length < Math.floor(origLines.length * 0.70)) {
          console.warn(`[SAFETY GATE] Rejected catastrophic truncation: ${origLines.length} -> ${optLines.length} lines on ${filePath || 'file'}. Preserving baseline.`);
          optimized = code.trim();
          summary = `Preserved baseline: Candidate was rejected due to catastrophic line count reduction (${origLines.length} -> ${optLines.length} lines).`;
        }

        // Check 2: Universal test case deletion across Python, Go, C#, and JS/TS
        const isTestFile = filePath && (filePath.toLowerCase().includes('test') || /test_|_test\./.test(filePath));
        if (isTestFile) {
          const testPattern = /(?:def\s+test_|@pytest\.mark|test\s*\(|it\s*\(|func\s+Test[A-Z0-9_]|\[Fact\]|\[Test\]|\[Theory\])/g;
          const origTests = (code.match(testPattern) || []).length;
          const optTests = (optimized.match(testPattern) || []).length;
          if (origTests >= 1 && optTests < origTests) {
            console.warn(`[SAFETY GATE] Rejected test deletion: ${origTests} -> ${optTests} tests on ${filePath}. Preserving baseline.`);
            optimized = code.trim();
            summary = `Preserved baseline: Candidate deleted test cases (${origTests} -> ${optTests}). Test suites must never lose tests.`;
          }
        }

        // Check 3: Top-level module import and header stripping
        const origImports = (code.match(/^(?:import\s+|from\s+|using\s+[A-Z]|import\s*\()/gm) || []).length;
        const optImports = (optimized.match(/^(?:import\s+|from\s+|using\s+[A-Z]|import\s*\()/gm) || []).length;
        if (origImports >= 2 && optImports === 0) {
          console.warn(`[SAFETY GATE] Rejected import stripping: ${origImports} -> 0 imports on ${filePath}. Preserving baseline.`);
          optimized = code.trim();
          summary = `Preserved baseline: Candidate stripped all module imports. Top-level imports and headers must be preserved.`;
        }

        // Check 4: License and Copyright Header Stripping
        const origHasLicense = /(?:SPDX-License-Identifier:|Copyright\s+(?:\([cC]\)|©)|Licensed\s+under\s+the|Permission\s+is\s+hereby\s+granted)/i.test(code.slice(0, 2000));
        const optHasLicense = /(?:SPDX-License-Identifier:|Copyright\s+(?:\([cC]\)|©)|Licensed\s+under\s+the|Permission\s+is\s+hereby\s+granted)/i.test(optimized.slice(0, 2000));
        if (origHasLicense && !optHasLicense) {
          console.warn(`[SAFETY GATE] Rejected license/copyright header stripping on ${filePath}. Preserving baseline.`);
          optimized = code.trim();
          summary = `Preserved baseline: Candidate removed license or copyright header. License headers must be preserved verbatim.`;
        }

        // Check 5: C# Syntax typo & .NET 9 type incompatibilities
        if (filePath && /\.cs$/i.test(filePath)) {
          if (/System\.Threading\.Lock\b|\bLock\s+[a-zA-Z0-9_]+\s*=|new\s+Lock\(\)/.test(optimized)) {
            console.warn(`[SAFETY GATE] Rejected C# .NET 9 type (Lock) on ${filePath}. Preserving baseline.`);
            optimized = code.trim();
            summary = `Preserved baseline: Candidate used System.Threading.Lock (.NET 9+), incompatible with .NET 8 LTS.`;
          }
          if (/\{\s*get\.init;\s*\}|\{\s*get\.set;\s*\}/.test(optimized)) {
            console.warn(`[SAFETY GATE] Rejected C# syntax typo { get.init; } on ${filePath}. Preserving baseline.`);
            optimized = code.trim();
            summary = `Preserved baseline: Candidate contained C# syntax typo { get.init; }.`;
          }
          if (/\bAggregationEvaluation\b/.test(optimized) && !/\bAggregationEvaluation\b/.test(code)) {
            console.warn(`[SAFETY GATE] Rejected hallucinated type AggregationEvaluation on ${filePath}. Preserving baseline.`);
            optimized = code.trim();
            summary = `Preserved baseline: Candidate introduced non-existent type AggregationEvaluation.`;
          }
        }

        // Check 6: Go hallucinated symbols
        if (filePath && /\.go$/i.test(filePath)) {
          if (/\b(?:ConflictStrategy|metrics\.Enabled|agentmesh\.Identity|agentmesh\.Client)\b/.test(optimized) && !/\b(?:ConflictStrategy|metrics\.Enabled|agentmesh\.Identity|agentmesh\.Client)\b/.test(code)) {
            console.warn(`[SAFETY GATE] Rejected hallucinated Go symbol on ${filePath}. Preserving baseline.`);
            optimized = code.trim();
            summary = `Preserved baseline: Candidate introduced non-existent Go symbols.`;
          }
        }

        // Check 7: Mid-token truncation guard
        const lastLine = optimized.trimEnd().split('\n').pop() || '';
        if (/^[ \t]*(?:Session|def|class|func|return|import|from|with|if|while|for)[ \t]*[a-zA-Z0-9_]*$/.test(lastLine) && !/[;})\]:"]$/.test(lastLine)) {
          console.warn(`[SAFETY GATE] Rejected incomplete trailing statement '${lastLine.trim()}' on ${filePath}. Preserving baseline.`);
          optimized = code.trim();
          summary = `Preserved baseline: Candidate was cut off mid-statement at the end of the file.`;
        }
      }

      if (!optimized || optimized.length < 5) {
        if (code && code.trim().length >= 5) {
          optimized = code.trim();
          summary = 'Preserved baseline source code (AI model output was unparsed or empty).';
        } else {
          throw new Error('AI Model returned an empty code block and no baseline input code was provided.');
        }
      }

      const latencyMs = Math.round(performance.now() - startTime);
      const tokensEstimate = response.usageMetadata?.totalTokenCount || Math.round(rawText.length / 3.8);

      // Auto-Sanitize generated code and summary to purge any leaked tokens/API keys
      const sanitizedCodeResult = sanitizeServerSecrets(optimized);
      const sanitizedSummaryResult = sanitizeServerSecrets(summary);

      // Enforce POSIX standard: source code files must end with a single trailing newline
      let finalCode = sanitizedCodeResult.text;

      // Sanitize relative TypeScript/JavaScript import extensions (.ts/.tsx) to prevent TS5097
      if (filePath && /\.(ts|tsx|js|jsx)$/i.test(filePath)) {
        finalCode = finalCode.replace(
          /((?:import|export)\s+[\s\S]*?from\s+['"]|import\s*\(\s*['"])(\.{1,2}\/[^'"]+?)\.(?:tsx|ts|jsx)(['"]\s*\)?)/g,
          '$1$2$3'
        );
      }

      if (!isMarkdown) {
        finalCode = finalCode.trimEnd() + '\n';
      }

      return res.json({
        optimizedCode: finalCode,
        summary: sanitizedSummaryResult.text,
        latencyMs,
        tokensEstimate,
        modelUsed: usedModel,
        redactedSecretsCount: sanitizedCodeResult.count + sanitizedSummaryResult.count,
        isEquilibrium,
      });
    } catch (err: any) {
      console.error('Gemini Optimization Error:', err);
      const errMsg = err?.message || String(err) || 'Failed to run neural code optimization';
      return res.status(500).json({ error: errMsg });
    }
  });

  // External Compile / Verification Endpoint with Real Compiler & Active Output Linting Rules
  app.post('/api/lint', async (req, res) => {
    try {
      const { code, filePath, projectFiles } = req.body;
      if (!code) return res.status(400).json({ valid: false, lintEvidence: 'No code provided' });
      
      const isC = filePath.endsWith('.c') || filePath.endsWith('.cpp') || filePath.endsWith('.h') || filePath.endsWith('.hpp');
      
      let processedCode = code;
      let spliceDepth = 0;
      let hitRecursionCap = false;
      
      if (isC && projectFiles && Object.keys(projectFiles).length > 0) {
        // Splice up to 5 levels of includes to simulate a project-aware compile
        for (let i = 0; i < 5; i++) {
          const prev = processedCode;
          processedCode = processedCode.replace(/#include\s+"([^"]+)"/g, (match: string, p1: string) => {
             const basename = p1.split('/').pop();
             if (basename && projectFiles[basename]) {
                 return `/* Spliced ${p1} */\n${projectFiles[basename]}\n/* End ${p1} */`;
             }
             return match;
          });
          if (prev === processedCode) break;
          spliceDepth++;
        }
        if (spliceDepth >= 5) {
            hitRecursionCap = true;
            console.warn(`[LINTER] Splice recursion cap (5) reached for ${filePath}. Possible circular dependency or deep include chain.`);
        }
      }

      // Rule 1: NO UNVERIFIABLE SELF-DESCRIPTION / MARKETING CLAIMS IN COMMENTS
      const selfPraisePatterns = [
        /\b(?:hardened|bulletproof|production-grade|leak-free|zero-defect|flawlessly\s+verified)\b/i,
        /\b(?:fully|robustly|highly)\s+(?:optimized|hardened|secured|typed|tested)\b/i,
        /\boptimized[,\s]+(?:and\s+)?(?:fully\s+)?(?:type-safe|standards-compliant|hardened|secure|memory-safe)\b/i,
        /\b(?:optimal|perfect)\s+(?:memory\s+management|type-safety|alignment|performance)\b/i
      ];
      for (const pattern of selfPraisePatterns) {
        const match = code.match(pattern);
        if (match) {
          return res.json({
            valid: false,
            lintEvidence: `[LINT REJECT: NO_UNVERIFIABLE_SELF_PRAISE] Detected unsubstantiated self-description in commentary: "${match[0]}". Output must adhere to neutral, factual documentation without marketing adjectives.`,
            ruleName: 'NO_UNVERIFIABLE_SELF_PRAISE'
          });
        }
      }

      // Rule 1B: NO STALE DEFECT CLAIMS / SCAFFOLDING LEAKAGE (PM#8)
      const staleDefectPatterns = [
        /\bPREDICTION:\s*(?:PASSES|FAILS|REJECTED)/i,
        /\bSeeded\s+defect,\s*documented\s+in\s+BUGS\.md/i,
        /\bThe\s+poison:\s*`?[a-zA-Z0-9_]+`?\s+on\s+a\s+function/i,
        /\bnever\s+freed\s+and\s+can\s+never\s+be\s+reached\s+by\s+the\s+caller\b/i
      ];
      for (const pattern of staleDefectPatterns) {
        const match = code.match(pattern);
        if (match) {
          return res.json({
            valid: false,
            lintEvidence: `[LINT REJECT: NO_STALE_DEFECT_CLAIMS] Detected stale defect claim or test scaffolding leaked into production code: "${match[0]}". File documentation must reconcile with the actual fixed implementation.`,
            ruleName: 'NO_STALE_DEFECT_CLAIMS'
          });
        }
      }

      // Rule 1C: PYTHON MODERN TYPING (PEP 585) & REDUNDANT TYPEVAR BOUND
      const isPyFile = (filePath || '').toLowerCase().endsWith('.py');
      if (isPyFile) {
        const legacyTypingMatch = code.match(/from\s+typing\s+import\s+[^#\n]*\b(List|Dict|Tuple|Set|Union)\b/);
        if (legacyTypingMatch) {
          return res.json({
            valid: false,
            lintEvidence: `[LINT REJECT: PEP585_LEGACY_TYPING] Detected legacy typing import '${legacyTypingMatch[1]}'. Use Python 3.9+ built-in generic collections (list, dict, tuple, set) and PEP 604 union syntax (A | B) instead.`,
            ruleName: 'PEP585_LEGACY_TYPING'
          });
        }

        const redundantTypeVarMatch = code.match(/TypeVar\(\s*["'][A-Za-z0-9_]+["']\s*,\s*bound\s*=\s*Any\s*\)/);
        if (redundantTypeVarMatch) {
          return res.json({
            valid: false,
            lintEvidence: `[LINT REJECT: REDUNDANT_TYPEVAR_BOUND] Detected TypeVar with 'bound=Any'. TypeVar is already unbounded by default; omit bound=Any.`,
            ruleName: 'REDUNDANT_TYPEVAR_BOUND'
          });
        }

        // Rule 1D: UNUSED TYPING & COLLECTIONS.ABC IMPORTS
        const typingImportLines = code.match(/from\s+(?:typing|collections\.abc)\s+import\s+([^#\n]+)/g);
        if (typingImportLines) {
          for (const impLine of typingImportLines) {
            const namesPart = impLine.replace(/from\s+(?:typing|collections\.abc)\s+import\s+/, '').trim();
            const names = namesPart.split(',').map((n: string) => n.trim().split(/\s+as\s+/)[0].trim()).filter(Boolean);
            for (const name of names) {
              // Exclude names if they start with parenthesized multi-line
              const cleanName = name.replace(/[()]/g, '').trim();
              if (!cleanName || cleanName.startsWith('#')) continue;
              const regex = new RegExp(`\\b${cleanName}\\b`, 'g');
              const occurrences = (code.match(regex) || []).length;
              if (occurrences === 1) {
                return res.json({
                  valid: false,
                  lintEvidence: `[LINT REJECT: UNUSED_TYPING_IMPORT] Detected unused import '${cleanName}' from typing/collections.abc. Do not inject unused imports.`,
                  ruleName: 'UNUSED_TYPING_IMPORT'
                });
              }
            }
          }
        }

        // Rule 1E: INVALID SUBMODULE ANNOTATIONS (e.g. sql.statement.TokenList)
        if (/\bsql\.statement\b/.test(code)) {
          return res.json({
            valid: false,
            lintEvidence: `[LINT REJECT: INVALID_MODULE_ANNOTATION] Detected invalid submodule annotation 'sql.statement'. Module 'sqlparse.sql' has no attribute 'statement'; use 'sql.TokenList' or 'sql.Statement'.`,
            ruleName: 'INVALID_MODULE_ANNOTATION'
          });
        }
      }

      // Rule 2: NO DEAD CONDITIONAL CHECKS
      const deadLoopGuardPattern = /for\s*\([^)]*;\s*([a-zA-Z0-9_]+)\s*<\s*([a-zA-Z0-9_]+)[^)]*\)\s*\{[\s\S]*?if\s*\(\s*\2\s*>\s*0u?\s*\)/;
      if (deadLoopGuardPattern.test(code)) {
        return res.json({
          valid: false,
          lintEvidence: `[LINT REJECT: NO_DEAD_CONDITIONS] Detected redundant inner condition checking upper bound inside a loop already bounded by that parameter.`,
          ruleName: 'NO_DEAD_CONDITIONS'
        });
      }

      // Rule 3: NO UNUSED MACRO DEFINITIONS
      const defineMacroMatch = code.match(/#define\s+([A-Z0-9_]{3,})\b/g);
      if (defineMacroMatch) {
        for (const def of defineMacroMatch) {
          const macroName = def.replace(/#define\s+/, '').trim();
          const regex = new RegExp(`\\b${macroName}\\b`, 'g');
          let occurrences = (code.match(regex) || []).length;
          
          if (projectFiles) {
              const currentBasename = filePath.split('/').pop();
              for (const [basename, content] of Object.entries(projectFiles)) {
                  if (basename !== currentBasename) {
                      occurrences += (String(content).match(regex) || []).length;
                  }
              }
          }
          
          if (occurrences === 1) {
            return res.json({
              valid: false,
              lintEvidence: `[LINT REJECT: NO_UNUSED_MACROS] Macro '${macroName}' was defined but never applied in any function or type signature.`,
              ruleName: 'NO_UNUSED_MACROS'
            });
          }
        }
      }

      // Rule 4: NO TODO-ADJACENT-SUCCESS
      const todoAdjacentSuccessPattern = /\/\/\s*TODO[^\n]*\n\s*return\s+(?:true|0|SUCCESS|1);/i;
      if (todoAdjacentSuccessPattern.test(code)) {
        return res.json({
          valid: false,
          lintEvidence: `[LINT REJECT: TODO_ADJACENT_SUCCESS] Placeholder TODO comment detected immediately adjacent to success return statement.`,
          ruleName: 'TODO_ADJACENT_SUCCESS'
        });
      }

      // Real Compiler Check via Godbolt API for C/C++ units
      if (isC) {
        const isCpp = filePath.endsWith('.cpp') || filePath.endsWith('.hpp') || filePath.endsWith('.cc');
        const compilerId = isCpp ? 'g132' : 'cg132';
        const payload = {
            source: processedCode,
            compiler: compilerId,
            options: {
                userArguments: "-Wall -Wextra -fsyntax-only -fdiagnostics-color=never",
                executeParameters: { args: "", stdin: "" },
                compilerOptions: { executorRequest: false },
                filters: { execute: false },
                tools: [],
                libraries: []
            },
            lang: isCpp ? "c++" : "c",
            allowStoreCodeDebug: false
        };

        const gbRes = await fetch(`https://godbolt.org/api/compiler/${compilerId}/compile`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(payload)
        });
        
        if (!gbRes.ok) {
           return res.json({ valid: false, lintEvidence: 'Failed to contact Godbolt Compiler API: ' + gbRes.statusText });
        }
        
        const gbData = await gbRes.json();
        
        if (gbData.code !== 0) {
            let stderr = '';
            if (gbData.stderr && Array.isArray(gbData.stderr)) {
                stderr = gbData.stderr.map((e: any) => e.text).join('\n');
            }
            
            const lintEvidence = stderr || 'Compilation failed with no stderr output.';
            let verdict = 'INVALID';
            
            const isMissingInclude = lintEvidence.includes('No such file or directory') && lintEvidence.includes('fatal error:');
            const isUndeclared = lintEvidence.includes('undeclared') || lintEvidence.includes('unknown type name') || lintEvidence.includes('implicit declaration');
            
            let undeclaredSymbol = null;
            if (isUndeclared) {
                const match = lintEvidence.match(/(?:undeclared identifier|unknown type name|implicit declaration of function) '([^']+)'/);
                if (match) undeclaredSymbol = match[1];
            }
            
            if (isMissingInclude || isUndeclared) {
               verdict = 'NOT_VERIFIABLE_IN_ISOLATION';
            }
            
            return res.json({ valid: false, lintEvidence, verdict, undeclaredSymbol, hitRecursionCap });
        }
      }
      
      res.json({ valid: true, lintEvidence: 'Linted successfully.' });
    } catch (e) {
      res.json({ valid: false, lintEvidence: String(e) });
    }
  });

  // Native TypeScript AST & Diagnostic Validation Endpoint
  app.post('/api/validate', (req, res) => {
    try {
      const { code, filePath, originalCode } = req.body;
      if (!code || typeof code !== 'string') {
        return res.status(400).json({ error: 'Source code is required.' });
      }

      // Universal Destructive Truncation & Deletion Sanity Gate
      if (originalCode && typeof originalCode === 'string' && originalCode.trim().length > 10) {
        const origLines = originalCode.trim().split('\n').length;
        const candLines = code.trim().split('\n').length;

        // Check 1: Severe line count drop (>30% reduction on files >= 15 lines)
        if (origLines >= 15 && candLines < Math.floor(origLines * 0.70)) {
          return res.json({
            valid: false,
            diagnostics: [{
              line: candLines,
              column: 1,
              message: `Destructive Truncation: Candidate dropped from ${origLines} to ${candLines} lines (${Math.round((1 - candLines / origLines) * 100)}% deletion). Full file implementation must be preserved.`,
              code: 'DESTRUCTIVE_TRUNCATION',
              severity: 'error',
              snippet: code.slice(-100).trim(),
            }],
          });
        }

        // Check 2: Universal test case deletion across Python, Go, C#, and JS/TS
        const isTest = (filePath || '').toLowerCase().includes('test');
        if (isTest) {
          const testPattern = /(?:def\s+test_|@pytest\.mark|test\s*\(|it\s*\(|func\s+Test[A-Z0-9_]|\[Fact\]|\[Test\]|\[Theory\])/g;
          const origTests = (originalCode.match(testPattern) || []).length;
          const candTests = (code.match(testPattern) || []).length;
          if (origTests >= 1 && candTests < origTests) {
            return res.json({
              valid: false,
              diagnostics: [{
                line: 1,
                column: 1,
                message: `Destructive Test Deletion: Original test file had ${origTests} tests, but candidate has ${candTests}. Automated refactoring must never delete test cases.`,
                code: 'DESTRUCTIVE_TEST_DELETION',
                severity: 'error',
                snippet: '',
              }],
            });
          }
        }

        // Check 3: Module header & import stripping
        const origImports = (originalCode.match(/^(?:import\s+|from\s+|using\s+[A-Z]|import\s*\()/gm) || []).length;
        const candImports = (code.match(/^(?:import\s+|from\s+|using\s+[A-Z]|import\s*\()/gm) || []).length;
        if (origImports >= 2 && candImports === 0) {
          return res.json({
            valid: false,
            diagnostics: [{
              line: 1,
              column: 1,
              message: `Header Stripped: Original file contained ${origImports} import statements, but candidate contains zero imports. Module imports and file headers were wiped out.`,
              code: 'HEADER_STRIPPED',
              severity: 'error',
              snippet: '',
            }],
          });
        }

        // Check 4: License and Copyright Header Stripping
        const origHasLicense = /(?:SPDX-License-Identifier:|Copyright\s+(?:\([cC]\)|©)|Licensed\s+under\s+the|Permission\s+is\s+hereby\s+granted)/i.test(originalCode.slice(0, 2000));
        const optHasLicense = /(?:SPDX-License-Identifier:|Copyright\s+(?:\([cC]\)|©)|Licensed\s+under\s+the|Permission\s+is\s+hereby\s+granted)/i.test(code.slice(0, 2000));
        if (origHasLicense && !optHasLicense) {
          return res.json({
            valid: false,
            diagnostics: [{
              line: 1,
              column: 1,
              message: 'License Header Stripped: Original file contained a copyright or license header, but candidate removed it. License headers must be preserved.',
              code: 'LICENSE_HEADER_STRIPPED',
              severity: 'error',
              snippet: '',
            }],
          });
        }
      }

      const fileName = filePath || 'source.tsx';
      const isTs = /\.(ts|tsx)$/i.test(fileName);
      const isJs = /\.(js|jsx|mjs|cjs)$/i.test(fileName);
      const isPython = /\.py$/i.test(fileName);
      const isCsharp = /\.cs$/i.test(fileName);
      const isGo = /\.go$/i.test(fileName);

      // C# Language Validation Gate
      if (isCsharp) {
        const diagnostics: any[] = [];
        if (/\{\s*get\.init;\s*\}|\{\s*get\.set;\s*\}/.test(code)) {
          diagnostics.push({
            line: 1,
            column: 1,
            message: "C# Syntax Error: Invalid property accessor syntax '{ get.init; }'. Must use semicolon syntax '{ get; init; }'.",
            code: 'CS_SYNTAX_ERROR',
            severity: 'error',
            snippet: code.slice(0, 100),
          });
        }
        if (/System\.Threading\.Lock\b|\bLock\s+[a-zA-Z0-9_]+\s*=|new\s+Lock\(\)/.test(code)) {
          diagnostics.push({
            line: 1,
            column: 1,
            message: "C# Incompatibility Error: 'System.Threading.Lock' requires .NET 9+. Project targets .NET 8 LTS. Use 'private readonly object _lock = new object();'.",
            code: 'CS_FRAMEWORK_INCOMPATIBILITY',
            severity: 'error',
            snippet: 'System.Threading.Lock',
          });
        }
        if (/\bAggregationEvaluation\b/.test(code) && (!originalCode || !/\bAggregationEvaluation\b/.test(originalCode))) {
          diagnostics.push({
            line: 1,
            column: 1,
            message: "C# Semantic Error: Undefined type 'AggregationEvaluation'. Type is not declared in project.",
            code: 'CS_UNDEFINED_TYPE',
            severity: 'error',
            snippet: 'AggregationEvaluation',
          });
        }
        if (diagnostics.length > 0) {
          return res.json({ valid: false, diagnostics });
        }
        return res.json({ valid: true, diagnostics: [] });
      }

      // Go Language Validation Gate
      if (isGo) {
        const diagnostics: any[] = [];
        if (!/^\s*package\s+[a-zA-Z0-9_]+/m.test(code)) {
          diagnostics.push({
            line: 1,
            column: 1,
            message: "Go Syntax Error: Missing 'package <name>' declaration at top of file.",
            code: 'GO_MISSING_PACKAGE',
            severity: 'error',
            snippet: code.slice(0, 80),
          });
        }
        if (/\b(?:ConflictStrategy|metrics\.Enabled|agentmesh\.Identity|agentmesh\.Client)\b/.test(code) && (!originalCode || !/\b(?:ConflictStrategy|metrics\.Enabled|agentmesh\.Identity|agentmesh\.Client)\b/.test(originalCode))) {
          diagnostics.push({
            line: 1,
            column: 1,
            message: 'Go Semantic Error: Undefined identifier or struct member introduced in candidate.',
            code: 'GO_UNDEFINED_IDENTIFIER',
            severity: 'error',
            snippet: 'Undefined Go symbol',
          });
        }
        if (diagnostics.length > 0) {
          return res.json({ valid: false, diagnostics });
        }
        return res.json({ valid: true, diagnostics: [] });
      }

      // Authoritative Python AST Syntax & Delimiter Validation Gate
      if (isPython) {
        // 1. Strict delimiter leak detection: immediately fail if any rogue protocol artifacts exist
        if (/@+\s*$/.test(code) || code.includes('@@@') || code.includes('@@@START') || code.includes('@@@END')) {
          const lines = code.split('\n');
          return res.json({
            valid: false,
            diagnostics: [{
              line: lines.length,
              column: 1,
              message: 'SyntaxError: Illegal protocol delimiter artifact (@, @@@, or @@@END) detected in Python source code.',
              code: 'PY_DELIMITER_LEAK',
              severity: 'error',
              snippet: code.slice(-60).trim(),
            }],
          });
        }

        // 2. Python 3 compile verification (-W error) and AST loaded undefined symbol audit
        try {
          const pyScript = `import sys, ast, builtins
try:
    code = sys.stdin.read()
    compile(code, "<module>", "exec")
    tree = ast.parse(code)
    defined = set(dir(builtins))
    defined.update([
        "__file__", "__name__", "__doc__", "__package__", "__path__",
        "__annotations__", "__all__", "__cached__", "__builtins__", "__spec__",
        "self", "cls"
    ])
    for node in tree.body:
        if isinstance(node, ast.Import):
            for a in node.names:
                defined.add(a.asname or a.name.split(".")[0])
        elif isinstance(node, ast.ImportFrom):
            for a in node.names:
                defined.add(a.asname or a.name)
        elif isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef, ast.ClassDef)):
            defined.add(node.name)
        elif isinstance(node, ast.Assign):
            for t in node.targets:
                if isinstance(t, ast.Name):
                    defined.add(t.id)
                elif isinstance(t, (ast.Tuple, ast.List)):
                    for elt in t.elts:
                        if isinstance(elt, ast.Name):
                            defined.add(elt.id)
        elif isinstance(node, ast.AnnAssign) and isinstance(node.target, ast.Name):
            defined.add(node.target.id)

    missing = []
    common_missing = {"sys", "os", "json", "time", "pytest", "re", "datetime", "subprocess", "random", "argparse", "pathlib", "Path", "Any", "Callable", "Optional", "Union", "dataclass", "HTTPError", "URLError", "StringIO"}
    for node in ast.walk(tree):
        if isinstance(node, ast.Name) and isinstance(node.ctx, ast.Load):
            if node.id in common_missing and node.id not in defined:
                missing.append((node.id, node.lineno))
    if missing:
        sym, line = missing[0]
        print(f"{line}:1:UndefinedSymbolError: Symbol '{sym}' is used without being imported or defined. Top-level imports were stripped.", file=sys.stderr)
        sys.exit(2)
    sys.exit(0)
except SyntaxError as e:
    print(f"{e.lineno}:{e.offset}:{e.msg}", file=sys.stderr)
    sys.exit(1)
except Exception as e:
    print(f"1:1:{str(e)}", file=sys.stderr)
    sys.exit(1)
`;

          const pyCheck = spawnSync('/usr/bin/python3', [
            '-W',
            'error',
            '-c',
            pyScript,
          ], {
            input: code,
            encoding: 'utf-8',
            timeout: 5000,
          });

          if (pyCheck.status !== 0) {
            const stderr = (pyCheck.stderr || '').trim();
            const parts = stderr.split(':');
            const errLine = parseInt(parts[0], 10) || 1;
            const errCol = parseInt(parts[1], 10) || 1;
            const errMsg = parts.slice(2).join(':').trim() || stderr || 'Python syntax error';

            const lines = code.split('\n');
            const snippet = lines[errLine - 1] || '';

            return res.json({
              valid: false,
              diagnostics: [{
                line: errLine,
                column: errCol,
                message: `Python Verification Error: ${errMsg}`,
                code: pyCheck.status === 2 ? 'PY_UNDEFINED_SYMBOL' : 'PY_SYNTAX_ERROR',
                severity: 'error',
                snippet: snippet.trim(),
              }],
            });
          }

          return res.json({ valid: true, diagnostics: [] });
        } catch (pyErr: any) {
          return res.json({
            valid: false,
            diagnostics: [{
              line: 1,
              column: 1,
              message: `Python AST validation execution failed: ${pyErr?.message || pyErr}`,
              code: 'PY_EXEC_ERROR',
              severity: 'error',
              snippet: '',
            }],
          });
        }
      }

      if (!isTs && !isJs) {
        return res.json({ valid: true, diagnostics: [] });
      }

      const isJsx = fileName.endsWith('.tsx') || fileName.endsWith('.jsx');
      const scriptKind = fileName.endsWith('.tsx')
        ? ts.ScriptKind.TSX
        : fileName.endsWith('.jsx')
        ? ts.ScriptKind.JSX
        : fileName.endsWith('.js')
        ? ts.ScriptKind.JS
        : ts.ScriptKind.TS;

      const sourceFile = ts.createSourceFile(
        fileName,
        code,
        ts.ScriptTarget.Latest,
        true,
        scriptKind
      );

      const parseDiagnostics: readonly ts.Diagnostic[] = (sourceFile as any).parseDiagnostics || [];

      const compilerOptions: ts.CompilerOptions = {
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.ESNext,
        noEmit: true,
      };

      if (isJsx) {
        compilerOptions.jsx = ts.JsxEmit.ReactJSX;
      }

      const transpileResult = ts.transpileModule(code, {
        compilerOptions,
        reportDiagnostics: true,
        fileName,
      });

      const allDiagnostics = [...parseDiagnostics, ...(transpileResult.diagnostics || [])];
      const uniqueDiags = new Map<string, any>();
      const lines = code.split('\n');

      for (const diag of allDiagnostics) {
        if (diag.code === 5052 || diag.code === 6046) {
          continue;
        }

        const start = diag.start ?? 0;
        const { line, character } = sourceFile.getLineAndCharacterOfPosition(start);
        const msgText = ts.flattenDiagnosticMessageText(diag.messageText, '\n');
        const key = `${line}:${character}:${diag.code}:${msgText}`;

        if (!uniqueDiags.has(key)) {
          const lineText = lines[line] || '';
          uniqueDiags.set(key, {
            line: line + 1,
            column: character + 1,
            message: msgText,
            code: diag.code,
            severity: diag.category === ts.DiagnosticCategory.Warning ? 'warning' : 'error',
            snippet: lineText.trim(),
          });
        }
      }

      const diagnostics = Array.from(uniqueDiags.values());
      const hasErrors = diagnostics.some((d) => d.severity === 'error');

      return res.json({
        valid: !hasErrors,
        diagnostics,
      });
    } catch (err: any) {
      console.error('Validation route error:', err);
      return res.status(500).json({ error: err?.message || 'Failed to validate source code.' });
    }
  });

  // Explicit Secret Sanitizer Route
  app.post('/api/sanitize', (req, res) => {
    try {
      const { text } = req.body;
      const result = sanitizeServerSecrets(text || '');
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err?.message || 'Failed to sanitize text' });
    }
  });

  // Explicit 404 handler for API routes to prevent Vite from returning index.html
  app.all('/api/*', (req, res) => {
    res.status(404).json({ error: `API route not found: ${req.method} ${req.path}` });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`EMG Core Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
