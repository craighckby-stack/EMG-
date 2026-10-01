/**
 * DARLEK CAAN — Gemini API Utility
 *
 * Official @google/genai SDK implementation.
 * All external Gemini LLM calls route through this module.
 * Includes automated fallback across current Gemini 3.x models, concurrency limiting, and smart error handling.
 */

import { GoogleGenAI } from '@google/genai';
import { retrieveRelevantMutations } from './ragBrain';
import { RAG_RETRIEVAL_ENABLED } from './config';

const MODEL_MAPPING: Record<string, string> = {
  'gemini-3.8-flash': 'gemini-3.8-flash',
  'gemini-3.7-flash': 'gemini-3.8-flash',
  'gemini-3.6-flash': 'gemini-3.6-flash',
  'gemini-3.5': 'gemini-3.6-flash',
  'gemini-3.1-pro-preview': 'gemini-3.1-pro-preview',
  'gemini-flash-latest': 'gemini-flash-latest',
  'gemini-flash-lite-latest': 'gemini-flash-lite-latest',
  'gemini-3.1-flash-lite': 'gemini-flash-lite-latest',
  'gemini-2.5-flash': 'gemini-2.5-flash',
  'gemini-2.5-pro': 'gemini-2.5-pro',
  'gemini-2.0-flash': 'gemini-2.5-flash',
  'gemini-1.5-flash': 'gemini-2.5-flash',
  'gemini-1.5-pro': 'gemini-2.5-pro',
};

function normalizeModelName(modelName?: string): string {
  if (!modelName) {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('darlek_cann_selected_model');
        if (saved && MODEL_MAPPING[saved.trim()]) {
          return MODEL_MAPPING[saved.trim()];
        }
      } catch {}
    }
    return 'gemini-3.8-flash';
  }
  const trimmed = modelName.trim();
  return MODEL_MAPPING[trimmed] || trimmed;
}

const MODEL_CANDIDATES = [
  'gemini-3.8-flash',
  'gemini-3.6-flash',
  'gemini-flash-latest',
  'gemini-3.1-pro-preview',
  'gemini-2.5-flash',
  'gemini-flash-lite-latest',
] as const;

const DEFAULT_TEMPERATURE = 0.6;
const DEFAULT_MAX_TOKENS = 8192;
const RELEASE_DELAY_MS = 100;
const DEFAULT_RETRY_DELAY_MS = 30000;
const MIN_RETRY_DELAY_SEC = 5;
const MAX_RETRY_DELAY_SEC = 120;
const MS_PER_SECOND = 1000;
const INVALID_KEY_COOLDOWN_MS = 60000;
const GEOBLOCK_COOLDOWN_MS = 300000;

let rateLimitUntil = 0;
let invalidKeyUntil = 0;
let lastInvalidKey = '';

// Precompiled Regex patterns for zero-allocation parsing during error handling loops
const RETRY_PATTERN_CONFIG_DELAY = /retryDelay["']?\s*:\s*["']?(\d+(?:\.\d+)?)s/i;
const RETRY_PATTERN_IN_TEXT = /retry in (\d+(?:\.\d+)?)s/i;
const RETRY_PATTERN_AFTER = /please retry after (\d+)s/i;

function parseRetryDelayMs(errorMessage: string): number {
  const match = 
    RETRY_PATTERN_CONFIG_DELAY.exec(errorMessage) || 
    RETRY_PATTERN_IN_TEXT.exec(errorMessage) || 
    RETRY_PATTERN_AFTER.exec(errorMessage);

  if (match) {
    const seconds = parseFloat(match[1]);
    if (seconds >= MIN_RETRY_DELAY_SEC && seconds <= MAX_RETRY_DELAY_SEC) {
      return seconds * MS_PER_SECOND;
    }
    return seconds < MIN_RETRY_DELAY_SEC ? 5000 : 120000;
  }
  
  return DEFAULT_RETRY_DELAY_MS;
}

class ConcurrencyLimiter {
  private activeCount = 0;
  private readonly queue: Array<() => void> = [];
  private readonly maxConcurrency: number;

  constructor(maxConcurrency = 2) {
    this.maxConcurrency = maxConcurrency;
  }

  async acquire(): Promise<void> {
    if (this.activeCount < this.maxConcurrency) {
      this.activeCount++;
      return;
    }
    return new Promise<void>((resolve) => {
      this.queue.push(resolve);
    });
  }

  release(): void {
    this.activeCount--;
    if (this.queue.length > 0) {
      this.activeCount++;
      const nextTask = this.queue.shift();
      if (nextTask) {
        setTimeout(nextTask, RELEASE_DELAY_MS);
      }
    }
  }
}

const limiter = new ConcurrencyLimiter(2);

// Client instance cache to avoid repeatedly instantiating GoogleGenAI per call with identical API keys
let cachedApiKey = '';
let cachedClient: GoogleGenAI | null = null;

function getGeminiClient(apiKey: string): GoogleGenAI {
  if (cachedClient && cachedApiKey === apiKey) {
    return cachedClient;
  }
  
  cachedApiKey = apiKey;
  cachedClient = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
  
  return cachedClient;
}

export interface GeminiCallConfig {
  model?: string;
  maxTokens?: number;
  maxOutputTokens?: number;
  temperature?: number;
  responseMimeType?: string;
  responseSchema?: unknown;
}

export interface ChatPart {
  text: string;
}

export interface ChatContent {
  role: string;
  parts: ChatPart[];
}

/**
 * Validates baseline preconditions, request throttling, and active rate limits.
 */
function isRequestBlocked(apiKey: string): boolean {
  const cleanKey = apiKey.trim();
  if (!cleanKey) return true;

  const now = Date.now();
  if (now < rateLimitUntil) return true;
  if (cleanKey === lastInvalidKey && now < invalidKeyUntil) return true;

  return false;
}

/**
 * Builds standard GoogleGenAI generation configuration options.
 */
function buildGenerationConfig(systemInstruction: string, options?: GeminiCallConfig): Record<string, unknown> {
  const config: Record<string, unknown> = {
    temperature: options?.temperature ?? DEFAULT_TEMPERATURE,
    maxOutputTokens: options?.maxTokens ?? DEFAULT_MAX_TOKENS,
  };

  const trimmedSystemInstruction = systemInstruction.trim();
  if (trimmedSystemInstruction) {
    config['systemInstruction'] = trimmedSystemInstruction;
  }

  if (options?.responseMimeType) {
    config['responseMimeType'] = options.responseMimeType;
  }

  if (options?.responseSchema) {
    config['responseSchema'] = options.responseSchema;
  }

  return config;
}

/**
 * Inspects execution errors and triggers adaptive rate limiting or key blacklisting.
 */
function handleGeminiError(error: unknown, model: string, apiKey: string): void {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const cleanKey = apiKey.trim();

  const isNotFound = errorMessage.includes('404') || errorMessage.includes('not found') || errorMessage.includes('NOT_FOUND') || errorMessage.includes('403') || errorMessage.toLowerCase().includes('permission denied') || errorMessage.includes('PERMISSION_DENIED');
  if (isNotFound) {
    console.warn(`[Gemini API] Model ${model} not found or permission denied — trying next candidate.`);
    return;
  }

  const isInvalidKey = 
    errorMessage.includes('401') ||
    errorMessage.includes('API_KEY_INVALID') ||
    errorMessage.includes('API key not valid') ||
    errorMessage.includes('invalid API key') ||
    errorMessage.includes('key is not valid');

  if (isInvalidKey) {
    invalidKeyUntil = Date.now() + INVALID_KEY_COOLDOWN_MS;
    lastInvalidKey = cleanKey;
    console.warn('[Gemini API] API key validation failed (401) — falling back to local engine.');
    return;
  }

  const isGeoblocked = 
    errorMessage.includes('location is not supported') ||
    errorMessage.includes('Location is not supported') ||
    errorMessage.includes('FAILED_PRECONDITION');

  if (isGeoblocked) {
    rateLimitUntil = Date.now() + GEOBLOCK_COOLDOWN_MS;
    console.warn('[Gemini API] Region geoblocked — falling back to local engine.');
    return;
  }

  const isRateLimited = errorMessage.includes('429') || errorMessage.includes('quota') || errorMessage.includes('Quota');
  if (isRateLimited) {
    const delayMs = parseRetryDelayMs(errorMessage);
    rateLimitUntil = Date.now() + delayMs;
    console.warn(`[Gemini API] Quota/rate-limit reached on ${model} (cooldown: ${Math.round(delayMs / MS_PER_SECOND)}s) — switching to local engine.`);
  }
}

/**
 * Call Gemini with single prompt and automatic model fallback
 */
export async function callGemini(
  systemInstruction: string,
  userPrompt: string,
  apiKey: string,
  options?: GeminiCallConfig
): Promise<string | null> {
  const cleanKey = (apiKey || '').trim();
  if (isRequestBlocked(cleanKey)) return null;

  await limiter.acquire();

  try {
    const ai = getGeminiClient(cleanKey);
    const config = buildGenerationConfig(systemInstruction, options);

    const requestedModel = normalizeModelName(options?.model);
    const candidates = [
      requestedModel,
      ...MODEL_CANDIDATES.filter((m) => m !== requestedModel),
    ];

    for (const model of candidates) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: userPrompt,
          config,
        });

        const text = response?.text;
        if (typeof text === 'string' && text) {
          return text;
        }
      } catch (err: unknown) {
        handleGeminiError(err, model, cleanKey);
        // If an explicit lockout was triggered, abort remaining model fallback iterations early
        if (Date.now() < rateLimitUntil || (cleanKey === lastInvalidKey && Date.now() < invalidKeyUntil)) {
          break;
        }
      }
    }

    return null;
  } finally {
    limiter.release();
  }
}

/**
 * Call Gemini with multi-turn conversation contents
 */
export async function callGeminiMultiTurn(
  systemInstruction: string,
  contents: ChatContent[],
  apiKey: string,
  options?: GeminiCallConfig
): Promise<string | null> {
  const cleanKey = (apiKey || '').trim();
  if (isRequestBlocked(cleanKey)) return null;

  await limiter.acquire();

  try {
    const ai = getGeminiClient(cleanKey);
    
    const formattedContents = contents.map((content) => {
      const mappedRole = ['model', 'assistant', 'caan'].includes(content.role) ? 'model' : 'user';
      const formattedParts = content.parts.map((part) => ({ text: part.text }));
      return { role: mappedRole, parts: formattedParts };
    });

    const config = buildGenerationConfig(systemInstruction, options);

    const requestedModel = normalizeModelName(options?.model);
    const candidates = [
      requestedModel,
      ...MODEL_CANDIDATES.filter((m) => m !== requestedModel),
    ];

    for (const model of candidates) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: formattedContents,
          config,
        });

        const text = response?.text;
        if (typeof text === 'string' && text) {
          return text;
        }
      } catch (err: unknown) {
        handleGeminiError(err, model, cleanKey);
        // If an explicit lockout was triggered, abort remaining model fallback iterations early
        if (Date.now() < rateLimitUntil || (cleanKey === lastInvalidKey && Date.now() < invalidKeyUntil)) {
          break;
        }
      }
    }

    return null;
  } finally {
    limiter.release();
  }
}
export function resolveApiKey(providedKey?: string): string {
  if (providedKey && providedKey.trim()) return providedKey.trim();
  if (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY) {
    return process.env.GEMINI_API_KEY;
  }
  if (typeof import.meta !== 'undefined' && (import.meta as unknown as { env?: Record<string, string> }).env?.VITE_GEMINI_API_KEY) {
    return (import.meta as unknown as { env?: Record<string, string> }).env?.VITE_GEMINI_API_KEY || '';
  }
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem('darlek_cann_system_state');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.apiKeys?.gemini) return parsed.apiKeys.gemini;
      }
    } catch {}
  }
  return '';
}

export async function embedText(text: string, apiKey?: string): Promise<number[]> {
  const key = resolveApiKey(apiKey);
  if (!key) {
    console.warn('[embedText] No Gemini API key available for embedding');
    return [];
  }
  const models = ['gemini-embedding-2-preview'];
  const ai = getGeminiClient(key);

  for (const model of models) {
    try {
      const response = await ai.models.embedContent({
        model,
        contents: text,
      });
      const rawRes = response as { embedding?: { values?: number[] }; embeddings?: Array<{ values?: number[] }> };
      const values = rawRes.embedding?.values || rawRes.embeddings?.[0]?.values;
      if (Array.isArray(values) && values.length > 0) {
        return values;
      }
    } catch (error) {
      console.warn(`[embedText] Model ${model} failed, falling back:`, error);
      continue;
    }
  }

  return [];
}

export async function buildMutationPrompt(
  candidateCode: string,
  basePrompt: string
): Promise<string> {
  if (!RAG_RETRIEVAL_ENABLED) return basePrompt;

  const matches = await retrieveRelevantMutations(candidateCode);
  if (matches.length === 0) return basePrompt;

  const context = matches
    .map(
      (m, i) =>
        `Known prior issue ${i + 1}:\nWrong:\n${m.originalCode}\nFixed:\n${m.mutatedCode}\nWhy: ${m.rationale}`
    )
    .join('\n\n');

  return `${basePrompt}\n\n--- RELEVANT PAST FIXES ---\n${context}\n--- END ---`;
}
