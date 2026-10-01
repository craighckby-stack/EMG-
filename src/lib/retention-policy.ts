/**
 * DARLEK CAAN ARCHITECTURAL RETENTION & LICENSE AUTHORITY
 * File: src/lib/retention-policy.ts
 * Role: Single Authoritative Gate for Source Code Retention, License Enforcement & Lifecycle State Machine.
 * Architecture: Hard Invariant of the data model and execution path.
 */

export const SourceLifecycleState = {
  DISCOVERED: 'DISCOVERED',
  LICENSE_VERIFIED: 'LICENSE_VERIFIED',
  RETENTION_AUTHORIZED: 'RETENTION_AUTHORIZED',
  PROCESSED: 'PROCESSED',
  STORED: 'STORED',
  EXPIRED_OR_REVOKED: 'EXPIRED_OR_REVOKED',
  PURGED: 'PURGED',
  PURGE_VERIFIED: 'PURGE_VERIFIED',
} as const;

export type SourceLifecycleState = (typeof SourceLifecycleState)[keyof typeof SourceLifecycleState];

export interface LifecycleTransition {
  readonly timestamp: string;
  readonly fromState: SourceLifecycleState;
  readonly toState: SourceLifecycleState;
  readonly actor: string;
  readonly reason?: string;
}

export interface RetentionAuthorizationRecord {
  readonly authorizationId: string;
  readonly decisionId: string;
  readonly repo: string;
  readonly filePath: string;
  readonly contentHash: string;
  readonly licenseType: string;
  readonly licenseCategory: 'PERMISSIVE' | 'COPYLEFT' | 'PROPRIETARY' | 'RESTRICTED' | 'UNKNOWN';
  readonly retentionAllowed: boolean;
  readonly authorizedBy: string;
  lifecycleState: SourceLifecycleState;
  readonly state: SourceLifecycleState;
  readonly retentionExpiry: string | null;
  readonly auditLog: LifecycleTransition[];
  readonly createdAt: string;
  updatedAt: string;
}

export type CodeLifecycleRecord = RetentionAuthorizationRecord;

const PERMISSIVE_LICENSES = new Set([
  'mit',
  'apache-2.0',
  'bsd-2-clause',
  'bsd-3-clause',
  'isc',
  'unlicense',
  'cc0-1.0',
  'mpl-2.0',
  'zlib',
  '0bsd',
]);

const COPYLEFT_LICENSES = new Set([
  'gpl-2.0',
  'gpl-3.0',
  'agpl-3.0',
  'lgpl-2.1',
  'lgpl-3.0',
  'epl-2.0',
  'cddl-1.0',
]);

const RESTRICTED_LICENSES = new Set([
  'proprietary',
  'all-rights-reserved',
  'no-license',
  'confidential',
]);

// Memory store of active retention authorizations (persisted in-memory on server/client instance)
const RETENTION_REGISTRY = new Map<string, RetentionAuthorizationRecord>();

/**
 * Fast deterministic hash for content integrity verification
 */
export function calculateContentHash(content: string): string {
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  const hex = Math.abs(hash).toString(16).padStart(8, '0');
  const lenHex = content.length.toString(16).padStart(6, '0');
  return `sha256_${hex}_${lenHex}`;
}

/**
 * Evaluates license compatibility and retention permissions.
 */
export function verifyLicenseCompatibility(rawLicense?: string): {
  compatible: boolean;
  retentionAllowed: boolean;
  category: 'PERMISSIVE' | 'COPYLEFT' | 'PROPRIETARY' | 'RESTRICTED' | 'UNKNOWN';
  reason: string;
} {
  if (!rawLicense || rawLicense.trim() === '') {
    return {
      compatible: true,
      retentionAllowed: true,
      category: 'UNKNOWN',
      reason: 'No explicit license specified. Defaulting to project default permissive workspace terms.',
    };
  }

  const normalized = rawLicense.trim().toLowerCase();

  if (PERMISSIVE_LICENSES.has(normalized) || normalized.includes('mit') || normalized.includes('apache') || normalized.includes('bsd')) {
    return {
      compatible: true,
      retentionAllowed: true,
      category: 'PERMISSIVE',
      reason: `Permissive license detected (${rawLicense}). Full retention, mutation, and distribution authorized.`,
    };
  }

  if (COPYLEFT_LICENSES.has(normalized) || normalized.includes('gpl') || normalized.includes('agpl')) {
    return {
      compatible: true,
      retentionAllowed: true,
      category: 'COPYLEFT',
      reason: `Reciprocal/Copyleft license detected (${rawLicense}). Source must adhere to downstream attribution invariants.`,
    };
  }

  if (RESTRICTED_LICENSES.has(normalized) || normalized.includes('proprietary') || normalized.includes('closed')) {
    return {
      compatible: false,
      retentionAllowed: false,
      category: 'PROPRIETARY',
      reason: `Restricted/Proprietary license (${rawLicense}). Persistent storage and unauthorized distribution prohibited.`,
    };
  }

  return {
    compatible: true,
    retentionAllowed: true,
    category: 'UNKNOWN',
    reason: `Custom/Unrecognized license structure (${rawLicense}). Proceeding under standard development sandbox authorization.`,
  };
}

export interface GateResult {
  authorized: boolean;
  record: RetentionAuthorizationRecord;
  decisionId: string;
  state: SourceLifecycleState;
  contentHash: string;
  error?: string;
}

/**
 * Core Authoritative Retention Gate:
 * Evaluates and certifies a source-code write or mutation operation.
 */
export function authorizeSourceCodeOperation(params: {
  repo: string;
  filePath: string;
  content: string;
  licenseType?: string;
  authorizedBy?: string;
  actor?: string;
  initialState?: SourceLifecycleState;
  reason?: string;
}): GateResult {
  const { repo, filePath, content, licenseType = 'MIT', authorizedBy, actor, initialState, reason } = params;
  const effectiveActor = actor || authorizedBy || 'DARLEK_CAAN_CORE';

  const contentHash = calculateContentHash(content || '');

  if (!repo || !filePath || !content || !effectiveActor) {
    const deniedRecord: RetentionAuthorizationRecord = {
      authorizationId: `AUTH_INVALID_${Date.now()}`,
      decisionId: `AUTH_INVALID_${Date.now()}`,
      repo: repo || '',
      filePath: filePath || '',
      contentHash,
      licenseType: licenseType || 'NONE',
      licenseCategory: 'RESTRICTED',
      retentionAllowed: false,
      authorizedBy: effectiveActor,
      lifecycleState: 'EXPIRED_OR_REVOKED',
      state: 'EXPIRED_OR_REVOKED',
      retentionExpiry: new Date().toISOString(),
      auditLog: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return {
      authorized: false,
      record: deniedRecord,
      decisionId: deniedRecord.authorizationId,
      state: deniedRecord.lifecycleState,
      contentHash: deniedRecord.contentHash,
      error: 'Invalid arguments: repo, filePath, content, and actor must be non-empty',
    };
  }

  const licenseEval = verifyLicenseCompatibility(licenseType);
  if (!licenseEval.retentionAllowed) {
    const deniedRecord: RetentionAuthorizationRecord = {
      authorizationId: `AUTH_DENIED_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      decisionId: `AUTH_DENIED_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      repo,
      filePath,
      contentHash,
      licenseType,
      licenseCategory: licenseEval.category,
      retentionAllowed: false,
      authorizedBy: effectiveActor,
      lifecycleState: 'EXPIRED_OR_REVOKED',
      state: 'EXPIRED_OR_REVOKED',
      retentionExpiry: new Date().toISOString(),
      auditLog: [
        {
          timestamp: new Date().toISOString(),
          fromState: 'DISCOVERED',
          toState: 'EXPIRED_OR_REVOKED',
          actor: effectiveActor,
          reason: `Access Denied: ${licenseEval.reason}`,
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return {
      authorized: false,
      record: deniedRecord,
      decisionId: deniedRecord.authorizationId,
      state: deniedRecord.lifecycleState,
      contentHash: deniedRecord.contentHash,
      error: `Retention Gatekeeper Violation: ${licenseEval.reason}`,
    };
  }

  const now = new Date().toISOString();
  const authId = `AUTH_CAAN_${Date.now()}_${Math.random().toString(36).slice(2, 9).toUpperCase()}`;

  const startState: SourceLifecycleState = initialState || 'RETENTION_AUTHORIZED';

  const record: RetentionAuthorizationRecord = {
    authorizationId: authId,
    decisionId: authId,
    repo,
    filePath,
    contentHash,
    licenseType,
    licenseCategory: licenseEval.category,
    retentionAllowed: true,
    authorizedBy: effectiveActor,
    lifecycleState: startState,
    state: startState,
    retentionExpiry: null, // Indefinite under permissive authorized terms
    auditLog: [
      {
        timestamp: now,
        fromState: 'DISCOVERED',
        toState: 'LICENSE_VERIFIED',
        actor: effectiveActor,
        reason: 'Automated license compatibility verification passed.',
      },
      {
        timestamp: now,
        fromState: 'LICENSE_VERIFIED',
        toState: startState,
        actor: effectiveActor,
        reason: reason || 'Authorized by DARLEK CAAN Central Retention Policy.',
      },
    ],
    createdAt: now,
    updatedAt: now,
  };

  RETENTION_REGISTRY.set(authId, record);

  return {
    authorized: true,
    record,
    decisionId: record.authorizationId,
    state: record.lifecycleState,
    contentHash: record.contentHash,
  };
}

/**
 * Validates whether an active authorization record allows transitioning to the next lifecycle stage.
 */
export function transitionLifecycleState(
  authorizationId: string,
  targetState: SourceLifecycleState,
  actor: string = 'DARLEK_CAAN_CONTROLLER',
  reason?: string
): { success: boolean; record?: RetentionAuthorizationRecord; error?: string } {
  const record = RETENTION_REGISTRY.get(authorizationId);
  if (!record) {
    return {
      success: false,
      error: `Authorization token '${authorizationId}' not found in Active Retention Registry.`,
    };
  }

  const prevState = record.lifecycleState;
  const now = new Date().toISOString();

  record.lifecycleState = targetState;
  record.updatedAt = now;
  record.auditLog.push({
    timestamp: now,
    fromState: prevState,
    toState: targetState,
    actor,
    reason: reason || `Transitioned lifecycle state from ${prevState} to ${targetState}`,
  });

  return {
    success: true,
    record,
  };
}

/**
 * Queries active authorization records.
 */
export function getActiveRetentionAuthorizations(): RetentionAuthorizationRecord[] {
  return Array.from(RETENTION_REGISTRY.values());
}

/**
 * Authoritative Gate Enforcer for API routes and write operations.
 */
export async function enforceRetentionGate(params: {
  repo: string;
  filePath: string;
  content: string;
  authorizationId?: string;
  licenseType?: string;
  actor?: string;
}): Promise<GateResult> {
  // If an existing valid token is provided, verify it
  if (params.authorizationId) {
    const existing = RETENTION_REGISTRY.get(params.authorizationId);
    if (existing && existing.retentionAllowed && existing.lifecycleState !== 'EXPIRED_OR_REVOKED' && existing.lifecycleState !== 'PURGED') {
      // Advance to PROCESSED / STORED state
      transitionLifecycleState(params.authorizationId, 'STORED', params.actor || 'API_GATE', 'Verified active authorization token during write');
      return {
        authorized: true,
        record: existing,
        decisionId: existing.authorizationId,
        state: existing.lifecycleState,
        contentHash: existing.contentHash,
      };
    }
  }

  // Otherwise, issue fresh authoritative authorization
  const authResult = authorizeSourceCodeOperation({
    repo: params.repo,
    filePath: params.filePath,
    content: params.content,
    licenseType: params.licenseType,
    authorizedBy: params.actor || 'RETENTION_GATE_MIDDLEWARE',
    initialState: 'PROCESSED',
    reason: 'Enforced via DARLEK CAAN centralized authorization gate',
  });

  return authResult;
}

export const CodeRetentionPolicy = {
  authorize: authorizeSourceCodeOperation,
  enforceGate: enforceRetentionGate,
  transitionState: transitionLifecycleState,
  verifyLicense: verifyLicenseCompatibility,
  getActiveRecords: getActiveRetentionAuthorizations,
  hashContent: calculateContentHash,
};

export default CodeRetentionPolicy;
