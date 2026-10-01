# EMG Sovereign Kernel — Comprehensive Regression Test Case
**Document:** `docs/emg_regression.md`  
**System:** EMG Sovereign Kernel v3.0 (Autonomous Mutation, RAG Memory, & Self-Stopping Engine)  
**Classification:** Epistemic Governance & Anti-Regression Verification Test Suite  
**Date:** September 30, 2026  

---

## 1. Executive Summary & Objective

This test case formalizes the audit, detection mechanisms, and verification criteria for preventing system regression across autonomous code mutation, RAG memory synchronization, repository saturation, and self-stopping halt logic.

The objective is to guarantee that the system:
1. **Never mutates converged or saturated code** (0-diff detection and tree fingerprint locking).
2. **Never executes catastrophic code collapse or test deletion** (test suite preservation and truncation gates).
3. **Never strips SPDX or Copyright notices** (intellectual property preservation).
4. **Maintains active multi-agent ethical debate and self-stopping halt mechanics** across both Sandbox and Live GitHub execution loops.
5. **Consistently synchronizes all vector ledgers and markdown knowledge bases** (`vectors.jsonl`, `clean_patterns.md`, `failure_patterns.md`) without artificial blockage.

---

## 2. Regression Test Scenarios & Specifications

### Test Scenario 1: Catastrophic Code Collapse & Deletion Guard
* **Failure Mode Tested:** Model emits a truncated snippet, single-line snippet (e.g. `result = eval(user_input)`), or cuts off mid-statement due to token budgets or markdown fence nesting.
* **Test Input:** Original file with 844 lines and candidate output with 1 line.
* **Expected Result:** **REJECTED** by Server Gate (`/api/validate`), Client Validator (`validateSourceCode`), and Pre-Commit Gate (`App.tsx`).
* **Assertion:**
  $$\text{Lines}_{\text{candidate}} \ge \lfloor 0.70 \times \text{Lines}_{\text{original}} \rfloor \quad (\text{for } \text{Lines}_{\text{original}} \ge 15)$$
* **Verification Status:** **PASS** (Protected at 3 independent layer boundaries).

---

### Test Scenario 2: Test Suite Case Count Preservation
* **Failure Mode Tested:** Model optimizes a test file by stripping edge-case tests, reducing coverage from 40 tests to 5 tests.
* **Test Input:** Python test file containing `def test_...` methods mutated to fewer methods.
* **Expected Result:** **REJECTED** across Python (`def test_`, `@pytest.mark`), Go (`func Test*`), C# (`[Fact]`, `[Test]`, `[Theory]`), and JavaScript/TypeScript (`test(`, `it(`).
* **Assertion:**
  $$\text{Count}(\text{Tests}_{\text{candidate}}) \ge \text{Count}(\text{Tests}_{\text{original}})$$
* **Verification Status:** **PASS** (Strict equality/growth requirement enforced).

---

### Test Scenario 3: License & Copyright Header Preservation
* **Failure Mode Tested:** Optimization strips top-level license headers (e.g., `SPDX-License-Identifier: MIT` or `Copyright (c) 2026`).
* **Test Input:** Source file starting with MIT/Apache/GPL/CC license header mutated without the header.
* **Expected Result:** **REJECTED** with diagnostic: `Stripped license/copyright header detected`.
* **Verification Status:** **PASS**.

---

### Test Scenario 4: POSIX Trailing Newline Compliance
* **Failure Mode Tested:** Code sanitization strips all trailing whitespace, omitting the final newline character required by POSIX standards and linters.
* **Test Input:** Raw source code string ending with alphanumeric character without newline.
* **Expected Result:** Automatically sanitized and terminated with exactly one `\n`.
* **Verification Status:** **PASS** (Enforced in `src/utils/sanitizer.ts`, `server.ts`, and `src/App.tsx`).

---

### Test Scenario 5: Multi-Language Syntactic & Compiler Guard
* **Failure Mode Tested:** Non-compilable syntax hallucinated for compiled languages lacking containerized toolchains (C# and Go).
* **Checks Enforced:**
  - **C#**: Balanced delimiters (`{}`, `()`, `[]`), property initializer syntax validation, `async Task` return validation, prohibition of .NET 9 `System.Threading.Lock` when targeting earlier frameworks.
  - **Go**: Mandatory `package` declaration at line 1, balanced delimiters, undefined struct/type members detection.
  - **Python**: Full authoritative AST parse via `python3 -m ast` in `/api/validate` and `/api/lint`.
* **Verification Status:** **PASS**.

---

### Test Scenario 6: Code Saturation & Unnecessary Mutation Prevention
* **Failure Mode Tested:** System endlessly mutates code that is already converged, wasting API quota and generating noisy commits.
* **Protective Mechanisms:**
  1. **0-Diff Normalization Check:** If normalized candidate equals normalized original, emitted as `[NO-OP]` code saturation and added to skip list.
  2. **Repository Tree Fingerprint Lock (`saturatedTreeHash`):** SHA-256 hash of all file paths and blobs in the repository tree. If unchanged and goal is unchanged, re-runs are blocked with refusal message.
  3. **Permanent Apparatus Fixture Lock:** Hard write-protection on `docs/POSTMORTEMS.md`, `README.md`, `package.json`, `tsconfig.json`, `LICENSE`, and core configs.
* **Verification Status:** **PASS**.

---

### Test Scenario 7: RAG Vector Ledger Publishing & Epistemic Reconciliation
* **Failure Mode Tested:** RAG vector ledgers fail to publish to remote repository, or stale "clean" vectors contradict newly logged failures.
* **Protective Mechanisms:**
  1. **Unblocked Publishing:** Removed artificial `% 10 === 0` barrier in `publishRagToGithub()`. Every sync updates `SOVEREIGN-KERNEL/memory/vectors.jsonl`, `clean_patterns.md`, and `failure_patterns.md`.
  2. **Contradiction Invalidation:** When a failure is logged on a file (`appendFailureAndFix`), all previous clean vectors for that file are immediately revoked and flagged as `contradicted`.
  3. **Debounced Sync:** 60-second debouncing prevents commit floods while ensuring persistence.
* **Verification Status:** **PASS**.

---

### Test Scenario 8: Self-Stopping Point Engine (Halt Logic)
* **Failure Mode Tested:** Engine runs indefinitely in a continuous loop without acknowledging repository convergence.
* **Halting Criteria:**
  $$\text{Halted} = (\text{NoGrowthCycles} \ge 3) \land (\text{WrongRetrievalCount} = 0) \land (\text{SanitizerClean} = \text{true})$$
* **Expected Result:** When satisfied, engine emits `[SELF-STOPPING POINT TRIGGERED]`, updates state, and cleanly disengages the live loop.
* **Verification Status:** **PASS** (Wired into both Sandbox and Live GitHub loops).

---

## 3. Verification Test Matrix

| ID | Test Case | Target Layer | Expected Result | Status |
|---|---|---|---|:---:|
| **REG-01** | Truncation >30% line drop | Server & Client | Rejection | **PASSED** |
| **REG-02** | Test function deletion | Server & Client | Rejection | **PASSED** |
| **REG-03** | License header stripped | Server & Client | Rejection | **PASSED** |
| **REG-04** | Trailing newline missing | Sanitizer | Auto-appended `\n` | **PASSED** |
| **REG-05** | C# syntax & .NET 9 Lock | Server & Validator | Rejection | **PASSED** |
| **REG-06** | Go missing package header | Server & Validator | Rejection | **PASSED** |
| **REG-07** | Python AST parse error | Server AST Engine | Rejection | **PASSED** |
| **REG-08** | 0-Diff Code Saturation | App Loop | No-op / Auto-skip | **PASSED** |
| **REG-09** | Global Tree Saturation | Fingerprint Lock | Refusal lockout | **PASSED** |
| **REG-10** | RAG 3-Artifact Remote Sync | EMG RAG Sync | Pushed to GitHub | **PASSED** |
| **REG-11** | Contradictory Clean Vector | Epistemic Engine | Revoked / Contradicted | **PASSED** |
| **REG-12** | 3-Cycle Convergence Halt | Halt Engine | Autonomous Pause | **PASSED** |

---

## 4. Conclusion & Sign-Off

The system passes all 12 regression test cases. All critical functional components—including ethical debate, saturation avoidance, RAG synchronization, AST validation, and self-stopping halt mechanics—are operational with triple-layer redundancy.
