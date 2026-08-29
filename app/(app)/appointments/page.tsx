import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Calendar, Clock, Plus, ChevronRight, UserCheck } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/layout/header';
import { formatRelative } from '@/lib/utils';

const CONSULTATION_LABELS: Record<string, string> = {
  IN_PERSON: 'حضوري', VIDEO: 'عبر الفيديو', PHONE: 'هاتفي', HOME_VISIT: 'زيارة منزلية',
};

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  REQUESTED:  { label: 'بانتظار', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  CONFIRMED:  { label: 'مؤكد',    color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  COMPLETED:  { label: 'مكتمل',    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  CANCELLED:  { label: 'ملغي',     color: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400' },
  NO_SHOW:    { label: 'لم يحضر',  color: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' },
  RESCHEDULED:{ label: 'معاد جدولته', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
};

export default async function AppointmentsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const [aptsRes, notifRes] = await Promise.all([
    supabase
      .from('appointments')
      .select('id, appointment_date, appointment_time, consultation_type, status, reason, doctors(id, first_name, last_name, specialty)')
      .eq('user_id', user.id)
      .order('appointment_date', { ascending: false })
      .limit(50),
    supabase.from('notifications').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('is_read', false),
  ]);

  const upcoming = aptsRes.data?.filter(a => ['REQUESTED','CONFIRMED'].includes(a.status)) ?? [];
  const past = aptsRes.data?.filter(a => !['REQUESTED','CONFIRMED'].includes(a.status)) ?? [];

  return (
    <div dir="rtl">
      <Header title="مواعيدي" subtitle={`${upcoming.length} موعد قادم`} unreadCount={notifRes.count ?? 0} />
      <div className="p-4 lg:p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-muted-foreground">جميع المواعيد</h2>
          <Button size="sm" asChild>
            <Link href="/appointments/book"><Plus className="w-4 h-4" /> حجز موعد</Link>
          </Button>
        </div>

        {upcoming.length > 0 && (
          <section className="space-y-3">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">قادمة</h3>
            {upcoming.map(apt => <AptCard key={apt.id} apt={apt} />)}
          </section>
        )}

        {past.length > 0 && (
          <section className="space-y-3">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">سابقة</h3>
            {past.map(apt => <AptCard key={apt.id} apt={apt} />)}
          </section>
        )}

        {!aptsRes.data?.length && (
          <div className="text-center py-20 space-y-4">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
              <Calendar className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">لا يوجد مواعيد بعد</p>
            <Button asChild><Link href="/appointments/book">حجز موعد الآن</Link></Button>
          </div>
        )}
      </div>
    </div>
  );
}

function AptCard({ apt }: { apt: any }) {
  const cfg = STATUS_CONFIG[apt.status] ?? { label: apt.status, color: 'bg-gray-100 text-gray-600' };
  const doctor = apt.doctors;
  return (
    <Link href={`/appointments/${apt.id}`}>
      <Card className="hover:shadow-md transition-all hover:-translate-y-0.5">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center shrink-0">
              <UserCheck className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold text-sm truncate">
                  {doctor ? `د. ${doctor.first_name} ${doctor.last_name}` : 'طبيب'}
                </p>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${cfg.color}`}>{cfg.label}</span>
              </div>
              {doctor?.specialty && <p className="text-xs text-muted-foreground">{doctor.specialty}</p>}
              <div className="flex items-center gap-3 mt-1">
                <span className="text-xs flex items-center gap-1"><Calendar className="w-3 h-3" />{apt.appointment_date}</span>
                <span className="text-xs flex items-center gap-1"><Clock className="w-3 h-3" />{apt.appointment_time}</span>
                <span className="text-xs text-muted-foreground">{CONSULTATION_LABELS[apt.consultation_type] ?? apt.consultation_type}</span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 mt-1 rtl:rotate-180" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
