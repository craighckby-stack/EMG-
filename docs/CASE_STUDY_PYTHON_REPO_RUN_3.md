# Case Study #3: Autonomous Evolution Run on `craighckby-stack/sqlparse`
**Factual Engineering Assessment, Real-World Regressions, Cross-Run Progression, and Root-Cause Remediation**

* **Target Repository:** [`https://github.com/craighckby-stack/sqlparse`](https://github.com/craighckby-stack/sqlparse) (Fork of *andialbrecht/sqlparse*)  
* **Target Codebase:** Production non-validating SQL parser and tokenizer used across Python frameworks (Django, Airflow, SQLAlchemy ecosystems)  
* **Execution Environment:** Autonomous Remote Git Execution via EMG Core  
* **Model:** Gemini Flash  
* **Date of Run:** September 28, 2026  
* **Audit Methodology:** Independent differential analysis against Claude code review, raw commit patches, GitHub commit logs, and Python 3.12 compiler audits  

---

## 1. Executive Summary

Run #3 transitioned EMG from self-contained computational algorithms (TheAlgorithms/Python, Project Euler) to a **battle-tested, production-grade library with external API contracts and intricate token streaming pipelines**.

This transition stressed the autonomous engine in entirely new dimensions:
* **The Good:** The AST compilation gates engineered after Run #2 held firm—**0 delimiter leaks (`@@@`) and 0 fatal Python syntax errors occurred**. Furthermore, EMG successfully modernized deep parser filter methods to use specialized AST subtypes (`sql.IdentifierList`, `sql.Case`) and modernized generator return types to `Iterator[Statement]`.
* **The Bad:** EMG exhibited a classic LLM failure mode—**"defensive over-engineering"**. It injected artificial runtime `isinstance(sql, str)` checks into public API entrypoints (`parse()`, `format()`, `split()`) and narrowed `FilterStack.run()` from `str | bytes | IO[str]` to `str`. This broke valid caller workflows (e.g., passing byte buffers, file streams, or duck-typed queries). It also generated unused typing imports and unescaped regex strings.
* **The System Glitches:** The Harvester siphon lacked `.jsonl` filtering, leading EMG to select its own RAG database (`SOVEREIGN-KERNEL/memory/vectors.jsonl`) as a refactor target, while a divergence check in `src/App.tsx` created a commit loop ("Purging poisoned isolated-compile constraints").

---

## 2. Cross-Run Comparison Matrix (Run 1 vs. Run 2 vs. Run 3)

The following matrix tracks the evolution, failure modes, and maturity of EMG across all three autonomous runs:

| Dimension | Run #1 (`craighckby-stack/Python`) | Run #2 (`craighckby-stack/Python`) | Run #3 (`craighckby-stack/sqlparse`) |
| :--- | :--- | :--- | :--- |
| **Codebase Domain** | General algorithmic modules (sorting, dynamic programming) | Mathematical algorithms & Project Euler puzzles | Production library parser & lexer token stream engine |
| **Code Complexity** | Low-to-medium (mostly single standalone functions) | Medium (recursive mathematical formulas, memoization) | High (stateful token streams, AST nodes, public library APIs) |
| **Syntax Pass Rate** | 100% syntactically valid | **Failed in production** (trailing `@@@` delimiter leaks caused `SyntaxError`) | **100% syntactically valid** (no `@@@` leaks; Run #2 AST gate prevented breaks) |
| **File Siphon Accuracy** | **Failed**: Inadvertently edited `.md` documentation files | **Fixed**: 100% code files only (`.py`) | **Regressed**: Attempted to optimize internal `vectors.jsonl` |
| **API Contract Preservation** | Moderate (doctests kept in sync) | High (pure algorithmic outputs preserved) | **Failed**: Injected breaking runtime `isinstance` checks and narrowed parameter types |
| **Type Modernization** | Mixed: PEP 585 regressions (`from typing import List`) | Clean: standard types (`int`, `str`) | Advanced: AST subclasses (`IdentifierList`, `Case`), but left unused imports |
| **Python 3.12 Compliance** | Untested | Basic AST validation | Exposed: invalid escape sequences in docstrings caught by Python 3.12+ `SyntaxWarning` |
| **Git Commit Hygiene** | Clean commit messages, 1 per cycle | High noise: 3 RAG metadata commits per code commit | High noise: infinite loop of "Purging poisoned isolated-compile constraints" |
| **Engine Self-Awareness** | Pure external code execution | Storing vector memory to GitHub | Confused: refactored its own vector memory database |
| **Overall Rating** | **8.2 / 10** (Strong start, minor typing quirks) | **6.5 / 10** (Great math, but broken syntax leaks) | **7.0 / 10** (Zero syntax crashes, but broken public API contracts) |

---

## 3. The Good Points (Verified Real Improvements)

### 1. Zero Delimiter Leaks & Clean AST Compilation
In Run #2, multiple files were crippled by trailing `@@@` delimiter strings because `/api/validate` lacked Python-native compilation. In Run #3, across all modified files, **not a single delimiter leak occurred**. The Python AST compiler gate introduced after Run #2 functioned as designed, ensuring every commit was valid Python syntax.

### 2. Precise AST Subtype Specialization in Filters (`aligned_indent.py`)
In `sqlparse/filters/aligned_indent.py`:
* **Before:** Methods were generically annotated with `tlist: sql.TokenList`.
* **EMG Refactor:**
  ```python
  -    def _process_identifierlist(self, tlist: sql.TokenList) -> None:
  +    def _process_identifierlist(self, tlist: sql.IdentifierList) -> None:

  -    def _process_case(self, tlist: sql.TokenList) -> None:
  +    def _process_case(self, tlist: sql.Case) -> None:
  ```
* **Why this is high quality:** `IdentifierList` and `Case` are specific subclasses of `TokenList` that define helper methods like `get_identifiers()` and `get_cases()`. By specializing the signature to the exact node type being processed, EMG improved type checker accuracy and IDE autocompletion without altering runtime semantics.

### 3. Generator to Iterator Modernization (`sqlparse/__init__.py`)
* **Before:** `parsestream` used the verbose `Generator[sql.Statement, None, None]`.
* **EMG Refactor:** Modernized the return type to `Iterator[sql.Statement]`.
* **Why this is high quality:** As recommended by PEP 484 and standard typing guidelines, functions that only yield values without receiving inputs via `.send()` should be annotated as `Iterator[T]` rather than `Generator[YieldType, SendType, ReturnType]`.

---

## 4. The Bad Points & Verified Regressions

### 1. Artificial Runtime Type-Checking Trap (Breaking Library Contracts)
* **Files:** `sqlparse/__init__.py` (`parse()`, `format()`, `split()`)
* **What EMG Injected:**
  ```python
  def parse(sql: str, encoding: str | None = None) -> tuple[sql.Statement, ...]:
  +    if not isinstance(sql, str):
  +        raise TypeError("SQL statement must be a string.")
       return tuple(parsestream(sql, encoding))
  ```
* **Why this is a severe bug:**
  - `sqlparse` was intentionally designed to accept various input types; `parsestream()` accepts both `str` and `IO[str]` (file streams, `io.StringIO`).
  - Many existing caller ecosystems pass custom string-like objects, byte sequences, or file descriptors.
  - Injecting runtime `isinstance` checks changes the function's contract from permissive duck-typing to rigid type enforcement. This is an anti-pattern in mature Python libraries unless explicitly mandated by the maintainers.

### 2. Parameter Type Narrowing Regression (`filter_stack.py`)
* **File:** `sqlparse/engine/filter_stack.py`
* **Original / Intended Signature:**
  ```python
  def run(self, sql: str | bytes | IO[str], encoding: str | None = None) -> Iterator[Any]:
  ```
* **EMG Regression:**
  ```python
  def run(self, sql: str, encoding: str | None = None) -> Iterator[Any]:
  ```
* **Impact:** `lexer.tokenize()` handles both string and raw byte inputs. By narrowing `sql` to `str`, EMG stripped support for byte-stream tokenization from the type signature.

### 3. Unused Typing Imports
* **Files:** `benchmarks/bench_group_comments.py`, `benchmarks/bench_grouping.py`, `benchmarks/bench_reindent_offset.py`, `sqlparse/filters/others.py`.
* **The Defect:** EMG imported `Callable` and `Any` from `collections.abc` and `typing`, but never referenced them in the body of the script.
* **Impact:** Unused imports fail strict linter rules (e.g., `flake8` F401, `ruff` F401) and pollute the module namespace.

### 4. Docstring Escape Sequence Warning (`benchmarks/bench_lexer_delimiters.py`)
* **The Defect:** A docstring containing escape sequences (e.g., `\s`, `\d`, or regex delimiters) was written as a standard triple-quoted string (`"""..."""`) instead of a raw string (`r"""..."""`).
* **Impact:** In Python 3.12+, invalid escape sequences emit a `SyntaxWarning`. In Python 3.14+, this will be elevated to a hard `SyntaxError`.

### 5. Engine Self-Mutation: Harvester Siphoning RAG Database
* **The Defect:** EMG targeted `SOVEREIGN-KERNEL/memory/vectors.jsonl` for optimization.
* **Root Cause:** The Harvester filter excluded `.json`, but did not exclude `.jsonl` or directory paths containing `SOVEREIGN-KERNEL/` and `.emg/`. As a result, EMG tried to "refactor" its own persistent neural memory.

### 6. The "Purging Poisoned Isolated-Compile Constraints" Commit Loop
* **The Defect:** The git history on `craighckby-stack/sqlparse` filled with dozens of repetitive commits titled:
  `EMG Core: Purging poisoned isolated-compile constraints from persistent ledger`
* **Root Cause:** In `src/App.tsx`, the ledger divergence check:
  ```typescript
  if (filteredContent !== content && !config.dryRun && config.ghToken)
  ```
  did not check whether `healCount > 0`. Because of line-ending mismatches (`\r\n` vs `\n`) or trailing newlines, `filteredContent !== content` evaluated to `true` continuously, firing repeated commits even when no poisoned entries existed.

---

## 5. Architectural Remediations Deployed Post-Run 3

To prevent these defects in future runs, the following engineering safeguards have been deployed and validated:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           EMG POST-RUN 3 UPGRADES                           │
├──────────────────────────┬──────────────────────────────────────────────────┤
│ Subsystem                │ Resolution Implemented                           │
├──────────────────────────┼──────────────────────────────────────────────────┤
│ 1. Anti-Defensive Gate   │ Injected Rule #13 into server.ts:                │
│    (server.ts)           │ Explicitly prohibits injecting isinstance() or   │
│                          │ TypeError checks into function signatures unless │
│                          │ already present in the original source code.     │
├──────────────────────────┼──────────────────────────────────────────────────┤
│ 2. Compiler Warning Gate │ Updated /api/validate to execute python3 with    │
│    (server.ts)           │ -W error; elevated escape sequence warnings to   │
│                          │ fatal errors, forcing raw strings (r""").        │
├──────────────────────────┼──────────────────────────────────────────────────┤
│ 3. Unused Import Linter  │ Added UNUSED_TYPING_IMPORT rule to /api/lint     │
│    (server.ts)           │ to flag and reject unreferenced typing imports   │
│                          │ (Callable, Any, Generator, Iterator, etc.).      │
├──────────────────────────┼──────────────────────────────────────────────────┤
│ 4. Siphon Guard          │ Hardened isOptimizableFile in validator.ts to    │
│    (validator.ts & App)  │ exclude .jsonl, .lock, SOVEREIGN-KERNEL/, and    │
│                          │ .emg/ paths permanently.                         │
├──────────────────────────┼──────────────────────────────────────────────────┤
│ 5. Ledger Commit Guard   │ Patched src/App.tsx to require healCount > 0 and │
│    (src/App.tsx)         │ normalized whitespace before committing ledger   │
│                          │ heals, completely stopping empty commit loops.   │
└──────────────────────────┴──────────────────────────────────────────────────┘
```

---

## 6. Takeaways & Readiness for Run #4

Run #3 demonstrated that EMG's core AST compilation gate works reliably to stop syntax crashes. However, it revealed that autonomous refactoring engines must respect **library ecosystem contracts**:
1. **Never invent runtime constraints:** Type annotations provide documentation and static analysis; injecting runtime `isinstance` checks breaks polymorphic consumers.
2. **Never narrow library parameter types:** If a parser accepts streams or bytes, narrowing the type to `str` creates immediate API friction.
3. **Keep internal memory separated from target codebases:** Memory stores like `.jsonl` vector ledgers must be immune to candidate file discovery.

With all five safeguards active, the pipeline has been hardened to produce clean, non-intrusive, production-safe Python refactors.
