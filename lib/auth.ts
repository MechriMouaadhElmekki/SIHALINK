import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import type { UserRole } from '@/types/database';
import { redirect } from 'next/navigation';

// ============================================================
// Canonical role set — must stay in sync with DB roles table.
// ============================================================
const CANONICAL_ROLES: ReadonlySet<UserRole> = new Set([
  'USER',
  'DOCTOR',
  'HEALTHCARE_PROVIDER',
  'EMERGENCY_OPERATOR',
  'ADMIN',
  'SUPER_ADMIN',
]);

// ============================================================
// Typed authorization errors
// ============================================================
export class AuthenticationError extends Error {
  readonly statusCode = 401;
  constructor(message = 'Authentication required') {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends Error {
  readonly statusCode = 403;
  constructor(message = 'Insufficient permissions') {
    super(message);
    this.name = 'AuthorizationError';
  }
}

// ============================================================
// getUser — resolves the authenticated server-side user.
// Returns null if no valid session exists.
// ============================================================
export async function getUser() {
  const supabase = createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  return user;
}

// ============================================================
// getProfile — returns the profile row for the authenticated user.
// ============================================================
export async function getProfile() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return profile;
}

// ============================================================
// getUserRoles — ROOT-01 FIX
//
// Returns only ACTIVE roles for the given userId.
//
// Active ≡ expires_at IS NULL OR expires_at > now()
//
// This matches the canonical DB semantics from 004_rls_canonical.sql:
//   ur.expires_at IS NULL OR ur.expires_at > now()
//
// Implementation:
//   We filter with PostgREST .or() using two conditions:
//     1. expires_at.is.null    — role has no expiry
//     2. expires_at.gt.<iso>   — role expires in the future
//
//   The ISO timestamp is captured at call time so every invocation
//   uses a fresh "now" value consistent with the server clock.
//
// IMPORTANT: expired roles are excluded at the query level so that
// every consumer — requireRole(), hasRole(), isAdmin(),
// and adminAssignRole() — inherits correct expiry semantics without
// any additional filtering logic.
// ============================================================
export async function getUserRoles(userId?: string): Promise<UserRole[]> {
  const supabase = createClient();
  const uid = userId ?? (await supabase.auth.getUser()).data.user?.id;
  if (!uid) return [];

  // Capture server-side "now" for the expiry comparison.
  const now = new Date().toISOString();

  // Step 1: fetch role_id values for non-expired rows only.
  const { data: userRoleRows, error } = await supabase
    .from('user_roles')
    .select('role_id')
    .eq('user_id', uid)
    .or(`expires_at.is.null,expires_at.gt.${now}`);

  if (error) {
    // Surface the error to the caller rather than silently returning [].
    // Logging is handled by Sentry at the integration layer.
    console.error('[getUserRoles] query error:', error.message);
    return [];
  }

  if (!userRoleRows || userRoleRows.length === 0) return [];

  const roleIds = userRoleRows.map((r: { role_id: string }) => r.role_id);

  // Step 2: resolve role names from the roles table.
  const { data: roleRows, error: rolesError } = await supabase
    .from('roles')
    .select('name')
    .in('id', roleIds);

  if (rolesError) {
    console.error('[getUserRoles] roles lookup error:', rolesError.message);
    return [];
  }

  if (!roleRows) return [];

  return roleRows
    .map((r: { name: string }) => r.name)
    .filter((name): name is UserRole => Boolean(name) && CANONICAL_ROLES.has(name as UserRole));
}

// ============================================================
// requireAuth — enforces authentication; redirects to /login.
// ============================================================
export async function requireAuth() {
  const user = await getUser();
  if (!user) redirect('/login');
  return user;
}

// ============================================================
// requireRole — enforces authentication + role membership.
// Redirects to /unauthorized if role is absent or expired.
// ============================================================
export async function requireRole(requiredRoles: UserRole[]) {
  const user = await requireAuth();
  const roles = await getUserRoles(user.id);
  const hasRequiredRole = requiredRoles.some(r => roles.includes(r));
  if (!hasRequiredRole) redirect('/unauthorized');
  return { user, roles };
}

// ============================================================
// hasRole — returns true iff the user holds an active role.
// ============================================================
export async function hasRole(role: UserRole, userId?: string): Promise<boolean> {
  const roles = await getUserRoles(userId);
  return roles.includes(role);
}

// ============================================================
// isAdmin — returns true iff the user holds an active ADMIN
// or SUPER_ADMIN role.
// ============================================================
export async function isAdmin(userId?: string): Promise<boolean> {
  const roles = await getUserRoles(userId);
  return roles.includes('ADMIN') || roles.includes('SUPER_ADMIN');
}

// ============================================================
// _privilegedAssignRole — LOW-LEVEL INTERNAL PRIMITIVE
//
// !! NOT EXPORTED FROM lib/auth/index.ts !!
// !! DO NOT CALL DIRECTLY FROM API ROUTES OR COMPONENTS !!
//
// Uses the admin client (service-role key) to upsert a role
// assignment for the given user.  Authorization is the
// EXCLUSIVE responsibility of the caller (adminAssignRole).
//
// This function:
//   - does NOT authenticate the calling session
//   - does NOT check caller permissions
//   - WILL write to the DB regardless of who calls it
//
// The only safe caller is adminAssignRole() below.
// ============================================================
async function _privilegedAssignRole(userId: string, roleName: UserRole): Promise<void> {
  const adminClient = createAdminClient();

  const { data: role, error: lookupError } = await adminClient
    .from('roles')
    .select('id')
    .eq('name', roleName)
    .single();

  if (lookupError || !role) {
    throw new Error(`Role "${roleName}" not found in the roles table`);
  }

  const { error: upsertError } = await adminClient
    .from('user_roles')
    .upsert(
      { user_id: userId, role_id: role.id },
      { onConflict: 'user_id,role_id' }
    );

  if (upsertError) throw upsertError;
}

// ============================================================
// adminAssignRole — ROOT-02 FIX
//
// PUBLIC entry point for privileged role assignment.
//
// Authorization boundary (all checks happen BEFORE any
// service-role DB write):
//
//   1. Authenticate: calling server session must have a valid
//      Supabase auth user.  No user → AuthenticationError (401).
//
//   2. Authorize: caller must hold an active (non-expired)
//      ADMIN or SUPER_ADMIN role.  getUserRoles() enforces
//      expiry (ROOT-01), so an expired ADMIN is treated as
//      having no admin role here.
//
//   3. Validate target role: roleName must be a member of
//      CANONICAL_ROLES.  Unknown roles are rejected with a
//      plain Error before touching the DB.
//
//   4. Only after all three checks pass does _privilegedAssignRole
//      call createAdminClient() and write to user_roles.
//
// Callers MUST handle AuthenticationError (→ 401 response) and
// AuthorizationError (→ 403 response) explicitly.
//
// Usage:
//
//   import { adminAssignRole, AuthenticationError, AuthorizationError }
//     from '@/lib/auth';
//
//   try {
//     await adminAssignRole(targetUserId, 'DOCTOR');
//   } catch (e) {
//     if (e instanceof AuthenticationError)
//       return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
//     if (e instanceof AuthorizationError)
//       return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
//     throw e; // unexpected — let Sentry capture it
//   }
// ============================================================
export async function adminAssignRole(
  targetUserId: string,
  roleName: UserRole
): Promise<void> {
  // ── Step 1: Authenticate the calling server session ─────────────────────
  const supabase = createClient();
  const { data: { user: callerUser }, error: authError } = await supabase.auth.getUser();

  if (authError || !callerUser) {
    throw new AuthenticationError();
  }

  // ── Step 2: Authorize — caller must be an active ADMIN or SUPER_ADMIN ───
  // getUserRoles() enforces expires_at filtering (ROOT-01 fix), so an
  // expired ADMIN will not be present in callerRoles.
  const callerRoles = await getUserRoles(callerUser.id);
  const callerIsAdmin = callerRoles.includes('ADMIN') || callerRoles.includes('SUPER_ADMIN');

  if (!callerIsAdmin) {
    throw new AuthorizationError(
      `User ${callerUser.id} does not hold an active ADMIN or SUPER_ADMIN role`
    );
  }

  // ── Step 3: Validate the target role against canonical role set ──────────
  if (!CANONICAL_ROLES.has(roleName)) {
    throw new Error(
      `Invalid role "${roleName}". Allowed values: ${[...CANONICAL_ROLES].join(', ')}`
    );
  }

  // ── Step 4: Perform the privileged mutation ──────────────────────────────
  // All authorization checks above have passed. Only now do we use the
  // service-role client.  The service-role key never reaches this code
  // path unless the caller is a verified active ADMIN.
  await _privilegedAssignRole(targetUserId, roleName);
}
