import { z } from 'zod';

export const emergencyReportSchema = z.object({
  emergency_type: z.enum(['MEDICAL','ACCIDENT','FIRE','PREGNANCY','CHILD_EMERGENCY','ELDERLY','UNCONSCIOUS','BREATHING_DIFFICULTY','CHEST_PAIN','SEVERE_BLEEDING','OTHER']),
  priority: z.enum(['CRITICAL','HIGH','MEDIUM','LOW']).optional(),
  description: z.string().max(1000).optional(),
  people_affected: z.number().min(1).max(100).default(1),
  triage_answers: z.record(z.string(), z.union([z.string(), z.boolean(), z.number()])).optional(),
  location: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    accuracy: z.number().optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    wilaya: z.string().optional(),
    commune: z.string().optional(),
    is_simulated: z.boolean().default(false),
  }),
});

export const cancelReportSchema = z.object({
  reason: z.string().min(5, 'يرجى ذكر سبب الإلغاء').max(500),
});

export type EmergencyReportInput = z.infer<typeof emergencyReportSchema>;
export type CancelReportInput = z.infer<typeof cancelReportSchema>;
