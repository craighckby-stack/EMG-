/**
 * File: src/components/SaturationModal.tsx
 * Role: Modern Black & Emerald Saturation Notification Dialog
 */

import React, { useState } from 'react';
import { ShieldAlert, Ban, RotateCcw, X, FileCode2, Sparkles, AlertCircle, CheckCheck } from 'lucide-react';
import { SaturationAlert } from '../types';

interface SaturationModalProps {
  alert: SaturationAlert | null;
  onClose: () => void;
  onAddToSkipList: (path: string, resumeLoop?: boolean, autoApproveFuture?: boolean) => void;
  onKeepInRotation: (resumeLoop?: boolean) => void;
  autoApproveSaturated?: boolean | undefined;
}

export const SaturationModal: React.FC<SaturationModalProps> = ({
  alert,
  onClose,
  onAddToSkipList,
  onKeepInRotation,
  autoApproveSaturated = false,
}) => {
  const [resumeLoop, setResumeLoop] = useState(true);
  const [autoApproveFuture, setAutoApproveFuture] = useState(autoApproveSaturated);

  if (!alert) return null;

  return (
    <div
      id="emg-saturation-backdrop"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
    >
      <div
        id="emg-saturation-modal"
        onClick={(e) => e.stopPropagation()}
        className="cyber-card bg-[#070e0a]/95 border border-emerald-500/30 rounded-2xl w-full max-w-xl shadow-[0_16px_48px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 md:p-6 border-b border-emerald-950 bg-[#040805]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                Neural Saturation Reached
              </h2>
              <p className="text-xs text-zinc-400 font-mono">
                Optimization Equilibrium (0 Diffs)
              </p>
            </div>
          </div>

          <button
            id="btn-close-saturation"
            onClick={onClose}
            className="p-2 rounded-xl bg-[#09140c] text-zinc-400 hover:text-white hover:bg-emerald-950 border border-emerald-800/60 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 md:p-6 space-y-4 overflow-y-auto font-sans">
          {/* Target File Badge */}
          <div className="p-3.5 bg-[#040805] border border-emerald-950 rounded-xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <FileCode2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="text-xs font-mono font-bold text-zinc-200 truncate">
                {alert.path}
              </span>
            </div>
            <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold shrink-0">
              0 Diffs (No-Op)
            </span>
          </div>

          {/* Explanation Banner */}
          <div className="p-4 bg-[#040805] border border-emerald-950 rounded-xl space-y-2 text-xs text-zinc-300 leading-relaxed">
            <div className="flex items-start gap-2 text-zinc-200">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>
                The AI optimization engine analyzed this file and determined that it already achieves optimal efficiency. 
                <strong className="text-white ml-1">No modifications were produced.</strong>
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 pl-6">
              The commit was automatically skipped to prevent redundant empty git commits and conserve API token quota.
            </p>
          </div>

          {/* Decision Prompt */}
          <div className="pt-2">
            <label className="text-xs font-bold text-white block mb-1">
              Skip Decision:
            </label>
            <p className="text-xs text-zinc-400">
              Would you like to add <span className="text-white font-mono font-semibold">{alert.path}</span> to the skip list so subsequent scanning passes skip it?
            </p>
          </div>

          {/* Auto-Approve Saturated Option */}
          <div className="p-3 bg-[#040805] border border-amber-500/30 rounded-xl flex items-center justify-between gap-3">
            <label htmlFor="chk-auto-approve-future" className="flex items-center gap-2.5 text-xs text-amber-300 font-semibold cursor-pointer select-none">
              <CheckCheck className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Auto-approve & skip future saturated files automatically</span>
            </label>
            <input
              id="chk-auto-approve-future"
              type="checkbox"
              checked={autoApproveFuture}
              onChange={(e) => setAutoApproveFuture(e.target.checked)}
              className="w-4 h-4 rounded accent-amber-500 cursor-pointer shrink-0"
            />
          </div>

          {/* Resume Loop Checkbox Option */}
          <div className="p-3 bg-[#040805] border border-emerald-950 rounded-xl flex items-center justify-between">
            <label htmlFor="chk-resume-loop" className="flex items-center gap-2.5 text-xs text-zinc-300 cursor-pointer select-none">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>Resume optimization loop after action</span>
            </label>
            <input
              id="chk-resume-loop"
              type="checkbox"
              checked={resumeLoop}
              onChange={(e) => setResumeLoop(e.target.checked)}
              className="w-4 h-4 rounded accent-emerald-500 cursor-pointer"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 md:p-6 border-t border-emerald-950 bg-[#040805] flex flex-col sm:flex-row items-center justify-end gap-2.5">
          <button
            id="btn-keep-rotation"
            type="button"
            onClick={() => onKeepInRotation(resumeLoop)}
            className="w-full sm:w-auto px-4 py-2 rounded-xl border border-emerald-900/60 bg-[#09140c] hover:bg-emerald-950 text-zinc-300 hover:text-white text-xs font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-emerald-400" />
            <span>Keep in Rotation</span>
          </button>

          <button
            id="btn-add-skiplist"
            type="button"
            onClick={() => onAddToSkipList(alert.path, resumeLoop, autoApproveFuture)}
            className="w-full sm:w-auto px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold transition-all shadow-md shadow-amber-950 flex items-center justify-center gap-2 cursor-pointer"
          >
            <Ban className="w-3.5 h-3.5" />
            <span>Add to Skip List</span>
          </button>
        </div>
      </div>
    </div>
  );
};
