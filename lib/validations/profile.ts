import { z } from 'zod';

export const UpdateProfileSchema = z.object({
  first_name: z.string().min(1).max(100).optional(),
  last_name: z.string().min(1).max(100).optional(),
  phone: z.string().regex(/^\+?[0-9]{9,15}$/).optional().nullable(),
  date_of_birth: z.string().optional().nullable(),
  gender: z.enum(['male', 'female', 'prefer_not_to_say']).optional().nullable(),
  blood_type: z.enum(['A+','A-','B+','B-','AB+','AB-','O+','O-','unknown']).optional().nullable(),
  address: z.string().max(500).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  wilaya: z.string().max(100).optional().nullable(),
  preferred_language: z.enum(['ar','fr','en']).optional(),
  emergency_notes: z.string().max(1000).optional().nullable(),
});

export const TrustedContactSchema = z.object({
  name: z.string().min(1).max(100),
  relationship: z.string().min(1).max(50),
  phone: z.string().regex(/^\+?[0-9]{9,15}$/),
  email: z.string().email().optional().nullable(),
  priority: z.number().int().min(1).default(1),
  is_primary: z.boolean().default(false),
});
