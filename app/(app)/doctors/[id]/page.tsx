import { createClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, MapPin, Phone, Mail, Clock, Calendar, Star, Award, Languages } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default async function DoctorDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: doc, error } = await supabase
    .from('doctors')
    .select('*')
    .eq('id', params.id)
    .single();

  if (error || !doc) notFound();

  return (
    <div dir="rtl" className="pb-10">
      <div className="sticky top-0 z-10 bg-background border-b border-border flex items-center gap-3 px-4 h-14">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/doctors"><ArrowRight className="w-5 h-5" /></Link>
        </Button>
        <h1 className="font-bold text-base truncate">د. {doc.first_name} {doc.last_name}</h1>
      </div>

      <div className="p-4 lg:p-6 space-y-4">
        {/* Hero card */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-2xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-700 font-bold text-2xl shrink-0">
                {doc.first_name?.[0] ?? 'د'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xl font-bold">د. {doc.first_name} {doc.last_name}</p>
                {doc.specialty && <p className="text-blue-600 dark:text-blue-400 font-medium mt-0.5">{doc.specialty}</p>}
                {doc.years_experience && (
                  <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                    <Award className="w-3.5 h-3.5" />{doc.years_experience} سنوات خبرة
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact & location */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">معلومات الاتصال</CardTitle></CardHeader>
          <CardContent className="space-y-2.5">
            {(doc.wilaya || doc.city) && (
              <p className="text-sm flex items-center gap-2">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                {[doc.address, doc.city, doc.wilaya].filter(Boolean).join(', ')}
              </p>
            )}
            {doc.phone && (
              <a href={`tel:${doc.phone}`} className="text-sm flex items-center gap-2 text-blue-600 hover:underline">
                <Phone className="w-4 h-4" />{doc.phone}
              </a>
            )}
            {doc.email && (
              <a href={`mailto:${doc.email}`} className="text-sm flex items-center gap-2 text-blue-600 hover:underline">
                <Mail className="w-4 h-4" />{doc.email}
              </a>
            )}
            {doc.working_hours && (
              <p className="text-sm flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />{doc.working_hours}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Bio */}
        {doc.bio && (
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">نبذة تعريفية</CardTitle></CardHeader>
            <CardContent><p className="text-sm leading-relaxed text-muted-foreground">{doc.bio}</p></CardContent>
          </Card>
        )}

        {/* Languages */}
        {doc.languages && Array.isArray(doc.languages) && doc.languages.length > 0 && (
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Languages className="w-4 h-4" />اللغات</CardTitle></CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {(doc.languages as string[]).map(l => (
                  <span key={l} className="px-3 py-1 rounded-full bg-muted text-xs font-medium">{l}</span>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Fees */}
        {doc.consultation_fee && (
          <Card>
            <CardContent className="p-4 flex items-center justify-between">
              <span className="text-sm font-medium">تكلفة الكشف</span>
              <span className="text-lg font-bold text-green-600">{doc.consultation_fee} د.ج</span>
            </CardContent>
          </Card>
        )}

        {/* Book CTA */}
        <Button size="lg" className="w-full" asChild>
          <Link href={`/appointments/book?doctor_id=${doc.id}`}>
            <Calendar className="w-4 h-4" /> حجز موعد مع هذا الطبيب
          </Link>
        </Button>
      </div>
    </div>
  );
}
