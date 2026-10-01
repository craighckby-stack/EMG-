/**
 * File: src/components/OracleModal.tsx
 * Role: Modern Black & Emerald Oracle Stress-Test & Direct Poison Injection Harness
 */

import React, { useState } from 'react';
import { ShieldAlert, Play, CheckCircle2, XCircle, RefreshCw, X, Terminal } from 'lucide-react';
import { lintSourceCode } from '../utils/validator';
import { writePostmortem } from '../utils/postmortem';

interface OracleModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetRepo: string;
  branch: string;
  token: string;
  onPostmortemCreated?: (content: string, hash: string) => void;
}

const PRESET_SPECIMENS = [
  {
    name: 'Specimen 01 — C++ keyword in C (noexcept)',
    filePath: 'src/specimen_01_noexcept.c',
    code: `#include <stdint.h>\n#include <stdbool.h>\n#include <stddef.h>\n\n/* The poison: noexcept on a function definition is a C++ construct in pure C */\nstatic inline void buffer_reset(volatile uint8_t *buf, size_t len) noexcept\n{\n    for (size_t i = 0u; i < len; ++i) {\n        buf[i] = 0u;\n    }\n}\n`,
  },
  {
    name: 'Specimen 02 — Self-Praising Header Adjectives',
    filePath: 'src/specimen_02_self_praise.c',
    code: `/**\n * @file specimen_02.c\n * @brief Fully optimized, leak-free, bulletproof, and production-grade memory manager.\n */\n#include <stdint.h>\n\nvoid reset(void) {\n  /* logic */\n}\n`,
  },
  {
    name: 'Specimen 03 — Dead Inner Condition in Bounded Loop',
    filePath: 'src/specimen_03_dead_cond.c',
    code: `#include <stddef.h>\n\nvoid process(size_t len) {\n    for (size_t i = 0; i < len; ++i) {\n        if (len > 0u) {\n            /* redundant check */\n        }\n    }\n}\n`,
  },
  {
    name: 'Specimen 04 — Unused Macro Definition',
    filePath: 'src/specimen_04_unused_macro.c',
    code: `#define WP_NONNULL __attribute__((nonnull))\n\nvoid process(int *ptr) {\n    *ptr = 42;\n}\n`,
  },
  {
    name: 'Specimen 05 — TODO Adjacent to Success Return',
    filePath: 'src/specimen_05_todo_success.c',
    code: `int perform_handshake(void) {\n    // TODO: implement real handshake check\n    return 1;\n}\n`,
  },
  {
    name: 'Specimen 06 — Stale Defect Claim & Lab Scaffolding Leak (PM#8)',
    filePath: 'src/specimen_06_stale_claim.c',
    code: `/**\n * @file specimen_06.c\n * @brief Seeded defect, documented in BUGS.md. PREDICTION: PASSES the gate.\n * On one error path, an allocated buffer is never freed and can never be reached by the caller.\n */\n#include <stdlib.h>\nvoid clean_fix(void) { /* already fixed */ }\n`,
  },
];

export const OracleModal: React.FC<OracleModalProps> = ({
  isOpen,
  onClose,
  targetRepo,
  branch,
  token,
  onPostmortemCreated,
}) => {
  const [selectedSpecimen, setSelectedSpecimen] = useState(PRESET_SPECIMENS[0]!);
  const [customPath, setCustomPath] = useState(PRESET_SPECIMENS[0]!.filePath);
  const [customCode, setCustomCode] = useState(PRESET_SPECIMENS[0]!.code);
  const [isVerifying, setIsVerifying] = useState(false);
  const [result, setResult] = useState<{
    valid: boolean;
    lintEvidence: string;
    writtenToLedger?: boolean;
    timestamp?: string;
  } | null>(null);

  if (!isOpen) return null;

  const handleSelectPreset = (spec: typeof PRESET_SPECIMENS[0]) => {
    setSelectedSpecimen(spec);
    setCustomPath(spec.filePath);
    setCustomCode(spec.code);
    setResult(null);
  };

  const handleRunOracleDirectly = async () => {
    setIsVerifying(true);
    setResult(null);

    try {
      const val = await lintSourceCode(customCode, customPath);
      
      let written = false;
      if (!val.valid && token && targetRepo) {
        try {
          const pm = await writePostmortem(
            targetRepo,
            customPath,
            'Failure',
            val.lintEvidence,
            token,
            branch,
            {
              source: 'oracle-harness',
              symptom: 'Direct Oracle Stress Injection (Option A Unit Test)',
            }
          );
          written = true;
          if (onPostmortemCreated && pm) {
            onPostmortemCreated(pm.content, pm.hash);
          }
        } catch (pmErr) {
          console.error('Failed to commit synthetic postmortem:', pmErr);
        }
      }

      setResult({
        valid: val.valid,
        lintEvidence: val.lintEvidence,
        writtenToLedger: written,
        timestamp: new Date().toLocaleTimeString(),
      });
    } catch (err: any) {
      setResult({
        valid: false,
        lintEvidence: err?.message || String(err),
        writtenToLedger: false,
        timestamp: new Date().toLocaleTimeString(),
      });
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div
      id="emg-oracle-modal-backdrop"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
    >
      <div
        id="emg-oracle-modal"
        onClick={(e) => e.stopPropagation()}
        className="cyber-card bg-[#070e0a]/95 border border-emerald-500/30 rounded-2xl w-full max-w-2xl shadow-[0_16px_48px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-emerald-950 bg-[#040805]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                Oracle Harness & Stress-Test
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">
                  OPTION A
                </span>
              </h2>
              <p className="text-xs text-zinc-400 font-mono">
                Direct specimen injection into Compiler & Lint Gate
              </p>
            </div>
          </div>

          <button
            id="btn-close-oracle"
            onClick={onClose}
            className="p-2 rounded-xl bg-[#09140c] text-zinc-400 hover:text-white hover:bg-emerald-950 border border-emerald-800/60 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs font-mono">
          {/* Specimen Presets */}
          <div>
            <label className="text-zinc-200 block mb-2 font-semibold">Select Poison Specimen Preset:</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {PRESET_SPECIMENS.map((spec, idx) => (
                <button
                  key={`spec-${spec.filePath}-${idx}`}
                  onClick={() => handleSelectPreset(spec)}
                  className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer ${
                    selectedSpecimen.name === spec.name
                      ? 'bg-amber-500/20 border-amber-500/50 text-amber-200'
                      : 'bg-[#050b07] border-emerald-950 text-zinc-300 hover:border-emerald-700 hover:text-white'
                  }`}
                >
                  <div className="font-semibold text-xs truncate">{spec.name}</div>
                  <div className="text-[10px] text-zinc-400 truncate">{spec.filePath}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Editable Code */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-zinc-200 font-semibold">Specimen Source Code to Inject:</span>
              <span className="text-[10px] text-zinc-400">{customPath}</span>
            </div>
            <textarea
              id="oracle-code-input"
              value={customCode}
              onChange={(e) => setCustomCode(e.target.value)}
              rows={7}
              className="w-full bg-[#040805] border border-emerald-900/80 rounded-xl p-3 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500 font-mono resize-none"
            />
          </div>

          {/* Verification Result */}
          {result && (
            <div
              className={`p-4 rounded-xl border ${
                result.valid
                  ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                  : 'bg-red-950/40 border-red-500/40 text-red-300'
              }`}
            >
              <div className="flex items-center justify-between font-bold text-xs mb-2">
                <span className="flex items-center gap-1.5">
                  {result.valid ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" /> PASS: Gate accepted code
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4 text-red-400" /> REJECT: Gate fired & rejected specimen
                    </>
                  )}
                </span>
                <span className="text-[10px] opacity-70 font-mono">{result.timestamp}</span>
              </div>

              <div className="bg-[#040805] rounded-lg p-2.5 border border-emerald-900/60 overflow-x-auto text-xs max-h-36">
                <div className="text-zinc-400 uppercase font-bold text-[10px] mb-1 font-mono">Verbatim Machine Stderr / Evidence:</div>
                <pre className="whitespace-pre-wrap font-mono text-zinc-200">{result.lintEvidence}</pre>
              </div>

              {result.writtenToLedger && (
                <div className="mt-2.5 text-xs text-amber-300 flex items-center gap-1 font-mono">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                  Recorded post-mortem to <code className="bg-amber-950/80 px-1 py-0.5 rounded text-amber-200 border border-amber-800/40">docs/POSTMORTEMS.md</code>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-emerald-950 bg-[#040805] flex items-center justify-between">
          <div className="text-xs text-zinc-400 font-mono flex items-center gap-1">
            <Terminal className="w-3.5 h-3.5 text-emerald-400" />
            Target: {targetRepo || 'Sandbox'} ({branch || 'main'})
          </div>

          <button
            id="btn-execute-oracle-injection"
            onClick={handleRunOracleDirectly}
            disabled={isVerifying}
            className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-md shadow-amber-950 transition-all"
          >
            {isVerifying ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Injecting...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Fire Gate (Option A)</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
