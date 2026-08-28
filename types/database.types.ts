// ============================================================
// SIHALINK - Auto-generated Database Types
// Run: supabase gen types typescript --local > types/database.types.ts
// ============================================================

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type EmergencyType =
  | 'medical' | 'accident' | 'fire' | 'maternity' | 'child_emergency'
  | 'elderly_emergency' | 'unconscious' | 'breathing_difficulty'
  | 'chest_pain' | 'severe_bleeding' | 'other';

export type Priority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export type ReportStatus =
  | 'DRAFT' | 'SUBMITTED' | 'RECEIVED' | 'UNDER_REVIEW' | 'ASSIGNED'
  | 'ACKNOWLEDGED' | 'IN_PROGRESS' | 'RESOLVED' | 'CANCELLED'
  | 'REJECTED' | 'FALSE_REPORT_REVIEW' | 'CLOSED';

export type AppointmentStatus =
  | 'REQUESTED' | 'CONFIRMED' | 'RESCHEDULED'
  | 'CANCELLED_BY_USER' | 'CANCELLED_BY_DOCTOR' | 'COMPLETED' | 'NO_SHOW';

export type UserRole =
  | 'USER' | 'DOCTOR' | 'HEALTHCARE_PROVIDER'
  | 'EMERGENCY_OPERATOR' | 'ADMIN' | 'SUPER_ADMIN';

export type AccountStatus = 'active' | 'suspended' | 'restricted' | 'pending_verification' | 'deleted';

export type VerificationStatus = 'unverified' | 'pending' | 'verified' | 'suspended';

export type FacilityType =
  | 'hospital' | 'clinic' | 'medical_center' | 'emergency_department'
  | 'imaging_center' | 'health_center' | 'maternity';

export type NotificationType = 'emergency_update' | 'appointment_update' | 'security' | 'system' | 'account';

export type ReviewStatus = 'pending_review' | 'reviewed' | 'published' | 'archived';

export interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  email: string | null;
  date_of_birth: string | null;
  gender: 'male' | 'female' | 'prefer_not_to_say' | null;
  blood_type: string | null;
  address: string | null;
  city: string | null;
  wilaya: string | null;
  profile_photo_url: string | null;
  preferred_language: 'ar' | 'fr' | 'en';
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
  priority: Priority;
  status: ReportStatus;
  description: string | null;
  additional_info: string | null;
  assigned_operator_id: string | null;
  operator_notes: string | null;
  is_false_report: boolean | null;
  false_report_type: 'accidental' | 'intentional' | null;
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
  is_manual: boolean;
  is_demo_location: boolean;
  captured_at: string;
  created_at: string;
}

export interface TriageAnswer {
  id: string;
  report_id: string;
  question_key: string;
  question_text: string | null;
  answer: string;
  created_at: string;
}

export interface Doctor {
  id: string;
  user_id: string | null;
  first_name: string;
  last_name: string;
  photo_url: string | null;
  bio: string | null;
  bio_ar: string | null;
  languages: string[];
  gender: 'male' | 'female' | null;
  years_experience: number | null;
  facility_id: string | null;
  city: string | null;
  wilaya: string | null;
  consultation_types: string[];
  consultation_fee: number | null;
  rating: number | null;
  total_reviews: number;
  verification_status: VerificationStatus;
  is_accepting_patients: boolean;
  is_demo: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Appointment {
  id: string;
  patient_id: string;
  doctor_id: string;
  appointment_date: string;
  appointment_time: string;
  duration_minutes: number;
  consultation_type: 'in_person' | 'video' | 'phone';
  reason: string | null;
  status: AppointmentStatus;
  patient_notes: string | null;
  doctor_notes: string | null;
  cancellation_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  title_ar: string | null;
  body: string;
  body_ar: string | null;
  data: Json | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

export interface HealthcareFacility {
  id: string;
  name: string;
  name_ar: string | null;
  name_fr: string | null;
  type: FacilityType;
  description: string | null;
  description_ar: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  address: string | null;
  city: string;
  wilaya: string;
  latitude: number | null;
  longitude: number | null;
  opening_hours: Json | null;
  emergency_available: boolean;
  verification_status: VerificationStatus;
  is_demo: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Pharmacy {
  id: string;
  name: string;
  name_ar: string | null;
  phone: string | null;
  address: string | null;
  city: string;
  wilaya: string;
  latitude: number | null;
  longitude: number | null;
  opening_hours: Json | null;
  is_24h: boolean;
  has_delivery: boolean;
  verification_status: string;
  is_demo: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Laboratory {
  id: string;
  name: string;
  name_ar: string | null;
  phone: string | null;
  address: string | null;
  city: string;
  wilaya: string;
  latitude: number | null;
  longitude: number | null;
  opening_hours: Json | null;
  services: Json | null;
  requires_appointment: boolean;
  verification_status: string;
  is_demo: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface FirstAidGuide {
  id: string;
  category_id: string;
  title: string;
  title_ar: string;
  title_fr: string | null;
  warning: string | null;
  warning_ar: string | null;
  when_to_call_emergency: string | null;
  when_to_call_emergency_ar: string | null;
  do_not_do: string | null;
  do_not_do_ar: string | null;
  source: string | null;
  review_status: ReviewStatus;
  reviewed_by: string | null;
  review_date: string | null;
  version: number;
  is_active: boolean;
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
  metadata: Json | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}
