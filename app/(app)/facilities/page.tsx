'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, MapPin, ChevronRight, Loader2, Building2, Phone } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';

const FACILITY_TYPES = [
  { value: '', label: 'الكل' },
  { value: 'hospital', label: 'مستشفى' },
  { value: 'clinic', label: 'عيادة' },
  { value: 'emergency_center', label: 'طوارئ' },
  { value: 'health_center', label: 'مركز صحي' },
  { value: 'polyclinic', label: 'متعدد خدمات' },
  { value: 'specialist_center', label: 'متخصص' },
];

const TYPE_LABEL: Record<string, string> = {
  hospital: 'مستشفى', clinic: 'عيادة', emergency_center: 'مركز طوارئ',
  health_center: 'مركز صحي', polyclinic: 'متعدد خدمات', specialist_center: 'مركز متخصص',
};

export default function FacilitiesPage() {
  const [facilities, setFacilities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ limit: '60' });
    if (search) params.set('search', search);
    if (type) params.set('facility_type', type);
    fetch(`/api/facilities?${params}`)
      .then(r => r.json())
      .then(d => setFacilities(d.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [search, type]);

  return (
    <div dir="rtl" className="pb-6">
      <div className="sticky top-0 z-10 bg-background border-b border-border p-4 space-y-3">
        <h1 className="font-bold text-lg">المنشآت الصحية</h1>
        <div className="relative">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input className="ps-9" placeholder="ابحث عن منشأة..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {FACILITY_TYPES.map(ft => (
            <button key={ft.value} onClick={() => setType(ft.value)}
              className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                type === ft.value ? 'bg-blue-600 text-white border-blue-600' : 'bg-background border-border hover:border-blue-300'
              }`}>{ft.label}</button>
          ))}
        </div>
      </div>

      <div className="p-4 space-y-3">
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
        ) : facilities.length === 0 ? (
          <div className="text-center py-16">
            <Building2 className="w-10 h-10 text-muted-foreground/50 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">لا توجد نتائج</p>
          </div>
        ) : facilities.map(f => (
          <Link key={f.id} href={`/facilities/${f.id}`}>
            <Card className="hover:shadow-md transition-all hover:-translate-y-0.5">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center shrink-0">
                    <Building2 className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-sm truncate">{f.name}</p>
                      {f.facility_type && (
                        <span className="shrink-0 text-xs bg-muted px-2 py-0.5 rounded-full">{TYPE_LABEL[f.facility_type] ?? f.facility_type}</span>
                      )}
                    </div>
                    {(f.wilaya || f.city) && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3" />{[f.city, f.wilaya].filter(Boolean).join(', ')}
                      </p>
                    )}
                    {f.phone && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3" />{f.phone}
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
