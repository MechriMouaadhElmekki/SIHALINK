'use client';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

const STEPS = [
  { n: 1, label: 'نوع الطارئة' },
  { n: 2, label: 'تقييم' },
  { n: 3, label: 'الموقع' },
  { n: 4, label: 'وسائط' },
  { n: 5, label: 'ملخص' },
  { n: 6, label: 'تأكيد' },
];

export function WizardProgress({ current }: { current: number }) {
  return (
    <div className="w-full px-4 py-3">
      <div className="flex items-center justify-between relative">
        {/* connecting line */}
        <div className="absolute top-4 start-8 end-8 h-0.5 bg-border" />
        <div
          className="absolute top-4 start-8 h-0.5 bg-blue-500 transition-all duration-500"
          style={{ width: `${((current - 1) / (STEPS.length - 1)) * 100}%` }}
        />
        {STEPS.map(({ n, label }) => {
          const done = n < current;
          const active = n === current;
          return (
            <div key={n} className="flex flex-col items-center gap-1 relative z-10">
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all',
                  done  ? 'bg-blue-500 border-blue-500 text-white' : '',
                  active ? 'bg-white dark:bg-gray-900 border-blue-500 text-blue-600' : '',
                  !done && !active ? 'bg-white dark:bg-gray-900 border-border text-muted-foreground' : '',
                )}
              >
                {done ? <Check className="w-4 h-4" /> : n}
              </div>
              <span className={cn(
                'text-[10px] font-medium hidden sm:block',
                active ? 'text-blue-600' : 'text-muted-foreground'
              )}>{label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
