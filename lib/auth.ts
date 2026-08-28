import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { UserRole } from '@/types';

export async function getSession() {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

export async function getUser() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function requireAuth() {
  const user = await getUser();
  if (!user) redirect('/auth/login');
  return user;
}

export async function getUserRoles(userId: string): Promise<UserRole[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId);
  return (data?.map(r => r.role as UserRole)) ?? ['USER'];
}

export async function getUserProfile(userId: string) {
  const supabase = createClient();
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  return data;
}

export async function requireRole(allowedRoles: UserRole[]) {
  const user = await requireAuth();
  const roles = await getUserRoles(user.id);
  const hasRole = roles.some(r => allowedRoles.includes(r));
  if (!hasRole) redirect('/dashboard');
  return { user, roles };
}

export function hasAnyRole(userRoles: UserRole[], required: UserRole[]): boolean {
  return userRoles.some(r => required.includes(r));
}

export function isAdmin(userRoles: UserRole[]): boolean {
  return hasAnyRole(userRoles, ['ADMIN', 'SUPER_ADMIN']);
}

export function isOperator(userRoles: UserRole[]): boolean {
  return hasAnyRole(userRoles, ['EMERGENCY_OPERATOR', 'ADMIN', 'SUPER_ADMIN']);
}
