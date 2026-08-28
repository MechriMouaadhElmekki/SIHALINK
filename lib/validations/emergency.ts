import { z } from 'zod';

export const EmergencyTypeSchema = z.enum([
  'medical', 'accident', 'fire', 'pregnancy', 'child_emergency',
  'elderly_emergency', 'unconscious', 'breathing_difficulty',
  'chest_pain', 'severe_bleeding', 'other'
]);

export const ReportPrioritySchema = z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']);

export const CreateReportSchema = z.object({
  emergency_type: EmergencyTypeSchema,
  additional_info: z.string().max(1000).optional(),
});

export const TriageAnswerSchema = z.object({
  question_key: z.string().min(1),
  question_text: z.string().min(1),
  answer: z.string().min(1),
});

export const LocationSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  accuracy: z.number().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  wilaya: z.string().optional(),
  commune: z.string().optional(),
  is_manual: z.boolean().default(false),
});

export const SubmitReportSchema = z.object({
  report_id: z.string().uuid(),
  triage_answers: z.array(TriageAnswerSchema),
  location: LocationSchema,
  additional_info: z.string().max(1000).optional(),
  priority: ReportPrioritySchema.optional(),
});

export const CancelReportSchema = z.object({
  report_id: z.string().uuid(),
  reason: z.string().min(1).max(500),
});
