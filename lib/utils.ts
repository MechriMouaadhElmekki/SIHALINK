import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateReportNumber(): string {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const rand = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
  return `SHL-${yy}${mm}${dd}-${rand}`;
}

export function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    DRAFT:        'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
    SUBMITTED:    'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    RECEIVED:     'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
    UNDER_REVIEW: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    ASSIGNED:     'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
    ACKNOWLEDGED: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
    IN_PROGRESS:  'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    RESOLVED:     'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    CANCELLED:    'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500',
    REJECTED:     'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    CLOSED:       'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
  };
  return map[status] ?? 'bg-gray-100 text-gray-600';
}

export function getPriorityColor(priority: string): string {
  const map: Record<string, string> = {
    CRITICAL: 'bg-red-100 text-red-700 border-red-300 dark:bg-red-900/30 dark:text-red-400 dark:border-red-700',
    HIGH:     'bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-700',
    MEDIUM:   'bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-700',
    LOW:      'bg-green-100 text-green-700 border-green-300 dark:bg-green-900/30 dark:text-green-400 dark:border-green-700',
  };
  return map[priority] ?? 'bg-gray-100 text-gray-600 border-gray-200';
}

export function formatRelative(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'الآن';
  if (mins < 60) return `منذ ${mins} د.'`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `منذ ${hours} س.'`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `منذ ${days} ي.'`;
  return new Date(dateStr).toLocaleDateString('ar-DZ', { day: 'numeric', month: 'short' });
}

export const WILAYAS = [
  'أدرار','الشلف','أم البواقي','عين تيموشنت','باتنة','بجاية','بسكرة','بشار','البليدة','البويرة',
  'تامنغست','تبسة','تيارت','تيزي وزو','تلمسان','تبسة غيرست','جيجل','جلفة','الجزائر','جيجل',
  'خنشلة','سعيدة','سكيكدة','سطيف','سيدي بلعباس','سوق أهراس','طارق','تبسة','عين ديفلة','غرداية',
  'غليزان','غارداية','وهران','الوادي','يلو','تيرت','أدرار','ميلة','مسكرة','مستغانم',
  'المسيلة','النعامة','وهران','تبسة','ورقلة','تيارت','برج بوعريريج','إيليزي','تمنغست',
  'برج بوجريريج','برهوم','تيسمسيلت','سي بلعباس','الجلفة','رليزان','مسيلة','أندف','برج بوجريريج',
];
