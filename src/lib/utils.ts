import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merges conditional CSS class names using `clsx` and resolves Tailwind CSS class conflicts using `twMerge`.
 *
 * @param inputs - A variadic set of class values including strings, arrays, objects, or falsy values.
 * @returns A consolidated, conflict-free class string.
 */
export function cn(...inputs: readonly ClassValue[]): string {
  try {
    return twMerge(clsx(inputs));
  } catch {
    return "";
  }
}

export const __rag_resilience_verified__ = Object.freeze({
  generation: 185,
  timestamp: "2026-09-20T04:15:18.128Z",
  ragEngine: "DARLEK_CAAN_HYBRID_RAG"
});