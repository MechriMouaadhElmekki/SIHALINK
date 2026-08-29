'use client';
import { useState } from 'react';
import { useEmergencyStore } from '@/store/emergency-report.store';
import type { EmergencyType } from '@/types/database';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Stethoscope, Car, Flame, Baby, Users, HeartPulse,
  Brain, Wind, Heart, Droplets, HelpCircle, ChevronLeft
} from 'lucide-react';

const TYPES: { key: EmergencyType; label: string; icon: React.ElementType; color: string }[] = [
  { key: 'medical_emergency',   label: 'حالة طبية طارئة', icon: Stethoscope, color: 'text-red-600 bg-red-50 dark:bg-red-900/20 border-red-200' },
  { key: 'accident',            label: 'حادث',               icon: Car,          color: 'text-orange-600 bg-orange-50 dark:bg-orange-900/20 border-orange-200' },
  { key: 'fire',                label: 'حريق',               icon: Flame,        color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20 border-amber-200' },
  { key: 'pregnancy_emergency', label: 'طارئة حمل',          icon: Baby,         color: 'text-pink-600 bg-pink-50 dark:bg-pink-900/20 border-pink-200' },
  { key: 'child_emergency',     label: 'طارئة طفل',          icon: Users,        color: 'text-purple-600 bg-purple-50 dark:bg-purple-900/20 border-purple-200' },
  { key: 'elderly_emergency',   label: 'طارئة مسن',          icon: HeartPulse,   color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 border-blue-200' },
  { key: 'unconscious_person',  label: 'شخص فاقد الوعي',  icon: Brain,        color: 'text-gray-700 bg-gray-50 dark:bg-gray-800 border-gray-300' },
  { key: 'breathing_difficulty',label: 'صعوبة تنفس',      icon: Wind,         color: 'text-cyan-600 bg-cyan-50 dark:bg-cyan-900/20 border-cyan-200' },
  { key: 'chest_pain',          label: 'ألم في الصدر',     icon: Heart,        color: 'text-red-700 bg-red-50 dark:bg-red-900/20 border-red-200' },
  { key: 'severe_bleeding',     label: 'نزيف حاد',         icon: Droplets,     color: 'text-rose-600 bg-rose-50 dark:bg-rose-900/20 border-rose-200' },
  { key: 'other',               label: 'أخرى',               icon: HelpCircle,   color: 'text-gray-600 bg-gray-50 dark:bg-gray-800 border-gray-200' },
];

export function StepType({ onNext }: { onNext: () => void }) {
  const { draft, setType } = useEmergencyStore();
  const [selected, setSelected] = useState<EmergencyType | null>(draft.emergency_type);
  const [description, setDescription] = useState(draft.description);
  const [count, setCount] = useState(draft.affected_count);

  function handleNext() {
    if (!selected) return;
    setType(selected, description, count);
    onNext();
  }

  return (
    <div className="space-y-5" dir="rtl">
      <div>
        <h2 className="text-lg font-bold mb-1">نوع حالة الطارئة</h2>
        <p className="text-sm text-muted-foreground">اختر الوصف الأقرب للحالة التي تتعامل معها</p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {TYPES.map(({ key, label, icon: Icon, color }) => (
          <button
            key={key}
            type="button"
            onClick={() => setSelected(key)}
            className={cn(
              'flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all text-center',
              selected === key
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-sm'
                : 'border-transparent hover:border-border ' + color
            )}
          >
            <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', color)}>
              <Icon className="w-5 h-5" />
            </div>
            <span className="text-xs font-medium leading-tight">{label}</span>
          </button>
        ))}
      </div>

      {selected && (
        <>
          <div className="space-y-1">
            <label className="text-sm font-medium">وصف مختصر <span className="text-muted-foreground">(اختياري)</span></label>
            <textarea
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm min-h-[80px] focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="صف ما يحدث بإيجاز..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={1000}
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">عدد المتضررين</label>
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => setCount(Math.max(1, count - 1))}
                className="w-9 h-9 rounded-full border border-input flex items-center justify-center text-lg font-bold hover:bg-muted transition-colors">−</button>
              <span className="text-xl font-bold w-8 text-center">{count}</span>
              <button type="button" onClick={() => setCount(Math.min(100, count + 1))}
                className="w-9 h-9 rounded-full border border-input flex items-center justify-center text-lg font-bold hover:bg-muted transition-colors">+</button>
            </div>
          </div>
        </>
      )}

      <Button
        onClick={handleNext}
        disabled={!selected}
        className="w-full"
        size="lg"
      >
        التالي <ChevronLeft className="w-4 h-4" />
      </Button>
    </div>
  );
}
