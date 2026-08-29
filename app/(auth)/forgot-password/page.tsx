'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, ArrowRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const schema = z.object({ email: z.string().email('البريد الإلكتروني غير صحيح') });
type FormData = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormData) {
    const supabase = createClient();
    await supabase.auth.resetPasswordForEmail(data.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setSent(true);
  }

  if (sent) {
    return (
      <Card className="shadow-xl border-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur text-center">
        <CardHeader>
          <div className="mx-auto w-14 h-14 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-2">
            <Mail className="w-7 h-7 text-blue-600" />
          </div>
          <CardTitle>تحقق من بريدك الإلكتروني</CardTitle>
          <CardDescription>تم إرسال رابط إعادة التعيين إلى بريدك الإلكتروني.</CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/login" className="text-blue-600 text-sm hover:underline flex items-center justify-center gap-1">
            <ArrowRight className="w-4 h-4" /> العودة لتسجيل الدخول
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-xl border-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">نسيت كلمة المرور؟</CardTitle>
        <CardDescription>أدخل بريدك الإلكتروني وسنرسل لك رابط إعادة التعيين</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" dir="rtl" noValidate>
          <div className="space-y-1">
            <Label htmlFor="email">البريد الإلكتروني</Label>
            <Input id="email" type="email" dir="ltr" error={errors.email?.message} {...register('email')} />
          </div>
          <Button type="submit" className="w-full" loading={isSubmitting}>إرسال رابط إعادة التعيين</Button>
          <div className="text-center">
            <Link href="/login" className="text-sm text-muted-foreground hover:underline">العودة لتسجيل الدخول</Link>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
