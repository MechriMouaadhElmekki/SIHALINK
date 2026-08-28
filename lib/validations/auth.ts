import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('البريد الإلكتروني غير صحيح'),
  password: z.string().min(8, 'كلمة المرور يجب أن تكون 8 أحرف على الأقل'),
});

export const registerSchema = z.object({
  first_name: z.string().min(2, 'الاسم الأول مطلوب').max(50),
  last_name: z.string().min(2, 'اللقب مطلوب').max(50),
  email: z.string().email('البريد الإلكتروني غير صحيح'),
  phone: z.string().min(9, 'رقم الهاتف غير صحيح').max(15),
  password: z.string()
    .min(8, 'كلمة المرور يجب أن تكون 8 أحرف على الأقل')
    .regex(/[A-Z]/, 'يجب أن تحتوي على حرف كبير')
    .regex(/[0-9]/, 'يجب أن تحتوي على رقم'),
  confirm_password: z.string(),
  wilaya: z.string().min(1, 'الولاية مطلوبة'),
  city: z.string().min(1, 'المدينة مطلوبة'),
}).refine((data) => data.password === data.confirm_password, {
  message: 'كلمتا المرور غير متطابقتين',
  path: ['confirm_password'],
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('البريد الإلكتروني غير صحيح'),
});

export const resetPasswordSchema = z.object({
  password: z.string()
    .min(8, 'كلمة المرور يجب أن تكون 8 أحرف على الأقل')
    .regex(/[A-Z]/, 'يجب أن تحتوي على حرف كبير')
    .regex(/[0-9]/, 'يجب أن تحتوي على رقم'),
  confirm_password: z.string(),
}).refine((data) => data.password === data.confirm_password, {
  message: 'كلمتا المرور غير متطابقتين',
  path: ['confirm_password'],
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
