'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, UserPlus } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

const schema = z.object({
  first_name: z.string().min(2, 'الاسم الأول مطلوب (2 أحرف على الأقل)').max(50),
  last_name: z.string().min(2, 'اللقب مطلوب (2 أحرف على الأقل)').max(50),
  email: z.string().email('البريد الإلكتروني غير صحيح'),
  phone: z.string().regex(/^(\+213|0)[5-7][0-9]{8}$/, 'رقم الهاتف غير صحيح').optional().or(z.literal('')),
  preferred_language: z.enum(['ar', 'fr', 'en']).default('ar'),
  password: z.string().min(8, 'كلمة المرور يجب أن تكون 8 أحرف على الأقل')
    .regex(/[A-Z]/, 'يجب أن تحتوي على حرف كبير')
    .regex(/[0-9]/, 'يجب أن تحتوي على رقم'),
  confirm_password: z.string(),
}).refine(d => d.password === d.confirm_password, {
  message: 'كلمتا المرور غير متطابقتان',
  path: ['confirm_password'],
});
type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);

  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { preferred_language: 'ar' },
  });

  async function onSubmit(data: FormData) {
    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          first_name: data.first_name,
          last_name: data.last_name,
          phone: data.phone || null,
          preferred_language: data.preferred_language,
        },
        emailRedirectTo: `${window.location.origin}/verify-email`,
      },
    });
    if (error) {
      toast({ variant: 'destructive', title: 'فشل إنشاء الحساب', description: error.message });
      return;
    }
    router.push('/verify-email');
  }

  return (
    <Card className="shadow-xl border-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur">
      <CardHeader className="text-center pb-2">
        <CardTitle className="text-2xl font-bold">إنشاء حساب</CardTitle>
        <CardDescription>انضم إلى SIHALINK</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3" dir="rtl" noValidate>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="first_name">الاسم الأول</Label>
              <Input id="first_name" error={errors.first_name?.message} {...register('first_name')} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="last_name">اللقب</Label>
              <Input id="last_name" error={errors.last_name?.message} {...register('last_name')} />
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="email">البريد الإلكتروني</Label>
            <Input id="email" type="email" dir="ltr" error={errors.email?.message} {...register('email')} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="phone">رقم الهاتف <span className="text-muted-foreground text-xs">(اختياري)</span></Label>
            <Input id="phone" type="tel" placeholder="0XX XXX XXXX" dir="ltr" error={errors.phone?.message} {...register('phone')} />
          </div>
          <div className="space-y-1">
            <Label>اللغة المفضلة</Label>
            <Select
              defaultValue="ar"
              onValueChange={(v) => setValue('preferred_language', v as 'ar' | 'fr' | 'en')}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ar">العربية</SelectItem>
                <SelectItem value="fr">Français</SelectItem>
                <SelectItem value="en">English</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="password">كلمة المرور</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                error={errors.password?.message}
                {...register('password')}
              />
              <button type="button" className="absolute inset-y-0 start-3 flex items-center text-muted-foreground" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="confirm_password">تأكيد كلمة المرور</Label>
            <Input id="confirm_password" type="password" error={errors.confirm_password?.message} {...register('confirm_password')} />
          </div>
          <Button type="submit" className="w-full mt-2" loading={isSubmitting}>
            <UserPlus className="w-4 h-4" />
            إنشاء الحساب
          </Button>
        </form>
      </CardContent>
      <CardFooter className="justify-center text-sm text-muted-foreground">
        لديك حساب بالفعل؟&nbsp;
        <Link href="/login" className="text-blue-600 font-medium hover:underline">تسجيل الدخول</Link>
      </CardFooter>
    </Card>
  );
}
