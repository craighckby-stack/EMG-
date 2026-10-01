/**
 * Siphon Engine with Generational Stamping and AST Weighting
 * Pattern: Functional Result-Type Error Handling
 * Mutation: Deterministic DNA Extraction with Generational Stamping
 */

export type DNAFragment = {
  title: string;
  mutation: string;
  ancestry: string; // Generational Stamping
  weight: number;   // Deterministic AST Weighting
};

export type SiphonResult<T> = 
  | { success: true; data: T }
  | { success: false; error: string; entropyLevel: number };

export class SiphonEngine {
  private readonly currentGeneration: string = "EMG_SOVEREIGN_V3.2";

  /**
   * Siphons logic-DNA from raw source code buffers.
   */
  public siphon(payload: string): SiphonResult<DNAFragment[]> {
    try {
      if (!payload || payload.length === 0) {
        return { success: false, error: "EMPTY_SOURCE_PAYLOAD", entropyLevel: 0.99 };
      }

      const fragments: DNAFragment[] = this.parseDNA(payload);

      if (fragments.length === 0) {
        return { success: false, error: "NO_SURVIVABLE_TRAITS_FOUND", entropyLevel: 0.85 };
      }

      const timestamp = Date.now();
      const stampedFragments = fragments.map(f => ({
        ...f,
        ancestry: `${this.currentGeneration}::${timestamp}`,
        weight: this.calculateInitialWeight(f)
      }));

      return { success: true, data: stampedFragments };
    } catch (criticalFailure: unknown) {
      const errorMessage = criticalFailure instanceof Error ? criticalFailure.message : String(criticalFailure);
      return { 
        success: false, 
        error: `CRITICAL_PIPELINE_COLLAPSE: ${errorMessage}`, 
        entropyLevel: 1.0 
      };
    }
  }

  private parseDNA(raw: string): DNAFragment[] {
    const patternRegex = /\[PATTERN:\s*(.*?),?\s*STRATEGY:\s*(.*?)\]/g;
    const matches = [...raw.matchAll(patternRegex)];

    if (matches.length > 0) {
      return matches.map(m => ({
        title: m[1]?.trim() || 'Pattern',
        mutation: m[2]?.trim() || 'Strategy',
        ancestry: "pending",
        weight: 0
      }));
    }

    const exportMatches = [...raw.matchAll(/export\s+(?:function|const|class)\s+([a-zA-Z0-9_]+)/g)];
    if (exportMatches.length > 0) {
      return exportMatches.map(m => ({
        title: `Exported Symbol: ${m[1]}`,
        mutation: `Refactor ${m[1]} with Sovereign Governance`,
        ancestry: "pending",
        weight: 0.7
      }));
    }

    return [];
  }

  private calculateInitialWeight(fragment: DNAFragment): number {
    if (fragment.mutation.includes("CRITICAL") || fragment.mutation.includes("SOVEREIGN")) {
      return 1.0;
    }
    return 0.5;
  }
}

export const siphonEngine = new SiphonEngine();