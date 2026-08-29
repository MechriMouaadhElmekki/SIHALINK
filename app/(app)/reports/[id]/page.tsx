import { createClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, MapPin, Users, Clock, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getStatusColor, getPriorityColor, formatRelative } from '@/lib/utils';

const TYPE_LABELS: Record<string, string> = {
  medical_emergency: 'حالة طبية طارئة', accident: 'حادث', fire: 'حريق',
  pregnancy_emergency: 'طارئة حمل', child_emergency: 'طارئة طفل', elderly_emergency: 'طارئة مسن',
  unconscious_person: 'شخص فاقد الوعي', breathing_difficulty: 'صعوبة تنفس',
  chest_pain: 'ألم صدر', severe_bleeding: 'نزيف حاد', other: 'أخرى',
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

const STATUS_TIMELINE = [
  'SUBMITTED', 'RECEIVED', 'UNDER_REVIEW', 'ASSIGNED', 'ACKNOWLEDGED', 'IN_PROGRESS', 'RESOLVED',
];

export default async function ReportDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: report, error } = await supabase
    .from('emergency_reports')
    .select('*')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single();

  if (error || !report) notFound();

  const isTerminal = ['RESOLVED', 'CANCELLED', 'REJECTED', 'CLOSED'].includes(report.status);
  const timelineIdx = STATUS_TIMELINE.indexOf(report.status);

  return (
    <div dir="rtl" className="pb-10">
      {/* Back + header */}
      <div className="sticky top-0 z-10 bg-background border-b border-border">
        <div className="flex items-center gap-3 px-4 h-14">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/reports"><ArrowRight className="w-5 h-5" /></Link>
          </Button>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-base truncate">{TYPE_LABELS[report.emergency_type] ?? report.emergency_type}</p>
            <p className="text-xs text-muted-foreground">{report.report_number}</p>
          </div>
          <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(report.status)}`}>
            {STATUS_LABELS[report.status] ?? report.status}
          </span>
        </div>
      </div>

      <div className="p-4 lg:p-6 space-y-5">
        {/* Priority + key info */}
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">مستوى الأولوية</span>
              <span className={`text-sm px-3 py-1 rounded-full font-bold border ${getPriorityColor(report.priority)}`}>
                {PRIORITY_LABELS[report.priority] ?? report.priority}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Users className="w-4 h-4 text-muted-foreground" />
              <span>{report.affected_count} متضرر</span>
            </div>
            {(report.location_wilaya || report.location_city) && (
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <span>{[report.location_address, report.location_city, report.location_wilaya].filter(Boolean).join(' • ')}</span>
              </div>
            )}
            {report.location_latitude && !report.location_is_manual && (
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <span className="font-mono text-xs">{Number(report.location_latitude).toFixed(5)}, {Number(report.location_longitude).toFixed(5)}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span>{new Date(report.created_at).toLocaleString('ar-DZ')}</span>
            </div>
          </CardContent>
        </Card>

        {/* Description */}
        {report.description && (
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">وصف الحالة</CardTitle></CardHeader>
            <CardContent><p className="text-sm leading-relaxed">{report.description}</p></CardContent>
          </Card>
        )}

        {/* Triage */}
        {report.triage_answers && Array.isArray(report.triage_answers) && report.triage_answers.length > 0 && (
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">نتائج التقييم</CardTitle></CardHeader>
            <CardContent className="p-0">
              <ul className="divide-y divide-border">
                {(report.triage_answers as any[]).map((a, i) => (
                  <li key={i} className="flex items-start justify-between gap-2 px-4 py-2.5">
                    <span className="text-xs text-muted-foreground flex-1">{a.question_text_ar}</span>
                    <span className="text-xs font-medium shrink-0">{a.answer_display_ar}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Status timeline */}
        {!['CANCELLED','REJECTED'].includes(report.status) && (
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">حالة البلاغ</CardTitle></CardHeader>
            <CardContent>
              <ol className="relative border-s border-border space-y-4 ms-3">
                {STATUS_TIMELINE.map((s, i) => {
                  const done = timelineIdx >= i;
                  const active = timelineIdx === i && !isTerminal;
                  return (
                    <li key={s} className="ms-4">
                      <div className={`absolute w-3 h-3 rounded-full -start-1.5 border-2 ${
                        done ? 'bg-blue-500 border-blue-500' : 'bg-background border-border'
                      }`} />
                      <p className={`text-xs ${done ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                        {STATUS_LABELS[s]}
                      </p>
                    </li>
                  );
                })}
                {report.status === 'RESOLVED' && (
                  <li className="ms-4">
                    <div className="absolute w-3 h-3 rounded-full -start-1.5 bg-green-500 border-2 border-green-500" />
                    <p className="text-xs text-green-600 font-medium">تم حل الحالة</p>
                  </li>
                )}
              </ol>
            </CardContent>
          </Card>
        )}

        {/* Terminal states */}
        {report.status === 'RESOLVED' && (
          <div className="rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 p-4 flex gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
            <p className="text-sm text-green-800 dark:text-green-300">تمت معالجة حالتك بنجاح.</p>
          </div>
        )}
        {(report.status === 'REJECTED' || report.status === 'CANCELLED') && (
          <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 p-4 flex gap-3">
            <XCircle className="w-5 h-5 text-red-600 shrink-0" />
            <p className="text-sm text-red-800 dark:text-red-300">
              {report.status === 'REJECTED' ? 'تم رفض البلاغ.' : 'تم إلغاء البلاغ.'}
              {report.rejection_reason && <span> السبب: {report.rejection_reason}</span>}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
