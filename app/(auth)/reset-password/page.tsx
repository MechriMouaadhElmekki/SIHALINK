"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/client';

const schema = z.object({
  password: z.string().min(8, 'كلمة المرور يجب أن تكون 8 أحرف على الأقل'),
  confirm: z.string(),
}).refine(d => d.password === d.confirm, { message: 'كلمتا المرور غير متطابقتين', path: ['confirm'] });

type Form = z.infer<typeof schema>;

export default function ResetPasswordPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const supabase = createClient();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Form>({ resolver: zodResolver(schema) });

  const onSubmit = async ({ password }: Form) => {
    setError(null);
    const { error: e } = await supabase.auth.updateUser({ password });
    if (e) { setError('حدث خطأ أثناء تحديث كلمة المرور.'); return; }
    setSuccess(true);
    setTimeout(() => router.push('/login'), 2000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 dark:from-slate-900 dark:to-slate-800 p-4" dir="rtl">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary mb-3"><span className="text-xl font-bold text-primary-foreground">SH</span></div>
          <h1 className="text-2xl font-bold text-primary">SIHALINK</h1>
        </div>
        <Card className="shadow-xl border-0">
          <CardHeader className="text-center pb-2"><CardTitle className="text-xl">تعيين كلمة مرور جديدة</CardTitle></CardHeader>
          <CardContent>
            {success ? (
              <div className="text-center space-y-4">
                <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto" />
                <p className="font-medium">تم تغيير كلمة المرور بنجاح!</p>
                <p className="text-sm text-muted-foreground">سيتم تحويلك لصفحة تسجيل الدخول...</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {error && <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm"><AlertCircle className="h-4 w-4" /><span>{error}</span></div>}
                <div className="space-y-2">
                  <Label>كلمة المرور الجديدة</Label>
                  <Input type="password" {...register('password')} />
                  {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>تأكيد كلمة المرور</Label>
                  <Input type="password" {...register('confirm')} />
                  {errors.confirm && <p className="text-xs text-destructive">{errors.confirm.message}</p>}
                </div>
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin me-2" /> : null}
                  {isSubmitting ? 'جارٍ التحديث...' : 'تحديث كلمة المرور'}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
