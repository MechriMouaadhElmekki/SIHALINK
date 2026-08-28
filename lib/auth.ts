import { getSupabaseServerClient } from './supabase/server';
import { redirect } from 'next/navigation';
import type { UserRole } from '@/types/database';

export async function getServerSession() {
  const supabase = getSupabaseServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

export async function requireAuth() {
  const session = await getServerSession();
  if (!session) redirect('/login');
  return session;
}

export async function getUserRoles(userId: string): Promise<UserRole[]> {
  const supabase = getSupabaseServerClient();
  const { data } = await supabase
    .from('user_roles')
    .select('roles(name)')
    .eq('user_id', userId);
  if (!data) return ['USER'];
  return data.map((r: any) => r.roles?.name).filter(Boolean) as UserRole[];
}

export async function requireRole(allowedRoles: UserRole[]) {
  const session = await requireAuth();
  const roles = await getUserRoles(session.user.id);
  const hasRole = roles.some(r => allowedRoles.includes(r));
  if (!hasRole) redirect('/');
  return { session, roles };
}

export async function isAdmin(userId: string): Promise<boolean> {
  const roles = await getUserRoles(userId);
  return roles.some(r => ['ADMIN', 'SUPER_ADMIN'].includes(r));
}

export async function isOperator(userId: string): Promise<boolean> {
  const roles = await getUserRoles(userId);
  return roles.some(r => ['EMERGENCY_OPERATOR', 'ADMIN', 'SUPER_ADMIN'].includes(r));
}
