import type { EmergencyType, EmergencyPriority } from '@/types/database';

type TriageAnswers = Record<string, string>;

export function calculatePriority(
  type: EmergencyType,
  answers: TriageAnswers
): EmergencyPriority {
  // CRITICAL: life-threatening immediate conditions
  if (
    type === 'UNCONSCIOUS' ||
    type === 'BREATHING_DIFFICULTY' ||
    type === 'CHEST_PAIN' ||
    type === 'SEVERE_BLEEDING'
  ) {
    return 'CRITICAL';
  }

  // Check triage answers for critical indicators
  if (
    answers['is_conscious'] === 'no' ||
    answers['is_breathing'] === 'no' ||
    answers['is_breathing_normally'] === 'no' ||
    answers['severe_bleeding'] === 'yes'
  ) {
    return 'CRITICAL';
  }

  if (
    answers['is_trapped'] === 'yes' ||
    answers['immediate_danger'] === 'yes' ||
    type === 'FIRE' ||
    type === 'MATERNITY'
  ) {
    return 'HIGH';
  }

  if (
    type === 'ACCIDENT' ||
    type === 'CHILD_EMERGENCY' ||
    type === 'ELDERLY_EMERGENCY' ||
    answers['affected_count'] === 'multiple'
  ) {
    return 'MEDIUM';
  }

  return 'LOW';
}

export const PRIORITY_COLORS: Record<EmergencyPriority, string> = {
  CRITICAL: '#DC2626',
  HIGH: '#EA580C',
  MEDIUM: '#D97706',
  LOW: '#16A34A',
};

export const PRIORITY_BG_CLASSES: Record<EmergencyPriority, string> = {
  CRITICAL: 'bg-red-600 text-white',
  HIGH: 'bg-orange-600 text-white',
  MEDIUM: 'bg-amber-500 text-white',
  LOW: 'bg-green-600 text-white',
};
