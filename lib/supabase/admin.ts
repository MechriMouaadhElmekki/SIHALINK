import { createClient } from '@supabase/supabase-js';

// Service role client - SERVER SIDE ONLY, NEVER import in client components
export function createAdminClient() {
  if (typeof window !== 'undefined') {
    throw new Error('Admin client must only be used server-side');
  }
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
