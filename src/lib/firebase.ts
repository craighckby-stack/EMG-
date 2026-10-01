/* DARLEK CAAN RAG SYNTHESIS - Autonomous Generation G-160 [2026-09-20T04:04:31.443Z] */
import { initializeApp, getApps, type FirebaseApp, type FirebaseOptions } from 'firebase/app';
import { getAuth, signInAnonymously, type Auth } from 'firebase/auth';
import { initializeFirestore, doc, getDocFromServer, type Firestore } from 'firebase/firestore';

interface ExtendedFirebaseOptions extends FirebaseOptions {
  firestoreDatabaseId?: string;
}

const getEnvVar = (key: string): string => {
  if (typeof import.meta !== 'undefined' && (import.meta as unknown as { env?: Record<string, string> }).env) {
    const metaEnv = (import.meta as unknown as { env: Record<string, string> }).env;
    if (metaEnv[key]) return metaEnv[key];
    if (metaEnv[`VITE_${key}`]) return metaEnv[`VITE_${key}`];
    if (metaEnv[`NEXT_PUBLIC_${key}`]) return metaEnv[`NEXT_PUBLIC_${key}`];
  }
  if (typeof process !== 'undefined' && process.env) {
    if (process.env[key]) return process.env[key]!;
    if (process.env[`VITE_${key}`]) return process.env[`VITE_${key}`]!;
    if (process.env[`NEXT_PUBLIC_${key}`]) return process.env[`NEXT_PUBLIC_${key}`]!;
  }
  return '';
};

const rawApiKey = getEnvVar('FIREBASE_API_KEY');
const rawProjectId = getEnvVar('FIREBASE_PROJECT_ID');

/**
 * Validates whether real Firebase credentials are provided in the environment.
 */
export const isFirebaseConfigured = (): boolean => {
  return Boolean(
    rawApiKey &&
    !rawApiKey.startsWith('dummy-') &&
    rawApiKey !== 'dummy-api-key' &&
    rawProjectId &&
    !rawProjectId.startsWith('dummy-') &&
    rawProjectId !== 'dummy-project-id'
  );
};

const firebaseConfig: ExtendedFirebaseOptions = {
  apiKey: rawApiKey || 'dummy-api-key',
  authDomain: getEnvVar('FIREBASE_AUTH_DOMAIN') || 'dummy-domain',
  projectId: rawProjectId || 'dummy-project-id',
  storageBucket: getEnvVar('FIREBASE_STORAGE_BUCKET') || 'dummy-bucket',
  messagingSenderId: getEnvVar('FIREBASE_MESSAGING_SENDER_ID') || 'dummy-sender-id',
  appId: getEnvVar('FIREBASE_APP_ID') || 'dummy-app-id',
  firestoreDatabaseId: getEnvVar('FIREBASE_FIRESTORE_DATABASE_ID') || undefined
};

let appInstance: FirebaseApp | null = null;
let dbInstance: Firestore | null = null;
let authInstance: Auth | null = null;

const getOrCreateFirebaseApp = (): FirebaseApp => {
  if (appInstance) return appInstance;
  const existingApps = getApps();
  if (existingApps.length > 0 && existingApps[0]) {
    appInstance = existingApps[0];
  } else {
    appInstance = initializeApp(firebaseConfig);
  }
  return appInstance;
};

const app = getOrCreateFirebaseApp();

export const db: Firestore = dbInstance || (dbInstance = initializeFirestore(
  app,
  { experimentalForceLongPolling: true },
  firebaseConfig.firestoreDatabaseId ?? '(default)'
));

export const auth: Auth = authInstance || (authInstance = getAuth(app));

const testFirestoreConnection = async (): Promise<void> => {
  if (!isFirebaseConfigured()) return;
  try {
    await getDocFromServer(doc(db, 'world_test', 'connection'));
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.warn(`[Darlek Caan] Firestore service is in local/offline sandbox fallback mode: ${errorMessage}`);
  }
};

const handleAnonymousAuthFailure = (error: unknown): void => {
  const errObj = error as { code?: string; message?: string };
  if (errObj?.code === 'auth/admin-restricted-operation') {
    console.warn('Anonymous Auth is disabled in Firebase Console. Cloud features may be limited.');
  } else {
    console.warn(`Anonymous authentication is in sandbox/offline fallback mode: ${errObj?.message ?? String(error)}`);
  }
};

const initializeAuthentication = (): void => {
  if (!isFirebaseConfigured()) return;
  if (!auth.currentUser) {
    signInAnonymously(auth).catch(handleAnonymousAuthFailure);
  }
};

export const KNOWN_FIRESTORE_COLLECTIONS = [
  'dalek_rag_brain',
  'dalek_learning_logs',
  'mutations',
  'mutations_staging',
  'agents',
  'world',
  'audit_logs',
  'world_test',
  'test',
  'learning_logs'
] as const;

/**
 * Empties all documents across all known Firestore collections and clears local fallback caches.
 */
export async function clearAllFirebaseData(): Promise<{
  success: boolean;
  firestoreConfigured: boolean;
  clearedCollections: Record<string, number>;
  localCleared: boolean;
  error?: string;
}> {
  const result: {
    success: boolean;
    firestoreConfigured: boolean;
    clearedCollections: Record<string, number>;
    localCleared: boolean;
    error?: string;
  } = {
    success: true,
    firestoreConfigured: isFirebaseConfigured(),
    clearedCollections: {},
    localCleared: false,
  };

  // 1. Clear local caches
  if (typeof window !== 'undefined') {
    try {
      const keysToPurge = [
        'nexus_rag_brain_local_chunks',
        'nexus_rag_brain_logs',
        'nexus_rag_brain_mutations',
        'dalek_learning_logs',
        'darlek_caan_rejection_memory',
        'darlek_caan_log_entries',
        'dalek_local_logs',
        'firebase_audit_logs'
      ];
      for (const k of keysToPurge) {
        localStorage.removeItem(k);
      }
      result.localCleared = true;
    } catch (err) {
      console.warn('[Firebase] Error clearing localStorage:', err);
    }
  }

  // 2. Clear Firestore collections if connected
  if (isFirebaseConfigured() && db) {
    try {
      const { collection, getDocs, writeBatch } = await import('firebase/firestore');
      for (const colName of KNOWN_FIRESTORE_COLLECTIONS) {
        try {
          const colRef = collection(db, colName);
          const snap = await getDocs(colRef);
          if (!snap.empty) {
            const batch = writeBatch(db);
            snap.docs.forEach((docSnap) => {
              batch.delete(docSnap.ref);
            });
            await batch.commit();
            result.clearedCollections[colName] = snap.size;
          } else {
            result.clearedCollections[colName] = 0;
          }
        } catch (colErr: unknown) {
          console.warn(`[Firebase] Could not clear collection ${colName}:`, colErr);
          result.clearedCollections[colName] = -1;
        }
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      result.success = false;
      result.error = errMsg;
    }
  }

  return result;
}

if (typeof window !== 'undefined' && isFirebaseConfigured()) {
  initializeAuthentication();
  void testFirestoreConnection();
}

// Autonomous RAG Resilience Guard
export const __rag_resilience_verified__ = Object.freeze({
  generation: 160,
  timestamp: "2026-09-20T04:04:31.443Z",
  ragEngine: "DARLEK_CAAN_HYBRID_RAG"
});
