export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type UserRole = 'USER' | 'DOCTOR' | 'HEALTHCARE_PROVIDER' | 'EMERGENCY_OPERATOR' | 'ADMIN' | 'SUPER_ADMIN';
export type EmergencyType = 'MEDICAL' | 'ACCIDENT' | 'FIRE' | 'PREGNANCY' | 'CHILD_EMERGENCY' | 'ELDERLY' | 'UNCONSCIOUS' | 'BREATHING_DIFFICULTY' | 'CHEST_PAIN' | 'SEVERE_BLEEDING' | 'OTHER';
export type EmergencyPriority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type ReportStatus = 'DRAFT' | 'SUBMITTED' | 'RECEIVED' | 'UNDER_REVIEW' | 'ASSIGNED' | 'ACKNOWLEDGED' | 'IN_PROGRESS' | 'RESOLVED' | 'CANCELLED' | 'REJECTED' | 'FALSE_REPORT_REVIEW' | 'CLOSED';
export type AppointmentStatus = 'REQUESTED' | 'CONFIRMED' | 'RESCHEDULED' | 'CANCELLED_BY_USER' | 'CANCELLED_BY_DOCTOR' | 'COMPLETED' | 'NO_SHOW';
export type FacilityType = 'HOSPITAL' | 'CLINIC' | 'MEDICAL_CENTER' | 'EMERGENCY_DEPARTMENT' | 'PHARMACY' | 'LABORATORY' | 'IMAGING_CENTER';
export type AccountStatus = 'ACTIVE' | 'SUSPENDED' | 'RESTRICTED' | 'DELETED';
export type Gender = 'MALE' | 'FEMALE' | 'OTHER' | 'PREFER_NOT_TO_SAY';
export type BloodType = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
export type ConsultationType = 'IN_PERSON' | 'VIDEO' | 'PHONE' | 'HOME_VISIT';
export type NotificationType = 'EMERGENCY_UPDATE' | 'APPOINTMENT_UPDATE' | 'SECURITY_ALERT' | 'SYSTEM_ANNOUNCEMENT' | 'ACCOUNT_NOTIFICATION';
export type SuspensionType = 'WARNING' | 'TEMPORARY' | 'EXTENDED' | 'RESTRICTED';

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
  account_status: AccountStatus;
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
  people_affected: number;
  created_at: string;
  updated_at: string;
  submitted_at: string | null;
  resolved_at: string | null;
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
  full_name: string;
  photo_url: string | null;
  bio: string | null;
  languages: string[];
  gender: Gender | null;
  years_experience: number | null;
  facility_id: string | null;
  city: string | null;
  wilaya: string | null;
  consultation_types: ConsultationType[];
  is_verified: boolean;
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
}

export interface Appointment {
  id: string;
  user_id: string;
  doctor_id: string;
  appointment_date: string;
  appointment_time: string;
  consultation_type: ConsultationType;
  reason: string | null;
  status: AppointmentStatus;
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
  has_emergency: boolean;
  is_verified: boolean;
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
  is_verified: boolean;
  is_demo: boolean;
  created_at: string;
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
  services: string[];
  opening_hours: Json | null;
  requires_appointment: boolean;
  is_verified: boolean;
  is_demo: boolean;
  created_at: string;
}

export interface FirstAidCategory {
  id: string;
  name_ar: string;
  name_fr: string;
  name_en: string;
  icon: string;
  color: string;
  order_index: number;
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
  review_status: 'DRAFT' | 'UNDER_REVIEW' | 'REVIEWED';
  reviewed_by: string | null;
  review_date: string | null;
  version: number;
  is_published: boolean;
  created_at: string;
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
  is_read: boolean;
  entity_type: string | null;
  entity_id: string | null;
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
  actor_role: UserRole | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  metadata: Json | null;
  ip_address: string | null;
  created_at: string;
}
