// ============================================================
// lib/auth/index.ts — re-export shim
// Canonical implementation lives in lib/auth.ts.
// Import from '@/lib/auth' or '@/lib/auth/index' — both resolve here.
// ============================================================
export {
  getUser,
  getProfile,
  getUserRoles,
  requireAuth,
  requireRole,
  hasRole,
  isAdmin,
  assignRole,
} from '@/lib/auth';
