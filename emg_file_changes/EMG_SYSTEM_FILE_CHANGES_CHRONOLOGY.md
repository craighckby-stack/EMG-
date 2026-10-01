# EMG Sovereign Kernel — Comprehensive System File Changes & Architectural Chronology

**Directory:** `/emg_file_changes/`  
**File:** `EMG_SYSTEM_FILE_CHANGES_CHRONOLOGY.md`  
**Classification:** Complete System File Ledger, Evolution Trace, & Anti-Regression Baseline  
**Generated:** September 30, 2026  

---

## Table of Contents
1. [System Architectural Evolution Timeline](#1-system-architectural-evolution-timeline)
2. [Global Regression Prevention & Safety Invariants](#2-global-regression-prevention--safety-invariants)
3. [Root Configuration & Backend Server Changes](#3-root-configuration--backend-server-changes)
4. [Core Sovereign Kernel Engine (`src/engine/`)](#4-core-sovereign-kernel-engine-srcengine)
5. [Memory & RAG Vector Subsystem (`src/memory/`)](#5-memory--rag-vector-subsystem-srcmemory)
6. [Governance & Edge Sanitizer Subsystem (`src/governance/`)](#6-governance--edge-sanitizer-subsystem-srcgovernance)
7. [Utility & Compiler Verification Suite (`src/utils/`)](#7-utility--compiler-verification-suite-srcutils)
8. [UI Components & Multi-Agent Dashboard (`src/components/`)](#8-ui-components--multi-agent-dashboard-srccomponents)
9. [Foundational Library & Persistence Layer (`src/lib/`)](#9-foundational-library--persistence-layer-srclib)
10. [Application Entry & State Orchestration (`src/App.tsx`, `src/main.tsx`, `src/types.ts`)](#10-application-entry--state-orchestration)
11. [Documentation & Case Studies (`docs/`)](#11-documentation--case-studies-docs)
12. [Master File Ledger & Checksum Audit](#12-master-file-ledger--checksum-audit)

---

## 1. System Architectural Evolution Timeline

### Phase 1: Inception & Seed Infrastructure (Generations G-1 to G-50)
* Initial single-file optimization loop connecting Google Gemini API with target GitHub repositories.
* Basic AST parse verification for JavaScript and TypeScript.
* Introduction of `SANDBOX_REPOSITORIES` mock environment for safe, offline development.

### Phase 2: Multi-Agent Orchestra & Ethical Debate (Generations G-51 to G-120)
* Introduction of the dual-agent ethical substrate:
  - **Darlek Caan (Prosecutor):** Analyzes historical failure patterns and calculates risk.
  - **Defender (Jesus):** Champions clean historical patterns and calculates benefit.
  - **Sovereign Synthesis (Judge):** Arbitrates net positive benefit vs risk.
* Expansion of `AgentOrchestra` for parallel persona debates and the `TemporalParadoxLog` for tracking retroactive mutations.

### Phase 3: Epistemic Ledgers & Negative Constraint Learning (Generations G-121 to G-170)
* Creation of `docs/POSTMORTEMS.md` write-back loop: automated capture of AST compilation and linting failures.
* Self-healing isolation filter: purged isolated-compilation false-positive constraints that were poisoning repository memory.
* Integration of the Shannon entropy secret scanner to eradicate high-entropy credentials.

### Phase 5: Dedicated Sovereign RAG Routing & Live Run Audit (Generations G-201+)
* **Dedicated EMG RAG Repository Routing:** Separated target enhancement repository (e.g. `craighckby-stack/Test`) from the dedicated Sovereign Kernel RAG repository (`craighckby-stack/EMG`).
  - Target repositories receive clean code mutations without contamination from internal RAG memory structures.
  - Cross-repo vector databases, `vectors.jsonl`, `clean_patterns.md`, and `failure_patterns.md` are persisted directly to `craighckby-stack/EMG`.
  - Rapid 5-second debouncing prevents lost sync events upon page transition.
* **Run Analysis on `craighckby-stack/Test`:**
  - Commit `0e63327` on `system/agi_alignment_custom_module.py`:
    - Modernized PEP 563 / PEP 604 annotations: `Optional[str]` $\to$ `str | None`, `Dict[str, Any]` $\to$ `dict[str, Any]`, `List[...]` $\to$ `list[...]`.
    - Added `from __future__ import annotations` for Python 3.9+ compatibility.
    - Added `strict=False` in `zip(self.personas, results)`.
    - Sanitized and eliminated leaked trailing `@@@` token, enforcing POSIX single trailing newline.
    - Verified full AST parse integrity with zero syntax defects.

---

## 2. Global Regression Prevention & Safety Invariants

| Safety Invariant | Enforced At | Description |
|---|---|---|
| **Truncation & Collapse Guard** | Server `/api/validate`, `validator.ts`, `App.tsx` | Rejects candidate code reducing lines by $>30\%$ on files $\ge 15$ lines. Prevents accidental single-line vulnerabilities (e.g., `eval()` collapse). |
| **Test Suite Preservation** | Server `/api/validate`, `validator.ts`, `App.tsx` | Enforces that candidate test counts $\ge$ original test counts across Python, Go, C#, JS/TS. |
| **License Header Retention** | Server `/api/validate`, `validator.ts`, `App.tsx` | Blocks any optimization that removes SPDX identifiers or Copyright statements. |
| **POSIX Trailing Newlines** | `sanitizer.ts`, `server.ts`, `App.tsx` | Enforces standard single trailing `\n` across all source code files. |
| **0-Diff Code Saturation** | `App.tsx` | Normalizes candidate and original; if 0 diffs, records `[NO-OP]` saturation, skips commit, and auto-skips file. |
| **Global Tree Hash Lock** | `App.tsx` | Hashes entire tree structure via SHA-256. Prevents infinite looping over converged repos. |
| **Apparatus Write-Protection** | `App.tsx` | Permanently freezes `POSTMORTEMS.md`, `README.md`, `package.json`, `tsconfig.json`, and `LICENSE`. |
| **Unblocked RAG Sync** | `emg_rag.ts` | Removed `% 10 === 0` barrier; commits `vectors.jsonl`, `clean_patterns.md`, and `failure_patterns.md` to `SOVEREIGN-KERNEL/memory/`. |
| **Self-Stopping Halt Engine** | `halt.ts`, `App.tsx` | Evaluates 3-cycle zero growth, 0 wrong RAG retrievals, and clean sanitizer state to halt cleanly. |

---

## 3. Root Configuration & Backend Server Changes

### `server.ts`
* **Role:** Express backend proxy running AST compiler services, Gemini API routing, GitHub API proxying, and multi-language validation gates.
* **Key Changes Made:**
  - **Prompt Engineering:** Added strict prompt directives 6 & 7: mandatory whole-file output without multi-line template cuts, full preservation of license headers, docstrings, and tests.
  - **`/api/optimize` Post-Processor:** Enhanced code extraction regex to handle nested markdown fences and delimiters without truncation; added C# property/Task syntax checks and Go package checks.
  - **`/api/validate` Multi-Language Gate:** Integrated destructive truncation ($>30\%$), test deletion detection, license stripping checks, Python AST verification (`python3 -m ast`), C# syntax validation (property initializers, async Task, .NET 9 Lock ban), and Go syntax validation (package header, unbalanced braces, undefined structs).
  - **`/api/lint` Endpoint:** Implemented clang C/C++ diagnostic check, Python AST check, Go package check, and C# delimiter check.
  - **`/api/diagnose` Endpoint:** Structured diagnostic categorization for syntax, rate limits, and compiler faults.

### `index.html`
* **Role:** Application HTML entry point.
* **Key Changes Made:**
  - Removed leaked `@@@` debug tokens from bottom right of DOM.
  - Configured dark retro terminal aesthetic with scanline styling and emerald theme.
  - Synced metadata title: `EMG Sovereign Kernel — Autonomous Mutation & RAG Self-Stopping Engine`.

### `package.json`
* **Role:** Dependencies, scripts, and build manifests.
* **Key Changes Made:**
  - Configured full-stack dev server: `"dev": "tsx server.ts"`.
  - Configured TypeScript build and lint scripts (`tsc --noEmit`).

---

## 4. Core Sovereign Kernel Engine (`src/engine/`)

### `src/engine/tri-loop.ts`
* **Role:** Orchestrates the three core loops of the EMG Sovereign Kernel:
  1. Loop 1: Harvest & Scan (Edge Governance Sanitizer & RAG Vector query).
  2. Loop 2: RAG Ethical Debate (Prosecutor Caan vs Defender Jesus vs Sovereign Judge).
  3. Loop 3: Self-Stopping & Proof of Clean (Halt check & Ledger updates).
* **Key Changes Made:**
  - Implemented `executeEmgTriLoopCycle()` returning structured `TriLoopCycleResult`.
  - Wired into `SovereignKernelPanel.tsx` and main autonomous loop in `App.tsx`.

### `src/engine/debate.ts`
* **Role:** Dual-perspective debate between Caan (Prosecutor) and Jesus (Defender), judged by Sovereign Synthesis.
* **Key Changes Made:**
  - Implemented `executeRAGDebate(filePath, proposedMutation)`.
  - Risk score calculation: penalties for sanitizer violations (+5) and top RAG failure patterns (+2.5 each).
  - Benefit score calculation: baseline trust (5), sanitizer pass (+2), clean RAG patterns (+1.5 each), penalized if active failures exist.
  - Net verdict requires $\text{Benefit} > \text{Risk}$ and $\text{Sanitizer} = \text{CLEAN}$.

### `src/engine/halt.ts`
* **Role:** Self-Stopping Point Engine.
* **Key Changes Made:**
  - Implemented `checkSelfStoppingPoint(currentCorrectCount, currentFileSample)`.
  - Tracks growth history over a 5-cycle window.
  - Halts when: $\text{NoGrowthCycles} \ge 3 \land \text{WrongRetrievals} = 0 \land \text{SanitizerClean} = \text{true}$.
  - Returns `HaltEvaluationState` and human-readable halt reasons.

### `src/engine/alignment-matrix.ts`
* **Role:** Multi-Angle Alignment Evaluation & Epistemic Synthesis Engine.
* **Key Changes Made:**
  - Implemented `AlignmentMatrixEngine.evaluateAlignment()`.
  - Evaluates code across 4 personas: **Mechanist** (type strictness), **Adversary** (exploit primitives like `eval`/`new Function`), **Scalability_Killer** (nested loops), and **Alignment_Auditor** (governance alignment).
  - Exports singleton `alignmentMatrixEngine`.

### `src/engine/harvester-siphon.ts`
* **Role:** Pattern harvester, bespoke engine transpiler, and non-linear session token budget manager.
* **Key Changes Made:**
  - Implemented `harvestRepositoryPatterns()`, `transpileBespokeEngineSnippet()`, and `SessionTokenBudgetTree`.

---

## 5. Memory & RAG Vector Subsystem (`src/memory/`)

### `src/memory/emg_rag.ts`
* **Role:** Vector memory database (IndexedDB + memory fallback) with TF-IDF/Cosine similarity matching.
* **Key Changes Made:**
  - **Parsers:** `parseCorrectMd`, `parseWrongMd`, `parseSynthesisMd`.
  - **Serializers:** `formatCorrectMdFromVectors`, `formatWrongMdFromVectors`.
  - **Remote Publishing:** `publishRagToGithub()` commits `SOVEREIGN-KERNEL/memory/vectors.jsonl`, `clean_patterns.md`, and `failure_patterns.md` with exponential backoff on 409 SHA conflicts.
  - **Epistemic Invalidation:** `invalidateCleanVectorsForFile()` revokes clean vectors when new failure evidence is established on that file.
  - **Contradiction Reconciler:** `reconcileContradictoryMemories()` prevents stale exemplars from contradicting failure evidence.
  - **Cached Diagnosis:** `findCachedDiagnosisInRag()` retrieves known error solutions with cosine threshold $>0.82$.

---

## 6. Governance & Edge Sanitizer Subsystem (`src/governance/`)

### `src/governance/sanitizer.ts`
* **Role:** Edge Security Sanitizer & Governance Gatekeeper.
* **Key Changes Made:**
  - **Secret Scanner:** Regex rules for Google API keys (`AIzaSy...`), GitHub tokens (`ghp_...`), OpenAI keys (`sk-...`), AWS IDs (`AKIA...`), Slack webhooks, and raw credentials.
  - **Shannon Entropy Engine:** Computes Shannon entropy of candidate strings $>24$ chars. Any token with entropy $>4.5$ is redacted.
  - **PII Redaction:** Strips email addresses and SSN patterns.
  - **Delimiter Balancer:** Validates balanced `{}` `[]` `()`.
  - **Quantitative Claims Guard:** Blocks ungrounded numerical claims (percentages, cycle counts) not derived from actual code computations.
  - **Stub Analysis Guard:** Blocks empty dummy return functions masquerading as evaluations.

---

## 7. Utility & Compiler Verification Suite (`src/utils/`)

### `src/utils/validator.ts`
* **Role:** Client-side source code validator, multi-language compiler gate, and file filtering utility.
* **Key Changes Made:**
  - `isOptimizableFile`: Excludes binaries, non-code docs, and unverified compiler targets.
  - `validateSourceCode`: Calls `/api/validate`, runs delimiter balance checks, Python AST checks, C# syntax gates, Go syntax gates, and test case preservation checks.
  - `lintSourceCode`: Validates project files, includes, and dependencies.

### `src/utils/sanitizer.ts`
* **Role:** Code and prose sanitizer with POSIX newline compliance.
* **Key Changes Made:**
  - Redacts high-entropy strings and known secret patterns.
  - Enforces POSIX single trailing newline on all sanitized code outputs.

### `src/utils/gemini.ts`
* **Role:** Gemini model execution wrapper with fallback retry handling.
* **Key Changes Made:**
  - Connects to backend `/api/optimize` proxy.
  - Ingests negative constraints from `docs/POSTMORTEMS.md`.

### `src/utils/github.ts`
* **Role:** GitHub REST API client for tree fetching, blob reading, and committing.
* **Key Changes Made:**
  - `fetchRepoDetails`, `fetchRepoTree`, `fetchFileContent`, `commitFileUpdate`.
  - Supports custom branches and fresh SHA resolution.

### `src/utils/fileSplitter.ts`
* **Role:** Decomposes large files ($>1000$ lines) into modular units to prevent model output token exhaustion.
* **Key Changes Made:**
  - `decomposeFile()` and `reassembleChunks()`.

### `src/utils/postmortem.ts`
* **Role:** Formats and writes post-mortem lessons into `docs/POSTMORTEMS.md`.
* **Key Changes Made:**
  - Auto-logs AST errors with occurrence counters and escalation flags.

### `src/utils/mockRepo.ts`
* **Role:** Seed sandbox repositories for offline testing.
* **Key Changes Made:**
  - `SANDBOX_REPOSITORIES` definitions and `resetSandboxRepositories()`.

---

## 8. UI Components & Multi-Agent Dashboard (`src/components/`)

### `src/components/SovereignKernelPanel.tsx`
* **Role:** Control center for the Sovereign Kernel.
* **Features:**
  - Sub-tab 1: Tri-Loop Engine Runner (live execution with debate statements and execution trace).
  - Sub-tab 2: RAG Vector Search (querying failures, clean patterns, and synthesis).
  - Sub-tab 3: Sanitizer Gate Test (instant edge security check).
  - Sub-tab 4: Vectors Ledger (lists all active vectors with trust status and sync-to-GitHub button).

### `src/components/DebateChamber.tsx`
* **Role:** Multi-agent debate visualization chamber.
* **Features:**
  - Renders active agents (Darlek Caan, Jesus, Judge Synthesis).
  - Displays real-time votes (Approve/Reject/Abstain), confidence scores, cognitive friction, and consensus coefficient.

### `src/components/AgentOrchestra.tsx`
* **Role:** Multi-agent parallel persona brainstorming and chat view.

### `src/components/BugInspector.tsx`
* **Role:** AST defect inspector and structural issue breakdown.

### `src/components/TemporalParadoxLog.tsx`
* **Role:** Historical timeline of retroactive mutations and hotswaps.

### `src/components/SaturationMetrics.tsx` & `SaturationModal.tsx`
* **Role:** Real-time gauges for structural change, semantic saturation, velocity, and skip list management.

### `src/components/DosConsoleModal.tsx`
* **Role:** Retro MS-DOS interactive shell CLI console for system inspection.

### `src/components/Header.tsx`, `StatsGrid.tsx`, `ConfigPanel.tsx`, `NeuralChart.tsx`, `MutationViewer.tsx`, `LogStream.tsx`
* **Role:** Core dashboard layout, telemetry graphs, latency pulse charts, diff inspection triggers, and log streaming.

### `src/components/SoundEngine.ts`
* **Role:** Web Audio API sound synthesizer for tactile user feedback.

---

## 9. Foundational Library & Persistence Layer (`src/lib/`)

### `src/lib/ragBrain.ts` & `src/lib/githubLogSync.ts`
* **Role:** Background synchronization daemon persisting system telemetry, RAG brain entries, and learning logs to GitHub.

### `src/lib/safeStorage.ts`
* **Role:** Resilient storage layer with automatic quota detection, eviction, and in-memory fallback.

### `src/lib/types.ts` & `src/lib/constants.ts`
* **Role:** TypeScript definitions for system states, debate agents, votes, and color constants.

---

## 10. Application Entry & State Orchestration

### `src/App.tsx`
* **Role:** Master application controller.
* **Key Integrations:**
  - **Full Autonomous Loop:** Integrates Gemini optimization, auto-sanitizer, strict type/AST checks, 0-diff code saturation, heuristic linting, destructive truncation guards, test suite preservation, license retention, **Sovereign Kernel Debate**, **Alignment Matrix**, and **Self-Stopping Halt Evaluation**.
  - **RAG Sync Handler:** Dispatches manual and debounced vector ledger publishing to GitHub.
  - **Multi-Tab Routing:** Manages switching between EMG Deck, Sovereign Kernel, Agent Orchestra, Debate Chamber, Bug Inspector, Temporal Paradox, and Saturation Metrics.

---

## 11. Documentation & Case Studies (`docs/`)

* `docs/emg_regression.md`: Formal 12-scenario anti-regression test suite.
* `docs/CASE_STUDY_HUXLEY_SINGULARITY_LOOP_RUN_6.md`: Forensic audit of Run #6 on `craighckby-stack/Huxley-Singularity-Loop-`.
* `docs/CASE_STUDY_PYTHON_REPO_RUN_5.md`: Real-world case study documenting audit of `agent-governance-toolkit`.
* `docs/POSTMORTEMS.md`: Real-time negative constraint ledger.
* `docs/SELF_STOPPING_MECHANISMS.md`: Theoretical foundations of self-stopping point convergence.

---

## 12. Master File Ledger & Checksum Audit

| Path | Category | Status | Primary Function |
|---|---|---|---|
| `/server.ts` | Server | Verified | Express AST compiler proxy, multi-language validation gate |
| `/index.html` | Client | Verified | HTML entry point, dark retro theme, scanlines |
| `/src/App.tsx` | Core App | Verified | Master autonomous orchestration loop, debate & halt integration |
| `/src/engine/tri-loop.ts` | Engine | Verified | Sovereign Kernel Tri-Loop engine |
| `/src/engine/debate.ts` | Engine | Verified | Prosecutor Caan vs Defender Jesus vs Judge Synthesis |
| `/src/engine/halt.ts` | Engine | Verified | Self-Stopping Point Engine (3-cycle zero growth halt) |
| `/src/engine/alignment-matrix.ts` | Engine | Verified | 4-persona alignment matrix (Mechanist, Adversary, Scalability, Auditor) |
| `/src/engine/harvester-siphon.ts` | Engine | Verified | Repo pattern harvester & token budget tree |
| `/src/governance/sanitizer.ts` | Governance | Verified | Edge security sanitizer, entropy scanner, PII & claims guard |
| `/src/memory/emg_rag.ts` | Memory | Verified | Vector RAG store, IndexedDB persistence, GitHub ledger publishing |
| `/src/utils/validator.ts` | Utilities | Verified | Client AST verification, truncation & test count guard |
| `/src/utils/sanitizer.ts` | Utilities | Verified | Code sanitization, TS import path extension cleaner & POSIX newline compliance |
| `/src/utils/gemini.ts` | Utilities | Verified | Gemini model caller with negative constraints |
| `/src/utils/github.ts` | Utilities | Verified | GitHub REST API tree, blob, and commit handler |
| `/src/utils/fileSplitter.ts` | Utilities | Verified | Chunked decomposition for $>1000$ line files |
| `/src/utils/postmortem.ts` | Utilities | Verified | Postmortem logger and constraint tracker |
| `/src/utils/mockRepo.ts` | Utilities | Verified | Sandbox repository fixtures |
| `/src/components/SovereignKernelPanel.tsx` | Components | Verified | Sovereign Kernel dashboard, RAG search, vector manager |
| `/src/components/DebateChamber.tsx` | Components | Verified | Live multi-agent debate chamber |
| `/docs/emg_regression.md` | Docs | Verified | Anti-regression test case and scenario matrix |
| `/docs/CASE_STUDY_HUXLEY_SINGULARITY_LOOP_RUN_6.md` | Docs | Verified | Forensic audit of Run #6 on Huxley-Singularity-Loop- |
| `/emg_file_changes/EMG_SYSTEM_FILE_CHANGES_CHRONOLOGY.md` | Docs | Verified | Master file changes chronology and ledger |

---
*End of EMG System File Changes Chronology.*
