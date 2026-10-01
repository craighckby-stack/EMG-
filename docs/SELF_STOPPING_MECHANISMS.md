# Self-Stopping Point Architecture & Loop Prevention Mechanics

## Overview

In autonomous neural refactoring engines, infinite execution loops pose a major operational risk—wasting API quotas, generating redundant commits, and degrading code quality through over-optimization.

**EMG (Ephemeral Mind Gem)** enforces three primary self-stopping mechanisms in `src/App.tsx` that guarantee execution convergence and prevent infinite autonomous loops:

1. **Tree Fingerprint Saturation Lockout** (`config.saturatedTreeHash`)
2. **0-Diff Code Saturation Detection** (`normalizeCode()` Equality Check)
3. **3-Failure Consecutive Skip-List Logic** (`consecutiveFailuresRef`)

---

## 1. Tree Fingerprint Saturation Lockout

### Mechanism
Before executing a mutation cycle against a live GitHub repository, `src/App.tsx` computes a global cryptographic fingerprint of the entire repository file tree:

```typescript
// Compute a SHA-256 hash of the concatenated file paths and their respective SHAs
const currentTreeFingerprint = await computeSHA256(
  tree.map((t) => `${t.path}:${t.sha}`).join('|')
);
```

### Execution Flow
1. If all candidate files in the repository have reached saturation (no remaining diffs), `src/App.tsx` records `config.saturatedTreeHash = currentTreeFingerprint` and `config.saturatedGoal = config.goal`.
2. On subsequent cycles, `executeCycle()` evaluates:
   ```typescript
   // Check if the current tree state and goal match a previously saturated execution
   if (
     config.saturatedTreeHash === currentTreeFingerprint &&
     config.saturatedGoal === config.goal &&
     !config.postmortemConstraints?.includes('[MANUAL_OVERRIDE]')
   ) {
     pushLog(`[REFUSAL] Repository at saturation (Baseline SHA: ${currentTreeFingerprint.slice(0, 12)}...).`, 'warning');
     setIsLive(false);
     setStatus('IDLE');
     return;
   }
   ```
3. **Refusal Protocol**: The engine explicitly refuses to dispatch Gemini API calls or re-evaluate the repository until an external change occurs (such as new user commits, updated ledger constraints, or a goal modification).

---

## 2. 0-Diff Code Saturation Detection

### Mechanism
When Gemini returns an optimized candidate for a file, `src/App.tsx` normalizes whitespace and compares the generated code directly against the original file content:

```typescript
// Normalize code strings by stripping trailing whitespace and trimming outer bounds
const normalizeCode = (c: string) => c.split('\n').map((l) => l.trimEnd()).join('\n').trim();
const isIdentical = normalizeCode(cleanCode) === normalizeCode(originalContent);
```

### Execution Flow
1. **No-Op Classification**: If `isIdentical === true` ($0\text{-diff}$), no commit is attempted. The engine emits a `[NO-OP]` telemetry event:
   `[NO-OP] Code saturation reached for [filePath]: AI generated identical content (0 diffs). Commit skipped.`
2. **Auto-Skip vs. Human Intercept**:
   - **Auto-Approve Enabled (`config.autoApproveSaturated === true`)**:
     The file is automatically added to `config.skippedFiles` so subsequent round-robin passes skip it without pausing the loop.
   - **Auto-Approve Disabled (`config.autoApproveSaturated === false`)**:
     The autonomous loop auto-pauses (`setIsLive(false)`), sets status to `IDLE`, and opens the `SaturationAlert` modal requesting human review.
3. **Global Convergence**:
   When all candidate files in `candidateTree` are present in `config.skippedFiles`, `src/App.tsx` emits:
   `[GLOBAL SATURATION REACHED] No remaining diffs under current constraints. The repository is converged. 🏁`

---

## 3. 3-Failure Consecutive Skip-List Logic

### Mechanism
To prevent the engine from repeatedly attempting broken mutations on files that consistently fail AST compiler validation or heuristic linting, `src/App.tsx` maintains an in-memory reference counter:

```typescript
// Maintain a mapping of file paths to consecutive failure counts in memory
const consecutiveFailuresRef = useRef<Record<string, number>>({});
```

### Execution Flow
1. **Failure Escalation**: When strict type validation or heuristic linter rules reject a candidate mutation, the counter increments for that file:
   ```typescript
   // Increment failure count for the target file
   const prevFail = consecutiveFailuresRef.current[targetFile.path] || 0;
   const newFailCount = prevFail + 1;
   consecutiveFailuresRef.current[targetFile.path] = newFailCount;
   ```
2. **Threshold Circuit Breaker**: If `newFailCount >= 3`:
   - The engine logs:
     `[AUTONOMOUS LOOP] File [filePath] rejected ${newFailCount} consecutive times. Added to skip list to allow loop to proceed to other files.`
   - The file is added to `config.skippedFiles`, removing it from the active candidate rotation.
3. **Global Failure Circuit Breaker**: If *all* healthy candidate files in the repository reach the 3-failure ceiling:
   ```typescript
   // Halt execution if all candidates exceed the failure threshold
   pushLog(`[AUTONOMOUS LOOP] All candidate files have reached max failure threshold. Pausing loop to prevent infinite cycling.`, 'warning');
   setIsLive(false);
   setStatus('IDLE');
   ```

---

## Summary Matrix

| Mechanism | Trigger Condition | Enforcement Action | Goal |
| :--- | :--- | :--- | :--- |
| **Tree Fingerprint Saturation** | `treeHash` & `goal` match prior saturated state | Emits `[REFUSAL]`, pauses loop | Prevents redundant API calls on unchanged repos |
| **0-Diff Saturation Check** | `normalizeCode(clean) === normalizeCode(original)` | Skips commit, logs `[NO-OP]`, auto-skips or triggers modal | Prevents zero-value Git commits |
| **3-Failure Circuit Breaker** | `consecutiveFailuresRef >= 3` | Adds file to `skippedFiles`, pauses loop if all fail | Prevents infinite retry loops on broken files |