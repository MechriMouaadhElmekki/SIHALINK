"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createClient } from '@/lib/supabase/client';

const registerSchema = z.object({
  first_name: z.string().min(2, 'الاسم الأول مطلوب (حرفان على الأقل)'),
  last_name: z.string().min(2, 'اسم العائلة مطلوب (حرفان على الأقل)'),
  email: z.string().email('البريد الإلكتروني غير صحيح'),
  phone: z.string().min(9, 'رقم الهاتف يجب أن يكون 9 أرقام على الأقل'),
  wilaya: z.string().min(1, 'الولاية مطلوبة'),
  password: z.string().min(8, 'كلمة المرور يجب أن تكون 8 أحرف على الأقل'),
  confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, {
  message: 'كلمتا المرور غير متطابقتين',
  path: ['confirmPassword'],
});

type RegisterForm = z.infer<typeof registerSchema>;

const WILAYAS = ['الجزائر','وهران','قسنطينة','عنابة','سطيف','بجاية','تلمسان','باتنة','بليدة','تيزي وزو','البويرة','مستغانم','سيدي بلعباس','سكيكدة','بسكرة','ورقلة','غرداية','تبسة','خنشلة','جيجل','برج بوعريريج','المسيلة','الشلف','معسكر','تيارت','سعيدة','الأغواط','المدية','بومرداس','تيبازة'];

export default function RegisterPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const supabase = createClient();

  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterForm) => {
    setError(null);
    const { error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          first_name: data.first_name,
          last_name: data.last_name,
          phone: data.phone,
          wilaya: data.wilaya,
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (authError) {
      if (authError.message.includes('already registered')) {
        setError('هذا البريد الإلكتروني مسجل بالفعل. يرجى تسجيل الدخول.');
      } else {
        setError('حدث خطأ أثناء إنشاء الحساب. يرجى المحاولة مجدداً.');
      }
      return;
    }
    setSuccess(true);
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 dark:from-slate-900 dark:to-slate-800 p-4" dir="rtl">
        <Card className="w-full max-w-md shadow-xl border-0">
          <CardContent className="pt-8 text-center space-y-4">
            <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
            <h2 className="text-xl font-bold">تم إنشاء الحساب بنجاح!</h2>
            <p className="text-muted-foreground">يرجى التحقق من بريدك الإلكتروني لتفعيل الحساب.</p>
            <Button asChild className="w-full">
              <Link href="/login">العودة لتسجيل الدخول</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 dark:from-slate-900 dark:to-slate-800 p-4" dir="rtl">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary mb-3">
            <span className="text-xl font-bold text-primary-foreground">SH</span>
          </div>
          <h1 className="text-2xl font-bold text-primary">SIHALINK</h1>
        </div>

        <Card className="shadow-xl border-0">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-xl">إنشاء حساب جديد</CardTitle>
            <CardDescription>انضم لمنصة الطوارئ والرعاية الصحية</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {error && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="first_name">الاسم الأول</Label>
                  <Input id="first_name" {...register('first_name')} />
                  {errors.first_name && <p className="text-xs text-destructive">{errors.first_name.message}</p>}
                </div>
                <div className="space-y-1">
                  <Label htmlFor="last_name">اسم العائلة</Label>
                  <Input id="last_name" {...register('last_name')} />
                  {errors.last_name && <p className="text-xs text-destructive">{errors.last_name.message}</p>}
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="email">البريد الإلكتروني</Label>
                <Input id="email" type="email" dir="ltr" {...register('email')} />
                {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
              </div>
              <div className="space-y-1">
                <Label htmlFor="phone">رقم الهاتف</Label>
                <Input id="phone" type="tel" dir="ltr" placeholder="0555123456" {...register('phone')} />
                {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
              </div>
              <div className="space-y-1">
                <Label>الولاية</Label>
                <Select onValueChange={(v) => setValue('wilaya', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر الولاية" />
                  </SelectTrigger>
                  <SelectContent>
                    {WILAYAS.map(w => <SelectItem key={w} value={w}>{w}</SelectItem>)}
                  </SelectContent>
                </Select>
                {errors.wilaya && <p className="text-xs text-destructive">{errors.wilaya.message}</p>}
              </div>
              <div className="space-y-1">
                <Label htmlFor="password">كلمة المرور</Label>
                <div className="relative">
                  <Input id="password" type={showPassword ? 'text' : 'password'} {...register('password')} />
                  <Button type="button" variant="ghost" size="icon" className="absolute start-0 top-0 h-10 w-10" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
              </div>
              <div className="space-y-1">
                <Label htmlFor="confirmPassword">تأكيد كلمة المرور</Label>
                <Input id="confirmPassword" type="password" {...register('confirmPassword')} />
                {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>}
              </div>
              <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin me-2" /> : null}
                {isSubmitting ? 'جارٍ إنشاء الحساب...' : 'إنشاء الحساب'}
              </Button>
            </form>
            <div className="mt-4 text-center text-sm">
              <span className="text-muted-foreground">لديك حساب بالفعل؟ </span>
              <Link href="/login" className="text-primary font-medium hover:underline">تسجيل الدخول</Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
