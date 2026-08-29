'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, MapPin, Clock, Phone, ChevronRight, Loader2, Pill } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';

const WILAYAS_TOP = ['الكل', 'الجزائر', 'وهران', 'قسنطينة', 'عنابة', 'باتنة', 'سطيف', 'تلمسان', 'بجاية', 'بليدة'];

export default function PharmaciesPage() {
  const [pharmacies, setPharmacies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [wilaya, setWilaya] = useState('الكل');
  const [onDuty, setOnDuty] = useState(false);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ limit: '60' });
    if (search) params.set('search', search);
    if (wilaya !== 'الكل') params.set('wilaya', wilaya);
    if (onDuty) params.set('on_duty', 'true');
    fetch(`/api/pharmacies?${params}`)
      .then(r => r.json())
      .then(d => setPharmacies(d.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [search, wilaya, onDuty]);

  return (
    <div dir="rtl" className="pb-6">
      <div className="sticky top-0 z-10 bg-background border-b border-border p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h1 className="font-bold text-lg">الصيدليات</h1>
          <button
            onClick={() => setOnDuty(v => !v)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
              onDuty
                ? 'bg-green-600 text-white border-green-600'
                : 'bg-background border-border hover:border-green-400'
            }`}
          >صيدلية الدورية</button>
        </div>
        <div className="relative">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input className="ps-9" placeholder="ابحث عن صيدلية..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {WILAYAS_TOP.map(w => (
            <button key={w} onClick={() => setWilaya(w)}
              className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                wilaya === w ? 'bg-blue-600 text-white border-blue-600' : 'bg-background border-border hover:border-blue-300'
              }`}>{w}</button>
          ))}
        </div>
      </div>

      <div className="p-4 space-y-3">
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
        ) : pharmacies.length === 0 ? (
          <div className="text-center py-16">
            <Pill className="w-10 h-10 text-muted-foreground/50 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">لا توجد نتائج</p>
          </div>
        ) : pharmacies.map(ph => (
          <Link key={ph.id} href={`/pharmacies/${ph.id}`}>
            <Card className="hover:shadow-md transition-all hover:-translate-y-0.5">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    ph.is_on_duty ? 'bg-green-100 dark:bg-green-900/30' : 'bg-muted'
                  }`}>
                    <Pill className={`w-5 h-5 ${ph.is_on_duty ? 'text-green-600' : 'text-muted-foreground'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm truncate">{ph.name}</p>
                      {ph.is_on_duty && (
                        <span className="shrink-0 text-xs bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400 px-2 py-0.5 rounded-full font-medium">دورية</span>
                      )}
                    </div>
                    {(ph.wilaya || ph.city) && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3" />{[ph.city, ph.wilaya].filter(Boolean).join(', ')}
                      </p>
                    )}
                    {ph.opening_hours && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3" />{ph.opening_hours}
                      </p>
                    )}
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 mt-1 rtl:rotate-180" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
