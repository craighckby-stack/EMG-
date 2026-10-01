/**
 * File: src/components/LogStream.tsx
 * Role: Modern Black & Emerald Telemetry Event Stream
 */

import React, { useState, useRef, useEffect } from 'react';
import { Terminal, Trash2, Copy, Check } from 'lucide-react';
import { TelemetryLog, LogType } from '../types';

interface LogStreamProps {
  logs: TelemetryLog[];
  onClearLogs: () => void;
}

export const LogStream: React.FC<LogStreamProps> = ({ logs, onClearLogs }) => {
  const [filter, setFilter] = useState<'all' | LogType>('all');
  const [autoScroll] = useState(true);
  const [copied, setCopied] = useState(false);
  const streamRef = useRef<HTMLDivElement | null>(null);

  const filteredLogs = logs.filter((log) => {
    if (filter === 'all') return true;
    return log.type === filter;
  });

  useEffect(() => {
    if (autoScroll && streamRef.current) {
      streamRef.current.scrollTop = 0;
    }
  }, [logs, autoScroll]);

  const handleCopyLogs = () => {
    const text = logs
      .map((l) => `[${l.timestamp}] [${l.type.toUpperCase()}] ${l.msg}`)
      .join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getTypeStyle = (type: LogType) => {
    switch (type) {
      case 'success':
        return 'text-emerald-300 font-medium';
      case 'error':
        return 'text-red-300 font-bold';
      case 'warning':
        return 'text-amber-300 font-medium';
      case 'neural':
        return 'text-emerald-300 font-medium';
      case 'noop':
        return 'text-amber-300 font-medium';
      default:
        return 'text-zinc-200';
    }
  };

  const getTypeBadge = (type: LogType) => {
    switch (type) {
      case 'success':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      case 'error':
        return 'bg-red-500/20 text-red-300 border-red-500/40';
      case 'warning':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'neural':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      case 'noop':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold';
      default:
        return 'bg-zinc-800/80 text-zinc-300 border-zinc-700';
    }
  };

  return (
    <div
      id="emg-log-stream"
      className="cyber-card p-5 md:p-6 rounded-2xl flex flex-col gap-4 bg-[#070e0a]/80 shadow-[0_8px_32px_rgba(0,0,0,0.5)]"
    >
      {/* Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-emerald-950 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-emerald-950/80 border border-emerald-500/30 text-emerald-400">
            <Terminal className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-white tracking-tight">
            Telemetry Stream
          </h3>
          <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-500/30 text-emerald-300">
            {filteredLogs.length} Events
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Filters */}
          <div className="flex bg-[#050b07] p-1 rounded-xl border border-emerald-900/60 text-xs font-sans">
            {(['all', 'success', 'neural', 'noop', 'error'] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`px-2.5 py-1 rounded-lg uppercase cursor-pointer transition-all text-[11px] font-semibold ${
                  filter === f
                    ? 'bg-emerald-500 text-black shadow-sm font-bold'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {f === 'noop' ? 'No-Op' : f}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleCopyLogs}
            className="p-2 rounded-xl bg-[#09140c] hover:bg-emerald-950 text-zinc-300 hover:text-white border border-emerald-800/60 transition-colors cursor-pointer"
            title="Copy logs"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
          </button>

          <button
            type="button"
            onClick={onClearLogs}
            className="p-2 rounded-xl bg-[#09140c] hover:bg-red-950/60 text-zinc-400 hover:text-red-400 border border-emerald-800/60 transition-colors cursor-pointer"
            title="Clear event stream"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Log Feed */}
      <div
        ref={streamRef}
        className="h-64 overflow-y-auto bg-[#040805] rounded-xl border border-emerald-950/80 p-3.5 font-mono text-xs space-y-2.5"
      >
        {filteredLogs.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-zinc-500 text-xs">
            <span>Awaiting telemetry broadcast signals...</span>
          </div>
        ) : (
          filteredLogs.map((log, idx) => (
            <div
              key={log.id || `log-${idx}-${log.timestamp}`}
              className="flex items-start gap-2.5 text-[11px] leading-relaxed pb-2 border-b border-emerald-950/40 last:border-0"
            >
              <span className="text-zinc-500 shrink-0 select-none">
                [{log.timestamp}]
              </span>

              <span
                className={`px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-md shrink-0 border ${getTypeBadge(
                  log.type
                )}`}
              >
                {log.type}
              </span>

              <span className={`flex-1 break-all select-text ${getTypeStyle(log.type)}`}>
                {log.msg}
              </span>

              {log.latencyMs !== undefined && (
                <span className="text-zinc-400 text-[10px] shrink-0 font-mono">
                  {log.latencyMs}ms
                </span>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
