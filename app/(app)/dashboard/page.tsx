import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  AlertTriangle, FileText, Calendar, UserCheck,
  Building2, Pill, BookOpen, Bell, Clock, ChevronRight, TrendingUp
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/layout/header';
import { getStatusColor, getPriorityColor } from '@/lib/utils';

const EMERGENCY_TYPE_LABELS: Record<string, string> = {
  medical_emergency: 'حالة طبية طارئة',
  accident: 'حادث',
  fire: 'حريق',
  pregnancy_emergency: 'طارئة حمل',
  child_emergency: 'طارئة طفل',
  elderly_emergency: 'طارئة مسن',
  unconscious_person: 'شخص فاقد الوعي',
  breathing_difficulty: 'صعوبة تنفس',
  chest_pain: 'ألم صدر',
  severe_bleeding: 'نزيف حاد',
  other: 'أخرى',
};

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'مسودة', SUBMITTED: 'مُرسل', RECEIVED: 'مُستلم',
  UNDER_REVIEW: 'قيد المراجعة', ASSIGNED: 'مُحال', ACKNOWLEDGED: 'مُؤكد',
  IN_PROGRESS: 'جاري التدخل', RESOLVED: 'تم الحل',
  CANCELLED: 'مُلغى', REJECTED: 'مرفوض', CLOSED: 'مغلق',
};

const PRIORITY_LABELS: Record<string, string> = {
  CRITICAL: 'حرج', HIGH: 'مرتفع', MEDIUM: 'متوسط', LOW: 'منخفض',
};

export default async function DashboardPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const [profileRes, reportsCountRes, activeReportsRes, appointmentsRes, notifRes] = await Promise.all([
    supabase.from('profiles').select('first_name, preferred_language').eq('id', user.id).single(),
    supabase.from('emergency_reports').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
    supabase.from('emergency_reports').select('id', { count: 'exact', head: true }).eq('user_id', user.id)
      .in('status', ['SUBMITTED','RECEIVED','UNDER_REVIEW','ASSIGNED','ACKNOWLEDGED','IN_PROGRESS']),
    supabase.from('appointments').select('id', { count: 'exact', head: true }).eq('user_id', user.id)
      .in('status', ['REQUESTED','CONFIRMED']),
    supabase.from('notifications').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('is_read', false),
  ]);

  const [recentReportsRes, upcomingAptsRes] = await Promise.all([
    supabase.from('emergency_reports')
      .select('id, report_number, emergency_type, priority, status, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5),
    supabase.from('appointments')
      .select('id, appointment_date, appointment_time, status, doctors(first_name, last_name)')
      .eq('user_id', user.id)
      .in('status', ['REQUESTED','CONFIRMED'])
      .gte('appointment_date', new Date().toISOString().split('T')[0])
      .order('appointment_date', { ascending: true })
      .limit(3),
  ]);

  const firstName = profileRes.data?.first_name || '';
  const locale = (profileRes.data?.preferred_language || 'ar') as 'ar' | 'fr' | 'en';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'صباح الخير' : 'مساء الخير';

  return (
    <div dir="rtl">
      <Header
        title={`${greeting}${firstName ? '، ' + firstName : ''}`}
        subtitle="مرحباً بك في SIHALINK"
        unreadCount={notifRes.count ?? 0}
        locale={locale}
      />

      <div className="p-4 lg:p-6 space-y-6">
        {/* Emergency CTA */}
        <Link
          href="/emergency"
          className="block rounded-2xl bg-gradient-to-l from-red-600 to-red-500 p-5 text-white shadow-lg hover:shadow-red-200 dark:hover:shadow-red-900/30 hover:-translate-y-0.5 transition-all"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
              <AlertTriangle className="w-7 h-7 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-lg font-bold">الإبلاغ عن حالة طارئة</p>
              <p className="text-sm text-red-100">اضغط هنا في حالة الطوارئ فقط</p>
            </div>
            <ChevronRight className="w-6 h-6 opacity-70 rtl:rotate-180 shrink-0" />
          </div>
        </Link>

        {/* Stats grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard label="إجمالي البلاغات" value={reportsCountRes.count ?? 0} icon={<FileText className="w-5 h-5 text-blue-600" />} bg="bg-blue-50 dark:bg-blue-900/20" href="/reports" />
          <StatCard label="بلاغات نشطة" value={activeReportsRes.count ?? 0} icon={<TrendingUp className="w-5 h-5 text-orange-600" />} bg="bg-orange-50 dark:bg-orange-900/20" href="/reports" />
          <StatCard label="مواعيد قادمة" value={appointmentsRes.count ?? 0} icon={<Calendar className="w-5 h-5 text-green-600" />} bg="bg-green-50 dark:bg-green-900/20" href="/appointments" />
          <StatCard label="إشعارات جديدة" value={notifRes.count ?? 0} icon={<Bell className="w-5 h-5 text-purple-600" />} bg="bg-purple-50 dark:bg-purple-900/20" href="/notifications" />
        </div>

        {/* Quick links */}
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground mb-3">الوصول السريع</h2>
          <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
            {([
              { href: '/doctors',      icon: UserCheck,  label: 'أطباء',    color: 'text-blue-600',   bg: 'bg-blue-50   dark:bg-blue-900/20'   },
              { href: '/appointments', icon: Calendar,   label: 'مواعيد',   color: 'text-green-600',  bg: 'bg-green-50  dark:bg-green-900/20'  },
              { href: '/facilities',   icon: Building2,  label: 'مرافق',    color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
              { href: '/pharmacies',   icon: Pill,       label: 'صيدليات',  color: 'text-teal-600',   bg: 'bg-teal-50   dark:bg-teal-900/20'   },
              { href: '/first-aid',    icon: BookOpen,   label: 'إسعافات',  color: 'text-red-600',    bg: 'bg-red-50    dark:bg-red-900/20'    },
              { href: '/reports',      icon: FileText,   label: 'بلاغاتي',  color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-900/20' },
            ] as const).map(({ href, icon: Icon, label, color, bg }) => (
              <Link
                key={href}
                href={href}
                className="flex flex-col items-center gap-2 p-3 rounded-xl bg-white dark:bg-gray-900 border border-border hover:border-blue-300 hover:shadow-sm transition-all"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${bg}`}>
                  <Icon className={`w-5 h-5 ${color}`} />
                </div>
                <span className="text-xs font-medium text-center">{label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent reports */}
        <Card>
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-base">آخر البلاغات</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/reports">عرض الكل <ChevronRight className="w-4 h-4 ms-1 rtl:rotate-180" /></Link>
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {recentReportsRes.data && recentReportsRes.data.length > 0 ? (
              <ul className="divide-y divide-border">
                {recentReportsRes.data.map((r) => (
                  <li key={r.id}>
                    <Link href={`/reports/${r.id}`} className="flex items-center gap-3 px-6 py-3 hover:bg-muted/50 transition-colors">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{EMERGENCY_TYPE_LABELS[r.emergency_type] ?? r.emergency_type}</p>
                        <p className="text-xs text-muted-foreground">{r.report_number}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getStatusColor(r.status)}`}>
                          {STATUS_LABELS[r.status] ?? r.status}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${getPriorityColor(r.priority)}`}>
                          {PRIORITY_LABELS[r.priority] ?? r.priority}
                        </span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="px-6 py-8 text-center">
                <FileText className="w-8 h-8 text-muted-foreground/50 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">لا يوجد بلاغات بعد</p>
                <Button variant="outline" size="sm" asChild className="mt-3">
                  <Link href="/emergency">إنشاء بلاغ</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming appointments */}
        {upcomingAptsRes.data && upcomingAptsRes.data.length > 0 && (
          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-base">مواعيد قادمة</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/appointments">عرض الكل <ChevronRight className="w-4 h-4 ms-1 rtl:rotate-180" /></Link>
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <ul className="divide-y divide-border">
                {upcomingAptsRes.data.map((apt: any) => (
                  <li key={apt.id}>
                    <Link href={`/appointments/${apt.id}`} className="flex items-center gap-3 px-6 py-3 hover:bg-muted/50 transition-colors">
                      <div className="w-10 h-10 rounded-xl bg-green-50 dark:bg-green-900/20 flex items-center justify-center shrink-0">
                        <Calendar className="w-5 h-5 text-green-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {apt.doctors ? `د. ${apt.doctors.first_name} ${apt.doctors.last_name}` : 'طبيب'}
                        </p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {apt.appointment_date} &mdash; {apt.appointment_time}
                        </p>
                      </div>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                        {apt.status === 'CONFIRMED' ? 'مؤكد' : 'بانتظار'}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Demo notice */}
        <div className="rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-800 dark:text-amber-300">وضع تجريبي</p>
            <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
              هذا التطبيق في وضع التجريبي. لا يتم إرسال البلاغات إلى خدمات الطوارئ الرسمية. في حالة الطوارئ الحقيقية اتصل بـ 1021.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, bg, href }: {
  label: string; value: number; icon: React.ReactNode; bg: string; href: string;
}) {
  return (
    <Link href={href} className="block">
      <Card className="hover:shadow-md transition-shadow border-0">
        <CardContent className="p-4">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${bg}`}>{icon}</div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
        </CardContent>
      </Card>
    </Link>
  );
}
