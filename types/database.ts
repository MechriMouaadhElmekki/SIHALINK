export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type UserRole = 'USER' | 'DOCTOR' | 'HEALTHCARE_PROVIDER' | 'EMERGENCY_OPERATOR' | 'ADMIN' | 'SUPER_ADMIN';
export type AccountStatus = 'ACTIVE' | 'SUSPENDED' | 'RESTRICTED' | 'PENDING_VERIFICATION' | 'DELETED';
export type GenderType = 'MALE' | 'FEMALE' | 'NOT_SPECIFIED';
export type BloodType = 'A_POSITIVE' | 'A_NEGATIVE' | 'B_POSITIVE' | 'B_NEGATIVE' | 'AB_POSITIVE' | 'AB_NEGATIVE' | 'O_POSITIVE' | 'O_NEGATIVE' | 'UNKNOWN';
export type EmergencyType = 'MEDICAL' | 'ACCIDENT' | 'FIRE' | 'MATERNITY' | 'CHILD_EMERGENCY' | 'ELDERLY_EMERGENCY' | 'UNCONSCIOUS' | 'BREATHING_DIFFICULTY' | 'CHEST_PAIN' | 'SEVERE_BLEEDING' | 'OTHER';
export type EmergencyPriority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type ReportStatus = 'DRAFT' | 'SUBMITTED' | 'RECEIVED' | 'UNDER_REVIEW' | 'ASSIGNED' | 'ACKNOWLEDGED' | 'IN_PROGRESS' | 'RESOLVED' | 'CANCELLED' | 'REJECTED' | 'FALSE_REPORT_REVIEW' | 'CLOSED';
export type AppointmentStatus = 'REQUESTED' | 'CONFIRMED' | 'RESCHEDULED' | 'CANCELLED_BY_USER' | 'CANCELLED_BY_DOCTOR' | 'COMPLETED' | 'NO_SHOW';
export type FacilityType = 'HOSPITAL' | 'CLINIC' | 'MEDICAL_CENTER' | 'EMERGENCY_DEPARTMENT' | 'PHARMACY' | 'LABORATORY' | 'IMAGING_CENTER' | 'REHABILITATION_CENTER';
export type ConsultationType = 'IN_PERSON' | 'TELECONSULTATION' | 'BOTH';
export type NotificationType = 'EMERGENCY_UPDATE' | 'APPOINTMENT_UPDATE' | 'SECURITY_ALERT' | 'SYSTEM_ANNOUNCEMENT' | 'ACCOUNT_NOTIFICATION';
export type FirstAidReviewStatus = 'DRAFT' | 'PENDING_REVIEW' | 'REVIEWED' | 'PUBLISHED' | 'ARCHIVED';

export interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  date_of_birth: string | null;
  gender: GenderType;
  blood_type: BloodType;
  address: string | null;
  city: string | null;
  wilaya: string | null;
  profile_photo_url: string | null;
  preferred_language: 'ar' | 'fr' | 'en';
  emergency_notes: string | null;
  account_status: AccountStatus;
  role: UserRole;
  is_demo: boolean;
  created_at: string;
  updated_at: string;
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
  title: string | null;
  description: string | null;
  affected_count: number;
  assigned_operator_id: string | null;
  is_demo: boolean;
  cancelled_at: string | null;
  cancelled_reason: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface EmergencyReportEvent {
  id: string;
  report_id: string;
  event_type: string;
  from_status: ReportStatus | null;
  to_status: ReportStatus | null;
  actor_id: string | null;
  actor_role: UserRole | null;
  description: string | null;
  metadata: Json;
  created_at: string;
}

export interface EmergencyLocation {
  id: string;
  report_id: string;
  latitude: number;
  longitude: number;
  accuracy: number | null;
  altitude: number | null;
  address: string | null;
  city: string | null;
  wilaya: string | null;
  commune: string | null;
  postal_code: string | null;
  is_manual: boolean;
  is_demo: boolean;
  captured_at: string;
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
  phone: string | null;
  email: string | null;
  languages: string[];
  gender: GenderType;
  experience_years: number;
  consultation_type: ConsultationType;
  consultation_fee: number | null;
  city: string | null;
  wilaya: string | null;
  address: string | null;
  is_verified: boolean;
  is_active: boolean;
  is_demo: boolean;
  rating_average: number;
  rating_count: number;
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
  created_at: string;
}

export interface DoctorWithSpecialties extends Doctor {
  doctor_specialties: Array<{
    specialty: Specialty;
    is_primary: boolean;
  }>;
}

export interface Appointment {
  id: string;
  user_id: string;
  doctor_id: string;
  status: AppointmentStatus;
  consultation_type: ConsultationType;
  appointment_date: string;
  appointment_time: string;
  duration_minutes: number;
  reason: string | null;
  notes: string | null;
  doctor_notes: string | null;
  cancelled_by: string | null;
  cancelled_reason: string | null;
  cancelled_at: string | null;
  is_demo: boolean;
  created_at: string;
  updated_at: string;
}

export interface HealthcareFacility {
  id: string;
  name: string;
  type: FacilityType;
  description_ar: string | null;
  description_fr: string | null;
  description_en: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  address: string | null;
  city: string;
  wilaya: string;
  commune: string | null;
  postal_code: string | null;
  latitude: number | null;
  longitude: number | null;
  opening_hours: Json;
  has_emergency: boolean;
  is_verified: boolean;
  is_active: boolean;
  is_demo: boolean;
  created_at: string;
  updated_at: string;
}

export interface Pharmacy {
  id: string;
  name: string;
  phone: string | null;
  address: string | null;
  city: string;
  wilaya: string;
  latitude: number | null;
  longitude: number | null;
  opening_hours: Json;
  is_24h: boolean;
  is_verified: boolean;
  is_active: boolean;
  is_demo: boolean;
  created_at: string;
  updated_at: string;
}

export interface Laboratory {
  id: string;
  name: string;
  phone: string | null;
  address: string | null;
  city: string;
  wilaya: string;
  latitude: number | null;
  longitude: number | null;
  opening_hours: Json;
  services: string[];
  requires_appointment: boolean;
  is_verified: boolean;
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
  title_fr: string | null;
  title_en: string | null;
  body_ar: string;
  body_fr: string | null;
  body_en: string | null;
  data: Json;
  is_read: boolean;
  read_at: string | null;
  related_entity_type: string | null;
  related_entity_id: string | null;
  created_at: string;
}

export interface FirstAidCategory {
  id: string;
  slug: string;
  name_ar: string;
  name_fr: string;
  name_en: string;
  icon: string | null;
  color: string;
  sort_order: number;
  is_emergency: boolean;
  is_active: boolean;
  created_at: string;
}

export interface FirstAidGuide {
  id: string;
  category_id: string;
  slug: string;
  title_ar: string;
  title_fr: string;
  title_en: string;
  warning_ar: string | null;
  warning_fr: string | null;
  warning_en: string | null;
  when_to_call_ar: string | null;
  when_to_call_fr: string | null;
  when_to_call_en: string | null;
  do_not_do_ar: string | null;
  do_not_do_fr: string | null;
  do_not_do_en: string | null;
  source: string | null;
  version: number;
  review_status: FirstAidReviewStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface FirstAidStep {
  id: string;
  guide_id: string;
  step_number: number;
  title_ar: string;
  title_fr: string | null;
  title_en: string | null;
  description_ar: string;
  description_fr: string | null;
  description_en: string | null;
  is_critical: boolean;
  created_at: string;
}

export interface AuditLog {
  id: string;
  actor_id: string | null;
  actor_role: UserRole | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  old_data: Json | null;
  new_data: Json | null;
  ip_address: string | null;
  user_agent: string | null;
  metadata: Json;
  created_at: string;
}
