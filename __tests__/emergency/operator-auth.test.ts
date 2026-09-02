// ============================================================
// Unit tests — operator authorization helpers
//
// Tests the role logic used by the operator endpoint.
// These test pure/extracted logic — no HTTP, no database.
//
// Run: pnpm test __tests__/emergency/operator-auth.test.ts
// ============================================================

import type { UserRole } from '@/types/database';

// ── Extracted operator authorization logic ────────────────────
// Mirror of the logic in app/api/operator/emergency/[id]/status/route.ts
// Kept in sync — if OPERATOR_ROLES changes in the route, update here.
const OPERATOR_ROLES: UserRole[] = [
  'EMERGENCY_OPERATOR',
  'ADMIN',
  'SUPER_ADMIN',
];

function isAuthorizedOperator(roles: UserRole[]): boolean {
  return OPERATOR_ROLES.some((r) => roles.includes(r));
}

function resolveActorRole(roles: UserRole[]): UserRole {
  if (roles.includes('SUPER_ADMIN')) return 'SUPER_ADMIN';
  if (roles.includes('ADMIN')) return 'ADMIN';
  return 'EMERGENCY_OPERATOR';
}

// ── Authorization unit tests ──────────────────────────────────
describe('isAuthorizedOperator', () => {
  it('USER role is rejected', () => {
    expect(isAuthorizedOperator(['USER'])).toBe(false);
  });

  it('DOCTOR role is rejected', () => {
    expect(isAuthorizedOperator(['DOCTOR'])).toBe(false);
  });

  it('HEALTHCARE_PROVIDER role is rejected', () => {
    expect(isAuthorizedOperator(['HEALTHCARE_PROVIDER'])).toBe(false);
  });

  it('Empty roles array is rejected', () => {
    expect(isAuthorizedOperator([])).toBe(false);
  });

  it('EMERGENCY_OPERATOR role is accepted', () => {
    expect(isAuthorizedOperator(['EMERGENCY_OPERATOR'])).toBe(true);
  });

  it('ADMIN role is accepted', () => {
    expect(isAuthorizedOperator(['ADMIN'])).toBe(true);
  });

  it('SUPER_ADMIN role is accepted', () => {
    expect(isAuthorizedOperator(['SUPER_ADMIN'])).toBe(true);
  });

  it('USER + EMERGENCY_OPERATOR — the OP role wins', () => {
    expect(isAuthorizedOperator(['USER', 'EMERGENCY_OPERATOR'])).toBe(true);
  });

  // Simulates expired-role scenario:
  // getUserRoles() strips expired roles before they reach the endpoint.
  // An expired EMERGENCY_OPERATOR returns [] from getUserRoles().
  it('Expired EMERGENCY_OPERATOR (returns empty from getUserRoles) is rejected', () => {
    // After expiry filtering, the roles array is empty.
    expect(isAuthorizedOperator([])).toBe(false);
  });

  it('Expired ADMIN (returns [USER] from getUserRoles) is rejected', () => {
    // Admin role has expired; only USER remains.
    expect(isAuthorizedOperator(['USER'])).toBe(false);
  });
});

// ── Actor-role resolution ─────────────────────────────────────
describe('resolveActorRole', () => {
  it('SUPER_ADMIN takes highest precedence', () => {
    expect(resolveActorRole(['SUPER_ADMIN', 'ADMIN', 'EMERGENCY_OPERATOR'])).toBe('SUPER_ADMIN');
  });

  it('ADMIN takes precedence over EMERGENCY_OPERATOR', () => {
    expect(resolveActorRole(['ADMIN', 'EMERGENCY_OPERATOR'])).toBe('ADMIN');
  });

  it('EMERGENCY_OPERATOR when no ADMIN/SUPER_ADMIN', () => {
    expect(resolveActorRole(['USER', 'EMERGENCY_OPERATOR'])).toBe('EMERGENCY_OPERATOR');
  });
});

// ── Integration authorization tests ──────────────────────────
// These require a live Supabase database with credentials.
// They are marked NOT RUN in this batch because no test DB
// credentials are available in the CI/automated environment.
//
// To run manually against a test database:
//   1. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
//   2. pnpm test --testPathPattern operator-integration
describe.skip('Integration: operator endpoint authorization (NOT RUN)', () => {
  it('Unauthenticated request → 401', () => {
    // NOT RUN — requires live DB + test HTTP client
    expect(true).toBe(true);
  });

  it('Active USER → 403', () => {
    // NOT RUN
    expect(true).toBe(true);
  });

  it('Expired EMERGENCY_OPERATOR → 403', () => {
    // NOT RUN
    expect(true).toBe(true);
  });

  it('Active EMERGENCY_OPERATOR + valid transition → 200', () => {
    // NOT RUN
    expect(true).toBe(true);
  });

  it('Active ADMIN + valid transition → 200', () => {
    // NOT RUN
    expect(true).toBe(true);
  });

  it('Invalid transition → 409 with no DB mutation', () => {
    // NOT RUN
    expect(true).toBe(true);
  });
});
