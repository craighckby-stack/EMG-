# Case Study #5: Polyglot Repository Stress Run on `craighckby-stack/agent-governance-toolkit`
**Multi-Language Compilation Vacuums, Catastrophic Test Truncation, Multi-Block Regex Traps, and POSIX Newline Governance**

* **Target Repository:** [`https://github.com/craighckby-stack/agent-governance-toolkit`](https://github.com/craighckby-stack/agent-governance-toolkit) (Multi-language agent governance monorepo: Python, Go, C# .NET, TypeScript, JavaScript)  
* **Target Codebase:** 380+ enterprise agent orchestration, policy, and compliance modules  
* **Execution Environment:** Autonomous Remote Git Execution via EMG Core  
* **Model:** Gemini Flash  
* **Date of Run:** September 30, 2026  
* **Audit Methodology:** Independent comparative analysis against Claude code review, raw GitHub commit tree inspections (`ba3e53fa`, `ebfbea61`, `7b233a59`, `73384f69`, `2467d589`), AST syntax trees, and language-specific compiler evaluations  

---

## 1. Executive Summary

Run #5 expanded EMG’s operating horizon from single-language libraries (`TheAlgorithms/Python`, `sqlparse`) into an **enterprise polyglot monorepo** consisting of 165 Python files, 97 C# (.NET) files, 57 Go files, and 59 TypeScript/JavaScript files.

An independent audit performed by Claude, fully corroborated by empirical inspection of the remote commit tree, yielded a stark verdict:
> **The mutated repository is not safe to use.** While harmless cosmetic tidying occurred across many files, critical breakages were introduced across all four languages, including the total destruction of test suites and syntax failures in compiled targets.

Rather than an isolated bug, this run exposed fundamental architectural assumptions that held when operating in single-language Python sandboxes but collapsed in complex multi-language repositories.

### Primary Disasters Uncovered:
1. **The 1-Line Test Suite Destruction (`test_security_scanner.py`):**
   An 844-line, 40-test security scanner suite was wiped out and replaced with a single line: `result = eval(user_input)`.
2. **Import & Header Stripping (`contributor_check.py`):**
   Lines 1–43 (the entire import block, shebang, and MIT license header) were deleted, leaving 54 undefined names (`NameError: name 'Any' is not defined`) and breaking all dependent test suites.
3. **Mid-Word Token Limit Truncation (`test_spec_hypervisor_conformance.py`):**
   An 814-line file hit the LLM output token ceiling and was cut off mid-word on line 733 (`Session`), losing 8 spec-conformance tests.
4. **The Multi-Language Compilation Vacuum (C# and Go):**
   EMG refactored 97 C# files and 57 Go files without possessing Go or .NET compilers in its sandbox. Typos such as `{ get.init; }` in C# and `const` inside `const (...)` in Go were committed without verification.
5. **Universal POSIX Newline Stripping:**
   379 of 381 modified files had their trailing newlines stripped by a global `.trim()`, causing widespread linter and git formatting failures (`\ No newline at end of file`).

---

## 2. Cross-Run 5-Way Evolutionary Comparison Matrix (Runs 1–5)

| Dimension | Run #1 (`Python`) | Run #2 (`Python`) | Run #3 (`sqlparse`) | Run #4 (`sqlparse`) | Run #5 (`agent-governance-toolkit`) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Codebase Domain** | General algorithms | Math & Project Euler | Production SQL parser | Production SQL parser | Enterprise Polyglot Monorepo |
| **Target Languages** | Python | Python | Python | Python | **Python, C# (.NET), Go, TS/JS** |
| **Syntax Pass Rate** | 100% valid | **Failed** (`@@@` leaks) | 100% valid syntax | 100% valid syntax | **Failed in C# and Go** (No compilers) |
| **Test Suite Preservation** | Preserved | Preserved | Preserved | Preserved | **Catastrophic Failure**: 844-line test wiped to 1 line |
| **Truncation Detection** | Untested | Untested | Untested | Untested | **Failed**: Cut off mid-word (`Session`) at token limit |
| **Import Integrity** | Minor quirks | Clean | Unused imports flagged | PEP 563 annotations | **Failed**: Deleted imports in `contributor_check.py` |
| **Language Boundary Control**| Single language | Single language | Single language | Single language | **Failed**: Mutated Go & C# blind without compilers |
| **Epistemic Reconciliation** | N/A | N/A | Unobserved | **Verified Live**: 2 stale clean vectors revoked | Active in memory, but overshadowed by syntax/test loss |
| **POSIX Formatting** | Clean | Clean | Clean | Clean | **Failed**: 379/381 files stripped of `\n` |
| **Overall Verdict** | **8.2 / 10** | **6.5 / 10** | **7.0 / 10** | **8.9 / 10** | **4.0 / 10 (Reject / Revert Required)** |

---

## 3. Forensic Root-Cause Autopsy

### 3.1 The Multi-Block Markdown Regex Trap (`test_security_scanner.py`)
* **Commit:** `ebfbea61f03211d974f20dfeaf199e10d4526fd1`
* **Original File:** 845 lines, 30,241 bytes, 40 unit test methods.
* **Mutated File:** 1 line, 25 bytes: `result = eval(user_input)`
* **Root Cause Mechanism:**
  `test_security_scanner.py` contains tests verifying that the AST scanner detects dangerous `eval()` patterns. When Gemini generated its response, it included an illustrative markdown code snippet:
  ````markdown
  Here is an example test case for eval:
  ```python
  result = eval(user_input)
  ```
  And here is the complete refactored test module:
  ```python
  ... (800+ lines of test code) ...
  ```
  ````
  In `server.ts`, the fence extraction regex used non-greedy matching:
  ```typescript
  const fenceMatch = cleaned.match(/```(?:[a-zA-Z0-9_-]+)?\s*\n([\s\S]*?)(?:\n```|$)/);
  ```
  The regex eagerly grabbed the **first** tiny 25-byte code fence (`result = eval(user_input)`) and ignored the rest of the response!
* **Why AST Validation Passed:**
  In Python, `result = eval(user_input)` is 100% syntactically valid code. `ast.parse()` returned zero errors. Because the system lacked a **size-ratio sanity gate**, it blindly committed a 1-line snippet in place of an 844-line test suite.

### 3.2 Token Ceiling Truncation Blindspot (`test_spec_hypervisor_conformance.py`)
* **Commit:** `7b233a59d816a3f0`
* **Original File:** 814 lines, 32,032 bytes.
* **Mutated File:** Truncated at line 733.
* **The Tail of the File:**
  ```python
  def test_identifier_invalid_chars_rejected(self) -> None:
      """S17.1 -- invalid characters MUST be rejected."""
      with pytest.raises(ValueError):
          Session
  ```
* **Root Cause Mechanism:**
  Generating 800+ lines of dense Python code exceeded Gemini’s maximum output token limit. The generation abruptly stopped on the word `Session`.
* **The AST Trap:**
  In Python syntax grammar, an isolated identifier on an indented line inside a `with` block (`Session`) is parsed as a valid expression statement (`ast.Expr(value=ast.Name(id='Session'))`). `compile()` did not emit a `SyntaxError`. The validator was completely blind to the fact that 80 lines and 8 tests were chopped off.

### 3.3 Full-File Replacement vs. Partial Diffs (`contributor_check.py`)
* **Commit:** `ba3e53fa12fb7e86ab8bd496e6cbb4b596021096`
* **What Happened:**
  The model output only the refactored functions starting at line 44, omitting the top 43 lines. EMG treated this partial response as a full file replacement, wiping out:
  ```python
  -#!/usr/bin/env python3
  -# Copyright (c) Microsoft Corporation.
  -# Licensed under the MIT License.
  -from __future__ import annotations
  -import argparse, json, os, subprocess, sys, time
  -from dataclasses import dataclass
  -from typing import Any
  -from urllib.error import HTTPError, URLError
  ```
* **Impact:** 54 undefined names at runtime (`NameError: name 'Any' is not defined`), instantly breaking any script or test attempting to import the module.

### 3.4 The Multi-Language Compilation Vacuum (C# and Go)
* **What Happened:**
  EMG was engineered with local compiler validation for **Python** (`python3 -W error`) and **TypeScript** (`ts.transpileModule`). It possesses **zero compiler infrastructure for C# (.NET) or Go** inside its execution container (`which go` and `which dotnet` return empty).
* **The Consequences:**
  * **C# (`ExternalPolicyBackend.cs`):** Injected `public required string Backend { get.init; }` with a fatal period typo, plus .NET 9’s `System.Threading.Lock` into a project targeting `.NET 8`.
  * **Go (`policy-opa-cedar/main.go`):** Placed the keyword `const` inside a parenthesized `const (...)` declaration, which Go rejects immediately.
  Because EMG had no Go or C# compilers, these files were validated only with a simple brace counter (`{` matches `}`), allowing fatal syntax errors to reach git.

### 3.5 Global `.trim()` Stripping POSIX Trailing Newlines
* In `server.ts` and `App.tsx`, generated code strings were passed through `.trim()`.
* While convenient for cleaning up protocol tokens, `.trim()` strips the trailing `\n`. Under POSIX standards, every text file must terminate with a newline character. 379 files failed formatting checks and generated noisy `\ No newline at end of file` diffs.

---

## 4. Architectural Remediations Deployed Post-Run 5

To permanently inoculate EMG against these failure modes, six core engineering upgrades have been implemented and verified:

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                 EMG POST-RUN 5 UPGRADES                                 │
├──────────────────────────┬──────────────────────────────────────────────────────────────┤
│ Subsystem                │ Resolution Implemented                                       │
├──────────────────────────┼──────────────────────────────────────────────────────────────┤
│ 1. Size-Ratio Sanity     │ Injected into server.ts and validator.ts:                    │
│    Gate                  │ Rejects candidate mutations where line count drops by >35%   │
│                          │ on files >= 25 lines. Prevents 1-line snippet replacements.   │
├──────────────────────────┼──────────────────────────────────────────────────────────────┤
│ 2. Test Suite            │ Injected into server.ts and validator.ts:                    │
│    Preservation Gate     │ Counts test declarations (def test_, it(, func Test, etc.).  │
│                          │ Rejects any candidate that deletes or reduces test cases.     │
├──────────────────────────┼──────────────────────────────────────────────────────────────┤
│ 3. Longest Code-Fence    │ Patched server.ts and validator.ts unwrap logic:             │
│    Selection             │ When multiple code fences exist, selects the longest block,  │
│                          │ completely neutralizing illustrative sample snippet traps.   │
├──────────────────────────┼──────────────────────────────────────────────────────────────┤
│ 4. Token-Ceiling Cutoff  │ Checks response.candidates[0].finishReason === 'MAX_TOKENS'. │
│    Detection             │ Rejects incomplete generations and preserves clean baseline. │
├──────────────────────────┼──────────────────────────────────────────────────────────────┤
│ 5. Python AST Undefined  │ Added AST symbol audit to /api/validate:                     │
│    Symbol Gate           │ Traverses loaded ast.Name nodes and verifies they are        │
│                          │ defined or imported. Catches stripped imports immediately.   │
├──────────────────────────┼──────────────────────────────────────────────────────────────┤
│ 6. Compiler-Aware        │ Hardened isOptimizableFile:                                  │
│    Language Whitelist    │ Excludes all languages lacking active local compiler gates   │
│                          │ (.cs, .go, .rs, .java, .rb, .php, .swift, .kt).              │
├──────────────────────────┼──────────────────────────────────────────────────────────────┤
│ 7. POSIX Trailing        │ Enforces sanitizedCode.trimEnd() + '\n' on all source files, │
│    Newline Enforcement   │ eliminating '\ No newline at end of file' git diff noise.    │
└──────────────────────────┴──────────────────────────────────────────────────────────────┘
```

---

## 5. Epistemic Lessons & Autonomous Engineering Truths

1. **A Syntax Pass is Not an Implementation Pass:**
   A 1-line snippet (`result = eval(user_input)`) and a truncated token (`Session`) both pass pure Python AST syntax compilation. A valid syntax tree does not mean the code is complete or safe. Autonomous engines must enforce **mass preservation** (line counts, test counts, import counts).
2. **Never Mutate What You Cannot Compile:**
   Operating on languages without authoritative compiler gates (like C# or Go in an environment without `dotnet` or `go`) guarantees eventual syntax breakage. If a language cannot be strictly compiled in the sandbox, it must be excluded from optimization targets.
3. **Protect Test Suites as Inviolable Contracts:**
   Test suites are the ground truth of any software project. Any mutation that reduces the number of test assertions is destructive by definition.
