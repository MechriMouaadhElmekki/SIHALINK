import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getUserRoles } from '@/lib/auth';
import { Sidebar } from '@/components/layout/sidebar';
import { MobileNav } from '@/components/layout/mobile-nav';
import { Badge } from '@/components/ui/badge';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const roles = await getUserRoles(user.id);

  // Fetch unread notification count
  const { count: unreadCount } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('is_read', false);

  const profile = await supabase
    .from('profiles')
    .select('first_name, last_name, account_status')
    .eq('id', user.id)
    .single();

  // Block suspended accounts
  if (profile.data?.account_status === 'suspended') {
    redirect('/suspended');
  }

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950">
      <Sidebar userRole={roles} unreadCount={unreadCount ?? 0} />
      <div className="flex-1 lg:ms-64 flex flex-col min-h-screen">
        <main className="flex-1 pb-20 lg:pb-6">
          {children}
        </main>
      </div>
      <MobileNav unreadCount={unreadCount ?? 0} />
    </div>
  );
}
