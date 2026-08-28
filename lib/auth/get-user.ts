import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { Profile, UserRole } from '@/types/database';

export async function getAuthUser() {
  const supabase = await createServerSupabaseClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  return user;
}

export async function getProfile(): Promise<Profile | null> {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return profile;
}

export async function requireAuth() {
  const user = await getAuthUser();
  if (!user) throw new Error('UNAUTHORIZED');
  return user;
}

export async function requireRole(allowedRoles: UserRole[]) {
  const profile = await getProfile();
  if (!profile) throw new Error('UNAUTHORIZED');
  if (!allowedRoles.includes(profile.role)) throw new Error('FORBIDDEN');
  return profile;
}

export async function requireAdmin() {
  return requireRole(['ADMIN', 'SUPER_ADMIN']);
}

export async function requireOperator() {
  return requireRole(['EMERGENCY_OPERATOR', 'ADMIN', 'SUPER_ADMIN']);
}
