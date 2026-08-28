import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { EmergencyPriority, ReportStatus, Locale } from '@/types/database';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date, locale: Locale = 'ar'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString(locale === 'ar' ? 'ar-DZ' : locale === 'fr' ? 'fr-DZ' : 'en-DZ', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function formatDateTime(date: string | Date, locale: Locale = 'ar'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString(locale === 'ar' ? 'ar-DZ' : locale === 'fr' ? 'fr-DZ' : 'en-DZ', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getPriorityColor(priority: EmergencyPriority): string {
  switch (priority) {
    case 'CRITICAL': return 'text-red-600 bg-red-50 border-red-200';
    case 'HIGH': return 'text-orange-600 bg-orange-50 border-orange-200';
    case 'MEDIUM': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    case 'LOW': return 'text-green-600 bg-green-50 border-green-200';
  }
}

export function getStatusColor(status: ReportStatus): string {
  switch (status) {
    case 'DRAFT': return 'text-gray-600 bg-gray-100';
    case 'SUBMITTED': return 'text-blue-600 bg-blue-100';
    case 'RECEIVED': return 'text-blue-700 bg-blue-100';
    case 'UNDER_REVIEW': return 'text-indigo-600 bg-indigo-100';
    case 'ASSIGNED': return 'text-purple-600 bg-purple-100';
    case 'ACKNOWLEDGED': return 'text-violet-600 bg-violet-100';
    case 'IN_PROGRESS': return 'text-amber-600 bg-amber-100';
    case 'RESOLVED': return 'text-green-600 bg-green-100';
    case 'CANCELLED': return 'text-gray-500 bg-gray-100';
    case 'REJECTED': return 'text-red-600 bg-red-100';
    case 'FALSE_REPORT_REVIEW': return 'text-orange-600 bg-orange-100';
    case 'CLOSED': return 'text-slate-600 bg-slate-100';
  }
}

export function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen) + '...';
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export const WILAYAS = [
  'أدرار','الشلف','الأغواط','أم البواقي','باتنة','بجاية','بسكرة','بشار',
  'البليدة','البويرة','تمنراست','تبسة','تلمسان','تيارت','تيزي وزو','الجزائر',
  'الجلفة','جيجل','سطيف','سعيدة','سكيكدة','سيدي بلعباس','عنابة','قالمة',
  'قسنطينة','المدية','مستغانم','المسيلة','معسكر','ورقلة','وهران','البيض',
  'إليزي','برج بوعريريج','بومرداس','الطارف','تندوف','تيسمسيلت','الوادي',
  'خنشلة','سوق أهراس','تيبازة','ميلة','عين الدفلى','النعامة','عين تموشنت',
  'غرداية','غليزان','تيميمون','برج باجي مختار','أولاد جلال','بني عباس',
  'عين صالح','عين قزام','تقرت','جانت','المغير','المنيعة'
];
