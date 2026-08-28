import { z } from 'zod';

export const emergencyTypeSchema = z.enum([
  'MEDICAL_EMERGENCY', 'ACCIDENT', 'FIRE', 'PREGNANCY', 'CHILD_EMERGENCY',
  'ELDERLY_EMERGENCY', 'UNCONSCIOUS_PERSON', 'BREATHING_DIFFICULTY',
  'CHEST_PAIN', 'SEVERE_BLEEDING', 'OTHER',
]);

export const emergencyPrioritySchema = z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']);

export const createEmergencyReportSchema = z.object({
  emergency_type: emergencyTypeSchema,
  description: z.string().max(1000).optional(),
  additional_info: z.string().max(500).optional(),
  people_count: z.number().int().min(1).max(100).default(1),
  triage_answers: z.array(z.object({
    question_key: z.string(),
    question_text: z.string(),
    answer: z.string(),
  })).optional(),
  location: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    accuracy: z.number().optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    wilaya: z.string().optional(),
    commune: z.string().optional(),
    is_manual: z.boolean().default(false),
  }).optional(),
});

export const updateReportStatusSchema = z.object({
  report_id: z.string().uuid(),
  new_status: z.enum([
    'SUBMITTED', 'RECEIVED', 'UNDER_REVIEW', 'ASSIGNED',
    'ACKNOWLEDGED', 'IN_PROGRESS', 'RESOLVED', 'CANCELLED',
    'REJECTED', 'FALSE_REPORT_REVIEW', 'CLOSED',
  ]),
  reason: z.string().max(500).optional(),
});

export type CreateEmergencyReportInput = z.infer<typeof createEmergencyReportSchema>;
export type UpdateReportStatusInput = z.infer<typeof updateReportStatusSchema>;
