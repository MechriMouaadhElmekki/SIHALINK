import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(72),
  first_name: z.string().min(1).max(50),
  last_name: z.string().min(1).max(50),
  phone: z.string().regex(/^\+213[0-9]{8,9}$/).optional().or(z.literal('')),
  preferred_language: z.enum(['ar', 'fr', 'en']).default('ar'),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const resetPasswordSchema = z.object({
  password: z.string().min(8).max(72),
  confirm_password: z.string().min(8),
}).refine(d => d.password === d.confirm_password, {
  message: 'Passwords do not match',
  path: ['confirm_password'],
});

export const profileSchema = z.object({
  first_name: z.string().min(1).max(50),
  last_name: z.string().min(1).max(50),
  phone: z.string().optional().or(z.literal('')),
  date_of_birth: z.string().optional().or(z.literal('')),
  gender: z.enum(['MALE','FEMALE','OTHER','PREFER_NOT_TO_SAY']).optional(),
  blood_type: z.enum(['A+','A-','B+','B-','AB+','AB-','O+','O-']).optional(),
  address: z.string().max(200).optional().or(z.literal('')),
  city: z.string().max(100).optional().or(z.literal('')),
  wilaya: z.string().max(100).optional().or(z.literal('')),
  emergency_notes: z.string().max(500).optional().or(z.literal('')),
  preferred_language: z.enum(['ar','fr','en']).default('ar'),
});

export const trustedContactSchema = z.object({
  name: z.string().min(1).max(100),
  relationship: z.string().min(1).max(50),
  phone: z.string().min(8).max(20),
  email: z.string().email().optional().or(z.literal('')),
  priority: z.number().int().min(1).max(10).default(1),
  is_primary: z.boolean().default(false),
});

export const emergencyReportSchema = z.object({
  emergency_type: z.enum(['MEDICAL','ACCIDENT','FIRE','PREGNANCY','CHILD','ELDERLY','UNCONSCIOUS','BREATHING','CHEST_PAIN','BLEEDING','OTHER']),
  description: z.string().max(1000).optional().or(z.literal('')),
  additional_info: z.string().max(500).optional().or(z.literal('')),
});

export const appointmentSchema = z.object({
  doctor_id: z.string().uuid(),
  appointment_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  appointment_time: z.string().regex(/^\d{2}:\d{2}$/),
  consultation_type: z.enum(['IN_PERSON','VIDEO','PHONE']).default('IN_PERSON'),
  reason: z.string().max(500).optional().or(z.literal('')),
});

export const cancelReportSchema = z.object({
  reason: z.string().min(5).max(500),
});

export const operatorNoteSchema = z.object({
  note: z.string().min(1).max(2000),
});
