import { z } from 'zod';
import type { EmergencyType, Priority } from '@/types/database.types';

export const emergencyTypeSchema = z.enum([
  'medical', 'accident', 'fire', 'maternity', 'child_emergency',
  'elderly_emergency', 'unconscious', 'breathing_difficulty',
  'chest_pain', 'severe_bleeding', 'other'
]);

export const prioritySchema = z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']);

export const triageAnswerSchema = z.object({
  question_key: z.string(),
  question_text: z.string().optional(),
  answer: z.string().min(1),
});

export const locationSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  accuracy: z.number().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  wilaya: z.string().optional(),
  commune: z.string().optional(),
  is_manual: z.boolean().default(false),
});

export const createReportSchema = z.object({
  emergency_type: emergencyTypeSchema,
  description: z.string().max(1000).optional(),
  additional_info: z.string().max(500).optional(),
  triage_answers: z.array(triageAnswerSchema),
  location: locationSchema,
});

export const cancelReportSchema = z.object({
  report_id: z.string().uuid(),
  reason: z.string().min(5).max(500),
});

export const VALID_STATUS_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ['SUBMITTED', 'CANCELLED'],
  SUBMITTED: ['RECEIVED', 'CANCELLED', 'REJECTED'],
  RECEIVED: ['UNDER_REVIEW', 'REJECTED'],
  UNDER_REVIEW: ['ASSIGNED', 'REJECTED', 'FALSE_REPORT_REVIEW'],
  ASSIGNED: ['ACKNOWLEDGED'],
  ACKNOWLEDGED: ['IN_PROGRESS'],
  IN_PROGRESS: ['RESOLVED'],
  RESOLVED: ['CLOSED'],
  CANCELLED: ['FALSE_REPORT_REVIEW'],
  REJECTED: ['CLOSED'],
  FALSE_REPORT_REVIEW: ['CLOSED'],
  CLOSED: [],
};

export function isValidTransition(from: string, to: string): boolean {
  return VALID_STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}

export function calculatePriority(type: EmergencyType, triageAnswers: Record<string, string>): Priority {
  if (
    type === 'chest_pain' ||
    type === 'unconscious' ||
    type === 'breathing_difficulty' ||
    triageAnswers['is_breathing'] === 'no' ||
    triageAnswers['is_conscious'] === 'no'
  ) return 'CRITICAL';

  if (
    type === 'severe_bleeding' ||
    type === 'maternity' ||
    type === 'fire' ||
    triageAnswers['is_trapped'] === 'yes' ||
    triageAnswers['severe_bleeding'] === 'yes'
  ) return 'HIGH';

  if (
    type === 'accident' ||
    type === 'child_emergency' ||
    type === 'elderly_emergency'
  ) return 'MEDIUM';

  return 'LOW';
}
