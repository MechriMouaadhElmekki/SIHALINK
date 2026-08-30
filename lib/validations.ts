import { z } from 'zod';

// ============================================================
// Auth schemas
// ============================================================
export const registerSchema = z.object({
  email: z.string().email('البريد الإلكتروني غير صحيح'),
  password: z.string().min(8, 'كلمة المرور يجب أن تكون 8 أحرف على الأقل')
    .regex(/[A-Z]/, 'يجب أن تحتوي كلمة المرور على حرف كبير')
    .regex(/[0-9]/, 'يجب أن تحتوي كلمة المرور على رقم'),
  first_name: z.string().min(2, 'الاسم الأول مطلوب').max(50),
  last_name: z.string().min(2, 'اللقب مطلوب').max(50),
  phone: z.string().regex(/^(\+213|0)[5-7][0-9]{8}$/, 'رقم الهاتف غير صحيح').optional().or(z.literal('')),
  preferred_language: z.enum(['ar', 'fr', 'en']).default('ar'),
});

export const loginSchema = z.object({
  email: z.string().email('البريد الإلكتروني غير صحيح'),
  password: z.string().min(1, 'كلمة المرور مطلوبة'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('البريد الإلكتروني غير صحيح'),
});

export const resetPasswordSchema = z.object({
  password: z.string().min(8, 'كلمة المرور يجب أن تكون 8 أحرف على الأقل')
    .regex(/[A-Z]/, 'يجب أن تحتوي كلمة المرور على حرف كبير')
    .regex(/[0-9]/, 'يجب أن تحتوي كلمة المرور على رقم'),
  confirm_password: z.string(),
}).refine(data => data.password === data.confirm_password, {
  message: 'كلمتا المرور غير متطابقتان',
  path: ['confirm_password'],
});

// ============================================================
// Profile schemas
// ============================================================
export const updateProfileSchema = z.object({
  first_name: z.string().min(2).max(50).optional(),
  last_name: z.string().min(2).max(50).optional(),
  phone: z.string().regex(/^(\+213|0)[5-7][0-9]{8}$/).optional().or(z.literal('')),
  date_of_birth: z.string().optional().or(z.literal('')),
  gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say']).optional(),
  blood_type: z.enum(['A+','A-','B+','B-','AB+','AB-','O+','O-','unknown']).optional(),
  address: z.string().max(200).optional(),
  city: z.string().max(100).optional(),
  wilaya: z.string().max(100).optional(),
  preferred_language: z.enum(['ar', 'fr', 'en']).optional(),
  emergency_notes: z.string().max(500).optional(),
});

// ============================================================
// Emergency report schemas
// ============================================================
export const emergencyTypeSchema = z.object({
  emergency_type: z.enum([
    'medical_emergency','accident','fire','pregnancy_emergency',
    'child_emergency','elderly_emergency','unconscious_person',
    'breathing_difficulty','chest_pain','severe_bleeding','other'
  ]),
  description: z.string().max(1000).optional(),
  affected_count: z.number().min(1).max(100).default(1),
});

export const triageAnswerSchema = z.object({
  question_key: z.string(),
  question_text_ar: z.string(),
  answer: z.string(),
  answer_display_ar: z.string().optional(),
  weight: z.number().default(0),
});

export const locationSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  accuracy: z.number().optional(),
  address: z.string().max(300).optional(),
  city: z.string().max(100).optional(),
  wilaya: z.string().max(100).optional(),
  commune: z.string().max(100).optional(),
  is_manual: z.boolean().default(false),
});

export const submitReportSchema = z.object({
  report_id: z.string().uuid(),
  additional_info: z.string().max(2000).optional(),
});

export const cancelReportSchema = z.object({
  report_id: z.string().uuid(),
  cancellation_reason: z.string().min(5).max(500),
});

// ============================================================
// Appointment schemas
// ============================================================
export const createAppointmentSchema = z.object({
  doctor_id: z.string().uuid(),
  appointment_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  appointment_time: z.string().regex(/^\d{2}:\d{2}$/),
  consultation_type: z.enum(['in_person', 'video', 'home_visit']),
  reason: z.string().min(5).max(500).optional(),
  notes: z.string().max(1000).optional(),
});

export const updateAppointmentSchema = z.object({
  status: z.enum(['CONFIRMED','RESCHEDULED','CANCELLED_BY_USER','CANCELLED_BY_DOCTOR','COMPLETED','NO_SHOW']).optional(),
  cancellation_reason: z.string().max(500).optional(),
  doctor_notes: z.string().max(1000).optional(),
});

// ============================================================
// Trusted contact schemas
// ============================================================
export const trustedContactSchema = z.object({
  name: z.string().min(2).max(100),
  relationship: z.string().min(2).max(50),
  phone: z.string().regex(/^(\+213|0)[5-7][0-9]{8}$/),
  email: z.string().email().optional().or(z.literal('')),
  priority: z.number().min(1).max(10).default(1),
  is_primary: z.boolean().default(false),
});

// ============================================================
// Search/filter schemas
// ============================================================
export const doctorSearchSchema = z.object({
  q: z.string().max(100).optional(),
  specialty_id: z.string().uuid().optional(),
  wilaya: z.string().max(100).optional(),
  city: z.string().max(100).optional(),
  consultation_type: z.enum(['in_person','video','home_visit']).optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(12),
});

export const facilitySearchSchema = z.object({
  q: z.string().max(100).optional(),
  type: z.enum(['hospital','clinic','medical_center','emergency_department','imaging_center','specialized_center']).optional(),
  wilaya: z.string().max(100).optional(),
  has_emergency: z.coerce.boolean().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(12),
});

export const pharmacySearchSchema = z.object({
  q: z.string().max(100).optional(),
  wilaya: z.string().max(100).optional(),
  is_24h: z.coerce.boolean().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(12),
});

export const labSearchSchema = pharmacySearchSchema;

export const reportStatusUpdateSchema = z.object({
  report_id: z.string().uuid(),
  new_status: z.enum(['RECEIVED','UNDER_REVIEW','ASSIGNED','ACKNOWLEDGED','IN_PROGRESS','RESOLVED','REJECTED','FALSE_REPORT_REVIEW','CLOSED']),
  notes: z.string().max(1000).optional(),
  operator_id: z.string().uuid().optional(),
});
