// ============================================================
// SIHALINK - Database TypeScript Types
// Auto-aligned with migration 001
// ============================================================

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type UserRole = 'USER' | 'DOCTOR' | 'HEALTHCARE_PROVIDER' | 'EMERGENCY_OPERATOR' | 'ADMIN' | 'SUPER_ADMIN';

export type EmergencyType =
  | 'medical_emergency'
  | 'accident'
  | 'fire'
  | 'pregnancy_emergency'
  | 'child_emergency'
  | 'elderly_emergency'
  | 'unconscious_person'
  | 'breathing_difficulty'
  | 'chest_pain'
  | 'severe_bleeding'
  | 'other';

export type EmergencyPriority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export type ReportStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'RECEIVED'
  | 'UNDER_REVIEW'
  | 'ASSIGNED'
  | 'ACKNOWLEDGED'
  | 'IN_PROGRESS'
  | 'RESOLVED'
  | 'CANCELLED'
  | 'REJECTED'
  | 'FALSE_REPORT_REVIEW'
  | 'CLOSED';

export type AppointmentStatus =
  | 'REQUESTED'
  | 'CONFIRMED'
  | 'RESCHEDULED'
  | 'CANCELLED_BY_USER'
  | 'CANCELLED_BY_DOCTOR'
  | 'COMPLETED'
  | 'NO_SHOW';

export type NotificationType =
  | 'emergency_update'
  | 'appointment_update'
  | 'security_alert'
  | 'system_announcement'
  | 'account_notification';

export type AccountStatus = 'active' | 'suspended' | 'restricted' | 'deleted';

export type BloodType = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-' | 'unknown';

export type Gender = 'male' | 'female' | 'other' | 'prefer_not_to_say';

export type Locale = 'ar' | 'fr' | 'en';

export type FacilityType =
  | 'hospital'
  | 'clinic'
  | 'medical_center'
  | 'emergency_department'
  | 'imaging_center'
  | 'specialized_center';

export type ConsultationType = 'in_person' | 'video' | 'home_visit';

export type SuspensionType = 'warning' | 'temporary' | 'extended' | 'restricted';

export type ReviewStatus = 'pending_review' | 'reviewed' | 'approved' | 'outdated';

export type FalseReportCaseType = 'accidental' | 'intentional' | 'under_review';

export interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  email: string | null;
  date_of_birth: string | null;
  gender: Gender | null;
  blood_type: BloodType | null;
  address: string | null;
  city: string | null;
  wilaya: string | null;
  profile_photo_url: string | null;
  preferred_language: Locale;
  emergency_notes: string | null;
  account_status: AccountStatus;
  is_demo: boolean;
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
  affected_count: number;
  assigned_operator_id: string | null;
  false_report_flag: boolean;
  cancellation_reason: string | null;
  cancelled_at: string | null;
  resolved_at: string | null;
  is_demo: boolean;
  created_at: string;
  updated_at: string;
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
  is_manual: boolean;
  captured_at: string;
  created_at: string;
}

export interface TriageAnswer {
  id: string;
  report_id: string;
  question_key: string;
  question_text_ar: string;
  question_text_fr: string | null;
  question_text_en: string | null;
  answer: string;
  answer_display_ar: string | null;
  weight: number;
  created_at: string;
}

export interface ReportEvent {
  id: string;
  report_id: string;
  event_type: string;
  actor_id: string | null;
  actor_role: string | null;
  description: string | null;
  metadata: Json;
  is_visible_to_user: boolean;
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
  gender: 'male' | 'female' | null;
  years_experience: number;
  city: string | null;
  wilaya: string | null;
  address: string | null;
  consultation_type: ConsultationType[];
  consultation_fee: number | null;
  is_verified: boolean;
  is_active: boolean;
  is_demo: boolean;
  rating: number | null;
  review_count: number;
  created_at: string;
  updated_at: string;
  // joined
  specialties?: Specialty[];
  availability?: DoctorAvailability[];
}

export interface Specialty {
  id: string;
  name_ar: string;
  name_fr: string;
  name_en: string;
  icon: string | null;
  created_at: string;
}

export interface DoctorAvailability {
  id: string;
  doctor_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  slot_duration_minutes: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Appointment {
  id: string;
  user_id: string;
  doctor_id: string;
  facility_id: string | null;
  appointment_date: string;
  appointment_time: string;
  duration_minutes: number;
  consultation_type: ConsultationType;
  status: AppointmentStatus;
  reason: string | null;
  notes: string | null;
  doctor_notes: string | null;
  cancellation_reason: string | null;
  is_demo: boolean;
  created_at: string;
  updated_at: string;
  // joined
  doctor?: Doctor;
  profile?: Profile;
}

export interface HealthcareFacility {
  id: string;
  name: string;
  name_ar: string | null;
  facility_type: FacilityType;
  description: string | null;
  description_ar: string | null;
  phone: string | null;
  phone_emergency: string | null;
  email: string | null;
  website: string | null;
  address: string;
  city: string;
  wilaya: string;
  commune: string | null;
  latitude: number | null;
  longitude: number | null;
  has_emergency: boolean;
  is_24h: boolean;
  is_verified: boolean;
  is_active: boolean;
  is_demo: boolean;
  opening_hours: Json;
  created_at: string;
  updated_at: string;
  services?: FacilityService[];
}

export interface FacilityService {
  id: string;
  facility_id: string;
  service_name: string;
  service_name_ar: string | null;
  description: string | null;
  created_at: string;
}

export interface Pharmacy {
  id: string;
  name: string;
  name_ar: string | null;
  phone: string | null;
  address: string;
  city: string;
  wilaya: string;
  commune: string | null;
  latitude: number | null;
  longitude: number | null;
  is_24h: boolean;
  is_duty: boolean;
  is_verified: boolean;
  is_active: boolean;
  is_demo: boolean;
  opening_hours: Json;
  services: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface Laboratory {
  id: string;
  name: string;
  name_ar: string | null;
  phone: string | null;
  address: string;
  city: string;
  wilaya: string;
  commune: string | null;
  latitude: number | null;
  longitude: number | null;
  is_verified: boolean;
  is_active: boolean;
  is_demo: boolean;
  opening_hours: Json;
  services: string[] | null;
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
  related_entity_type: string | null;
  related_entity_id: string | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

export interface FirstAidCategory {
  id: string;
  name_ar: string;
  name_fr: string;
  name_en: string;
  description_ar: string | null;
  icon: string | null;
  color: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
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
  when_to_call_ar: string | null;
  when_to_call_fr: string | null;
  when_to_call_en: string | null;
  do_not_do_ar: string | null;
  do_not_do_fr: string | null;
  do_not_do_en: string | null;
  source: string | null;
  version: number;
  review_status: ReviewStatus;
  reviewed_by: string | null;
  review_date: string | null;
  is_published: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  steps?: FirstAidStep[];
  category?: FirstAidCategory;
}

export interface FirstAidStep {
  id: string;
  guide_id: string;
  step_number: number;
  instruction_ar: string;
  instruction_fr: string | null;
  instruction_en: string | null;
  image_url: string | null;
  is_critical: boolean;
  created_at: string;
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

export interface AuditLog {
  id: string;
  actor_id: string | null;
  actor_role: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  old_values: Json | null;
  new_values: Json | null;
  metadata: Json;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export interface Suspension {
  id: string;
  user_id: string;
  suspended_by: string | null;
  reason: string;
  suspension_type: SuspensionType;
  starts_at: string;
  ends_at: string | null;
  is_active: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface NotificationPreferences {
  id: string;
  user_id: string;
  in_app_enabled: boolean;
  email_enabled: boolean;
  sms_enabled: boolean;
  push_enabled: boolean;
  emergency_updates: boolean;
  appointment_updates: boolean;
  security_alerts: boolean;
  system_announcements: boolean;
  account_notifications: boolean;
  created_at: string;
  updated_at: string;
}
