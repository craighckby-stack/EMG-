/**
 * File: src/components/DiffModal.tsx
 * Role: Modern Black & Emerald AST Diff Inspection Modal
 */

import React, { useState, useEffect } from 'react';
import { X, Copy, Check, FileCode, AlertTriangle, KeyRound } from 'lucide-react';
import { MutationRecord } from '../types';

interface DiffModalProps {
  record: MutationRecord | null;
  onClose: () => void;
}

export const DiffModal: React.FC<DiffModalProps> = ({ record, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<'split' | 'unified'>('split');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (record) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [record, onClose]);

  if (!record) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(record.optimizedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isFailed = record.status === 'failed';
  const isNoop = record.status === 'noop';

  return (
    <div
      id="emg-diff-modal-backdrop"
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6"
    >
      <div
        id="emg-diff-modal"
        onClick={(e) => e.stopPropagation()}
        className="cyber-card bg-[#070e0a]/95 border border-emerald-500/30 rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-[0_16px_48px_rgba(0,0,0,0.9),0_0_30px_rgba(16,185,129,0.1)] overflow-hidden"
      >
        {/* Header */}
        <div className="p-4 sm:px-6 border-b border-emerald-950 flex items-center justify-between bg-[#040805]">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl border flex items-center justify-center ${
              isFailed ? 'bg-red-950/60 border-red-500/40 text-red-400' : 'bg-emerald-950/60 border-emerald-500/40 text-emerald-400'
            }`}>
              <FileCode className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-white text-sm font-mono">{record.path}</h3>
                <span
                  className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full uppercase font-bold border ${
                    record.status === 'applied'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : isFailed
                      ? 'bg-red-500/20 text-red-300 border-red-500/40'
                      : isNoop
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  }`}
                >
                  {record.status}
                </span>
                {(record.redactedCount || 0) > 0 && (
                  <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1 font-semibold">
                    <KeyRound className="w-3 h-3" />
                    {record.redactedCount} scrubbed
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400 font-mono mt-0.5">
                Latency: {record.latencyMs}ms &bull; Original: {record.originalLines}L &rarr; Optimized: {record.optimizedLines}L
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex rounded-xl bg-[#050b07] p-1 border border-emerald-900/80">
              <button
                type="button"
                onClick={() => setViewMode('split')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  viewMode === 'split' ? 'bg-emerald-500 text-black font-bold shadow-sm' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Split
              </button>
              <button
                type="button"
                onClick={() => setViewMode('unified')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  viewMode === 'unified' ? 'bg-emerald-500 text-black font-bold shadow-sm' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Optimized
              </button>
            </div>

            <button
              onClick={handleCopy}
              className="p-2 rounded-xl bg-[#09140c] hover:bg-emerald-950 text-zinc-300 hover:text-white border border-emerald-800/60 transition-colors cursor-pointer"
              title="Copy optimized code"
              aria-label="Copy optimized code"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
            </button>

            <button
              id="btn-close-diff-header"
              onClick={onClose}
              className="p-2 rounded-xl bg-[#09140c] hover:bg-emerald-950 text-zinc-400 hover:text-white border border-emerald-800/60 transition-colors cursor-pointer"
              title="Close modal (Esc)"
              aria-label="Close modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Validation Errors Notice */}
        {record.validationErrors && record.validationErrors.length > 0 && (
          <div className="px-6 py-3 bg-red-950/40 border-b border-red-900/50 text-xs text-red-300 font-mono space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-red-400 uppercase text-[10px]">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Type / Syntax Diagnostics Rejected Commit ({record.validationErrors.length} issues):</span>
            </div>
            <ul className="list-disc list-inside space-y-0.5 text-[11px] text-red-200 break-all">
              {record.validationErrors.map((err, i) => (
                <li key={`val-err-${i}-${err.slice(0, 15)}`}>{err}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Summary Bar */}
        {record.optimizationSummary && (
          <div className="px-6 py-2.5 bg-emerald-950/30 border-b border-emerald-900/40 text-xs text-zinc-200 flex items-center gap-2">
            <span className="font-semibold text-emerald-300 font-mono text-[10px] uppercase tracking-wider shrink-0">
              Directive:
            </span>
            <span className="break-all">{record.optimizationSummary}</span>
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 overflow-auto p-4 sm:p-6 bg-[#040805] font-mono text-xs text-zinc-200">
          {viewMode === 'split' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
              {/* Original */}
              <div className="flex flex-col border border-emerald-950 rounded-xl overflow-hidden bg-[#070e09]">
                <div className="px-4 py-2 bg-[#050a06] border-b border-emerald-950 text-[11px] font-bold text-zinc-300 flex items-center justify-between">
                  <span>BEFORE (ORIGINAL)</span>
                  <span className="text-zinc-400">{record.originalLines} lines</span>
                </div>
                <pre className="p-4 overflow-auto whitespace-pre-wrap break-all text-rose-300 leading-relaxed text-[11px] select-text">
                  <code>{record.originalCode}</code>
                </pre>
              </div>

              {/* Optimized */}
              <div className="flex flex-col border border-emerald-500/30 rounded-xl overflow-hidden bg-[#070e09]">
                <div className="px-4 py-2 bg-[#050a06] border-b border-emerald-950 text-[11px] font-bold text-emerald-300 flex items-center justify-between">
                  <span>AFTER (SYNTHESIZED)</span>
                  <span className="text-emerald-400">{record.optimizedLines} lines</span>
                </div>
                <pre className="p-4 overflow-auto whitespace-pre-wrap break-all text-emerald-200 leading-relaxed text-[11px] select-text">
                  <code>{record.optimizedCode}</code>
                </pre>
              </div>
            </div>
          ) : (
            <div className="border border-emerald-500/20 rounded-xl overflow-hidden bg-[#070e09]">
              <div className="px-4 py-2 bg-[#050a06] border-b border-emerald-950 text-[11px] font-bold text-emerald-300 flex items-center justify-between">
                <span>OPTIMIZED CODE</span>
                <span className="text-emerald-400">{record.optimizedLines} lines</span>
              </div>
              <pre className="p-4 overflow-auto whitespace-pre-wrap break-all text-emerald-200 leading-relaxed text-xs select-text">
                <code>{record.optimizedCode}</code>
              </pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-emerald-950 bg-[#040805] flex items-center justify-between text-xs text-zinc-400 font-mono">
          <span>EMG Core Neural AST Diff Engine</span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold cursor-pointer transition-all shadow-md shadow-emerald-500/20"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
