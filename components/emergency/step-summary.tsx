'use client';
import { useState } from 'react';
import { useEmergencyStore } from '@/store/emergency-report.store';
import { Button } from '@/components/ui/button';
import { getPriorityColor } from '@/lib/utils';
import { ChevronLeft, ChevronRight, MapPin, Users, AlertTriangle } from 'lucide-react';

const TYPE_LABELS: Record<string, string> = {
  medical_emergency: 'حالة طبية طارئة', accident: 'حادث', fire: 'حريق',
  pregnancy_emergency: 'طارئة حمل', child_emergency: 'طارئة طفل', elderly_emergency: 'طارئة مسن',
  unconscious_person: 'شخص فاقد الوعي', breathing_difficulty: 'صعوبة تنفس',
  chest_pain: 'ألم صدر', severe_bleeding: 'نزيف حاد', other: 'أخرى',
};

const PRIORITY_LABELS: Record<string, string> = {
  CRITICAL: 'حرج', HIGH: 'مرتفع', MEDIUM: 'متوسط', LOW: 'منخفض',
};

export function StepSummary({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const { draft, setAdditionalInfo } = useEmergencyStore();
  const [info, setInfo] = useState(draft.additional_info);

  function handleNext() {
    setAdditionalInfo(info);
    onNext();
  }

  const loc = draft.location;
  const locText = loc
    ? loc.is_manual
      ? [loc.address, loc.city, loc.wilaya].filter(Boolean).join(' • ')
      : `${loc.latitude.toFixed(4)}, ${loc.longitude.toFixed(4)}`
    : 'غير محدد';

  return (
    <div className="space-y-5" dir="rtl">
      <div>
        <h2 className="text-lg font-bold mb-1">ملخص البلاغ</h2>
        <p className="text-sm text-muted-foreground">راجع المعلومات قبل الإرسال</p>
      </div>

      <div className="rounded-xl border border-border bg-muted/30 divide-y divide-border overflow-hidden">
        <SummaryRow label="نوع الطارئة" value={TYPE_LABELS[draft.emergency_type!] || draft.emergency_type || '—'} />
        <SummaryRow
          label="مستوى الأولوية"
          value={
            <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${getPriorityColor(draft.computed_priority)}`}>
              {PRIORITY_LABELS[draft.computed_priority]}
            </span>
          }
        />
        <SummaryRow label="عدد المتضررين" value={
          <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{draft.affected_count}</span>
        } />
        <SummaryRow label="الموقع" value={
          <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{locText}</span>
        } />
        {draft.description && <SummaryRow label="الوصف" value={draft.description} />}
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium">معلومات إضافية <span className="text-muted-foreground text-xs">(اختياري)</span></label>
        <textarea
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm min-h-[80px] focus:outline-none focus:ring-2 focus:ring-ring"
          placeholder="أي تفاصيل إضافية تساعد في التدخل..."
          value={info}
          onChange={e => setInfo(e.target.value)}
          maxLength={2000}
        />
      </div>

      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} className="flex-1">
          <ChevronRight className="w-4 h-4" /> رجوع
        </Button>
        <Button onClick={handleNext} className="flex-1">
          التالي <ChevronLeft className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 px-4 py-3">
      <span className="text-xs text-muted-foreground w-28 shrink-0 pt-0.5">{label}</span>
      <span className="text-sm font-medium flex-1">{value}</span>
    </div>
  );
}
