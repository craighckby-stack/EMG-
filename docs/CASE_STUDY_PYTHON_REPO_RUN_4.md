# Case Study #4: Autonomous Evolution Run on `craighckby-stack/sqlparse`
**Contradictory Evidence Dynamics, Memory Invalidation, Test Fixture Harvester Traps, and PEP 563 Import Safety**

* **Target Repository:** [`https://github.com/craighckby-stack/sqlparse`](https://github.com/craighckby-stack/sqlparse) (Fork of *andialbrecht/sqlparse*)  
* **Target Codebase:** Production non-validating SQL parser and tokenizer used across Django, Airflow, and SQLAlchemy ecosystems  
* **Execution Environment:** Autonomous Remote Git Execution via EMG Core  
* **Model:** Gemini Flash  
* **Date of Run:** September 29–30, 2026  
* **Audit Methodology:** Differential patch audits against raw GitHub commits (`d066cf0` through `737ebd3`), vector store ledger traces (`vectors.jsonl`), runtime Python 3.12 subprocess import evaluations, and epistemic debate transcripts  

---

## 1. Executive Summary

Run #4 subjected EMG to a stress test on a freshly reset, clean clone of `sqlparse` (`60cdc64`). With the safeguards from Run #3 active (the anti-defensive gate, linter checks for unused imports, and self-mutation protection), Run #4 investigated how an autonomous neural refactoring engine handles **contradictory evidence**, **multi-pass feedback loops**, and **complex repository topologies containing test fixtures and non-code assets**.

### Key Findings of Run #4:
1. **The Core Question Answered (Contradictory Evidence):**
   * *Question:* When EMG encounters contradictory evidence, does it resolve the conflict, or can an old GOOD memory continue teaching the system that a now-proven-BAD mutation is good?
   * *Finding:* **Prior to this audit, EMG did not resolve conflicts.** It suffered from **"Zombie Memory Syndrome"**: once a mutation was tagged `provenance: 'clean'` (e.g. `correct_<hash>`), it remained permanently in the vector store. If a subsequent pass or regression test proved that mutation was defective and generated a failure vector, the original clean vector was *never invalidated*. In subsequent cycles, Defender cited the old clean vector as positive evidence, boosting trust scores and re-synthesizing the broken pattern!
2. **Prior Fixes Held Firm:**
   * **0 trailing delimiter leaks (`@@@`)** and **0 fatal syntax errors**.
   * **0 attempts to mutate internal RAG files** (`SOVEREIGN-KERNEL/memory/vectors.jsonl`).
   * **0 runaway ledger commit loops** ("Purging poisoned constraints..." was completely eradicated).
   * **0 artificial `isinstance(sql, str)` injections** into public APIs.
3. **Four New Edge-Case Failure Modes Uncovered:**
   * **Test Fixture Siphon Trap:** EMG siphoned and "optimized" raw SQL test files inside `tests/files/` (`dashcomment.sql`, `stream.sql`, `test_cp1251.sql`), corrupting intentional CP1251 Cyrillic byte fixtures and stream-truncation edge cases.
   * **Extensionless Plaintext Siphoning:** EMG refactored a plain text `TODO` file because it lacked a `.txt` or `.md` extension.
   * **Groff/Troff Documentation Siphoning:** EMG treated `docs/sqlformat.1` (a Unix manpage) as source code.
   * **Import-Time `AttributeError` via Missing PEP 563 Annotations:** Forward references such as `sql.statement.TokenList` evaluated at import time before submodule initialization, causing runtime import crashes.
   * **Postmortem Commit Noise:** Automated GitHub commits fired on every micro-failure in the mutation cycle, spamming git history.

---

## 2. Cross-Run Evolutionary Comparison Matrix (Runs 1–4)

| Dimension | Run #1 (`Python`) | Run #2 (`Python`) | Run #3 (`sqlparse`) | Run #4 (`sqlparse` Deep Stress) |
| :--- | :--- | :--- | :--- | :--- |
| **Codebase Domain** | General algorithmic modules | Mathematical formulas & Project Euler | Production SQL parser & lexer | Production SQL parser & lexer |
| **Code Complexity** | Low-to-medium | Medium (recursive math) | High (stateful token streams) | High (stateful token streams & test suites) |
| **Syntax Pass Rate** | 100% syntactically valid | **Failed in prod** (`@@@` delimiter leaks) | **100% valid syntax** | **100% valid syntax** (0 leaks) |
| **Engine Self-Mutation** | Pure external execution | Storing vector memory to GitHub | **Failed**: Refactored own `vectors.jsonl` | **Fixed**: Zero self-mutation attempts |
| **Commit Loop Stability** | Clean commit cycle | High RAG metadata noise | **Failed**: Infinite ledger commit loop | **Fixed**: Zero ledger divergence loops |
| **API Contract Preservation** | Moderate | High | **Failed**: Injected `isinstance(sql, str)` | **Fixed**: Permissive types preserved |
| **Epistemic Conflict Resolution** | N/A (single-pass) | N/A (single-pass) | Unobserved | **Diagnosed & Fixed**: Old good memories previously overrode new bad failures |
| **Test Fixture Isolation** | Untested | Untested | Untested | **Failed**: Siphoned `tests/files/*.sql` & `TODO` |
| **Import-Time Safety (PEP 563)** | N/A | N/A | N/A | **Exposed**: Submodule forward references failed import |
| **Git Commit Hygiene** | Clean | High metadata noise | High loop noise | Noisy postmortem commit spam |
| **Overall Maturity Score** | **8.2 / 10** | **6.5 / 10** | **7.0 / 10** | **8.8 / 10** (Deepest structural diagnosis to date) |

---

## 3. The Good Points (Verified Real Improvements in Run #4)

### 1. Total Eradication of the Ledger Commit Loop
In Run #3, divergence between CRLF/LF line endings and an unconstrained `filteredContent !== content` check caused EMG to commit dozens of empty ledger-purge messages. In Run #4, the `healCount > 0` guard and whitespace normalization completely silenced this loop—**zero redundant ledger commits were emitted**.

### 2. Complete Protection of the Sovereign Kernel RAG Store
In Run #3, the file harvester attempted to refactor `SOVEREIGN-KERNEL/memory/vectors.jsonl`. In Run #4, path exclusion rules prevented any inspection or modification of internal engine state.

### 3. Public API Contract Preservation Maintained
Unlike Run #3, where `parse()` and `format()` were injected with rigid `if not isinstance(sql, str): raise TypeError`, Run #4 respected the permissive dynamic typing of the library. Public signatures remained open to file descriptors, string buffers, and raw byte streams.

### 4. High-Fidelity Benchmark Modernization
In `benchmarks/bench_group_comments.py` and `benchmarks/bench_grouping.py`:
* Raw string docstrings (`r"""..."""`) eliminated Python 3.12 `SyntaxWarning` escape sequence notices.
* Unused `Callable` and `Any` imports were cleanly expunged.
* Type annotations for constants (`SIZES: tuple[int, ...] = (1000, 2000, 4000, 8000)`) and data structures (`tuple[Vector, ...]`) were applied without runtime overhead.

---

## 4. The Bad Points & Verified Regressions

### 1. Contradictory Evidence & "Zombie Memory" Poisoning (The Core Flaw)
* **What Happened:**
  During iterative passes over `tests/files/dashcomment.sql` and `tests/files/encoding_gbk.sql`, an initial pass produced a mutation deemed "clean", generating a `correct_<commit_hash>` entry in `SOVEREIGN-KERNEL/memory/vectors.jsonl` with `provenance: 'clean'` and `trust: 'high'`.
  When a later pass or downstream test execution proved that this mutation broke comment parsing or Cyrillic encoding, EMG generated a failure entry. However:
  ```typescript
  // PREVIOUS CODE: Vector entries were appended, never reconciled
  vectorStore.push(cleanEntry); // Stays in memory forever
  // Later:
  vectorStore.push(failureEntry); // Added, but cleanEntry is never revoked!
  ```
* **The Consequence:**
  When `executeRAGDebate` ran on subsequent cycles:
  1. The **Defender** retrieved the stale `clean` vector and argued: *"Memory proves pattern X is correct (trust: high), assigning benefit score 9.0"*.
  2. The **Prosecutor** retrieved the `failure` vector and assigned a risk score of 7.0.
  3. The **Judge** computed $\text{benefit} > \text{risk}$ ($9.0 > 7.0$), ruling that the candidate mutation was safe to re-apply!
  An outdated "good" memory actively taught the neural engine to repeat a proven mistake.

### 2. Siphoning Test Fixtures (`tests/files/*.sql`)
* **What Happened:**
  EMG identified `.sql` files in `tests/files/` and attempted to "beautify" and format them:
  * `tests/files/test_cp1251.sql`: Contained deliberate non-UTF8 CP1251 Cyrillic byte sequences to test parser encoding robustness. EMG normalized the bytes, destroying the test case.
  * `tests/files/stream.sql`: Contained an intentionally incomplete SQL stream statement to verify generator truncation. EMG completed the SQL syntax, invalidating the stream boundary test.
  * `tests/files/dashcomment.sql`: Contained unusual comment indentations to verify lexer regexes. EMG reformatted the comments, masking lexer regression detection.
* **Root Cause:**
  `isOptimizableFile` assumed any non-binary file that wasn't markdown was source code, failing to distinguish between **application code** and **delicate test fixtures**.

### 3. Siphoning Extensionless Files (`TODO`) and Unix Manpages (`docs/sqlformat.1`)
* **What Happened:**
  * EMG siphoned the project's root `TODO` file and committed a refactor. Because `TODO` lacked an extension, it slipped past `/\.(md|txt)$/` blacklist filters.
  * EMG siphoned `docs/sqlformat.1`, a Unix manpage formatted in Groff/Troff macros (`.TH`, `.SH`), attempting to parse and refactor it as Python code.

### 4. Import-Time `AttributeError` via Missing PEP 563 Annotations
* **What Happened:**
  In `sqlparse/filters/reindent.py`, a refactor added the type annotation:
  ```python
  def _next_token(self, tlist: sql.statement.TokenList) -> None:
  ```
  While syntactically valid in isolation, Python evaluates type hints in function definitions at module import time by default. Because `sql.statement` had not yet exposed `TokenList` at that phase of the import cycle, importing `sqlparse.cli` failed with:
  ```
  AttributeError: module 'sqlparse.sql' has no attribute 'statement'
  ```
* **Root Cause:**
  In Python 3.7+, `from __future__ import annotations` (PEP 563) defers type hint evaluation, treating annotations as strings and preventing circular or premature import attribute resolution crashes.

### 5. Automated Postmortem Commit Noise
* **What Happened:**
  Every time a candidate mutation failed AST validation or sanitization during an autonomous run, `writePostmortem` immediately triggered `commitFileUpdate` to GitHub, creating dozens of `EMG: Updated post-mortem` commits that cluttered the repository history.

---

## 5. Architectural Remediations Deployed Post-Run 4

To permanently eliminate all five failure modes, the following engineering solutions have been implemented across the EMG codebase:

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                             EMG POST-RUN 4 UPGRADES                              │
├──────────────────────────┬───────────────────────────────────────────────────────┤
│ Subsystem                │ Resolution Implemented                                │
├──────────────────────────┼───────────────────────────────────────────────────────┤
│ 1. Epistemic             │ Created reconcileContradictoryMemories() and          │
│    Reconciliation Pass   │ invalidateCleanVectorsForFile() in emg_rag.ts.        │
│    (emg_rag.ts)          │ Automatically revokes clean vectors (setting          │
│                          │ provenance='contradicted', trust='revoked') when a    │
│                          │ subsequent failure is confirmed on that file/pattern. │
├──────────────────────────┼───────────────────────────────────────────────────────┤
│ 2. Contradiction-Aware   │ Updated debate.ts to purge revoked vectors from       │
│    Debate Substrate      │ Defender evidence. Injected prosecutor penalties      │
│    (debate.ts)           │ (risk = 10.0) whenever a candidate matches a known    │
│                          │ contradicted memory.                                  │
├──────────────────────────┼───────────────────────────────────────────────────────┤
│ 3. Deep Fixture &        │ Hardened isConfigOrNonCodeFile and isOptimizableFile  │
│    Document Exclusion    │ in validator.ts:                                      │
│    (validator.ts)        │ • Permanently blocks /tests/files/, /testdata/, etc.  │
│                          │ • Blocks .sql, .man, .1, .2, .lock, .sh, etc.         │
│                          │ • Forbids any extensionless file (!basename.includes).│
├──────────────────────────┼───────────────────────────────────────────────────────┤
│ 4. PEP 563 Forward       │ Added Rule #15 to server.ts:                          │
│    Annotation Gate       │ Enforces from __future__ import annotations on files   │
│    (server.ts)           │ with compound/module annotations and validates that   │
│                          │ module attributes resolve cleanly at import time.     │
├──────────────────────────┼───────────────────────────────────────────────────────┤
│ 5. Postmortem Commit     │ Suppressed automated GitHub commits for transient     │
│    Suppression           │ failures during autonomous mutation cycles            │
│    (postmortem.ts & App) │ (commitToGit: false). Postmortems remain in memory    │
│                          │ and are batched cleanly.                              │
└──────────────────────────┴───────────────────────────────────────────────────────┘
```

### Detailed Code Highlights:

#### 1. Epistemic Reconciliation Engine (`src/memory/emg_rag.ts`)
```typescript
export function reconcileContradictoryMemories(store?: VectorEntry[]): {
  reconciledCount: number;
  cleanCount: number;
  failureCount: number;
} {
  const current = store || vectorStore;
  const failureFiles = new Set<string>();

  for (const entry of current) {
    if (entry.metadata.provenance === 'failure' && entry.metadata.file) {
      failureFiles.add(entry.metadata.file.trim().toLowerCase());
    }
  }

  let reconciledCount = 0;
  const updated = current.map((entry) => {
    if (entry.metadata.provenance === 'clean' && entry.metadata.file) {
      const entryFile = entry.metadata.file.trim().toLowerCase();
      if (failureFiles.has(entryFile)) {
        reconciledCount++;
        return {
          ...entry,
          metadata: {
            ...entry.metadata,
            provenance: 'contradicted' as const,
            trust: 'revoked' as const,
            invalidationReason: 'Superseded by verified failure entry on the same file',
          },
        };
      }
    }
    return entry;
  });

  if (reconciledCount > 0) {
    vectorStore = updated;
    saveVectorsToIndexedDB(vectorStore).catch(() => {});
  }
  return { reconciledCount, cleanCount: ..., failureCount: ... };
}
```

#### 2. Test Fixture & Non-Code Exclusion Gate (`src/utils/validator.ts`)
```typescript
// Test fixture directories and test payload data (NEVER treat test fixtures as optimizable source code)
if (
  normalized.includes('/tests/files/') ||
  normalized.includes('/test/files/') ||
  normalized.includes('/tests/fixtures/') ||
  normalized.includes('/test/fixtures/') ||
  normalized.includes('/__fixtures__/') ||
  normalized.includes('/testdata/') ||
  normalized.includes('/tests/data/') ||
  normalized.includes('/fixtures/')
) {
  return true; // Excluded from optimization
}

// Extensionless files (TODO, AUTHORS, LICENSE, etc.)
if (!basename.includes('.')) {
  return false; // Rejected as optimizable code
}
```

---

## 6. Epistemic Takeaways & Autonomous Governance Maturity

Run #4 highlights an essential principle of autonomous engineering systems:

> **A memory architecture without contradiction resolution is fundamentally dogmatic.**
> If an engine treats past approvals as immutable truths, it will inevitably become poisoned by its own early hallucinations. True machine learning and self-healing require the ability to **revoke prior confidence** when confronted with subsequent regression evidence.

By integrating epistemic reconciliation, strict fixture boundary isolation, and PEP 563 deferred annotation enforcement, EMG has evolved from a simple candidate generator into an **epistemically coherent autonomous refactoring substrate**.
