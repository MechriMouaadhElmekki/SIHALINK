import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import React from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';

const NAV_LABELS_AR = {
  home: 'الرئيسية', emergency: 'إبلاغ عن طارئ', myReports: 'تقاريري',
  doctors: 'الأطباء', appointments: 'المواعيد', facilities: 'المرافق',
  pharmacies: 'الصيدليات', laboratories: 'المخابر', firstAid: 'الإسعافات الأولية',
  notifications: 'الإشعارات', settings: 'الإعدادات', signOut: 'تسجيل الخروج',
  overview: 'نظرة عامة', users: 'المستخدمون', reports: 'التقارير',
  analytics: 'التحليلات', auditLogs: 'سجل المراجعة', falseReports: 'التقارير الكاذبة',
  assigned: 'المعينة',
};

export default async function Layout({ children }: { children: React.ReactNode }) {
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) { return cookieStore.get(name)?.value; },
        set(name, value, options) { cookieStore.set({ name, value, ...options }); },
        remove(name, options) { cookieStore.set({ name, value: '', ...options }); },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('first_name, last_name, avatar_url')
    .eq('id', user.id)
    .single();

  const { data: notifications } = await supabase
    .from('notifications')
    .select('id')
    .eq('user_id', user.id)
    .eq('is_read', false)
    .limit(99);

  // Get role
  const { data: userRole } = await supabase
    .from('user_roles')
    .select('roles(name)')
    .eq('user_id', user.id)
    .single();

  const role = (userRole?.roles as Record<string, string>)?.name || 'USER';

  async function signOut() {
    'use server';
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name) { return cookieStore.get(name)?.value; },
          set(name, value, options) { cookieStore.set({ name, value, ...options }); },
          remove(name, options) { cookieStore.set({ name, value: '', ...options }); },
        },
      }
    );
    await supabase.auth.signOut();
    redirect('/login');
  }

  return (
    <DashboardLayout
      user={{
        name: `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim() || user.email,
        email: user.email,
        avatar: profile?.avatar_url,
      }}
      role={role}
      locale="ar"
      navLabels={NAV_LABELS_AR}
      onSignOut={signOut}
      unreadNotifications={notifications?.length || 0}
    >
      {children}
    </DashboardLayout>
  );
}
