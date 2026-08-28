import { z } from 'zod';

export const CreateAppointmentSchema = z.object({
  doctor_id: z.string().uuid(),
  appointment_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  appointment_time: z.string().regex(/^\d{2}:\d{2}$/),
  consultation_type: z.enum(['in_person', 'teleconsultation']),
  reason: z.string().max(500).optional(),
});

export const UpdateAppointmentSchema = z.object({
  status: z.enum(['CONFIRMED', 'CANCELLED_BY_USER', 'CANCELLED_BY_DOCTOR', 'COMPLETED', 'NO_SHOW', 'RESCHEDULED']),
  reason: z.string().max(500).optional(),
});
