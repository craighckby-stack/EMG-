/**
 * File: src/components/StatsGrid.tsx
 * Role: Modern Black & Emerald Telemetry Metric Cards
 */

import React from 'react';
import { Cpu, ShieldCheck, Activity, FileCode2, Sparkles, ShieldAlert } from 'lucide-react';
import { EngineMetrics } from '../types';

interface StatsGridProps {
  metrics: EngineMetrics;
  isSandbox: boolean;
  hasGhToken: boolean;
  onOpenDiagnostics?: () => void;
}

export const StatsGrid: React.FC<StatsGridProps> = ({
  metrics,
  isSandbox,
  hasGhToken,
  onOpenDiagnostics,
}) => {
  return (
    <div id="emg-stats-grid" className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 font-sans">
      {/* Mutations */}
      <div className="cyber-card cyber-card-hover p-4 sm:p-5 rounded-2xl relative overflow-hidden group bg-[#0B0F14]/90 border border-[#1B3A2F]">
        <div className="flex items-center justify-between text-zinc-300 mb-2">
          <span className="text-xs font-semibold tracking-wide uppercase text-zinc-200">Mutations</span>
          <div className="p-1.5 rounded-lg bg-[#1B3A2F]/60 border border-[#00F5A0]/30">
            <Cpu className="w-4 h-4 text-[#00F5A0]" />
          </div>
        </div>
        <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-baseline gap-2 font-mono">
          <span>{metrics.enhancements}</span>
          {metrics.noops > 0 && (
            <span className="text-xs text-amber-400 font-mono">
              +{metrics.noops} sat
            </span>
          )}
        </div>
        <div className="text-[11px] text-zinc-400 mt-1 truncate">
          {metrics.noops > 0 ? `${metrics.noops} saturated passes` : 'AST optimizations'}
        </div>
      </div>

      {/* Lint Gates */}
      <div className="cyber-card cyber-card-hover p-4 sm:p-5 rounded-2xl relative overflow-hidden group bg-[#0B0F14]/90 border border-[#1B3A2F]">
        <div className="flex items-center justify-between text-zinc-300 mb-2">
          <span className="text-xs font-semibold tracking-wide uppercase text-zinc-200">Lint Gates</span>
          <div className="p-1.5 rounded-lg bg-[#1B3A2F]/60 border border-[#00F5A0]/30">
            <ShieldAlert className="w-4 h-4 text-[#00F5A0]" />
          </div>
        </div>
        <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-baseline gap-2 font-mono">
          <span>{metrics.validations}</span>
          {(metrics.syntaxErrorsPrevented || 0) > 0 && (
            <span className="text-xs text-red-400 font-mono">
              {metrics.syntaxErrorsPrevented} rej
            </span>
          )}
        </div>
        <div className="text-[11px] text-zinc-400 mt-1 truncate">
          {(metrics.syntaxErrorsPrevented || 0) > 0 ? `${metrics.syntaxErrorsPrevented} faults caught` : 'Active tree checks'}
        </div>
      </div>

      {/* Uplink Status */}
      <div
        onClick={onOpenDiagnostics}
        className={`cyber-card cyber-card-hover p-4 sm:p-5 rounded-2xl relative overflow-hidden group bg-[#0B0F14]/90 border border-[#1B3A2F] ${
          onOpenDiagnostics ? 'cursor-pointer' : ''
        }`}
        title={onOpenDiagnostics ? 'Inspect Diagnostics & Uplink' : undefined}
      >
        <div className="flex items-center justify-between text-zinc-300 mb-2">
          <span className="text-xs font-semibold tracking-wide uppercase text-zinc-200">Uplink</span>
          <div className="p-1.5 rounded-lg bg-[#1B3A2F]/60 border border-[#00F5A0]/30 flex items-center justify-center">
            <ShieldCheck className="w-4 h-4 text-[#00F5A0]" />
          </div>
        </div>
        <div className="text-lg sm:text-xl font-bold text-white tracking-tight truncate font-mono flex items-center justify-between">
          <span>{isSandbox ? 'SANDBOX' : hasGhToken ? 'SECURE' : 'PUBLIC'}</span>
          <span className="text-[#00F5A0] animate-pulse text-sm font-bold">&rarr;</span>
        </div>
        <div className="text-[11px] text-zinc-400 mt-1 flex items-center justify-between truncate">
          <span>{(metrics.sanitizedSecretsCount || 0) > 0 ? `${metrics.sanitizedSecretsCount} scrubbed` : 'Event bus online'}</span>
          {onOpenDiagnostics && <span className="text-[11px] text-[#00F5A0] font-bold">&rarr;</span>}
        </div>
      </div>

      {/* Indexed Files / Tree Depth */}
      <div className="cyber-card cyber-card-hover p-4 sm:p-5 rounded-2xl relative overflow-hidden group bg-[#0B0F14]/90 border border-[#1B3A2F]">
        <div className="flex items-center justify-between text-zinc-300 mb-2">
          <span className="text-xs font-semibold tracking-wide uppercase text-zinc-200">Tree Depth</span>
          <div className="p-1.5 rounded-lg bg-[#1B3A2F]/60 border border-[#00F5A0]/30">
            <FileCode2 className="w-4 h-4 text-[#00F5A0]" />
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-mono">
            {metrics.totalScannedFiles}
          </div>
          {/* Vertical progress bar graph */}
          <div className="w-2 h-8 bg-[#1B3A2F] rounded-full overflow-hidden flex flex-col justify-end">
            <div
              className="w-full bg-[#00F5A0] transition-all duration-500 rounded-full"
              style={{ height: `${Math.min(100, Math.max(15, (metrics.totalScannedFiles / 30) * 100))}%` }}
            />
          </div>
        </div>
        <div className="text-[11px] text-zinc-400 mt-1">Indexed files</div>
      </div>

      {/* Neural Latency */}
      <div className="cyber-card cyber-card-hover p-4 sm:p-5 rounded-2xl relative overflow-hidden group bg-[#0B0F14]/90 border border-[#1B3A2F]">
        <div className="flex items-center justify-between text-zinc-300 mb-2">
          <span className="text-xs font-semibold tracking-wide uppercase text-zinc-200">Latency</span>
          <div className="p-1.5 rounded-lg bg-[#1B3A2F]/60 border border-[#00F5A0]/30">
            <Activity className="w-4 h-4 text-[#00F5A0]" />
          </div>
        </div>
        <div className="flex items-baseline justify-between">
          <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-mono">
            {metrics.avgLatencyMs > 0 ? `${metrics.avgLatencyMs}ms` : '32ms'}
          </div>
          {/* Dynamic green signal waveform vector */}
          <div className="flex items-end gap-0.5 h-5">
            <span className="w-1 bg-[#00F5A0] h-2 rounded-full animate-pulse" />
            <span className="w-1 bg-[#00F5A0] h-4 rounded-full animate-pulse delay-75" />
            <span className="w-1 bg-[#00F5A0] h-3 rounded-full animate-pulse delay-150" />
            <span className="w-1 bg-[#00F5A0] h-5 rounded-full animate-pulse delay-200" />
          </div>
        </div>
        <div className="text-[11px] text-zinc-400 mt-1">Inference speed</div>
      </div>

      {/* Tokens Processed */}
      <div className="cyber-card cyber-card-hover p-4 sm:p-5 rounded-2xl relative overflow-hidden group bg-[#0B0F14]/90 border border-[#1B3A2F]">
        <div className="flex items-center justify-between text-zinc-300 mb-2">
          <span className="text-xs font-semibold tracking-wide uppercase text-zinc-200">Tokens</span>
          <div className="p-1.5 rounded-lg bg-[#1B3A2F]/60 border border-[#00F5A0]/30">
            <Sparkles className="w-4 h-4 text-[#00F5A0]" />
          </div>
        </div>
        <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-mono">
          {metrics.tokensProcessed > 1000
            ? `${(metrics.tokensProcessed / 1000).toFixed(1)}k`
            : metrics.tokensProcessed}
        </div>
        <div className="text-[11px] text-zinc-400 mt-1">Total volume</div>
      </div>
    </div>
  );
};

