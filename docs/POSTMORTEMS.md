# Neural Engine Post-Mortems

## Auto-Generated Lessons & Negative Constraints





### ❌ [2026-09-26] app/applet/src/engine/siphon-stamping.ts `source: mutation-cycle`
**Symptom:** AST / TypeScript Compiler Validation Rejected
**EVIDENCE (Machine-Copied Fact):**
```
Line 110, Col 4: Expression expected.
```
**DIAGNOSIS:** Unescaped markdown content leakage from prompt injection into raw TypeScript source code interpretation channels.
**CONSTRAINT (Model Generalization):** Ensure that system outputs match the exact requested format constraints without embedding external instruction text.
**FINGERPRINT:** `app/applet/src/engine/siphon-stamping.ts::Line _, Col _: Expression expected.` (Occurrences: 1)
**STATUS:** ACTIVE




### ❌ [2026-09-26] patch-server-diff.cjs `source: mutation-cycle`
**Symptom:** AST / TypeScript Compiler Validation Rejected
**EVIDENCE (Machine-Copied Fact):**
```
Line 14, Col 33: Type annotations can only be used in TypeScript files.
Line 21, Col 26: Type annotations can only be used in TypeScript files.
```
**DIAGNOSIS:** Inadvertent inclusion of conversational prompt instructions, compiler evidence, and system role definitions within a code optimization target file processed as CommonJS source.
**CONSTRAINT (Model Generalization):** Ensure target source files contain strictly executable JavaScript code without embedded prompt instructions, compiler evidence blocks, or diagnostic metadata.
**FINGERPRINT:** `patch-server-diff.cjs::Line _, Col _: Type annotations can only be used in TypeScript files. Line _, Col _: Type annotations can only be used in TypeScript files.` (Occurrences: 1)
**STATUS:** ACTIVE



### ❌ [2026-09-26] patch-server.cjs `source: mutation-cycle`
**Symptom:** AST / TypeScript Compiler Validation Rejected
**EVIDENCE (Machine-Copied Fact):**
```
Line 32, Col 54: Unterminated template literal.
[OUTPUT_LIKELY_TRUNCATED] The output is < 80% of original length and syntactically invalid. The model likely hit its output token limit.
```
**DIAGNOSIS:** Model generation exceeded maximum output token threshold for patch-server.cjs, terminating mid-string/delimiter before EOF.
**CONSTRAINT (Model Generalization):** File patch-server.cjs requires chunked diff generation or modular decomposition. Do NOT regenerate full file in a single completion pass.
**FINGERPRINT:** `patch-server.cjs::EOF_TRUNCATION` (Occurrences: 1)
**STATUS:** ACTIVE


### ❌ [2026-09-26] app/applet/src/engine/zero-leak-sandbox.ts `source: mutation-cycle`
**Symptom:** AST / TypeScript Compiler Validation Rejected
**EVIDENCE (Machine-Copied Fact):**
```
Line 71, Col 4: Expression expected.
```
**DIAGNOSIS:** Compiler/linter verification failure on app/applet/src/engine/zero-leak-sandbox.ts: Line 71, Col 4: Expression expected.
**CONSTRAINT (Model Generalization):** When mutating app/applet/src/engine/zero-leak-sandbox.ts, strictly satisfy AST parser constraints for rule: Line 71, Col 4: Expression expected.
**FINGERPRINT:** `app/applet/src/engine/zero-leak-sandbox.ts::Line _, Col _: Expression expected.` (Occurrences: 1)
**STATUS:** ACTIVE
