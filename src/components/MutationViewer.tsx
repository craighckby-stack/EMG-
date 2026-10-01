/**
 * File: src/components/MutationViewer.tsx
 * Role: Modern Black & Emerald Mutation Event Journal
 */

import React from 'react';
import { GitCommit, Eye, FileCode2, CheckCircle2, AlertTriangle, KeyRound, Ban } from 'lucide-react';
import { MutationRecord } from '../types';

export interface MutationViewerProps {
  mutations: MutationRecord[];
  onSelectRecord: (record: MutationRecord) => void;
}

export const MutationViewer: React.FC<MutationViewerProps> = ({
  mutations,
  onSelectRecord,
}) => {
  return (
    <div
      id="emg-mutations-panel"
      className="cyber-card p-5 md:p-6 rounded-2xl flex flex-col gap-4 bg-[#070e0a]/80 shadow-[0_8px_32px_rgba(0,0,0,0.5)]"
    >
      <div className="flex items-center justify-between border-b border-emerald-950 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-emerald-950/80 border border-emerald-500/30 text-emerald-400">
            <GitCommit className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-white tracking-tight">
            Mutation Journal
          </h3>
        </div>
        <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-emerald-950 border border-emerald-500/30 text-emerald-400">
          {mutations.length} {mutations.length === 1 ? 'Record' : 'Records'}
        </span>
      </div>

      {mutations.length === 0 ? (
        <div className="py-12 text-center text-xs text-zinc-400 font-sans flex flex-col items-center justify-center gap-2.5 rounded-xl border border-dashed border-emerald-900/60 bg-[#050b07]">
          <FileCode2 className="w-7 h-7 text-emerald-700/80" />
          <span className="text-zinc-200 font-semibold">No active mutation records in ledger</span>
          <span className="text-[11px] text-zinc-400">Engage engine with Run Auto or execute a manual Step pass</span>
        </div>
      ) : (
        <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
          {mutations.map((mut, idx) => {
            const isFailed = mut.status === 'failed';
            const isNoop = mut.status === 'noop';
            const isApplied = mut.status === 'applied';

            return (
              <div
                key={mut.id || `mut-${mut.path}-${idx}`}
                onClick={() => onSelectRecord(mut)}
                className={`p-3.5 rounded-xl bg-[#09120b] hover:bg-[#0d1a10] border transition-all cursor-pointer flex items-center justify-between gap-3 group cyber-card-hover ${
                  isFailed
                    ? 'border-red-500/40 hover:border-red-400/80'
                    : isNoop
                    ? 'border-amber-500/40 hover:border-amber-400/80'
                    : 'border-emerald-500/20 hover:border-emerald-500/50'
                }`}
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div
                    className={`w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 ${
                      isFailed
                        ? 'bg-red-950/60 border-red-500/50 text-red-400'
                        : isNoop
                        ? 'bg-amber-950/60 border-amber-500/50 text-amber-400'
                        : 'bg-emerald-950/60 border-emerald-500/50 text-emerald-400'
                    }`}
                  >
                    {isFailed ? (
                      <AlertTriangle className="w-4 h-4" />
                    ) : isNoop ? (
                      <Ban className="w-4 h-4" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-mono font-bold text-white group-hover:text-emerald-300 transition-colors truncate">
                      {mut.path}
                    </div>
                    <div className="text-[11px] font-mono text-zinc-400 flex items-center gap-2 mt-1 flex-wrap">
                      <span>{mut.timestamp}</span>
                      <span>&bull;</span>
                      <span className="text-amber-300">{mut.latencyMs}ms</span>
                      <span>&bull;</span>
                      <span className="text-zinc-200">
                        {mut.originalLines}L &rarr; {mut.optimizedLines}L
                      </span>
                      {(mut.redactedCount || 0) > 0 && (
                        <>
                          <span>&bull;</span>
                          <span className="text-emerald-300 font-semibold flex items-center gap-1">
                            <KeyRound className="w-3 h-3" />
                            {mut.redactedCount} scrubbed
                          </span>
                        </>
                      )}
                      {mut.validationErrors && mut.validationErrors.length > 0 && (
                        <>
                          <span>&bull;</span>
                          <span className="text-red-300 font-semibold">
                            {mut.validationErrors.length} type err
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase border ${
                      isApplied
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        : isFailed
                        ? 'bg-red-500/20 text-red-300 border-red-500/40'
                        : isNoop
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                    }`}
                  >
                    {mut.status}
                  </span>
                  <div className="p-1.5 rounded-lg bg-[#0a170f] group-hover:bg-emerald-500 group-hover:text-black text-emerald-400 border border-emerald-800/60 transition-colors">
                    <Eye className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};