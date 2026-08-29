import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { AlertTriangle, FileText, Plus, ChevronRight, Filter } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Header } from '@/components/layout/header';
import { getStatusColor, getPriorityColor, formatRelative } from '@/lib/utils';

const EMERGENCY_TYPE_LABELS: Record<string, string> = {
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

export default async function ReportsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: reports } = await supabase
    .from('emergency_reports')
    .select('id, report_number, emergency_type, priority, status, created_at, location_wilaya, location_city, affected_count')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50);

  const { count: unreadCount } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('is_read', false);

  return (
    <div dir="rtl">
      <Header
        title="بلاغاتي"
        subtitle={`${reports?.length ?? 0} بلاغ إجمالياً`}
        unreadCount={unreadCount ?? 0}
      />
      <div className="p-4 lg:p-6 space-y-4">
        {/* Action bar */}
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-muted-foreground">جميع البلاغات</h2>
          <Button size="sm" asChild>
            <Link href="/emergency">
              <Plus className="w-4 h-4" /> بلاغ جديد
            </Link>
          </Button>
        </div>

        {/* List */}
        {reports && reports.length > 0 ? (
          <div className="space-y-3">
            {reports.map((r) => (
              <Link key={r.id} href={`/reports/${r.id}`}>
                <Card className="hover:shadow-md transition-all hover:-translate-y-0.5 border">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-bold border ${getPriorityColor(r.priority)}`}>
                            {PRIORITY_LABELS[r.priority] ?? r.priority}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getStatusColor(r.status)}`}>
                            {STATUS_LABELS[r.status] ?? r.status}
                          </span>
                        </div>
                        <p className="text-base font-semibold">
                          {EMERGENCY_TYPE_LABELS[r.emergency_type] ?? r.emergency_type}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">{r.report_number}</p>
                        {(r.location_wilaya || r.location_city) && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            📍 {[r.location_city, r.location_wilaya].filter(Boolean).join(', ')}
                          </p>
                        )}
                      </div>
                      <div className="text-end shrink-0">
                        <p className="text-xs text-muted-foreground">{formatRelative(r.created_at)}</p>
                        {r.affected_count > 1 && (
                          <p className="text-xs text-muted-foreground mt-1">{r.affected_count} متضرر</p>
                        )}
                        <ChevronRight className="w-4 h-4 text-muted-foreground mt-1 ms-auto rtl:rotate-180" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 space-y-4">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
              <FileText className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">لا يوجد بلاغات بعد</p>
            <Button asChild>
              <Link href="/emergency">إنشاء بلاغ جديد</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
