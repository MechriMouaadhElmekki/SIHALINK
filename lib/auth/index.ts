// ============================================================
// lib/auth/index.ts — re-export shim
// Canonical implementation lives in lib/auth.ts.
// Import from '@/lib/auth' or '@/lib/auth/index' — both resolve here.
//
// NOTE: `assignRole` is intentionally NOT exported.
//   It was removed in Phase 1A Batch 1 (ROOT-02 fix).
//   The secured replacement is `adminAssignRole` below.
//   `_privilegedAssignRole` is an internal primitive and must
//   never be exported from this shim.
// ============================================================
export {
  getUser,
  getProfile,
  getUserRoles,
  requireAuth,
  requireRole,
  hasRole,
  isAdmin,
  // ROOT-02: secured role-assignment entry point (replaces assignRole)
  adminAssignRole,
  // ROOT-02: typed authorization errors for API route catch blocks
  AuthenticationError,
  AuthorizationError,
} from '@/lib/auth';
