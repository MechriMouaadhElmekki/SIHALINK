export type UserRole = 'USER' | 'DOCTOR' | 'HEALTHCARE_PROVIDER' | 'EMERGENCY_OPERATOR' | 'ADMIN' | 'SUPER_ADMIN';
export type AccountStatus = 'ACTIVE' | 'SUSPENDED' | 'RESTRICTED' | 'DELETED';
export type GenderType = 'MALE' | 'FEMALE' | 'OTHER' | 'PREFER_NOT_TO_SAY';
export type BloodType = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-' | 'UNKNOWN';
export type EmergencyType = 'MEDICAL' | 'ACCIDENT' | 'FIRE' | 'PREGNANCY' | 'CHILD_EMERGENCY' | 'ELDERLY_EMERGENCY' | 'UNCONSCIOUS' | 'BREATHING_DIFFICULTY' | 'CHEST_PAIN' | 'SEVERE_BLEEDING' | 'OTHER';
export type EmergencyPriority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type ReportStatus = 'DRAFT' | 'SUBMITTED' | 'RECEIVED' | 'UNDER_REVIEW' | 'ASSIGNED' | 'ACKNOWLEDGED' | 'IN_PROGRESS' | 'RESOLVED' | 'CANCELLED' | 'REJECTED' | 'FALSE_REPORT_REVIEW' | 'CLOSED';
export type AppointmentStatus = 'REQUESTED' | 'CONFIRMED' | 'RESCHEDULED' | 'CANCELLED_BY_USER' | 'CANCELLED_BY_DOCTOR' | 'COMPLETED' | 'NO_SHOW';
export type ConsultationType = 'IN_PERSON' | 'TELECONSULTATION' | 'HOME_VISIT';
export type FacilityType = 'HOSPITAL' | 'CLINIC' | 'MEDICAL_CENTER' | 'EMERGENCY_DEPARTMENT' | 'PHARMACY' | 'LABORATORY' | 'IMAGING_CENTER' | 'HEALTH_CENTER';
export type FalseReportType = 'NORMAL' | 'UNDER_REVIEW' | 'ACCIDENTAL' | 'INTENTIONAL';
export type SuspensionType = 'WARNING' | 'TEMPORARY' | 'EXTENDED' | 'RESTRICTION';
export type NotificationType = 'EMERGENCY_UPDATE' | 'APPOINTMENT_UPDATE' | 'SECURITY_ALERT' | 'SYSTEM_ANNOUNCEMENT' | 'ACCOUNT_NOTIFICATION';
export type GuideReviewStatus = 'PENDING_REVIEW' | 'REVIEWED' | 'PUBLISHED' | 'ARCHIVED';
export type VerificationStatus = 'PENDING' | 'VERIFIED' | 'REJECTED' | 'SUSPENDED';

export interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  phone?: string;
  date_of_birth?: string;
  gender?: GenderType;
  blood_type?: BloodType;
  address?: string;
  city?: string;
  wilaya?: string;
  profile_photo_url?: string;
  preferred_language: 'ar' | 'fr' | 'en';
  emergency_notes?: string;
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
  relationship?: string;
  phone: string;
  email?: string;
  priority: number;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
}

export interface EmergencyLocation {
  id: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  altitude?: number;
  address?: string;
  city?: string;
  wilaya?: string;
  commune?: string;
  captured_at: string;
  is_manual: boolean;
  created_at: string;
}

export interface EmergencyReport {
  id: string;
  report_number: string;
  user_id: string;
  emergency_type: EmergencyType;
  priority: EmergencyPriority;
  status: ReportStatus;
  description?: string;
  location_id?: string;
  assigned_operator_id?: string;
  is_demo: boolean;
  false_report_type: FalseReportType;
  created_at: string;
  updated_at: string;
  location?: EmergencyLocation;
  triage_answers?: TriageAnswer[];
  events?: ReportEvent[];
  media?: EmergencyMedia[];
}

export interface TriageAnswer {
  id: string;
  report_id: string;
  question_key: string;
  question_text: string;
  answer: string;
  created_at: string;
}

export interface ReportEvent {
  id: string;
  report_id: string;
  event_type: string;
  actor_id?: string;
  actor_role?: UserRole;
  description?: string;
  metadata?: Record<string, unknown>;
  is_visible_to_user: boolean;
  created_at: string;
}

export interface EmergencyMedia {
  id: string;
  report_id: string;
  storage_path: string;
  file_name: string;
  file_type: string;
  file_size: number;
  mime_type: string;
  uploaded_by: string;
  created_at: string;
}

export interface Doctor {
  id: string;
  user_id?: string;
  first_name: string;
  last_name: string;
  specialty_id?: string;
  bio?: string;
  languages: string[];
  gender?: GenderType;
  years_experience?: number;
  facility_id?: string;
  city?: string;
  wilaya?: string;
  consultation_types: ConsultationType[];
  consultation_fee?: number;
  photo_url?: string;
  verification_status: VerificationStatus;
  is_demo: boolean;
  is_accepting_patients: boolean;
  created_at: string;
  updated_at: string;
  specialty?: Specialty;
  facility?: HealthcareFacility;
  availability?: DoctorAvailability[];
}

export interface Specialty {
  id: string;
  name_ar: string;
  name_fr: string;
  name_en: string;
  slug: string;
  icon?: string;
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
}

export interface Appointment {
  id: string;
  patient_id: string;
  doctor_id: string;
  facility_id?: string;
  appointment_date: string;
  appointment_time: string;
  consultation_type: ConsultationType;
  status: AppointmentStatus;
  reason?: string;
  notes?: string;
  is_demo: boolean;
  created_at: string;
  updated_at: string;
  doctor?: Doctor;
  patient?: Profile;
  facility?: HealthcareFacility;
}

export interface HealthcareFacility {
  id: string;
  name: string;
  type: FacilityType;
  description?: string;
  phone?: string;
  email?: string;
  website?: string;
  address?: string;
  city?: string;
  wilaya?: string;
  commune?: string;
  latitude?: number;
  longitude?: number;
  opening_hours?: Record<string, { open: string; close: string; closed?: boolean }>;
  emergency_available: boolean;
  verification_status: VerificationStatus;
  is_demo: boolean;
  created_at: string;
  updated_at: string;
  services?: FacilityService[];
}

export interface FacilityService {
  id: string;
  facility_id: string;
  name_ar: string;
  name_fr: string;
  name_en: string;
  created_at: string;
}

export interface Pharmacy {
  id: string;
  name: string;
  phone?: string;
  address?: string;
  city?: string;
  wilaya?: string;
  latitude?: number;
  longitude?: number;
  opening_hours?: Record<string, unknown>;
  is_24h: boolean;
  is_demo: boolean;
  verification_status: VerificationStatus;
  created_at: string;
  updated_at: string;
}

export interface Laboratory {
  id: string;
  name: string;
  phone?: string;
  address?: string;
  city?: string;
  wilaya?: string;
  latitude?: number;
  longitude?: number;
  opening_hours?: Record<string, unknown>;
  services?: string[];
  is_demo: boolean;
  verification_status: VerificationStatus;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title_ar: string;
  title_fr?: string;
  title_en?: string;
  body_ar: string;
  body_fr?: string;
  body_en?: string;
  data?: Record<string, unknown>;
  is_read: boolean;
  read_at?: string;
  created_at: string;
}

export interface FirstAidCategory {
  id: string;
  slug: string;
  name_ar: string;
  name_fr: string;
  name_en: string;
  icon?: string;
  color?: string;
  sort_order: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface FirstAidGuide {
  id: string;
  category_id: string;
  slug: string;
  title_ar: string;
  title_fr: string;
  title_en: string;
  warning_ar?: string;
  warning_fr?: string;
  warning_en?: string;
  call_emergency_when_ar?: string;
  call_emergency_when_fr?: string;
  call_emergency_when_en?: string;
  do_not_do_ar?: string;
  do_not_do_fr?: string;
  do_not_do_en?: string;
  source?: string;
  version: number;
  review_status: GuideReviewStatus;
  reviewed_by?: string;
  reviewed_at?: string;
  is_published: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  category?: FirstAidCategory;
  steps?: FirstAidStep[];
}

export interface FirstAidStep {
  id: string;
  guide_id: string;
  step_number: number;
  text_ar: string;
  text_fr?: string;
  text_en?: string;
  image_url?: string;
  created_at: string;
}

export interface AuditLog {
  id: string;
  actor_id?: string;
  actor_role?: UserRole;
  action: string;
  entity: string;
  entity_id?: string;
  metadata?: Record<string, unknown>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}
