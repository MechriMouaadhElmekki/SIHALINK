import { createClient } from '@/lib/supabase/server';
import type { Profile } from '@/types/database';

export async function getUser() {
  const supabase = createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  return user;
}

export async function getProfile(): Promise<Profile | null> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();
  return data as Profile | null;
}

export async function requireUser() {
  const user = await getUser();
  if (!user) throw new Error('UNAUTHORIZED');
  return user;
}

export async function requireProfile() {
  const profile = await getProfile();
  if (!profile) throw new Error('UNAUTHORIZED');
  return profile;
}

export async function requireRole(allowedRoles: string[]) {
  const profile = await getProfile();
  if (!profile) throw new Error('UNAUTHORIZED');
  if (!allowedRoles.includes(profile.role)) throw new Error('FORBIDDEN');
  return profile;
}
