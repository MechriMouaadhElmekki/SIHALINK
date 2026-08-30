export * from './database';

export interface ApiResponse<T = unknown> {
  data: T | null;
  error: string | null;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
  has_more: boolean;
}

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  address?: string;
  city?: string;
  wilaya?: string;
  commune?: string;
  is_simulated?: boolean;
}

export interface TriageQuestion {
  key: string;
  question_ar: string;
  question_fr: string;
  question_en: string;
  type: 'yes_no' | 'select' | 'number';
  options?: { value: string; label_ar: string; label_fr: string; label_en: string }[];
  affects_priority: boolean;
}

export interface ReportNumberGenerator {
  generate(year: number, sequence: number): string;
}

export interface DashboardStats {
  total_users: number;
  active_users: number;
  reports_today: number;
  critical_reports: number;
  avg_acknowledgement_minutes: number;
  resolved_reports: number;
  cancelled_reports: number;
  false_reports: number;
  appointments_today: number;
}
