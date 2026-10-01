/* DARLEK CAAN RAG SYNTHESIS - Autonomous Generation G-119 */
/**
 * DARLEK CANN ARCHITECTURAL HEADER
 * File: src/components/DosConsoleModal.tsx (Optimized)
 * Role: Full-time interactive MS-DOS terminal monitor displaying real system telemetry,
 *       triggering autonomous file hotswaps, and visualizing RAG brain ingestion.
 */

import React, { useState, useEffect, useRef, type JSX } from 'react';
import type { SystemState } from '@/lib/types';
import { Terminal, X, Minimize2, Maximize2, Play, Pause, Zap, Database, RefreshCw, ChevronUp, Brain, HardDrive } from 'lucide-react';
import { msDosEngine, type DosLogLine, type MsDosEngineState } from '@/lib/msDosEngine';
import { getRagBrainRealMetrics } from '@/lib/ragBrain';

export interface DosConsoleModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly systemState: SystemState;
  readonly isDocked?: boolean;
  readonly onToggleDock?: () => void;
}

export default function DosConsoleModal({
  isOpen,
  onClose,
  systemState,
  isDocked = false,
  onToggleDock,
}: DosConsoleModalProps): JSX.Element | null {
  const [engineState, setEngineState] = useState<MsDosEngineState>(() => msDosEngine.getState());
  const [dosInput, setDosInput] = useState<string>('');
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [autoScroll, setAutoScroll] = useState<boolean>(true);
  const [isMaximized, setIsMaximized] = useState<boolean>(false);
  const terminalEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unsubscribe = msDosEngine.subscribe((state: MsDosEngineState) => {
      setEngineState(state);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (isOpen && !isDocked) {
      const timer = window.setTimeout(() => inputRef.current?.focus(), 100);
      return () => window.clearTimeout(timer);
    }
  }, [isOpen, isDocked]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key === 'Escape' && isOpen && !isDocked) {
        if (onToggleDock) {
          onToggleDock();
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isDocked, onClose, onToggleDock]);

  useEffect(() => {
    if (autoScroll && terminalEndRef.current && isOpen && !isDocked) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [engineState.lines, autoScroll, isOpen, isDocked]);

  if (!isOpen) return null;

  const handleCommandSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    const cmd = dosInput.trim();
    if (!cmd) return;

    setCommandHistory((prev: string[]) => [...prev, cmd]);
    setHistoryIndex(-1);
    setDosInput('');

    const lowerCmd = cmd.toLowerCase();
    if (lowerCmd === 'exit' || lowerCmd === 'quit') {
      onClose();
      return;
    }

    try {
      await msDosEngine.executeCommand(cmd);
    } catch (err: unknown) {
      console.error('Failed to execute command:', err instanceof Error ? err.message : String(err));
    }
  };

  const handleKeyDownHistory = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length === 0) return;
      const nextIdx = historyIndex + 1;
      if (nextIdx < commandHistory.length) {
        setHistoryIndex(nextIdx);
        setDosInput(commandHistory[commandHistory.length - 1 - nextIdx] ?? '');
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const nextIdx = historyIndex - 1;
        setHistoryIndex(nextIdx);
        setDosInput(commandHistory[commandHistory.length - 1 - nextIdx] ?? '');
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setDosInput('');
      }
    }
  };

  if (isDocked) {
    const latestLine = engineState.lines[engineState.lines.length - 1];
    return (
      <div className="fixed bottom-2 right-4 z-50 flex items-center gap-2 bg-black border-2 border-white/80 text-white font-mono text-[10px] px-3 py-1.5 shadow-2xl rounded select-none animate-in slide-in-from-bottom-2">
        <div className="flex items-center gap-1.5 text-green-400 font-bold">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-ping inline-block" />
          <span>[MS-DOS DAEMON: ACTIVE]</span>
        </div>
        <div className="hidden sm:flex items-center gap-1 text-white/70 truncate max-w-xs">
          <span>HOTSWAPS: {engineState.totalHotswaps}</span>
          <span>|</span>
          <span className="truncate">{latestLine ? `[${latestLine.tag}] ${latestLine.message}` : 'Telemetry idle'}</span>
        </div>
        <button
          onClick={onToggleDock}
          className="ml-2 px-2 py-0.5 bg-white text-black font-bold hover:bg-gray-200 transition-colors cursor-pointer flex items-center gap-1 rounded text-[9px]"
          title="Expand MS-DOS Console"
          type="button"
        >
          <ChevronUp size={11} />
          EXPAND
        </button>
        <button
          onClick={onClose}
          className="p-1 hover:bg-red-600 transition-colors cursor-pointer text-white"
          title="Hide Monitor"
          type="button"
        >
          <X size={11} />
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className={`bg-black border-2 border-white rounded shadow-2xl flex flex-col transition-all duration-200 ${
          isMaximized ? 'w-full h-full' : 'w-full max-w-5xl h-[85vh]'
        }`}
        style={{ fontFamily: '"Courier New", Courier, monospace, monospace' }}
      >
        <div className="bg-white text-black px-3 py-1 flex items-center justify-between font-bold text-xs sm:text-sm select-none shrink-0 border-b border-white">
          <div className="flex items-center gap-2 truncate">
            <Terminal size={14} className="stroke-[2.5]" />
            <span className="truncate">
              MS-DOS Executive - C:\DALEK\SYS\ENGINE.EXE [FULL-TIME HOTSWAP &amp; RAG PERSISTENCE]
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => void msDosEngine.triggerAutonomousHotswap()}
              className="hidden md:flex px-1.5 py-0.5 text-[9px] font-mono border border-black bg-black text-white hover:bg-gray-800 transition-colors items-center gap-1 cursor-pointer font-bold"
              title="Force immediate RAG mutation & file hotswap"
              type="button"
            >
              <Zap size={9} className="text-yellow-400" />
              HOTSWAP NOW
            </button>

            <button
              onClick={() => msDosEngine.setAutonomousHotswap(!engineState.autonomousHotswap)}
              className={`hidden md:flex px-1.5 py-0.5 text-[9px] font-mono border border-black transition-colors items-center gap-1 cursor-pointer font-bold ${
                engineState.autonomousHotswap ? 'bg-black text-white' : 'bg-gray-300 text-black'
              }`}
              title="Toggle Full-Time Autonomous Hotswapping"
              type="button"
            >
              <RefreshCw size={9} className={engineState.autonomousHotswap ? 'animate-spin' : ''} />
              AUTORUN: {engineState.autonomousHotswap ? 'ON' : 'OFF'}
            </button>

            <button
              onClick={() => void msDosEngine.executeCommand('rag stats')}
              className="hidden lg:flex px-1.5 py-0.5 text-[9px] font-mono border border-black hover:bg-black hover:text-white transition-colors items-center gap-1 cursor-pointer"
              title="Inspect RAG Brain"
              type="button"
            >
              <Database size={9} />
              RAG STATS
            </button>

            <button
              onClick={() => setAutoScroll(!autoScroll)}
              className="px-1.5 py-0.5 text-[10px] font-mono border border-black hover:bg-black hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
              title="Toggle Auto Scroll"
              type="button"
            >
              {autoScroll ? <Pause size={10} /> : <Play size={10} />}
              {autoScroll ? 'SCROLL' : 'PAUSED'}
            </button>

            {onToggleDock && (
              <button
                onClick={onToggleDock}
                className="p-1 hover:bg-black hover:text-white transition-colors cursor-pointer"
                title="Dock to corner (Keep running)"
                type="button"
              >
                <Minimize2 size={12} />
              </button>
            )}

            <button
              onClick={() => setIsMaximized(!isMaximized)}
              className="p-1 hover:bg-black hover:text-white transition-colors cursor-pointer"
              title={isMaximized ? 'Restore Window' : 'Maximize Window'}
              type="button"
            >
              {isMaximized ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
            </button>

            <button
              onClick={onClose}
              className="p-1 bg-black text-white hover:bg-red-600 hover:text-white transition-colors cursor-pointer"
              title="Close DOS Window (ESC)"
              type="button"
            >
              <X size={12} />
            </button>
          </div>
        </div>

        <div className="bg-white/10 text-white px-3 py-1 text-[10px] border-b border-white/20 flex flex-wrap items-center justify-between gap-2 font-mono">
          <div className="flex items-center gap-3">
            <span className="text-green-400 font-bold">DAEMON: RUNNING</span>
            <span>HOTSWAPS: {engineState.totalHotswaps}</span>
            <span>LAST FILE: {engineState.lastHotswappedFile || 'neuralActiveGene.ts'}</span>
          </div>
          <div className="flex items-center gap-3 text-white/70">
            {(() => {
              const rag = getRagBrainRealMetrics();
              return (
                <>
                  <span className="text-[#00ffcc] font-bold flex items-center gap-1">
                    <Brain size={10} />
                    ABILITY: {rag.mutationCount}m / {rag.hotswapCount}h
                  </span>
                  <span className="text-emerald-300 flex items-center gap-1">
                    <HardDrive size={10} />
                    FREE: {rag.availableFormatted} ({rag.availablePercent}%)
                  </span>
                </>
              );
            })()}
            <span>REPO: {systemState.repoConfig?.repo || 'Autonomous Engine'}</span>
          </div>
        </div>

        <div
          className="flex-1 p-3 sm:p-4 overflow-y-auto space-y-1 text-white text-xs sm:text-sm leading-snug selection:bg-white selection:text-black"
          style={{
            backgroundColor: '#000000',
            color: '#ffffff',
            unicodeBidi: 'normal',
            direction: 'ltr',
          }}
          onClick={() => inputRef.current?.focus()}
        >
          {engineState.lines.map((line: DosLogLine) => (
            <div
              key={line.id}
              className="flex gap-2 items-start break-all hover:bg-white/5 px-1 py-0.5 rounded"
            >
              <span className="text-white/50 shrink-0 font-mono text-[11px] sm:text-xs">
                [{line.time}]
              </span>
              <span className="text-white/70 shrink-0 font-mono text-[11px] sm:text-xs min-w-[85px]">
                [{line.addr}]
              </span>
              <span
                className={`font-mono font-bold shrink-0 text-[11px] sm:text-xs ${
                  line.tag.includes('HOTSWAP')
                    ? 'text-yellow-400'
                    : line.tag.includes('RAG')
                    ? 'text-cyan-400'
                    : line.tag.includes('ERR')
                    ? 'text-red-400'
                    : 'text-white'
                }`}
              >
                [{line.tag}]
              </span>
              <span className="text-white font-mono flex-1 whitespace-pre-wrap">{line.message}</span>
            </div>
          ))}
          <div ref={terminalEndRef} />
        </div>

        <form
          onSubmit={(e) => void handleCommandSubmit(e)}
          className="bg-black border-t border-white/40 p-2 sm:p-3 flex items-center gap-2 shrink-0 text-white font-mono text-xs sm:text-sm"
          style={{ unicodeBidi: 'normal', direction: 'ltr' }}
        >
          <span className="text-white font-bold shrink-0">C:\DALEK\SYS&gt;</span>
          <input
            ref={inputRef}
            maxLength={256}
            dir="ltr"
            type="text"
            value={dosInput}
            onChange={(e) => setDosInput(e.target.value)}
            onKeyDown={handleKeyDownHistory}
            style={{ unicodeBidi: 'normal', direction: 'ltr' }}
            placeholder="Type command (e.g. HOTSWAP, MUTATE, AUTORUN OFF, RAG DUMP, HELP)..."
            className="flex-1 bg-transparent text-white focus:outline-none border-none p-0 font-mono text-xs sm:text-sm placeholder-white/30"
            autoFocus
          />
          <button
            type="submit"
            aria-label="Execute command"
            className="px-3 py-1 bg-white text-black font-bold text-xs hover:bg-gray-200 transition-colors cursor-pointer shrink-0 uppercase"
          >
            EXECUTE
          </button>
        </form>
      </div>
    </div>
  );
}

// Autonomous RAG Resilience Guard
export const __rag_resilience_verified__ = Object.freeze({
  generation: 116,
  timestamp: "2026-09-20T03:46:19.003Z",
  ragEngine: "DARLEK_CAAN_HYBRID_RAG"
});