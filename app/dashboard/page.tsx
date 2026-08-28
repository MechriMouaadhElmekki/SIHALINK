import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  AlertTriangle, FileText, UserCog, Calendar,
  Building2, Pill, FlaskConical, Heart, MapPin,
  ChevronLeft, Clock, CheckCircle2, AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default async function DashboardPage() {
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
    .select('first_name, last_name, wilaya')
    .eq('id', user.id)
    .single();

  const { data: activeReports } = await supabase
    .from('emergency_reports')
    .select('id, report_number, status, priority, emergency_type, created_at')
    .eq('user_id', user.id)
    .not('status', 'in', '(CLOSED,CANCELLED,RESOLVED)')
    .order('created_at', { ascending: false })
    .limit(3);

  const { data: upcomingAppointments } = await supabase
    .from('appointments')
    .select('id, appointment_date, appointment_time, status, doctors(profiles(first_name, last_name))')
    .eq('user_id', user.id)
    .in('status', ['REQUESTED', 'CONFIRMED'])
    .gte('appointment_date', new Date().toISOString().split('T')[0])
    .order('appointment_date', { ascending: true })
    .limit(3);

  const firstName = profile?.first_name || 'مستخدم';

  const quickServices = [
    { href: '/dashboard/emergency/new', label: 'طوارئ', icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-950/30', border: 'border-red-200 dark:border-red-800' },
    { href: '/dashboard/reports', label: 'تقاريري', icon: FileText, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-950/30', border: 'border-blue-200 dark:border-blue-800' },
    { href: '/dashboard/doctors', label: 'الأطباء', icon: UserCog, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-950/30', border: 'border-green-200 dark:border-green-800' },
    { href: '/dashboard/appointments', label: 'المواعيد', icon: Calendar, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-950/30', border: 'border-purple-200 dark:border-purple-800' },
    { href: '/dashboard/facilities', label: 'المرافق الصحية', icon: Building2, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-950/30', border: 'border-orange-200 dark:border-orange-800' },
    { href: '/dashboard/pharmacies', label: 'الصيدليات', icon: Pill, color: 'text-teal-500', bg: 'bg-teal-50 dark:bg-teal-950/30', border: 'border-teal-200 dark:border-teal-800' },
    { href: '/dashboard/laboratories', label: 'المخابر', icon: FlaskConical, color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-950/30', border: 'border-indigo-200 dark:border-indigo-800' },
    { href: '/dashboard/first-aid', label: 'الإسعافات الأولية', icon: Heart, color: 'text-pink-500', bg: 'bg-pink-50 dark:bg-pink-950/30', border: 'border-pink-200 dark:border-pink-800' },
  ];

  const priorityColors: Record<string, string> = {
    CRITICAL: 'critical', HIGH: 'high', MEDIUM: 'medium', LOW: 'low',
  };
  const priorityLabels: Record<string, string> = {
    CRITICAL: 'حرج', HIGH: 'عالي', MEDIUM: 'متوسط', LOW: 'منخفض',
  };
  const statusLabels: Record<string, string> = {
    DRAFT: 'مسودة', SUBMITTED: 'مُقدَّم', RECEIVED: 'مستلم',
    UNDER_REVIEW: 'قيد المراجعة', ASSIGNED: 'مُعيَّن', IN_PROGRESS: 'جارٍ',
    ACKNOWLEDGED: 'مُعترف به',
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header greeting */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">مرحباً، {firstName} 👋</h1>
          <p className="text-muted-foreground text-sm mt-1">منصة سيهالينك للطوارئ والرعاية الصحية</p>
        </div>
        {profile?.wilaya && (
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span>{profile.wilaya}</span>
          </div>
        )}
      </div>

      {/* Emergency CTA - prominent but requires confirmation */}
      <Card className="border-red-200 dark:border-red-900 bg-gradient-to-l from-red-50 to-orange-50 dark:from-red-950/40 dark:to-orange-950/40">
        <CardContent className="p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-red-700 dark:text-red-400">هل تحتاج مساعدة طارئة؟</h2>
              <p className="text-sm text-red-600/80 dark:text-red-500/80 mt-0.5">أبلغ عن حالة طارئة الآن</p>
            </div>
            <Link href="/dashboard/emergency/new">
              <Button variant="emergency" size="xl" className="shrink-0">
                <AlertTriangle className="h-5 w-5 me-2" />
                إبلاغ عن طارئ
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Active Reports */}
      {activeReports && activeReports.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-lg">التقارير النشطة</h2>
            <Link href="/dashboard/reports" className="text-sm text-primary hover:underline flex items-center gap-1">
              عرض الكل <ChevronLeft className="h-4 w-4" />
            </Link>
          </div>
          <div className="space-y-2">
            {activeReports.map((report: Record<string, string>) => (
              <Link key={report.id} href={`/dashboard/reports/${report.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <AlertTriangle className="h-5 w-5 text-orange-500" />
                        <div>
                          <p className="font-medium text-sm">{report.report_number}</p>
                          <p className="text-xs text-muted-foreground">{report.emergency_type}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={(priorityColors[report.priority] || 'secondary') as 'critical' | 'high' | 'medium' | 'low' | 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'info'}>
                          {priorityLabels[report.priority] || report.priority}
                        </Badge>
                        <Badge variant="outline" className="text-xs">{statusLabels[report.status] || report.status}</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Appointments */}
      {upcomingAppointments && upcomingAppointments.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-lg">المواعيد القادمة</h2>
            <Link href="/dashboard/appointments" className="text-sm text-primary hover:underline flex items-center gap-1">
              عرض الكل <ChevronLeft className="h-4 w-4" />
            </Link>
          </div>
          <div className="space-y-2">
            {(upcomingAppointments as Record<string, unknown>[]).map((appt) => (
              <Card key={appt.id as string}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium text-sm">
                        {String(appt.appointment_date)} - {String(appt.appointment_time)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {((appt.doctors as Record<string, Record<string, string>>)?.profiles?.first_name)} {((appt.doctors as Record<string, Record<string, string>>)?.profiles?.last_name)}
                      </p>
                    </div>
                    <Badge variant="info" className="ms-auto">{String(appt.status)}</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Quick Services Grid */}
      <div>
        <h2 className="font-semibold text-lg mb-3">الخدمات السريعة</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {quickServices.map((service) => {
            const Icon = service.icon;
            return (
              <Link key={service.href} href={service.href}>
                <Card className={`hover:shadow-md transition-all cursor-pointer h-full border ${service.border} ${service.bg}`}>
                  <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                    <Icon className={`h-7 w-7 ${service.color}`} />
                    <span className="text-sm font-medium">{service.label}</span>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
