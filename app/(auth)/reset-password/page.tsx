'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

const schema = z.object({
  password: z.string().min(8).regex(/[A-Z]/).regex(/[0-9]/),
  confirm_password: z.string(),
}).refine(d => d.password === d.confirm_password, { message: 'كلمتا المرور غير متطابقتان', path: ['confirm_password'] });
type FormData = z.infer<typeof schema>;

export default function ResetPasswordPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [show, setShow] = useState(false);
  const [done, setDone] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormData) {
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: data.password });
    if (error) {
      toast({ variant: 'destructive', title: 'خطأ', description: error.message });
      return;
    }
    setDone(true);
    setTimeout(() => router.push('/dashboard'), 2000);
  }

  if (done) {
    return (
      <Card className="shadow-xl border-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur text-center">
        <CardHeader>
          <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" />
          <CardTitle>تم تغيير كلمة المرور</CardTitle>
          <CardDescription>جارٍ تحويلك...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="shadow-xl border-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur">
      <CardHeader className="text-center">
        <CardTitle>تعيين كلمة مرور جديدة</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" dir="rtl" noValidate>
          <div className="space-y-1">
            <Label htmlFor="password">كلمة المرور الجديدة</Label>
            <div className="relative">
              <Input id="password" type={show ? 'text' : 'password'} error={errors.password?.message} {...register('password')} />
              <button type="button" className="absolute inset-y-0 start-3 flex items-center text-muted-foreground" onClick={() => setShow(!show)}>
                {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="confirm_password">تأكيد كلمة المرور</Label>
            <Input id="confirm_password" type="password" error={errors.confirm_password?.message} {...register('confirm_password')} />
          </div>
          <Button type="submit" className="w-full" loading={isSubmitting}>حفظ كلمة المرور</Button>
        </form>
      </CardContent>
    </Card>
  );
}
