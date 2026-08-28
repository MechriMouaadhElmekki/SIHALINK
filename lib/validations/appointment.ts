import { z } from 'zod';

export const createAppointmentSchema = z.object({
  doctor_id: z.string().uuid('معرف الطبيب غير صالح'),
  appointment_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'تنسيق التاريخ غير صالح'),
  appointment_time: z.string().regex(/^\d{2}:\d{2}$/, 'تنسيق الوقت غير صالح'),
  consultation_type: z.enum(['in_person', 'video', 'phone']),
  reason: z.string().min(5).max(500).optional(),
  patient_notes: z.string().max(1000).optional(),
});

export const updateAppointmentSchema = z.object({
  status: z.enum(['CONFIRMED', 'RESCHEDULED', 'CANCELLED_BY_USER', 'CANCELLED_BY_DOCTOR', 'COMPLETED', 'NO_SHOW']),
  cancellation_reason: z.string().max(500).optional(),
  doctor_notes: z.string().max(1000).optional(),
});

export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;
export type UpdateAppointmentInput = z.infer<typeof updateAppointmentSchema>;
