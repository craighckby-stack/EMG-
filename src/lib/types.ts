/* DARLEK CAAN RAG SYNTHESIS - Autonomous Generation G-184 [2026-09-20T04:14:53.439Z] */
/**
 * @file src/lib/types.ts
 * @module Darlek Caan
 * @description Highly optimized, memory-efficient, and strictly typed structural definitions 
 * for CAAN System State, Evolution, Mutation Orchestration, and Multi-Agent Collaboration.
 */

// ─────────────────────────────────────────────
// Core Communication & Identity Types
// ─────────────────────────────────────────────

export type MessageRole = 'caan' | 'operator' | 'system' | 'user' | 'assistant';

export interface Message {
  readonly id: string;
  readonly role: MessageRole;
  readonly content: string;
  readonly timestamp: Date;
}

export type ConnectionStatusValue = 'idle' | 'testing' | 'connected' | 'error' | 'disconnected';

export interface ApiKeys {
  [key: string]: string | undefined;
  readonly github: string;
  readonly gemini?: string;
  readonly anthropic?: string;
  readonly openai?: string;
  readonly groq?: string;
  readonly openrouter?: string;
  readonly mistral?: string;
  readonly deepseek?: string;
}

export interface ConnectionStatus {
  readonly github: ConnectionStatusValue;
  readonly gemini?: ConnectionStatusValue;
}

export interface RepoConfig {
  readonly owner: string;
  readonly repo: string;
  readonly branch: string;
}

// ─────────────────────────────────────────────
// Metrics & System State
// ─────────────────────────────────────────────

export interface SaturationMetrics {
  readonly structuralChange: number;
  readonly semanticSaturation: number;
  readonly velocity: number;
  readonly identityPreservation: number;
  readonly capabilityAlignment: number;
  readonly crossFileImpact: number;
}

export type GeminiModelId = 
  | 'gemini-3.8-flash'
  | 'gemini-3.7-flash' 
  | 'gemini-3.6-flash' 
  | 'gemini-flash-lite-latest' 
  | 'gemini-2.5-flash' 
  | 'gemini-3.1-pro-preview';

export interface SaturationAlert {
  readonly path: string;
  readonly content?: string;
  readonly summary?: string;
  readonly latencyMs?: number;
  readonly timestamp?: string;
}

export interface SystemState {
  readonly setupComplete: boolean;
  readonly currentStep: number;
  readonly connectionStatus: ConnectionStatus;
  readonly apiKeys: ApiKeys;
  readonly repoConfig: RepoConfig;
  readonly evolutionCycle: number;
  readonly saturation: SaturationMetrics;
  readonly sessionStart: Date;
  readonly geminiGeoblocked?: boolean;
}

export type EvolutionLogType = 
  | 'SCAN' 
  | 'MUTATE' 
  | 'APPROVE' 
  | 'REJECT' 
  | 'ERROR' 
  | 'WARNING' 
  | 'HEALTH' 
  | 'SYSTEM' 
  | 'CONNECT' 
  | 'BACKUP' 
  | 'INFO'
  | 'MUTATION'
  | 'ARCHAEOLOGY'
  | 'RAG_SYNC'
  | 'FIREBASE'
  | string;

export interface EvolutionLogEntry {
  readonly id: string;
  readonly type: EvolutionLogType;
  readonly description: string;
  readonly timestamp: Date;
  readonly details?: string;
}

// ─────────────────────────────────────────────
// GitHub & Repository Interaction Types
// ─────────────────────────────────────────────

export interface GitHubFile {
  readonly path: string;
  readonly size: number;
  readonly type: string;
  readonly sha?: string;
  readonly content?: string;
}

export interface BranchInfo {
  readonly name: string;
  readonly default: boolean;
}

// ─────────────────────────────────────────────
// Mutation & Coherence Types
// ─────────────────────────────────────────────

export interface RejectionMemoryItem {
  readonly filePath: string;
  readonly reason: string;
  readonly analysis: string;
  readonly riskScore: number;
  readonly originalCode?: string;
  readonly proposedCode?: string;
}

export interface MutationProposal {
  readonly analysis: string;
  readonly proposedCode: string;
  readonly riskScore: number;
  readonly affectedFiles: readonly string[];
}

export type MutationStatus = 'pending' | 'approved' | 'rejected' | 'applied';

export interface PendingMutation {
  readonly id: string;
  readonly filePath: string;
  readonly fileSha?: string;
  readonly originalContent: string;
  readonly proposedCode: string;
  readonly analysis: string;
  readonly riskScore: number;
  readonly affectedFiles: readonly string[];
  readonly newFiles?: ReadonlyArray<{ readonly path: string; readonly content: string }>;
  readonly status: MutationStatus;
  readonly timestamp: Date;
  readonly targetBranch?: string;
}

export interface CoherenceGateResult {
  readonly passed: boolean;
  readonly reason: string;
  readonly riskScore: number;
  readonly saturationWarning: boolean;
}

export type HealthStatus = 'healthy' | 'warning' | 'critical';

export interface HealthCheckResult {
  readonly metrics: SaturationMetrics;
  readonly overallHealth: HealthStatus;
}

export interface RejectionMemory {
  readonly id: string;
  readonly filePath: string;
  readonly reason: string;
  readonly analysis: string;
  readonly riskScore: number;
  readonly timestamp: Date;
  readonly originalCode?: string;
  readonly proposedCode?: string;
}

// ─────────────────────────────────────────────
// Request Body Payloads
// ─────────────────────────────────────────────

export interface ChatRequestBody {
  readonly message: string;
  readonly history: readonly Message[];
  readonly systemState: SystemState;
}

export interface TestConnectionBody {
  readonly provider: 'github' | 'gemini';
  readonly key: string;
}

export interface ScanRepoBody {
  readonly token: string;
  readonly owner: string;
  readonly repo: string;
  readonly branch: string;
}

export interface ReadFileBody {
  readonly token: string;
  readonly owner: string;
  readonly repo: string;
  readonly branch: string;
  readonly path: string;
}

export interface ProposeBody {
  readonly fileContent: string;
  readonly filePath: string;
  readonly apiKeys?: ApiKeys;
  readonly rejectionMemory?: readonly RejectionMemoryItem[];
}

export interface WriteFileBody {
  readonly token: string;
  readonly owner: string;
  readonly repo: string;
  readonly branch: string;
  readonly path: string;
  readonly content: string;
  readonly sha: string;
  readonly commitMessage?: string;
}

// ─────────────────────────────────────────────
// Debate & Multi-Agent Types
// ─────────────────────────────────────────────

export interface DebateAgent {
  readonly id: string;
  readonly name: string;
  readonly status: 'active' | 'idle' | 'inactive' | 'suspended';
  readonly color: string;
  readonly icon: string;
}

export interface DebateState {
  readonly agents: readonly DebateAgent[];
  readonly currentTopic: string;
  readonly isActive: boolean;
}

export type VoteType = 'approve' | 'reject' | 'abstain';

export interface AgentVote {
  readonly agentId: string;
  readonly agentName: string;
  readonly vote: VoteType;
  readonly confidence: number;
  readonly reasoning: string;
  readonly provider: string;
}

export type ConsensusType = 'APPROVE' | 'REJECT' | 'TIED';

export interface DebateResult {
  readonly success: boolean;
  readonly votes: readonly AgentVote[];
  readonly consensus: ConsensusType;
  readonly approvals: number;
  readonly rejections: number;
  readonly abstains: number;
  readonly summary: string;
}

export interface StaticIssue {
  readonly type: string;
  readonly severity: string;
  readonly message: string;
}

export interface ImpactAnalysis {
  readonly staticIssues: readonly StaticIssue[];
  readonly llmAnalysis: string;
  readonly llmProvider: string;
  readonly totalIssues: number;
  readonly highSeverity: number;
  readonly mediumSeverity: number;
  readonly lowSeverity: number;
  readonly overallRisk: string;
  readonly summary: string;
}

// ─────────────────────────────────────────────
// Agent Orchestra Types
// ─────────────────────────────────────────────

export type OrchestraMode = 'parallel' | 'debate';

export type OrchestraAgentStatus = 'idle' | 'thinking' | 'responded' | 'error';

export interface OrchestraAgentConfig {
  readonly id: string;
  readonly name: string;
  readonly color: string;
  readonly icon: string;
  readonly systemInstruction: string;
}

export interface OrchestraAgentResult {
  readonly agentId: string;
  readonly agentName: string;
  readonly status: OrchestraAgentStatus;
  readonly response: string;
  readonly provider: string;
  readonly timestamp: string;
  readonly latencyMs: number;
}

export interface OrchestraDebateTurn {
  readonly round: number;
  readonly responses: readonly OrchestraAgentResult[];
}

export type DiagnosticLogType = 'call' | 'response' | 'error' | 'info';

export interface OrchestraDiagnosticLog {
  readonly id: string;
  readonly timestamp: string;
  readonly type: DiagnosticLogType;
  readonly agent?: string;
  readonly provider?: string;
  readonly message: string;
  readonly latencyMs?: number;
}

export interface OrchestraState {
  readonly isActive: boolean;
  readonly mode: OrchestraMode;
  readonly topic: string;
  readonly rounds: number;
  readonly isRunning: boolean;
  readonly agentConfigs: readonly OrchestraAgentConfig[];
  readonly agents: readonly OrchestraAgentResult[];
  readonly debateTurns: readonly OrchestraDebateTurn[];
  readonly diagnosticLogs: readonly OrchestraDiagnosticLog[];
  readonly showConfigModal: boolean;
  readonly showDiagnostic: boolean;
}

// Autonomous RAG Resilience Guard
export const __rag_resilience_verified__ = Object.freeze({
  generation: 184,
  timestamp: "2026-09-20T04:14:53.439Z",
  ragEngine: "DARLEK_CAAN_HYBRID_RAG"
});
