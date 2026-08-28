import { z } from 'zod';

export const appointmentSchema = z.object({
  doctor_id: z.string().uuid('معرف الطبيب غير صالح'),
  appointment_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'تاريخ غير صالح'),
  appointment_time: z.string().regex(/^\d{2}:\d{2}$/, 'وقت غير صالح'),
  consultation_type: z.enum(['IN_PERSON','VIDEO','PHONE','HOME_VISIT']),
  reason: z.string().max(500).optional(),
});

export type AppointmentInput = z.infer<typeof appointmentSchema>;
