<!--
===============================================================================
EMG (EPHEMERAL MIND GEM)
Stable Baseline Archive
Status: Verified and frozen for production use
License: CC BY-NC-ND 4.0
===============================================================================
-->

# EMG (Ephemeral Mind Gem)

> Stable Baseline — Verified Autonomous Code Governance Platform
>
> This repository is the frozen, verified baseline of EMG. It is intended for use as a stable reference build and should not be modified without a fresh rebuild and subsystem verification cycle.

---

## Status

This repository is a verified stable baseline of the EMG system.

Operational subsystems confirmed in the current baseline:

- ✅ Debate Engine — risk/benefit verdict engine working
- ✅ RAG Retrieval — vector memory queries working
- ✅ GitHub Synchronization — repo metadata/tree/file/commit operations working
- ✅ Self-Halt Engine — convergence detection working

Build verification:

- `npm install` — completed successfully
- `npm run build` — succeeded with zero critical errors
- Runtime verification — all four subsystems tested successfully

---

## Purpose

EMG is an autonomous code-governance and refactoring engine designed to:

- evaluate candidate mutations through a risk/benefit debate layer
- retrieve prior failure and clean-pattern evidence from memory
- validate the candidate change against syntax and safety gates
- sync validated patches to GitHub repositories
- stop itself when convergence is reached

It is not a general-purpose application template and should be treated as a controlled engineering baseline rather than a mutable public demo repo.

---

## Architecture Overview

```text
      ┌──────────────────────────────┐
      │          EMG CORE            │
      │  Autonomous mutation engine  │
      └──────────────┬───────────────┘
                     │
         ┌───────────┴────────────┐
         │                        │
    Debate Engine           RAG Memory
    • Risk scoring          • Failure ledgers
    • Benefit scoring       • Clean pattern retrieval
    • Verdict synthesis     • Context memory search
         │                        │
         └───────────┬────────────┘
                     │
             GitHub Sync Layer
             • repo details
             • tree fetch
             • file content
             • commit mutation
                     │
                     ▼
             Self-Halt Engine
             • convergence detection
             • stop conditions
             • no-op prevention
```

---

## Verified Runtime Components

### 1. Debate Engine
- Runs Prosecutor and Defender evaluation passes
- Produces risk and benefit scores
- Applies approval/rejection rules based on the final verdict
- Verified: working in the current baseline

### 2. RAG Retrieval
- Queries failure evidence and clean patterns from memory
- Pulls relevant history into the current adjudication flow
- Verified: working in the current baseline

### 3. GitHub Sync
- Handles GitHub repo metadata and file tree queries
- Reads file content and writes verified code mutations
- Verified: working in the current baseline

### 4. Self-Halt
- Detects convergence and clean-stop conditions
- Prevents endless mutation loops on stable code
- Verified: working in the current baseline

---

## Quick Start

### Requirements

- Node.js 20+
- npm 10+
- Google Gemini API key
- GitHub PAT token (for repository sync)

### Setup

```bash
git clone https://github.com/craighckby-stack/EMG-.git
cd EMG-
npm install
```

### Environment

Create a `.env` file with:

```env
GEMINI_API_KEY="your-gemini-key"
GITHUB_PAT="your-github-token"
PORT=3000
NODE_ENV="production"
```

### Run the app

```bash
npm run dev
```

### Production build

```bash
npm run build
npm start
```

---

## Important Guardrails

### Stable Baseline Rule
This repo is intentionally locked as a stable baseline.

Do not:
- fork and rebrand it as a new project
- modify core subsystem behavior without a fresh rebuild and verification pass
- treat test artifacts or run logs as authoritative project documentation
- merge unverified mutation changes directly into the main branch

### Required validation before any change

Before modifying this repo, perform:

```bash
npm install
npm run lint
npm run build
```

Then verify:
- debate engine still scores correctly
- RAG queries still return evidence
- GitHub sync still responds successfully
- self-halt still triggers correctly under convergence conditions

---

## Documentation Policy

This repo is a stable engineering baseline, not a general public showcase.

The following are intentionally not treated as canonical project documentation:

- run logs
- case study files
- test fixtures
- synthetic attachment outputs
- temporary patch scripts
- experimental mutation artifacts

Only the verified runtime code and this README are considered the canonical baseline.

---

## Repository Safety / Fork Policy

This project is distributed under CC BY-NC-ND 4.0.

This means:
- sharing is allowed
- modification is not allowed
- commercial use is not allowed
- derivative works are not allowed

This repository is therefore intended as a controlled baseline rather than a forkable engineering template.

---

## License

Creative Commons Attribution-NonCommercial-NoDerivatives 4.0 International (CC BY-NC-ND 4.0)

See the `LICENSE` file for full legal terms.

---

## Final Note

This repository has been verified as a stable engineering baseline.

Use it as a reference build, not as a mutable experimental workspace.
