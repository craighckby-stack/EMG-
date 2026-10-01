/**
 * File: src/components/DiagnosticsModal.tsx
 * Role: Modern Black & Emerald System Diagnostic Telemetry Monitor
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Activity, ShieldCheck, AlertTriangle, RefreshCw, X, Server, Database, Key } from 'lucide-react';

interface DiagnosticData {
  kernel: string;
  status: 'HEALTHY' | 'DEGRADED';
  missing: string[];
  nodeEnv: string;
  debugMode: boolean;
  memoryPath: string;
  timestamp: string;
}

interface DiagnosticsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DiagnosticsModal: React.FC<DiagnosticsModalProps> = ({ isOpen, onClose }) => {
  const [data, setData] = useState<DiagnosticData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDiagnostics = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/diagnostic');
      if (!res.ok) {
        throw new Error(`Diagnostic service returned HTTP ${res.status}`);
      }
      const text = await res.text();
      if (!text || text.trim().startsWith('<')) {
        throw new Error('Diagnostic endpoint returned non-JSON response.');
      }
      const json = JSON.parse(text) as DiagnosticData;
      setData(json);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to fetch diagnostic telemetry');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchDiagnostics();
    }
  }, [isOpen, fetchDiagnostics]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      id="emg-diagnostics-modal-backdrop"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
    >
      <div
        id="emg-diagnostics-modal"
        onClick={(e) => e.stopPropagation()}
        className="cyber-card bg-[#070e0a]/95 border border-emerald-500/30 rounded-2xl w-full max-w-xl shadow-[0_16px_48px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-emerald-950 bg-[#040805]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-950/80 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                System Diagnostics & Telemetry
              </h2>
              <p className="text-xs text-zinc-400 font-mono">EMG Core Node Diagnostics</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="btn-refresh-diagnostics"
              onClick={fetchDiagnostics}
              disabled={isLoading}
              title="Refresh diagnostic probe"
              aria-label="Refresh diagnostic probe"
              className="p-2 rounded-xl bg-[#09140c] hover:bg-emerald-950 text-zinc-300 hover:text-white border border-emerald-800/60 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-emerald-400' : ''}`} />
            </button>
            <button
              id="btn-close-diagnostics-header"
              onClick={onClose}
              title="Close diagnostics (Esc)"
              aria-label="Close diagnostics"
              className="p-2 rounded-xl bg-[#09140c] text-zinc-400 hover:text-white hover:bg-emerald-950 border border-emerald-800/60 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 overflow-y-auto font-mono text-xs">
          {isLoading && !data && (
            <div className="py-8 text-center text-zinc-400 flex flex-col items-center gap-2">
              <RefreshCw className="w-6 h-6 animate-spin text-emerald-400" />
              <span>Probing kernel interfaces...</span>
            </div>
          )}

          {error && (
            <div className="p-4 rounded-xl bg-red-950/40 border border-red-500/40 text-red-300 flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 shrink-0 text-red-400" />
              <div>
                <p className="font-bold">Diagnostic Probe Error</p>
                <p className="text-xs text-red-300/80 mt-0.5">{error}</p>
              </div>
            </div>
          )}

          {data && (
            <>
              {/* Overall Status Banner */}
              <div
                className={`p-4 rounded-xl border flex items-center justify-between ${
                  data.status === 'HEALTHY'
                    ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                    : 'bg-amber-950/40 border-amber-500/40 text-amber-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  {data.status === 'HEALTHY' ? (
                    <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-amber-400" />
                  )}
                  <div>
                    <span className="font-bold text-sm">Kernel Status: {data.status}</span>
                    <p className="text-xs text-zinc-300 font-mono mt-0.5">
                      {data.status === 'HEALTHY'
                        ? 'All mandatory kernel environment variables and modules verified.'
                        : `Missing variables: ${data.missing.join(', ')}`}
                    </p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-lg bg-black/60 border border-emerald-800/40 text-xs font-bold uppercase tracking-wider text-emerald-300">
                  {data.kernel}
                </span>
              </div>

              {/* Grid of parameters */}
              <div className="grid grid-cols-2 gap-3 font-sans">
                <div className="p-3 rounded-xl bg-[#040805] border border-emerald-950">
                  <div className="text-zinc-400 text-[10px] uppercase tracking-wider font-mono flex items-center gap-1.5 mb-1">
                    <Server className="w-3.5 h-3.5 text-emerald-400" />
                    Environment Mode
                  </div>
                  <div className="text-white font-bold capitalize text-xs">{data.nodeEnv}</div>
                </div>

                <div className="p-3 rounded-xl bg-[#040805] border border-emerald-950">
                  <div className="text-zinc-400 text-[10px] uppercase tracking-wider font-mono flex items-center gap-1.5 mb-1">
                    <Database className="w-3.5 h-3.5 text-emerald-400" />
                    Memory Path
                  </div>
                  <div className="text-white font-bold truncate text-xs font-mono">{data.memoryPath}</div>
                </div>

                <div className="p-3 rounded-xl bg-[#040805] border border-emerald-950">
                  <div className="text-zinc-400 text-[10px] uppercase tracking-wider font-mono flex items-center gap-1.5 mb-1">
                    <Key className="w-3.5 h-3.5 text-emerald-400" />
                    Debug Mode
                  </div>
                  <div className="text-white font-bold text-xs">{data.debugMode ? 'ACTIVE' : 'INACTIVE'}</div>
                </div>

                <div className="p-3 rounded-xl bg-[#040805] border border-emerald-950">
                  <div className="text-zinc-400 text-[10px] uppercase tracking-wider font-mono flex items-center gap-1.5 mb-1">
                    <Activity className="w-3.5 h-3.5 text-emerald-400" />
                    Last Probe
                  </div>
                  <div className="text-white font-bold truncate text-xs font-mono">
                    {new Date(data.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>

              {/* Missing Requirements List (if any) */}
              {data.missing && data.missing.length > 0 && (
                <div className="p-3.5 rounded-xl bg-[#040805] border border-amber-500/30">
                  <p className="text-amber-300 text-xs mb-2 font-bold">Uninjected Variables:</p>
                  <div className="space-y-1">
                    {data.missing.map((key, i) => (
                      <div key={`missing-${key}-${i}`} className="flex items-center justify-between text-amber-300 bg-amber-950/30 px-2.5 py-1 rounded-lg border border-amber-500/20 text-xs">
                        <span>{key}</span>
                        <span className="text-[10px] text-zinc-400 font-mono">Required for full cloud features</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-emerald-950 bg-[#040805] flex items-center justify-between">
          <span className="text-xs text-zinc-400 font-mono">
            Validated by /lib/env-validator.ts
          </span>
          <button
            id="btn-close-diagnostics-footer"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold transition-colors cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
};
