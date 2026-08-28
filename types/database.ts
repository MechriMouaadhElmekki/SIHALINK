// ============================================================
// SIHALINK - Database TypeScript Types
// ============================================================

export type UserRole = 'USER' | 'DOCTOR' | 'HEALTHCARE_PROVIDER' | 'EMERGENCY_OPERATOR' | 'ADMIN' | 'SUPER_ADMIN';
export type Locale = 'ar' | 'fr' | 'en';
export type Gender = 'male' | 'female' | 'prefer_not_to_say';
export type BloodType = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-' | 'unknown';
export type AccountStatus = 'active' | 'suspended' | 'restricted' | 'deleted';

export type EmergencyType =
  | 'medical' | 'accident' | 'fire' | 'pregnancy' | 'child_emergency'
  | 'elderly_emergency' | 'unconscious' | 'breathing_difficulty'
  | 'chest_pain' | 'severe_bleeding' | 'other';

export type ReportStatus =
  | 'DRAFT' | 'SUBMITTED' | 'RECEIVED' | 'UNDER_REVIEW' | 'ASSIGNED'
  | 'ACKNOWLEDGED' | 'IN_PROGRESS' | 'RESOLVED' | 'CANCELLED'
  | 'REJECTED' | 'FALSE_REPORT_REVIEW' | 'CLOSED';

export type ReportPriority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export type AppointmentStatus =
  | 'REQUESTED' | 'CONFIRMED' | 'RESCHEDULED'
  | 'CANCELLED_BY_USER' | 'CANCELLED_BY_DOCTOR' | 'COMPLETED' | 'NO_SHOW';

export type ConsultationType = 'in_person' | 'teleconsultation';

export type FacilityType =
  | 'hospital' | 'clinic' | 'medical_center' | 'emergency_department'
  | 'imaging_center' | 'health_center';

export type NotificationType = 'emergency_update' | 'appointment_update' | 'security' | 'system' | 'account';

export type FirstAidReviewStatus = 'draft' | 'under_review' | 'approved' | 'published';

// ============================================================
// TABLE ROW TYPES
// ============================================================

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
  status: ReportStatus;
  priority: ReportPriority | null;
  additional_info: string | null;
  operator_id: string | null;
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
  captured_at: string;
  created_at: string;
}

export interface EmergencyReportEvent {
  id: string;
  report_id: string;
  event_type: string;
  actor_id: string | null;
  actor_role: string | null;
  description: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface TriageAnswer {
  id: string;
  report_id: string;
  question_key: string;
  question_text: string;
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
  gender: 'male' | 'female' | null;
  languages: string[];
  experience_years: number | null;
  facility_id: string | null;
  city: string | null;
  wilaya: string | null;
  consultation_types: ConsultationType[];
  is_verified: boolean;
  verification_status: 'pending' | 'verified' | 'rejected';
  is_active: boolean;
  is_demo: boolean;
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

export interface HealthcareFacility {
  id: string;
  name: string;
  type: FacilityType;
  description: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  wilaya: string;
  commune: string | null;
  latitude: number | null;
  longitude: number | null;
  opening_hours: Record<string, unknown> | null;
  has_emergency: boolean;
  is_verified: boolean;
  is_demo: boolean;
  verification_status: 'pending' | 'verified' | 'rejected';
  created_at: string;
  updated_at: string;
}

export interface Appointment {
  id: string;
  patient_id: string;
  doctor_id: string;
  appointment_date: string;
  appointment_time: string;
  consultation_type: ConsultationType;
  reason: string | null;
  status: AppointmentStatus;
  doctor_notes: string | null;
  is_demo: boolean;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string;
  data: Record<string, unknown> | null;
  is_read: boolean;
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

export interface FirstAidCategory {
  id: string;
  slug: string;
  name_ar: string;
  name_fr: string;
  name_en: string;
  icon: string | null;
  sort_order: number;
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
  call_emergency_when_ar: string | null;
  call_emergency_when_fr: string | null;
  call_emergency_when_en: string | null;
  do_not_do_ar: string | null;
  do_not_do_fr: string | null;
  do_not_do_en: string | null;
  source: string | null;
  review_status: FirstAidReviewStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
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
  created_at: string;
}

export interface AuditLog {
  id: string;
  actor_id: string | null;
  actor_role: string | null;
  action: string;
  entity: string;
  entity_id: string | null;
  metadata: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: string;
}

export interface Pharmacy {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  wilaya: string;
  phone: string | null;
  latitude: number | null;
  longitude: number | null;
  opening_hours: Record<string, unknown> | null;
  has_24h_service: boolean;
  is_verified: boolean;
  is_demo: boolean;
  created_at: string;
  updated_at: string;
}

export interface Laboratory {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  wilaya: string;
  phone: string | null;
  latitude: number | null;
  longitude: number | null;
  services: string[] | null;
  opening_hours: Record<string, unknown> | null;
  is_verified: boolean;
  is_demo: boolean;
  created_at: string;
  updated_at: string;
}

// ============================================================
// VALID STATE MACHINE TRANSITIONS
// ============================================================
export const VALID_REPORT_TRANSITIONS: Record<ReportStatus, ReportStatus[]> = {
  DRAFT: ['SUBMITTED', 'CANCELLED'],
  SUBMITTED: ['RECEIVED', 'CANCELLED'],
  RECEIVED: ['UNDER_REVIEW', 'REJECTED'],
  UNDER_REVIEW: ['ASSIGNED', 'REJECTED', 'FALSE_REPORT_REVIEW'],
  ASSIGNED: ['ACKNOWLEDGED'],
  ACKNOWLEDGED: ['IN_PROGRESS'],
  IN_PROGRESS: ['RESOLVED'],
  RESOLVED: ['CLOSED'],
  CANCELLED: ['FALSE_REPORT_REVIEW'],
  REJECTED: ['CLOSED'],
  FALSE_REPORT_REVIEW: ['CLOSED', 'RESOLVED'],
  CLOSED: [],
};
