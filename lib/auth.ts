import { createClient } from '@/lib/supabase/server';
import type { UserRole, Profile } from '@/types/database';

export interface AuthUser {
  id: string;
  email: string | undefined;
  roles: UserRole[];
  profile: Profile | null;
}

export async function getAuthUser(): Promise<AuthUser | null> {
  const supabase = createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;

  const [profileResult, rolesResult] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('user_roles').select('role_name').eq('user_id', user.id),
  ]);

  return {
    id: user.id,
    email: user.email,
    roles: (rolesResult.data?.map(r => r.role_name) ?? ['USER']) as UserRole[],
    profile: profileResult.data,
  };
}

export function hasRole(user: AuthUser, role: UserRole): boolean {
  return user.roles.includes(role);
}

export function isAdmin(user: AuthUser): boolean {
  return user.roles.some(r => r === 'ADMIN' || r === 'SUPER_ADMIN');
}

export function isOperator(user: AuthUser): boolean {
  return user.roles.includes('EMERGENCY_OPERATOR');
}

export function isDoctor(user: AuthUser): boolean {
  return user.roles.includes('DOCTOR');
}

export async function requireAuth(): Promise<AuthUser> {
  const user = await getAuthUser();
  if (!user) throw new Error('UNAUTHORIZED');
  return user;
}

export async function requireRole(role: UserRole): Promise<AuthUser> {
  const user = await requireAuth();
  if (!hasRole(user, role) && !isAdmin(user)) {
    throw new Error('FORBIDDEN');
  }
  return user;
}
