'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, ChevronRight, Loader2, HeartPulse, AlertTriangle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';

const CATEGORIES = [
  { value: '', label: 'الكل' },
  { value: 'cardiac', label: 'قلبي' },
  { value: 'respiratory', label: 'تنفسي' },
  { value: 'trauma', label: 'إصابات' },
  { value: 'burns', label: 'حروق' },
  { value: 'poisoning', label: 'تسمم' },
  { value: 'pediatric', label: 'أطفال' },
  { value: 'obstetric', label: 'ولادة' },
  { value: 'neurological', label: 'عصبي' },
];

const SEVERITY_CONFIG: Record<string, { label: string; color: string }> = {
  critical: { label: 'حرج', color: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400' },
  high:     { label: 'عالي',   color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400' },
  medium:   { label: 'متوسط', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400' },
  low:      { label: 'منخفض', color: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400' },
};

export default function FirstAidPage() {
  const [guides, setGuides] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ limit: '60' });
    if (search) params.set('search', search);
    if (category) params.set('category', category);
    fetch(`/api/first-aid?${params}`)
      .then(r => r.json())
      .then(d => setGuides(d.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [search, category]);

  return (
    <div dir="rtl" className="pb-6">
      <div className="sticky top-0 z-10 bg-background border-b border-border p-4 space-y-3">
        <h1 className="font-bold text-lg">دليل الإسعافات الأولية</h1>
        <div className="relative">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input className="ps-9" placeholder="ابحث..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {CATEGORIES.map(c => (
            <button key={c.value} onClick={() => setCategory(c.value)}
              className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                category === c.value ? 'bg-red-600 text-white border-red-600' : 'bg-background border-border hover:border-red-300'
              }`}>{c.label}</button>
          ))}
        </div>
      </div>

      <div className="p-4 space-y-3">
        {/* Emergency number banner */}
        <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
          <div>
            <p className="text-sm font-bold text-red-800 dark:text-red-300">في حالة طوارئ اتصل فوراً</p>
            <a href="tel:1021" className="text-2xl font-black text-red-600 hover:underline">1021</a>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-red-600" /></div>
        ) : guides.length === 0 ? (
          <div className="text-center py-16">
            <HeartPulse className="w-10 h-10 text-muted-foreground/50 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">لا توجد نتائج</p>
          </div>
        ) : guides.map(g => {
          const sev = SEVERITY_CONFIG[g.severity] ?? SEVERITY_CONFIG.medium;
          return (
            <Link key={g.id} href={`/first-aid/${g.id}`}>
              <Card className="hover:shadow-md transition-all hover:-translate-y-0.5">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center shrink-0">
                      <HeartPulse className="w-5 h-5 text-red-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-sm">{g.title_ar}</p>
                        <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${sev.color}`}>{sev.label}</span>
                      </div>
                      {g.summary_ar && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{g.summary_ar}</p>}
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 mt-1 rtl:rotate-180" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
