/**
 * File: src/utils/sanitizer.ts
 * Role: Auto-sanitization utility for detecting, redacting, and purging leaked API keys and Git tokens.
 * Architecture: Type-safe modular unit with resilient regex matching and zero-leak guarantees.
 */

export interface SanitizationResult {
  sanitized: string;
  redactedCount: number;
  redactedTypes: string[];
  findings: Array<{
    type: string;
    preview: string;
    line?: number;
  }>;
}

// Comprehensive token and secret pattern definitions
const SECRET_PATTERNS: Array<{
  type: string;
  regex: RegExp;
  replacement: string;
  isAssignment?: boolean;
}> = [
  // GitHub Classic PATs (ghp_...)
  {
    type: 'GitHub Classic Token (ghp_)',
    regex: /\bghp_[a-zA-Z0-9]{36,255}\b/g,
    replacement: '[REDACTED_GH_PAT]',
  },
  // GitHub Fine-Grained PATs (github_pat_...)
  {
    type: 'GitHub Fine-Grained Token',
    regex: /\bgithub_pat_[a-zA-Z0-9_]{80,255}\b/g,
    replacement: '[REDACTED_GH_FINE_PAT]',
  },
  // GitHub OAuth tokens (gho_...)
  {
    type: 'GitHub OAuth Token',
    regex: /\bgho_[a-zA-Z0-9]{36,255}\b/g,
    replacement: '[REDACTED_GH_OAUTH]',
  },
  // GitHub User/Server tokens (ghu_, ghs_, ghr_)
  {
    type: 'GitHub App/Server Token',
    regex: /\b(?:ghu|ghs|ghr)_[a-zA-Z0-9]{36,255}\b/g,
    replacement: '[REDACTED_GH_SERVER_TOKEN]',
  },
  // Google / Gemini API Keys (AIza...)
  {
    type: 'Google / Gemini API Key',
    regex: /\bAIza[0-9A-Za-z-_]{35}\b/g,
    replacement: '[REDACTED_GEMINI_KEY]',
  },
  // OpenAI Secret Keys (sk-..., sk-proj-..., sk-admin-...)
  {
    type: 'OpenAI Secret Key',
    regex: /\bsk-(?:proj-|live-|test-|admin-)?[a-zA-Z0-9_\-]{24,}\b/g,
    replacement: '[REDACTED_OPENAI_KEY]',
  },
  // Anthropic API Keys (sk-ant-...)
  {
    type: 'Anthropic API Key',
    regex: /\bsk-ant-[a-zA-Z0-9_\-]{24,}\b/g,
    replacement: '[REDACTED_ANTHROPIC_KEY]',
  },
  // Stripe Secret / Restricted Keys
  {
    type: 'Stripe API Key',
    regex: /\b(?:sk|rk|pk)_(?:live|test)_[0-9a-zA-Z]{24,}\b/g,
    replacement: '[REDACTED_STRIPE_KEY]',
  },
  // AWS Access Key ID
  {
    type: 'AWS Access Key',
    regex: /\b(?:AKIA|ABIA|ACCA|ASIA)[0-9A-Z]{16}\b/g,
    replacement: '[REDACTED_AWS_KEY]',
  },
  // Private Key Blocks (RSA, DSA, EC, OPENSSH, etc.)
  {
    type: 'Private Cryptographic Key',
    regex: /-----BEGIN (?:[A-Z0-9 ]+ )?PRIVATE KEY-----[\s\S]*?-----END (?:[A-Z0-9 ]+ )?PRIVATE KEY-----/g,
    replacement: '[REDACTED_PRIVATE_KEY_BLOCK]',
  },
  // JSON Web Tokens (JWT)
  {
    type: 'JSON Web Token (JWT)',
    regex: /\beyJ[a-zA-Z0-9_-]{10,}\.eyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}\b/g,
    replacement: '[REDACTED_JWT_TOKEN]',
  },
  // Generic Bearer Tokens in headers or strings
  {
    type: 'Authorization Bearer Token',
    regex: /((?:Authorization|Bearer)\s*[:=]?\s*['"`]?Bearer\s+)[a-zA-Z0-9_\-\.]{25,}(['"`]?)/gi,
    replacement: '$1[REDACTED_BEARER_TOKEN]$2',
  },
];

// Variable assignment patterns in code (e.g. const GITHUB_TOKEN = "ghp_..."; or apiKey: "...")
const CODE_SECRET_ASSIGNMENTS: Array<{
  type: string;
  regex: RegExp;
  replace: (match: string, p1: string, p2: string, p3: string, p4: string) => string;
}> = [
  {
    type: 'Hardcoded Token Assignment',
    // Matches: const GH_TOKEN = "..." or let apiKey = "..."
    regex: /((?:const|let|var)\s+([A-Za-z0-9_]*(?:token|api_?key|secret|gh_token|github_token|gemini_key)[A-Za-z0-9_]*)\s*=\s*)(['"`])([a-zA-Z0-9_\-\.+=/]{20,})\3/gi,
    replace: (_match, p1, p2, _quote) => {
      const varName = p2.toLowerCase();
      if (varName.includes('gh') || varName.includes('git')) {
        return `${p1}process.env.GITHUB_TOKEN || ''`;
      }
      if (varName.includes('gemini')) {
        return `${p1}process.env.GEMINI_API_KEY || ''`;
      }
      return `${p1}process.env.API_KEY || ''`;
    },
  },
  {
    type: 'Hardcoded Object Secret Property',
    // Matches: apiKey: "..." or token: "..."
    regex: /((?:['"]?(?:apiKey|api_key|token|secret|access_token|ghToken)['"]?\s*:\s*))(['"`])([a-zA-Z0-9_\-\.+=/]{20,})\2/gi,
    replace: (_match, p1, _quote) => {
      const propName = p1.toLowerCase();
      if (propName.includes('ghtoken') || propName.includes('git')) {
        return `${p1}process.env.GITHUB_TOKEN || ''`;
      }
      if (propName.includes('gemini') || propName.includes('apikey')) {
        return `${p1}process.env.GEMINI_API_KEY || ''`;
      }
      return `${p1}"[REDACTED_SECRET]"`;
    },
  },
];

/**
 * Sanitize source code or markdown by replacing all detected API keys and Git tokens.
 */
export function sanitizeCode(
  rawCode: string,
  filePath?: string
): SanitizationResult {
  if (!rawCode || typeof rawCode !== 'string') {
    return {
      sanitized: rawCode || '',
      redactedCount: 0,
      redactedTypes: [],
      findings: [],
    };
  }

  let code = rawCode;
  
  // 0. Extract from LLM transport envelope and markdown code blocks
  const startEnvelope = '@@@START';
  const endEnvelope = '@@@END';
  
  const startIdx = code.indexOf(startEnvelope);
  if (startIdx !== -1) {
    const afterStart = code.substring(startIdx + startEnvelope.length);
    const endIdx = afterStart.indexOf(endEnvelope);
    if (endIdx !== -1) {
       code = afterStart.substring(0, endIdx).trim();
    } else if (afterStart.includes('@@@SUMMARY:')) {
       code = afterStart.split('@@@SUMMARY:')[0].trim();
    } else {
       code = afterStart.trim();
    }
  }

  // Strip ```c ... ``` or similar markdown blocks if present
  if (code.startsWith('```')) {
     const lines = code.split('\n');
     const firstLine = lines[0];
     if (firstLine && firstLine.startsWith('```')) {
         lines.shift();
     }
     const lastLine = lines[lines.length - 1];
     if (lastLine && lastLine.startsWith('```')) {
         lines.pop();
     }
     code = lines.join('\n').trim();
  }

  // Strictly strip trailing @ delimiters or residual @@@ fragments
  code = code.replace(/@@@END/g, '').replace(/@@@START/g, '').replace(/@+\s*$/, '').trim();

  let redactedCount = 0;
  const redactedTypesSet = new Set<string>();
  const findings: SanitizationResult['findings'] = [];

  // 1. Process code-level variable assignments
  for (const item of CODE_SECRET_ASSIGNMENTS) {
    const matches = Array.from(code.matchAll(item.regex));
    if (matches.length > 0) {
      for (const m of matches) {
        redactedCount++;
        redactedTypesSet.add(item.type);
        findings.push({
          type: item.type,
          preview: m[0].slice(0, 40) + '...',
        });
      }
      code = code.replace(item.regex, (m, p1, p2, p3, p4) => item.replace(m, p1, p2, p3, p4));
    }
  }

  // 2. Process token patterns
  for (const item of SECRET_PATTERNS) {
    const matches = Array.from(code.matchAll(item.regex));
    if (matches.length > 0) {
      for (const m of matches) {
        // Avoid double counting if already redacted
        if (m[0].includes('[REDACTED_')) continue;
        redactedCount++;
        redactedTypesSet.add(item.type);
        findings.push({
          type: item.type,
          preview: m[0].slice(0, 10) + '...',
        });
      }
      code = code.replace(item.regex, item.replacement);
    }
  }

  // 3. Sanitize relative TypeScript/JavaScript import extensions to prevent TS5097
  code = sanitizeTypeScriptImports(code, filePath);

  // Enforce POSIX single trailing newline
  let finalCode = code;
  if (finalCode.trim().length > 0) {
    finalCode = finalCode.trimEnd() + '\n';
  }

  return {
    sanitized: finalCode,
    redactedCount,
    redactedTypes: Array.from(redactedTypesSet),
    findings,
  };
}

/**
 * Sanitizes TypeScript and JavaScript module import paths by stripping explicit
 * file extensions (.ts, .tsx, .js, .jsx) from relative imports to avoid TS5097 errors,
 * while preserving asset imports (.json, .css, .scss, .svg, .png, etc.).
 */
export function sanitizeTypeScriptImports(code: string, filePath?: string): string {
  if (!code || typeof code !== 'string') return '';
  if (filePath && !/\.(ts|tsx|js|jsx)$/i.test(filePath)) {
    return code;
  }

  // Matches import/export ... from './path.tsx' and dynamic import('./path.tsx')
  return code.replace(
    /((?:import|export)\s+[\s\S]*?from\s+['"]|import\s*\(\s*['"])(\.{1,2}\/[^'"]+?)\.(?:tsx|ts|jsx)(['"]\s*\)?)/g,
    '$1$2$3'
  );
}

/**
 * Sanitize simple text (logs, errors, summaries, commit messages)
 */
export function sanitizeText(rawText: string): string {
  if (!rawText || typeof rawText !== 'string') return '';
  let text = rawText;
  for (const item of SECRET_PATTERNS) {
    text = text.replace(item.regex, item.replacement);
  }
  return text;
}

/**
 * Quick check if a given string contains sensitive tokens
 */
export function containsSensitiveTokens(str: string): boolean {
  if (!str || typeof str !== 'string') return false;
  for (const item of SECRET_PATTERNS) {
    if (item.regex.test(str)) {
      // Reset regex state if global
      item.regex.lastIndex = 0;
      return true;
    }
    item.regex.lastIndex = 0;
  }
  return false;
}

/**
 * Sanitizer Rule: checkUnimplementedStubs
 * Flags method/function bodies containing only a single return statement
 * with hardcoded or stubbed values without branching or logic.
 */
export function checkUnimplementedStubs(code: string): { found: boolean; stubs: string[] } {
  if (!code || typeof code !== 'string') return { found: false, stubs: [] };

  const stubPatterns = [
    // Python def evaluate/analyze/audit... returning single-line hardcoded payload
    /def\s+(?:evaluate|analyze|audit|synthesize|estimate)\s*\([^)]*\)\s*:\s*(?:\n\s*|\n\s*"""[\s\S]*?"""\s*\n\s*)return\s+(?:EvidenceEntry|dict|\{|\w+\()\s*(?:persona=[^,]+,\s*)?(?:confidence_score|confidence|score)\s*=\s*(?:0\.\d+|0|None|\[\]|"\w+")\s*\)?/g,
    // TS/JS async evaluate/analyze... returning single-line hardcoded object
    /async?\s+(?:evaluate|analyze|audit|synthesize|estimate)\s*\([^)]*\)\s*(?::\s*[^{]+)?\{\s*return\s*\{\s*(?:persona|confidence|score)\s*:\s*(?:0\.\d+|0|None|null|"\w+")\s*\}\s*;?\s*\}/g,
  ];

  const stubs: string[] = [];
  for (const pattern of stubPatterns) {
    const matches = code.matchAll(pattern);
    for (const m of matches) {
      if (m[0]) stubs.push(m[0].slice(0, 60) + '...');
    }
  }

  return {
    found: stubs.length > 0,
    stubs,
  };
}
