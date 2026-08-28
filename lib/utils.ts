import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date, locale = 'ar-DZ') {
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric', month: 'long', day: 'numeric',
  }).format(typeof date === 'string' ? new Date(date) : date);
}

export function formatTime(time: string, locale = 'ar-DZ') {
  const [hours, minutes] = time.split(':').map(Number);
  return new Intl.DateTimeFormat(locale, {
    hour: '2-digit', minute: '2-digit', hour12: false,
  }).format(new Date(2000, 0, 1, hours, minutes));
}

export function formatRelativeTime(date: string | Date, locale = 'ar') {
  const d = typeof date === 'string' ? new Date(date) : date;
  const diff = Date.now() - d.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  if (minutes < 60) return rtf.format(-minutes, 'minute');
  if (hours < 24) return rtf.format(-hours, 'hour');
  return rtf.format(-days, 'day');
}

export function getPriorityColor(priority: string) {
  const map: Record<string, string> = {
    CRITICAL: 'bg-red-100 text-red-800 border-red-200',
    HIGH: 'bg-orange-100 text-orange-800 border-orange-200',
    MEDIUM: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    LOW: 'bg-green-100 text-green-800 border-green-200',
  };
  return map[priority] ?? 'bg-gray-100 text-gray-800';
}

export function getStatusColor(status: string) {
  const map: Record<string, string> = {
    DRAFT: 'bg-gray-100 text-gray-700',
    SUBMITTED: 'bg-blue-100 text-blue-700',
    RECEIVED: 'bg-indigo-100 text-indigo-700',
    UNDER_REVIEW: 'bg-yellow-100 text-yellow-700',
    ASSIGNED: 'bg-purple-100 text-purple-700',
    ACKNOWLEDGED: 'bg-cyan-100 text-cyan-700',
    IN_PROGRESS: 'bg-orange-100 text-orange-700',
    RESOLVED: 'bg-green-100 text-green-700',
    CANCELLED: 'bg-gray-100 text-gray-500',
    REJECTED: 'bg-red-100 text-red-700',
    FALSE_REPORT_REVIEW: 'bg-red-100 text-red-800',
    CLOSED: 'bg-gray-200 text-gray-600',
  };
  return map[status] ?? 'bg-gray-100 text-gray-700';
}

export function generateDemoLabel() {
  return '[DEMO]';
}

export const WILAYAS = [
  'أدرار','الشلف','الأغواط','أم البواقي','باتنة','بجاية','بسكرة','بشار',
  'البليدة','البويرة','تمنراست','تبسة','تلمسان','تيارت','تيزي وزو',
  'الجزائر','الجلفة','جيجل','سطيف','سعيدة','سكيكدة','سيدي بلعباس',
  'عنابة','قالمة','قسنطينة','المدية','مستغانم','المسيلة','معسكر',
  'ورقلة','وهران','البيض','إليزي','برج بوعريريج','بومرداس','الطارف',
  'تندوف','تيسمسيلت','الوادي','خنشلة','سوق أهراس','تيبازة','ميلة',
  'عين الدفلى','النعامة','عين تموشنت','غرداية','غليزان',
  'تيميمون','برج باجي مختار','أولاد جلال','بني عباس','عين صالح',
  'عين قزام','توقرت','جانت','المغير','المنيعة',
];
