import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('البريد الإلكتروني غير صالح'),
  password: z.string().min(8, 'كلمة المرور يجب أن تكون 8 أحرف على الأقل'),
});

export const registerSchema = z.object({
  first_name: z.string().min(2, 'الاسم الأول مطلوب').max(50),
  last_name: z.string().min(2, 'اسم العائلة مطلوب').max(50),
  email: z.string().email('البريد الإلكتروني غير صالح'),
  phone: z.string().regex(/^(\+213|0)[5-7]\d{8}$/, 'رقم الهاتف غير صالح').optional().or(z.literal('')),
  password: z.string().min(8, 'كلمة المرور يجب أن تكون 8 أحرف على الأقل')
    .regex(/[A-Z]/, 'يجب أن تحتوي كلمة المرور على حرف كبير')
    .regex(/[0-9]/, 'يجب أن تحتوي كلمة المرور على رقم'),
  confirm_password: z.string(),
  agreed_to_terms: z.boolean().refine(v => v, 'يجب الموافقة على الشروط'),
}).refine(d => d.password === d.confirm_password, {
  message: 'كلمتا المرور غير متطابقتان',
  path: ['confirm_password'],
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('البريد الإلكتروني غير صالح'),
});

export const resetPasswordSchema = z.object({
  password: z.string().min(8, 'كلمة المرور يجب أن تكون 8 أحرف على الأقل')
    .regex(/[A-Z]/, 'يجب أن تحتوي كلمة المرور على حرف كبير')
    .regex(/[0-9]/, 'يجب أن تحتوي كلمة المرور على رقم'),
  confirm_password: z.string(),
}).refine(d => d.password === d.confirm_password, {
  message: 'كلمتا المرور غير متطابقتان',
  path: ['confirm_password'],
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
