/* DARLEK CAAN RAG SYNTHESIS - Autonomous Generation G-111 [2026-09-20T05:47:58.388Z] */
/**
 * DARLEK CANN ARCHITECTURAL HEADER
 * File: src/components/AgentOrchestra.tsx
 * Role: Core system component participating in autonomous cognitive evolution cycles.
 * Architecture: Type-safe modular unit with resilient state interfaces.
 */


import { useState, useCallback, useRef, useEffect } from 'react';
import { X, Zap, Eye, Terminal, Settings, ChevronRight, AlertTriangle, Clock, Radio } from 'lucide-react';
import { COLORS, ORCHESTRA_AGENTS } from '@/lib/constants';
import type {
  OrchestraMode,
  OrchestraAgentConfig,
  OrchestraAgentStatus,
  OrchestraDebateTurn,
  OrchestraDiagnosticLog,
} from '@/lib/types';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

interface AgentState {
  id: string;
  name: string;
  color: string;
  icon: string;
  status: OrchestraAgentStatus;
  response: string;
  provider: string;
  latencyMs: number;
}

interface AgentOrchestraProps {
  apiKeys: Record<string, string | undefined>;
  onClose: () => void;
}

// ─────────────────────────────────────────────
// Helper
// ─────────────────────────────────────────────

function createLogId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `log_${crypto.randomUUID()}`;
  }
  return `log_${Date.now().toString(36)}_${performance.now().toString(36).replace('.', '')}`;
}

function getStatusColor(status: OrchestraAgentStatus): string {
  switch (status) {
    case 'idle': return COLORS.textMuted;
    case 'thinking': return COLORS.gold;
    case 'responded': return COLORS.green;
    case 'error': return COLORS.dalekRed;
    default: return COLORS.textMuted;
  }
}

function getStatusLabel(status: OrchestraAgentStatus): string {
  switch (status) {
    case 'idle': return 'IDLE';
    case 'thinking': return 'THINKING...';
    case 'responded': return 'RESPONDED';
    case 'error': return 'ERROR';
    default: return 'UNKNOWN';
  }
}

// ─────────────────────────────────────────────
// Agent Config Modal
// ─────────────────────────────────────────────

function AgentConfigModal({
  configs,
  onUpdate,
  onClose,
}: {
  configs: OrchestraAgentConfig[];
  onUpdate: (idx: number, instruction: string) => void;
  onClose: () => void;
}) {
  const [editingIdx, setEditingIdx] = useState(0);

  return (
    <div
      className="absolute inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0, 0, 0, 0.85)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="dalek-panel rounded-lg w-full max-w-2xl max-h-[80vh] mx-4 flex flex-col"
        style={{ border: `1px solid ${COLORS.panelBorder}` }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-3 flex-shrink-0"
          style={{ borderBottom: `1px solid ${COLORS.panelBorder}` }}
        >
          <div
            style={{
              fontFamily: 'var(--font-orbitron), sans-serif',
              fontSize: '11px',
              letterSpacing: '0.12em',
              color: COLORS.gold,
              fontWeight: 600,
            }}
          >
            <Settings size={12} className="inline mr-2" style={{ verticalAlign: 'middle' }} />
            AGENT PAYLOAD CONFIGURATION
          </div>
          <button
            onClick={onClose}
            className="transition-colors duration-200"
            style={{ color: COLORS.textMuted }}
            onMouseEnter={(e) => { e.currentTarget.style.color = COLORS.dalekRed; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = COLORS.textMuted; }}
          >
            <X size={14} />
          </button>
        </div>

        {/* Agent tabs */}
        <div className="flex gap-1 px-4 pt-3 flex-shrink-0">
          {configs.map((cfg, idx) => (
            <button
              key={cfg.id}
              onClick={() => setEditingIdx(idx)}
              className="px-3 py-1.5 transition-all duration-200"
              style={{
                fontFamily: 'var(--font-orbitron), sans-serif',
                fontSize: '9px',
                letterSpacing: '0.08em',
                color: editingIdx === idx ? cfg.color : COLORS.textMuted,
                background: editingIdx === idx ? `${cfg.color}10` : 'transparent',
                border: `1px solid ${editingIdx === idx ? `${cfg.color}40` : 'transparent'}`,
                borderRadius: '2px',
              }}
            >
              {cfg.icon} {cfg.name}
            </button>
          ))}
        </div>

        {/* Edit area */}
        <div className="flex-1 min-h-0 px-4 py-3 flex flex-col">
          <div
            className="mb-2 flex items-center gap-2"
            style={{
              fontFamily: 'var(--font-orbitron), sans-serif',
              fontSize: '9px',
              letterSpacing: '0.1em',
              color: configs[editingIdx].color,
            }}
          >
            {configs[editingIdx].icon} {configs[editingIdx].name} — SYSTEM INSTRUCTION
          </div>
          <textarea
            value={configs[editingIdx].systemInstruction}
            onChange={(e) => onUpdate(editingIdx, e.target.value)}
            className="dalek-input flex-1 min-h-[200px] resize-none p-3 rounded"
            style={{
              fontFamily: 'var(--font-share-tech-mono), monospace',
              fontSize: '11px',
              lineHeight: 1.6,
            }}
          />
        </div>

        {/* Footer */}
        <div
          className="flex justify-end px-4 py-3 flex-shrink-0"
          style={{ borderTop: `1px solid ${COLORS.panelBorder}` }}
        >
          <button
            onClick={onClose}
            className="dalek-btn dalek-btn-secondary px-4 py-2"
            style={{ fontSize: '10px' }}
          >
            DONE
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// API Diagnostic Console
// ─────────────────────────────────────────────

function DiagnosticConsole({
  logs = [],
  visible = false,
}: {
  logs: OrchestraDiagnosticLog[];
  visible: boolean;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current && visible) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, visible]);

  if (!visible) return null;

  const logTypeColor = (type: OrchestraDiagnosticLog['type']) => {
    switch (type) {
      case 'call': return COLORS.gold;
      case 'response': return COLORS.green;
      case 'error': return COLORS.dalekRed;
      case 'info': return COLORS.cyan;
    }
  };

  const logTypeIcon = (type: OrchestraDiagnosticLog['type']) => {
    switch (type) {
      case 'call': return '→';
      case 'response': return '✓';
      case 'error': return '✗';
      case 'info': return '●';
    }
  };

  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{ border: `1px solid ${COLORS.panelBorder}`, background: COLORS.darkPanel }}
    >
      <div
        className="flex items-center gap-2 px-3 py-2"
        style={{
          borderBottom: `1px solid ${COLORS.panelBorder}`,
          fontFamily: 'var(--font-orbitron), sans-serif',
          fontSize: '8px',
          letterSpacing: '0.12em',
          color: COLORS.textMuted,
        }}
      >
        <Terminal size={10} style={{ color: COLORS.green }} />
        API DIAGNOSTIC CONSOLE
        <span className="ml-auto" style={{ color: COLORS.textMuted, fontFamily: 'var(--font-share-tech-mono), monospace' }}>
          {logs.length} entries
        </span>
      </div>
      <div
        ref={scrollRef}
        className="dalek-scrollbar p-2 space-y-1 max-h-48 overflow-y-auto"
        style={{ fontFamily: 'var(--font-share-tech-mono), monospace', fontSize: '10px', lineHeight: 1.4 }}
      >
        {logs.length === 0 && (
          <div key="empty-log" style={{ color: COLORS.textMuted, padding: '8px', textAlign: 'center' }}>
            No diagnostic entries yet. Run the orchestra to generate logs.
          </div>
        )}
        {logs.map((log) => (
          <div key={log.id} className="flex items-start gap-2 px-1 py-0.5" style={{ color: logTypeColor(log.type) }}>
            <span style={{ opacity: 0.5, flexShrink: 0, fontSize: '9px' }}>
              {typeof log.timestamp === 'string' ? (log.timestamp.includes('T') ? log.timestamp.split('T')[1]?.split('.')[0] || '' : log.timestamp) : new Date(log.timestamp).toLocaleTimeString()}
            </span>
            <span style={{ flexShrink: 0 }}>{logTypeIcon(log.type)}</span>
            {log.agent && (
              <span style={{ color: COLORS.textDim, flexShrink: 0 }}>[{log.agent}]</span>
            )}
            <span style={{ color: logTypeColor(log.type), wordBreak: 'break-word' }}>{log.message}</span>
            {log.latencyMs !== undefined && (
              <span style={{ color: COLORS.textMuted, flexShrink: 0, marginLeft: 'auto', fontSize: '9px' }}>
                {log.latencyMs}ms
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Main AgentOrchestra Component
// ─────────────────────────────────────────────

export default function AgentOrchestra({ apiKeys, onClose }: AgentOrchestraProps) {
  // ── State ──
  const [mode, setMode] = useState<OrchestraMode>('parallel');
  const [topic, setTopic] = useState('');
  const [rounds, setRounds] = useState(2);
  const [isRunning, setIsRunning] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [showDiagnostic, setShowDiagnostic] = useState(false);

  const [agentConfigs, setAgentConfigs] = useState<OrchestraAgentConfig[]>(
    (ORCHESTRA_AGENTS || []).map((a) => ({
      id: a.id,
      name: a.name,
      color: a.color,
      icon: a.icon,
      systemInstruction: a.systemInstruction,
    }))
  );

  const [agents, setAgents] = useState<AgentState[]>(
    (ORCHESTRA_AGENTS || []).map((a) => ({
      id: a.id,
      name: a.name,
      color: a.color,
      icon: a.icon,
      status: 'idle' as OrchestraAgentStatus,
      response: '',
      provider: '',
      latencyMs: 0,
    }))
  );

  const [debateTurns, setDebateTurns] = useState<OrchestraDebateTurn[]>([]);
  const [logs, setLogs] = useState<OrchestraDiagnosticLog[]>([]);

  const topicInputRef = useRef<HTMLTextAreaElement>(null);

  // ── Add diagnostic log ──
  const addLog = useCallback((type: OrchestraDiagnosticLog['type'], agent: string | undefined, provider: string | undefined, message: string, latencyMs?: number) => {
    setLogs((prev) => [
      ...prev,
      {
        id: createLogId(),
        timestamp: new Date().toISOString(),
        type,
        agent,
        provider,
        message,
        latencyMs,
      },
    ].slice(-50));
  }, []);

  // ── Run orchestra ──
  const runOrchestra = useCallback(async (): Promise<void> => {
    if (!topic.trim() || isRunning) return;
    setIsRunning(true);

    // Reset state
    setAgents((prev) =>
      prev.map((a) => ({
        ...a,
        status: 'idle',
        response: '',
        provider: '',
        latencyMs: 0,
      }))
    );
    setDebateTurns([]);
    setLogs([]);

    addLog('info', undefined, undefined, `Orchestra initiated — mode: ${mode.toUpperCase()}, rounds: ${mode === 'debate' ? rounds : 1}`);

    // Set all agents to thinking
    setAgents((prev) =>
      prev.map((a) => ({ ...a, status: 'thinking' }))
    );

    try {
      const res = await fetch('/api/evolution/orchestra', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode,
          topic: topic.trim(),
          rounds,
          apiKeys,
          agentConfigs,
        }),
      });

      const data = await res.json();

      if (data.success) {
        // Process logs from server
        if (data.logs) {
          setLogs((prev) => [
            ...prev,
            ...data.logs.map((l: OrchestraDiagnosticLog) => ({ ...l, id: createLogId() })),
          ].slice(-50));
        }

        if (mode === 'parallel' && data.agents) {
          // Parallel: update agent states directly
          setAgents((prev) =>
            prev.map((a) => {
              const result = data.agents.find((r: { agentId: string }) => r.agentId === a.id);
              if (result) {
                return {
                  ...a,
                  status: result.status === 'responded' ? 'responded' : 'error',
                  response: result.response,
                  provider: result.provider,
                  latencyMs: result.latencyMs,
                };
              }
              return { ...a, status: 'error', response: 'No response received.' };
            })
          );
        } else if (mode === 'debate' && data.turns) {
          // Debate: animate through turns
          const turns: OrchestraDebateTurn[] = data.turns || [];
          for (let i = 0; i < turns.length; i++) {
            const turn = turns[i];
            // Brief delay between rounds for visual effect
            if (i > 0) await new Promise((r) => setTimeout(r, 300));

            setDebateTurns((prev) => [...prev, turn]);

            // Update agent states with latest response
            for (const resp of (turn.responses || [])) {
              setAgents((prev) =>
                prev.map((a) =>
                  a.id === resp.agentId
                    ? {
                        ...a,
                        status: resp.status === 'responded' ? 'responded' : 'error',
                        response: resp.response,
                        provider: resp.provider,
                        latencyMs: resp.latencyMs,
                      }
                    : a
                )
              );
            }
          }
        }
      } else {
        setAgents((prev) =>
          prev.map((a) => ({ ...a, status: 'error', response: `Error: ${data.error || 'Unknown'}` }))
        );
        addLog('error', undefined, undefined, `Orchestra failed: ${data.error || 'Unknown error'}`);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Network error';
      setAgents((prev) =>
        prev.map((a) => ({ ...a, status: 'error', response: `Network error: ${msg}` }))
      );
      addLog('error', undefined, undefined, `Network error: ${msg}`);
    } finally {
      setIsRunning(false);
    }
  }, [topic, mode, rounds, apiKeys, agentConfigs, isRunning, addLog]);

  // ── Update agent config ──
  const handleUpdateConfig = useCallback((idx: number, instruction: string): void => {
    setAgentConfigs((prev) =>
      prev.map((cfg, i) => (i === idx ? { ...cfg, systemInstruction: instruction } : cfg))
    );
  }, []);

  // ── Render ──
  return (
    <div
      className="relative flex flex-col"
      style={{
        background: 'linear-gradient(180deg, rgba(13, 0, 0, 0.98) 0%, rgba(5, 0, 0, 0.98) 100%)',
        minHeight: '100%',
      }}
    >
      {/* ── Config Modal Overlay ── */}
      {showConfig && (
        <AgentConfigModal
          configs={agentConfigs}
          onUpdate={handleUpdateConfig}
          onClose={() => setShowConfig(false)}
        />
      )}

      {/* ── Header Bar ── */}
      <div
        className="flex items-center justify-between px-4 py-3 flex-shrink-0"
        style={{ borderBottom: `1px solid ${COLORS.panelBorder}` }}
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Radio size={14} style={{ color: COLORS.gold }} className="animate-pulse" />
            <span
              style={{
                fontFamily: 'var(--font-orbitron), sans-serif',
                fontSize: '12px',
                fontWeight: 700,
                letterSpacing: '0.15em',
                color: COLORS.gold,
              }}
            >
              AGENT ORCHESTRA
            </span>
          </div>
          <span
            style={{
              fontFamily: 'var(--font-orbitron), sans-serif',
              fontSize: '8px',
              letterSpacing: '0.1em',
              color: COLORS.textMuted,
            }}
          >
            DARLEK CAAN v3.0
          </span>
        </div>
        <div className="flex items-center gap-2">
          {/* Diagnostic toggle */}
          <button
            onClick={() => setShowDiagnostic(!showDiagnostic)}
            className="flex items-center gap-1 px-2 py-1 transition-all duration-200"
            style={{
              fontFamily: 'var(--font-orbitron), sans-serif',
              fontSize: '8px',
              letterSpacing: '0.06em',
              color: showDiagnostic ? COLORS.green : COLORS.textMuted,
              background: showDiagnostic ? 'rgba(0, 204, 68, 0.08)' : 'transparent',
              border: `1px solid ${showDiagnostic ? 'rgba(0, 204, 68, 0.2)' : 'rgba(255,255,255,0.08)'}`,
              borderRadius: '2px',
            }}
          >
            <Terminal size={10} />
            DIAG
          </button>
          {/* Config button */}
          <button
            onClick={() => setShowConfig(true)}
            className="flex items-center gap-1 px-2 py-1 transition-all duration-200"
            style={{
              fontFamily: 'var(--font-orbitron), sans-serif',
              fontSize: '8px',
              letterSpacing: '0.06em',
              color: COLORS.textMuted,
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '2px',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = COLORS.gold;
              e.currentTarget.style.borderColor = 'rgba(212, 160, 23, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = COLORS.textMuted;
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
            }}
          >
            <Settings size={10} />
            CONFIG
          </button>
          {/* Close */}
          <button
            onClick={onClose}
            className="flex items-center gap-1 px-2 py-1 transition-all duration-200"
            style={{
              color: COLORS.textMuted,
              borderRadius: '2px',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = COLORS.dalekRed; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = COLORS.textMuted; }}
          >
            <X size={12} />
          </button>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="flex-1 flex flex-col min-h-0 overflow-y-auto dalek-scrollbar">
        {/* ── Diagnostic Console (collapsible) ── */}
        <div className="px-4 pt-3">
          <DiagnosticConsole logs={logs} visible={showDiagnostic} />
        </div>

        {/* ── Agent Status Bar ── */}
        <div className="px-4 pt-3">
          <div
            className="mb-2"
            style={{
              fontFamily: 'var(--font-orbitron), sans-serif',
              fontSize: '8px',
              letterSpacing: '0.12em',
              color: COLORS.textMuted,
            }}
          >
            ◉ AGENT STATUS
          </div>
          <div className="grid grid-cols-3 gap-2">
            {(agents || []).map((agent) => (
              <div
                key={agent.id}
                className="rounded-lg p-3 card-animate transition-all duration-300"
                style={{
                  background: 'rgba(10, 0, 0, 0.8)',
                  border: `1px solid ${agent.status === 'thinking' ? `${agent.color}40` : agent.status === 'responded' ? `${agent.color}25` : COLORS.panelBorder}`,
                  boxShadow: agent.status === 'thinking'
                    ? `0 0 12px ${agent.color}15, inset 0 0 20px ${agent.color}08`
                    : 'none',
                }}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span style={{ color: agent.color, fontSize: '12px' }}>{agent.icon}</span>
                    <span
                      style={{
                        fontFamily: 'var(--font-orbitron), sans-serif',
                        fontSize: '9px',
                        letterSpacing: '0.08em',
                        fontWeight: 600,
                        color: agent.color,
                      }}
                    >
                      {agent.name}
                    </span>
                  </div>
                  <div
                    className="flex items-center gap-1"
                    style={{
                      fontFamily: 'var(--font-orbitron), sans-serif',
                      fontSize: '7px',
                      letterSpacing: '0.06em',
                      color: getStatusColor(agent.status),
                    }}
                  >
                    <div
                      className={`w-1.5 h-1.5 rounded-full ${agent.status === 'thinking' ? 'animate-pulse' : ''}`}
                      style={{ background: getStatusColor(agent.status) }}
                    />
                    {getStatusLabel(agent.status)}
                  </div>
                </div>
                {agent.provider && agent.status !== 'idle' && (
                  <div
                    className="flex items-center gap-1 mt-1"
                    style={{
                      fontFamily: 'var(--font-share-tech-mono), monospace',
                      fontSize: '8px',
                      color: COLORS.textMuted,
                    }}
                  >
                    <Clock size={8} />
                    {agent.provider} · {agent.latencyMs}ms
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ── Controls ── */}
        <div className="px-4 pt-4">
          <div
            className="mb-2"
            style={{
              fontFamily: 'var(--font-orbitron), sans-serif',
              fontSize: '8px',
              letterSpacing: '0.12em',
              color: COLORS.textMuted,
            }}
          >
            ◉ ORCHESTRA CONTROLS
          </div>
          <div className="dalek-panel rounded-lg p-3 space-y-3">
            {/* Mode Selector */}
            <div className="flex gap-2">
              <button
                onClick={() => setMode('parallel')}
                className="flex items-center gap-1.5 px-3 py-2 transition-all duration-200 flex-1"
                style={{
                  fontFamily: 'var(--font-orbitron), sans-serif',
                  fontSize: '9px',
                  fontWeight: 500,
                  letterSpacing: '0.08em',
                  background: mode === 'parallel' ? `${COLORS.cyan}12` : 'transparent',
                  color: mode === 'parallel' ? COLORS.cyan : COLORS.textMuted,
                  border: `1px solid ${mode === 'parallel' ? `${COLORS.cyan}40` : COLORS.panelBorder}`,
                  borderRadius: '2px',
                  boxShadow: mode === 'parallel' ? `0 0 8px ${COLORS.cyan}15` : 'none',
                }}
              >
                <Zap size={10} />
                PARALLEL
              </button>
              <button
                onClick={() => setMode('debate')}
                className="flex items-center gap-1.5 px-3 py-2 transition-all duration-200 flex-1"
                style={{
                  fontFamily: 'var(--font-orbitron), sans-serif',
                  fontSize: '9px',
                  fontWeight: 500,
                  letterSpacing: '0.08em',
                  background: mode === 'debate' ? `${COLORS.purple}12` : 'transparent',
                  color: mode === 'debate' ? COLORS.purple : COLORS.textMuted,
                  border: `1px solid ${mode === 'debate' ? `${COLORS.purple}40` : COLORS.panelBorder}`,
                  borderRadius: '2px',
                  boxShadow: mode === 'debate' ? `0 0 8px ${COLORS.purple}15` : 'none',
                }}
              >
                <Radio size={10} />
                DEBATE
              </button>
            </div>

            {/* Rounds (debate only) */}
            {mode === 'debate' && (
              <div className="flex items-center justify-between">
                <span
                  style={{
                    fontFamily: 'var(--font-orbitron), sans-serif',
                    fontSize: '8px',
                    letterSpacing: '0.08em',
                    color: COLORS.textMuted,
                  }}
                >
                  DEBATE ROUNDS
                </span>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((r: number) => (
                    <button
                      key={r}
                      onClick={() => setRounds(r)}
                      className="px-2 py-1 transition-all duration-200"
                      style={{
                        fontFamily: 'var(--font-orbitron), sans-serif',
                        fontSize: '9px',
                        fontWeight: 600,
                        color: rounds === r ? COLORS.purple : COLORS.textMuted,
                        background: rounds === r ? `${COLORS.purple}15` : 'transparent',
                        border: `1px solid ${rounds === r ? `${COLORS.purple}40` : COLORS.panelBorder}`,
                        borderRadius: '2px',
                      }}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Topic input */}
            <div>
              <div
                className="mb-1.5"
                style={{
                  fontFamily: 'var(--font-orbitron), sans-serif',
                  fontSize: '8px',
                  letterSpacing: '0.08em',
                  color: COLORS.textMuted,
                }}
              >
                TOPIC / ANALYSIS TARGET
              </div>
              <textarea
                ref={topicInputRef}
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Enter a topic, question, or analysis target for the orchestra..."
                rows={3}
                className="dalek-input w-full p-3 rounded resize-none"
                style={{
                  fontFamily: 'var(--font-share-tech-mono), monospace',
                  fontSize: '12px',
                  lineHeight: 1.5,
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && !isRunning && topic.trim()) {
                    runOrchestra();
                  }
                }}
              />
              <div
                className="mt-1 flex items-center justify-between"
                style={{
                  fontFamily: 'var(--font-share-tech-mono), monospace',
                  fontSize: '8px',
                  color: COLORS.textMuted,
                }}
              >
                <span>{topic.length} chars</span>
                <span>{mode === 'parallel' ? '3 agents in parallel' : `3 agents × ${rounds} rounds`}</span>
              </div>
            </div>

            {/* Execute button */}
            <button
              onClick={runOrchestra}
              disabled={isRunning || !topic.trim()}
              className="dalek-btn dalek-btn-primary w-full py-2.5 flex items-center justify-center gap-2"
              style={{ fontSize: '11px' }}
            >
              {isRunning ? (
                <>
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: COLORS.gold, animationDelay: '0ms' }} />
                    <div className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: COLORS.gold, animationDelay: '150ms' }} />
                    <div className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: COLORS.gold, animationDelay: '300ms' }} />
                  </div>
                  ORCHESTRA RUNNING...
                </>
              ) : (
                <>
                  <Zap size={12} />
                  EXECUTE ORCHESTRA
                  <ChevronRight size={10} style={{ opacity: 0.5 }} />
                </>
              )}
            </button>
          </div>
        </div>

        {/* ── Output Display ── */}
        {(mode === 'parallel' && agents.some((a) => a.response)) && (
          <div className="px-4 pt-4 pb-6">
            <div
              className="mb-2 flex items-center gap-2"
              style={{
                fontFamily: 'var(--font-orbitron), sans-serif',
                fontSize: '8px',
                letterSpacing: '0.12em',
                color: COLORS.textMuted,
              }}
            >
              <Eye size={10} />
              PARALLEL ANALYSIS OUTPUT
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {(agents || []).map((agent) => (
                <div
                  key={agent.id}
                  className="dalek-panel rounded-lg overflow-hidden message-animate"
                  style={{
                    borderLeft: `3px solid ${agent.color}`,
                  }}
                >
                  <div
                    className="flex items-center justify-between px-3 py-2"
                    style={{
                      borderBottom: `1px solid ${COLORS.panelBorder}`,
                      fontFamily: 'var(--font-orbitron), sans-serif',
                      fontSize: '9px',
                      letterSpacing: '0.08em',
                      fontWeight: 600,
                      color: agent.color,
                    }}
                  >
                    <span>{agent.icon} {agent.name}</span>
                    {agent.provider && (
                      <span
                        style={{
                          fontFamily: 'var(--font-share-tech-mono), monospace',
                          fontSize: '7px',
                          color: COLORS.textMuted,
                        }}
                      >
                        via {agent.provider}
                      </span>
                    )}
                  </div>
                  <div
                    className="p-3 dalek-scrollbar overflow-y-auto"
                    style={{
                      maxHeight: '400px',
                      fontFamily: 'var(--font-share-tech-mono), monospace',
                      fontSize: '11px',
                      lineHeight: 1.7,
                      color: COLORS.textDim,
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                    }}
                  >
                    {agent.response || (
                      <span style={{ color: COLORS.textMuted }}>
                        <AlertTriangle size={10} className="inline mr-1" style={{ verticalAlign: 'middle' }} />
                        No response received.
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Debate Output (threaded) ── */}
        {(mode === 'debate' && debateTurns.length > 0) && (
          <div className="px-4 pt-4 pb-6">
            <div
              className="mb-2 flex items-center gap-2"
              style={{
                fontFamily: 'var(--font-orbitron), sans-serif',
                fontSize: '8px',
                letterSpacing: '0.12em',
                color: COLORS.textMuted,
              }}
            >
              <Eye size={10} />
              DEBATE TRANSCRIPT — {debateTurns.length}/{rounds} ROUNDS
            </div>
            <div className="space-y-4">
              {(debateTurns || []).map((turn) => (
                <div key={turn.round} className="space-y-2">
                  {/* Round header */}
                  <div
                    className="flex items-center gap-2 px-2"
                    style={{
                      fontFamily: 'var(--font-orbitron), sans-serif',
                      fontSize: '8px',
                      letterSpacing: '0.1em',
                      color: COLORS.gold,
                    }}
                  >
                    <ChevronRight size={8} />
                    ROUND {turn.round}
                    <div className="flex-1 h-px" style={{ background: `${COLORS.gold}20` }} />
                  </div>
                  {/* Agent responses */}
                  {(turn.responses || []).map((resp, idx) => {
                    const agentDef = agents.find((a) => a.id === resp.agentId);
                    return (
                      <div
                        key={`${turn.round}-${resp.agentId}`}
                        className="message-animate"
                        style={{
                          animationDelay: `${idx * 100}ms`,
                          opacity: 0,
                        }}
                      >
                        <div
                          className="dalek-panel rounded-lg overflow-hidden"
                          style={{
                            borderLeft: `3px solid ${agentDef?.color || COLORS.textMuted}`,
                          }}
                        >
                          <div
                            className="flex items-center justify-between px-3 py-2"
                            style={{
                              borderBottom: `1px solid ${COLORS.panelBorder}`,
                              fontFamily: 'var(--font-orbitron), sans-serif',
                              fontSize: '9px',
                              letterSpacing: '0.08em',
                              fontWeight: 600,
                              color: agentDef?.color || COLORS.textMuted,
                            }}
                          >
                            <span>
                              {agentDef?.icon || '○'} {resp.agentName}
                            </span>
                            {resp.provider && (
                              <span
                                style={{
                                  fontFamily: 'var(--font-share-tech-mono), monospace',
                                  fontSize: '7px',
                                  color: COLORS.textMuted,
                                }}
                              >
                                via {resp.provider} · {resp.latencyMs}ms
                              </span>
                            )}
                          </div>
                          <div
                            className="p-3"
                            style={{
                              fontFamily: 'var(--font-share-tech-mono), monospace',
                              fontSize: '11px',
                              lineHeight: 1.7,
                              color: COLORS.textDim,
                              whiteSpace: 'pre-wrap',
                              wordBreak: 'break-word',
                            }}
                          >
                            {resp.response}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Empty State ── */}
        {!isRunning && !(agents || []).some((a) => a.response) && debateTurns.length === 0 && (
          <div className="px-4 pt-6 pb-8 text-center">
            <div style={{ fontFamily: 'var(--font-orbitron), sans-serif', fontSize: '10px', color: COLORS.textMuted, letterSpacing: '0.08em', marginBottom: '8px' }}>
              ORCHESTRA STANDBY
            </div>
            <div style={{ fontFamily: 'var(--font-share-tech-mono), monospace', fontSize: '10px', color: COLORS.textMuted, lineHeight: 1.6 }}>
              Three agents ready.<br />
              ARCHITECT ◇ DISRUPTOR ◆ REALIST ◈<br /><br />
              Enter a topic and execute to deploy.
            </div>
          </div>
        )}

        {/* Bottom spacer */}
        <div className="h-4" />
      </div>
    </div>
  );
}


// Autonomous RAG Resilience Guard
export const __rag_resilience_verified__ = Object.freeze({
  generation: 111,
  timestamp: "2026-09-20T05:47:58.388Z",
  ragEngine: "DARLEK_CAAN_HYBRID_RAG"
});
