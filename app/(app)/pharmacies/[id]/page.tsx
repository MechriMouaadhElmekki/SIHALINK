import { createClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, MapPin, Phone, Clock, Globe, Navigation } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default async function PharmacyDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: ph, error } = await supabase
    .from('pharmacies')
    .select('*')
    .eq('id', params.id)
    .single();

  if (error || !ph) notFound();

  return (
    <div dir="rtl" className="pb-10">
      <div className="sticky top-0 z-10 bg-background border-b border-border flex items-center gap-3 px-4 h-14">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/pharmacies"><ArrowRight className="w-5 h-5" /></Link>
        </Button>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-base truncate">{ph.name}</p>
          {ph.is_on_duty && (
            <span className="text-xs bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400 px-2 py-0.5 rounded-full">صيدلية الدورية</span>
          )}
        </div>
      </div>

      <div className="p-4 lg:p-6 space-y-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">معلومات الصيدلية</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {(ph.address || ph.city || ph.wilaya) && (
              <p className="text-sm flex items-start gap-2">
                <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                {[ph.address, ph.city, ph.wilaya].filter(Boolean).join(', ')}
              </p>
            )}
            {ph.phone && (
              <a href={`tel:${ph.phone}`} className="text-sm flex items-center gap-2 text-blue-600 hover:underline">
                <Phone className="w-4 h-4" />{ph.phone}
              </a>
            )}
            {ph.opening_hours && (
              <p className="text-sm flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />{ph.opening_hours}
              </p>
            )}
            {ph.website && (
              <a href={ph.website} target="_blank" rel="noopener noreferrer" className="text-sm flex items-center gap-2 text-blue-600 hover:underline">
                <Globe className="w-4 h-4" />{ph.website}
              </a>
            )}
          </CardContent>
        </Card>

        {ph.latitude && ph.longitude && (
          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${ph.latitude},${ph.longitude}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full rounded-xl border border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800 py-3 text-blue-700 dark:text-blue-300 font-medium text-sm hover:bg-blue-100 transition-colors"
          >
            <Navigation className="w-4 h-4" />فتح في خرائط Google
          </a>
        )}

        {ph.notes && (
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">ملاحظات</CardTitle></CardHeader>
            <CardContent><p className="text-sm text-muted-foreground leading-relaxed">{ph.notes}</p></CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
