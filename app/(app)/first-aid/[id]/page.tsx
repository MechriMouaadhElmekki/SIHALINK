import { createClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, AlertTriangle, CheckCircle2, Clock, HeartPulse } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const SEVERITY_CONFIG: Record<string, { label: string; color: string }> = {
  critical: { label: 'حرج', color: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400' },
  high:     { label: 'عالي',   color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400' },
  medium:   { label: 'متوسط', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400' },
  low:      { label: 'منخفض', color: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400' },
};

export default async function FirstAidDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: guide, error } = await supabase
    .from('first_aid_guides')
    .select('*')
    .eq('id', params.id)
    .single();

  if (error || !guide) notFound();

  const sev = SEVERITY_CONFIG[guide.severity] ?? SEVERITY_CONFIG.medium;

  return (
    <div dir="rtl" className="pb-10">
      <div className="sticky top-0 z-10 bg-background border-b border-border flex items-center gap-3 px-4 h-14">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/first-aid"><ArrowRight className="w-5 h-5" /></Link>
        </Button>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-base truncate">{guide.title_ar}</p>
        </div>
        <span className={`text-xs px-2 py-1 rounded-full font-medium ${sev.color}`}>{sev.label}</span>
      </div>

      <div className="p-4 lg:p-6 space-y-4">
        {/* Call 1021 banner */}
        {(guide.severity === 'critical' || guide.severity === 'high') && (
          <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
            <div>
              <p className="text-sm font-bold text-red-800 dark:text-red-300">اتصل بالإسعاف فوراً</p>
              <a href="tel:1021" className="text-xl font-black text-red-600">1021</a>
            </div>
          </div>
        )}

        {/* Summary */}
        {guide.summary_ar && (
          <Card>
            <CardContent className="p-4">
              <p className="text-sm leading-relaxed text-muted-foreground">{guide.summary_ar}</p>
            </CardContent>
          </Card>
        )}

        {/* Steps */}
        {guide.steps_ar && Array.isArray(guide.steps_ar) && guide.steps_ar.length > 0 && (
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-600" />خطوات الإسعاف</CardTitle></CardHeader>
            <CardContent className="p-0">
              <ol className="divide-y divide-border">
                {(guide.steps_ar as string[]).map((step, i) => (
                  <li key={i} className="flex items-start gap-3 px-4 py-3">
                    <span className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                    <p className="text-sm leading-relaxed">{step}</p>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        )}

        {/* Symptoms */}
        {guide.symptoms_ar && Array.isArray(guide.symptoms_ar) && guide.symptoms_ar.length > 0 && (
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">أعراض محتملة</CardTitle></CardHeader>
            <CardContent>
              <ul className="space-y-1">
                {(guide.symptoms_ar as string[]).map((s, i) => (
                  <li key={i} className="text-sm flex items-start gap-2">
                    <span className="text-orange-500 mt-0.5">•</span>{s}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Duration */}
        {guide.estimated_time_minutes && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />وقت الإجراء: حوالي {guide.estimated_time_minutes} دقيقة
          </div>
        )}

        {/* Warning */}
        <div className="rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-4">
          <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
            ⚠️ هذه المعلومات لأغراض توجيهية فقط ولا تغني عن استشارة طبيب متخصص.
            في حالات الطوارئ اتصل بـ <strong>1021</strong> فوراً.
          </p>
        </div>
      </div>
    </div>
  );
}
