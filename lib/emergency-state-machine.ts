import { ReportStatus } from '@/types';

// Valid state transitions
const VALID_TRANSITIONS: Record<ReportStatus, ReportStatus[]> = {
  DRAFT: ['SUBMITTED', 'CANCELLED'],
  SUBMITTED: ['RECEIVED', 'CANCELLED', 'REJECTED'],
  RECEIVED: ['UNDER_REVIEW', 'CANCELLED'],
  UNDER_REVIEW: ['ASSIGNED', 'REJECTED', 'FALSE_REPORT_REVIEW', 'CANCELLED'],
  ASSIGNED: ['ACKNOWLEDGED', 'REJECTED'],
  ACKNOWLEDGED: ['IN_PROGRESS'],
  IN_PROGRESS: ['RESOLVED', 'ESCALATED' as ReportStatus],
  RESOLVED: ['CLOSED', 'FALSE_REPORT_REVIEW'],
  CANCELLED: ['CLOSED'],
  REJECTED: ['CLOSED'],
  FALSE_REPORT_REVIEW: ['CLOSED', 'RESOLVED'],
  CLOSED: [],
};

export function canTransition(from: ReportStatus, to: ReportStatus): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

export function getValidTransitions(from: ReportStatus): ReportStatus[] {
  return VALID_TRANSITIONS[from] ?? [];
}

export function validateTransition(from: ReportStatus, to: ReportStatus): void {
  if (!canTransition(from, to)) {
    throw new Error(`Invalid status transition: ${from} → ${to}`);
  }
}
