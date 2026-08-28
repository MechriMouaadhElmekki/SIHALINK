import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date, locale = 'ar-DZ'): string {
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date));
}

export function formatTime(time: string, locale = 'ar-DZ'): string {
  const [hours, minutes] = time.split(':');
  const date = new Date();
  date.setHours(parseInt(hours), parseInt(minutes));
  return new Intl.DateTimeFormat(locale, {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function formatRelativeTime(date: string | Date, locale = 'ar'): string {
  const now = new Date();
  const target = new Date(date);
  const diffMs = now.getTime() - target.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

  if (diffMins < 1) return locale === 'ar' ? 'الآن' : 'maintenant';
  if (diffMins < 60) return rtf.format(-diffMins, 'minute');
  if (diffHours < 24) return rtf.format(-diffHours, 'hour');
  if (diffDays < 30) return rtf.format(-diffDays, 'day');
  return formatDate(date, locale === 'ar' ? 'ar-DZ' : locale === 'fr' ? 'fr-FR' : 'en-US');
}

export function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

export function generateReportDisplayId(reportNumber: string): string {
  return reportNumber;
}

export function getPriorityColor(priority: string): string {
  switch (priority) {
    case 'CRITICAL': return 'text-red-600 bg-red-50 border-red-200';
    case 'HIGH': return 'text-orange-600 bg-orange-50 border-orange-200';
    case 'MEDIUM': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    case 'LOW': return 'text-green-600 bg-green-50 border-green-200';
    default: return 'text-gray-600 bg-gray-50 border-gray-200';
  }
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'DRAFT': return 'text-gray-600 bg-gray-100';
    case 'SUBMITTED': return 'text-blue-600 bg-blue-100';
    case 'RECEIVED': return 'text-indigo-600 bg-indigo-100';
    case 'UNDER_REVIEW': return 'text-purple-600 bg-purple-100';
    case 'ASSIGNED': return 'text-cyan-600 bg-cyan-100';
    case 'ACKNOWLEDGED': return 'text-teal-600 bg-teal-100';
    case 'IN_PROGRESS': return 'text-orange-600 bg-orange-100';
    case 'RESOLVED': return 'text-green-600 bg-green-100';
    case 'CANCELLED': return 'text-gray-500 bg-gray-100';
    case 'REJECTED': return 'text-red-600 bg-red-100';
    case 'FALSE_REPORT_REVIEW': return 'text-amber-600 bg-amber-100';
    case 'CLOSED': return 'text-slate-600 bg-slate-100';
    default: return 'text-gray-600 bg-gray-100';
  }
}

export const VALID_STATUS_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ['SUBMITTED', 'CANCELLED'],
  SUBMITTED: ['RECEIVED', 'CANCELLED', 'REJECTED'],
  RECEIVED: ['UNDER_REVIEW', 'ASSIGNED'],
  UNDER_REVIEW: ['ASSIGNED', 'FALSE_REPORT_REVIEW', 'REJECTED'],
  ASSIGNED: ['ACKNOWLEDGED', 'IN_PROGRESS'],
  ACKNOWLEDGED: ['IN_PROGRESS'],
  IN_PROGRESS: ['RESOLVED', 'FALSE_REPORT_REVIEW'],
  RESOLVED: ['CLOSED'],
  CANCELLED: ['CLOSED'],
  REJECTED: ['CLOSED'],
  FALSE_REPORT_REVIEW: ['REJECTED', 'UNDER_REVIEW', 'CLOSED'],
  CLOSED: [],
};

export function isValidStatusTransition(from: string, to: string): boolean {
  return VALID_STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}
