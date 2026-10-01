# EMG (EPHEMERAL MIND GEM)

> **Autonomous C-Dialect Neural Verification & Refactoring Engine**

**EMG** (Ephemeral Mind Gem) is an autonomous, verification-gated code refactoring engine and security governance platform. It orchestrates self-stopping tri-loop evolution cycles across local sandbox environments and remote GitHub repositories, enforcing strict AST compiler verification, Shannon entropy secret sanitization, dual-agent ethical debate, WeakMap zero-leak execution sandboxing, and high-capacity IndexedDB vector memory.

---

## Live Applications & User Onboarding

* **Development Preview:** [https://ais-dev-ipgdsocr7adysm4iwxj2rb-483535245139.asia-southeast1.run.app](https://ais-dev-ipgdsocr7adysm4iwxj2rb-483535245139.asia-southeast1.run.app)
* **Production Preview:** [https://ais-pre-ipgdsocr7adysm4iwxj2rb-483535245139.asia-southeast1.run.app](https://ais-pre-ipgdsocr7adysm4iwxj2rb-483535245139.asia-southeast1.run.app)
* **New User & Preview Guide:** [`USER_GUIDE.md`](./USER_GUIDE.md) — Step-by-step onboarding, preview environment overview, and dashboard controls.
* **Case Study #1 (Python Repo Run):** [`docs/CASE_STUDY_PYTHON_REPO_RUN.md`](./docs/CASE_STUDY_PYTHON_REPO_RUN.md) — Baseline autonomous run on `TheAlgorithms/Python`.
* **Case Study #2 (Project Euler Run):** [`docs/CASE_STUDY_PYTHON_REPO_RUN_2.md`](./docs/CASE_STUDY_PYTHON_REPO_RUN_2.md) — Combinatorics refactors, AST validation gates, and delimiter fixes.
* **Case Study #3 (sqlparse Production Run):** [`docs/CASE_STUDY_PYTHON_REPO_RUN_3.md`](./docs/CASE_STUDY_PYTHON_REPO_RUN_3.md) — Production parser contracts, anti-defensive typing gates, and commit loop fixes.
* **Case Study #4 (Contradictory Evidence & Fixture Isolation):** [`docs/CASE_STUDY_PYTHON_REPO_RUN_4.md`](./docs/CASE_STUDY_PYTHON_REPO_RUN_4.md) — Epistemic contradiction reconciliation, test fixture protection, PEP 563 import safety, and memory revocation.
* **Case Study #5 (Polyglot Monorepo & Truncation Governance):** [`docs/CASE_STUDY_PYTHON_REPO_RUN_5.md`](./docs/CASE_STUDY_PYTHON_REPO_RUN_5.md) — Forensic audit of `agent-governance-toolkit`, multi-language compilation vacuums, test suite preservation, multi-block fence safety, and POSIX newline enforcement.

---

## System Architecture

```
                          ┌─────────────────────────────────────────┐
                          │                   EMG                   │
                          │   (Self-Stopping Tri-Loop Orchestrator) │
                          └────────────────────┬────────────────────┘
                                               │
                         1. Siphon Engine & Generational Stamping
                         2. WeakMap Zero-Leak Execution Sandbox
                         3. RAG Vector Query (IndexedDB + GitHub Auto-Sync)
                                               │
                        ┌──────────────────────┴──────────────────────┐
                        ▼                                             ▼
            Edge Security Sanitizer                      Ethical Debate Substrate
          • Hardcoded Cred & PII Redaction              • Prosecutor (Caan): RAG Failures
          • Shannon Entropy Scan (> 4.5)                • Defender (Jesus): Clean Trust
          • Paired Fix Auto-Recovery                    • Judge: Sovereign Synthesis
                        │                                             │
                        └──────────────────────┬──────────────────────┘
                                               │
                                     Epistemic Alignment Matrix
                                   • Mechanist (Structure)
                                   • Adversary (Code Injection)
                                   • Scalability Killer (Complexity)
                                               │
                                 ┌─────────────┴─────────────┐
                                 ▼                           ▼
                        Passes Governance             Fails Governance
                        • Apply Mutation             • Log Post-Mortem Evidence
                        • Append Clean Vector        • Pair Failure/Fix Vector
                        • Check Self-Stopping Halt   • Trigger Auto-Recovery
```

---

## Primary Subsystems

### 1. High-Capacity RAG Vector Memory & Epistemic Reconciliation (`emg_rag.ts`)
* **IndexedDB Store (1GB+ Limit)**: Replaced browser `localStorage` quotas with IndexedDB persistence, enabling multi-gigabyte vector store capacity.
* **Epistemic Contradiction Resolution**: Implemented `reconcileContradictoryMemories()` and `invalidateCleanVectorsForFile()`. When a mutation or pattern fails in a subsequent pass, conflicting `clean` vectors are automatically revoked (`provenance: 'contradicted'`, `trust: 'revoked'`), eliminating "Zombie Memory" self-poisoning.
* **Auto-Publishing to GitHub**: Automatically formats and commits updated `memory/vectors.jsonl` and `STUDIO_ATTACHMENT_*.md` ledgers directly to GitHub when new clean commits or failure/fix pairs are recorded.
* **Pressure-Decay Memory**: Automatically culls low-entropy noise ($\text{entropy} < 0.2$) under high memory pressure while preserving high-trust clean patterns permanently (`ephemeral.ts`).

### 2. Edge Governance Security Sanitizer (`sanitizer.ts`)
* **Regex & Shannon Entropy Scanning**: Redacts hardcoded API keys (`AIzaSy...`, `ghp_`, `sk-`, `AKIA...`), Slack webhooks, email addresses, and SSNs.
* **Shannon Entropy Engine**: Calculates string information entropy ($\text{entropy} > 4.5$) to catch randomized tokens and raw secrets before code commits.
* **Paired Fix Auto-Recovery**: Automatically retrieves and substitutes paired fix snippets from vector memory when security or syntax violations occur.

### 3. Self-Stopping Point Engine (`halt.ts`)
* **Archaeological Proof of Cleanliness**: Halts mutation passes when:
  1. **0 growth** in `STUDIO_ATTACHMENT_CORRECT.md` for 3 consecutive cycles.
  2. **0 new fix patterns** returned by RAG query for the target codebase.
  3. **100% Sanitizer Cleanliness** (zero remaining security or syntax violations).
* Output Log: `HALT: CORRECT growth 0, WRONG retrieval 0, sanitizer clean`

### 4. Ethical Substrate Debate Engine (`debate.ts`)
* **Prosecutor (Dalek Caan)**: Queries failure vectors and newly revoked contradictory memories, assigning risk scores (0–10).
* **Defender (Jesus)**: Queries confirmed clean patterns in memory, filtering out revoked or contradicted patterns, and assigning benefit scores (0–10).
* **Judge (Sovereign Synthesis)**: Permits mutations **ONLY IF** $\text{benefit} > \text{risk}$ **AND** Edge Security Sanitizer is **CLEAN**.

### 5. Multi-Angle Epistemic Alignment Matrix (`alignment-matrix.ts`)
* Evaluates code mutations across **Mechanist** (type mechanics), **Adversary** (code execution primitives), **Scalability Killer** (algorithmic complexity), and **Alignment Auditor** perspectives.

### 6. WeakMap Zero-Leak Execution Sandbox (`zero-leak-sandbox.ts`)
* Manages dynamic mutation execution inside isolated context containers anchored by JavaScript `WeakMap` objects to guarantee zero scope pollution and zero memory leaks.

### 7. Deep Test-Fixture & Non-Code Exclusion Gate (`validator.ts`)
* Enforces strict isolation of sensitive test data (`/tests/files/`, `/testdata/`, `/fixtures/`) so parser fixtures (Cyrillic encodings, stream boundaries, deliberate syntax cases) are never corrupted.
* Forbids harvesting extensionless documentation files (`TODO`, `LICENSE`) and non-executable man pages (`.1`, `.man`).

### 8. Python Compiler & Import-Safety Gate (`server.ts`)
* **Compiler Warning Strictness (`python3 -W error`)**: Treats invalid escape sequences and deprecated syntax as hard failures, enforcing raw strings (`r"""..."""`).
* **PEP 563 Deferred Annotations (Rule #15)**: Enforces `from __future__ import annotations` when type annotations use module attributes or forward references, preventing import-time `AttributeError` crashes.
* **Unused Import Rejection**: Blocks redundant imports (`Callable`, `Any`) from polluting namespace.
* **AST Undefined Symbol Audit**: Scans loaded symbols against defined/imported names, catching deleted headers and missing imports.

### 9. Destructive Truncation & Test Suite Preservation Gate (`server.ts` & `validator.ts`)
* **Mass Preservation Ratio**: Rejects candidate mutations where code drops by $>35\%$ on files $\ge 25$ lines, eliminating 1-line snippet replacement bugs.
* **Strict Test Count Preservation**: Prohibits deleting or reducing unit test declarations (`def test_`, `it(`, `test(`).
* **Multi-Fence Disambiguation**: Selects the longest code block when responses contain multiple fences, preventing illustrative snippets from displacing full implementations.
* **POSIX Trailing Newline Enforcement**: Automatically appends a trailing `\n` to all generated source files.

### 10. Compiler-Gated Language Boundary Whitelist (`validator.ts`)
* Restricts optimization targets strictly to languages backed by authoritative compilers in the runtime environment (Python, TypeScript/JavaScript, C/C++).
* Completely blocks uncompilable targets (C#, Go, Rust, Java, Ruby, PHP, Swift, Kotlin) from blind autonomous mutations.

---

## Quick Start Guide

### Prerequisites
* Node.js (v20.x or newer)
* npm (v10.x or newer)
* Google Gemini API Key

### Installation & Execution

1. **Clone repository & install dependencies:**
   ```bash
   git clone https://github.com/craighckby-stack/EMG-Tests.git
   cd EMG-Tests
   npm install
   ```

2. **Configure environment variables (`.env`):**
   ```env
   GEMINI_API_KEY="your-gemini-api-key"
   PORT=3000
   NODE_ENV="development"
   ```

3. **Start local development server:**
   ```bash
   npm run dev
   ```
   Navigate to `http://localhost:3000`.

4. **Production Build:**
   ```bash
   npm run build
   npm start
   ```

---

## Server API Reference

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/optimize` | `POST` | Dispatches source code to the Gemini API with candidate model fallback chains and diff splicing. |
| `/api/lint` | `POST` | Runs heuristic linter rules and compiles C/C++ units via the Godbolt GCC 13.2 API. |
| `/api/validate` | `POST` | Native TypeScript compiler AST diagnostics and syntactic verification. |
| `/api/sanitize` | `POST` | Server-side regex and Shannon entropy redaction for credentials and tokens. |
| `/api/diagnostic` | `GET` | System health status probe, memory persistence validation, and environment check. |
| `/api/status` | `GET` | Reports Gemini API key injection state and supported model profiles. |
| `/api/github/commit-file` | `POST` | Commits sanitized, verified code mutations directly to GitHub repositories. |

---

## License

Licensed under the **Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International (CC BY-NC-SA 4.0)** License. See the `LICENSE` file for details.
