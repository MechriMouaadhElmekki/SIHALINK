import { createClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, Calendar, Clock, User, FileText, CheckCircle2, XCircle, Phone, Video, Home } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const CONSULTATION_LABELS: Record<string, string> = {
  IN_PERSON: 'حضوري', VIDEO: 'عبر الفيديو', PHONE: 'هاتفي', HOME_VISIT: 'زيارة منزلية',
};

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  REQUESTED:  { label: 'بانتظار', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  CONFIRMED:  { label: 'مؤكد',    color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  COMPLETED:  { label: 'مكتمل',    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  CANCELLED:  { label: 'ملغي',     color: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400' },
  NO_SHOW:    { label: 'لم يحضر',  color: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' },
};

export default async function AppointmentDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: apt, error } = await supabase
    .from('appointments')
    .select('*, doctors(id, first_name, last_name, specialty, phone, address, profile_image_url)')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single();

  if (error || !apt) notFound();

  const cfg = STATUS_CONFIG[apt.status] ?? { label: apt.status, color: 'bg-gray-100 text-gray-600' };
  const doctor = apt.doctors as any;
  const canCancel = ['REQUESTED', 'CONFIRMED'].includes(apt.status);

  return (
    <div dir="rtl" className="pb-10">
      <div className="sticky top-0 z-10 bg-background border-b border-border flex items-center gap-3 px-4 h-14">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/appointments"><ArrowRight className="w-5 h-5" /></Link>
        </Button>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-base truncate">
            {doctor ? `د. ${doctor.first_name} ${doctor.last_name}` : 'طبيب'}
          </p>
          <p className="text-xs text-muted-foreground">{apt.appointment_date} — {apt.appointment_time}</p>
        </div>
        <span className={`text-xs px-2 py-1 rounded-full font-medium ${cfg.color}`}>{cfg.label}</span>
      </div>

      <div className="p-4 lg:p-6 space-y-4">
        {/* Doctor card */}
        {doctor && (
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">معلومات الطبيب</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <p className="font-semibold">د. {doctor.first_name} {doctor.last_name}</p>
              {doctor.specialty && <p className="text-sm text-muted-foreground">{doctor.specialty}</p>}
              {doctor.address && <p className="text-sm text-muted-foreground flex items-center gap-1"><Home className="w-3.5 h-3.5" />{doctor.address}</p>}
              {doctor.phone && (
                <a href={`tel:${doctor.phone}`} className="text-sm text-blue-600 flex items-center gap-1 hover:underline">
                  <Phone className="w-3.5 h-3.5" />{doctor.phone}
                </a>
              )}
            </CardContent>
          </Card>
        )}

        {/* Appointment details */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">تفاصيل الموعد</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Row icon={<Calendar className="w-4 h-4" />} label="التاريخ" value={apt.appointment_date} />
            <Row icon={<Clock className="w-4 h-4" />} label="الوقت" value={apt.appointment_time} />
            <Row icon={<User className="w-4 h-4" />} label="نوع" value={CONSULTATION_LABELS[apt.consultation_type] ?? apt.consultation_type} />
            {apt.reason && <Row icon={<FileText className="w-4 h-4" />} label="سبب" value={apt.reason} />}
            {apt.notes && <Row icon={<FileText className="w-4 h-4" />} label="ملاحظات" value={apt.notes} />}
          </CardContent>
        </Card>

        {/* Cancel action */}
        {canCancel && (
          <form action={`/api/appointments/${apt.id}/cancel`} method="POST">
            <Button variant="destructive" type="submit" className="w-full">إلغاء الموعد</Button>
          </form>
        )}

        {apt.status === 'COMPLETED' && (
          <div className="rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 p-4 flex gap-3">
            <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0" />
            <p className="text-sm text-blue-800 dark:text-blue-300">اكتمل الموعد بنجاح.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="text-muted-foreground mt-0.5">{icon}</div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}
