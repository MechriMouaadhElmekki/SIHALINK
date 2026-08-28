import type { EmergencyPriority, EmergencyType, ReportStatus } from './database';

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface CreateReportRequest {
  emergency_type: EmergencyType;
  priority: EmergencyPriority;
  description?: string;
  location?: {
    latitude: number;
    longitude: number;
    accuracy?: number;
    address?: string;
    city?: string;
    wilaya?: string;
    is_manual?: boolean;
  };
  triage_answers?: Array<{
    question_key: string;
    question_text: string;
    answer: string;
  }>;
}

export interface UpdateReportStatusRequest {
  status: ReportStatus;
  reason?: string;
  operator_note?: string;
}

export interface BookAppointmentRequest {
  doctor_id: string;
  appointment_date: string;
  appointment_time: string;
  consultation_type: 'IN_PERSON' | 'TELECONSULTATION' | 'HOME_VISIT';
  reason?: string;
}

export interface SearchDoctorsRequest {
  specialty_slug?: string;
  wilaya?: string;
  city?: string;
  consultation_type?: string;
  query?: string;
  page?: number;
  per_page?: number;
}

export interface SearchFacilitiesRequest {
  type?: string;
  wilaya?: string;
  city?: string;
  emergency_available?: boolean;
  query?: string;
  page?: number;
  per_page?: number;
}
