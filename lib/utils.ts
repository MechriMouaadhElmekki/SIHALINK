import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow } from 'date-fns';
import { ar, fr, enUS } from 'date-fns/locale';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date, locale: string = 'ar'): string {
  const localeMap = { ar, fr, en: enUS };
  return format(new Date(date), 'PPP', {
    locale: localeMap[locale as keyof typeof localeMap] ?? ar,
  });
}

export function formatRelativeTime(date: string | Date, locale: string = 'ar'): string {
  const localeMap = { ar, fr, en: enUS };
  return formatDistanceToNow(new Date(date), {
    addSuffix: true,
    locale: localeMap[locale as keyof typeof localeMap] ?? ar,
  });
}

export function formatReportNumber(seq: number, year?: number): string {
  const y = year ?? new Date().getFullYear();
  return `SH-${y}-${String(seq).padStart(6, '0')}`;
}

export function getPriorityColor(priority: string): string {
  const map: Record<string, string> = {
    CRITICAL: 'text-red-600 bg-red-50 border-red-200',
    HIGH: 'text-orange-600 bg-orange-50 border-orange-200',
    MEDIUM: 'text-yellow-600 bg-yellow-50 border-yellow-200',
    LOW: 'text-green-600 bg-green-50 border-green-200',
  };
  return map[priority] ?? 'text-gray-600 bg-gray-50 border-gray-200';
}

export function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    DRAFT: 'text-gray-600 bg-gray-50',
    SUBMITTED: 'text-blue-600 bg-blue-50',
    RECEIVED: 'text-blue-700 bg-blue-100',
    UNDER_REVIEW: 'text-yellow-700 bg-yellow-50',
    ASSIGNED: 'text-purple-600 bg-purple-50',
    ACKNOWLEDGED: 'text-indigo-600 bg-indigo-50',
    IN_PROGRESS: 'text-orange-600 bg-orange-50',
    RESOLVED: 'text-green-600 bg-green-50',
    CANCELLED: 'text-gray-500 bg-gray-50',
    REJECTED: 'text-red-600 bg-red-50',
    FALSE_REPORT_REVIEW: 'text-red-700 bg-red-100',
    CLOSED: 'text-gray-700 bg-gray-100',
  };
  return map[status] ?? 'text-gray-600 bg-gray-50';
}

export function truncate(str: string, len: number): string {
  return str.length > len ? str.slice(0, len) + '...' : str;
}
