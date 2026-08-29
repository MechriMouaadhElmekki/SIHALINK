'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, UserCheck, MapPin, Star, ChevronRight, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const SPECIALTIES = [
  'الكل', 'طب عام', 'قلبية', 'أطفال', 'نساء وتوليد', 'عظام', 'جلدية', 'أعصاب', 'طوارئ', 'عينية',
  'أسنان', 'نفسية', 'تغذية', 'أنف وأذن وحنجرة'
];

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [specialty, setSpecialty] = useState('الكل');

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ limit: '60' });
    if (search) params.set('search', search);
    if (specialty !== 'الكل') params.set('specialty', specialty);
    fetch(`/api/doctors?${params}`)
      .then(r => r.json())
      .then(d => setDoctors(d.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [search, specialty]);

  return (
    <div dir="rtl" className="pb-6">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b border-border p-4 space-y-3">
        <h1 className="font-bold text-lg">دليل الأطباء</h1>
        <div className="relative">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            className="ps-9"
            placeholder="ابحث عن طبيب..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        {/* Specialty chips */}
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {SPECIALTIES.map(s => (
            <button
              key={s}
              onClick={() => setSpecialty(s)}
              className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                specialty === s
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-background border-border hover:border-blue-300'
              }`}
            >{s}</button>
          ))}
        </div>
      </div>

      <div className="p-4 space-y-3">
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : doctors.length === 0 ? (
          <div className="text-center py-16">
            <UserCheck className="w-10 h-10 text-muted-foreground/50 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">لا توجد نتائج</p>
          </div>
        ) : (
          doctors.map(doc => (
            <Link key={doc.id} href={`/doctors/${doc.id}`}>
              <Card className="hover:shadow-md transition-all hover:-translate-y-0.5">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-700 font-bold text-lg shrink-0">
                      {doc.first_name?.[0] ?? 'د'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold">د. {doc.first_name} {doc.last_name}</p>
                      {doc.specialty && <p className="text-sm text-blue-600 dark:text-blue-400">{doc.specialty}</p>}
                      {doc.wilaya && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3" />{doc.wilaya}{doc.city ? `, ${doc.city}` : ''}
                        </p>
                      )}
                      {doc.consultation_fee && (
                        <p className="text-xs text-green-600 dark:text-green-400 mt-0.5">أتعاب: {doc.consultation_fee} د.ج</p>
                      )}
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 mt-1 rtl:rotate-180" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
