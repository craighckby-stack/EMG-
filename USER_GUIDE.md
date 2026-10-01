# EMG (EPHEMERAL MIND GEM) — User & Preview Guide

Welcome to **EMG (Ephemeral Mind Gem)**, an autonomous, verification-gated code refactoring engine and security governance platform.

This guide is designed for new users to quickly understand how the live preview environment works, how to navigate the dashboard UI, and how to execute autonomous code refactoring and security sanitization cycles safely.

---

## 🚀 Live Preview URLs

EMG is deployed in two preview environments:

| Environment | URL | Purpose |
| :--- | :--- | :--- |
| **Development Preview** | [ais-dev-ipgdsocr7adysm4iwxj2rb-483535245139.asia-southeast1.run.app](https://ais-dev-ipgdsocr7adysm4iwxj2rb-483535245139.asia-southeast1.run.app) | Live sandbox testing, rapid feature updates, and active development testing. |
| **Production Preview** | [ais-pre-ipgdsocr7adysm4iwxj2rb-483535245139.asia-southeast1.run.app](https://ais-pre-ipgdsocr7adysm4iwxj2rb-483535245139.asia-southeast1.run.app) | Stable preview environment for production repository optimization runs. |

> **Note:** The preview runs in a secure, sandboxed client browser frame backed by server-side Gemini AI models and optional live GitHub API integration.

---

## 🖥️ Dashboard Overview & Layout

When you open the EMG Preview URL, you are greeted with the **Sovereign Operational Control Deck**.

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ [EMG CORE]  [▶ RUN SINGLE CYCLE]  [⚡ TOGGLE AUTO]  [🔍 DIAGNOSTICS]  [📊 ORACLE]│
├───────────────────────────┬─────────────────────────────────────────────────────┤
│ ⚙️ CONFIGURATION PANEL    │ 📜 REAL-TIME TELEMETRY LOG CONSOLE                  │
│ • Repository Mode         │ • [09:12:01] Harvester Siphon initialized...        │
│ • GitHub PAT / Repo Target│ • [09:12:03] RAG Memory query: 0 prior failures     │
│ • Optimization Goal       │ • [09:12:05] Security Sanitizer: CLEAN              │
│ • Chunking Thresholds     │ • [09:12:08] Ethical Debate: Mutation Approved      │
├───────────────────────────┴─────────────────────────────────────────────────────┤
│ ⚖️ DUAL-AGENT DEBATE CHAMBER & EPISTEMIC ALIGNMENT MATRIX                      │
│ • Prosecutor (Dalek Caan) vs. Defender (Jesus) vs. Judge (Sovereign Synthesis)  │
├───────────────────────────┬─────────────────────────────────────────────────────┤
│ 📈 SATURATION METRICS     │ ❌ POST-MORTEMS & BUG INSPECTOR                      │
│ • Correct Growth: 0.0     │ • Active Failures: 2                                │
│ • Convergence: 100%       │ • Escalated Files: 0                                │
└───────────────────────────┴─────────────────────────────────────────────────────┘
```

### Key UI Components

1. **Header Navigation & Action Bar**
   - **`RUN SINGLE CYCLE`**: Executes a single step of the Tri-Loop Evolution Cycle (Harvest -> Sanitize -> Debate -> Validate -> Commit).
   - **`TOGGLE AUTO` / `START AUTO`**: Launches continuous, autonomous evolution cycles with built-in self-stopping protection.
   - **`DIAGNOSTICS`**: Opens real-time system health metrics (memory usage, execution times, sandbox status).
   - **`ORACLE / HARVEST`**: Displays RAG vector store statistics and harvested codebase structures.
   - **`WIPE MEMORY`**: Resets local IndexedDB vector cache and state.

2. **Configuration Panel**
   - **Sandbox Mode vs. GitHub Mode**: Toggle between a local in-browser sandbox repository (ideal for safe experimentation) and a real GitHub repository.
   - **GitHub Credentials**: Target repository (`owner/repo`), branch, and Personal Access Token (PAT).
   - **Optimization Goal**: Select the focus of the mutation pass (e.g., *Refactoring & Readability*, *Type Safety*, *Security Hardening*, *Performance*).

3. **Real-Time Telemetry & Log Console**
   - Displays live system execution logs, compiler output, security scan results, and ethical debate verdicts.

4. **Debate Chamber & Alignment Matrix**
   - Visualizes the internal governance verification. Before any code change is applied, two AI personas debate the risk vs. benefit:
     - **Prosecutor (Dalek Caan)**: Scans RAG memory for known failure patterns and argues against risky code changes.
     - **Defender (Jesus)**: Scans clean commit vectors and highlights structural improvements.
     - **Judge (Sovereign Synthesis)**: Synthesizes the debate and enforces strict AST compiler and security sanitizer checks.

5. **Post-Mortem & Bug Inspector**
   - Shows rejected code mutations, machine-copied compiler error evidence, root-cause diagnoses, and auto-escalation statuses.

---

## 📖 Step-by-Step Walkthrough: Running Your First Optimization

Follow these steps to run your first evolution cycle in the preview:

### Step 1: Open the Preview URL
Navigate to the [Development Preview URL](https://ais-dev-ipgdsocr7adysm4iwxj2rb-483535245139.asia-southeast1.run.app) or [Production Preview URL](https://ais-pre-ipgdsocr7adysm4iwxj2rb-483535245139.asia-southeast1.run.app) in your web browser.

### Step 2: Choose Repository Mode
In the **Configuration Panel** on the left:
- **For Quick Testing (Recommended for First-Time Users)**: Keep **Sandbox Mode** selected. This uses an isolated in-memory C/TypeScript test repository so you can see mutations without affecting external repositories.
- **For Live GitHub Optimization**:
  1. Uncheck Sandbox Mode.
  2. Enter your **Target Repository** (e.g., `your-username/your-repo`).
  3. Enter the target **Branch** (e.g., `main`).
  4. Paste your **GitHub Personal Access Token (PAT)** with `repo` scope permissions.

### Step 3: Select an Optimization Goal
Choose the target objective for the AI engine:
- **Refactoring & Clean Code**: Improves code structure, modularity, and formatting.
- **Type Safety**: Enforces explicit TypeScript type annotations and removes implicit `any`.
- **Security Hardening**: Scans and fixes potential secret leaks, raw credentials, or PII.

### Step 4: Run a Single Cycle (`RUN SINGLE CYCLE`)
Click the **`RUN SINGLE CYCLE`** button in the top navigation bar.

Here is what happens automatically under the hood:
1. **Harvester Siphon**: Scans candidate files in the codebase.
2. **RAG Query**: Checks IndexedDB vector memory for past fixes and failure patterns.
3. **AI Generation**: Gemini generates a candidate code optimization pass.
4. **Edge Security Sanitizer**: Scans candidate code for hardcoded secrets (Shannon Entropy > 4.5) and PII.
5. **AST Verification**: Compiles and verifies the syntax of the generated candidate.
6. **Ethical Debate**: Evaluates Prosecutor vs. Defender arguments.
7. **Commit / Ledger Update**: If approved, updates the repository and appends clean vectors to RAG memory. If rejected, logs a structured entry into `POSTMORTEMS.md`.

### Step 5: Review the Proposed Mutation
Once the cycle finishes:
- View the proposed diff in the **Mutation Viewer** or click **`VIEW DIFF`**.
- Check the **Telemetry Log** to see why the change was approved or rejected.

### Step 6: Enable Autonomous Auto-Mode (`START AUTO`)
When you are ready to let EMG run continuously:
- Click **`START AUTO`**.
- EMG will autonomously cycle through repository files, optimizing code, logging post-mortems for failures, and building RAG vector memory.
- You can stop the loop at any time by clicking **`STOP AUTO`**.

---

## 🛡️ How Self-Stopping Protection Safeguards Your Codebase

EMG is built with **Autonomous Self-Stopping Mechanisms** to prevent infinite loops, runaway API calls, or repeated attempts on unfixable code.

```
                  ┌──────────────────────────────────────────┐
                  │          EMG EVOLUTION CYCLE             │
                  └────────────────────┬─────────────────────┘
                                       │
                      ┌────────────────┴────────────────┐
                      ▼                                 ▼
             Convergence Check                 Failure Counter
         (0 growth in 3 cycles?)            (3 consecutive failures?)
                      │                                 │
             ┌────────┴────────┐               ┌────────┴────────┐
             ▼                 ▼               ▼                 ▼
          YES: HALT        NO: Continue     YES: SKIP        NO: Continue
        (Emit HALT log)   (Next Cycle)    (Blacklist File)  (Next Cycle)
```

1. **Saturation Lockout (Convergence Halt)**
   - If `STUDIO_ATTACHMENT_CORRECT.md` shows **0 growth** for 3 consecutive cycles, RAG returns 0 new fix patterns, and security sanitizer is 100% clean, EMG automatically emits:
     `HALT: CORRECT growth 0, WRONG retrieval 0, sanitizer clean`
   - The auto-loop gracefully stops execution.

2. **3-Failure Consecutive Skip-List**
   - If a specific file fails AST compiler validation or linter checks **3 consecutive times**, EMG marks the file as `ESCALATED`.
   - The file is added to `skippedFiles` and temporarily removed from the active candidate rotation so the engine does not waste API calls repeatedly failing on the same issue.

3. **0-Diff Saturation Check**
   - If Gemini produces identical code with 0 net changes compared to the original file, EMG records the repository state as saturated and skips redundant re-optimizations.

---

## 🔒 Security & Data Privacy Features

- **Zero-Leak Sandbox**: Local code execution takes place inside WeakMap-isolated memory containers to prevent scope contamination.
- **Shannon Entropy Secret Redaction**: Automatically flags and redacts hardcoded API keys (`AIzaSy...`, `ghp_`, `sk-`), tokens, emails, and SSNs.
- **RAG Vector Protection**: Private repository data and secrets are automatically sanitized before vectors are committed or synced.

---

## ❓ Frequently Asked Questions (FAQ)

### Q1: What should I do if a file is marked as `STATUS: ⚠️ ESCALATED`?
When a file reaches 3 consecutive failures, its postmortem status in `docs/POSTMORTEMS.md` escalates. This indicates the file is too large or complex for a single generation pass.
- **Solution**: EMG will automatically switch to **Chunked Diffing** (breaking files > 1000 lines into individual function/module units). You can also manually review `docs/POSTMORTEMS.md` to see the machine-copied compiler error.

### Q2: Is my GitHub Personal Access Token stored securely?
Yes. Tokens entered in the configuration panel remain strictly in browser session state / memory and are passed directly over HTTPS to the official GitHub REST API.

### Q3: How do I reset the system state or start fresh?
Click the **`WIPE MEMORY`** button in the header bar. This clears local IndexedDB vector storage, resets logs, and re-initializes the sandbox state.

---

## 📁 Related Documentation Files

For deeper technical information, consult these files in the repository:

- [`README.md`](/README.md) — System architecture, subsystems, and CLI instructions.
- [`docs/SELF_STOPPING_MECHANISMS.md`](/docs/SELF_STOPPING_MECHANISMS.md) — Detailed breakdown of saturation lockouts, circuit breakers, and convergence formulas.
- [`docs/POSTMORTEMS.md`](/docs/POSTMORTEMS.md) — Live auto-generated post-mortem ledger of compiler errors and corrective constraints.
- [`STUDIO_ATTACHMENT_WRONG.md`](/STUDIO_ATTACHMENT_WRONG.md) — Failure & recovery paired vector records.

---

*EMG Core Sovereign Kernel — Autonomous Neural Verification Engine.*
