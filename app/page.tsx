import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Heart, AlertTriangle, UserCheck, Building2, BookOpen, Shield, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default async function HomePage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect('/dashboard');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950" dir="rtl">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur border-b border-border">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center">
              <Heart className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg">SIHALINK</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" asChild size="sm"><Link href="/login">تسجيل الدخول</Link></Button>
            <Button asChild size="sm"><Link href="/register">إنشاء حساب</Link></Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 py-16 lg:py-24 text-center">
        <div className="inline-flex items-center gap-2 bg-red-50 dark:bg-red-900/20 text-red-600 px-4 py-2 rounded-full text-sm font-medium mb-6 border border-red-100 dark:border-red-800">
          <AlertTriangle className="w-4 h-4" />
          منصة طوارئ وصحة رقمية &mdash; وضع تجريبي
        </div>
        <h1 className="text-4xl lg:text-6xl font-extrabold text-gray-900 dark:text-white mb-6 leading-tight">
          صحة لينك
          <span className="block text-blue-600 mt-2 text-3xl lg:text-4xl">SIHALINK</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10">
          منصة رقمية متكاملة لإدارة حالات الطوارئ والتنسيق مع المرافق الصحية والأطباء في الجزائر.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button size="xl" asChild className="shadow-lg">
            <Link href="/register">ابدأ الآن <ChevronLeft className="w-5 h-5" /></Link>
          </Button>
          <Button size="xl" variant="outline" asChild>
            <Link href="/login">تسجيل الدخول</Link>
          </Button>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-4 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {([
            { icon: AlertTriangle, title: 'إدارة الطوارئ',      desc: 'إبلاغ فوري مع تقييم (ترياج) وتتبع حالة الطارئة لحظة بلحظة', color: 'text-red-600',    bg: 'bg-red-50    dark:bg-red-900/20'    },
            { icon: UserCheck,    title: 'دليل الأطباء',      desc: 'ابحث عن طبيب حسب التخصص والموقع واحجز موعداً مباشرة', color: 'text-blue-600',   bg: 'bg-blue-50   dark:bg-blue-900/20'   },
            { icon: Building2,    title: 'المرافق الصحية',   desc: 'عثور على أقرب مستشفى أو عيادة أو مركز طبي',    color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
            { icon: BookOpen,     title: 'الإسعافات الأولية', desc: 'دليل شامل بخطوات واضحة ومراجعة طبية',           color: 'text-green-600',  bg: 'bg-green-50  dark:bg-green-900/20'  },
            { icon: Shield,       title: 'أمان وخصوصية',    desc: 'بياناتك محمية ومشفرة مع إدارة صلاحيات دقيقة',   color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/20' },
            { icon: Heart,        title: 'وصفوة طبية رقمية',  desc: 'سجلاتك الطبية وجهات الاتصال الطارئة دائماً في متناولك', color: 'text-pink-600',   bg: 'bg-pink-50   dark:bg-pink-900/20'   },
          ] as const).map(({ icon: Icon, title, desc, color, bg }) => (
            <div key={title} className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-border shadow-sm hover:shadow-md transition-shadow">
              <div className={`w-12 h-12 ${bg} rounded-xl flex items-center justify-center mb-4`}>
                <Icon className={`w-6 h-6 ${color}`} />
              </div>
              <h3 className="font-bold text-base mb-2">{title}</h3>
              <p className="text-sm text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
