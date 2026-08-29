'use client';
import { useState } from 'react';
import { useEmergencyStore } from '@/store/emergency-report.store';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Image, X } from 'lucide-react';

export function StepMedia({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  // Media upload is optional — skipping to next is always allowed.
  // In a production deployment, files would be uploaded to Supabase Storage.
  // For now we store nothing and proceed.
  const { draft } = useEmergencyStore();
  const [note] = useState(true);

  return (
    <div className="space-y-5" dir="rtl">
      <div>
        <h2 className="text-lg font-bold mb-1">وسائط إضافية</h2>
        <p className="text-sm text-muted-foreground">صور أو مقاطع فيديو تساعد المشغل على تقييم الحالة <span className="text-muted-foreground">(اختيارية)</span></p>
      </div>

      <div className="rounded-xl border-2 border-dashed border-border p-8 text-center space-y-2 bg-muted/30">
        <Image className="w-10 h-10 text-muted-foreground/50 mx-auto" />
        <p className="text-sm text-muted-foreground">رفع صورة أو فيديو — <span className="text-xs">سيتوفر قريباً</span></p>
        <p className="text-xs text-muted-foreground/70">تحميل الوسائط غير متوفر في الوضع التجريبي</p>
      </div>

      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} className="flex-1">
          <ChevronRight className="w-4 h-4" /> رجوع
        </Button>
        <Button onClick={onNext} className="flex-1">
          التالي <ChevronLeft className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
