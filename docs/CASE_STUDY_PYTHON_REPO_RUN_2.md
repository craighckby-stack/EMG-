# Case Study #2: Autonomous Evolution Run on `craighckby-stack/Python`
**Factual Engineering Assessment, Real-World Bugs, and Root-Cause Remediation**

* **Target Repository:** [`https://github.com/craighckby-stack/Python`](https://github.com/craighckby-stack/Python) (Fork of *TheAlgorithms/Python*)  
* **Target Codebase:** 1,000+ open-source Python algorithms & dynamic programming solutions  
* **Execution Environment:** Autonomous Remote Git Execution via EMG Core  
* **Model:** Free-Tier Gemini Flash  
* **Date of Run:** September 27, 2026  
* **Audit Methodology:** Direct inspection of raw commit patches, raw GitHub files, and execution of test harnesses  

---

## 1. Executive Summary: The Balanced Truth

Run #2 was a major test of EMG's autonomous capabilities following the initial baseline run. A rigorous inspection reveals a combination of genuine engineering breakthroughs and real, syntax-breaking bugs:

* **What Succeeded:**
  1. **File Filtering Was 100% Accurate:** In Run #1, non-code files (`DIRECTORY.md`, `.md` trackers) were accidentally modified. In Run #2, **zero non-code files were touched**. All commits focused strictly on `.py` algorithm files.
  2. **High-Value Mathematical Refactors:** Legitimate algorithmic upgrades were committed, notably modernizing combinations with `math.comb` and optimizing modular arithmetic with `pow(i, i, mod)`.
  3. **Remote RAG Vector Synchronization:** Vector embeddings persisted to GitHub (`SOVEREIGN-KERNEL/memory/vectors.jsonl`), growing from 474 to 528 vectors.
* **What Failed (The Real Bugs):**
  1. **The Trailing `@@@` Delimiter Leak:** Multiple files were committed with trailing `@@@` characters after the code, causing instant `SyntaxError: invalid syntax` when executed by Python.
  2. **Python Syntax Validation Bypass:** The `/api/validate` endpoint was only wired to the TypeScript compiler; Python files were silently returning dummy `valid: true` without AST compilation.
  3. **Git History Noise:** RAG metadata commits triggered on every file mutation, creating 3 metadata commits for every 1 code commit.
  4. **Questionable Code Patterns:** An excessive 1-million-entry `@lru_cache` was allocated in Problem 47.

---

## 2. The Good Points (Verified Real Improvements)

### 1. Project Euler Problem 53: Modern Combinatorics (`9fa607f`)
* **File:** `project_euler/problem_053/sol1.py`
* **Original Code:**
  ```python
  from math import factorial
  def combinations(n, r):
      return factorial(n) / (factorial(r) * factorial(n - r))
  ```
* **EMG Refactor:**
  ```python
  from math import comb
  def combinations(n: int, r: int) -> int:
      """Compute binomial coefficient using bounded arithmetic."""
      if r < 0 or r > n:
          return 0
      return comb(n, r)
  ```
* **Why this is high quality:** Replaces 3 separate factorial computations and float division with Python's C-accelerated `math.comb()`, introduces strict integer return typing, and provides $O(1)$ boundary protection.

---

### 2. Project Euler Problem 48: Modular Exponentiation (`7da25c4`)
* **File:** `project_euler/problem_048/sol1.py`
* **Original Code:**
  ```python
  total = 0
  for i in range(1, 1001):
      total += i**i
  return str(total)[-10:]
  ```
* **EMG Refactor:**
  ```python
  def solution(limit: int = 1000, mod: int = 10**10) -> str:
      total = 0
      for i in range(1, limit + 1):
          total = (total + pow(i, i, mod)) % mod
      return str(total).zfill(10)
  ```
* **Why this is high quality:** Rather than computing $1000^{1000}$ (a 3,001-digit integer) and causing large memory allocations, it uses Python's three-argument `pow(i, i, mod)` to compute $(i^i) \pmod{10^{10}}$ in $O(\log i)$ time and $O(1)$ intermediate space.

---

### 3. File Filter Precision
In Run #1, the harvester included `DIRECTORY.md` and `docs/hacktober_2026_prep.md`. In Run #2, across more than 100 consecutive operations, **not a single markdown, yaml, or documentation file was modified**. The file blacklist proved completely robust.

---

## 3. The Bad Points & Verified Bugs

### 1. The Trailing `@@@` Delimiter Leak (`SyntaxError`)
* **Verified Broken Files:** `project_euler/problem_052/sol1.py`, `project_euler/problem_054/sol1.py`, `project_euler/problem_050/sol1.py`, `project_euler/problem_040/sol1.py`.
* **The Actual Code Committed:**
  ```python
  if __name__ == "__main__":
      print(solution())
  @@@
  ```
* **Direct Verification:** Pulling the raw files from GitHub and executing them with `python3` confirms an immediate failure:
  ```text
  File "project_euler/problem_052/sol1.py", line 40
      @@@
      ^
  SyntaxError: invalid syntax
  ```
* **Nuance:** Not every file in the batch had this bug—files like `problem_048` and `problem_053` had clean endings. However, where it did occur, it rendered the Python module completely unusable.

---

### 2. The Python AST Validation Bypass
* **Location:** `server.ts` `/api/validate`
* **The Defect:**
  ```typescript
  const isTs = /\.(ts|tsx)$/i.test(fileName);
  const isJs = /\.(js|jsx|mjs|cjs)$/i.test(fileName);

  if (!isTs && !isJs) {
    return res.json({ valid: true, diagnostics: [] });
  }
  ```
* **The Impact:** The validator only invoked the TypeScript compiler. Python files were granted an automatic `valid: true` without any syntax parsing. The UI displayed `[TYPE-SAFE] AST syntax verified`, but no Python syntax checking actually ran.

---

### 3. Git History Bloat (RAG Commit Noise)
* **The Defect:** Every single file optimization cycle triggered 3 independent GitHub commit calls:
  1. `EMG [RAG]: Synchronized vector database`
  2. `EMG [RAG]: Updated clean pattern vectors`
  3. `EMG [RAG]: Updated failure & recovery vectors`
* **The Impact:** Out of 100 commits in the branch history, ~75 were metadata micro-commits. While the data was safely saved, pushing 3 metadata commits per file refactor pollutes the repository history.

---

### 4. Excessive LRU Cache Allocation
* **File:** `project_euler/problem_047/sol1.py` (Commit `3cad3ea`)
* **Code:**
  ```python
  @lru_cache(maxsize=1048576)
  def upf_len(num: int) -> int:
  ```
* **The Critique:** Allocating $2^{20}$ (1,048,576) cache slots is an uncharacteristically large memory buffer for a small helper function. In standard CI/CD test runners or resource-limited containers, excessive unbounded or oversized caches risk memory spikes and OOM issues.

---

## 4. Remediation Implemented & Verified Live

Following this audit, the core pipeline was patched and verified with live automated tests:

### 1. Robust Delimiter Stripping (`server.ts` & `src/utils/sanitizer.ts`)
* Added explicit regex trimming in both the extraction layer and the sanitizer:
  ```typescript
  optimized = optimized
    .replace(/@@@END/g, '')
    .replace(/@@@START/g, '')
    .replace(/@+\s*$/, '')
    .trim();
  ```
* Added auto-healing in `src/utils/validator.ts` to automatically strip any trailing `@` characters before AST compilation.

---

### 2. Live Python 3 AST Validation Gate (`server.ts` & `src/utils/validator.ts`)
* Integrated native `/usr/bin/python3` AST verification directly into `/api/validate`:
  1. **Delimiter Check:** Instantly flags and rejects any code containing `@@@` or trailing `@` tokens with code `PY_DELIMITER_LEAK`.
  2. **Python Compiler AST Parse:** Executes `ast.parse()` using native Python. If a `SyntaxError` exists, it extracts line numbers, column offsets, and the exact error description, preventing invalid code from ever reaching a git commit.

#### Live Verification Test Results:
```text
1. Valid Python:
   ✅ { valid: true, diagnostics: [] }

2. Python with trailing @@@:
   ❌ { valid: false, code: 'PY_DELIMITER_LEAK', message: 'SyntaxError: Illegal protocol delimiter artifact (@, @@@, or @@@END) detected in Python source code.' }

3. Broken Python syntax (unclosed parenthesis):
   ❌ { valid: false, code: 'PY_SYNTAX_ERROR', message: "Python SyntaxError: '(' was never closed", line: 1, column: 13 }
```

---

### 3. RAG Sync Debouncing & Consolidation (`src/memory/emg_rag.ts`)
* Increased the sync debounce timer from 12 seconds to **60 seconds**.
* Confined markdown summaries to `SOVEREIGN-KERNEL/memory/` and throttled generation to every 10 vectors, drastically cutting commit noise.

---

### 4. Cross-Function Behavioral Parity Directive (The Diophantine Lesson)
* **The Insight:** In `maths/diophantine.py`, `all_diophantine_solutions()` supported negative inputs via `abs()`, but sibling functions (`diophantine()`, `diophantine_all_soln()`) failed on negatives with bare asserts. EMG previously performed "conservative polish" by converting the asserts into `ValueError`, but preserved the artificial limitation.
* **The Directive Deployed:** Injected Rule #12 into `server.ts`:
  > *"Audit sibling functions within the same module for input domain consistency and mathematical symmetry. If one function handles a broader or generalized input domain (e.g., negative numbers via abs(), zero, or general edge cases) while a sibling function artificially restricts or crashes on valid inputs with bare asserts, unify and generalize the input handling across the module."*
* **The Impact:** Elevates EMG from surface-level syntax cleanup to deep, holistic semantic bug fixing across multi-function modules.

---

## 5. Conclusion & Next Steps

Run #2 proved that EMG can autonomously traverse complex algorithm codebases, apply genuine mathematical simplifications, and persist its memory across sessions. However, it also exposed that without hard language-specific compiler gates, small prompt-extraction artifacts (`@@@`) can slip past and break code.

With the new native Python AST compiler gate and strict delimiter sanitizers now active, future runs have hard verification guarantees that will reject and heal syntax defects before any commit is pushed.
