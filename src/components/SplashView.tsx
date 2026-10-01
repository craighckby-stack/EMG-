/**
 * File: src/components/SplashView.tsx
 * Role: Modern Obsidian & Electric Mint Unified Launch & Dashboard Screen
 */

import React, { useState } from 'react';
import {
  ShieldAlert,
  ExternalLink,
  Scale,
  Sparkles,
  Cpu,
  FileCode2,
  Lock,
  Layers,
  ShieldCheck,
  Activity,
  RefreshCw,
  ArrowRight,
} from 'lucide-react';
import { motion } from 'motion/react';
import { EngineMetrics } from '../types';

interface SplashViewProps {
  onInitialize: () => void;
  onOpenLicense: () => void;
  onRunSingleCycle?: () => void;
  onToggleLive?: () => void;
  isLive?: boolean;
  isCycling?: boolean;
  metrics?: EngineMetrics;
  isSandbox?: boolean;
  hasGhToken?: boolean;
  onOpenDiagnostics?: () => void;
}

export const SplashView: React.FC<SplashViewProps> = ({
  onInitialize,
  onOpenLicense,
  onRunSingleCycle,
  onToggleLive,
  isLive = false,
  isCycling = false,
  metrics = {
    enhancements: 0,
    noops: 0,
    validations: 0,
    retries: 0,
    totalScannedFiles: 4,
    avgLatencyMs: 32,
    tokensProcessed: 0,
    sanitizedSecretsCount: 0,
    syntaxErrorsPrevented: 0,
  },
  isSandbox = true,
  hasGhToken = false,
  onOpenDiagnostics,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'sanitizer' | 'ecosystem'>('overview');

  return (
    <div
      id="emg-splash-container"
      className="min-h-screen bg-[#0B0F14] text-zinc-100 flex flex-col items-center justify-start p-4 sm:p-6 md:p-8 font-sans relative overflow-y-auto selection:bg-[#00F5A0] selection:text-[#0B0F14]"
    >
      {/* Background ambient neon radial glows */}
      <div className="fixed top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-[#00F5A0]/5 rounded-full blur-[140px] pointer-events-none" />
      <div className="fixed bottom-10 right-10 w-[500px] h-[500px] bg-[#1B3A2F]/20 rounded-full blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 15, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-4xl space-y-4 relative z-20 my-auto"
      >
        {/* Top Unified Header & Brand Card */}
        <div className="cyber-card bg-[#0B0F14]/95 border border-[#1B3A2F] p-5 sm:p-6 rounded-2xl shadow-[0_12px_48px_rgba(0,0,0,0.8),0_0_30px_rgba(0,245,160,0.06)] space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#1B3A2F]">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1B3A2F] to-[#0B0F14] border border-[#00F5A0]/40 flex items-center justify-center text-[#00F5A0] shadow-md shadow-black">
                <Cpu className="w-5 h-5 text-[#00F5A0]" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl font-bold tracking-tight text-white leading-tight">
                    EMG
                  </h1>
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-mono text-zinc-300 bg-[#1B3A2F]/60 px-2.5 py-0.5 rounded-md border border-[#1B3A2F]">
                    <span className="w-2 h-2 rounded-full bg-[#00F5A0] shadow-[0_0_8px_rgba(0,245,160,1)] animate-pulse" />
                    ONLINE
                  </span>
                  <span className="inline-flex items-center text-[11px] font-mono text-zinc-300 bg-[#1B3A2F]/60 px-2 py-0.5 rounded-md border border-[#1B3A2F]">
                    {isSandbox ? 'SANDBOX' : 'SECURE'}
                  </span>
                  <button
                    onClick={onOpenLicense}
                    className="inline-flex items-center gap-1 text-[11px] font-mono text-zinc-300 bg-[#1B3A2F]/60 hover:bg-[#1B3A2F] px-2 py-0.5 rounded-md border border-[#1B3A2F] transition-colors cursor-pointer"
                  >
                    <Scale className="w-3 h-3 text-[#00F5A0]" />
                    <span>CC BY-NC-ND 4.0</span>
                  </button>
                </div>
                <p className="text-[10px] text-[#00F5A0] font-mono tracking-wide uppercase mt-0.5">
                  EPHEMERAL MIND GEM
                </p>
                <p className="text-xs text-zinc-300 font-sans mt-1">
                  Autonomous C-Dialect Neural Verification & Refactoring Engine
                </p>
              </div>
            </div>
          </div>

          {/* Navigation Chips & Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  activeTab === 'overview'
                    ? 'bg-[#00F5A0] text-[#0B0F14] shadow-md font-bold'
                    : 'bg-[#1B3A2F]/60 text-zinc-300 hover:text-white border border-[#1B3A2F]'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Architecture</span>
              </button>
              <button
                onClick={() => setActiveTab('sanitizer')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  activeTab === 'sanitizer'
                    ? 'bg-[#00F5A0] text-[#0B0F14] shadow-md font-bold'
                    : 'bg-[#1B3A2F]/60 text-zinc-300 hover:text-white border border-[#1B3A2F]'
                }`}
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Security</span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#00F5A0] animate-pulse" />
              </button>
              <button
                onClick={() => setActiveTab('ecosystem')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  activeTab === 'ecosystem'
                    ? 'bg-[#00F5A0] text-[#0B0F14] shadow-md font-bold'
                    : 'bg-[#1B3A2F]/60 text-zinc-300 hover:text-white border border-[#1B3A2F]'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Ecosystem</span>
              </button>
            </div>

            <div className="flex items-center gap-2.5">
              {onRunSingleCycle && (
                <button
                  onClick={onRunSingleCycle}
                  disabled={isLive || isCycling}
                  className="px-3.5 py-2 rounded-xl bg-[#1B3A2F]/60 hover:bg-[#1B3A2F] disabled:opacity-40 text-zinc-200 hover:text-white border border-[#1B3A2F] text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                  title="Execute a single optimization pass manually"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-[#00F5A0] ${isCycling ? 'animate-spin' : ''}`} />
                  <span>Step</span>
                </button>
              )}
              {onToggleLive ? (
                <button
                  onClick={onToggleLive}
                  className={`px-5 py-2 rounded-xl font-extrabold text-xs uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-lg transform active:scale-95 ${
                    isLive
                      ? 'bg-red-500 text-white hover:bg-red-600 shadow-red-900/50'
                      : 'bg-[#00F5A0] hover:bg-[#00d68f] text-[#0B0F14] shadow-[0_0_20px_rgba(0,245,160,0.35)]'
                  }`}
                >
                  <span>{isLive ? 'Stop Auto' : 'Run Auto'}</span>
                </button>
              ) : (
                <button
                  onClick={onInitialize}
                  className="px-5 py-2 rounded-xl font-extrabold text-xs uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer bg-[#00F5A0] hover:bg-[#00d68f] text-[#0B0F14] shadow-[0_0_20px_rgba(0,245,160,0.35)]"
                >
                  <span>Run Auto</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Main Content Area based on Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-4">
            {/* 6 Core Metric Panels Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 font-sans">
              {/* Mutations */}
              <div className="cyber-card cyber-card-hover p-4 rounded-2xl relative overflow-hidden bg-[#0B0F14]/90 border border-[#1B3A2F]">
                <div className="flex items-center justify-between text-zinc-300 mb-2">
                  <span className="text-xs font-semibold tracking-wide uppercase text-zinc-200">Mutations</span>
                  <div className="p-1.5 rounded-lg bg-[#1B3A2F]/60 border border-[#00F5A0]/30">
                    <Cpu className="w-4 h-4 text-[#00F5A0]" />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-mono">
                  {metrics.enhancements}
                </div>
                <div className="text-[11px] text-zinc-400 mt-1">AST optimizations</div>
              </div>

              {/* Lint Gates */}
              <div className="cyber-card cyber-card-hover p-4 rounded-2xl relative overflow-hidden bg-[#0B0F14]/90 border border-[#1B3A2F]">
                <div className="flex items-center justify-between text-zinc-300 mb-2">
                  <span className="text-xs font-semibold tracking-wide uppercase text-zinc-200">Lint Gates</span>
                  <div className="p-1.5 rounded-lg bg-[#1B3A2F]/60 border border-[#00F5A0]/30">
                    <ShieldAlert className="w-4 h-4 text-[#00F5A0]" />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-mono">
                  {metrics.validations}
                </div>
                <div className="text-[11px] text-zinc-400 mt-1">Active tree checks</div>
              </div>

              {/* Uplink Status */}
              <div
                onClick={onOpenDiagnostics}
                className={`cyber-card cyber-card-hover p-4 rounded-2xl relative overflow-hidden bg-[#0B0F14]/90 border border-[#1B3A2F] ${
                  onOpenDiagnostics ? 'cursor-pointer' : ''
                }`}
              >
                <div className="flex items-center justify-between text-zinc-300 mb-2">
                  <span className="text-xs font-semibold tracking-wide uppercase text-zinc-200">Uplink</span>
                  <div className="p-1.5 rounded-lg bg-[#1B3A2F]/60 border border-[#00F5A0]/30">
                    <ShieldCheck className="w-4 h-4 text-[#00F5A0]" />
                  </div>
                </div>
                <div className="text-lg sm:text-xl font-bold text-white tracking-tight truncate font-mono flex items-center justify-between">
                  <span>{isSandbox ? 'SANDBOX' : hasGhToken ? 'SECURE' : 'PUBLIC'}</span>
                  <span className="text-[#00F5A0] animate-pulse text-sm font-bold">&rarr;</span>
                </div>
                <div className="text-[11px] text-zinc-400 mt-1 flex items-center justify-between">
                  <span>Event bus ok</span>
                  {onOpenDiagnostics && <span className="text-[#00F5A0] font-bold">&rarr;</span>}
                </div>
              </div>

              {/* Tree Depth */}
              <div className="cyber-card cyber-card-hover p-4 rounded-2xl relative overflow-hidden bg-[#0B0F14]/90 border border-[#1B3A2F]">
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
                  <div className="w-2 h-7 bg-[#1B3A2F] rounded-full overflow-hidden flex flex-col justify-end">
                    <div
                      className="w-full bg-[#00F5A0] rounded-full"
                      style={{ height: `${Math.min(100, Math.max(20, (metrics.totalScannedFiles / 10) * 100))}%` }}
                    />
                  </div>
                </div>
                <div className="text-[11px] text-zinc-400 mt-1">Indexed files</div>
              </div>

              {/* Neural Latency */}
              <div className="cyber-card cyber-card-hover p-4 rounded-2xl relative overflow-hidden bg-[#0B0F14]/90 border border-[#1B3A2F]">
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
                  <div className="flex items-end gap-0.5 h-4">
                    <span className="w-1 bg-[#00F5A0] h-2 rounded-full animate-pulse" />
                    <span className="w-1 bg-[#00F5A0] h-4 rounded-full animate-pulse delay-75" />
                    <span className="w-1 bg-[#00F5A0] h-3 rounded-full animate-pulse delay-150" />
                  </div>
                </div>
                <div className="text-[11px] text-zinc-400 mt-1">Stable connection</div>
              </div>

              {/* Tokens Processed */}
              <div className="cyber-card cyber-card-hover p-4 rounded-2xl relative overflow-hidden bg-[#0B0F14]/90 border border-[#1B3A2F]">
                <div className="flex items-center justify-between text-zinc-300 mb-2">
                  <span className="text-xs font-semibold tracking-wide uppercase text-zinc-200">Tokens</span>
                  <div className="p-1.5 rounded-lg bg-[#1B3A2F]/60 border border-[#00F5A0]/30">
                    <Sparkles className="w-4 h-4 text-[#00F5A0]" />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-mono">
                  {metrics.tokensProcessed}
                </div>
                <div className="text-[11px] text-zinc-400 mt-1">Engine usage</div>
              </div>
            </div>

            {/* Pre-Flight Secret & PII Sanitizer Banner Card */}
            <div className="cyber-card bg-[#0B0F14]/95 border border-[#1B3A2F] p-4 sm:p-5 rounded-2xl space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2.5">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="p-2 rounded-lg bg-[#1B3A2F]/80 border border-[#00F5A0]/40 text-[#00F5A0] shrink-0">
                    <ShieldAlert className="w-5 h-5 text-[#00F5A0]" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-white tracking-tight">
                      PRE-FLIGHT SECRET & PII SANITIZER
                    </h3>
                    <span className="text-[11px] text-zinc-400 font-mono block">
                      Git-Secret-PII-Sanitizer-2
                    </span>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#1B3A2F] border border-[#00F5A0]/40 text-[#00F5A0] uppercase tracking-wider shrink-0">
                  Recommended
                </span>
              </div>

              <p className="text-xs text-zinc-300 leading-relaxed">
                Scan and sanitize uncommitted environment variables, private keys, and secrets from your git working tree before submission.
              </p>

              <div className="pt-1 flex flex-wrap items-center justify-between gap-3">
                <a
                  id="btn-open-sanitizer-splash"
                  href="https://ai.studio/apps/57c14614-897c-40cb-a90d-aeff7df60e68"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-4 rounded-xl bg-[#1B3A2F] hover:bg-[#234b3c] text-white border border-[#00F5A0]/40 font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
                >
                  <span>Open Sanitizer in AI Studio</span>
                  <ExternalLink className="w-3.5 h-3.5 text-[#00F5A0]" />
                </a>
              </div>
            </div>

            {/* Enter Workspace Button */}
            <div className="pt-2 flex justify-center">
              <button
                onClick={onInitialize}
                className="px-8 py-3 rounded-xl bg-[#00F5A0] hover:bg-[#00d68f] text-[#0B0F14] font-extrabold text-sm transition-all flex items-center gap-2 cursor-pointer shadow-[0_0_24px_rgba(0,245,160,0.3)]"
              >
                <span>Launch Full Workspace Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: Security */}
        {activeTab === 'sanitizer' && (
          <div className="space-y-4">
            <div className="cyber-card bg-[#0B0F14]/95 border border-[#1B3A2F] p-5 rounded-2xl space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2.5">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="p-2 rounded-lg bg-[#1B3A2F] border border-[#00F5A0]/40 text-[#00F5A0]">
                    <ShieldAlert className="w-5 h-5 text-[#00F5A0]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">
                      Pre-Flight Secret & PII Sanitizer
                    </h3>
                    <span className="text-[11px] text-zinc-400 font-mono">
                      Git-Secret-PII-Sanitizer-2
                    </span>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#1B3A2F] border border-[#00F5A0]/40 text-[#00F5A0] uppercase">
                  Recommended
                </span>
              </div>

              <p className="text-xs text-zinc-300 leading-relaxed">
                Before submitting codebases to neural LLMs or autonomous refactoring loops, scan and sanitize uncommitted environment variables, private keys, authentication tokens, and secrets from your git working tree.
              </p>

              <div className="pt-2 flex flex-wrap items-center gap-3">
                <a
                  href="https://ai.studio/apps/57c14614-897c-40cb-a90d-aeff7df60e68"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2.5 rounded-xl bg-[#00F5A0] hover:bg-[#00d68f] text-[#0B0F14] font-bold text-xs transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-[#00F5A0]/20"
                >
                  <span>Open Sanitizer in AI Studio</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Ecosystem */}
        {activeTab === 'ecosystem' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[420px] overflow-y-auto pr-1">
            <div className="p-4 rounded-xl bg-[#0B0F14] border border-[#1B3A2F] flex flex-col justify-between gap-3 cyber-card-hover">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-xs">Git-Secret-PII-Sanitizer-2</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#1B3A2F] text-[#00F5A0] border border-[#00F5A0]/30">Security</span>
                </div>
                <p className="text-[11px] text-zinc-300 leading-relaxed">Scrub API keys and secrets from git trees before LLM submission.</p>
              </div>
              <a
                href="https://ai.studio/apps/57c14614-897c-40cb-a90d-aeff7df60e68"
                target="_blank"
                rel="noopener noreferrer"
                className="py-2 px-3 rounded-lg bg-[#00F5A0] hover:bg-[#00d68f] text-[#0B0F14] font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
              >
                <span>Open Sanitizer in Studio</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="p-4 rounded-xl bg-[#0B0F14] border border-[#1B3A2F] flex flex-col justify-between gap-3 cyber-card-hover">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-xs">DARLEK CAAN</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#1B3A2F] text-[#00F5A0] border border-[#00F5A0]/30">Command Center</span>
                </div>
                <p className="text-[11px] text-zinc-300 leading-relaxed">Autonomous Code Evolution matrix and distributed AI command platform.</p>
              </div>
              <a
                href="https://ais-pre-amubz4v3czr3772fnvrcru-483535245139.asia-southeast1.run.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="py-2 px-3 rounded-lg bg-[#00F5A0] hover:bg-[#00d68f] text-[#0B0F14] font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
              >
                <span>Launch DARLEK CAAN</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="p-4 rounded-xl bg-[#0B0F14] border border-[#1B3A2F] flex flex-col justify-between gap-3 cyber-card-hover">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-xs">Huxley Singularity Loop</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#1B3A2F] text-cyan-400 border border-cyan-500/30">Neural Loop</span>
                </div>
                <p className="text-[11px] text-zinc-300 leading-relaxed">Recursive self-improving neural loop and autonomous feedback synthesis.</p>
              </div>
              <a
                href="https://ais-pre-km7pxypy7meeld2j6lnyqm-483535245139.asia-southeast1.run.app"
                target="_blank"
                rel="noopener noreferrer"
                className="py-2 px-3 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-black font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
              >
                <span>Launch Singularity Loop</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="p-4 rounded-xl bg-[#0B0F14] border border-[#1B3A2F] flex flex-col justify-between gap-3 cyber-card-hover">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-xs">Darlek Caan vs Jesus Chess</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#1B3A2F] text-cyan-400 border border-cyan-500/30">Chess Arena</span>
                </div>
                <p className="text-[11px] text-zinc-300 leading-relaxed">High-stakes tactical chess tournament duel on Google AI Studio.</p>
              </div>
              <a
                href="https://ai.studio/apps/4f692b1f-527f-4c1d-b423-e2bbe06b2009"
                target="_blank"
                rel="noopener noreferrer"
                className="py-2 px-3 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-black font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
              >
                <span>Play Chess in Studio</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};
