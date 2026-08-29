import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow } from 'date-fns';
import { ar, fr, enUS } from 'date-fns/locale';
import type { Locale } from '@/types/database';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getDateLocale(locale: Locale) {
  switch (locale) {
    case 'ar': return ar;
    case 'fr': return fr;
    default: return enUS;
  }
}

export function formatDate(date: string | Date, locale: Locale = 'ar', formatStr = 'PPP') {
  return format(new Date(date), formatStr, { locale: getDateLocale(locale) });
}

export function formatRelative(date: string | Date, locale: Locale = 'ar') {
  return formatDistanceToNow(new Date(date), {
    addSuffix: true,
    locale: getDateLocale(locale),
  });
}

export function getDir(locale: Locale): 'rtl' | 'ltr' {
  return locale === 'ar' ? 'rtl' : 'ltr';
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
    case 'IN_PROGRESS': return 'text-yellow-700 bg-yellow-100';
    case 'RESOLVED': return 'text-green-600 bg-green-100';
    case 'CANCELLED': return 'text-gray-500 bg-gray-100';
    case 'REJECTED': return 'text-red-600 bg-red-100';
    case 'FALSE_REPORT_REVIEW': return 'text-orange-600 bg-orange-100';
    case 'CLOSED': return 'text-gray-400 bg-gray-50';
    default: return 'text-gray-600 bg-gray-100';
  }
}

export function getAppointmentStatusColor(status: string): string {
  switch (status) {
    case 'REQUESTED': return 'text-blue-600 bg-blue-100';
    case 'CONFIRMED': return 'text-green-600 bg-green-100';
    case 'RESCHEDULED': return 'text-amber-600 bg-amber-100';
    case 'CANCELLED_BY_USER':
    case 'CANCELLED_BY_DOCTOR': return 'text-red-600 bg-red-100';
    case 'COMPLETED': return 'text-teal-600 bg-teal-100';
    case 'NO_SHOW': return 'text-gray-500 bg-gray-100';
    default: return 'text-gray-600 bg-gray-100';
  }
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + '...';
}

export function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

// Valid status transitions (mirrors database function)
export const VALID_STATUS_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ['SUBMITTED', 'CANCELLED'],
  SUBMITTED: ['RECEIVED', 'CANCELLED', 'REJECTED'],
  RECEIVED: ['UNDER_REVIEW', 'ASSIGNED', 'REJECTED'],
  UNDER_REVIEW: ['ASSIGNED', 'REJECTED', 'FALSE_REPORT_REVIEW'],
  ASSIGNED: ['ACKNOWLEDGED', 'CANCELLED'],
  ACKNOWLEDGED: ['IN_PROGRESS', 'CANCELLED'],
  IN_PROGRESS: ['RESOLVED', 'FALSE_REPORT_REVIEW'],
  RESOLVED: ['CLOSED', 'FALSE_REPORT_REVIEW'],
  FALSE_REPORT_REVIEW: ['CLOSED', 'REJECTED'],
  CANCELLED: ['CLOSED'],
  REJECTED: ['CLOSED'],
};

export function canTransitionTo(from: string, to: string): boolean {
  return VALID_STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}

export const WILAYAS = [
  'أدرار', 'الشلف', 'الأغواط', 'أم البواقي', 'باتنة', 'بجاية', 'بسكرة', 'بشار',
  'البليدة', 'البويرة', 'تمنراست', 'تبسة', 'تلمسان', 'تيارت', 'تيزي وزو', 'الجزائر',
  'الجلفة', 'جيجل', 'سطيف', 'سعيدة', 'سكيكدة', 'سيدي بلعباس', 'عنابة', 'قالمة',
  'قسنطينة', 'المدية', 'مستغانم', 'المسيلة', 'معسكر', 'ورقلة', 'وهران', 'البيض',
  'إليزي', 'برج بوعريريج', 'بومرداس', 'الطارف', 'تندوف', 'تيسمسيلت', 'الوادي',
  'خنشلة', 'سوق أهراس', 'تيبازة', 'ميلة', 'عين الدفلى', 'النعامة', 'عين تموشنت',
  'غرداية', 'غليزان'
];
