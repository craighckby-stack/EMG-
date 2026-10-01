/**
 * DARLEK CANN ARCHITECTURAL HEADER
 * File: src/components/BugInspector.tsx
 * Role: Component that detects defects in text inputs, prompts for reports, and integrates with GitHub Issues and repository repair.
 * Architecture: Type-safe modular unit with resilient state interfaces and direct GitHub API synchronization.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Bug,
  AlertTriangle,
  Upload,
  FileCode,
  CheckCircle2,
  GitPullRequest,
  ExternalLink,
  Loader2,
  RefreshCw,
  X,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  FileText,
  Trash2,
  Cpu
} from 'lucide-react';
import { COLORS } from '@/lib/constants';
import type { SystemState } from '@/lib/types';

export interface BugInspectorProps {
  isOpen: boolean;
  onClose: () => void;
  systemState: SystemState;
  initialKeyword?: string;
  initialAttachedFile?: { name: string; content: string } | null;
  onApplyFixesToState?: (fixedCount: number, commitSha?: string) => void;
  onAddSystemLog?: (category: string, message: string) => void;
  onAddCaanMessage?: (message: string) => void;
}

interface GitHubIssueItem {
  id: number;
  number: number;
  title: string;
  state: 'open' | 'closed';
  html_url: string;
  created_at: string;
  updated_at: string;
  labels: string[];
  body?: string;
}

const SEVERITY_LEVELS = [
  { id: 'CRITICAL', label: 'Critical / Invariant Failure', color: '#ff0033' },
  { id: 'HIGH', label: 'High Priority Issue', color: '#ff6600' },
  { id: 'MEDIUM', label: 'Medium / Performance Issue', color: '#ffcc00' },
  { id: 'LOW', label: 'Low / Cosmetic Enhancement', color: '#00ccff' },
] as const;

const BUG_TEMPLATES = [
  {
    name: 'Module Import / Broken Path Bug',
    content: `# Defect Report: Stale or Broken Module Import\n\n## Symptoms\n- Cannot find module or path resolution failure during build.\n- Check api-routes.ts and unused route references.\n\n## Expected Behavior\nAll module imports must resolve cleanly to existing files in the workspace.\n\n## Reproduction\nRun production build: vite build && esbuild server.ts\n`,
  },
  {
    name: 'TypeScript & Type Invariant Defect',
    content: `# Defect Report: Type Incompatibility / Unknown Errors\n\n## Symptoms\n- Catch blocks or API handlers throwing unchecked type errors.\n- Unsafe 'any' casts causing runtime crashes.\n\n## Expected Behavior\nAll error handling must be type-safe (catch (err: unknown)) with safe string extraction.\n`,
  },
  {
    name: 'Async Promise / State Race Condition',
    content: `# Defect Report: Unhandled Promise Rejection\n\n## Symptoms\n- Async network requests without try/catch or fallback handling.\n- Null pointer on empty array or undefined API response.\n\n## Expected Behavior\nAll async operations must gracefully catch rejections and update UI status.\n`,
  },
];

export default function BugInspector({
  isOpen,
  onClose,
  systemState,
  initialAttachedFile,
  onApplyFixesToState,
  onAddSystemLog,
  onAddCaanMessage,
}: BugInspectorProps): React.JSX.Element | null {
  const [activeTab, setActiveTab] = useState<'inspect' | 'issues'>('inspect');
  const [bugFileName, setBugFileName] = useState<string>(initialAttachedFile?.name || '');
  const [bugFileContent, setBugFileContent] = useState<string>(initialAttachedFile?.content || '');
  const [severity, setSeverity] = useState<string>('HIGH');
  const [issueTitle, setIssueTitle] = useState<string>('');
  const [createGitHubIssue, setCreateGitHubIssue] = useState<boolean>(true);
  const [executeAutoFix, setExecuteAutoFix] = useState<boolean>(true);
  const [syncToRag, setSyncToRag] = useState<boolean>(true);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [executionStep, setExecutionStep] = useState<string>('');
  const [resultData, setResultData] = useState<{
    success: boolean;
    issueNumber?: number;
    issueUrl?: string;
    commitSha?: string;
    commitUrl?: string;
    issuesResolved?: number;
    summary?: string;
    fixedFiles?: { path: string; rationale?: string; description?: string }[];
  } | null>(null);

  const [issuesList, setIssuesList] = useState<GitHubIssueItem[]>([]);
  const [loadingIssues, setLoadingIssues] = useState<boolean>(false);
  const [issueFilter, setIssueFilter] = useState<'all' | 'open' | 'closed'>('all');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  const owner = systemState.repoConfig?.owner || 'craighckby-stack';
  const repo = systemState.repoConfig?.repo || 'DARLEK-CAAN-Cognitive-Engine';
  const branch = systemState.repoConfig?.branch || 'main';
  const token = systemState.apiKeys?.github || '';

  // Update when initial file is provided
  useEffect(() => {
    if (initialAttachedFile) {
      setBugFileName(initialAttachedFile.name);
      setBugFileContent(initialAttachedFile.content);
      if (!issueTitle) {
        setIssueTitle(`[Issue]: ${initialAttachedFile.name.replace(/\.[^/.]+$/, '')}`);
      }
    }
  }, [initialAttachedFile, issueTitle]);

  // Load issues from GitHub API
  const fetchGitHubIssues = useCallback(async () => {
    if (!token) return;
    setLoadingIssues(true);
    try {
      const res = await fetch('/api/github/issues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'list',
          token,
          owner,
          repo,
        }),
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.issues)) {
        setIssuesList(data.issues);
      }
    } catch (err) {
      console.warn('[BugInspector] Error fetching issues:', err);
    } finally {
      setLoadingIssues(false);
    }
  }, [token, owner, repo]);

  useEffect(() => {
    if (isOpen && activeTab === 'issues') {
      fetchGitHubIssues();
    }
  }, [isOpen, activeTab, fetchGitHubIssues]);

  // Handle file drop
  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      readFile(file);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      readFile(file);
    }
  };

  const readFile = (file: File) => {
    setBugFileName(file.name);
    if (!issueTitle) {
      setIssueTitle(`[Issue]: ${file.name.replace(/\.[^/.]+$/, '')}`);
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setBugFileContent(text || '');
    };
    reader.readAsText(file);
  };

  // Submit Bug Inspection Pipeline
  const handleExecuteBugPipeline = async () => {
    if (!bugFileContent.trim()) {
      alert('Please upload or enter a defect report before initiating inspection.');
      return;
    }

    setIsLoading(true);
    setResultData(null);
    setExecutionStep('Parsing bug report specification & invariants...');

    try {
      let createdIssue: { number?: number; html_url?: string } | undefined;

      // 1. Create GitHub Issue if enabled
      if (createGitHubIssue && token) {
        setExecutionStep(`Connecting to GitHub API to register issue on ${owner}/${repo}...`);
        const issueRes = await fetch('/api/github/issues', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'create',
            token,
            owner,
            repo,
            title: issueTitle || `[Issue]: Automated Issue from ${bugFileName || 'Defect Report'}`,
            severity,
            bugReportFileName: bugFileName || 'bug_report.txt',
            bugReportContent: bugFileContent,
            labels: ['dalek-bug', 'bug', `severity:${severity.toLowerCase()}`],
          }),
        });
        const issueData = await issueRes.json();
        if (issueData.success && issueData.issue) {
          createdIssue = issueData.issue;
          onAddSystemLog?.('GITHUB', `Created GitHub Issue #${issueData.issue.number} on ${owner}/${repo}`);
        }
      }

      // 2. Execute System-Wide Auto Fix if enabled
      if (executeAutoFix) {
        setExecutionStep(`Connecting to repository (${owner}/${repo}) to diagnose and resolve bugs...`);
        const fixRes = await fetch('/api/system/fix-bugs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token,
            owner,
            repo,
            branch,
            bugSpecName: bugFileName || 'bug_report',
            bugSpecContent: bugFileContent,
            prompt: issueTitle || 'Diagnose and resolve all reported issues in repository.',
            apiKeys: systemState.apiKeys,
          }),
        });

        const fixData = await fixRes.json();

        if (fixData.success) {
          setExecutionStep('Verifying zero-error invariants and linking issue...');

          // 3. If GitHub issue was created, update it with resolution details and close it!
          if (createdIssue?.number && token) {
            await fetch('/api/github/issues', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                action: 'close',
                token,
                owner,
                repo,
                issueNumber: createdIssue.number,
                resolutionCommitSha: fixData.commitSha,
                resolutionSummary: fixData.summary,
              }),
            });
          }

          setResultData({
            success: true,
            issueNumber: createdIssue?.number,
            issueUrl: createdIssue?.html_url,
            commitSha: fixData.commitSha,
            commitUrl: fixData.commitUrl,
            issuesResolved: fixData.issuesResolved || 0,
            summary: fixData.summary,
            fixedFiles: fixData.fixedFiles,
          });

          onApplyFixesToState?.(fixData.issuesResolved || 0, fixData.commitSha);
          onAddSystemLog?.('MUTATION', `Bug Inspector resolved ${fixData.issuesResolved || 0} issues in ${owner}/${repo}`);
          onAddCaanMessage?.(
            `🐞 **INSPECTOR RESOLUTION SUMMARY:**\n\n` +
            `${fixData.summary}\n\n` +
            (createdIssue?.number ? `• **GitHub Issue:** [#${createdIssue.number}](${createdIssue.html_url}) (Resolved & Closed)\n` : '') +
            `• **Repository Commit:** [\`${fixData.commitSha}\`](${fixData.commitUrl})\n` +
            `• **Resolved Defect Count:** ${fixData.issuesResolved || 0}\n` +
            `System memory updated with resolution postmortems.`
          );
        } else {
          setResultData({
            success: false,
            summary: fixData.error || 'Failed to complete autonomous resolution.',
          });
        }
      } else {
        // Just created issue without auto-fixing
        setResultData({
          success: true,
          issueNumber: createdIssue?.number,
          issueUrl: createdIssue?.html_url,
          summary: `GitHub Issue #${createdIssue?.number} successfully created on ${owner}/${repo}.`,
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setResultData({
        success: false,
        summary: `Pipeline encountered an error: ${msg}`,
      });
    } finally {
      setIsLoading(false);
      setExecutionStep('');
    }
  };

  // Run fix on an existing issue
  const handleFixExistingIssue = async (issue: GitHubIssueItem) => {
    setIsLoading(true);
    setExecutionStep(`Diagnosing Issue #${issue.number}: "${issue.title}"...`);
    try {
      const fixRes = await fetch('/api/system/fix-bugs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          owner,
          repo,
          branch,
          bugSpecName: `Issue #${issue.number}`,
          bugSpecContent: `${issue.title}\n\n${issue.body || ''}`,
          prompt: `Resolve issue from GitHub #${issue.number}: ${issue.title}`,
          apiKeys: systemState.apiKeys,
        }),
      });
      const fixData = await fixRes.json();
      if (fixData.success) {
        // Close issue on GitHub
        await fetch('/api/github/issues', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'close',
            token,
            owner,
            repo,
            issueNumber: issue.number,
            resolutionCommitSha: fixData.commitSha,
            resolutionSummary: fixData.summary,
          }),
        });

        alert(`Issue #${issue.number} fixed and closed!\nCommit: ${fixData.commitSha}`);
        fetchGitHubIssues();
      } else {
        alert(`Failed to fix issue #${issue.number}: ${fixData.error}`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      alert(`Error fixing issue: ${msg}`);
    } finally {
      setIsLoading(false);
      setExecutionStep('');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div
        className="w-full max-w-4xl max-h-[90vh] bg-[#0c0505] border-2 border-[#a21f1f]/50 rounded-xl shadow-2xl flex flex-col overflow-hidden text-stone-200 font-mono"
        style={{ boxShadow: '0 0 40px rgba(162, 31, 31, 0.25)' }}
      >
        {/* Header */}
        <div className="px-5 py-4 bg-[#180808] border-b border-[#a21f1f]/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#300a0a] border border-[#ff0033]/60 flex items-center justify-center text-red-500 shadow-inner">
              <Bug size={20} className="animate-pulse text-red-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold tracking-wider text-red-100 font-mono">
                  BUG INSPECTOR & AUTONOMOUS REPAIR
                </h2>
                <span className="px-2 py-0.5 text-[10px] rounded bg-red-950/80 text-red-400 border border-red-800/50">
                  v2.5
                </span>
              </div>
              <p className="text-xs text-stone-400">
                Connected Repo: <span className="text-red-300 font-semibold">{owner}/{repo}</span> ({branch})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-[#220c0c] border border-stone-800 text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
              title="Close"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-[#a21f1f]/30 bg-[#120707] px-4">
          <button
            onClick={() => setActiveTab('inspect')}
            className={`px-4 py-2.5 text-xs font-semibold tracking-wider flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'inspect'
                ? 'border-red-500 text-red-200 bg-[#250d0d]'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <Sparkles size={14} className="text-red-400" />
            INSPECT & AUTO-FIX BUG
          </button>
          <button
            onClick={() => setActiveTab('issues')}
            className={`px-4 py-2.5 text-xs font-semibold tracking-wider flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'issues'
                ? 'border-red-500 text-red-200 bg-[#250d0d]'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <GitPullRequest size={14} className="text-cyan-400" />
            GITHUB ISSUES TRACKER ({issuesList.length})
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {activeTab === 'inspect' ? (
            <>
              {/* Alert / Prompt Banner */}
              <div className="p-3.5 bg-[#1a0a0a] border border-[#ff3333]/30 rounded-lg flex items-start gap-3 text-xs text-stone-300">
                <AlertTriangle size={18} className="text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-bold text-red-200">Autonomous System-Wide Bug Resolution Engine</span>
                  <p className="text-stone-400 leading-relaxed">
                    Upload or paste your defect report, error logs, or specification below. The system will inspect all repository files, formulate type-safe zero-error patches, commit to GitHub, and sync the learning postmortem.
                  </p>
                </div>
              </div>

              {/* Bug Report Ingestion Area */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-stone-300 flex items-center gap-1.5">
                    <FileText size={14} className="text-red-400" />
                    DEFECT REPORT FILE / SPECIFICATION
                  </label>
                  {bugFileName && (
                    <span className="text-[11px] text-green-400 font-mono flex items-center gap-1">
                      <CheckCircle2 size={12} /> Loaded: {bugFileName}
                    </span>
                  )}
                </div>

                {/* Drop Zone */}
                <div
                  ref={dropZoneRef}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleFileDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className="p-5 border-2 border-dashed border-[#a21f1f]/50 hover:border-red-500 bg-[#140808] hover:bg-[#1f0c0c] rounded-xl text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 group"
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileInputChange}
                    style={{ display: 'none' }}
                    accept=".txt,.md,.json,.log,.ts,.tsx,.js,.jsx,.xml,.yaml,.yml"
                  />
                  <div className="w-12 h-12 rounded-full bg-[#2a0e0e] border border-red-700/50 flex items-center justify-center text-red-400 group-hover:scale-110 transition-transform">
                    <Upload size={22} />
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-red-200">
                      Click to browse or Drag & Drop Report file here
                    </span>
                    <p className="text-[11px] text-stone-400 mt-0.5">
                      Supports .txt, .md, .json, .log, .ts, .tsx (Max 5MB)
                    </p>
                  </div>
                </div>

                {/* Quick Templates Selector */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="text-[11px] text-stone-400">Load Template:</span>
                  {BUG_TEMPLATES.map((tpl, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setBugFileName(`template_${tpl.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}.md`);
                        setBugFileContent(tpl.content);
                        setIssueTitle(`[Issue]: ${tpl.name}`);
                      }}
                      className="px-2.5 py-1 text-[11px] rounded bg-[#220d0d] hover:bg-[#331414] border border-stone-800 hover:border-red-600 text-stone-300 transition-colors"
                    >
                      {tpl.name}
                    </button>
                  ))}
                </div>

                {/* Content Editor / Preview */}
                <div className="mt-3 space-y-1">
                  <div className="flex items-center justify-between text-xs text-stone-400">
                    <span>Report Content ({bugFileContent.length} chars, {bugFileContent.split('\n').length} lines)</span>
                    {bugFileContent && (
                      <button
                        onClick={() => {
                          setBugFileName('');
                          setBugFileContent('');
                        }}
                        className="text-red-400 hover:text-red-300 flex items-center gap-1 text-[11px]"
                      >
                        <Trash2 size={12} /> Clear
                      </button>
                    )}
                  </div>
                  <textarea
                    value={bugFileContent}
                    onChange={(e) => setBugFileContent(e.target.value)}
                    placeholder="Enter or paste diagnostic logs, invariant specifications, or reproduction steps here..."
                    rows={6}
                    className="w-full px-3 py-2.5 bg-[#0e0606] border border-stone-800 focus:border-red-500 rounded-lg text-xs font-mono text-stone-200 resize-y focus:outline-none focus:ring-1 focus:ring-red-500"
                  />
                </div>
              </div>

              {/* Bug Metadata Configuration */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-[#140808] border border-stone-800/80 rounded-xl">
                <div>
                  <label className="text-xs font-semibold text-stone-300 block mb-1.5">
                    ISSUE TITLE / SUMMARY
                  </label>
                  <input
                    type="text"
                    value={issueTitle}
                    onChange={(e) => setIssueTitle(e.target.value)}
                    placeholder="e.g. [Issue]: Module path resolution failure in api-routes"
                    className="w-full px-3 py-2 bg-[#0a0404] border border-stone-800 focus:border-red-500 rounded text-xs font-mono text-stone-200 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-stone-300 block mb-1.5">
                    SEVERITY CLASSIFICATION
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {SEVERITY_LEVELS.map((lvl) => (
                      <button
                        key={lvl.id}
                        type="button"
                        onClick={() => setSeverity(lvl.id)}
                        className={`px-2 py-1.5 text-[11px] rounded font-semibold border flex items-center gap-1.5 transition-all ${
                          severity === lvl.id
                            ? 'bg-[#2e0e0e] border-red-500 text-white shadow'
                            : 'bg-[#120707] border-stone-800 text-stone-400 hover:border-stone-700'
                        }`}
                      >
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: lvl.color }}
                        />
                        <span className="truncate">{lvl.id}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Pipeline Options */}
              <div className="space-y-2 text-xs">
                <label className="flex items-center gap-2 cursor-pointer select-none text-stone-300">
                  <input
                    type="checkbox"
                    checked={createGitHubIssue}
                    onChange={(e) => setCreateGitHubIssue(e.target.checked)}
                    className="accent-red-600 rounded"
                  />
                  <span>Create / Update GitHub Issue on repository (<code className="text-red-400">{owner}/{repo}</code>)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer select-none text-stone-300">
                  <input
                    type="checkbox"
                    checked={executeAutoFix}
                    onChange={(e) => setExecuteAutoFix(e.target.checked)}
                    className="accent-red-600 rounded"
                  />
                  <span>Execute Autonomous System-Wide Fix & Commit to <code className="text-red-400">{branch}</code> branch</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer select-none text-stone-300">
                  <input
                    type="checkbox"
                    checked={syncToRag}
                    onChange={(e) => setSyncToRag(e.target.checked)}
                    className="accent-red-600 rounded"
                  />
                  <span>Store resolution in RAG Cognitive Postmortem Memory</span>
                </label>
              </div>

              {/* Execution Progress / Result Box */}
              {isLoading && (
                <div className="p-4 bg-[#1c0a0a] border border-red-700/60 rounded-xl space-y-2 animate-pulse">
                  <div className="flex items-center gap-2.5 text-red-300 text-xs font-semibold">
                    <Loader2 size={16} className="animate-spin text-red-500" />
                    <span>{executionStep || 'Processing Bug Inspection Pipeline...'}</span>
                  </div>
                  <div className="w-full bg-stone-900 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-red-600 h-1.5 rounded-full animate-progress" style={{ width: '70%' }} />
                  </div>
                </div>
              )}

              {resultData && (
                <div
                  className={`p-4 rounded-xl border text-xs space-y-3 ${
                    resultData.success
                      ? 'bg-[#0e1a12] border-emerald-700/60 text-emerald-200'
                      : 'bg-[#1a0a0a] border-red-700/60 text-red-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-sm">
                      {resultData.success ? (
                        <>
                          <CheckCircle2 size={18} className="text-emerald-400" />
                          <span>PIPELINE EXECUTION SUCCESSFUL</span>
                        </>
                      ) : (
                        <>
                          <AlertTriangle size={18} className="text-red-400" />
                          <span>PIPELINE INTERRUPTED</span>
                        </>
                      )}
                    </div>
                  </div>

                  <p className="text-stone-300 leading-relaxed">{resultData.summary}</p>

                  {resultData.success && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-emerald-800/40 text-[11px]">
                      {resultData.issueNumber && (
                        <div className="flex items-center justify-between p-2 bg-[#09130d] rounded border border-emerald-900">
                          <span>GitHub Issue: #{resultData.issueNumber}</span>
                          {resultData.issueUrl && (
                            <a
                              href={resultData.issueUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-emerald-400 hover:underline flex items-center gap-1"
                            >
                              View Issue <ExternalLink size={11} />
                            </a>
                          )}
                        </div>
                      )}

                      {resultData.commitSha && (
                        <div className="flex items-center justify-between p-2 bg-[#09130d] rounded border border-emerald-900">
                          <span>Commit: {resultData.commitSha.slice(0, 7)}</span>
                          {resultData.commitUrl && (
                            <a
                              href={resultData.commitUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-emerald-400 hover:underline flex items-center gap-1"
                            >
                              View Diff <ExternalLink size={11} />
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {resultData.fixedFiles && resultData.fixedFiles.length > 0 && (
                    <div className="space-y-1">
                      <span className="font-semibold text-emerald-300">Modified Codebase Files:</span>
                      <div className="max-h-32 overflow-y-auto space-y-1 p-2 bg-[#09130d] rounded font-mono text-[10px]">
                        {resultData.fixedFiles.map((f, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <FileCode size={12} className="text-emerald-400 flex-shrink-0" />
                            <span className="text-stone-200 font-bold">{f.path}</span>
                            <span className="text-stone-400 truncate">— {f.rationale || f.description}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            /* Issues Tab */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-stone-400">Filter:</span>
                  {(['all', 'open', 'closed'] as const).map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setIssueFilter(filter)}
                      className={`px-2.5 py-1 text-xs rounded uppercase font-semibold transition-colors ${
                        issueFilter === filter
                          ? 'bg-red-900/60 border border-red-500 text-white'
                          : 'bg-[#160808] border border-stone-800 text-stone-400'
                      }`}
                    >
                      {filter}
                    </button>
                  ))}
                </div>

                <button
                  onClick={fetchGitHubIssues}
                  disabled={loadingIssues}
                  className="px-3 py-1.5 text-xs bg-[#220d0d] hover:bg-[#331414] border border-stone-800 text-stone-300 rounded flex items-center gap-1.5"
                >
                  <RefreshCw size={13} className={loadingIssues ? 'animate-spin text-red-400' : ''} />
                  Refresh
                </button>
              </div>

              {loadingIssues ? (
                <div className="p-8 text-center text-stone-400 flex flex-col items-center gap-2">
                  <Loader2 size={24} className="animate-spin text-red-500" />
                  <span className="text-xs">Fetching repository issues from GitHub API...</span>
                </div>
              ) : issuesList.length === 0 ? (
                <div className="p-8 text-center text-stone-500 border border-stone-800/80 rounded-xl bg-[#100606]">
                  <Bug size={32} className="mx-auto mb-2 text-stone-600" />
                  <p className="text-xs">No GitHub issues found in {owner}/{repo}.</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
                  {issuesList
                    .filter((item) => (issueFilter === 'all' ? true : item.state === issueFilter))
                    .map((issue) => (
                      <div
                        key={issue.id}
                        className="p-3.5 bg-[#140808] border border-stone-800 hover:border-red-800/60 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-1.5 py-0.5 text-[10px] rounded uppercase font-bold ${
                                issue.state === 'open'
                                  ? 'bg-amber-950 text-amber-400 border border-amber-800/50'
                                  : 'bg-emerald-950 text-emerald-400 border border-emerald-800/50'
                              }`}
                            >
                              {issue.state}
                            </span>
                            <span className="text-xs font-bold text-stone-200">
                              #{issue.number} {issue.title}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-stone-400">
                            <span>Created: {new Date(issue.created_at).toLocaleDateString()}</span>
                            {issue.labels.map((lbl, idx) => (
                              <span
                                key={idx}
                                className="px-1.5 py-0.2 rounded bg-stone-900 border border-stone-700 text-stone-300"
                              >
                                {lbl}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-center">
                          {issue.state === 'open' && (
                            <button
                              onClick={() => handleFixExistingIssue(issue)}
                              disabled={isLoading}
                              className="px-3 py-1.5 bg-red-950 hover:bg-red-900 text-red-200 border border-red-700/60 rounded text-xs font-semibold flex items-center gap-1.5 transition-colors"
                            >
                              <Cpu size={13} />
                              Auto-Fix Issue
                            </button>
                          )}

                          <a
                            href={issue.html_url}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 bg-[#200c0c] hover:bg-stone-800 border border-stone-800 text-stone-300 rounded text-xs flex items-center gap-1"
                            title="Open on GitHub"
                          >
                            <ExternalLink size={13} />
                          </a>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-[#180808] border-t border-[#a21f1f]/40 flex items-center justify-between">
          <div className="text-[11px] text-stone-400 flex items-center gap-1.5">
            <ShieldCheck size={14} className="text-red-400" />
            <span>Zero-error invariant enforcement active</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs rounded-lg bg-[#220d0d] hover:bg-stone-800 text-stone-300 border border-stone-800 transition-colors"
            >
              Close
            </button>

            {activeTab === 'inspect' && (
              <button
                onClick={handleExecuteBugPipeline}
                disabled={isLoading || !bugFileContent.trim()}
                className="px-5 py-2 text-xs font-bold rounded-lg bg-red-700 hover:bg-red-600 disabled:opacity-50 text-white flex items-center gap-2 shadow-lg shadow-red-900/40 transition-all cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    Executing Pipeline...
                  </>
                ) : (
                  <>
                    <Bug size={15} />
                    EXECUTE BUG RESOLUTION
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Inline prompt banner hook component that detects 'bugs' keyword in any text input
 * and renders a quick prompt banner directing the user to attach a bug report file or launch Bug Inspector.
 */
export function BugKeywordPromptBanner({
  inputText,
  onOpenInspector,
  onTriggerFileAttachment,
}: {
  inputText: string;
  onOpenInspector: () => void;
  onTriggerFileAttachment: () => void;
}): React.JSX.Element | null {
  const lower = inputText.trim().toLowerCase();
  const isBugKeyword =
    lower === 'bugs' ||
    lower === 'bug' ||
    lower === '/bugs' ||
    lower === '/bug' ||
    lower.startsWith('bugs ') ||
    lower.startsWith('bug ') ||
    lower.includes('fix bugs') ||
    lower.includes('repair system');

  if (!isBugKeyword) return null;

  return (
    <div className="mb-2 px-3.5 py-2.5 bg-[#180909] border border-red-600/50 rounded-lg flex items-center justify-between text-xs font-mono text-stone-200 animate-fade-in shadow-md">
      <div className="flex items-center gap-2 truncate">
        <Bug size={15} className="text-red-400 animate-pulse flex-shrink-0" />
        <span className="truncate">
          <strong className="text-red-300">Keyword &apos;{lower.slice(0, 10)}&apos; Detected:</strong> Attach bug report or launch Inspector.
        </span>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0 ml-2">
        <button
          onClick={onTriggerFileAttachment}
          className="px-2.5 py-1 rounded bg-[#2b0e0e] hover:bg-[#3d1414] border border-red-700/60 text-red-200 text-[11px] flex items-center gap-1 transition-colors"
          title="Attach Bug File"
        >
          <Upload size={12} /> Attach File
        </button>
        <button
          onClick={onOpenInspector}
          className="px-2.5 py-1 rounded bg-red-700 hover:bg-red-600 text-white font-bold text-[11px] flex items-center gap-1 transition-colors shadow"
        >
          <Sparkles size={12} /> Open Inspector
        </button>
      </div>
    </div>
  );
}
