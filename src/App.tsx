/**
 * @license
 * Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International (CC BY-NC-SA 4.0)
 * Copyright (c) 2026 Craighckby
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  EngineStatus,
  EngineConfig,
  EngineMetrics,
  TelemetryLog,
  MutationRecord,
  LogType,
} from './types';
import { SplashView } from './components/SplashView';
import { Header } from './components/Header';
import { StatsGrid } from './components/StatsGrid';
import { ConfigPanel } from './components/ConfigPanel';
import { NeuralChart } from './components/NeuralChart';
import { MutationViewer } from './components/MutationViewer';
import { LogStream } from './components/LogStream';
import { DiffModal } from './components/DiffModal';
import { LicenseModal } from './components/LicenseModal';
import { DiagnosticsModal } from './components/DiagnosticsModal';
import { SaturationModal } from './components/SaturationModal';
import { WipeMemoryModal } from './components/WipeMemoryModal';
import { OracleModal } from './components/OracleModal';
import { SANDBOX_REPOSITORIES, resetSandboxRepositories } from './utils/mockRepo';
import {
  fetchRepoDetails,
  fetchRepoTree,
  fetchFileContent,
  commitFileUpdate,
} from './utils/github';
import { writePostmortem, computeSHA256 } from './utils/postmortem';
import { appendCleanCommit, appendFailureAndFix, publishRagToGithub } from './memory/emg_rag';
import { executeRAGDebate, DebateVerdict } from './engine/debate';
import { alignmentMatrixEngine, AlignmentMatrixResult } from './engine/alignment-matrix';
import { checkSelfStoppingPoint, HaltEvaluationState } from './engine/halt';
import type { DebateAgent, AgentVote, SaturationMetrics as SaturationMetricsType } from './lib/types';
import { decomposeFile, reassembleChunks } from './utils/fileSplitter';
import { optimizeSourceCode } from './utils/gemini';
import { sanitizeCode, sanitizeText } from './utils/sanitizer';
import { validateSourceCode, isMarkdownFile, lintSourceCode, isOptimizableFile, isBinaryFile } from './utils/validator';
import { SaturationAlert } from './types';
import AgentOrchestra from './components/AgentOrchestra';
import DebateChamber from './components/DebateChamber';
import BugInspector from './components/BugInspector';
import TemporalParadoxLog from './components/TemporalParadoxLog';
import DosConsoleModal from './components/DosConsoleModal';
import SaturationMetrics from './components/SaturationMetrics';
import SovereignKernelPanel from './components/SovereignKernelPanel';
import { initAudioEngine, playClickSound, playChirpSound } from './components/SoundEngine';
import { Cpu, Users, MessageSquareCode, Bug, History, Gauge, Terminal, Volume2, VolumeX, ShieldCheck } from 'lucide-react';

const INITIAL_CONFIG: EngineConfig = {
  targetRepo: 'craighckby/sovereign-kernel',
  emgRepo: 'craighckby-stack/EMG',
  ghToken: '',
  geminiKey: '',
  model: 'gemini-3.7-flash',
  isSandboxMode: true,
  dryRun: false,
  goal: 'comprehensive',
  loopIntervalSec: 60,
  branch: 'main',
  fileScope: 'all',
  specificFilePath: 'README.md',
  autoSanitize: true,
  strictTypeCheck: true,
  autoApproveSaturated: true,
  allowMultiPass: false,
};

const INITIAL_METRICS: EngineMetrics = {
  enhancements: 0,
  noops: 0,
  validations: 0,
  retries: 0,
  totalScannedFiles: 4,
  avgLatencyMs: 0,
  tokensProcessed: 0,
  sanitizedSecretsCount: 0,
  syntaxErrorsPrevented: 0,
};

const DEFAULT_SYSTEM_STATE = {
  setupComplete: true,
  currentStep: 1,
  connectionStatus: { connected: true, latencyMs: 42 },
  apiKeys: { gemini: '', github: '' },
  repoConfig: { owner: 'craighckby', repo: 'sovereign-kernel', branch: 'main' },
  evolutionCycle: 1,
  saturation: {
    structuralChange: 12,
    semanticShift: 8,
    typeCoherence: 98,
    cognitiveLoad: 15,
  },
  sessionStart: new Date(),
};

async function processChunkedFileOptimization(
  fullContent: string,
  filePath: string,
  geminiKey: string,
  goal: any,
  model: any,
  isSandboxMode: boolean,
  postmortemConstraints?: string,
  previousError?: string,
  pushLog?: (msg: string, type?: LogType, latencyMs?: number, path?: string) => void
): Promise<{
  optimizedCode: string;
  summary: string;
  latencyMs: number;
  tokensEstimate: number;
  modelUsed?: string;
  redactedSecretsCount?: number;
}> {
  const decomposition = decomposeFile(filePath, fullContent, 1000);
  const totalChunks = decomposition.chunks.length;

  pushLog?.(
    `[FILE DECOMPOSITION] File ${filePath} (${decomposition.originalLineCount} lines) decomposed into ${totalChunks} structural module units to prevent token truncation...`,
    'warning',
    undefined,
    filePath
  );

  let totalLatency = 0;
  let totalTokens = 0;
  let redactedSecretsCount = 0;
  const optimizedChunks: string[] = [];
  const summaries: string[] = [];

  for (let i = 0; i < totalChunks; i++) {
    const chunk = decomposition.chunks[i]!;
    const chunkLabel = `${filePath} [${chunk.name} - lines ${chunk.startLine}-${chunk.endLine}]`;

    pushLog?.(
      `[MODULE PASS ${i + 1}/${totalChunks}] Optimizing ${chunk.name} (${chunk.lineCount} lines)...`,
      'neural',
      undefined,
      filePath
    );

    const chunkResult = await optimizeSourceCode(
      chunk.content,
      chunkLabel,
      geminiKey,
      goal,
      model,
      isSandboxMode,
      postmortemConstraints,
      previousError
    );

    optimizedChunks.push(chunkResult.optimizedCode || chunk.content);
    totalLatency += chunkResult.latencyMs || 0;
    totalTokens += chunkResult.tokensEstimate || 0;
    redactedSecretsCount += chunkResult.redactedSecretsCount || 0;
    if (chunkResult.summary) {
      summaries.push(`[${chunk.name}]: ${chunkResult.summary}`);
    }
  }

  const reassembledCode = reassembleChunks(decomposition, optimizedChunks);
  return {
    optimizedCode: reassembledCode,
    summary: summaries.length > 0 ? summaries.join(' | ') : `Structural decomposition patching completed across ${totalChunks} module units.`,
    latencyMs: totalLatency,
    tokensEstimate: totalTokens,
    modelUsed: model,
    redactedSecretsCount,
  };
}

export default function App() {
  const [isAcknowledged, setIsAcknowledged] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const [status, setStatus] = useState<EngineStatus>('IDLE');
  const [activePath, setActivePath] = useState<string | null>(null);
  const [config, setConfig] = useState<EngineConfig>(INITIAL_CONFIG);
  const [metrics, setMetrics] = useState<EngineMetrics>(INITIAL_METRICS);
  const [logs, setLogs] = useState<TelemetryLog[]>([]);
  const [mutations, setMutations] = useState<MutationRecord[]>([]);
  const [latencyHistory, setLatencyHistory] = useState<number[]>(Array(20).fill(0));
  const [latestLatency, setLatestLatency] = useState<number>(0);
  const [selectedRecord, setSelectedRecord] = useState<MutationRecord | null>(null);
  const [saturationAlert, setSaturationAlert] = useState<SaturationAlert | null>(null);
  const [isLicenseOpen, setIsLicenseOpen] = useState(false);
  const [isDiagnosticsOpen, setIsDiagnosticsOpen] = useState(false);
  const [isWipeMemoryOpen, setIsWipeMemoryOpen] = useState(false);
  const [isOracleOpen, setIsOracleOpen] = useState(false);
  const [latestDebate, setLatestDebate] = useState<DebateVerdict | null>(null);
  const [alignmentResult, setAlignmentResult] = useState<AlignmentMatrixResult | null>(null);
  const [haltState, setHaltState] = useState<HaltEvaluationState | null>(null);
  const [isCycling, setIsCycling] = useState(false);
  const [isSyncingRag, setIsSyncingRag] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'sovereign' | 'orchestra' | 'debate' | 'bugs' | 'paradox' | 'saturation'>('sovereign');
  const [isDosOpen, setIsDosOpen] = useState(false);
  const [soundMuted, setSoundMuted] = useState(false);

  const isCyclingRef = useRef(false);
  const loopTimerRef = useRef<NodeJS.Timeout | null>(null);
  const fileIndexRef = useRef(0);
  const consecutiveFailuresRef = useRef<Record<string, number>>({});
  const lastErrorRef = useRef<Record<string, string>>({});
  const engineFaultsRef = useRef<Record<string, number>>({});
  const globalFailuresRef = useRef<number[]>([]);
  const cooldownUntilRef = useRef<number>(0);
  const fileCacheRef = useRef<Record<string, string>>({});

  // Push structured log
  const pushLog = useCallback(
    (msg: string, type: LogType = 'info', latencyMs?: number, path?: string) => {
      const now = new Date();
      const timestamp = now.toLocaleTimeString('en-US', { hour12: false });
      const cleanMsg = sanitizeText(msg);
      const newLog: TelemetryLog = {
        id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        timestamp,
        type,
        msg: cleanMsg,
        ...(latencyMs !== undefined ? { latencyMs } : {}),
        ...(path !== undefined ? { path } : {}),
      };

      setLogs((prev) => [newLog, ...prev].slice(0, 150));
    },
    []
  );

  // Complete memory purge & engine state reset
  const handleWipeMemory = useCallback(
    (options: { resetConfig: boolean } = { resetConfig: true }) => {
      // 1. Terminate autonomous cycle if running
      if (loopTimerRef.current) {
        clearTimeout(loopTimerRef.current);
        loopTimerRef.current = null;
      }
      isCyclingRef.current = false;
      fileIndexRef.current = 0;
      consecutiveFailuresRef.current = {};
      lastErrorRef.current = {};
      cooldownUntilRef.current = 0;
      setIsLive(false);
      setStatus('IDLE');
      setIsCycling(false);
      setActivePath(null);

      // 2. Reset in-memory sandbox repositories to clean initial templates
      resetSandboxRepositories();

      // 3. Reset metrics & latency history
      setMetrics(INITIAL_METRICS);
      setMutations([]);
      setLatencyHistory(Array(20).fill(0));
      setLatestLatency(0);
      setSelectedRecord(null);
      setSaturationAlert(null);
      consecutiveFailuresRef.current = {};
      lastErrorRef.current = {};
      engineFaultsRef.current = {};
      fileIndexRef.current = 0;

      // 4. Clear browser storage cache
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch {
        // ignore
      }

      // 5. Reset configuration or clear skip list
      if (options.resetConfig) {
        setConfig(INITIAL_CONFIG);
      } else {
        setConfig((prev) => ({
          ...prev,
          skippedFiles: [],
        }));
      }

      // 6. Push fresh bootstrap log
      const now = new Date();
      const timestamp = now.toLocaleTimeString('en-US', { hour12: false });
      const purgeLog: TelemetryLog = {
        id: `log-${Date.now()}-purge`,
        timestamp,
        type: 'success',
        msg: '[MEMORY PURGE] Memory wiped & cache emptied. Sandbox repositories restored to initial seed, metrics zeroed, and engine state reset to baseline.',
      };
      setLogs([purgeLog]);
    },
    []
  );

  // Push latency data point to telemetry
  const recordLatency = useCallback((val: number) => {
    setLatestLatency(val);
    setLatencyHistory((prev) => {
      const next = [...prev.slice(1), val];
      return next;
    });
  }, []);

  // Update Config handler
  const handleConfigChange = (key: keyof EngineConfig, value: any) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  // Synchronize RAG vector database & ledgers to dedicated EMG repository
  const handleSyncRag = useCallback(async () => {
    if (!config.ghToken) {
      pushLog('[RAG SYNC] GitHub PAT Token required to sync vectors to repository.', 'warning');
      return;
    }
    const destRepo = config.emgRepo || 'craighckby-stack/EMG';

    setIsSyncingRag(true);
    pushLog(`[RAG SYNC] Synchronizing vector database & ledgers to dedicated EMG repository [${destRepo}]...`, 'info');

    try {
      const res = await publishRagToGithub({
        token: config.ghToken,
        repo: config.targetRepo,
        emgRepo: destRepo,
        branch: 'main',
      });

      if (res.success) {
        pushLog(
          `[RAG SYNC SUCCESS] Synchronized ${(res.syncedFiles || []).length} RAG artifacts to [${destRepo}] [${(res.commitSha || '').slice(0, 7)}]`,
          'success'
        );
      } else {
        pushLog(`[RAG SYNC FAILED] ${res.error || 'Failed to sync vectors'}`, 'error');
      }
    } catch (err: any) {
      pushLog(`[RAG SYNC ERROR] ${err?.message || String(err)}`, 'error');
    } finally {
      setIsSyncingRag(false);
    }
  }, [config.ghToken, config.targetRepo, config.emgRepo, pushLog]);

  // Skip List & Saturation Handlers
  const handleAddToSkipList = (path: string, resumeLoop: boolean = true, autoApproveFuture: boolean = false) => {
    const current = config.skippedFiles || [];
    const newSkipList = current.includes(path) ? current : [...current, path];
    setConfig((prev) => ({
      ...prev,
      skippedFiles: newSkipList,
      ...(autoApproveFuture ? { autoApproveSaturated: true } : {}),
    }));
    pushLog(`[SKIP LIST] File [${path}] added to skip list and will be skipped in future passes.`, 'warning');
    if (autoApproveFuture) {
      pushLog('[CONFIG] Auto-approve saturated files enabled for future cycles.', 'info');
    }
    setSaturationAlert(null);
    if (resumeLoop) {
      setIsLive(true);
      pushLog('Resuming autonomous optimization loop...', 'info');
    }
  };

  const handleKeepInRotation = (resumeLoop: boolean = true) => {
    if (saturationAlert?.path) {
      pushLog(`[ROTATION] File [${saturationAlert.path}] kept in candidate rotation.`, 'info');
    }
    setSaturationAlert(null);
    if (resumeLoop) {
      setIsLive(true);
      pushLog('Resuming autonomous optimization loop...', 'info');
    }
  };

  // Run a single optimization pass
  const executeCycle = useCallback(async () => {
    if (isCyclingRef.current) return;
    if (Date.now() < cooldownUntilRef.current) return; // Currently cooling down
    isCyclingRef.current = true;
    setIsCycling(true);

    try {
      if (config.isSandboxMode) {
        // --- SANDBOX SIMULATED WORKFLOW ---
        setStatus('SCANNING');
        pushLog(`Scanning sandbox repository "${config.targetRepo}"...`, 'info');

        const defaultSandbox = SANDBOX_REPOSITORIES['craighckby/sovereign-kernel'] || { name: 'Sandbox', description: '', files: [] };
        const repoData = SANDBOX_REPOSITORIES[config.targetRepo] || defaultSandbox;
        let candidateFiles = repoData.files;

        // Filter out binary, config, and non-optimizable files to protect quota and ledger
        const isTargetingMarkdown = config.fileScope === 'markdown-only' || (config.fileScope === 'specific' && isMarkdownFile(config.specificFilePath || ''));
        candidateFiles = candidateFiles.filter((f) => isOptimizableFile(f.path, isTargetingMarkdown));

        // Filter out skipped files
        const skippedSet = new Set(config.skippedFiles || []);
        candidateFiles = candidateFiles.filter((f) => !skippedSet.has(f.path));

        // Apply File Scope filter
        if (config.fileScope === 'markdown-only') {
          const mdFiles = candidateFiles.filter((f) => isMarkdownFile(f.path));
          if (mdFiles.length > 0) {
            candidateFiles = mdFiles;
          } else {
            pushLog(`No markdown files found matching scope filter.`, 'warning');
          }
        } else if (config.fileScope === 'specific' && config.specificFilePath?.trim()) {
          const query = config.specificFilePath.trim().toLowerCase();
          const matched = candidateFiles.filter(
            (f) => f.path.toLowerCase().includes(query) || f.path.toLowerCase() === query
          );
          if (matched.length > 0) {
            candidateFiles = matched;
          }
        }

        // Prefer files that haven't failed repeatedly if alternatives exist
        const healthyCandidates = candidateFiles.filter(
          (f) => (consecutiveFailuresRef.current[f.path] || 0) < 3
        );
        if (healthyCandidates.length > 0) {
          candidateFiles = healthyCandidates;
        } else if (candidateFiles.length > 0) {
          pushLog(
            `[AUTONOMOUS LOOP] All candidate files have reached max failure threshold. Pausing loop to prevent infinite cycling.`,
            'warning'
          );
          if (isLive) {
            setIsLive(false);
          }
          setStatus('IDLE');
          return;
        }

        if (candidateFiles.length === 0) {
          pushLog(
            `[GLOBAL SATURATION REACHED] All candidate files have achieved neural saturation and optimization. The repository is fully optimized. 🏁`,
            'success'
          );
          if (isLive) {
            setIsLive(false);
          }
          setActivePath(null);
          setStatus('IDLE');
          return;
        }

        setMetrics((prev) => ({ ...prev, totalScannedFiles: candidateFiles.length }));

        // Sequential round-robin selection
        const targetFile = candidateFiles[fileIndexRef.current % candidateFiles.length];
        if (!targetFile) {
          setActivePath(null);
          setStatus('IDLE');
          return;
        }
        fileIndexRef.current = (fileIndexRef.current + 1) % candidateFiles.length;
        setActivePath(targetFile.path);

        setStatus('OPTIMIZING');
        pushLog(`Synthesizing neural mutations for [${targetFile.path}]...`, 'neural', undefined, targetFile.path);

        const targetLineCount = targetFile.content.split('\n').length;
        let result: any;

        if (targetLineCount > 1000) {
          pushLog(`[TOKEN BUDGET] [${targetFile.path}] is ${targetLineCount} lines (>1000 line ceiling). Switching to chunked-patching pass...`, 'warning', undefined, targetFile.path);
          result = await processChunkedFileOptimization(
            targetFile.content,
            targetFile.path,
            config.geminiKey,
            config.goal,
            config.model,
            config.isSandboxMode,
            config.postmortemConstraints,
            lastErrorRef.current[targetFile.path],
            pushLog
          );
        } else {
          result = await optimizeSourceCode(
            targetFile.content,
            targetFile.path,
            config.geminiKey,
            config.goal,
            config.model,
            config.isSandboxMode,
            config.postmortemConstraints,
            lastErrorRef.current[targetFile.path]
          );
        }

        let cleanCode = result.optimizedCode;
        let scrubbedCount = result.redactedSecretsCount || 0;

        // 1. AUTO-SANITIZATION PASS
        if (config.autoSanitize !== false) {
          const san = sanitizeCode(cleanCode, targetFile.path);
          cleanCode = san.sanitized;
          scrubbedCount += san.redactedCount;
          if (san.redactedCount > 0) {
            pushLog(
              `[AUTO-SANITIZER] Scrubbed ${san.redactedCount} token/secret(s) from [${targetFile.path}]: ${san.redactedTypes.join(', ')}`,
              'warning',
              undefined,
              targetFile.path
            );
          }
        }

        // 2. STRICT TYPE & AST SYNTAX VERIFIER
        let validationDiagnostics: string[] = [];
        if (config.strictTypeCheck !== false) {
          const val = await validateSourceCode(cleanCode, targetFile.path, targetFile.content);
          if (val.autoHealed && val.healedCode) {
            cleanCode = val.healedCode;
            pushLog(`[AUTO-HEALED] Fixed syntax/delimiter issue in [${targetFile.path}].`, 'info', undefined, targetFile.path);
          }

          if (!val.valid) {
            validationDiagnostics = val.errors.map((e) => `Line ${e.line}, Col ${e.column}: ${e.message}`);
            lastErrorRef.current[targetFile.path] = `Strict Type Verification Error: ${validationDiagnostics.join(' | ')}`;
            pushLog(
              `[TYPE/SYNTAX REJECTED] Commit aborted for [${targetFile.path}] due to ${val.errors.length} defect(s): ${validationDiagnostics.slice(0, 2).join(' | ')}`,
              'error',
              result.latencyMs,
              targetFile.path
            );

            // Record failed mutation in history
            const failedRecord: MutationRecord = {
              id: `mut-${Date.now()}`,
              timestamp: new Date().toLocaleTimeString(),
              path: targetFile.path,
              originalCode: targetFile.content,
              optimizedCode: cleanCode,
              originalLines: targetFile.content.split('\n').length,
              optimizedLines: cleanCode.split('\n').length,
              latencyMs: result.latencyMs,
              optimizationSummary: `Type/Syntax verification rejected: ${val.errors[0]?.message || 'Type error'}`,
              status: 'failed',
              validationErrors: validationDiagnostics,
              redactedCount: scrubbedCount,
              typeChecked: true,
            };

            setMutations((prev) => [failedRecord, ...prev]);
            recordLatency(result.latencyMs);
            setMetrics((prev) => ({
              ...prev,
              validations: (prev.validations || 0) + 1,
              syntaxErrorsPrevented: (prev.syntaxErrorsPrevented || 0) + 1,
              sanitizedSecretsCount: (prev.sanitizedSecretsCount || 0) + scrubbedCount,
            }));

            const prevFail = consecutiveFailuresRef.current[targetFile.path] || 0;
            const newFailCount = prevFail + 1;
            consecutiveFailuresRef.current[targetFile.path] = newFailCount;

            if (newFailCount >= 3) {
              pushLog(
                `[AUTONOMOUS LOOP] File [${targetFile.path}] rejected by type/syntax validator ${newFailCount} consecutive times. Added to skip list to allow loop to proceed to other files.`,
                'warning',
                undefined,
                targetFile.path
              );
              setConfig((prev) => ({
                ...prev,
                skippedFiles: [...(prev.skippedFiles || []), targetFile.path],
              }));
            }

            setStatus('IDLE');
            return;
          } else {
            consecutiveFailuresRef.current[targetFile.path] = 0;
            lastErrorRef.current[targetFile.path] = '';
            pushLog(`[TYPE-SAFE] AST syntax & type contracts verified for [${targetFile.path}].`, 'info', undefined, targetFile.path);
          }
        }

        // --- SAME-FILE CHECK BEFORE COMMIT ---
        const originalContent = targetFile.content;
        const normalizeCode = (c: string) => c.split('\n').map(l => l.trimEnd()).join('\n').trim();
        const isIdentical = normalizeCode(cleanCode) === normalizeCode(originalContent);

        if (isIdentical) {
          // Log no-op event
          pushLog(
            `[NO-OP] Code saturation reached for [${targetFile.path}]: AI generated identical content (0 diffs). Commit skipped.`,
            'noop',
            result.latencyMs,
            targetFile.path
          );

          recordLatency(result.latencyMs);
          setMetrics((prev) => ({
            ...prev,
            noops: (prev.noops || 0) + 1,
            validations: (prev.validations || 0) + (config.strictTypeCheck !== false ? 1 : 0),
            sanitizedSecretsCount: (prev.sanitizedSecretsCount || 0) + scrubbedCount,
            tokensProcessed: prev.tokensProcessed + (result.tokensEstimate || 0),
          }));

          if (config.autoApproveSaturated) {
            // Auto-skip list saturated file without pausing loop
            const currentSkipList = config.skippedFiles || [];
            if (!currentSkipList.includes(targetFile.path)) {
              setConfig((prev) => ({
                ...prev,
                skippedFiles: Array.from(new Set([...(prev.skippedFiles || []), targetFile.path])),
              }));
            }
            pushLog(
              `[AUTO-APPROVED] File [${targetFile.path}] auto-skipped due to code saturation (0 diffs). Continuing loop...`,
              'warning',
              undefined,
              targetFile.path
            );
            setStatus('IDLE');
          } else {
            // Auto-pause loop on saturation
            if (isLive) {
              setIsLive(false);
            }
            setStatus('IDLE');

            // Trigger Saturation Alert Modal
            setSaturationAlert({
              path: targetFile.path,
              content: originalContent,
              summary: result.summary,
              latencyMs: result.latencyMs,
              timestamp: new Date().toLocaleTimeString(),
            });
          }

          return;
        }

        // --- HEURISTIC LINTING (SANDBOX) ---
        setStatus('LINTING');
        pushLog(`Running heuristic linting for [${targetFile.path}]...`, 'info', undefined, targetFile.path);
        const sandboxProjectFiles: Record<string, string> = {};
        for (const f of repoData.files) {
          sandboxProjectFiles[f.path] = f.content;
          const bname = f.path.split('/').pop();
          if (bname) sandboxProjectFiles[bname] = f.content;
        }
        const extVal = await lintSourceCode(cleanCode, targetFile.path, sandboxProjectFiles);
        
        if (!extVal.valid) {
          lastErrorRef.current[targetFile.path] = `Heuristic Linting/Compilation Error: ${extVal.lintEvidence}`;
          pushLog(`[HEURISTIC LINT REJECTED] Linting failed. Writing post-mortem lesson...`, 'error', undefined, targetFile.path);
          const prevFail = consecutiveFailuresRef.current[targetFile.path] || 0;
          const newFailCount = prevFail + 1;
          consecutiveFailuresRef.current[targetFile.path] = newFailCount;
          if (newFailCount >= 3) {
            pushLog(
              `[AUTONOMOUS LOOP] File [${targetFile.path}] failed heuristic linting ${newFailCount} consecutive times. Added to skip list.`,
              'warning',
              undefined,
              targetFile.path
            );
            setConfig((prev) => ({
              ...prev,
              skippedFiles: Array.from(new Set([...(prev.skippedFiles || []), targetFile.path])),
            }));
          }
          setStatus('IDLE');
          return;
        }
        lastErrorRef.current[targetFile.path] = '';
        pushLog(`[HEURISTIC LINT PASSED] Linting passed.`, 'success', undefined, targetFile.path);

        // --- SOVEREIGN KERNEL ETHICAL DEBATE & ALIGNMENT MATRIX ---
        const debateVerdict = executeRAGDebate(targetFile.path, cleanCode);
        setLatestDebate(debateVerdict);
        const alignRes = alignmentMatrixEngine.evaluateAlignment(cleanCode, targetFile.path);
        setAlignmentResult(alignRes);

        if (!debateVerdict.approved || !alignRes.alignmentPassed) {
          const rejectReason = !debateVerdict.approved
            ? `Ethical Debate Rejection: Risk score (${debateVerdict.riskScore}/10) >= Benefit score (${debateVerdict.benefitScore}/10). ${debateVerdict.prosecutorStatement.argument}`
            : `Alignment Matrix Rejection: Confidence (${alignRes.overallConfidence}) below threshold or unsafe primitives detected.`;

          pushLog(`[SOVEREIGN DEBATE REJECTED] Mutation blocked on [${targetFile.path}]: ${rejectReason}`, 'error', result.latencyMs, targetFile.path);

          appendFailureAndFix(
            `fail_${Date.now().toString(36)}`,
            `fix_${Date.now().toString(36)}`,
            debateVerdict.sanitizerResult.errorClass || 'ETHICAL_DEBATE_REJECT',
            targetFile.path,
            cleanCode,
            debateVerdict.sanitizerResult.sanitizedCode,
            debateVerdict.prosecutorStatement.argument,
            rejectReason
          );

          setStatus('IDLE');
          return;
        }

        pushLog(`[SOVEREIGN DEBATE APPROVED] Net positive benefit (${debateVerdict.benefitScore.toFixed(1)} > ${debateVerdict.riskScore.toFixed(1)}). Sanitizer clean. Alignment passed.`, 'success', undefined, targetFile.path);

        // --- SELF-STOPPING POINT HALT CHECK ---
        const currentSample = [{ path: targetFile.path, code: cleanCode }];
        const haltEval = checkSelfStoppingPoint(metrics.enhancements + 1, currentSample);
        setHaltState(haltEval);

        if (haltEval.isHalted) {
          pushLog(`[SELF-STOPPING POINT TRIGGERED] ${haltEval.haltReason}. System has reached full convergence with zero growth, zero failure retrievals, and clean sanitizer. 🏁`, 'success');
          if (isLive) {
            setIsLive(false);
          }
        }

        // Apply mutation to sandbox store
        if (!config.dryRun) {
          (targetFile as { content: string }).content = cleanCode;
        }

        // Record clean pattern in RAG vector store
        try {
          appendCleanCommit(
            `c_sandbox_${Date.now().toString(36)}`,
            targetFile.path,
            cleanCode.slice(0, 800)
          );
        } catch (ragErr) {
          console.warn('[RAG Vector Write Warning]', ragErr);
        }

        // Auto-mark file as optimized in current session so it does not cycle infinitely
        if (!config.allowMultiPass) {
          const currentSandboxSkip = config.skippedFiles || [];
          if (!currentSandboxSkip.includes(targetFile.path)) {
            setConfig((prev) => ({
              ...prev,
              skippedFiles: Array.from(new Set([...(prev.skippedFiles || []), targetFile.path])),
            }));
          }
        }

        const originalLines = originalContent.split('\n').length;
        const optimizedLines = cleanCode.split('\n').length;

        // Record mutation
        const record: MutationRecord = {
          id: `mut-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString(),
          path: targetFile.path,
          originalCode: originalContent,
          optimizedCode: cleanCode,
          originalLines,
          optimizedLines,
          latencyMs: result.latencyMs,
          optimizationSummary: result.summary,
          status: config.dryRun ? 'dry-run' : 'applied',
          redactedCount: scrubbedCount,
          typeChecked: config.strictTypeCheck !== false,
        };

        setMutations((prev) => [record, ...prev]);
        recordLatency(result.latencyMs);

        // Update metrics
        setMetrics((prev) => {
          const newEnhancements = prev.enhancements + 1;
          const newTokens = prev.tokensProcessed + result.tokensEstimate;
          const newAvgLatency = prev.avgLatencyMs === 0
            ? result.latencyMs
            : Math.round((prev.avgLatencyMs * prev.enhancements + result.latencyMs) / newEnhancements);

          return {
            ...prev,
            enhancements: newEnhancements,
            tokensProcessed: newTokens,
            avgLatencyMs: newAvgLatency,
            validations: (prev.validations || 0) + (config.strictTypeCheck !== false ? 1 : 0),
            sanitizedSecretsCount: (prev.sanitizedSecretsCount || 0) + scrubbedCount,
          };
        });

        setStatus('COMMITTING');
        pushLog(
          `Mutation applied: ${targetFile.path} (${result.latencyMs}ms) - ${result.summary}`,
          'success',
          result.latencyMs,
          targetFile.path
        );

      } else {
        // --- REAL GITHUB LIVE REPOSITORY WORKFLOW ---
        if (!config.targetRepo || !config.targetRepo.includes('/')) {
          throw new Error('Invalid Target Repository format. Please use "owner/repo".');
        }

        setStatus('SCANNING');
        pushLog(`Handshaking with GitHub repo "${config.targetRepo}"...`, 'info');

        const repoInfo = await fetchRepoDetails(config.targetRepo, config.ghToken);
        const branch = (config.branch && config.branch.trim()) ? config.branch.trim() : (repoInfo.default_branch || 'main');

        pushLog(`Discovering file tree for branch [${branch}]...`, 'info');
        const tree = await fetchRepoTree(config.targetRepo, branch, config.ghToken);

        if (tree.length === 0) {
          throw new Error('No candidate source code files found in repository tree.');
        }

        // --- SATURATION LOCKOUT (PM#11: Prevent Post-Halt Ghost Feedback / Over-Optimization) ---
        const currentTreeFingerprint = await computeSHA256(tree.map(t => `${t.path}:${t.sha}`).join('|'));
        if (
          config.saturatedTreeHash === currentTreeFingerprint &&
          config.saturatedGoal === config.goal &&
          !config.postmortemConstraints?.includes('[MANUAL_OVERRIDE]')
        ) {
          pushLog(
            `[REFUSAL] Repository at saturation (Baseline SHA: ${currentTreeFingerprint.slice(0, 12)}...). Re-runs require new input, ledger update, or prompt goal change.`,
            'warning'
          );
          if (isLive) {
            setIsLive(false);
          }
          setStatus('IDLE');
          return;
        }

        let skippedSet = new Set(config.skippedFiles || []);
        
        // --- PERMANENT LAB FIXTURE PROTECTION (PM#9: Freeze Apparatus) ---
        const protectedFixtures = [
          'docs/POSTMORTEMS.md',
          'POSTMORTEMS.md',
          'BUGS.md',
          'docs/BUGS.md',
          'README.md',
          'docs/RULES.md',
          'RULES.md',
          'docs/ARCHITECTURE.md',
          'ARCHITECTURE.md',
          'DISCLAIMER.md',
          'LICENSE.md',
          'LICENSE',
          'LICENSE.txt',
          'PREDICTIONS.md',
          'package.json',
          'tsconfig.json',
          'vite.config.ts'
        ];
        for (const fixture of protectedFixtures) {
          skippedSet.add(fixture);
        }
        
        // --- 1 & 2. PRE-PASS: Read POSTMORTEMS.md and load rules if changed ---
        const postmortemItem = tree.find(i => i.path === 'docs/POSTMORTEMS.md' || i.path === 'POSTMORTEMS.md');
        if (postmortemItem) {
          try {
            const pmData = await fetchFileContent(config.targetRepo, postmortemItem.path, config.ghToken, branch);
            let content = pmData.content;
            
            // Ledger self-healing: purge poisoned isolation entries (PM#10)
            const oldLines = content.split('\n');
            let inPoisonedBlock = false;
            let healedContent = '';
            let healCount = 0;

            for (let i = 0; i < oldLines.length; i++) {
                const line = oldLines[i] ?? '';
                if (line.startsWith('### ❌')) {
                    // Extract possible file path from header. e.g. "### ❌ [2026-09-10] .codespellrc `source: mutation-cycle`"
                    const headerTokens = line.split(/\s+/);
                    let isNonOptimizable = false;
                    for (const tok of headerTokens) {
                        const cleanTok = tok.trim().replace(/`/g, '');
                        if (cleanTok.includes('.') || cleanTok.includes('/')) {
                            if (isBinaryFile(cleanTok) || !isOptimizableFile(cleanTok)) {
                                isNonOptimizable = true;
                                break;
                            }
                        }
                    }

                    // Check ahead for poisoned evidence
                    let lookahead = i + 1;
                    let isPoisoned = isNonOptimizable;
                    while (lookahead < oldLines.length && !oldLines[lookahead]?.startsWith('### ')) {
                        const l = (oldLines[lookahead] ?? '').toLowerCase();
                        if (l.includes('fatal error:') && l.includes('no such file or directory')) isPoisoned = true;
                        if (l.includes('error:') && (l.includes('undeclared') || l.includes('unknown type name') || l.includes('implicit declaration'))) isPoisoned = true;
                        if (l.includes('lint reject: no_unused_macros') || l.includes('never applied')) isPoisoned = true;
                        lookahead++;
                    }
                    if (isPoisoned) {
                        healCount++;
                        const dateStr = new Date().toISOString().split('T')[0];
                        healedContent += line.replace('❌', `⚠️ [STRUCK: NOT_VERIFIABLE, ${dateStr}]`) + '\n';
                        inPoisonedBlock = true;
                        continue;
                    } else {
                        inPoisonedBlock = false;
                    }
                }
                
                if (inPoisonedBlock && line.startsWith('**CONSTRAINT')) {
                    healedContent += `**CONSTRAINT (Model Generalization):** [STRUCK] Original constraint invalidated. Artifact of isolated compilation missing project context.\n`;
                } else {
                    healedContent += line + '\n';
                }
            }
            
            const filteredContent = healedContent.trim() + '\n';
            const normalizedOriginal = content.replace(/\r\n/g, '\n').trim();
            const normalizedFiltered = filteredContent.replace(/\r\n/g, '\n').trim();
            
            if (healCount > 0 && normalizedFiltered !== normalizedOriginal && !config.dryRun && config.ghToken) {
               pushLog(`[LEDGER HEAL] Found and re-tagged ${healCount} poisoned isolated-compile constraints in ${postmortemItem.path}. Self-healing repository...`, 'warning');
               let healRetries = 5;
               let currentSha = pmData.sha;
               while (healRetries > 0) {
                   try {
                       await commitFileUpdate(
                         config.targetRepo,
                         postmortemItem.path,
                         filteredContent,
                         currentSha,
                         config.ghToken,
                         `EMG Core: Purging poisoned isolated-compile constraints from ledger`,
                         branch
                       );
                       break;
                   } catch (commitErr: any) {
                       if (commitErr.message && commitErr.message.includes('409') && healRetries > 1) {
                           healRetries--;
                           await new Promise(r => setTimeout(r, 1000 + Math.random() * 1000));
                           const freshData = await fetchFileContent(config.targetRepo, postmortemItem.path, config.ghToken, branch);
                           currentSha = freshData.sha;
                           continue;
                       }
                       throw commitErr;
                   }
               }
               content = filteredContent;
            }

            const sha256Hash = await computeSHA256(content);
            
            if (sha256Hash !== config.postmortemHash) {
              const prevHashShort = config.postmortemHash ? config.postmortemHash.slice(0, 12) : 'NONE';
              const newHashShort = sha256Hash.slice(0, 12);
              pushLog(
                `[LEARNING] Detected updated ${postmortemItem.path} (SHA-256: ${newHashShort}... | Prev: ${prevHashShort}...). Ingesting updated negative constraints and re-arming prompt memory.`,
                'info'
              );
              
              // Invalidate skip list for candidate code re-evaluation, preserving permanent fixture locks
              // PM#12: Do NOT reset the 0-diff saturation cache. Only re-arm files if we want to.
              // We will just update the constraints and hash, but KEEP the skippedFiles list intact
              // so saturated files (0-diffs) don't get needlessly re-optimized.
              setConfig(prev => ({
                ...prev,
                postmortemHash: sha256Hash,
                postmortemConstraints: pmData.content
              }));
              pushLog(`[LEARNING] Ingested ledger hash mutation (${sha256Hash}). Negative constraints updated.`, 'info');
            }
          } catch (e) {
            pushLog(`Failed to sync ledger: ${String(e)}`, 'error');
          }
        }

        // Filter out skipped files & explicitly log protected apparatus fixtures
        const protectedEncountered = tree.filter((item) => protectedFixtures.includes(item.path));
        for (const pf of protectedEncountered) {
          pushLog(`[SKIP] Protected apparatus fixture: ${pf.path} (PM#9: Write-protection active)`, 'info');
        }

        let candidateTree = tree.filter((item) => !skippedSet.has(item.path));

        // Filter out binary, config, and non-optimizable files to protect quota and ledger (PM#13)
        // Strictly exclude .md, .rst, .txt and non-code docs unless fileScope is explicitly targeting markdown
        const isTargetingMarkdown = config.fileScope === 'markdown-only' || (config.fileScope === 'specific' && isMarkdownFile(config.specificFilePath || ''));
        candidateTree = candidateTree.filter((item) => isOptimizableFile(item.path, isTargetingMarkdown));

        // Apply File Scope filter
        if (config.fileScope === 'markdown-only') {
          const mdFiles = candidateTree.filter((item) => isMarkdownFile(item.path));
          if (mdFiles.length > 0) {
            candidateTree = mdFiles;
          } else {
            pushLog(`No markdown files found matching scope filter.`, 'warning');
          }
        } else if (config.fileScope === 'specific' && config.specificFilePath?.trim()) {
          const query = config.specificFilePath.trim().toLowerCase();
          const matched = candidateTree.filter(
            (item) => item.path.toLowerCase().includes(query) || item.path.toLowerCase() === query
          );
          if (matched.length > 0) {
            candidateTree = matched;
          } else {
            pushLog(`Specified file "${config.specificFilePath}" not found in filtered tree.`, 'warning');
          }
        }

        // Prefer files that haven't failed repeatedly if alternatives exist
        const healthyCandidates = candidateTree.filter(
          (item) => (consecutiveFailuresRef.current[item.path] || 0) < 3
        );
        if (healthyCandidates.length > 0) {
          candidateTree = healthyCandidates;
        } else if (candidateTree.length > 0) {
          pushLog(
            `[AUTONOMOUS LOOP] All repository candidate files have reached max failure threshold. Pausing loop to prevent cycling.`,
            'warning'
          );
          if (isLive) {
            setIsLive(false);
          }
          setStatus('IDLE');
          return;
        }

        if (candidateTree.length === 0) {
          pushLog(
            `[GLOBAL SATURATION REACHED] No remaining diffs under current constraints. The repository is converged — not proven optimal. Re-runs require new input. 🏁`,
            'success'
          );
          if (isLive) {
            setIsLive(false);
          }
          // Lock out redundant re-runs until repo tree or goals change
          setConfig(prev => ({
            ...prev,
            saturatedTreeHash: currentTreeFingerprint,
            saturatedGoal: prev.goal
          }));
          setActivePath(null);
          setStatus('IDLE');
          return;
        }

        setMetrics((prev) => ({ ...prev, totalScannedFiles: candidateTree.length }));

        // Select candidate file sequentially (round-robin)
        const target = candidateTree[fileIndexRef.current % candidateTree.length];
        if (!target) {
          setActivePath(null);
          setStatus('IDLE');
          return;
        }
        fileIndexRef.current = (fileIndexRef.current + 1) % candidateTree.length;
        setActivePath(target.path);

        // --- TREE-EXISTENCE PRE-CHECK (KILLS PHANTOMS) ---
        const existsInTree = tree.some(i => i.path === target.path);
        if (!existsInTree) {
           pushLog(`[ENGINE FAULT] Target ${target.path} does not exist in the repository tree. Phantom file skipped.`, 'error');
           setStatus('IDLE');
           return;
        }

        setStatus('FETCHING');
        pushLog(`Fetching source blob: ${target.path}...`, 'info');
        const fileData = await fetchFileContent(config.targetRepo, target.path, config.ghToken, branch);

        // --- FILE SIZE BUDGET CHECK & CHUNKED PATCHING ---
        const lineCount = fileData.content.split('\n').length;
        let result: any;

        if (lineCount > 1000) {
          setStatus('OPTIMIZING');
          pushLog(`[TOKEN BUDGET] [${target.path}] is ${lineCount} lines (>1000 line ceiling). Switching to chunked-patching pass...`, 'warning', undefined, target.path);
          result = await processChunkedFileOptimization(
            fileData.content,
            target.path,
            config.geminiKey,
            config.goal,
            config.model,
            config.isSandboxMode,
            config.postmortemConstraints,
            lastErrorRef.current[target.path],
            pushLog
          );
        } else {
          setStatus('OPTIMIZING');
          pushLog(`Neural AST optimization in progress for [${target.path}]...`, 'neural', undefined, target.path);

          result = await optimizeSourceCode(
            fileData.content,
            target.path,
            config.geminiKey,
            config.goal,
            config.model,
            config.isSandboxMode,
            config.postmortemConstraints,
            lastErrorRef.current[target.path]
          );
        }

        let cleanCode = result.optimizedCode;
        let scrubbedCount = result.redactedSecretsCount || 0;

        // 1. AUTO-SANITIZATION PASS
        if (config.autoSanitize !== false) {
          const san = sanitizeCode(cleanCode, target.path);
          cleanCode = san.sanitized;
          scrubbedCount += san.redactedCount;
          if (san.redactedCount > 0) {
            pushLog(
              `[AUTO-SANITIZER] Scrubbed ${san.redactedCount} token/secret(s) from [${target.path}]: ${san.redactedTypes.join(', ')}`,
              'warning',
              undefined,
              target.path
            );
          }
        }

        // 2. STRICT TYPE & AST SYNTAX VERIFIER
        let validationDiagnostics: string[] = [];
        if (config.strictTypeCheck !== false) {
          const val = await validateSourceCode(cleanCode, target.path, fileData.content);
          if (val.autoHealed && val.healedCode) {
            cleanCode = val.healedCode;
            pushLog(`[AUTO-HEALED] Fixed syntax/delimiter issue in [${target.path}].`, 'info', undefined, target.path);
          }

          if (!val.valid) {
            validationDiagnostics = val.errors.map((e) => `Line ${e.line}, Col ${e.column}: ${e.message}`);
            lastErrorRef.current[target.path] = `Strict Type Verification Error: ${validationDiagnostics.join(' | ')}`;
            
            // TRUNCATION DIAGNOSTIC HINT
            if (cleanCode.length < fileData.content.length * 0.8) {
                const hint = `[OUTPUT_LIKELY_TRUNCATED] The output is < 80% of original length and syntactically invalid. The model likely hit its output token limit.`;
                validationDiagnostics.push(hint);
            }

            pushLog(
              `[TYPE/SYNTAX REJECTED] Commit aborted for [${target.path}] due to ${val.errors.length} defect(s): ${validationDiagnostics.slice(0, 2).join(' | ')}`,
              'error',
              result.latencyMs,
              target.path
            );

            // Record failed mutation in history
            const failedRecord: MutationRecord = {
              id: `mut-${Date.now()}`,
              timestamp: new Date().toLocaleTimeString(),
              path: target.path,
              originalCode: fileData.content,
              optimizedCode: cleanCode,
              originalLines: fileData.content.split('\n').length,
              optimizedLines: cleanCode.split('\n').length,
              latencyMs: result.latencyMs,
              optimizationSummary: `Type/Syntax verification rejected: ${val.errors[0]?.message || 'Type error'}`,
              status: 'failed',
              validationErrors: validationDiagnostics,
              redactedCount: scrubbedCount,
              typeChecked: true,
            };

            setMutations((prev) => [failedRecord, ...prev]);
            recordLatency(result.latencyMs);
            setMetrics((prev) => ({
              ...prev,
              validations: (prev.validations || 0) + 1,
              syntaxErrorsPrevented: (prev.syntaxErrorsPrevented || 0) + 1,
              sanitizedSecretsCount: (prev.sanitizedSecretsCount || 0) + scrubbedCount,
            }));

            // Memory Write-Back for AST / Type Errors
            if (!config.dryRun && config.ghToken) {
              try {
                const astEvidence = validationDiagnostics.join('\n');
                const pmResult = await writePostmortem(
                  config.targetRepo,
                  target.path,
                  'Failure',
                  astEvidence,
                  config.ghToken,
                  branch,
                  {
                    source: 'mutation-cycle',
                    symptom: 'AST / TypeScript Compiler Validation Rejected',
                  }
                );
                if (pmResult?.hash) {
                  setConfig((prev) => ({
                    ...prev,
                    postmortemHash: pmResult.hash,
                    postmortemConstraints: pmResult.content,
                    ...(pmResult.isEscalated ? { skippedFiles: Array.from(new Set([...(prev.skippedFiles || []), target.path])) } : {}),
                  }));
                  pushLog(`[LEARN] Auto-logged AST failure to docs/POSTMORTEMS.md. Ingested constraint.`, 'warning');
                  if (pmResult.isEscalated) {
                    pushLog(`[ESCALATION ENFORCED] Error on [${target.path}] reached threshold (${pmResult.occurrenceCount} occurrences). Added file to skip list to prevent infinite loop.`, 'error', undefined, target.path);
                  }
                }
              } catch (pmErr) {
                console.error('Failed to write AST postmortem:', pmErr);
              }
            }

            const prevFail = consecutiveFailuresRef.current[target.path] || 0;
            const newFailCount = prevFail + 1;
            consecutiveFailuresRef.current[target.path] = newFailCount;

            if (newFailCount >= 3) {
              pushLog(
                `[AUTONOMOUS LOOP] File [${target.path}] rejected by type/syntax validator ${newFailCount} consecutive times. Added to skip list to allow loop to proceed to other files.`,
                'warning',
                undefined,
                target.path
              );
              setConfig((prev) => ({
                ...prev,
                skippedFiles: [...(prev.skippedFiles || []), target.path],
              }));
            }

            setStatus('IDLE');
            return;
          } else {
            consecutiveFailuresRef.current[target.path] = 0;
            lastErrorRef.current[target.path] = '';
            pushLog(`[TYPE-SAFE] AST syntax & type contracts verified for [${target.path}].`, 'info', undefined, target.path);
          }
        }

        // --- SAME-FILE CHECK BEFORE COMMIT ---
        const originalContent = fileData.content;
        const normalizeCode = (c: string) => c.split('\n').map(l => l.trimEnd()).join('\n').trim();
        const isIdentical = normalizeCode(cleanCode) === normalizeCode(originalContent);

        if (isIdentical) {
          // Log no-op event
          pushLog(
            `[NO-OP] Code saturation reached for [${target.path}]: AI generated identical content (0 diffs). Commit skipped.`,
            'noop',
            result.latencyMs,
            target.path
          );

          recordLatency(result.latencyMs);
          setMetrics((prev) => ({
            ...prev,
            noops: (prev.noops || 0) + 1,
            validations: (prev.validations || 0) + (config.strictTypeCheck !== false ? 1 : 0),
            sanitizedSecretsCount: (prev.sanitizedSecretsCount || 0) + scrubbedCount,
            tokensProcessed: prev.tokensProcessed + (result.tokensEstimate || 0),
          }));

          if (config.autoApproveSaturated) {
            // Auto-skip list saturated file without pausing loop
            const currentSkipList = config.skippedFiles || [];
            if (!currentSkipList.includes(target.path)) {
              setConfig((prev) => ({
                ...prev,
                skippedFiles: [...(prev.skippedFiles || []), target.path],
              }));
            }
            pushLog(
              `[AUTO-APPROVED] File [${target.path}] auto-skipped due to code saturation (0 diffs). Continuing loop...`,
              'warning',
              undefined,
              target.path
            );
            setStatus('IDLE');
          } else {
            // Auto-pause loop on saturation
            if (isLive) {
              setIsLive(false);
            }
            setStatus('IDLE');

            // Trigger Saturation Alert Modal
            setSaturationAlert({
              path: target.path,
              content: originalContent,
              summary: result.summary,
              latencyMs: result.latencyMs,
              timestamp: new Date().toLocaleTimeString(),
            });
          }

          return;
        }

        // --- HEURISTIC LINTING AND WRITE-BACK ---
        setStatus('LINTING');
        pushLog(`Running heuristic linting for [${target.path}]...`, 'info', undefined, target.path);
        
        // Pre-fetch local files for project-aware compiling and macro cross-checking
        const projectFiles: Record<string, string> = {};
        const sourceFiles = tree.filter(i => /\.(c|cpp|cc|cxx|h|hpp|hxx|inl|hh|inc|rs|go|py|ts|js)$/i.test(i.path));
        for (const f of sourceFiles) {
          const basename = f.path.split('/').pop();
          const cached = fileCacheRef.current[f.path];
          if (cached) {
            projectFiles[f.path] = cached;
            if (basename) projectFiles[basename] = cached;
          } else if (/\.(h|hpp|hxx|inl|hh|inc|c|cpp)$/i.test(f.path)) {
            try {
              const fData = await fetchFileContent(config.targetRepo, f.path, config.ghToken, branch);
              fileCacheRef.current[f.path] = fData.content;
              projectFiles[f.path] = fData.content;
              if (basename) projectFiles[basename] = fData.content;
            } catch (e) {
              // Ignore individual fetch failure
            }
          }
        }

        const extVal = await lintSourceCode(cleanCode, target.path, projectFiles);
        
        if (!extVal.valid) {
          let verdict = extVal.verdict;
          
          if (extVal.hitRecursionCap) {
             pushLog(`[LINTER WARN] Splicing recursion cap reached for ${target.path}. Possible circular dependency.`, 'warning');
          }

          if (verdict === 'NOT_VERIFIABLE_IN_ISOLATION' && extVal.undeclaredSymbol) {
             // Let's check if the symbol exists ANYWHERE in the fetched project files.
             // If not, it's a true hallucination, not an isolation error.
             const symbolPattern = new RegExp(`\\b${extVal.undeclaredSymbol}\\b`);
             let foundInHeaders = false;
             for (const content of Object.values(projectFiles)) {
                 if (symbolPattern.test(content)) {
                     foundInHeaders = true;
                     break;
                 }
             }
             
             // If we didn't find it in the local included headers, it's a true REJECT
             if (!foundInHeaders) {
                 pushLog(`[HEURISTIC LINT OVERRIDE] Symbol '${extVal.undeclaredSymbol}' not found in any local headers. Treating as genuine hallucination/defect.`, 'error');
                 verdict = 'INVALID';
             }
          }

          if (verdict === 'NOT_VERIFIABLE_IN_ISOLATION') {
            pushLog(`[HEURISTIC LINT SKIPPED] Gate bypassed on [${target.path}]: Not verifiable in isolation (missing cross-file include or macro dependency). Treating as structurally sound but will NOT commit unverified code. Auto-skipping file to prevent loops.`, 'warning', undefined, target.path);
            
            setConfig((prev) => ({
              ...prev,
              skippedFiles: Array.from(new Set([...(prev.skippedFiles || []), target.path])),
            }));
            
            setStatus('IDLE');
            return;
          } else {
            lastErrorRef.current[target.path] = `Heuristic Linting/Compilation Error: ${extVal.lintEvidence}`;
            pushLog(`[HEURISTIC LINT REJECTED] Gate fired on [${target.path}]: ${extVal.lintEvidence}`, 'error', undefined, target.path);
            
            // Push to rolling window for circuit breaker
            const now = Date.now();
            globalFailuresRef.current.push(now);
            
            // Clean up failures older than 5 minutes
            globalFailuresRef.current = globalFailuresRef.current.filter(t => now - t < 5 * 60 * 1000);
            
            if (!config.dryRun && config.ghToken) {
              try {
                const pmResult = await writePostmortem(
                  config.targetRepo,
                  target.path,
                  'Failure',
                  extVal.lintEvidence,
                  config.ghToken,
                  branch,
                  {
                    source: 'mutation-cycle',
                    symptom: 'Active Linter / Compiler Gate Rejection on LLM Output (Option B)',
                  }
                );
                if (pmResult?.hash) {
                  setConfig((prev) => ({
                    ...prev,
                    postmortemHash: pmResult.hash,
                    postmortemConstraints: pmResult.content,
                    ...(pmResult.isEscalated ? { skippedFiles: Array.from(new Set([...(prev.skippedFiles || []), target.path])) } : {}),
                  }));
                  pushLog(`[LEARN] Logged failure to docs/POSTMORTEMS.md. Ingested negative constraint for next cycle.`, 'warning');
                  if (pmResult.isEscalated) {
                    pushLog(`[ESCALATION ENFORCED] Error on [${target.path}] reached threshold (${pmResult.occurrenceCount} occurrences). Added file to skip list to prevent infinite loop.`, 'error', undefined, target.path);
                  }
                }
              } catch (pmErr) {
                pushLog(`Failed to write postmortem: ${String(pmErr)}`, 'error');
              }
            }
            const prevFail = consecutiveFailuresRef.current[target.path] || 0;
            const newFailCount = prevFail + 1;
            consecutiveFailuresRef.current[target.path] = newFailCount;
            if (newFailCount >= 3) {
              pushLog(
                `[AUTONOMOUS LOOP] File [${target.path}] failed heuristic linting ${newFailCount} consecutive times. Added to skip list.`,
                'warning',
                undefined,
                target.path
              );
              setConfig((prev) => ({
                ...prev,
                skippedFiles: Array.from(new Set([...(prev.skippedFiles || []), target.path])),
              }));
            }
            
            // Quota circuit-breaker (5 failures in 5 minutes)
            if (globalFailuresRef.current.length >= 5) {
                pushLog(`[CIRCUIT BREAKER] 5 gate failures within a 5-minute window. Halting live loop to prevent API quota burn.`, 'error');
                if (isLive) setIsLive(false);
            }
            
            setStatus('IDLE');
            return;
          }
        } else {
          lastErrorRef.current[target.path] = '';
          pushLog(`[HEURISTIC LINT PASSED] Linting passed.`, 'success', undefined, target.path);
          consecutiveFailuresRef.current[target.path] = 0;
        }
        // Successful optimizations do not generate failure postmortems, avoiding commit loops

        const originalLines = originalContent.split('\n').length;
        const optimizedLines = cleanCode.split('\n').length;

        // Pre-commit destructive truncation, test deletion, and license stripping safety guards
        if (!isTargetingMarkdown) {
          if (originalLines >= 15 && optimizedLines < Math.floor(originalLines * 0.70)) {
            pushLog(`[SAFETY ABORT] Catastrophic truncation detected (${originalLines} -> ${optimizedLines} lines). Refusing to commit to prevent code loss.`, 'error', undefined, target.path);
            setStatus('IDLE');
            return;
          }

          if (target.path.toLowerCase().includes('test')) {
            const testPattern = /(?:def\s+test_|@pytest\.mark|test\s*\(|it\s*\(|func\s+Test[A-Z0-9_]|\[Fact\]|\[Test\]|\[Theory\])/g;
            const origTests = (originalContent.match(testPattern) || []).length;
            const candTests = (cleanCode.match(testPattern) || []).length;
            if (origTests >= 1 && candTests < origTests) {
              pushLog(`[SAFETY ABORT] Test suite reduction detected (${origTests} -> ${candTests} tests). Refusing to commit to protect test coverage.`, 'error', undefined, target.path);
              setStatus('IDLE');
              return;
            }
          }

          const origHasLicense = /(?:SPDX-License-Identifier:|Copyright\s+(?:\([cC]\)|©)|Licensed\s+under\s+the|Permission\s+is\s+hereby\s+granted)/i.test(originalContent.slice(0, 2000));
          const candHasLicense = /(?:SPDX-License-Identifier:|Copyright\s+(?:\([cC]\)|©)|Licensed\s+under\s+the|Permission\s+is\s+hereby\s+granted)/i.test(cleanCode.slice(0, 2000));
          if (origHasLicense && !candHasLicense) {
            pushLog(`[SAFETY ABORT] License or copyright header stripped. Refusing to commit.`, 'error', undefined, target.path);
            setStatus('IDLE');
            return;
          }

          // Enforce POSIX single trailing newline
          if (!cleanCode.endsWith('\n')) {
            cleanCode = cleanCode.trimEnd() + '\n';
          }
        }

        // --- SOVEREIGN KERNEL ETHICAL DEBATE & ALIGNMENT MATRIX GATE ---
        const debateVerdict = executeRAGDebate(target.path, cleanCode);
        setLatestDebate(debateVerdict);
        const alignRes = alignmentMatrixEngine.evaluateAlignment(cleanCode, target.path);
        setAlignmentResult(alignRes);

        if (!debateVerdict.approved || !alignRes.alignmentPassed) {
          const rejectReason = !debateVerdict.approved
            ? `Ethical Debate Rejection: Risk score (${debateVerdict.riskScore}/10) >= Benefit score (${debateVerdict.benefitScore}/10). ${debateVerdict.prosecutorStatement.argument}`
            : `Alignment Matrix Rejection: Confidence (${alignRes.overallConfidence}) below threshold or unsafe primitives detected.`;

          pushLog(`[SOVEREIGN DEBATE REJECTED] Mutation blocked on [${target.path}]: ${rejectReason}`, 'error', result.latencyMs, target.path);

          appendFailureAndFix(
            `fail_${Date.now().toString(36)}`,
            `fix_${Date.now().toString(36)}`,
            debateVerdict.sanitizerResult.errorClass || 'ETHICAL_DEBATE_REJECT',
            target.path,
            cleanCode,
            debateVerdict.sanitizerResult.sanitizedCode,
            debateVerdict.prosecutorStatement.argument,
            rejectReason,
            undefined,
            config.ghToken ? {
              token: config.ghToken,
              repo: config.targetRepo,
              emgRepo: config.emgRepo || 'craighckby-stack/EMG',
              branch: 'main',
            } : undefined
          );

          setStatus('IDLE');
          return;
        }

        pushLog(`[SOVEREIGN DEBATE APPROVED] Net positive benefit (${debateVerdict.benefitScore.toFixed(1)} > ${debateVerdict.riskScore.toFixed(1)}). Sanitizer clean. Alignment passed.`, 'success', undefined, target.path);

        // --- SELF-STOPPING POINT HALT CHECK ---
        const currentSample = [{ path: target.path, code: cleanCode }];
        const haltEval = checkSelfStoppingPoint(metrics.enhancements + 1, currentSample);
        setHaltState(haltEval);

        if (haltEval.isHalted) {
          pushLog(`[SELF-STOPPING POINT TRIGGERED] ${haltEval.haltReason}. System has reached full convergence with zero growth, zero failure retrievals, and clean sanitizer. 🏁`, 'success');
          if (isLive) {
            setIsLive(false);
          }
        }

        let commitSha = 'dry-run';

        if (!config.dryRun) {
          if (!config.ghToken) {
            throw new Error('GitHub PAT Token is required to commit changes to a real repository.');
          }

          // Strict Commit Phase Guard for Protected Apparatus Fixtures (PM#9)
          if (protectedFixtures.includes(target.path)) {
            pushLog(`[SKIP] Protected apparatus fixture: ${target.path} (PM#9: Write-protection active) - Commit aborted.`, 'warning');
            setStatus('IDLE');
            return;
          }

          setStatus('COMMITTING');
          pushLog(`Pushing optimized commit for ${target.path}...`, 'info');
          const commitRes = await commitFileUpdate(
            config.targetRepo,
            target.path,
            cleanCode,
            fileData.sha,
            config.ghToken,
            `EMG Core: Refactoring on ${target.path}`,
            config.branch
          );
          commitSha = commitRes.commitSha;
        }

        // Auto-mark file as optimized in current session so it does not cycle infinitely
        if (!config.allowMultiPass) {
          const currentLiveSkip = config.skippedFiles || [];
          if (!currentLiveSkip.includes(target.path)) {
            setConfig((prev) => ({
              ...prev,
              skippedFiles: Array.from(new Set([...(prev.skippedFiles || []), target.path])),
            }));
          }
        }

        // Record mutation
        const record: MutationRecord = {
          id: `mut-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString(),
          path: target.path,
          originalCode: originalContent,
          optimizedCode: cleanCode,
          originalLines,
          optimizedLines,
          latencyMs: result.latencyMs,
          commitSha,
          optimizationSummary: result.summary,
          status: config.dryRun ? 'dry-run' : 'applied',
          redactedCount: scrubbedCount,
          typeChecked: config.strictTypeCheck !== false,
        };

        setMutations((prev) => [record, ...prev]);
        recordLatency(result.latencyMs);

        // Record clean pattern in RAG vector store and schedule debounced sync to dedicated EMG repository
        try {
          appendCleanCommit(
            commitSha || `c_${Date.now()}`,
            target.path,
            cleanCode.slice(0, 800),
            config.ghToken ? {
              token: config.ghToken,
              repo: config.targetRepo,
              emgRepo: config.emgRepo || 'craighckby-stack/EMG',
              branch: 'main',
            } : undefined
          );
        } catch (ragErr) {
          console.warn('[RAG Vector Write Warning]', ragErr);
        }

        // Update metrics
        setMetrics((prev) => {
          const newEnhancements = prev.enhancements + 1;
          const newTokens = prev.tokensProcessed + result.tokensEstimate;
          const newAvgLatency = prev.avgLatencyMs === 0
            ? result.latencyMs
            : Math.round((prev.avgLatencyMs * prev.enhancements + result.latencyMs) / newEnhancements);

          return {
            ...prev,
            enhancements: newEnhancements,
            tokensProcessed: newTokens,
            avgLatencyMs: newAvgLatency,
            validations: (prev.validations || 0) + (config.strictTypeCheck !== false ? 1 : 0),
            sanitizedSecretsCount: (prev.sanitizedSecretsCount || 0) + scrubbedCount,
          };
        });

        pushLog(
          `Mutation success: ${target.path} (${result.latencyMs}ms) [${config.dryRun ? 'DRY-RUN' : commitSha.substring(0, 7)}]`,
          'success',
          result.latencyMs,
          target.path
        );
      }
    } catch (err: any) {
      const errMsg = err?.message || 'Unknown optimization fault.';
      const status = err?.status || (err?.isNotFound ? 404 : err?.isRateLimit ? 429 : err?.isCapacity ? 503 : err?.isAuth ? 401 : err?.isConflict ? 409 : 500);
      const lowerMsg = errMsg.toLowerCase();

      setMetrics((prev) => ({ ...prev, retries: prev.retries + 1 }));
      recordLatency(0);
      setStatus('ERROR');

      if (err?.isQuota || lowerMsg.includes('quota') || lowerMsg.includes('resource_exhausted')) {
        pushLog(`[QUOTA EXCEEDED] ${errMsg}`, 'error');
        if (isLive) {
          setIsLive(false);
          pushLog('Autonomous loop paused. You have exceeded your API quota limit. Please check your Google AI Studio billing/plan.', 'error');
        }
      } else if (err?.isRateLimit || status === 429 || lowerMsg.includes('rate limit')) {
        pushLog(`[RATE LIMIT 429] ${errMsg}`, 'warning');
        if (isLive) {
          let retrySeconds = 60;
          const match = errMsg.match(/retry in\s+([0-9.]+)s/i);
          if (match && match[1]) {
            retrySeconds = Math.ceil(parseFloat(match[1])) + 5;
          }
          cooldownUntilRef.current = Date.now() + (retrySeconds * 1000);
          pushLog(`Autonomous loop entering auto-cooldown for ${retrySeconds}s to avoid rate limit exhaustion.`, 'warning');
        }
      } else if (err?.isCapacity || status === 503 || lowerMsg.includes('unavailable') || lowerMsg.includes('high demand') || lowerMsg.includes('capacity')) {
        pushLog(`[CAPACITY 503] ${errMsg}`, 'warning');
        if (isLive) {
          let retrySeconds = 15;
          const match = errMsg.match(/retry in\s+([0-9.]+)s/i);
          if (match && match[1]) {
            retrySeconds = Math.ceil(parseFloat(match[1])) + 2;
          }
          cooldownUntilRef.current = Date.now() + (retrySeconds * 1000);
          pushLog(`Autonomous loop entering auto-cooldown for ${retrySeconds}s due to upstream capacity limits.`, 'warning');
        }
      } else if (err?.isNotFound || status === 404) {
        pushLog(`[404 NOT FOUND] ${errMsg}`, 'error');
      } else if (err?.isAuth || status === 401 || status === 403) {
        pushLog(`[AUTH ERROR ${status}] ${errMsg}`, 'error');
        if (isLive) {
          setIsLive(false);
          pushLog('Autonomous loop paused due to authentication or permission error.', 'error');
        }
      } else if (err?.isConflict || status === 409) {
        pushLog(`[CONFLICT 409] ${errMsg} — Blob SHA mismatch. Re-fetching on next pass.`, 'warning');
      } else {
        pushLog(`[ENGINE FAULT] ${errMsg}`, 'error');
      }

      // Advance file index to avoid getting stuck on the same problematic file
      fileIndexRef.current += 1;
      if (activePath) {
        engineFaultsRef.current[activePath] = (engineFaultsRef.current[activePath] || 0) + 1;
        if (engineFaultsRef.current[activePath] >= 3) {
          pushLog(
            `[AUTONOMOUS LOOP] File [${activePath}] encountered 3 consecutive engine faults. Added to skip list to allow loop to proceed to other files.`,
            'warning',
            undefined,
            activePath
          );
          setConfig((prev) => ({
            ...prev,
            skippedFiles: Array.from(new Set([...(prev.skippedFiles || []), activePath])),
          }));
        }
      }
    } finally {
      isCyclingRef.current = false;
      setIsCycling(false);
      setTimeout(() => {
        setStatus('IDLE');
      }, 600);
    }
  }, [config, isLive, pushLog, recordLatency]);

  // Autonomous continuous cycle loop
  useEffect(() => {
    if (isLive) {
      // Run first cycle immediately if not cycling
      if (!isCyclingRef.current) {
        executeCycle();
      }

      const intervalMs = Math.max(15000, config.loopIntervalSec * 1000);
      loopTimerRef.current = setInterval(() => {
        if (!isCyclingRef.current) {
          executeCycle();
        }
      }, intervalMs);

      return () => {
        if (loopTimerRef.current) {
          clearInterval(loopTimerRef.current);
          loopTimerRef.current = null;
        }
      };
    } else {
      if (loopTimerRef.current) {
        clearInterval(loopTimerRef.current);
        loopTimerRef.current = null;
      }
      return undefined;
    }
  }, [isLive, config.loopIntervalSec, executeCycle]);

  // Initial welcome event on initialization
  const handleInitializeSystem = () => {
    setIsAcknowledged(true);
    pushLog('EMG Core C-Dialect Verifier initialized.', 'info');
    pushLog('Autonomous memory bus & telemetry systems online.', 'success');
  };

  // Toggle Live Autonomous loop
  const handleToggleLive = () => {
    if (!isLive) {
      cooldownUntilRef.current = 0; // Reset cooldown on manual start
      setIsLive(true);
      pushLog('Engaging autonomous continuous mutation loop...', 'info');
    } else {
      setIsLive(false);
      setStatus('IDLE');
      pushLog('Engine terminated by user command.', 'warning');
    }
  };

  const handleClearLogs = () => {
    setLogs([]);
  };

  if (!isAcknowledged) {
    return (
      <>
        <SplashView
          onInitialize={handleInitializeSystem}
          onOpenLicense={() => setIsLicenseOpen(true)}
        />
        <LicenseModal
          isOpen={isLicenseOpen}
          onClose={() => setIsLicenseOpen(false)}
        />
      </>
    );
  }

  return (
    <div
      id="emg-app-root"
      className="min-h-screen bg-[#020503] text-zinc-200 font-sans p-4 sm:p-6 md:p-8 flex flex-col gap-6 max-w-7xl mx-auto selection:bg-emerald-500 selection:text-black relative"
    >
      {/* Header */}
      <Header
        isLive={isLive}
        status={status}
        targetRepo={config.targetRepo}
        isSandbox={config.isSandboxMode}
        onToggleLive={handleToggleLive}
        onRunSingleCycle={executeCycle}
        onOpenLicense={() => setIsLicenseOpen(true)}
        onOpenDiagnostics={() => setIsDiagnosticsOpen(true)}
        onOpenWipeMemory={() => setIsWipeMemoryOpen(true)}
        onOpenOracle={() => setIsOracleOpen(true)}
        onOpenSplash={() => setIsAcknowledged(false)}
        onOpenEcosystem={() => setIsAcknowledged(false)}
        onSyncRag={handleSyncRag}
        isSyncingRag={isSyncingRag}
        isCycling={isCycling}
      />

      {/* Stats Grid */}
      <StatsGrid
        metrics={metrics}
        isSandbox={config.isSandboxMode}
        hasGhToken={Boolean(config.ghToken && config.ghToken.length > 5)}
        onOpenDiagnostics={() => setIsDiagnosticsOpen(true)}
      />

      {/* Navigation Sub-Deck / Feature Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#0B0F14]/90 border border-[#1B3A2F] p-2.5 rounded-2xl shadow-md">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => { setActiveTab('dashboard'); playClickSound(); }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'dashboard'
                ? 'bg-[#00F5A0] text-black shadow-[0_0_12px_rgba(0,245,160,0.4)] font-extrabold'
                : 'bg-[#1B3A2F]/30 text-zinc-300 hover:bg-[#1B3A2F]/70 hover:text-white border border-[#1B3A2F]'
            }`}
          >
            <Cpu className="w-4 h-4" />
            <span>EMG Deck</span>
          </button>

          <button
            onClick={() => { setActiveTab('sovereign'); playClickSound(); }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'sovereign'
                ? 'bg-[#00F5A0] text-black shadow-[0_0_12px_rgba(0,245,160,0.4)] font-extrabold'
                : 'bg-[#1B3A2F]/30 text-zinc-300 hover:bg-[#1B3A2F]/70 hover:text-white border border-[#1B3A2F]'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-[#00F5A0]" />
            <span>Sovereign Kernel</span>
          </button>

          <button
            onClick={() => { setActiveTab('orchestra'); playClickSound(); }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'orchestra'
                ? 'bg-[#00F5A0] text-black shadow-[0_0_12px_rgba(0,245,160,0.4)] font-extrabold'
                : 'bg-[#1B3A2F]/30 text-zinc-300 hover:bg-[#1B3A2F]/70 hover:text-white border border-[#1B3A2F]'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Agent Orchestra</span>
          </button>

          <button
            onClick={() => { setActiveTab('debate'); playClickSound(); }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'debate'
                ? 'bg-[#00F5A0] text-black shadow-[0_0_12px_rgba(0,245,160,0.4)] font-extrabold'
                : 'bg-[#1B3A2F]/30 text-zinc-300 hover:bg-[#1B3A2F]/70 hover:text-white border border-[#1B3A2F]'
            }`}
          >
            <MessageSquareCode className="w-4 h-4" />
            <span>Debate Chamber</span>
          </button>

          <button
            onClick={() => { setActiveTab('bugs'); playClickSound(); }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'bugs'
                ? 'bg-[#00F5A0] text-black shadow-[0_0_12px_rgba(0,245,160,0.4)] font-extrabold'
                : 'bg-[#1B3A2F]/30 text-zinc-300 hover:bg-[#1B3A2F]/70 hover:text-white border border-[#1B3A2F]'
            }`}
          >
            <Bug className="w-4 h-4" />
            <span>Bug Inspector</span>
          </button>

          <button
            onClick={() => { setActiveTab('paradox'); playClickSound(); }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'paradox'
                ? 'bg-[#00F5A0] text-black shadow-[0_0_12px_rgba(0,245,160,0.4)] font-extrabold'
                : 'bg-[#1B3A2F]/30 text-zinc-300 hover:bg-[#1B3A2F]/70 hover:text-white border border-[#1B3A2F]'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Temporal Paradox</span>
          </button>

          <button
            onClick={() => { setActiveTab('saturation'); playClickSound(); }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'saturation'
                ? 'bg-[#00F5A0] text-black shadow-[0_0_12px_rgba(0,245,160,0.4)] font-extrabold'
                : 'bg-[#1B3A2F]/30 text-zinc-300 hover:bg-[#1B3A2F]/70 hover:text-white border border-[#1B3A2F]'
            }`}
          >
            <Gauge className="w-4 h-4" />
            <span>Saturation Metrics</span>
          </button>
        </div>

        {/* Quick Shell & Sound Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setIsDosOpen(true); playChirpSound(); }}
            className="px-3.5 py-2 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 text-emerald-400 border border-emerald-700/60 text-xs font-mono font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
            title="Launch Retro DOS CLI Shell Console"
          >
            <Terminal className="w-3.5 h-3.5 text-emerald-400" />
            <span>DOS Shell</span>
          </button>

          <button
            onClick={() => {
              setSoundMuted(!soundMuted);
              if (soundMuted) playChirpSound();
            }}
            className="p-2 rounded-xl bg-[#1B3A2F]/50 hover:bg-[#1B3A2F] text-zinc-300 hover:text-white border border-[#1B3A2F] text-xs transition-all cursor-pointer"
            title={soundMuted ? 'Unmute Web Audio Synthesizer' : 'Mute Web Audio Synthesizer'}
          >
            {soundMuted ? <VolumeX className="w-4 h-4 text-zinc-500" /> : <Volume2 className="w-4 h-4 text-[#00F5A0]" />}
          </button>
        </div>
      </div>

      {/* Dynamic Tab Views */}
      {activeTab === 'dashboard' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 items-start">
          {/* Left Column: Configuration */}
          <div className="lg:col-span-4 w-full">
            <ConfigPanel
              config={config}
              onChange={handleConfigChange}
              disabled={isLive}
              onOpenWipeMemory={() => setIsWipeMemoryOpen(true)}
            />
          </div>

          {/* Right Column: Neural Pulse Chart, Mutation History & Log Stream */}
          <div className="lg:col-span-8 flex flex-col gap-6 w-full">
            {/* Real-Time Neural Latency Chart */}
            <NeuralChart
              activePath={activePath}
              latencyHistory={latencyHistory}
              latestLatency={latestLatency}
            />

            {/* Mutation History & Diff Trigger */}
            <MutationViewer
              mutations={mutations}
              onSelectRecord={(rec) => setSelectedRecord(rec)}
            />

            {/* Real-time Telemetry Event Stream */}
            <LogStream logs={logs} onClearLogs={handleClearLogs} />
          </div>
        </div>
      )}

      {activeTab === 'sovereign' && (
        <div className="flex-1 w-full">
          <SovereignKernelPanel />
        </div>
      )}

      {activeTab === 'orchestra' && (
        <div className="flex-1 w-full">
          <AgentOrchestra apiKeys={{ gemini: config.geminiKey, github: config.ghToken }} onClose={() => setActiveTab('dashboard')} />
        </div>
      )}

      {activeTab === 'debate' && (
        <div className="flex-1 w-full">
          <DebateChamber
            agents={[
              {
                id: 'caan',
                name: 'Darlek Caan (Prosecutor)',
                color: '#f43f5e',
                icon: '👁️',
                status: 'active',
              },
              {
                id: 'jesus',
                name: 'Defender (Jesus)',
                color: '#10b981',
                icon: '🕊️',
                status: 'active',
              },
              {
                id: 'judge',
                name: 'Judge (Sovereign Synthesis)',
                color: '#00F5A0',
                icon: '⚖️',
                status: 'active',
              },
            ]}
            votes={latestDebate ? [
              {
                agentId: 'caan',
                agentName: 'Darlek Caan (Prosecutor)',
                vote: latestDebate.riskScore > 5 ? 'reject' : 'approve',
                confidence: Number((latestDebate.riskScore / 10).toFixed(2)),
                reasoning: latestDebate.prosecutorStatement.argument,
                provider: 'RAG Memory Failure Ledger',
              },
              {
                agentId: 'jesus',
                agentName: 'Defender (Jesus)',
                vote: latestDebate.benefitScore >= latestDebate.riskScore ? 'approve' : 'reject',
                confidence: Number((latestDebate.benefitScore / 10).toFixed(2)),
                reasoning: latestDebate.defenderStatement.argument,
                provider: 'RAG Memory Clean Ledger',
              },
              {
                agentId: 'judge',
                agentName: 'Judge (Sovereign Synthesis)',
                vote: latestDebate.approved ? 'approve' : 'reject',
                confidence: Number((Math.abs(latestDebate.benefitScore - latestDebate.riskScore) / 10).toFixed(2)),
                reasoning: latestDebate.verdictSummary,
                provider: 'EMG Sovereign Synthesis',
              },
            ] : []}
            currentTopic={activePath ? `Mutation Analysis on ${activePath}` : config.goal}
            isActive={isLive}
            consensus={latestDebate?.verdictSummary}
            consensusCoefficient={latestDebate ? (latestDebate.approved ? 0.95 : 0.4) : undefined}
            cognitiveFriction={latestDebate ? latestDebate.riskScore * 10 : undefined}
            epistemicRuling={latestDebate?.judgeStatement.argument}
          />
        </div>
      )}

      {activeTab === 'bugs' && (
        <div className="flex-1 w-full">
          <BugInspector isOpen={true} onClose={() => setActiveTab('dashboard')} systemState={DEFAULT_SYSTEM_STATE as any} />
        </div>
      )}

      {activeTab === 'paradox' && (
        <div className="flex-1 w-full">
          <TemporalParadoxLog />
        </div>
      )}

      {activeTab === 'saturation' && (
        <div className="flex-1 w-full">
          <SaturationMetrics metrics={DEFAULT_SYSTEM_STATE.saturation as any} />
        </div>
      )}

      {/* Diff Inspector Modal */}
      {selectedRecord && (
        <DiffModal
          record={selectedRecord}
          onClose={() => setSelectedRecord(null)}
        />
      )}

      {/* License & Attribution Modal */}
      <LicenseModal
        isOpen={isLicenseOpen}
        onClose={() => setIsLicenseOpen(false)}
      />

      {/* System Diagnostics & Kernel Health Modal */}
      <DiagnosticsModal
        isOpen={isDiagnosticsOpen}
        onClose={() => setIsDiagnosticsOpen(false)}
      />

      {/* Oracle Harness & Direct Stress Test Modal (Option A) */}
      <OracleModal
        isOpen={isOracleOpen}
        onClose={() => setIsOracleOpen(false)}
        targetRepo={config.targetRepo}
        branch={config.branch}
        token={config.ghToken}
        onPostmortemCreated={(content, hash) => {
          setConfig((prev) => ({
            ...prev,
            postmortemConstraints: content,
            postmortemHash: hash,
          }));
          pushLog(`[ORACLE HARNESS] Ingested new synthetic post-mortem constraint into engine memory.`, 'warning');
        }}
      />

      {/* Code Saturation & Skip List Modal */}
      <SaturationModal
        alert={saturationAlert}
        onClose={() => setSaturationAlert(null)}
        onAddToSkipList={handleAddToSkipList}
        onKeepInRotation={handleKeepInRotation}
        autoApproveSaturated={config.autoApproveSaturated}
      />

      {/* Retro DOS Shell Console Modal */}
      <DosConsoleModal
        isOpen={isDosOpen}
        onClose={() => setIsDosOpen(false)}
        systemState={DEFAULT_SYSTEM_STATE as any}
      />

      {/* Wipe Memory & System State Reset Modal */}
      <WipeMemoryModal
        isOpen={isWipeMemoryOpen}
        onClose={() => setIsWipeMemoryOpen(false)}
        onConfirmWipe={handleWipeMemory}
      />

      {/* Footer */}
      <footer className="text-xs font-mono text-zinc-400 py-4 border-t border-emerald-950/80 mt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span>EMG-CORE // C-DIALECT VERIFIER</span>
          <span className="text-emerald-800">•</span>
          <span>CRAIGHCKBY © 2026</span>
        </div>
        <button
          id="btn-footer-license"
          onClick={() => setIsLicenseOpen(true)}
          className="text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer underline underline-offset-4 decoration-emerald-800 hover:decoration-emerald-400"
        >
          CC BY-NC-ND 4.0 License
        </button>
      </footer>
    </div>
  );
}
