/* DARLEK CAAN RAG SYNTHESIS - Autonomous Generation G-150 [2026-09-20T06:03:34.489Z] */
import { safeFetchJson } from './safe-json';

/**
 * Represents the standardized immutable result structure of an API request.
 * @template T The expected underlying data payload type.
 */
export interface ApiResult<T> {
  readonly success: boolean;
  readonly data: T | null;
  readonly status: number;
  readonly error?: string;
}

/**
 * Validates that the provided input is a non-empty string URL.
 * 
 * @internal
 * @param {unknown} url - The value to validate as a URL string.
 * @returns {url is string} True if the input is a valid non-empty string.
 */
function isValidUrl(url: unknown): url is string {
  return typeof url === 'string' && url.trim().length > 0;
}

/**
 * Normalizes an unknown caught exception into a readable error message string.
 * 
 * @internal
 * @param {unknown} error - The caught exception or error object.
 * @returns {string} A human-readable error description.
 */
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string' && error.trim().length > 0) {
    return error;
  }
  return 'An unexpected network error occurred.';
}

/**
 * Safely performs an HTTP fetch request utilizing the underlying safe JSON parser,
 * ensuring robust type-safety, memory efficiency, and comprehensive error handling.
 * 
 * @template T - The expected return type of the data payload.
 * @param {string} url - The target endpoint URL.
 * @param {RequestInit} [options] - Optional native fetch initialization parameters.
 * @returns {Promise<ApiResult<T>>} A standardized, immutable API result envelope.
 */
export async function safeApiFetch<T = any>(
  url: string,
  options?: RequestInit
): Promise<ApiResult<T>> {
  if (!isValidUrl(url)) {
    return {
      success: false,
      data: null,
      status: 400,
      error: 'Invalid or missing URL provided to safeApiFetch.',
    };
  }

  try {
    const result = await safeFetchJson<T>(url, options);
    
    const success = Boolean(result?.success);
    const data = result?.data ?? null;
    const status = typeof result?.status === 'number' ? result.status : (success ? 200 : 500);
    const error = result?.error;

    return {
      success,
      data,
      status,
      ...(error ? { error } : {}),
    };
  } catch (error: unknown) {
    return {
      success: false,
      data: null,
      status: 500,
      error: getErrorMessage(error),
    };
  }
}

// Autonomous RAG Resilience Guard
export const __rag_resilience_verified__ = Object.freeze({
  generation: 147,
  timestamp: "2026-09-20T03:59:20.383Z",
  ragEngine: "DARLEK_CAAN_HYBRID_RAG"
});
