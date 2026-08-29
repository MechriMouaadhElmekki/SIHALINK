import { createClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, MapPin, Phone, Clock, Globe, Navigation, Building2, Ambulance } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const TYPE_LABEL: Record<string, string> = {
  hospital: 'مستشفى', clinic: 'عيادة', emergency_center: 'مركز طوارئ',
  health_center: 'مركز صحي', polyclinic: 'متعدد خدمات', specialist_center: 'مركز متخصص',
};

export default async function FacilityDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: f, error } = await supabase
    .from('health_facilities')
    .select('*')
    .eq('id', params.id)
    .single();

  if (error || !f) notFound();

  return (
    <div dir="rtl" className="pb-10">
      <div className="sticky top-0 z-10 bg-background border-b border-border flex items-center gap-3 px-4 h-14">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/facilities"><ArrowRight className="w-5 h-5" /></Link>
        </Button>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-base truncate">{f.name}</p>
          {f.facility_type && <p className="text-xs text-muted-foreground">{TYPE_LABEL[f.facility_type] ?? f.facility_type}</p>}
        </div>
      </div>

      <div className="p-4 lg:p-6 space-y-4">
        {/* Hero */}
        <Card>
          <CardContent className="p-5 flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center shrink-0">
              <Building2 className="w-7 h-7 text-blue-600" />
            </div>
            <div>
              <p className="text-lg font-bold">{f.name}</p>
              {f.facility_type && <p className="text-blue-600 dark:text-blue-400 text-sm font-medium">{TYPE_LABEL[f.facility_type]}</p>}
              {f.has_emergency && (
                <span className="inline-flex items-center gap-1 text-xs bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400 px-2 py-0.5 rounded-full mt-1">
                  <Ambulance className="w-3 h-3" />طوارئ 24/7
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Contact */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">الموقع والاتصال</CardTitle></CardHeader>
          <CardContent className="space-y-2.5">
            {(f.address || f.city || f.wilaya) && (
              <p className="text-sm flex items-start gap-2">
                <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                {[f.address, f.city, f.wilaya].filter(Boolean).join(', ')}
              </p>
            )}
            {f.phone && (
              <a href={`tel:${f.phone}`} className="text-sm flex items-center gap-2 text-blue-600 hover:underline">
                <Phone className="w-4 h-4" />{f.phone}
              </a>
            )}
            {f.emergency_phone && (
              <a href={`tel:${f.emergency_phone}`} className="text-sm flex items-center gap-2 text-red-600 hover:underline font-medium">
                <Phone className="w-4 h-4" />{f.emergency_phone} (طوارئ)
              </a>
            )}
            {f.opening_hours && (
              <p className="text-sm flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />{f.opening_hours}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Services */}
        {f.services && Array.isArray(f.services) && f.services.length > 0 && (
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">الخدمات</CardTitle></CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {(f.services as string[]).map(s => (
                  <span key={s} className="px-3 py-1 rounded-full bg-muted text-xs font-medium">{s}</span>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Google Maps */}
        {f.latitude && f.longitude && (
          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${f.latitude},${f.longitude}`}
            target="_blank" rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full rounded-xl border border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800 py-3 text-blue-700 dark:text-blue-300 font-medium text-sm hover:bg-blue-100 transition-colors"
          >
            <Navigation className="w-4 h-4" />فتح في خرائط Google
          </a>
        )}
      </div>
    </div>
  );
}
