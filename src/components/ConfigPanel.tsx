/**
 * File: src/components/ConfigPanel.tsx
 * Role: Modern Black & Emerald Tech Engine Configuration Deck
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Sliders,
  Eye,
  EyeOff,
  Github,
  Key,
  Sparkles,
  Shield,
  Gauge,
  Cpu,
  CheckCircle2,
  RefreshCw,
  Search,
  Check,
  FolderGit2,
  AlertTriangle,
  FileText,
  FileCode,
  Layers,
  Ban,
  Plus,
  Trash2,
  X,
  KeyRound,
  ShieldAlert,
  CheckCheck,
  GitBranch,
} from 'lucide-react';
import { EngineConfig, OptimizationGoal, GeminiModelId } from '../types';
import { SANDBOX_REPOSITORIES } from '../utils/mockRepo';
import { fetchServerApiStatus, ServerApiStatus } from '../utils/gemini';
import { fetchUserRepositories, GitHubUserRepo } from '../utils/github';

interface ConfigPanelProps {
  config: EngineConfig;
  onChange: (key: keyof EngineConfig, value: any) => void;
  disabled: boolean;
  onOpenWipeMemory?: () => void;
}

export const ConfigPanel: React.FC<ConfigPanelProps> = ({
  config,
  onChange,
  disabled,
  onOpenWipeMemory,
}) => {
  const [showGhToken, setShowGhToken] = useState(false);
  const [showGeminiKey, setShowGeminiKey] = useState(false);
  const [serverStatus, setServerStatus] = useState<ServerApiStatus | null>(null);

  // GitHub account repositories state
  const [userRepos, setUserRepos] = useState<GitHubUserRepo[]>([]);
  const [isLoadingRepos, setIsLoadingRepos] = useState(false);
  const [repoError, setRepoError] = useState<string | null>(null);
  const [isManualRepoMode, setIsManualRepoMode] = useState(false);
  const [repoSearchFilter, setRepoSearchFilter] = useState('');
  const [manualSkipListInput, setManualSkipListInput] = useState('');

  const skippedFiles = Array.from(new Set(config.skippedFiles || []));

  const handleAddSkipList = (pathToAdd: string) => {
    const trimmed = pathToAdd.trim();
    if (!trimmed) return;
    if (!skippedFiles.includes(trimmed)) {
      onChange('skippedFiles', [...skippedFiles, trimmed]);
    }
    setManualSkipListInput('');
  };

  const handleRemoveSkipList = (pathToRemove: string) => {
    onChange(
      'skippedFiles',
      skippedFiles.filter((p) => p !== pathToRemove)
    );
  };

  const handleClearSkipList = () => {
    onChange('skippedFiles', []);
  };

  useEffect(() => {
    fetchServerApiStatus().then(setServerStatus);
  }, []);

  const loadAccountRepos = useCallback(async (token: string) => {
    if (!token || token.trim().length < 8) {
      setUserRepos([]);
      setRepoError(null);
      return;
    }
    setIsLoadingRepos(true);
    setRepoError(null);
    try {
      const repos = await fetchUserRepositories(token);
      setUserRepos(repos);
      // Auto-select first repo if none selected or using sandbox default
      if (repos.length > 0) {
        const isCurrentValid = repos.some((r) => r.full_name.toLowerCase() === config.targetRepo.toLowerCase());
        if (!isCurrentValid && (!config.targetRepo || config.targetRepo.includes('sovereign-kernel') || config.targetRepo === '')) {
          const firstRepo = repos[0];
          if (firstRepo) {
            onChange('targetRepo', firstRepo.full_name);
            if (firstRepo.default_branch) {
              onChange('branch', firstRepo.default_branch);
            }
          }
        }
      }
    } catch (err: any) {
      setRepoError(err?.message || 'Failed to fetch repositories from GitHub');
    } finally {
      setIsLoadingRepos(false);
    }
  }, [config.targetRepo, onChange]);

  // Trigger repo loading when token changes or live mode activated
  useEffect(() => {
    if (config.isSandboxMode || !config.ghToken || config.ghToken.trim().length < 8) {
      return;
    }
    const timer = setTimeout(() => {
      loadAccountRepos(config.ghToken);
    }, 450);
    return () => clearTimeout(timer);
  }, [config.ghToken, config.isSandboxMode, loadAccountRepos]);

  const sandboxKeys = Object.keys(SANDBOX_REPOSITORIES);

  // Filter repos by search query
  const filteredRepos = userRepos.filter((r) => {
    if (!repoSearchFilter) return true;
    const q = repoSearchFilter.toLowerCase();
    return (
      r.full_name.toLowerCase().includes(q) ||
      (r.description && r.description.toLowerCase().includes(q)) ||
      (r.language && r.language.toLowerCase().includes(q))
    );
  });

  return (
    <div
      id="emg-config-panel"
      className="cyber-card p-5 md:p-6 rounded-2xl flex flex-col gap-5 bg-[#070e0a]/90 shadow-[0_8px_32px_rgba(0,0,0,0.6)]"
    >
      <div className="flex items-center justify-between border-b border-emerald-950 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-emerald-950/80 border border-emerald-500/30 text-emerald-400">
            <Sliders className="w-4 h-4" />
          </div>
          <h2 className="text-sm font-bold text-white tracking-tight">
            Engine Configuration
          </h2>
        </div>

        {/* Sandbox Switcher */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={disabled}
            onClick={() => {
              const next = !config.isSandboxMode;
              onChange('isSandboxMode', next);
              if (next && !SANDBOX_REPOSITORIES[config.targetRepo]) {
                onChange('targetRepo', sandboxKeys[0]);
              }
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border cursor-pointer ${
              config.isSandboxMode
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-sm'
                : 'bg-[#09150d] text-emerald-500/70 border-emerald-900/60 hover:text-emerald-300 hover:border-emerald-700'
            }`}
          >
            {config.isSandboxMode ? 'Sandbox Mode' : 'Live GitHub Mode'}
          </button>
        </div>
      </div>

      <div className="space-y-4 font-sans">
        {/* Model Selection & Auto-Injection Status */}
        <div className="p-4 bg-[#09140c] border border-emerald-500/20 rounded-xl space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-white flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-emerald-400" />
              <span>Gemini AI Model</span>
            </label>
            {serverStatus?.hasServerGeminiKey ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-[10px] font-mono text-emerald-300">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Key Auto-Injected
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-950 border border-emerald-500/30 text-[10px] font-mono text-emerald-400">
                <Sparkles className="w-3 h-3 text-emerald-400" /> Ready
              </span>
            )}
          </div>

          <select
            value={config.model || 'gemini-3.7-flash'}
            disabled={disabled}
            onChange={(e) => onChange('model', e.target.value as GeminiModelId)}
            className="w-full bg-[#050b07] border border-emerald-900/80 rounded-xl p-2.5 text-xs text-white outline-none focus:border-emerald-500 transition-colors font-mono cursor-pointer"
          >
            <option value="gemini-3.7-flash" className="bg-[#050b07] text-white">
              ⚡ Gemini 3.7 Flash — High Performance & Reasoning
            </option>
            <option value="gemini-3.6-flash" className="bg-[#050b07] text-white">
              💨 Gemini 3.6 Flash — Fast, High Efficiency
            </option>
            <option value="gemini-flash-lite-latest" className="bg-[#050b07] text-white">
              🪶 Gemini Flash Lite — Ultra Lightweight
            </option>
            <option value="gemini-2.5-flash" className="bg-[#050b07] text-white">
              🚀 Gemini 2.5 Flash — Stable High-Velocity
            </option>
            <option value="gemini-3.1-pro-preview" className="bg-[#050b07] text-white">
              🧠 Gemini 3.1 Pro — Deep Complex Architecture Reasoning
            </option>
          </select>
          <p className="text-[11px] text-zinc-400 leading-relaxed">
            Requests are proxied securely via the full-stack server with automatic key injection.
          </p>
        </div>

        {/* GitHub Token Input (In Live Mode) */}
        {!config.isSandboxMode && (
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-emerald-400" /> GitHub Token (PAT)
              </label>
              <span className="text-[11px] text-zinc-400 font-mono">repo scope</span>
            </div>
            <div className="relative">
              <input
                id="input-github-token"
                type={showGhToken ? 'text' : 'password'}
                placeholder="ghp_xxxxxxxxxxxx (personal access token)"
                value={config.ghToken}
                disabled={disabled}
                onChange={(e) => onChange('ghToken', e.target.value)}
                className="w-full bg-[#050b07] border border-emerald-900/80 rounded-xl p-2.5 pr-9 text-xs text-white placeholder-zinc-500 outline-none focus:border-emerald-500 transition-colors font-mono"
              />
              <button
                type="button"
                onClick={() => setShowGhToken(!showGhToken)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition-colors cursor-pointer p-0.5"
              >
                {showGhToken ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        )}

        {/* Target Repository Selection */}
        {config.isSandboxMode ? (
          <div>
            <label className="block text-xs font-semibold text-zinc-200 mb-1.5 flex items-center justify-between">
              <span>Sandbox Target Repository</span>
              <span className="text-emerald-300 text-xs font-mono">Built-in Demo</span>
            </label>
            <select
              value={config.targetRepo}
              disabled={disabled}
              onChange={(e) => onChange('targetRepo', e.target.value)}
              className="w-full bg-[#050b07] border border-emerald-900/80 rounded-xl p-2.5 text-xs text-white outline-none focus:border-emerald-500 transition-colors font-mono cursor-pointer"
            >
              {sandboxKeys.map((key) => (
                <option key={key} value={key} className="bg-[#050b07] text-white">
                  {key} — {SANDBOX_REPOSITORIES[key]?.description || ''}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
                <Github className="w-3.5 h-3.5 text-emerald-400" /> Target Repository
              </label>

              <div className="flex items-center gap-2">
                {userRepos.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setIsManualRepoMode(!isManualRepoMode)}
                    className="text-[11px] text-zinc-300 hover:text-white transition-colors cursor-pointer"
                  >
                    {isManualRepoMode ? 'Account Repos' : 'Manual Input'}
                  </button>
                )}
                {config.ghToken && (
                  <button
                    type="button"
                    disabled={isLoadingRepos}
                    onClick={() => loadAccountRepos(config.ghToken)}
                    title="Refresh account repository list"
                    className="text-zinc-400 hover:text-white transition-colors cursor-pointer p-0.5 disabled:opacity-40"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoadingRepos ? 'animate-spin text-emerald-400' : ''}`} />
                  </button>
                )}
              </div>
            </div>

            {/* Loading Indicator */}
            {isLoadingRepos && (
              <div className="p-3 bg-[#050b07] border border-emerald-900 rounded-xl flex items-center gap-2.5 text-xs text-zinc-200 font-mono animate-pulse">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-400 shrink-0" />
                <span>Loading repositories from your GitHub account...</span>
              </div>
            )}

            {/* Error Banner with Retry */}
            {repoError && !isLoadingRepos && (
              <div className="p-2.5 bg-red-950/40 border border-red-500/40 rounded-xl text-xs text-red-300 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 truncate">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-red-400" />
                  <span className="truncate">{repoError}</span>
                </div>
                <button
                  type="button"
                  onClick={() => loadAccountRepos(config.ghToken)}
                  className="text-white bg-red-900/60 px-2 py-0.5 rounded text-[11px] hover:bg-red-800 shrink-0 cursor-pointer"
                >
                  Retry
                </button>
              </div>
            )}

            {/* Account Repos Dropdown View */}
            {!isManualRepoMode && userRepos.length > 0 && !isLoadingRepos ? (
              <div className="space-y-2">
                {userRepos.length > 6 && (
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                    <input
                      type="text"
                      placeholder="Filter repositories..."
                      value={repoSearchFilter}
                      onChange={(e) => setRepoSearchFilter(e.target.value)}
                      className="w-full bg-[#050b07] border border-emerald-900 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-zinc-500 outline-none focus:border-emerald-500 transition-colors font-mono"
                    />
                  </div>
                )}

                <select
                  id="select-account-repositories"
                  value={config.targetRepo}
                  disabled={disabled}
                  onChange={(e) => {
                    const selectedFullName = e.target.value;
                    onChange('targetRepo', selectedFullName);
                    const found = userRepos.find((r) => r.full_name === selectedFullName);
                    if (found && found.default_branch) {
                      onChange('branch', found.default_branch);
                    }
                  }}
                  className="w-full bg-[#050b07] border border-emerald-900/80 rounded-xl p-2.5 text-xs text-white outline-none focus:border-emerald-500 transition-colors font-mono cursor-pointer"
                >
                  {filteredRepos.map((repo) => (
                    <option key={repo.id} value={repo.full_name} className="bg-[#050b07] text-white">
                      {repo.full_name} {repo.private ? '🔒 (Private)' : '🌐 (Public)'} {repo.language ? `• ${repo.language}` : ''}
                    </option>
                  ))}
                </select>

                <div className="flex items-center justify-between text-[11px] text-zinc-400 font-mono px-1">
                  <span className="flex items-center gap-1">
                    <FolderGit2 className="w-3 h-3 text-emerald-400" />
                    {filteredRepos.length} of {userRepos.length} repositories
                  </span>
                  <span className="text-emerald-300 flex items-center gap-1 font-semibold">
                    <Check className="w-3 h-3" /> Account Synced
                  </span>
                </div>
              </div>
            ) : (
              <div>
                <input
                  id="input-target-repo-manual"
                  type="text"
                  placeholder="e.g. username/repo-name"
                  value={config.targetRepo}
                  disabled={disabled}
                  onChange={(e) => onChange('targetRepo', e.target.value)}
                  className="w-full bg-[#050b07] border border-emerald-900/80 rounded-xl p-2.5 text-xs text-white placeholder-zinc-500 outline-none focus:border-emerald-500 transition-colors font-mono"
                />
              </div>
            )}
          </div>
        )}

        {/* Branch Selection */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="input-target-branch" className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
              <GitBranch className="w-3.5 h-3.5 text-emerald-400" /> Target Branch
            </label>
            <span className="text-[11px] text-zinc-400 font-mono">Default: main</span>
          </div>
          <input
            id="input-target-branch"
            type="text"
            placeholder="e.g. main, master, dev"
            value={config.branch || ''}
            disabled={disabled}
            onChange={(e) => onChange('branch', e.target.value)}
            className="w-full bg-[#050b07] border border-emerald-900/80 rounded-xl p-2.5 text-xs text-white placeholder-zinc-500 outline-none focus:border-emerald-500 transition-colors font-mono"
          />
        </div>

        {/* EMG Sovereign Kernel RAG Repository */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="input-emg-repo" className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-[#00F5A0]" /> Sovereign RAG Repository
            </label>
            <span className="text-[10px] text-emerald-400 font-mono">Dedicated RAG Memory</span>
          </div>
          <input
            id="input-emg-repo"
            type="text"
            placeholder="e.g. craighckby-stack/EMG"
            value={config.emgRepo || 'craighckby-stack/EMG'}
            disabled={disabled}
            onChange={(e) => onChange('emgRepo', e.target.value)}
            className="w-full bg-[#050b07] border border-emerald-900/80 rounded-xl p-2.5 text-xs text-white placeholder-zinc-500 outline-none focus:border-[#00F5A0] transition-colors font-mono"
          />
          <p className="text-[10px] text-zinc-400 mt-1">Cross-repo vector memories, clean patterns, and failure ledgers will sync to this repo without contaminating external target code.</p>
        </div>

        {/* Custom Gemini Key Override (Optional) */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" /> Custom API Key Override
            </label>
            <span className="text-[11px] text-zinc-400">
              {serverStatus?.hasServerGeminiKey ? 'Optional (Env Active)' : 'Optional'}
            </span>
          </div>
          <div className="relative">
            <input
              type={showGeminiKey ? 'text' : 'password'}
              placeholder={serverStatus?.hasServerGeminiKey ? 'Using server-side environment key...' : 'AIzaSy...'}
              value={config.geminiKey}
              disabled={disabled}
              onChange={(e) => onChange('geminiKey', e.target.value)}
              className="w-full bg-[#050b07] border border-emerald-900/80 rounded-xl p-2.5 pr-9 text-xs text-white placeholder-zinc-500 outline-none focus:border-emerald-500 transition-colors font-mono"
            />
            <button
              type="button"
              onClick={() => setShowGeminiKey(!showGeminiKey)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition-colors cursor-pointer p-0.5"
            >
              {showGeminiKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Optimization Directive / Goal */}
        <div>
          <label className="block text-xs font-semibold text-zinc-200 mb-1.5">
            Optimization Directive
          </label>
          <select
            value={config.goal}
            disabled={disabled}
            onChange={(e) => onChange('goal', e.target.value as OptimizationGoal)}
            className="w-full bg-[#050b07] border border-emerald-900/80 rounded-xl p-2.5 text-xs text-white outline-none focus:border-emerald-500 transition-colors cursor-pointer font-sans"
          >
            <option value="comprehensive" className="bg-[#050b07]">
              ⚡ Comprehensive (Performance + Security + Quality)
            </option>
            <option value="performance" className="bg-[#050b07]">
              🚀 High-Throughput Performance & Zero-Alloc Memory
            </option>
            <option value="security" className="bg-[#050b07]">
              🛡️ Defensive Bounds & Memory Safety
            </option>
            <option value="type-safety" className="bg-[#050b07]">
              📐 Strict Type Narrowing & Safe Contracts
            </option>
            <option value="readability" className="bg-[#050b07]">
              📖 Clean Architecture & Modern Idioms
            </option>
          </select>
        </div>

        {/* File Target & Scope Filter */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-emerald-400" /> Target File Scope
            </label>
            <span className="text-[11px] font-mono text-zinc-300">
              {config.fileScope === 'markdown-only'
                ? 'Docs Only'
                : config.fileScope === 'specific'
                ? 'Custom File'
                : 'All Files'}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 bg-[#050b07] p-1.5 rounded-xl border border-emerald-900/80">
            <button
              type="button"
              disabled={disabled}
              onClick={() => onChange('fileScope', 'all')}
              className={`py-2 px-2.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                (!config.fileScope || config.fileScope === 'all')
                  ? 'bg-emerald-500 text-black shadow-sm font-bold'
                  : 'text-zinc-300 hover:text-white hover:bg-emerald-950/40'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>All Files</span>
            </button>

            <button
              type="button"
              disabled={disabled}
              onClick={() => onChange('fileScope', 'markdown-only')}
              className={`py-2 px-2.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                config.fileScope === 'markdown-only'
                  ? 'bg-emerald-500 text-black shadow-sm font-bold'
                  : 'text-zinc-300 hover:text-white hover:bg-emerald-950/40'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Docs (.md)</span>
            </button>

            <button
              type="button"
              disabled={disabled}
              onClick={() => {
                onChange('fileScope', 'specific');
                if (!config.specificFilePath) {
                  onChange('specificFilePath', 'README.md');
                }
              }}
              className={`py-2 px-2.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                config.fileScope === 'specific'
                  ? 'bg-emerald-500 text-black shadow-sm font-bold'
                  : 'text-zinc-300 hover:text-white hover:bg-emerald-950/40'
              }`}
            >
              <span>Custom</span>
            </button>
          </div>

          {config.fileScope === 'specific' && (
            <div className="mt-2 space-y-1.5">
              <input
                type="text"
                placeholder="e.g. README.md, src/core/main.c"
                value={config.specificFilePath || ''}
                disabled={disabled}
                onChange={(e) => onChange('specificFilePath', e.target.value)}
                className="w-full bg-[#050b07] border border-emerald-900/80 rounded-xl p-2.5 text-xs text-white placeholder-zinc-500 outline-none focus:border-emerald-500 transition-colors font-mono"
              />
            </div>
          )}
        </div>

        {/* Saturated & Skipped Files Manager */}
        <div className="p-4 bg-[#09140c] border border-emerald-500/20 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-white flex items-center gap-1.5">
              <Ban className="w-3.5 h-3.5 text-amber-400" />
              <span>Saturated & Skipped Files</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-800 text-zinc-300 font-mono">
                {skippedFiles.length}
              </span>
            </label>
            {skippedFiles.length > 0 && (
              <button
                type="button"
                disabled={disabled}
                onClick={handleClearSkipList}
                className="text-xs text-rose-400 hover:text-rose-300 transition-colors cursor-pointer font-medium"
              >
                Clear
              </button>
            )}
          </div>

          {/* Auto-Approve Saturated Toggle */}
          <div className="p-3 bg-[#050b07] border border-emerald-900/80 rounded-xl flex items-center justify-between gap-3">
            <label htmlFor="toggle-auto-approve-saturated" className="flex items-center gap-2.5 cursor-pointer select-none min-w-0">
              <CheckCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <div className="min-w-0">
                <div className="text-xs font-semibold text-white truncate">Auto-Skip Saturated Files</div>
                <div className="text-[11px] text-zinc-400 leading-tight">
                  Automatically skip list 0-diff files without stopping
                </div>
              </div>
            </label>
            <input
              type="checkbox"
              id="toggle-auto-approve-saturated"
              checked={Boolean(config.autoApproveSaturated)}
              disabled={disabled}
              onChange={(e) => onChange('autoApproveSaturated', e.target.checked)}
              className="w-4 h-4 rounded accent-emerald-500 cursor-pointer shrink-0"
            />
          </div>

          {/* Continuous Multi-Pass Mode */}
          <div className="p-3 bg-[#050b07] border border-emerald-900/80 rounded-xl flex items-center justify-between gap-3">
            <label htmlFor="toggle-allow-multi-pass" className="flex items-center gap-2.5 cursor-pointer select-none min-w-0">
              <RefreshCw className="w-4 h-4 text-emerald-400 shrink-0" />
              <div className="min-w-0">
                <div className="text-xs font-semibold text-white truncate">Continuous Multi-Pass Mode</div>
                <div className="text-[11px] text-zinc-400 leading-tight">
                  Keep iterating across files continuously
                </div>
              </div>
            </label>
            <input
              type="checkbox"
              id="toggle-allow-multi-pass"
              checked={Boolean(config.allowMultiPass)}
              disabled={disabled}
              onChange={(e) => onChange('allowMultiPass', e.target.checked)}
              className="w-4 h-4 rounded accent-emerald-500 cursor-pointer shrink-0"
            />
          </div>

          {/* Quick add */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="e.g. README.md, src/types.ts"
              value={manualSkipListInput}
              disabled={disabled}
              onChange={(e) => setManualSkipListInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddSkipList(manualSkipListInput);
                }
              }}
              className="flex-1 bg-[#050b07] border border-emerald-900/80 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 outline-none focus:border-emerald-500 transition-colors font-mono"
            />
            <button
              type="button"
              disabled={disabled || !manualSkipListInput.trim()}
              onClick={() => handleAddSkipList(manualSkipListInput)}
              className="px-3 py-2 rounded-xl bg-emerald-950 hover:bg-emerald-900 border border-emerald-700/60 disabled:opacity-40 text-zinc-200 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>
          </div>

          {/* List of skip listed paths */}
          {skippedFiles.length > 0 && (
            <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1 pt-1">
              {skippedFiles.map((path, idx) => (
                <div
                  key={`skip-${path}-${idx}`}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#050b07] border border-emerald-800/60 text-zinc-200 text-xs font-mono"
                >
                  <span className="truncate max-w-[170px]" title={path}>
                    {path}
                  </span>
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => handleRemoveSkipList(path)}
                    className="p-0.5 text-zinc-400 hover:text-red-400 rounded transition-colors cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Loop Interval Slider */}
        <div className="p-4 bg-[#09140c] border border-emerald-500/20 rounded-xl space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-zinc-200 mb-1.5">
            <span className="flex items-center gap-1.5">
              <Gauge className="w-3.5 h-3.5 text-emerald-400" /> Cycle Frequency
            </span>
            <span className="text-emerald-300 font-bold font-mono">{config.loopIntervalSec}s interval</span>
          </div>
          <input
            type="range"
            min={4}
            max={60}
            step={2}
            value={config.loopIntervalSec}
            disabled={disabled}
            onChange={(e) => onChange('loopIntervalSec', Number(e.target.value))}
            className="w-full accent-emerald-500 cursor-pointer h-2 bg-[#050b07] rounded-lg appearance-none"
          />
          <div className="flex justify-between text-[11px] font-mono text-zinc-400">
            <span>Fast (4s)</span>
            <span>Standard (15s)</span>
            <span>Production (60s)</span>
          </div>
        </div>

        {/* Auto-Sanitizer Guard */}
        <div className="p-3 bg-[#09140c] border border-emerald-500/20 rounded-xl">
          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-emerald-400" /> Auto-Sanitize Secrets & PATs
              </div>
              <div className="text-[11px] text-zinc-400">
                Purge API keys, GitHub tokens & credentials before commit
              </div>
            </div>
            <input
              type="checkbox"
              id="toggle-auto-sanitize"
              checked={config.autoSanitize !== false}
              disabled={disabled}
              onChange={(e) => onChange('autoSanitize', e.target.checked)}
              className="w-4 h-4 rounded accent-emerald-500 cursor-pointer"
            />
          </label>
        </div>

        {/* Strict Type & Syntax Verifier */}
        <div className="p-3 bg-[#09140c] border border-emerald-500/20 rounded-xl">
          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-emerald-400" /> Strict Type & Syntax Verifier
              </div>
              <div className="text-[11px] text-zinc-400">
                Reject broken syntax, unmatched brackets & AST parse errors
              </div>
            </div>
            <input
              type="checkbox"
              id="toggle-strict-typecheck"
              checked={config.strictTypeCheck !== false}
              disabled={disabled}
              onChange={(e) => onChange('strictTypeCheck', e.target.checked)}
              className="w-4 h-4 rounded accent-emerald-500 cursor-pointer"
            />
          </label>
        </div>

        {/* Dry Run Toggle */}
        <div className="p-3 bg-[#09140c] border border-emerald-500/20 rounded-xl">
          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-emerald-400" /> Dry-Run Guard
              </div>
              <div className="text-[11px] text-zinc-400">
                Simulate AST enhancements without remote git push
              </div>
            </div>
            <input
              type="checkbox"
              id="toggle-dry-run"
              checked={config.dryRun}
              disabled={disabled}
              onChange={(e) => onChange('dryRun', e.target.checked)}
              className="w-4 h-4 rounded accent-emerald-500 cursor-pointer"
            />
          </label>
        </div>

        {/* Memory & Cache Purge */}
        {onOpenWipeMemory && (
          <div className="pt-2">
            <div className="p-3.5 bg-red-950/20 border border-red-500/30 rounded-xl flex items-center justify-between gap-3">
              <div>
                <div className="text-xs font-bold text-red-300 flex items-center gap-1.5">
                  <Trash2 className="w-3.5 h-3.5 text-red-400" />
                  <span>Memory & Cache Wipe</span>
                </div>
                <div className="text-[11px] text-zinc-400 mt-0.5">
                  Reset sandbox state, clear memory and fault history
                </div>
              </div>
              <button
                type="button"
                id="btn-config-wipe-memory"
                disabled={disabled}
                onClick={onOpenWipeMemory}
                className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-40 text-white text-xs font-bold transition-all shadow-md shadow-red-950 flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <Trash2 className="w-3 h-3" />
                <span>Reset</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
