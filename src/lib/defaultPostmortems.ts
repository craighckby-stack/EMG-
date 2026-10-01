export const DEFAULT_POSTMORTEMS_MD = `# Neural Engine Post-Mortems

## System Overview & Constraint Mechanics

> **Executive Summary**
> This file tracks architectural post-mortems, regression records, and constraint mechanisms for the Neural Engine.

### ❌ [2026-09-12] compare.js \`source: mutation-cycle\`
**Symptom:** AST / TypeScript Compiler Validation Rejected
**EVIDENCE (Machine-Copied Fact):**
\`\`\`
Line 8, Col 11: 'interface' declarations can only be used in TypeScript files.
Line 16, Col 11: 'interface' declarations can only be used in TypeScript files.
Line 25, Col 11: 'interface' declarations can only be used in TypeScript files.
Line 32, Col 18: 'interface' declarations can only be used in TypeScript files.
Line 41, Col 41: Type annotations can only be used in TypeScript files.
Line 41, Col 50: Type annotations can only be used in TypeScript files.
Line 61, Col 47: Type annotations can only be used in TypeScript files.
Line 61, Col 56: Type annotations can only be used in TypeScript files.
Line 67, Col 18: Type annotations can only be used in TypeScript files.
Line 69, Col 16: Type annotations can only be used in TypeScript files.
Line 72, Col 24: Non-null assertions can only be used in TypeScript files.
Line 114, Col 10: Type annotations can only be used in TypeScript files.
Line 115, Col 9: Type annotations can only be used in TypeScript files.
Line 116, Col 11: Type annotations can only be used in TypeScript files.
Line 117, Col 8: The '?' modifier can only be used in TypeScript files.
Line 117, Col 11: Type annotations can only be used in TypeScript files.
Line 118, Col 4: Type annotations can only be used in TypeScript files.
Line 120, Col 18: Type annotations can only be used in TypeScript files.
Line 148, Col 48: Type assertion expressions can only be used in TypeScript files.
Line 154, Col 24: Type annotations can only be used in TypeScript files.
Line 178, Col 55: Type annotations can only be used in TypeScript files.
Line 178, Col 77: Type annotations can only be used in TypeScript files.
\`\`\`
**CONSTRAINT (Model Generalization):** Never repeat code patterns that produce this compiler/linter error on compare.js.

### ❌ [2026-09-12] .next_dev/types/app/api/brain/route.ts \`source: mutation-cycle\`
**Symptom:** AST / TypeScript Compiler Validation Rejected
**EVIDENCE (Machine-Copied Fact):**
\`\`\`
Line 35, Col 12: Property declaration is missing its type annotation.
[OUTPUT_LIKELY_TRUNCATED] The output is < 80% of original length and syntactically invalid. The model likely hit its output token limit.
\`\`\`
**CONSTRAINT (Model Generalization):** Never repeat code patterns that produce this compiler/linter error on .next_dev/types/app/api/brain/route.ts.

### ❌ [2026-09-12] fix_propose.js \`source: mutation-cycle\`
**Symptom:** AST / TypeScript Compiler Validation Rejected
**EVIDENCE (Machine-Copied Fact):**
\`\`\`
Line 54, Col 2: Expression expected.
Line 54, Col 1: Decorators are not valid here.
\`\`\`
**CONSTRAINT (Model Generalization):** Never repeat code patterns that produce this compiler/linter error on fix_propose.js.

### ❌ [2026-09-12] src/components/FolderScanner.tsx \`source: mutation-cycle\`
**Symptom:** AST / TypeScript Compiler Validation Rejected
**EVIDENCE (Machine-Copied Fact):**
\`\`\`
Line 179, Col 8: Property declaration is missing its type annotation.
Line 192, Col 8: Property declaration is missing its type annotation.
\`\`\`
**CONSTRAINT (Model Generalization):** Never repeat code patterns that produce this compiler/linter error on src/components/FolderScanner.tsx.
`;