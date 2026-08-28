export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type UserRole = 'USER' | 'DOCTOR' | 'HEALTHCARE_PROVIDER' | 'EMERGENCY_OPERATOR' | 'ADMIN' | 'SUPER_ADMIN';
export type EmergencyType = 'MEDICAL' | 'ACCIDENT' | 'FIRE' | 'PREGNANCY' | 'CHILD_EMERGENCY' | 'ELDERLY_EMERGENCY' | 'UNCONSCIOUS' | 'BREATHING_DIFFICULTY' | 'CHEST_PAIN' | 'SEVERE_BLEEDING' | 'OTHER';
export type EmergencyPriority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type ReportStatus = 'DRAFT' | 'SUBMITTED' | 'RECEIVED' | 'UNDER_REVIEW' | 'ASSIGNED' | 'ACKNOWLEDGED' | 'IN_PROGRESS' | 'RESOLVED' | 'CANCELLED' | 'REJECTED' | 'FALSE_REPORT_REVIEW' | 'CLOSED';
export type AppointmentStatus = 'REQUESTED' | 'CONFIRMED' | 'RESCHEDULED' | 'CANCELLED_BY_USER' | 'CANCELLED_BY_DOCTOR' | 'COMPLETED' | 'NO_SHOW';
export type FacilityType = 'HOSPITAL' | 'CLINIC' | 'MEDICAL_CENTER' | 'EMERGENCY_DEPT' | 'IMAGING_CENTER' | 'PHARMACY' | 'LABORATORY';
export type NotificationType = 'EMERGENCY_UPDATE' | 'APPOINTMENT_UPDATE' | 'SECURITY_ALERT' | 'SYSTEM_ANNOUNCEMENT' | 'ACCOUNT_NOTIFICATION';
export type Locale = 'ar' | 'fr' | 'en';

export interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  email: string | null;
  date_of_birth: string | null;
  gender: 'male' | 'female' | 'other' | 'prefer_not_to_say' | null;
  blood_type: string | null;
  address: string | null;
  city: string | null;
  wilaya: string | null;
  profile_photo_url: string | null;
  preferred_language: Locale;
  emergency_notes: string | null;
  account_status: 'active' | 'suspended' | 'restricted' | 'deleted';
  is_demo: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserRoleRecord {
  id: string;
  user_id: string;
  role_name: UserRole;
  granted_by: string | null;
  granted_at: string;
}

export interface TrustedContact {
  id: string;
  user_id: string;
  name: string;
  relationship: string;
  phone: string;
  email: string | null;
  priority: number;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
}

export interface EmergencyReport {
  id: string;
  report_number: string;
  user_id: string;
  emergency_type: EmergencyType;
  priority: EmergencyPriority;
  status: ReportStatus;
  description: string | null;
  additional_info: string | null;
  is_demo: boolean;
  assigned_operator_id: string | null;
  created_at: string;
  updated_at: string;
  submitted_at: string | null;
  resolved_at: string | null;
}

export interface EmergencyLocation {
  id: string;
  report_id: string;
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  address: string | null;
  city: string | null;
  wilaya: string | null;
  commune: string | null;
  manual_override: boolean;
  captured_at: string;
  created_at: string;
}

export interface EmergencyTriageAnswer {
  id: string;
  report_id: string;
  question_key: string;
  question_text: string;
  answer: string;
  created_at: string;
}

export interface ReportStatusHistory {
  id: string;
  report_id: string;
  from_status: string | null;
  to_status: string;
  changed_by: string | null;
  reason: string | null;
  operator_note: string | null;
  created_at: string;
}

export interface EmergencyReportEvent {
  id: string;
  report_id: string;
  event_type: string;
  description: string | null;
  actor_id: string | null;
  actor_role: string | null;
  metadata: Json | null;
  created_at: string;
}

export interface Doctor {
  id: string;
  user_id: string | null;
  first_name: string;
  last_name: string;
  photo_url: string | null;
  bio_ar: string | null;
  bio_fr: string | null;
  bio_en: string | null;
  gender: 'male' | 'female' | null;
  experience_years: number | null;
  languages: string[];
  consultation_types: string[];
  phone: string | null;
  email: string | null;
  city: string | null;
  wilaya: string | null;
  verification_status: 'pending' | 'verified' | 'rejected' | 'demo';
  is_active: boolean;
  is_demo: boolean;
  rating: number | null;
  total_reviews: number;
  created_at: string;
  updated_at: string;
}

export interface Specialty {
  id: string;
  name_ar: string;
  name_fr: string;
  name_en: string;
  slug: string;
  icon: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Appointment {
  id: string;
  patient_id: string;
  doctor_id: string;
  appointment_date: string;
  appointment_time: string;
  duration_minutes: number;
  consultation_type: 'in_person' | 'teleconsultation';
  reason: string | null;
  status: AppointmentStatus;
  patient_notes: string | null;
  doctor_notes: string | null;
  is_demo: boolean;
  created_at: string;
  updated_at: string;
}

export interface HealthcareFacility {
  id: string;
  name: string;
  facility_type: FacilityType;
  description_ar: string | null;
  description_fr: string | null;
  description_en: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string;
  wilaya: string;
  latitude: number | null;
  longitude: number | null;
  opening_hours: Json | null;
  has_emergency: boolean;
  is_active: boolean;
  verification_status: 'pending' | 'verified' | 'demo';
  is_demo: boolean;
  created_at: string;
  updated_at: string;
}

export interface Pharmacy {
  id: string;
  name: string;
  phone: string | null;
  address: string;
  city: string;
  wilaya: string;
  latitude: number | null;
  longitude: number | null;
  opening_hours: Json | null;
  is_24h: boolean;
  is_active: boolean;
  is_demo: boolean;
  created_at: string;
  updated_at: string;
}

export interface Laboratory {
  id: string;
  name: string;
  phone: string | null;
  address: string;
  city: string;
  wilaya: string;
  latitude: number | null;
  longitude: number | null;
  opening_hours: Json | null;
  services: string[] | null;
  is_active: boolean;
  is_demo: boolean;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title_ar: string;
  title_fr: string;
  title_en: string;
  body_ar: string;
  body_fr: string;
  body_en: string;
  is_read: boolean;
  related_entity_type: string | null;
  related_entity_id: string | null;
  created_at: string;
}

export interface FirstAidCategory {
  id: string;
  name_ar: string;
  name_fr: string;
  name_en: string;
  slug: string;
  icon: string | null;
  color: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export interface FirstAidGuide {
  id: string;
  category_id: string;
  title_ar: string;
  title_fr: string;
  title_en: string;
  warning_ar: string | null;
  warning_fr: string | null;
  warning_en: string | null;
  call_emergency_when_ar: string | null;
  call_emergency_when_fr: string | null;
  call_emergency_when_en: string | null;
  do_not_do_ar: string | null;
  do_not_do_fr: string | null;
  do_not_do_en: string | null;
  source: string | null;
  review_status: 'draft' | 'under_review' | 'published';
  reviewed_by: string | null;
  last_reviewed_at: string | null;
  version: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface FirstAidStep {
  id: string;
  guide_id: string;
  step_number: number;
  instruction_ar: string;
  instruction_fr: string;
  instruction_en: string;
  image_url: string | null;
  created_at: string;
}

export interface AuditLog {
  id: string;
  actor_id: string | null;
  actor_role: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  old_data: Json | null;
  new_data: Json | null;
  ip_address: string | null;
  user_agent: string | null;
  metadata: Json | null;
  created_at: string;
}

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  status: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
