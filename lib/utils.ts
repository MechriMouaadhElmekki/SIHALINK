import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date, locale: string = 'ar-DZ'): string {
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric', month: 'long', day: 'numeric',
  }).format(new Date(date));
}

export function formatDateTime(date: string | Date, locale: string = 'ar-DZ'): string {
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(date));
}

export function generateReportNumber(): string {
  // Server-side generation preferred; this is a fallback display format
  const year = new Date().getFullYear();
  const rand = Math.floor(Math.random() * 999999).toString().padStart(6, '0');
  return `SH-${year}-${rand}`;
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
    case 'SUBMITTED': return 'text-blue-600 bg-blue-50';
    case 'RECEIVED': return 'text-indigo-600 bg-indigo-50';
    case 'UNDER_REVIEW': return 'text-purple-600 bg-purple-50';
    case 'ASSIGNED': return 'text-cyan-600 bg-cyan-50';
    case 'IN_PROGRESS': return 'text-orange-600 bg-orange-50';
    case 'RESOLVED': return 'text-green-600 bg-green-50';
    case 'CANCELLED': return 'text-gray-600 bg-gray-50';
    case 'REJECTED': return 'text-red-600 bg-red-50';
    case 'CLOSED': return 'text-slate-600 bg-slate-50';
    default: return 'text-gray-600 bg-gray-50';
  }
}
