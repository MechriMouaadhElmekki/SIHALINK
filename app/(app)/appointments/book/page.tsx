'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, Loader2, Calendar, Clock, User, FileText, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const CONSULTATION_TYPES = [
  { value: 'IN_PERSON', label: 'حضوري — في العيادة' },
  { value: 'VIDEO',     label: 'مكالمة فيديو' },
  { value: 'PHONE',     label: 'مكالمة هاتفية' },
  { value: 'HOME_VISIT',label: 'زيارة منزلية' },
];

export default function BookAppointmentPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchingDoctors, setFetchingDoctors] = useState(true);

  const [form, setForm] = useState({
    doctor_id: '',
    appointment_date: '',
    appointment_time: '',
    consultation_type: 'IN_PERSON',
    reason: '',
    notes: '',
  });

  useEffect(() => {
    fetch('/api/doctors?limit=100')
      .then(r => r.json())
      .then(d => setDoctors(d.data ?? []))
      .catch(() => {})
      .finally(() => setFetchingDoctors(false));
  }, []);

  function set(k: string, v: string) { setForm(f => ({ ...f, [k]: v })); }

  const today = new Date().toISOString().split('T')[0];
  const valid = form.doctor_id && form.appointment_date >= today && form.appointment_time;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) return;
    setLoading(true);
    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل الحجز');
      toast({ title: 'تم إرسال طلب الحجز', description: 'سيتم تأكيده بعد موافقة الطبيب.' });
      router.push('/appointments');
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'خطأ', description: err.message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div dir="rtl" className="pb-10">
      <div className="sticky top-0 z-10 bg-background border-b border-border flex items-center gap-3 px-4 h-14">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/appointments"><ArrowRight className="w-5 h-5" /></Link>
        </Button>
        <h1 className="font-bold text-base">حجز موعد</h1>
      </div>

      <form onSubmit={handleSubmit} className="max-w-lg mx-auto p-4 space-y-5">
        {/* Doctor select */}
        <div className="space-y-1.5">
          <Label className="flex items-center gap-1.5"><User className="w-4 h-4" />الطبيب *</Label>
          {fetchingDoctors ? (
            <div className="h-10 rounded-lg bg-muted animate-pulse" />
          ) : (
            <select
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              value={form.doctor_id}
              onChange={e => set('doctor_id', e.target.value)}
              required
            >
              <option value="">— اختر طبيباً —</option>
              {doctors.map((d: any) => (
                <option key={d.id} value={d.id}>
                  د. {d.first_name} {d.last_name}{d.specialty ? ` — ${d.specialty}` : ''}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Consultation type */}
        <div className="space-y-1.5">
          <Label>نوع الاستشارة</Label>
          <div className="grid grid-cols-2 gap-2">
            {CONSULTATION_TYPES.map(({ value, label }) => (
              <button
                key={value} type="button"
                onClick={() => set('consultation_type', value)}
                className={cn(
                  'px-3 py-2 rounded-lg border text-sm font-medium transition-all text-center',
                  form.consultation_type === value
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                    : 'border-border hover:border-blue-300 hover:bg-muted'
                )}
              >{label}</button>
            ))}
          </div>
        </div>

        {/* Date + Time */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5"><Calendar className="w-4 h-4" />التاريخ *</Label>
            <Input type="date" min={today} value={form.appointment_date} onChange={e => set('appointment_date', e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5"><Clock className="w-4 h-4" />الوقت *</Label>
            <Input type="time" value={form.appointment_time} onChange={e => set('appointment_time', e.target.value)} required />
          </div>
        </div>

        {/* Reason */}
        <div className="space-y-1.5">
          <Label className="flex items-center gap-1.5"><FileText className="w-4 h-4" />سبب الزيارة</Label>
          <Input placeholder="الألم، متابعة، ..." value={form.reason} onChange={e => set('reason', e.target.value)} />
        </div>

        {/* Notes */}
        <div className="space-y-1.5">
          <Label>ملاحظات <span className="text-muted-foreground text-xs">(اختياري)</span></Label>
          <textarea
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm min-h-[80px] focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="أي معلومات إضافية للطبيب..."
            value={form.notes}
            onChange={e => set('notes', e.target.value)}
            maxLength={1000}
          />
        </div>

        <Button type="submit" className="w-full" size="lg" disabled={!valid || loading}>
          {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> جارٍ الحجز...</> : 'إرسال طلب الحجز'}
        </Button>
      </form>
    </div>
  );
}
