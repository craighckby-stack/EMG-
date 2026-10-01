/**
 * EMG Sovereign Kernel Control and Intelligence Dashboard Component
 * File Path: src/components/SovereignKernelPanel.tsx
 */

import React, { useState, useEffect, useCallback, JSX } from 'react';
import { executeEmgTriLoopCycle, TriLoopCycleResult } from '../engine/tri-loop';
import { queryEmgRag, getAllEmgVectors, publishRagToGithub, VectorEntry } from '../memory/emg_rag';
import { sanitizeAndGovern } from '../governance/sanitizer';
import { playClickSound, playChirpSound } from './SoundEngine';
import { Shield, Brain, Terminal, Activity, CheckCircle, AlertTriangle, Lock, RefreshCw, Zap, Database } from 'lucide-react';

type SubTabType = 'triloop' | 'rag' | 'sanitizer' | 'vectors';

export default function SovereignKernelPanel(): JSX.Element {
  const [activeSubTab, setActiveSubTab] = useState<SubTabType>('triloop');
  const [testFilePath, setTestFilePath] = useState<string>('src/engine/sample.ts');
  const [testCode, setTestCode] = useState<string>(
    `export function calculateScore(a: number, b: number) {\n  const apiKey = "[REDACTED_GEMINI_KEY]";\n  return a + b;\n}`
  );
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [lastCycleResult, setLastCycleResult] = useState<TriLoopCycleResult | null>(null);

  const [ragQueryText, setRagQueryText] = useState<string>('secret leakage');
  const [ragQueryResult, setRagQueryResult] = useState<ReturnType<typeof queryEmgRag> | null>(null);
  const [allVectors, setAllVectors] = useState<VectorEntry[]>([]);
  const [isSyncingRag, setIsSyncingRag] = useState<boolean>(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState<string>('');

  useEffect(() => {
    try {
      setAllVectors(getAllEmgVectors());
    } catch (err: unknown) {
      console.error('Failed to load EMG vectors:', err instanceof Error ? err.message : String(err));
    }
  }, [lastCycleResult]);

  const handleSyncRagToGithub = useCallback(async (): Promise<void> => {
    playClickSound();
    setIsSyncingRag(true);
    setSyncStatusMsg('Pushing vectors & ledgers to craighckby-stack/EMG...');
    try {
      const res = await publishRagToGithub({ emgRepo: 'craighckby-stack/EMG', token: '' });
      if (res.success) {
        setSyncStatusMsg(`Successfully synchronized ${(res.syncedFiles || []).length} RAG ledgers to EMG!`);
      } else {
        setSyncStatusMsg(`Sync error: ${res.error || 'Failed to sync'}`);
      }
    } catch (err: any) {
      setSyncStatusMsg(`Sync failed: ${err?.message || String(err)}`);
    } finally {
      setIsSyncingRag(false);
      setTimeout(() => setSyncStatusMsg(''), 6000);
    }
  }, []);

  const handleRunTriLoop = useCallback(async (): Promise<void> => {
    playChirpSound();
    setIsProcessing(true);
    try {
      const res = await executeEmgTriLoopCycle(testFilePath, testCode, testCode);
      setLastCycleResult(res);
    } catch (err: unknown) {
      console.error('Error executing Tri-Loop cycle:', err instanceof Error ? err.message : String(err));
    } finally {
      setIsProcessing(false);
    }
  }, [testFilePath, testCode]);

  const handleRunRagQuery = useCallback((): void => {
    playClickSound();
    try {
      const res = queryEmgRag(ragQueryText);
      setRagQueryResult(res);
    } catch (err: unknown) {
      console.error('Error executing RAG query:', err instanceof Error ? err.message : String(err));
    }
  }, [ragQueryText]);

  const handleSanitizerCheck = useCallback((): void => {
    try {
      const res = sanitizeAndGovern('test.ts', testCode);
      alert(`Sanitizer Result:\nClean: ${res.clean}\nViolations: ${res.violations.join(', ') || 'None'}`);
    } catch (err: unknown) {
      console.error('Error running sanitizer check:', err instanceof Error ? err.message : String(err));
    }
  }, [testCode]);

  return (
    <div className="w-full flex flex-col gap-6 p-6 bg-[#0B0F14] border border-[#1B3A2F] rounded-3xl text-zinc-100 shadow-2xl">
      {/* Panel Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#1B3A2F]">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-[#00F5A0]/10 border border-[#00F5A0]/30 rounded-2xl text-[#00F5A0]">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-wide text-white flex items-center gap-2">
              EMG SOVEREIGN KERNEL <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-[#00F5A0]/20 text-[#00F5A0] border border-[#00F5A0]/30">v3.0 RAG</span>
            </h2>
            <p className="text-xs text-zinc-400">Self-Stopping Security Engine with Tri-Loop RAG Memory & Ethical Debate Substrate</p>
          </div>
        </div>

        {/* Sub-Tab Selector */}
        <div className="flex items-center gap-2 bg-[#121A22] p-1.5 rounded-2xl border border-[#1B3A2F]">
          <button
            onClick={() => { setActiveSubTab('triloop'); playClickSound(); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeSubTab === 'triloop' ? 'bg-[#00F5A0] text-black font-extrabold' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Tri-Loop Engine</span>
          </button>

          <button
            onClick={() => { setActiveSubTab('rag'); playClickSound(); handleRunRagQuery(); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeSubTab === 'rag' ? 'bg-[#00F5A0] text-black font-extrabold' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Brain className="w-3.5 h-3.5" />
            <span>RAG Query</span>
          </button>

          <button
            onClick={() => { setActiveSubTab('sanitizer'); playClickSound(); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeSubTab === 'sanitizer' ? 'bg-[#00F5A0] text-black font-extrabold' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Sanitizer Gate</span>
          </button>

          <button
            onClick={() => { setActiveSubTab('vectors'); playClickSound(); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeSubTab === 'vectors' ? 'bg-[#00F5A0] text-black font-extrabold' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Vectors Ledger ({allVectors.length})</span>
          </button>
        </div>
      </div>

      {/* Sub-Tab 1: Tri-Loop Engine Runner */}
      {activeSubTab === 'triloop' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Input Config & Runner */}
          <div className="lg:col-span-5 flex flex-col gap-4 bg-[#121A22] p-5 rounded-2xl border border-[#1B3A2F]">
            <h3 className="text-sm font-bold text-[#00F5A0] flex items-center gap-2">
              <Zap className="w-4 h-4" /> Execute Tri-Loop Cycle
            </h3>

            <div>
              <label className="text-xs font-mono text-zinc-400 mb-1 block">Target File Path:</label>
              <input
                type="text"
                value={testFilePath}
                onChange={(e) => setTestFilePath(e.target.value)}
                className="w-full bg-[#0B0F14] border border-[#1B3A2F] rounded-xl px-3 py-2 text-xs font-mono text-zinc-200 focus:outline-none focus:border-[#00F5A0]"
              />
            </div>

            <div>
              <label className="text-xs font-mono text-zinc-400 mb-1 block">Proposed Code Snippet:</label>
              <textarea
                value={testCode}
                onChange={(e) => setTestCode(e.target.value)}
                rows={8}
                className="w-full bg-[#0B0F14] border border-[#1B3A2F] rounded-xl p-3 text-xs font-mono text-zinc-200 focus:outline-none focus:border-[#00F5A0]"
              />
            </div>

            <button
              onClick={handleRunTriLoop}
              disabled={isProcessing}
              className="w-full py-3 bg-[#00F5A0] hover:bg-[#00D088] text-black font-extrabold text-xs rounded-xl shadow-[0_0_15px_rgba(0,245,160,0.3)] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isProcessing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
              <span>RUN TRI-LOOP EVALUATION</span>
            </button>
          </div>

          {/* Results View */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            {lastCycleResult ? (
              <div className="flex flex-col gap-4">
                {/* Decision Banner */}
                <div className={`p-4 rounded-2xl border flex items-center justify-between ${
                  lastCycleResult.debateVerdict.approved
                    ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300'
                    : 'bg-rose-950/40 border-rose-500/50 text-rose-300'
                }`}>
                  <div className="flex items-center gap-3">
                    {lastCycleResult.debateVerdict.approved ? (
                      <CheckCircle className="w-6 h-6 text-emerald-400" />
                    ) : (
                      <AlertTriangle className="w-6 h-6 text-rose-400" />
                    )}
                    <div>
                      <div className="font-bold text-sm">
                        {lastCycleResult.debateVerdict.approved ? 'MUTATION APPROVED BY SOVEREIGN CORE' : 'MUTATION BLOCKED BY EDGE GATEKEEPER'}
                      </div>
                      <div className="text-xs opacity-90">{lastCycleResult.debateVerdict.verdictSummary}</div>
                    </div>
                  </div>
                </div>

                {/* Debate Statements */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Prosecutor */}
                  <div className="p-3.5 bg-rose-950/20 border border-rose-800/40 rounded-xl">
                    <div className="text-xs font-bold text-rose-400 flex items-center gap-1.5 mb-1">
                      <span>{lastCycleResult.debateVerdict.prosecutorStatement.avatar}</span>
                      <span>{lastCycleResult.debateVerdict.prosecutorStatement.speaker}</span>
                      <span className="ml-auto text-[10px] bg-rose-900/60 px-2 py-0.5 rounded-full">
                        Risk: {lastCycleResult.debateVerdict.prosecutorStatement.score}/10
                      </span>
                    </div>
                    <p className="text-xs text-zinc-300 font-mono leading-relaxed">{lastCycleResult.debateVerdict.prosecutorStatement.argument}</p>
                  </div>

                  {/* Defender */}
                  <div className="p-3.5 bg-emerald-950/20 border border-emerald-800/40 rounded-xl">
                    <div className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 mb-1">
                      <span>{lastCycleResult.debateVerdict.defenderStatement.avatar}</span>
                      <span>{lastCycleResult.debateVerdict.defenderStatement.speaker}</span>
                      <span className="ml-auto text-[10px] bg-emerald-900/60 px-2 py-0.5 rounded-full">
                        Benefit: {lastCycleResult.debateVerdict.defenderStatement.score}/10
                      </span>
                    </div>
                    <p className="text-xs text-zinc-300 font-mono leading-relaxed">{lastCycleResult.debateVerdict.defenderStatement.argument}</p>
                  </div>
                </div>

                {/* Execution Log */}
                <div className="p-4 bg-[#121A22] rounded-2xl border border-[#1B3A2F]">
                  <div className="text-xs font-bold text-[#00F5A0] mb-2 flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5" /> Tri-Loop Execution Trace
                  </div>
                  <div className="p-3 bg-[#0B0F14] rounded-xl border border-[#1B3A2F] text-[11px] font-mono text-zinc-300 flex flex-col gap-1 max-h-48 overflow-y-auto">
                    {lastCycleResult.executionLog.map((line, idx) => (
                      <div key={idx} className="leading-tight">{line}</div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center p-8 bg-[#121A22] border border-[#1B3A2F] rounded-2xl text-center text-zinc-500">
                <Shield className="w-10 h-10 mb-2 opacity-40 text-[#00F5A0]" />
                <p className="text-xs">Click "RUN TRI-LOOP EVALUATION" to execute the EMG Sovereign Engine cycle.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sub-Tab 2: RAG Vector Search */}
      {activeSubTab === 'rag' && (
        <div className="flex flex-col gap-4 bg-[#121A22] p-5 rounded-2xl border border-[#1B3A2F]">
          <h3 className="text-sm font-bold text-[#00F5A0] flex items-center gap-2">
            <Brain className="w-4 h-4" /> Vector RAG Search (CORRECT / WRONG / SYNTHESIS)
          </h3>

          <div className="flex gap-2">
            <input
              type="text"
              value={ragQueryText}
              onChange={(e) => setRagQueryText(e.target.value)}
              placeholder="Enter search error, snippet, or class..."
              className="flex-1 bg-[#0B0F14] border border-[#1B3A2F] rounded-xl px-3 py-2 text-xs font-mono text-zinc-200 focus:outline-none focus:border-[#00F5A0]"
            />
            <button
              onClick={handleRunRagQuery}
              className="px-4 py-2 bg-[#00F5A0] text-black font-extrabold text-xs rounded-xl cursor-pointer hover:bg-[#00D088]"
            >
              Search Vectors
            </button>
          </div>

          {ragQueryResult && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
              {/* Top Failures */}
              <div className="p-3.5 bg-rose-950/20 border border-rose-900/40 rounded-xl">
                <div className="text-xs font-bold text-rose-400 mb-2">Top Failures ({ragQueryResult.topFailures.length})</div>
                <div className="flex flex-col gap-2">
                  {ragQueryResult.topFailures.map((entry) => (
                    <div key={entry.id} className="p-2 bg-[#0B0F14] rounded-lg border border-rose-900/30 text-[11px] font-mono text-zinc-300">
                      <div className="text-rose-400 font-bold">{entry.metadata.commitHash} | {entry.metadata.errorClass}</div>
                      <div className="text-[10px] text-zinc-500">{entry.ruleToAvoid || 'No explicit rule'}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Clean Pattern Entries */}
              <div className="p-3.5 bg-emerald-950/20 border border-emerald-900/40 rounded-xl">
                <div className="text-xs font-bold text-emerald-400 mb-2">Top Clean Patterns ({ragQueryResult.topCleanPatterns.length})</div>
                <div className="flex flex-col gap-2">
                  {ragQueryResult.topCleanPatterns.map((entry) => (
                    <div key={entry.id} className="p-2 bg-[#0B0F14] rounded-lg border border-emerald-900/30 text-[11px] font-mono text-zinc-300">
                      <div className="text-emerald-400 font-bold">{entry.metadata.commitHash}</div>
                      <div className="text-[10px] text-zinc-400">{entry.metadata.file || 'Clean Commit'}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Synthesis Entries */}
              <div className="p-3.5 bg-blue-950/20 border border-blue-900/40 rounded-xl">
                <div className="text-xs font-bold text-blue-400 mb-2">Top Synthesis ({ragQueryResult.topSynthesis.length})</div>
                <div className="flex flex-col gap-2">
                  {ragQueryResult.topSynthesis.map((entry) => (
                    <div key={entry.id} className="p-2 bg-[#0B0F14] rounded-lg border border-blue-900/30 text-[11px] font-mono text-zinc-300">
                      <div className="text-blue-400 font-bold">{entry.metadata.description}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Sub-Tab 3: Sanitizer Gate Test */}
      {activeSubTab === 'sanitizer' && (
        <div className="flex flex-col gap-4 bg-[#121A22] p-5 rounded-2xl border border-[#1B3A2F]">
          <h3 className="text-sm font-bold text-[#00F5A0] flex items-center gap-2">
            <Lock className="w-4 h-4" /> Edge Governance Security Sanitizer
          </h3>
          <p className="text-xs text-zinc-400">Blocks HARDCODED_CRED, SECRET_LEAKAGE, PII, and AST_PARSE balance errors.</p>

          <button
            onClick={handleSanitizerCheck}
            className="w-fit px-4 py-2 bg-[#00F5A0] text-black font-extrabold text-xs rounded-xl cursor-pointer hover:bg-[#00D088]"
          >
            Run Instant Sanitizer Check
          </button>
        </div>
      )}

      {/* Sub-Tab 4: Vectors Ledger */}
      {activeSubTab === 'vectors' && (
        <div className="flex flex-col gap-4 bg-[#121A22] p-5 rounded-2xl border border-[#1B3A2F]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-sm font-bold text-[#00F5A0] flex items-center gap-2">
              <Terminal className="w-4 h-4" /> Active Memory Vectors Ledger ({allVectors.length})
            </h3>
            
            <div className="flex items-center gap-3">
              {syncStatusMsg && (
                <span className="text-xs text-emerald-400 font-mono animate-pulse">{syncStatusMsg}</span>
              )}
              <button
                onClick={handleSyncRagToGithub}
                disabled={isSyncingRag}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-500/50 text-[#00F5A0] font-bold text-xs flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                <Database className={`w-3.5 h-3.5 ${isSyncingRag ? 'animate-spin' : ''}`} />
                <span>{isSyncingRag ? 'Syncing...' : 'Sync to GitHub'}</span>
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-2 max-h-80 overflow-y-auto">
            {allVectors.map((v) => (
              <div key={v.id} className="p-3 bg-[#0B0F14] rounded-xl border border-[#1B3A2F] text-xs font-mono flex items-center justify-between">
                <div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold mr-2 ${
                    v.metadata.provenance === 'clean' ? 'bg-emerald-900 text-emerald-300' :
                    v.metadata.provenance === 'failure' ? 'bg-rose-900 text-rose-300' : 'bg-blue-900 text-blue-300'
                  }`}>
                    {v.metadata.provenance.toUpperCase()}
                  </span>
                  <span className="text-zinc-200 font-bold">{v.id}</span>
                </div>
                <div className="text-[10px] text-zinc-500 font-mono">Trust: {v.metadata.trust}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}