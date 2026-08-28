import { z } from 'zod';

export const createAppointmentSchema = z.object({
  doctor_id: z.string().uuid('معرف الطبيب غير صحيح'),
  appointment_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'تاريخ غير صحيح'),
  appointment_time: z.string().regex(/^\d{2}:\d{2}$/, 'وقت غير صحيح'),
  consultation_type: z.enum(['IN_PERSON', 'VIDEO', 'PHONE', 'HOME_VISIT']),
  reason: z.string().min(5, 'يرجى وصف سبب الزيارة').max(500),
});

export const updateAppointmentSchema = z.object({
  status: z.enum(['CONFIRMED', 'RESCHEDULED', 'CANCELLED_BY_USER', 'CANCELLED_BY_DOCTOR', 'COMPLETED', 'NO_SHOW']).optional(),
  cancellation_reason: z.string().max(500).optional(),
  notes: z.string().max(500).optional(),
});

export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;
export type UpdateAppointmentInput = z.infer<typeof updateAppointmentSchema>;
