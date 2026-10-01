/**
 * DARLEK CANN ARCHITECTURAL HEADER
 * File: server.ts
 * Role: Core system component participating in autonomous cognitive evolution cycles.
 * Architecture: Type-safe modular unit with resilient state interfaces.
 */

import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import ts from 'typescript';
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
  const PORT = 3000;

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
4. Output a 1-sentence summary of enhancements immediately after @@@SUMMARY:`;

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
          response = await ai.models.generateContent({
            model: m,
            contents: prompt,
            config: {
              temperature: 0.2,
              maxOutputTokens: 8192,
            },
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

      if (rawText.includes('@@@SUMMARY:')) {
        const summaryPart = rawText.split('@@@SUMMARY:')[1].trim().split('\n')[0];
        if (summaryPart) {
          summary = summaryPart;
        }
      }

      if (rawText.includes('@@@START') && rawText.includes('@@@END')) {
        optimized = rawText.split('@@@START')[1].split('@@@END')[0].trim();
      } else {
        let cleaned = rawText;
        if (cleaned.includes('@@@SUMMARY:')) {
          cleaned = cleaned.split('@@@SUMMARY:')[0];
        }
        cleaned = cleaned.trim();

        // Extract from markdown code fence if present
        if (!isMarkdown) {
          const fenceMatch = cleaned.match(/```(?:[a-zA-Z0-9_-]+)?\s*\n([\s\S]*?)\n```/);
          if (fenceMatch && fenceMatch[1]) {
            cleaned = fenceMatch[1].trim();
          } else if (cleaned.startsWith('```') && cleaned.endsWith('```')) {
            cleaned = cleaned.replace(/^```[a-z0-9_-]*\n?/i, '').replace(/\n?```$/i, '').trim();
          }
        }
        optimized = cleaned;
      }

      // If summary is accidentally inside optimized code, clean it
      if (optimized.includes('@@@SUMMARY:')) {
        optimized = optimized.split('@@@SUMMARY:')[0].trim();
      }

      // Strip outer markdown fences on non-markdown files
      if (!isMarkdown && optimized.startsWith('```') && optimized.endsWith('```')) {
        optimized = optimized.replace(/^```[a-z0-9_-]*\n?/i, '').replace(/\n?```$/i, '').trim();
      }

      if (!optimized || optimized.length < 5) {
        throw new Error('AI Model returned an empty code block.');
      }

      const latencyMs = Math.round(performance.now() - startTime);
      const tokensEstimate = response.usageMetadata?.totalTokenCount || Math.round(rawText.length / 3.8);

      // Auto-Sanitize generated code and summary to purge any leaked tokens/API keys
      const sanitizedCodeResult = sanitizeServerSecrets(optimized);
      const sanitizedSummaryResult = sanitizeServerSecrets(summary);

      return res.json({
        optimizedCode: sanitizedCodeResult.text,
        summary: sanitizedSummaryResult.text,
        latencyMs,
        tokensEstimate,
        modelUsed: usedModel,
        redactedSecretsCount: sanitizedCodeResult.count + sanitizedSummaryResult.count,
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
      // Catches: "Hardened Write-Protect Module", "Optimized, type-safe", "Fully optimized", "Leak-free", "Hardened", "Bulletproof", "Production-grade"
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
      // Flags docstrings that still claim a defect exists when the fix was already made or lab prediction tags leak into code
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

      // Rule 2: NO DEAD CONDITIONAL CHECKS (e.g. `len > 0u` inside `for (size_t i = 0u; i < len; ++i)` loop)
      const deadLoopGuardPattern = /for\s*\([^)]*;\s*([a-zA-Z0-9_]+)\s*<\s*([a-zA-Z0-9_]+)[^)]*\)\s*\{[\s\S]*?if\s*\(\s*\2\s*>\s*0u?\s*\)/;
      if (deadLoopGuardPattern.test(code)) {
        return res.json({
          valid: false,
          lintEvidence: `[LINT REJECT: NO_DEAD_CONDITIONS] Detected redundant inner condition checking upper bound inside a loop already bounded by that parameter.`,
          ruleName: 'NO_DEAD_CONDITIONS'
        });
      }

      // Rule 3: NO UNUSED MACRO DEFINITIONS (e.g. #define WP_NONNULL ... defined but never used in function signatures)
      const defineMacroMatch = code.match(/#define\s+([A-Z0-9_]{3,})\b/g);
      if (defineMacroMatch) {
        for (const def of defineMacroMatch) {
          const macroName = def.replace(/#define\s+/, '').trim();
          // Count occurrences in code
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
          
          // If only 1 occurrence (the #define itself), it is unused
          if (occurrences === 1) {
            return res.json({
              valid: false,
              lintEvidence: `[LINT REJECT: NO_UNUSED_MACROS] Macro '${macroName}' was defined but never applied in any function or type signature.`,
              ruleName: 'NO_UNUSED_MACROS'
            });
          }
        }
      }

      // Rule 4: NO TODO-ADJACENT-SUCCESS (Regression check for PM#4)
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
                // Try to extract the symbol, e.g., "error: use of undeclared identifier 'foo'" or "unknown type name 'bar'"
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
      const { code, filePath } = req.body;
      if (!code || typeof code !== 'string') {
        return res.status(400).json({ error: 'Source code is required.' });
      }

      const fileName = filePath || 'source.tsx';
      const isTs = /\.(ts|tsx)$/i.test(fileName);
      const isJs = /\.(js|jsx|mjs|cjs)$/i.test(fileName);

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

      // Compiler options for emission diagnostics (JSX only for JSX files)
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
        // Skip compiler options configuration errors not related to user source code
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
