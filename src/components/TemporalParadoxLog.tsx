/* DARLEK CAAN RAG SYNTHESIS - Autonomous Generation G-136 [2026-09-20T05:58:00.653Z] */
/**
 * DARLEK CANN ARCHITECTURAL HEADER
 * File: src/components/TemporalParadoxLog.tsx
 * Role: Core system component participating in autonomous cognitive evolution cycles.
 * Architecture: Type-safe modular unit with resilient state interfaces.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, Clock, RefreshCw, ChevronDown, ChevronRight } from 'lucide-react';
import type { EvolutionLogEntry } from '@/lib/types';

export interface RejectionItem {
  id?: string;
  timestamp: string | Date;
  filePath: string;
  reason: string;
}

export interface TemporalParadoxLogProps {
  logEntries?: EvolutionLogEntry[];
  rejectionMemory?: RejectionItem[];
}

export interface ParadoxEntry {
  id: string;
  time: string;
  description: string;
  type: string;
}

const STORAGE_KEYS = {
  REJECTION_MEMORY: 'darlek_cann_rejection_memory',
  LOG_ENTRIES: 'darlek_cann_log_entries',
} as const;

const MAX_PARADOX_ENTRIES = 10;
const REFRESH_INTERVAL_MS = 3000;
const MAX_DESCRIPTION_LENGTH = 1024;

function sanitizeInput(value: unknown): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.length > MAX_DESCRIPTION_LENGTH) {
    return str.slice(0, MAX_DESCRIPTION_LENGTH) + '... [TRUNCATED]';
  }
  return str;
}

function formatTimeString(timestamp: unknown): string {
  if (!timestamp) return new Date().toLocaleTimeString();
  if (timestamp instanceof Date) return timestamp.toLocaleTimeString();
  if (typeof timestamp === 'string') {
    const parsedDate = new Date(timestamp);
    return Number.isNaN(parsedDate.getTime()) ? sanitizeInput(timestamp) : parsedDate.toLocaleTimeString();
  }
  return sanitizeInput(timestamp);
}

function fetchStoredData<T>(storageKey: string): T[] {
  try {
    const savedData = localStorage.getItem(storageKey);
    if (!savedData) return [];
    const parsed = JSON.parse(savedData);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export default function TemporalParadoxLog({ logEntries, rejectionMemory }: TemporalParadoxLogProps) {
  const [paradoxes, setParadoxes] = useState<ParadoxEntry[]>([]);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  const updateRealParadoxes = useCallback(() => {
    const collectedParadoxes: ParadoxEntry[] = [];

    const activeRejections = rejectionMemory?.length 
      ? rejectionMemory 
      : fetchStoredData<RejectionItem>(STORAGE_KEYS.REJECTION_MEMORY);
    
    activeRejections.forEach((rejection, index) => {
      if (!rejection) return;
      const safeId = sanitizeInput(rejection.id ?? index);
      const safeFilePath = sanitizeInput(rejection.filePath ?? 'unknown');
      const safeReason = sanitizeInput(rejection.reason ?? 'No reason specified');

      collectedParadoxes.push({
        id: `rej-${safeId}`,
        time: formatTimeString(rejection.timestamp),
        description: `Mutation rejected for ${safeFilePath}: ${safeReason}`,
        type: 'REJECTION',
      });
    });

    const activeLogs = logEntries?.length 
      ? logEntries 
      : fetchStoredData<EvolutionLogEntry>(STORAGE_KEYS.LOG_ENTRIES);

    activeLogs.forEach((entry, index) => {
      if (!entry) return;
      const isCriticalType = entry.type === 'ERROR' || entry.type === 'WARNING';
      const safeDescription = sanitizeInput(entry.description ?? 'No description provided');
      const hasCriticalKeywords = Boolean(
        safeDescription && (
          safeDescription.includes('REJECTED') ||
          safeDescription.includes('AST') ||
          safeDescription.includes('Coherence Gate')
        )
      );

      if (isCriticalType || hasCriticalKeywords) {
        const safeLogId = sanitizeInput(entry.id ?? `log_${index}_${entry.timestamp ? new Date(entry.timestamp).getTime() : Date.now()}`);
        const safeType = sanitizeInput(entry.type ?? 'UNKNOWN');

        collectedParadoxes.push({
          id: `log-${safeLogId}`,
          time: formatTimeString(entry.timestamp),
          description: safeDescription,
          type: safeType,
        });
      }
    });

    setParadoxes(collectedParadoxes.slice(0, MAX_PARADOX_ENTRIES));
  }, [logEntries, rejectionMemory]);

  useEffect(() => {
    updateRealParadoxes();
    const intervalId = setInterval(updateRealParadoxes, REFRESH_INTERVAL_MS);
    return () => clearInterval(intervalId);
  }, [updateRealParadoxes]);

  const toggleExpanded = useCallback(() => {
    setIsExpanded((previousState) => !previousState);
  }, []);

  const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      toggleExpanded();
    }
  }, [toggleExpanded]);

  const hasParadoxes = useMemo(() => paradoxes.length > 0, [paradoxes.length]);

  return (
    <div className="dalek-panel rounded-lg p-3 space-y-2 border border-red-900/30 bg-[#080202]">
      <div 
        className="dalek-panel-header py-1 px-1 flex items-center justify-between cursor-pointer select-none hover:bg-red-900/10 rounded transition-colors"
        onClick={toggleExpanded}
        role="button"
        tabIndex={0}
        onKeyDown={handleKeyDown}
      >
        <div className="flex items-center gap-2">
          <AlertTriangle className="text-red-500 animate-pulse" size={14} />
          <span style={{ fontSize: '11px', fontFamily: 'var(--font-orbitron), sans-serif', color: '#ff4444' }}>
            TEMPORAL PARADOX & REJECTION LOG
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded border border-red-900/40 bg-red-950/40 text-red-400 flex items-center gap-1">
            <RefreshCw size={10} className={hasParadoxes ? "animate-spin" : ""} />
            {paradoxes.length} CONFLICTS
          </span>
          {isExpanded ? <ChevronDown size={14} className="text-red-400" /> : <ChevronRight size={14} className="text-red-400" />}
        </div>
      </div>
      
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="pt-3">
              {!hasParadoxes ? (
                <div className="text-xs text-red-900/50 italic py-2">
                  No temporal paradoxes or coherence violations recorded in current timeline state.
                </div>
              ) : (
                <div className="space-y-2 max-h-[180px] overflow-y-auto pr-2">
                  <AnimatePresence>
                    {paradoxes.map((paradox) => (
                      <motion.div
                        key={paradox.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="flex items-start gap-3 text-xs font-mono p-2 bg-red-900/20 border border-red-900/30 rounded"
                      >
                        <div className="text-red-400/50 min-w-[70px] flex items-center gap-1 shrink-0">
                          <Clock size={10} />
                          {paradox.time}
                        </div>
                        <div className="text-red-300 flex-1">
                          <span className="font-bold text-red-400 mr-2">[{paradox.type}]</span>
                          {paradox.description}
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Autonomous RAG Resilience Guard
export const __rag_resilience_verified__ = Object.freeze({
  generation: 134,
  timestamp: "2026-09-20T03:53:55.411Z",
  ragEngine: "DARLEK_CAAN_HYBRID_RAG"
});
