export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type UserRole = 'USER' | 'DOCTOR' | 'HEALTHCARE_PROVIDER' | 'EMERGENCY_OPERATOR' | 'ADMIN' | 'SUPER_ADMIN';
export type EmergencyType = 'MEDICAL' | 'ACCIDENT' | 'FIRE' | 'PREGNANCY' | 'CHILD' | 'ELDERLY' | 'UNCONSCIOUS' | 'BREATHING' | 'CHEST_PAIN' | 'BLEEDING' | 'OTHER';
export type EmergencyPriority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type ReportStatus = 'DRAFT' | 'SUBMITTED' | 'RECEIVED' | 'UNDER_REVIEW' | 'ASSIGNED' | 'ACKNOWLEDGED' | 'IN_PROGRESS' | 'RESOLVED' | 'CANCELLED' | 'REJECTED' | 'FALSE_REPORT_REVIEW' | 'CLOSED';
export type AppointmentStatus = 'REQUESTED' | 'CONFIRMED' | 'RESCHEDULED' | 'CANCELLED_BY_USER' | 'CANCELLED_BY_DOCTOR' | 'COMPLETED' | 'NO_SHOW';
export type FacilityType = 'HOSPITAL' | 'CLINIC' | 'MEDICAL_CENTER' | 'EMERGENCY_DEPARTMENT' | 'PHARMACY' | 'LABORATORY' | 'IMAGING_CENTER';
export type Gender = 'MALE' | 'FEMALE' | 'OTHER' | 'PREFER_NOT_TO_SAY';
export type BloodType = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
export type NotificationType = 'EMERGENCY_UPDATE' | 'APPOINTMENT_UPDATE' | 'SECURITY_ALERT' | 'SYSTEM_ANNOUNCEMENT' | 'ACCOUNT_NOTIFICATION';
export type SuspensionType = 'WARNING' | 'TEMPORARY' | 'LONG_TERM' | 'RESTRICTED';
export type ConsultationType = 'IN_PERSON' | 'VIDEO' | 'PHONE';
export type VerificationStatus = 'PENDING' | 'VERIFIED' | 'REJECTED' | 'DEMO';

export interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  email: string;
  date_of_birth: string | null;
  gender: Gender | null;
  blood_type: BloodType | null;
  address: string | null;
  city: string | null;
  wilaya: string | null;
  profile_photo: string | null;
  preferred_language: 'ar' | 'fr' | 'en';
  emergency_notes: string | null;
  account_status: 'ACTIVE' | 'SUSPENDED' | 'RESTRICTED' | 'DELETED';
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
  description: string | null;
  additional_info: string | null;
  operator_id: string | null;
  operator_notes: string | null;
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
  address: string | null;
  city: string | null;
  wilaya: string | null;
  commune: string | null;
  captured_at: string;
  is_simulated: boolean;
}

export interface EmergencyTriageAnswer {
  id: string;
  report_id: string;
  question_key: string;
  answer: string;
  created_at: string;
}

export interface EmergencyReportEvent {
  id: string;
  report_id: string;
  event_type: string;
  actor_id: string | null;
  actor_role: UserRole | null;
  description: string | null;
  metadata: Json | null;
  created_at: string;
}

export interface Doctor {
  id: string;
  user_id: string | null;
  first_name: string;
  last_name: string;
  photo: string | null;
  bio: string | null;
  languages: string[];
  gender: Gender | null;
  experience_years: number | null;
  facility_id: string | null;
  city: string | null;
  wilaya: string | null;
  consultation_types: ConsultationType[];
  verification_status: VerificationStatus;
  is_available: boolean;
  is_demo: boolean;
  rating: number | null;
  created_at: string;
  updated_at: string;
}

export interface Specialty {
  id: string;
  name_ar: string;
  name_fr: string;
  name_en: string;
  icon: string | null;
  created_at: string;
}

export interface DoctorSpecialty {
  id: string;
  doctor_id: string;
  specialty_id: string;
  is_primary: boolean;
}

export interface DoctorAvailability {
  id: string;
  doctor_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  slot_duration_minutes: number;
  is_active: boolean;
}

export interface Appointment {
  id: string;
  patient_id: string;
  doctor_id: string;
  appointment_date: string;
  appointment_time: string;
  duration_minutes: number;
  consultation_type: ConsultationType;
  status: AppointmentStatus;
  reason: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface HealthcareFacility {
  id: string;
  name: string;
  type: FacilityType;
  description: string | null;
  phone: string | null;
  address: string;
  city: string;
  wilaya: string;
  latitude: number | null;
  longitude: number | null;
  opening_hours: Json | null;
  emergency_available: boolean;
  verification_status: VerificationStatus;
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
  services: string[];
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
  services: string[];
  requires_appointment: boolean;
  is_demo: boolean;
  created_at: string;
  updated_at: string;
}

export interface FirstAidCategory {
  id: string;
  name_ar: string;
  name_fr: string;
  name_en: string;
  icon: string;
  color: string;
  sort_order: number;
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
  review_status: 'DRAFT' | 'PENDING_REVIEW' | 'REVIEWED' | 'PUBLISHED';
  reviewed_by: string | null;
  review_date: string | null;
  version: number;
  is_published: boolean;
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
  is_critical: boolean;
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

export interface AuditLog {
  id: string;
  actor_id: string | null;
  actor_email: string | null;
  actor_role: UserRole | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  metadata: Json | null;
  ip_address: string | null;
  created_at: string;
}

export interface FalseReportCase {
  id: string;
  report_id: string;
  reported_by: string | null;
  reason: string;
  evidence: string | null;
  case_type: 'ACCIDENTAL' | 'INTENTIONAL' | 'UNDER_REVIEW';
  reviewer_id: string | null;
  decision: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Suspension {
  id: string;
  user_id: string;
  type: SuspensionType;
  reason: string;
  issued_by: string;
  starts_at: string;
  ends_at: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
