import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow } from 'date-fns';
import { ar, fr, enUS } from 'date-fns/locale';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getDateLocale(lang: string) {
  if (lang === 'ar') return ar;
  if (lang === 'fr') return fr;
  return enUS;
}

export function formatDate(date: string | Date, lang = 'ar') {
  return format(new Date(date), 'PPP', { locale: getDateLocale(lang) });
}

export function formatRelative(date: string | Date, lang = 'ar') {
  return formatDistanceToNow(new Date(date), {
    addSuffix: true,
    locale: getDateLocale(lang),
  });
}

export function generateReportNumber(seq: number): string {
  const year = new Date().getFullYear();
  return `SH-${year}-${String(seq).padStart(6, '0')}`;
}

export function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

export function truncate(str: string, length: number): string {
  return str.length > length ? `${str.substring(0, length)}...` : str;
}
