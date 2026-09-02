// ============================================================
// Unit tests — lib/emergency/state-machine.ts
//
// Tests run with Jest (already a project dependency).
// These test pure functions only — no database, no network.
//
// Run: pnpm test __tests__/emergency/state-machine.test.ts
// ============================================================

import {
  canTransition,
  getValidTransitions,
  isTerminalStatus,
  canUserCancel,
} from '@/lib/emergency/state-machine';
import type { ReportStatus } from '@/types/database';

// ── Valid operator transitions ────────────────────────────────
describe('canTransition — valid operator transitions', () => {
  const validCases: [ReportStatus, ReportStatus][] = [
    ['SUBMITTED', 'RECEIVED'],
    ['SUBMITTED', 'CANCELLED'],
    ['SUBMITTED', 'REJECTED'],
    ['RECEIVED', 'UNDER_REVIEW'],
    ['RECEIVED', 'REJECTED'],
    ['UNDER_REVIEW', 'ASSIGNED'],
    ['UNDER_REVIEW', 'REJECTED'],
    ['UNDER_REVIEW', 'FALSE_REPORT_REVIEW'],
    ['ASSIGNED', 'ACKNOWLEDGED'],
    ['ASSIGNED', 'REJECTED'],
    ['ACKNOWLEDGED', 'IN_PROGRESS'],
    ['ACKNOWLEDGED', 'REJECTED'],
    ['IN_PROGRESS', 'RESOLVED'],
    ['IN_PROGRESS', 'REJECTED'],
    ['RESOLVED', 'CLOSED'],
    ['FALSE_REPORT_REVIEW', 'CLOSED'],
    ['FALSE_REPORT_REVIEW', 'REJECTED'],
    ['CANCELLED', 'CLOSED'],
    ['REJECTED', 'CLOSED'],
  ];

  test.each(validCases)('%s → %s is allowed', (from, to) => {
    expect(canTransition(from, to)).toBe(true);
  });
});

// ── Invalid / rejected transitions ───────────────────────────
describe('canTransition — invalid transitions', () => {
  const invalidCases: [ReportStatus, ReportStatus][] = [
    ['SUBMITTED', 'RESOLVED'],
    ['SUBMITTED', 'CLOSED'],
    ['SUBMITTED', 'IN_PROGRESS'],
    ['RECEIVED', 'CLOSED'],
    ['RECEIVED', 'RESOLVED'],
    ['CLOSED', 'SUBMITTED'],
    ['CLOSED', 'RECEIVED'],
    ['CLOSED', 'CANCELLED'],
    ['RESOLVED', 'SUBMITTED'],
    ['IN_PROGRESS', 'SUBMITTED'],
    ['CANCELLED', 'SUBMITTED'],
    ['REJECTED', 'SUBMITTED'],
  ];

  test.each(invalidCases)('%s → %s is rejected', (from, to) => {
    expect(canTransition(from, to)).toBe(false);
  });

  it('ESCALATED is not a real status and cannot be a valid target', () => {
    // ESCALATED appears in the legacy lib/emergency-state-machine.ts but
    // is not part of the ReportStatus union. Cast to verify runtime guard.
    const notAStatus = 'ESCALATED' as ReportStatus;
    expect(canTransition('IN_PROGRESS', notAStatus)).toBe(false);
  });

  it('REASSIGNED is not a real status and cannot be a valid target', () => {
    const notAStatus = 'REASSIGNED' as ReportStatus;
    expect(canTransition('ASSIGNED', notAStatus)).toBe(false);
  });
});

// ── Terminal statuses ─────────────────────────────────────────
describe('isTerminalStatus', () => {
  it('CLOSED is terminal', () => expect(isTerminalStatus('CLOSED')).toBe(true));
  it('CANCELLED is terminal', () => expect(isTerminalStatus('CANCELLED')).toBe(true));
  it('REJECTED is terminal', () => expect(isTerminalStatus('REJECTED')).toBe(true));
  it('RESOLVED is NOT terminal', () => expect(isTerminalStatus('RESOLVED')).toBe(false));
  it('IN_PROGRESS is NOT terminal', () => expect(isTerminalStatus('IN_PROGRESS')).toBe(false));
});

// ── Citizen cancellation ──────────────────────────────────────
describe('canUserCancel', () => {
  it('DRAFT can be cancelled by citizen', () => expect(canUserCancel('DRAFT')).toBe(true));
  it('SUBMITTED can be cancelled by citizen', () => expect(canUserCancel('SUBMITTED')).toBe(true));
  it('RECEIVED cannot be cancelled by citizen', () => expect(canUserCancel('RECEIVED')).toBe(false));
  it('ASSIGNED cannot be cancelled by citizen', () => expect(canUserCancel('ASSIGNED')).toBe(false));
  it('IN_PROGRESS cannot be cancelled by citizen', () => expect(canUserCancel('IN_PROGRESS')).toBe(false));
  it('CLOSED cannot be cancelled by citizen', () => expect(canUserCancel('CLOSED')).toBe(false));
});

// ── getValidTransitions ───────────────────────────────────────
describe('getValidTransitions', () => {
  it('CLOSED has no valid transitions', () => {
    expect(getValidTransitions('CLOSED')).toHaveLength(0);
  });

  it('SUBMITTED has 3 transitions', () => {
    const t = getValidTransitions('SUBMITTED');
    expect(t).toContain('RECEIVED');
    expect(t).toContain('CANCELLED');
    expect(t).toContain('REJECTED');
    expect(t).toHaveLength(3);
  });

  it('UNDER_REVIEW has 3 transitions', () => {
    const t = getValidTransitions('UNDER_REVIEW');
    expect(t).toContain('ASSIGNED');
    expect(t).toContain('REJECTED');
    expect(t).toContain('FALSE_REPORT_REVIEW');
    expect(t).toHaveLength(3);
  });
});
