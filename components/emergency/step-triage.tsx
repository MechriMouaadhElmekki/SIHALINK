'use client';
import { useState, useEffect } from 'react';
import { useEmergencyStore } from '@/store/emergency-report.store';
import type { TriageAnswer } from '@/store/emergency-report.store';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Question {
  key: string;
  text_ar: string;
  options: { value: string; label_ar: string; weight: number }[];
}

const TRIAGE_QUESTIONS: Question[] = [
  {
    key: 'conscious',
    text_ar: 'هل الشخص واعٍ ويستجيب للمحادثة؟',
    options: [
      { value: 'yes',     label_ar: 'نعم',              weight: 0 },
      { value: 'no',      label_ar: 'لا — فاقد الوعي', weight: 30 },
      { value: 'partial', label_ar: 'جزئياً',           weight: 15 },
    ],
  },
  {
    key: 'breathing',
    text_ar: 'هل يتنفس بشكل طبيعي؟',
    options: [
      { value: 'yes',        label_ar: 'نعم',                     weight: 0  },
      { value: 'no',         label_ar: 'لا — لا يتنفس',        weight: 40 },
      { value: 'difficulty', label_ar: 'يتنفس بصعوبة', weight: 25 },
    ],
  },
  {
    key: 'bleeding',
    text_ar: 'هل يوجد نزيف حاد؟',
    options: [
      { value: 'no',     label_ar: 'لا',                   weight: 0  },
      { value: 'minor',  label_ar: 'نزيف بسيط',    weight: 5  },
      { value: 'severe', label_ar: 'نزيف حاد جداً', weight: 25 },
    ],
  },
  {
    key: 'trapped',
    text_ar: 'هل الشخص محاصر أو عاجز عن الحركة؟',
    options: [
      { value: 'no',      label_ar: 'لا',            weight: 0  },
      { value: 'yes',     label_ar: 'نعم',           weight: 20 },
      { value: 'unknown', label_ar: 'غير معروف', weight: 5  },
    ],
  },
  {
    key: 'immediate_danger',
    text_ar: 'هل يوجد خطر فوري (حريق، غاز، جدار متصدع)؟',
    options: [
      { value: 'no',  label_ar: 'لا',  weight: 0  },
      { value: 'yes', label_ar: 'نعم', weight: 20 },
    ],
  },
];

function computePriority(totalWeight: number): 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' {
  if (totalWeight >= 60) return 'CRITICAL';
  if (totalWeight >= 35) return 'HIGH';
  if (totalWeight >= 15) return 'MEDIUM';
  return 'LOW';
}

const PRIORITY_CONFIG = {
  CRITICAL: { label: 'حرج — استجابة فورية',  color: 'bg-red-100 text-red-700 border-red-300 dark:bg-red-900/30 dark:text-red-400' },
  HIGH:     { label: 'مرتفع — مستعجل',    color: 'bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-900/30 dark:text-orange-400' },
  MEDIUM:   { label: 'متوسط',                color: 'bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/30 dark:text-amber-400' },
  LOW:      { label: 'منخفض',                color: 'bg-green-100 text-green-700 border-green-300 dark:bg-green-900/30 dark:text-green-400' },
};

export function StepTriage({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const { draft, setTriage } = useEmergencyStore();
  const [answers, setAnswers] = useState<Record<string, string>>(
    Object.fromEntries(draft.triage_answers.map(a => [a.question_key, a.answer]))
  );

  const totalWeight = TRIAGE_QUESTIONS.reduce((sum, q) => {
    const opt = q.options.find(o => o.value === answers[q.key]);
    return sum + (opt?.weight ?? 0);
  }, 0);

  const priority = computePriority(totalWeight);
  const allAnswered = TRIAGE_QUESTIONS.every(q => answers[q.key]);

  function handleNext() {
    const triageAnswers: TriageAnswer[] = TRIAGE_QUESTIONS.map(q => {
      const opt = q.options.find(o => o.value === answers[q.key])!;
      return {
        question_key: q.key,
        question_text_ar: q.text_ar,
        answer: answers[q.key] || 'unknown',
        answer_display_ar: opt?.label_ar || '',
        weight: opt?.weight ?? 0,
      };
    });
    setTriage(triageAnswers, priority);
    onNext();
  }

  return (
    <div className="space-y-5" dir="rtl">
      <div>
        <h2 className="text-lg font-bold mb-1">تقييم سريع</h2>
        <p className="text-sm text-muted-foreground">أجب على هذه الأسئلة بأفضل ما تستطيع</p>
      </div>

      {TRIAGE_QUESTIONS.map((q, i) => (
        <div key={q.key} className="space-y-2">
          <p className="text-sm font-medium">{i + 1}. {q.text_ar}</p>
          <div className="flex flex-wrap gap-2">
            {q.options.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setAnswers(prev => ({ ...prev, [q.key]: opt.value }))}
                className={cn(
                  'px-4 py-2 rounded-lg border text-sm font-medium transition-all',
                  answers[q.key] === opt.value
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                    : 'border-border hover:border-blue-300 hover:bg-muted'
                )}
              >
                {opt.label_ar}
              </button>
            ))}
          </div>
        </div>
      ))}

      {allAnswered && (
        <div className={cn('rounded-xl border px-4 py-3', PRIORITY_CONFIG[priority].color)}>
          <p className="text-sm font-bold">مستوى الأولوية المحتسب: {PRIORITY_CONFIG[priority].label}</p>
          <p className="text-xs mt-0.5 opacity-80">سيتم مراجعة هذا التقييم من قبل المشغل</p>
        </div>
      )}

      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} className="flex-1">
          <ChevronRight className="w-4 h-4" /> رجوع
        </Button>
        <Button onClick={handleNext} disabled={!allAnswered} className="flex-1">
          التالي <ChevronLeft className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
