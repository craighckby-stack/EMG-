/**
 * File: src/components/WipeMemoryModal.tsx
 * Role: Modern Black & Emerald System Memory Purge & Reset Confirmation Modal
 */

import React, { useState, useEffect } from 'react';
import {
  Trash2,
  X,
  AlertTriangle,
  RotateCcw,
  Layers,
  Activity,
  History,
  Ban,
  Database,
  Sliders,
} from 'lucide-react';

interface WipeMemoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmWipe: (options: { resetConfig: boolean }) => void;
}

export const WipeMemoryModal: React.FC<WipeMemoryModalProps> = ({
  isOpen,
  onClose,
  onConfirmWipe,
}) => {
  const [resetConfig, setResetConfig] = useState(true);

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
      id="emg-wipe-memory-backdrop"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
    >
      <div
        id="emg-wipe-memory-modal"
        onClick={(e) => e.stopPropagation()}
        className="cyber-card bg-[#070e0a]/95 border border-emerald-500/30 rounded-2xl w-full max-w-lg shadow-[0_16px_48px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 md:p-6 border-b border-emerald-950 bg-[#040805]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-950/80 border border-red-500/30 flex items-center justify-center text-red-400 shrink-0">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                Wipe Memory & Reset
              </h2>
              <p className="text-xs text-zinc-400 font-mono">
                Complete Cache & State Purge
              </p>
            </div>
          </div>

          <button
            id="btn-close-wipe-modal"
            onClick={onClose}
            className="p-2 rounded-xl bg-[#09140c] text-zinc-400 hover:text-white hover:bg-emerald-950 border border-emerald-800/60 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 md:p-6 space-y-4 overflow-y-auto font-sans">
          {/* Warning Banner */}
          <div className="p-4 bg-red-950/30 border border-red-500/30 rounded-xl flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs text-red-200/90 leading-relaxed">
              <p className="font-semibold text-red-200">
                Are you sure you want to wipe memory and reset the engine back to start?
              </p>
              <p className="text-zinc-400 text-[11px]">
                This will empty in-memory caches, stop any active autonomous loops, and restore the engine to baseline.
              </p>
            </div>
          </div>

          {/* Purge Scope Items */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-white uppercase tracking-wider block">
              Purge Scope:
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 bg-[#040805] border border-emerald-950 rounded-xl flex items-center gap-2.5 text-zinc-200">
                <History className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Clear Mutation History</span>
              </div>
              <div className="p-2.5 bg-[#040805] border border-emerald-950 rounded-xl flex items-center gap-2.5 text-zinc-200">
                <Activity className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Zero Latency Stream</span>
              </div>
              <div className="p-2.5 bg-[#040805] border border-emerald-950 rounded-xl flex items-center gap-2.5 text-zinc-200">
                <Layers className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Reset Sandbox Files</span>
              </div>
              <div className="p-2.5 bg-[#040805] border border-emerald-950 rounded-xl flex items-center gap-2.5 text-zinc-200">
                <Ban className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Clear Skip List</span>
              </div>
              <div className="p-2.5 bg-[#040805] border border-emerald-950 rounded-xl flex items-center gap-2.5 text-zinc-200 col-span-1 sm:col-span-2">
                <Database className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Flush Browser Session Storage</span>
              </div>
            </div>
          </div>

          {/* Config Reset Toggle */}
          <div className="p-3 bg-[#040805] border border-emerald-950 rounded-xl flex items-center justify-between">
            <label htmlFor="chk-reset-config" className="flex items-center gap-2.5 text-xs text-zinc-200 cursor-pointer select-none">
              <Sliders className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>
                <span className="font-semibold text-white block">Reset Engine Configuration</span>
                <span className="text-[11px] text-zinc-400">Restore default model and loop interval</span>
              </div>
            </label>
            <input
              id="chk-reset-config"
              type="checkbox"
              checked={resetConfig}
              onChange={(e) => setResetConfig(e.target.checked)}
              className="w-4 h-4 rounded accent-red-600 cursor-pointer shrink-0"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 md:p-6 border-t border-emerald-950 bg-[#040805] flex flex-col sm:flex-row items-center justify-end gap-2.5">
          <button
            id="btn-cancel-wipe"
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 rounded-xl border border-emerald-900/60 bg-[#09140c] hover:bg-emerald-950 text-zinc-300 hover:text-white text-xs font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-emerald-400" />
            <span>Cancel</span>
          </button>

          <button
            id="btn-confirm-wipe"
            type="button"
            onClick={() => {
              onConfirmWipe({ resetConfig });
              onClose();
            }}
            className="w-full sm:w-auto px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-all shadow-md shadow-red-950 flex items-center justify-center gap-2 cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span>Wipe Memory & Reset</span>
          </button>
        </div>
      </div>
    </div>
  );
};
