import { z } from 'zod';

export const updateProfileSchema = z.object({
  first_name: z.string().min(2).max(50).optional(),
  last_name: z.string().min(2).max(50).optional(),
  phone: z.string().min(9).max(15).optional(),
  date_of_birth: z.string().optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY']).optional(),
  blood_type: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'UNKNOWN']).optional(),
  address: z.string().max(200).optional(),
  city: z.string().max(100).optional(),
  wilaya: z.string().max(100).optional(),
  preferred_language: z.enum(['ar', 'fr', 'en']).optional(),
  emergency_notes: z.string().max(500).optional(),
});

export const createTrustedContactSchema = z.object({
  name: z.string().min(2, 'الاسم مطلوب').max(100),
  relationship: z.string().min(2, 'طبيعة العلاقة مطلوبة').max(50),
  phone: z.string().min(9, 'رقم الهاتف غير صحيح').max(15),
  email: z.string().email().optional().or(z.literal('')),
  priority: z.number().int().min(1).max(10).default(1),
  is_primary: z.boolean().default(false),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type CreateTrustedContactInput = z.infer<typeof createTrustedContactSchema>;
