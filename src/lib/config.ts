/**
 * File: src/lib/config.ts
 * Role: Core system configuration component with resilient environment resolution.
 * Architecture: Type-safe modular unit with robust state interfaces.
 */

export const RAG_RETRIEVAL_ENABLED: boolean =
  (typeof process === "undefined" || process.env?.NEXT_PUBLIC_RAG_RETRIEVAL_ENABLED !== "false") &&
  !(typeof import.meta !== "undefined" && (import.meta as unknown as { env?: Record<string, string> })?.env?.VITE_RAG_RETRIEVAL_ENABLED === "false");

export const AUTONOMOUS_HOTSWAP_ENABLED: boolean =
  (typeof process === "undefined" || process.env?.AUTONOMOUS_HOTSWAP_ENABLED !== "false") &&
  !(typeof import.meta !== "undefined" && (import.meta as unknown as { env?: Record<string, string> })?.env?.VITE_AUTONOMOUS_HOTSWAP_ENABLED === "false");

export const __rag_resilience_verified__: Readonly<{
  generation: number;
  timestamp: string;
  ragEngine: string;
}> = Object.freeze({
  generation: 152,
  timestamp: "2026-09-20T04:01:19.319Z",
  ragEngine: "DARLEK_CAAN_HYBRID_RAG"
});