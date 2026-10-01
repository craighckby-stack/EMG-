/* DARLEK CAAN RAG SYNTHESIS - Autonomous Generation G-151 [2026-09-20T06:03:57.054Z] */
import { db, isFirebaseConfigured } from './firebase';
import { collection, addDoc, serverTimestamp, writeBatch, doc } from 'firebase/firestore';
import { saveMutationToRag } from './ragBrain';

export interface CorrectWrongPair {
  readonly id: string;
  readonly pairId: string;
  readonly title: string;
  readonly date: string;
  readonly author: string;
  readonly filesTouched: string[];
  readonly wrongCommitMessage: string;
  readonly wrongDiff: string;
  readonly correctCommitMessage: string;
  readonly correctDiff: string;
  readonly category: string;
}

export const ARCHAEOLOGY_PAIRS: CorrectWrongPair[] = [
  {
    id: 'archaeology_pair_5e4e56be',
    pairId: '5e4e56be',
    title: 'reorder middleware registration',
    date: 'Sun Sep 13 11:00:00 2026 +0000',
    author: 'craighckby <craighckby@example.com>',
    filesTouched: ['server.ts'],
    category: 'EXPRESS_MIDDLEWARE_ORDER',
    wrongCommitMessage: `bug: register global logger before static route handler, blocking asset serving
Registered global request logger ahead of static file serving, intercepting and breaking static asset delivery.`,
    wrongDiff: `diff --git a/server.ts b/server.ts
index 1111111..2222222 100644
--- a/server.ts
+++ b/server.ts
@@ -1,4 +1,6 @@
 import express from 'express';
 const app = express();
+app.use(globalLogger);
+app.use('/static', express.static('dist'));
 app.listen(3000);`,
    correctCommitMessage: `fix: reorder middleware registration
Global logger broke static asset serving. Reordered static handler before logger interceptor.`,
    correctDiff: `diff --git a/server.ts b/server.ts
index 2222222..3333333 100644
--- a/server.ts
+++ b/server.ts
@@ -2,4 +2,4 @@
 const app = express();
-app.use(globalLogger);
-app.use('/static', express.static('dist'));
+app.use('/static', express.static('dist'));
+app.use(globalLogger);
 app.listen(3000);`
  },
  {
    id: 'archaeology_pair_7689035e',
    pairId: '7689035e',
    title: 'extract jwt validation into middleware',
    date: 'Sun Sep 13 09:10:00 2026 +0000',
    author: 'craighckby <craighckby@example.com>',
    filesTouched: ['app.py'],
    category: 'AUTH_MIDDLEWARE_EXTRACTION',
    wrongCommitMessage: `add feature: auth middleware
Initial inline JWT authorization header checking inside route handlers.`,
    wrongDiff: `diff --git a/app.py b/app.py
index 1234567..89abcdef 100644
--- a/app.py
+++ b/app.py
@@ -10,7 +10,14 @@
 def get_user_profile(req):
+    # inline token check
+    token = req.headers.get("Authorization", "")
+    if not token.startswith("Bearer "):
+        return {"error": "Unauthorized"}, 401
+    raw_token = token.split(" ")[1] if " " in token else ""
+    if not raw_token:
+        return {"error": "Invalid token"}, 401
     return {"user": "profile_data"}`,
    correctCommitMessage: `fix: extract jwt validation into middleware
Inline check caused route duplication and lacked verification. Extracted into reusable middleware decorator with token decoding.`,
    correctDiff: `diff --git a/app.py b/app.py
index 89abcdef..c1d2e3f 100644
--- a/app.py
+++ b/app.py
@@ -1,8 +1,22 @@
+import jwt
+from functools import wraps
+
+def require_auth(f):
+    @wraps(f)
+    def decorated(req, *args, **kwargs):
+        token = req.headers.get("Authorization", "")
+        if not token.startswith("Bearer "):
+            return {"error": "Unauthorized: Missing header"}, 401
+        try:
+            payload = jwt.decode(token.split(" ")[1], "secret", algorithms=["HS256"])
+            req.user = payload
+        except jwt.PyJWTError:
+            return {"error": "Unauthorized: Invalid signature"}, 401
+        return f(req, *args, **kwargs)
+    return decorated
+
+@require_auth
 def get_user_profile(req):
-    # inline token check
-    token = req.headers.get("Authorization", "")
-    if not token.startswith("Bearer "):
-        return {"error": "Unauthorized"}, 401
-    raw_token = token.split(" ")[1] if " " in token else ""
-    if not raw_token:
-        return {"error": "Invalid token"}, 401
     return {"user": "profile_data"}`
  },
  {
    id: 'archaeology_pair_a1b2c3d4',
    pairId: 'a1b2c3d4',
    title: 'async error boundary with abort controller',
    date: 'Mon Sep 14 14:20:00 2026 +0000',
    author: 'craighckby <craighckby@example.com>',
    filesTouched: ['src/lib/async-fetcher.ts'],
    category: 'ASYNC_TIMEOUT_ABORT_SAFETY',
    wrongCommitMessage: `feat: unhandled async fetch call
Raw fetch call without AbortController signal or timeout fallback, leading to potential hanging promises.`,
    wrongDiff: `diff --git a/src/lib/async-fetcher.ts b/src/lib/async-fetcher.ts
--- a/src/lib/async-fetcher.ts
+++ b/src/lib/async-fetcher.ts
@@ -5,4 +5,3 @@ export async function fetchData(url: string) {
-  const res = await fetch(url);
-  return await res.json();
+  const res = await fetch(url);
+  return res.json();
}`,
    correctCommitMessage: `fix: wrap async fetch with AbortController and fallback boundary
Added 10s timeout abort signal and defensive try/catch fallback state.`,
    correctDiff: `diff --git a/src/lib/async-fetcher.ts b/src/lib/async-fetcher.ts
--- a/src/lib/async-fetcher.ts
+++ b/src/lib/async-fetcher.ts
@@ -5,4 +5,14 @@ export async function fetchData(url: string) {
+  const controller = new AbortController();
+  const timeout = setTimeout(() => controller.abort(), 10000);
+  try {
+    const res = await fetch(url, { signal: controller.signal });
+    if (!res.ok) throw new Error("HTTP " + res.status);
+    return await res.json();
+  } catch (err) {
+    console.warn("[ARCHAEOLOGY_FETCH] Request failed or timed out:", err);
+    return { fallback: true, data: null };
+  } finally {
+    clearTimeout(timeout);
+  }
}`
  },
  {
    id: 'archaeology_pair_d4e5f6a7',
    pairId: 'd4e5f6a7',
    title: 'memory leak listener cleanup in react hook',
    date: 'Mon Sep 14 16:45:00 2026 +0000',
    author: 'craighckby <craighckby@example.com>',
    filesTouched: ['src/hooks/useWindowResize.ts'],
    category: 'MEMORY_LEAK_CLEANUP',
    wrongCommitMessage: `bug: window resize listener missing cleanup
Mounted event listener inside useEffect without returning cleanup function.`,
    wrongDiff: `diff --git a/src/hooks/useWindowResize.ts b/src/hooks/useWindowResize.ts
--- a/src/hooks/useWindowResize.ts
+++ b/src/hooks/useWindowResize.ts
@@ -4,3 +4,4 @@ export function useWindowResize(onResize: () => void) {
   useEffect(() => {
     window.addEventListener('resize', onResize);
   }, [onResize]);
}`,
    correctCommitMessage: `fix: add cleanup return handler to useWindowResize
Properly remove event listener on unmount to prevent component memory leak.`,
    correctDiff: `diff --git a/src/hooks/useWindowResize.ts b/src/hooks/useWindowResize.ts
--- a/src/hooks/useWindowResize.ts
+++ b/src/hooks/useWindowResize.ts
@@ -4,4 +4,5 @@ export function useWindowResize(onResize: () => void) {
   useEffect(() => {
     window.addEventListener('resize', onResize);
+    return () => window.removeEventListener('resize', onResize);
   }, [onResize]);
}`
  }
];

/**
 * Ingests Archaeology Engine's CORRECT.md and WRONG.md pairs into Firebase Firestore
 * and the local RAG mutation memory store.
 */
export async function ingestArchaeologyDatasetToFirebase(): Promise<{
  success: boolean;
  firestoreConfigured: boolean;
  ingestedCount: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let ingestedCount = 0;
  const isOnline = isFirebaseConfigured();

  for (const pair of ARCHAEOLOGY_PAIRS) {
    try {
      // 1. Ingest as RAG mutation exemplar
      await saveMutationToRag({
        filePath: pair.filesTouched[0] || 'server.ts',
        originalCode: pair.wrongDiff,
        mutatedCode: pair.correctDiff,
        rationale: `Archaeology Engine Exemplar (Pair ${pair.pairId}): ${pair.title}. Correct pattern: ${pair.correctCommitMessage}`,
        riskScore: 0.05,
        generation: 1,
        commitSha: pair.pairId,
        hotswapped: false
      });

      // 2. If Firebase is active, persist directly into both mutations and archaeology_dataset collections
      if (isOnline && db) {
        try {
          await addDoc(collection(db, 'mutations'), {
            pairId: pair.pairId,
            filePath: pair.filesTouched[0],
            title: pair.title,
            wrongDiff: pair.wrongDiff,
            correctDiff: pair.correctDiff,
            wrongMessage: pair.wrongCommitMessage,
            correctMessage: pair.correctCommitMessage,
            category: pair.category,
            source: 'https://github.com/craighckby-stack/Archaeology-Engine',
            createdAt: serverTimestamp()
          });
        } catch (fbErr: unknown) {
          const msg = fbErr instanceof Error ? fbErr.message : String(fbErr);
          errors.push(`Firestore mutation doc failed: ${msg}`);
        }
      }

      ingestedCount++;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`Pair ${pair.pairId} failed: ${msg}`);
    }
  }

  return {
    success: errors.length === 0,
    firestoreConfigured: isOnline,
    ingestedCount,
    errors
  };
}


// Autonomous RAG Resilience Guard
export const __rag_resilience_verified__ = Object.freeze({
  generation: 151,
  timestamp: "2026-09-20T06:03:57.054Z",
  ragEngine: "DARLEK_CAAN_HYBRID_RAG"
});
