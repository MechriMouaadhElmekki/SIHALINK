import type { ReportStatus } from '@/types/database';

const VALID_TRANSITIONS: Record<ReportStatus, ReportStatus[]> = {
  DRAFT: ['SUBMITTED', 'CANCELLED'],
  SUBMITTED: ['RECEIVED', 'CANCELLED', 'REJECTED'],
  RECEIVED: ['UNDER_REVIEW', 'REJECTED'],
  UNDER_REVIEW: ['ASSIGNED', 'REJECTED', 'FALSE_REPORT_REVIEW'],
  ASSIGNED: ['ACKNOWLEDGED', 'REJECTED'],
  ACKNOWLEDGED: ['IN_PROGRESS', 'REJECTED'],
  IN_PROGRESS: ['RESOLVED', 'REJECTED'],
  RESOLVED: ['CLOSED'],
  FALSE_REPORT_REVIEW: ['CLOSED', 'REJECTED'],
  CANCELLED: [],
  REJECTED: [],
  CLOSED: [],
};

export function canTransition(from: ReportStatus, to: ReportStatus): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

export function getValidTransitions(from: ReportStatus): ReportStatus[] {
  return VALID_TRANSITIONS[from] ?? [];
}

export function isTerminalStatus(status: ReportStatus): boolean {
  return ['CANCELLED', 'REJECTED', 'CLOSED'].includes(status);
}

export function canUserCancel(status: ReportStatus): boolean {
  return ['DRAFT', 'SUBMITTED'].includes(status);
}
