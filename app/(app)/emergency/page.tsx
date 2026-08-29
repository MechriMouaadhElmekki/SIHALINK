'use client';
import { useEmergencyStore } from '@/store/emergency-report.store';
import { WizardProgress } from '@/components/emergency/wizard-progress';
import { StepType } from '@/components/emergency/step-type';
import { StepTriage } from '@/components/emergency/step-triage';
import { StepLocation } from '@/components/emergency/step-location';
import { StepMedia } from '@/components/emergency/step-media';
import { StepSummary } from '@/components/emergency/step-summary';
import { StepConfirm } from '@/components/emergency/step-confirm';
import { Button } from '@/components/ui/button';
import { ArrowRight, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function EmergencyPage() {
  const router = useRouter();
  const { draft, setStep, reset } = useEmergencyStore();
  const step = draft.current_step;

  const next = () => setStep(Math.min(6, step + 1));
  const back = () => setStep(Math.max(1, step - 1));

  function handleCancel() {
    if (window.confirm('هل تريد إلغاء البلاغ؟ سيتم حذف جميع البيانات.')) {
      reset();
      router.push('/dashboard');
    }
  }

  return (
    <div className="min-h-dvh bg-background" dir="rtl">
      {/* Sticky header */}
      <div className="sticky top-0 z-10 bg-background border-b border-border">
        <div className="flex items-center justify-between px-4 h-14">
          <h1 className="font-bold text-base">إبلاغ حالة طارئة</h1>
          <Button variant="ghost" size="icon" onClick={handleCancel} aria-label="إلغاء">
            <X className="w-5 h-5" />
          </Button>
        </div>
        <WizardProgress current={step} />
      </div>

      {/* Step content */}
      <div className="max-w-lg mx-auto px-4 py-6">
        {step === 1 && <StepType onNext={next} />}
        {step === 2 && <StepTriage onNext={next} onBack={back} />}
        {step === 3 && <StepLocation onNext={next} onBack={back} />}
        {step === 4 && <StepMedia onNext={next} onBack={back} />}
        {step === 5 && <StepSummary onNext={next} onBack={back} />}
        {step === 6 && <StepConfirm onBack={back} />}
      </div>
    </div>
  );
}
