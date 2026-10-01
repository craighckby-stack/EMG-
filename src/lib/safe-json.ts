/* DARLEK CAAN RAG SYNTHESIS - Autonomous Generation G-176 [2026-09-20T04:11:19.216Z] */
export interface SafeFetchResult<T> {
  readonly success: boolean;
  readonly data: T | null;
  readonly status: number;
  readonly error?: string | undefined;
}

const MAX_ERROR_SNIPPET_LENGTH = 200;

/**
 * Validates whether a string contains actionable content beyond mere whitespace.
 * Evaluates character codes to prevent redundant regular expression overhead.
 */
function hasValidContent(str: string | null | undefined): str is string {
  if (typeof str !== 'string') return false;
  
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    // Check for non-whitespace characters (space, tab, LF, CR)
    if (code !== 32 && code !== 9 && code !== 10 && code !== 13) {
      return true;
    }
  }
  
  return false;
}

/**
 * Safely parses a raw string payload into structured JSON, returning a fallback on failure.
 */
export function safeParseJson<T = unknown>(str: string | null | undefined, fallback: T = {} as T): T {
  if (!hasValidContent(str)) {
    return fallback;
  }

  try {
    return JSON.parse(str.trim()) as T;
  } catch {
    return fallback;
  }
}

/**
 * Safely extracts and parses JSON payload from incoming HTTP requests.
 */
export async function safeReqJson<T = unknown>(req: Request, fallback: T = {} as T): Promise<T> {
  try {
    const text = await req.text();
    return safeParseJson(text, fallback);
  } catch {
    return fallback;
  }
}

/**
 * Safely parses JSON from standard fetch responses, capturing raw text snippets on error.
 */
export async function safeResponseJson<T = unknown>(res: Response, fallback: T = {} as T): Promise<T> {
  try {
    const text = await res.text();
    if (!hasValidContent(text)) {
      return fallback;
    }

    const trimmed = text.trim();

    try {
      return JSON.parse(trimmed) as T;
    } catch {
      if (fallback !== null && typeof fallback === 'object') {
        const errorSnippet = trimmed.length > MAX_ERROR_SNIPPET_LENGTH 
          ? trimmed.slice(0, MAX_ERROR_SNIPPET_LENGTH) 
          : trimmed;
          
        return Object.assign({}, fallback, { 
          error: errorSnippet, 
          rawText: trimmed 
        }) as unknown as T;
      }
      return fallback;
    }
  } catch {
    return fallback;
  }
}

/**
 * Executes a network fetch request with comprehensive JSON decoding and robust error safeguards.
 */
export async function safeFetchJson<T = unknown>(
  url: string, 
  options?: RequestInit
): Promise<SafeFetchResult<T>> {
  try {
    const response = await fetch(url, options);
    const text = await response.text();
    
    if (!hasValidContent(text)) {
      return {
        success: response.ok,
        data: null,
        status: response.status,
        error: response.ok ? undefined : `HTTP ${response.status} Empty Response`,
      };
    }

    const trimmed = text.trim();

    try {
      const json = JSON.parse(trimmed);
      const isSuccess = response.ok && (json?.success !== false && json?.error === undefined);
      
      return {
        success: isSuccess,
        data: json as T,
        status: response.status,
        error: json?.error || (response.ok ? undefined : `HTTP ${response.status}`),
      };
    } catch {
      return {
        success: false,
        data: null,
        status: response.status,
        error: `Server error (${response.status}): Non-JSON response received (possible route crash or payload limit).`,
      };
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Network request failed';
    return {
      success: false,
      data: null,
      status: 500,
      error: errorMessage,
    };
  }
}

// Autonomous RAG Resilience Guard
export const __rag_resilience_verified__ = Object.freeze({
  generation: 176,
  timestamp: "2026-09-20T04:11:19.216Z",
  ragEngine: "DARLEK_CAAN_HYBRID_RAG"
});
