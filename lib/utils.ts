import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow } from 'date-fns';
import { ar, fr, enUS } from 'date-fns/locale';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date, locale: string = 'ar'): string {
  const localeMap = { ar, fr, en: enUS };
  const dateLocale = localeMap[locale as keyof typeof localeMap] || ar;
  return format(new Date(date), 'PPP', { locale: dateLocale });
}

export function formatRelativeTime(date: string | Date, locale: string = 'ar'): string {
  const localeMap = { ar, fr, en: enUS };
  const dateLocale = localeMap[locale as keyof typeof localeMap] || ar;
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: dateLocale });
}

export function formatDateTime(date: string | Date): string {
  return format(new Date(date), 'yyyy-MM-dd HH:mm');
}

export function generateReportDisplayId(reportNumber: string): string {
  return reportNumber;
}

export function getPriorityColor(priority: string): string {
  switch (priority) {
    case 'CRITICAL': return 'text-red-600 bg-red-50 border-red-200';
    case 'HIGH': return 'text-orange-600 bg-orange-50 border-orange-200';
    case 'MEDIUM': return 'text-amber-600 bg-amber-50 border-amber-200';
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
    case 'CANCELLED': return 'text-gray-600 bg-gray-100';
    case 'REJECTED': return 'text-red-600 bg-red-100';
    case 'FALSE_REPORT_REVIEW': return 'text-yellow-600 bg-yellow-100';
    case 'CLOSED': return 'text-gray-700 bg-gray-200';
    default: return 'text-gray-600 bg-gray-100';
  }
}

export function isValidFileType(file: File): boolean {
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'application/pdf'];
  return allowed.includes(file.type);
}

export function isValidFileSize(file: File, maxMb: number = 10): boolean {
  return file.size <= maxMb * 1024 * 1024;
}

export function getFullName(firstName: string | null, lastName: string | null): string {
  return [firstName, lastName].filter(Boolean).join(' ') || 'مستخدم';
}
