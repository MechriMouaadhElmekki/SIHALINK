'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useEmergencyStore } from '@/store/emergency-report.store';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { AlertTriangle, CheckCircle2, ChevronRight, Loader2 } from 'lucide-react';

export function StepConfirm({ onBack }: { onBack: () => void }) {
  const router = useRouter();
  const { toast } = useToast();
  const { draft, reset } = useEmergencyStore();
  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [reportId, setReportId] = useState<string | null>(null);

  async function handleSubmit() {
    setSubmitting(true);
    try {
      const res = await fetch('/api/emergency/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emergency_type: draft.emergency_type,
          description: draft.description,
          affected_count: draft.affected_count,
          additional_info: draft.additional_info,
          triage_answers: draft.triage_answers,
          priority: draft.computed_priority,
          location: draft.location,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل الإرسال');
      setReportId(data.report_number);
      setConfirmed(true);
      reset();
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'خطأ في الإرسال', description: err.message });
    } finally {
      setSubmitting(false);
    }
  }

  if (confirmed) {
    return (
      <div className="text-center space-y-5 py-4" dir="rtl">
        <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-10 h-10 text-green-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold">تم إرسال البلاغ</h2>
          {reportId && <p className="text-sm text-muted-foreground mt-1">رقم البلاغ: <span className="font-bold text-foreground">{reportId}</span></p>}
        </div>
        <div className="rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 p-3 text-start">
          <p className="text-xs text-amber-800 dark:text-amber-300">
            وضع تجريبي: بلاغك مسجّل ولكن لم يتم إرساله إلى خدمات الطوارئ الرسمية.
            في حالة الطوارئ الحقيقية اتصل بـ <strong>1021</strong>.
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <Button onClick={() => router.push(`/reports`)} className="w-full">عرض بلاغاتي</Button>
          <Button variant="outline" onClick={() => router.push('/dashboard')} className="w-full">العودة للوحة التحكم</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5" dir="rtl">
      <div>
        <h2 className="text-lg font-bold mb-1">تأكيد الإرسال</h2>
        <p className="text-sm text-muted-foreground">تأكد من أن هذا بلاغ حقيقي قبل الإرسال</p>
      </div>

      <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 space-y-2">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-red-600" />
          <p className="text-sm font-bold text-red-800 dark:text-red-300">تحذير مهم</p>
        </div>
        <p className="text-sm text-red-700 dark:text-red-400">
          استخدام هذه الميزة لبلاغات كاذبة محظور قانونياً ويعرض صاحبه للمساءلة.
          هذا النظام حالياً في وضع <strong>تجريبي</strong>.
        </p>
      </div>

      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} disabled={submitting} className="flex-1">
          <ChevronRight className="w-4 h-4" /> رجوع
        </Button>
        <Button
          variant="emergency"
          onClick={handleSubmit}
          disabled={submitting}
          className="flex-1"
          loading={submitting}
        >
          {submitting ? 'جارٍ الإرسال...' : 'إرسال البلاغ'}
        </Button>
      </div>
    </div>
  );
}
