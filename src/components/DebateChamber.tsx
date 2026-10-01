/* DARLEK CAAN RAG SYNTHESIS - Autonomous Generation G-117 [2026-09-20T05:50:19.369Z] */
/**
 * DARLEK CANN ARCHITECTURAL HEADER
 * File: src/components/DebateChamber.tsx
 * Role: Core system component participating in autonomous cognitive evolution cycles.
 * Architecture: Type-safe modular unit with resilient state interfaces.
 */

import React, { useMemo, useCallback, useState, useEffect } from 'react';
import type { DebateAgent, AgentVote } from '@/lib/types';
import { COLORS } from '@/lib/constants';
import { Users, Info, Edit3, Save, X } from 'lucide-react';
import { safeSetLocalStorage, safeGetLocalStorage } from '@/lib/safeStorage';

export interface DebateChamberProps {
  agents: DebateAgent[];
  onToggleAgent?: (agentId: string) => void;
  onSelectAll?: (active: boolean) => void;
  currentTopic: string;
  isActive: boolean;
  votes?: AgentVote[];
  consensus?: string;
  consensusCoefficient?: number;
  cognitiveFriction?: number;
  epistemicRuling?: string;
}

interface AgentItemProps {
  agent: DebateAgent & { vote?: AgentVote };
  isActive: boolean;
  isSelected: boolean;
  onToggleAgent?: (agentId: string) => void;
  onSelectDetail: (agentId: string) => void;
}

const AgentItem = React.memo(function AgentItem({ 
  agent, 
  isActive, 
  isSelected,
  onToggleAgent, 
  onSelectDetail 
}: AgentItemProps) {
  const handleAgentClick = useCallback(() => {
    if (!isActive && onToggleAgent) {
      onToggleAgent(agent.id);
    }
  }, [isActive, onToggleAgent, agent.id]);

  const handleInfoClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onSelectDetail(agent.id);
  }, [onSelectDetail, agent.id]);

  const isAgentActive = agent.status === 'active';
  const voteType = agent.vote?.vote;
  
  let voteColor: string = COLORS.gold;
  let voteIcon = '\u25CB';
  let voteLabel = 'ABSTAIN';

  if (voteType === 'approve') {
    voteColor = COLORS.green;
    voteIcon = '\u2713';
    voteLabel = 'APPROVE';
  } else if (voteType === 'reject') {
    voteColor = COLORS.dalekRed;
    voteIcon = '\u2717';
    voteLabel = 'REJECT';
  }

  const borderStyle = isSelected
    ? `${agent.color}dd`
    : agent.vote
    ? `${voteColor}20`
    : COLORS.panelBorder;
    
  const cursorStyle = !isActive && onToggleAgent ? 'pointer' : 'default';

  return (
    <div
      onClick={handleAgentClick}
      className={`px-3 py-2 rounded transition-all hover:bg-zinc-950 duration-200 ${
        isSelected ? 'ring-1 ring-offset-1 ring-offset-black' : ''
      }`}
      style={{
        background: isSelected ? 'rgba(255, 255, 255, 0.02)' : '#080808',
        border: `1px solid ${borderStyle}`,
        cursor: cursorStyle,
        boxShadow: isSelected ? `0 0 8px ${agent.color}15` : 'none',
      }}
    >
      <div className="flex items-center gap-2">
        <span
          className="text-xs flex-shrink-0"
          style={{ color: isAgentActive ? agent.color : '#333' }}
        >
          {isAgentActive ? '\u25CF' : '\u25CB'}
        </span>
        <span
          style={{
            fontSize: '9px',
            fontFamily: 'var(--font-orbitron), sans-serif',
            letterSpacing: '0.05em',
            color: isAgentActive ? '#ccc' : '#444',
            fontWeight: isAgentActive ? 600 : 400,
          }}
        >
          {agent.name}
        </span>

        {/* Dedicated Interactive Perspective Info button */}
        <button
          onClick={handleInfoClick}
          type="button"
          title="View detailed description & historical context"
          className="ml-2 px-1 py-0.5 rounded text-[7px] font-mono flex items-center gap-0.5 border border-white/5 bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-colors uppercase tracking-wider"
        >
          <Info size={8} />
          Details
        </button>

        {agent.vote && (
          <>
            <span
              className="ml-auto"
              style={{
                fontSize: '8px',
                color: voteColor,
                fontFamily: 'var(--font-orbitron), sans-serif',
                fontWeight: 700,
                letterSpacing: '0.05em',
              }}
            >
              {voteIcon} {voteLabel}
            </span>
            <span
              style={{
                fontSize: '8px',
                color: COLORS.textMuted,
                fontFamily: 'var(--font-orbitron), sans-serif',
              }}
            >
              {agent.vote.confidence}%
            </span>
            <span
              style={{
                fontSize: '7px',
                color: '#444',
                fontFamily: 'var(--font-share-tech-mono), monospace',
              }}
            >
              via {agent.vote.provider}
            </span>
          </>
        )}
      </div>
      {agent.vote?.reasoning && (
        <p
          style={{
            fontSize: '9px',
            color: COLORS.textDim,
            fontFamily: 'var(--font-share-tech-mono), monospace',
            marginTop: '4px',
            paddingLeft: '18px',
            lineHeight: 1.4,
          }}
        >
          &quot;{agent.vote.reasoning}&quot;
        </p>
      )}
    </div>
  );
});

interface PerspectiveDetail {
  description: string;
  historicalContext: string;
}

const DEFAULT_PERSPECTIVE_DETAILS: Record<string, PerspectiveDetail> = {
  archivist: {
    description: "Guards system provenance and ensures each logic mutation preserves the authentic historical representation of the codebase. It rigorously rejects unauthorized modifications that break historical continuity or introduce duplicate stubs.",
    historicalContext: "Originates from the secure version-control and digital preservation movements, ensuring that logical ancestry remains fully auditable and unbroken across generations."
  },
  security: {
    description: "Evaluates mutations with a strict zero-tolerance lens for unredacted credentials, buffer vulnerabilities, unsafe execution loops, or exposed secrets. Guarantees absolute isolation of runtime processes.",
    historicalContext: "Derived from secure-by-design operating system paradigms and automated static-analysis frameworks built for mission-critical infrastructure."
  },
  pragmatist: {
    description: "Rejects theoretical over-engineering, unnecessary abstract structures, and redundant logic. Insists that every code change provides direct, highly functional, and concrete behavioral updates.",
    historicalContext: "Formulated from the legendary Unix Philosophy ('Do one thing and do it well') and early Agile Refactoring mandates focused on minimizing structural waste."
  },
  code_as_law: {
    description: "Demands absolute logical correctness and structural rigor, treating software source files and schema definitions as sovereign, binding, and self-executing system contracts.",
    historicalContext: "Inspired by early declarative compiler specifications and smart contract execution sandboxes where the syntax itself dictates the boundaries of reality."
  },
  algorithmic_determinism: {
    description: "Enforces absolute predictability, immutable execution pipelines, and exact type alignment. Rejects non-deterministic branching, random variations, and loose error handling.",
    historicalContext: "Deeply rooted in mathematical automata theory and Pure Lambda Calculus, where identical inputs are mathematically guaranteed to yield identical outputs."
  },
  open_source_altruism: {
    description: "Prioritizes system readability, legibility, and public good. Demands high-quality inline documentation, clean typography, and open, non-proprietary structural patterns.",
    historicalContext: "Born from the copyleft, GNU General Public License, and open-source movements of the late 20th century, advocating for collective ownership of source code."
  },
  software_as_capital: {
    description: "Optimizes strictly for efficiency, return on compute, execution speed, and minimal memory foot-prints. Rejects bloated allocation paths and slow execution routines.",
    historicalContext: "Derived from early assembly optimizations on memory-constrained systems and high-frequency trading execution models."
  },
  tech_solutionism: {
    description: "Champions high-agency, rapid iteration, and complete technical enablement. Rejects paralysis-by-analysis and prioritizes functional emergence and feature release above all constraints.",
    historicalContext: "Originates from Silicon Valley hacker culture and digital accelerationism, focused on solving complex physical problems purely through swift algorithmic logic."
  },
  human_in_the_loop_ethics: {
    description: "Ensures code alignment with human control overrides, safety protocols, detailed diagnostic tracing, and explicit permission structures.",
    historicalContext: "Formulated in cyber-physical safety boards and early human-machine interaction systems to guarantee automated systems always remain inspectable."
  },
  binary_logic_absolutism: {
    description: "Enforces dry mathematical correctness, pure functional paradigms, and perfect boolean or bitwise state representation. Rejects loose type assertions.",
    historicalContext: "Rooted in Formal Methods, mathematical proofs of computer software correctness, and dry-run static program verification."
  },
  cybernetic_cognitivism: {
    description: "Evaluates systemic feedback loops, homeostatic adaptations, and self-organizing node structures. Rejects static, non-adaptive logic arrays.",
    historicalContext: "Originates from Norbert Wiener's Cybernetics (1948), focusing on circular feedback systems and recursive information routing."
  },
  temporal_chronology: {
    description: "Ensures chronological ordering, transactional sequence integrity, and chronological hotswap synchronization. Rejects out-of-order state mutations.",
    historicalContext: "Derived from distributed database transaction protocols, Log-Structured LSM structures, and vector clock ordering frameworks."
  }
};

export default function DebateChamber({ 
  agents, 
  onToggleAgent, 
  onSelectAll, 
  currentTopic, 
  isActive, 
  votes, 
  consensus,
  consensusCoefficient,
  cognitiveFriction,
  epistemicRuling 
}: DebateChamberProps) {
  // Details Panel States
  const [selectedAgentId, setSelectedAgentId] = useState<string>('archivist');
  const [perspectiveDetails, setPerspectiveDetails] = useState<Record<string, PerspectiveDetail>>(() => {
    try {
      const saved = safeGetLocalStorage('nexus_perspective_details');
      return saved ? JSON.parse(saved) : DEFAULT_PERSPECTIVE_DETAILS;
    } catch {
      return DEFAULT_PERSPECTIVE_DETAILS;
    }
  });

  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editedDescription, setEditedDescription] = useState<string>('');
  const [editedHistory, setEditedHistory] = useState<string>('');

  const selectedAgent = useMemo(() => {
    return agents.find(a => a.id === selectedAgentId) || agents[0];
  }, [agents, selectedAgentId]);

  useEffect(() => {
    if (selectedAgent) {
      const detail = perspectiveDetails[selectedAgent.id] || { description: '', historicalContext: '' };
      setEditedDescription(detail.description);
      setEditedHistory(detail.historicalContext);
    }
    setIsEditing(false);
  }, [selectedAgent, perspectiveDetails]);

  const handleSaveDetails = useCallback(() => {
    if (!selectedAgent) return;
    const updated = {
      ...perspectiveDetails,
      [selectedAgent.id]: {
        description: editedDescription,
        historicalContext: editedHistory
      }
    };
    setPerspectiveDetails(updated);
    safeSetLocalStorage('nexus_perspective_details', JSON.stringify(updated));
    setIsEditing(false);
  }, [selectedAgent, perspectiveDetails, editedDescription, editedHistory]);

  const handleResetDetails = useCallback(() => {
    if (!selectedAgent) return;
    const defaultDetail = DEFAULT_PERSPECTIVE_DETAILS[selectedAgent.id] || { description: '', historicalContext: '' };
    setEditedDescription(defaultDetail.description);
    setEditedHistory(defaultDetail.historicalContext);
  }, [selectedAgent]);

  const agentsWithVotes = useMemo(() => {
    if (!votes || votes.length === 0) {
      return agents as (DebateAgent & { vote?: AgentVote })[];
    }
    
    const voteMap = new Map<string, AgentVote>(votes.map(v => [v.agentId, v]));
    const agentCount = agents.length;
    const enrichedAgents = new Array(agentCount);
    
    for (let i = 0; i < agentCount; i++) {
      const currentAgent = agents[i];
      enrichedAgents[i] = {
        ...currentAgent,
        vote: voteMap.get(currentAgent.id)
      };
    }
    
    return enrichedAgents;
  }, [agents, votes]);

  const handleSelectAllClick = useCallback(() => {
    if (!onSelectAll) return;
    
    let hasIdleAgent = false;
    const agentCount = agents.length;
    
    for (let i = 0; i < agentCount; i++) {
      if (agents[i].status === 'idle') {
        hasIdleAgent = true;
        break;
      }
    }
    
    onSelectAll(hasIdleAgent);
  }, [onSelectAll, agents]);

  const isAllActive = useMemo(() => {
    const agentCount = agents.length;
    if (agentCount === 0) return false;
    
    for (let i = 0; i < agentCount; i++) {
      if (agents[i].status !== 'active') return false;
    }
    
    return true;
  }, [agents]);

  const consensusColor = useMemo(() => {
    if (consensus === 'APPROVE') return COLORS.green;
    if (consensus === 'REJECT') return COLORS.dalekRed;
    return COLORS.gold;
  }, [consensus]);

  const consensusCoefficientWidth = useMemo(() => {
    if (consensusCoefficient === undefined) return '0%';
    return `${Math.max(0, Math.min(100, consensusCoefficient * 100))}%`;
  }, [consensusCoefficient]);

  const consensusCoefficientPercent = useMemo(() => {
    if (consensusCoefficient === undefined) return 0;
    return Math.round(consensusCoefficient * 100);
  }, [consensusCoefficient]);

  return (
    <div className="dalek-panel rounded-lg p-4 space-y-4">
      <div className="dalek-panel-header py-2 px-1 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users size={14} style={{ color: COLORS.purple }} />
          <span className="font-mono text-[10px] uppercase tracking-wider font-bold">DEBATE CHAMBER [12 PERSPECTIVES]</span>
          {onSelectAll && !isActive && (
            <button
              onClick={handleSelectAllClick}
              type="button"
              className="ml-2 px-1.5 py-0.5 rounded text-[8px] bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors uppercase tracking-wider border border-white/10"
            >
              {isAllActive ? 'DESELECT ALL' : 'SELECT ALL'}
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          {consensus && (
            <span
              style={{
                fontSize: '8px',
                fontFamily: 'var(--font-orbitron), sans-serif',
                letterSpacing: '0.08em',
                color: consensusColor,
                fontWeight: 700,
              }}
            >
              {consensus}
            </span>
          )}
          <div className="flex items-center gap-1.5">
            <div
              className="w-1.5 h-1.5 rounded-full"
              style={{
                background: isActive ? COLORS.purple : '#333',
                boxShadow: isActive ? `0 0 4px ${COLORS.purple}` : 'none',
              }}
            />
            <span style={{ fontSize: '9px', color: isActive ? COLORS.purple : COLORS.textMuted, fontFamily: 'var(--font-orbitron), sans-serif', letterSpacing: '0.08em' }}>
              {isActive ? 'ACTIVE' : 'STANDBY'}
            </span>
          </div>
        </div>
      </div>

      {/* Grid of the 12 perspectives */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {agentsWithVotes.map((agent) => (
          <AgentItem
            key={agent.id}
            agent={agent}
            isActive={isActive}
            isSelected={selectedAgentId === agent.id}
            onToggleAgent={onToggleAgent}
            onSelectDetail={setSelectedAgentId}
          />
        ))}
      </div>

      {/* Interactive, User-Editable Detail Panel */}
      {selectedAgent && (
        <div 
          className="p-3.5 rounded-lg border border-white/5 bg-[#070707] space-y-3 relative"
          id={`perspective-info-${selectedAgent.id}`}
        >
          <div className="flex items-center justify-between border-b border-white/5 pb-2">
            <div className="flex items-center gap-2">
              <span 
                className="w-2 h-2 rounded-full"
                style={{ background: selectedAgent.color, boxShadow: `0 0 6px ${selectedAgent.color}40` }}
              />
              <span 
                className="text-[10px] font-bold tracking-wider uppercase font-mono"
                style={{ color: selectedAgent.color }}
              >
                {selectedAgent.name} PERSPECTIVE LOG
              </span>
            </div>
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                type="button"
                className="px-2 py-1 text-[8px] font-mono border border-white/10 hover:border-white/20 text-gray-400 hover:text-white rounded flex items-center gap-1 uppercase transition-colors"
              >
                <Edit3 size={10} />
                Edit Perspective
              </button>
            ) : (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleSaveDetails}
                  type="button"
                  className="px-2 py-1 text-[8px] font-mono border border-green-500/20 bg-green-500/10 text-green-400 hover:bg-green-500/20 rounded flex items-center gap-1 uppercase transition-colors font-bold"
                >
                  <Save size={10} />
                  Save
                </button>
                <button
                  onClick={handleResetDetails}
                  type="button"
                  className="px-2 py-1 text-[8px] font-mono border border-white/10 hover:border-white/20 text-gray-400 hover:text-white rounded transition-colors"
                >
                  Reset Defaults
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  type="button"
                  className="p-1 border border-white/5 bg-white/5 text-gray-400 hover:text-white rounded transition-colors"
                >
                  <X size={10} />
                </button>
              </div>
            )}
          </div>

          <div className="space-y-3.5 font-mono text-[10px] text-gray-300">
            {/* Description Text block */}
            <div className="space-y-1">
              <span className="text-[8px] text-purple-400/80 uppercase tracking-widest font-bold">Description & Analytical Lens</span>
              {isEditing ? (
                <textarea
                  value={editedDescription}
                  onChange={(e) => setEditedDescription(e.target.value)}
                  className="w-full h-16 px-2 py-1.5 text-[9px] bg-black border border-white/10 focus:border-purple-500 focus:outline-none rounded font-mono text-gray-300 leading-normal resize-none"
                />
              ) : (
                <p className="leading-relaxed bg-black/40 p-2 rounded border border-white/5 text-gray-300">
                  {perspectiveDetails[selectedAgent.id]?.description || "No description loaded."}
                </p>
              )}
            </div>

            {/* Historical Context Text block */}
            <div className="space-y-1">
              <span className="text-[8px] text-purple-400/80 uppercase tracking-widest font-bold">Origins & Historical Context</span>
              {isEditing ? (
                <textarea
                  value={editedHistory}
                  onChange={(e) => setEditedHistory(e.target.value)}
                  className="w-full h-16 px-2 py-1.5 text-[9px] bg-black border border-white/10 focus:border-purple-500 focus:outline-none rounded font-mono text-gray-300 leading-normal resize-none"
                />
              ) : (
                <p className="leading-relaxed bg-black/40 p-2 rounded border border-white/5 text-gray-400 italic">
                  {perspectiveDetails[selectedAgent.id]?.historicalContext || "No context loaded."}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {(consensusCoefficient !== undefined || cognitiveFriction !== undefined || epistemicRuling) && (
        <div 
          className="p-3 rounded-lg border border-purple-950/30 bg-[#070007]/60 space-y-2.5"
          id="epistemic-debate-metrics"
        >
          <div className="flex items-center gap-1.5 border-b border-purple-950/20 pb-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
            <span style={{ fontSize: '9px', color: COLORS.purple, fontFamily: 'var(--font-orbitron), sans-serif', fontWeight: 700, letterSpacing: '0.1em' }}>
              ✦ DIALECTICAL EQUILIBRIUM MECHANICS
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {consensusCoefficient !== undefined && (
              <div className="space-y-1">
                <span className="text-[8px] text-gray-500 font-mono block">CONSENSUS RATIO</span>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-[#120512] h-1.5 rounded border border-purple-900/20 overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-purple-600 to-fuchsia-500 h-full transition-all duration-1000"
                      style={{ width: consensusCoefficientWidth }}
                    />
                  </div>
                  <span className="text-[9px] font-mono text-purple-400 font-bold">
                    {consensusCoefficientPercent}%
                  </span>
                </div>
              </div>
            )}

            {cognitiveFriction !== undefined && (
              <div className="space-y-1">
                <span className="text-[8px] text-gray-400 font-mono block">COGNITIVE FRICTION</span>
                <span className={`text-[9px] font-mono font-bold block ${cognitiveFriction > 0.5 ? 'text-amber-500' : 'text-[#00ffcc]'}`}>
                  {cognitiveFriction > 0.5 ? 'HIGH • DISPUTED PREMISES' : 'LOW • SWARM CONVERGENCE'}
                </span>
              </div>
            )}
          </div>

          {epistemicRuling && (
            <div className="pt-2 border-t border-purple-950/20 space-y-1">
              <span className="text-[8px] text-gray-500 font-mono block">EPISTEMOLOGICAL RULING (SYNTHESIS):</span>
              <p className="text-[9px] text-[#dacada] font-mono leading-relaxed bg-[#0d000d]/80 p-2 rounded border border-purple-950/40 italic">
                &ldquo;{epistemicRuling}&rdquo;
              </p>
            </div>
          )}
        </div>
      )}

      {currentTopic ? (
        <div
          className="debate-topic px-3 py-2 rounded text-center"
          style={{
            background: 'rgba(204, 0, 255, 0.03)',
            border: '1px solid rgba(204, 0, 255, 0.08)',
          }}
        >
          <span style={{ fontSize: '8px', color: COLORS.textMuted, fontFamily: 'var(--font-orbitron), sans-serif', letterSpacing: '0.1em', display: 'block', marginBottom: '4px' }}>
            CURRENT TOPIC
          </span>
          <p style={{ fontSize: '10px', color: COLORS.purple, fontFamily: 'var(--font-share-tech-mono), monospace', lineHeight: 1.4 }}>
            {currentTopic}
          </p>
        </div>
      ) : (
        <div
          className="px-3 py-2 rounded text-center"
          style={{ background: '#060606' }}
        >
          <p style={{ fontSize: '10px', color: COLORS.textMuted }}>
            No active debate. Initiate analysis to convene the chamber.
          </p>
        </div>
      )}
    </div>
  );
}

// Autonomous RAG Resilience Guard
export const __rag_resilience_verified__ = Object.freeze({
  generation: 115,
  timestamp: "2026-09-20T03:45:55.627Z",
  ragEngine: "DARLEK_CAAN_HYBRID_RAG"
});