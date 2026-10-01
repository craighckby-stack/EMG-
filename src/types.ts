/**
 * File: src/types.ts
 * Role: Core system component for autonomous cognitive evolution cycles.
 * Architecture: Type-safe modular unit with resilient state interfaces.
 */

export type EngineStatus = 'IDLE' | 'SCANNING' | 'FETCHING' | 'OPTIMIZING' | 'VERIFYING' | 'LINTING' | 'COMMITTING' | 'COOLDOWN' | 'ERROR';

export type LogType = 'info' | 'success' | 'warning' | 'error' | 'neural' | 'noop';

export interface TelemetryLog {
  readonly id: string;
  readonly timestamp: string;
  readonly type: LogType;
  readonly msg: string;
  readonly path?: string;
  readonly latencyMs?: number;
  readonly tokens?: number;
}

export interface MutationRecord {
  readonly id: string;
  readonly timestamp: string;
  readonly path: string;
  readonly originalCode: string;
  readonly optimizedCode: string;
  readonly originalLines: number;
  readonly optimizedLines: number;
  readonly latencyMs: number;
  readonly commitSha?: string;
  readonly optimizationSummary?: string;
  readonly status: 'applied' | 'dry-run' | 'failed' | 'noop';
  readonly validationErrors?: readonly string[];
  readonly redactedCount?: number;
  readonly typeChecked?: boolean;
}

export interface EngineMetrics {
  readonly enhancements: number;
  readonly validations: number;
  readonly retries: number;
  readonly noops: number;
  readonly totalScannedFiles: number;
  readonly avgLatencyMs: number;
  readonly tokensProcessed: number;
  readonly sanitizedSecretsCount?: number;
  readonly syntaxErrorsPrevented?: number;
}

export type OptimizationGoal = 'performance' | 'security' | 'readability' | 'type-safety' | 'comprehensive';

export type GeminiModelId = 
  | 'gemini-3.7-flash' 
  | 'gemini-3.6-flash' 
  | 'gemini-flash-lite-latest'
  | 'gemini-2.5-flash'
  | 'gemini-3.1-pro-preview';

export type FileScopeFilter = 'all' | 'markdown-only' | 'specific';

export interface EngineConfig {
  readonly targetRepo: string;
  readonly emgRepo?: string;
  readonly ghToken: string;
  readonly geminiKey: string;
  readonly model: GeminiModelId;
  readonly isSandboxMode: boolean;
  readonly dryRun: boolean;
  readonly goal: OptimizationGoal;
  readonly loopIntervalSec: number;
  readonly branch: string;
  readonly fileScope?: FileScopeFilter;
  readonly specificFilePath?: string;
  readonly skippedFiles?: readonly string[];
  readonly autoSanitize?: boolean;
  readonly strictTypeCheck?: boolean;
  readonly autoApproveSaturated?: boolean;
  readonly allowMultiPass?: boolean;
  readonly postmortemHash?: string;
  readonly postmortemConstraints?: string;
  readonly saturatedTreeHash?: string;
  readonly saturatedGoal?: string;
}

export interface SaturationAlert {
  readonly path: string;
  readonly content: string;
  readonly summary?: string;
  readonly latencyMs?: number;
  readonly timestamp?: string;
}

export interface SimulatedFile {
  readonly path: string;
  readonly content: string;
  readonly language: string;
}