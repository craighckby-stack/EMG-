# EMG (EPHEMERAL MIND GEM) — Preview & System Usage Guide

This document provides a comprehensive overview of the EMG Preview environment and step-by-step instructions for running autonomous code refactoring and security sanitization passes.

---

## 🔗 Preview Environments

- **Development Preview**: [https://ais-dev-ipgdsocr7adysm4iwxj2rb-483535245139.asia-southeast1.run.app](https://ais-dev-ipgdsocr7adysm4iwxj2rb-483535245139.asia-southeast1.run.app)
- **Production Preview**: [https://ais-pre-ipgdsocr7adysm4iwxj2rb-483535245139.asia-southeast1.run.app](https://ais-pre-ipgdsocr7adysm4iwxj2rb-483535245139.asia-southeast1.run.app)

---

## 🎮 How to Use the System

### 1. Launching the Control Deck
Open either preview link in your browser. The dashboard loads immediately with a full telemetry suite and live log console.

### 2. Choosing Sandbox vs. GitHub Live Mode
In the **Configuration Panel**:
- **Sandbox Mode (Default)**: Executes mutations inside an in-browser WeakMap isolated sandbox using a mock C/TypeScript codebase.
- **GitHub Live Mode**: Uncheck Sandbox Mode and enter your GitHub `owner/repository`, target `branch`, and a Personal Access Token (PAT).

### 3. Setting Your Refactoring Goal
Select an optimization goal:
- `Refactoring & Readability`: Modularizes functions, cleans up structure, and improves code clarity.
- `Type Safety`: Adds explicit TypeScript type annotations and removes `any`.
- `Security Hardening`: Detects and redacts credentials, secrets, and PII.

### 4. Executing Mutation Passes
- **Single Pass (`RUN SINGLE CYCLE`)**: Triggers one complete evolution loop (Siphon -> RAG Lookup -> AI Pass -> Security Scan -> AST Compiler Gate -> Ethical Debate -> Commit/Ledger).
- **Autonomous Auto-Mode (`START AUTO`)**: Runs continuous evolution passes in the background.

### 5. Monitoring & Control
- **Telemetry Console**: View real-time compiler outputs and governance verdicts.
- **Debate Chamber**: Inspect the Prosecutor (Dalek Caan) vs. Defender (Jesus) risk analysis.
- **Post-Mortem Ledger**: Check `docs/POSTMORTEMS.md` for machine-copied compiler failure evidence and root-cause diagnoses.
- **Self-Stopping Halt**: The system will automatically stop if zero growth occurs for 3 consecutive cycles or if all files reach max failure thresholds.

---

*For full onboarding details, refer to the root [`USER_GUIDE.md`](../USER_GUIDE.md).*
