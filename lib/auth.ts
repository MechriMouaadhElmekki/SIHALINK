import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import type { UserRole } from '@/types/database';
import { redirect } from 'next/navigation';

export async function getUser() {
  const supabase = createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  return user;
}

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

export async function getUserRoles(userId?: string): Promise<UserRole[]> {
  const supabase = createClient();
  const uid = userId ?? (await supabase.auth.getUser()).data.user?.id;
  if (!uid) return [];

  const { data } = await supabase
    .from('user_roles')
    .select('roles(name)')
    .eq('user_id', uid);

  if (!data) return [];
  return data.map((r: { roles: { name: string } | null }) => r.roles?.name).filter(Boolean) as UserRole[];
}

export async function requireAuth() {
  const user = await getUser();
  if (!user) redirect('/login');
  return user;
}

export async function requireRole(requiredRoles: UserRole[]) {
  const user = await requireAuth();
  const roles = await getUserRoles(user.id);
  const hasRole = requiredRoles.some(r => roles.includes(r));
  if (!hasRole) redirect('/unauthorized');
  return { user, roles };
}

export async function hasRole(role: UserRole, userId?: string): Promise<boolean> {
  const roles = await getUserRoles(userId);
  return roles.includes(role);
}

export async function isAdmin(userId?: string): Promise<boolean> {
  const roles = await getUserRoles(userId);
  return roles.includes('ADMIN') || roles.includes('SUPER_ADMIN');
}

export async function assignRole(userId: string, roleName: UserRole) {
  const adminClient = createAdminClient();
  const { data: role } = await adminClient
    .from('roles')
    .select('id')
    .eq('name', roleName)
    .single();

  if (!role) throw new Error(`Role ${roleName} not found`);

  const { error } = await adminClient
    .from('user_roles')
    .upsert({ user_id: userId, role_id: role.id }, { onConflict: 'user_id,role_id' });

  if (error) throw error;
}
