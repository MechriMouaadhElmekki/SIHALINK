export type UserRole = 'USER' | 'DOCTOR' | 'HEALTHCARE_PROVIDER' | 'EMERGENCY_OPERATOR' | 'ADMIN' | 'SUPER_ADMIN';
export type AccountStatus = 'ACTIVE' | 'SUSPENDED' | 'RESTRICTED' | 'DELETED';
export type GenderType = 'MALE' | 'FEMALE' | 'OTHER' | 'PREFER_NOT_TO_SAY';
export type BloodType = 'A_POS' | 'A_NEG' | 'B_POS' | 'B_NEG' | 'AB_POS' | 'AB_NEG' | 'O_POS' | 'O_NEG' | 'UNKNOWN';
export type EmergencyType = 'MEDICAL' | 'ACCIDENT' | 'FIRE' | 'MATERNITY' | 'CHILD_EMERGENCY' | 'ELDERLY_EMERGENCY' | 'UNCONSCIOUS' | 'BREATHING_DIFFICULTY' | 'CHEST_PAIN' | 'SEVERE_BLEEDING' | 'OTHER';
export type EmergencyPriority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type ReportStatus = 'DRAFT' | 'SUBMITTED' | 'RECEIVED' | 'UNDER_REVIEW' | 'ASSIGNED' | 'ACKNOWLEDGED' | 'IN_PROGRESS' | 'RESOLVED' | 'CANCELLED' | 'REJECTED' | 'FALSE_REPORT_REVIEW' | 'CLOSED';
export type AppointmentStatus = 'REQUESTED' | 'CONFIRMED' | 'RESCHEDULED' | 'CANCELLED_BY_USER' | 'CANCELLED_BY_DOCTOR' | 'COMPLETED' | 'NO_SHOW';
export type ConsultationType = 'IN_PERSON' | 'ONLINE' | 'BOTH';
export type FacilityType = 'HOSPITAL' | 'CLINIC' | 'MEDICAL_CENTER' | 'EMERGENCY_DEPT' | 'IMAGING_CENTER' | 'REHABILITATION' | 'OTHER';
export type VerificationStatus = 'PENDING' | 'VERIFIED' | 'REJECTED' | 'DEMO';
export type NotificationType = 'EMERGENCY_UPDATE' | 'APPOINTMENT_UPDATE' | 'SECURITY_ALERT' | 'SYSTEM_ANNOUNCEMENT' | 'ACCOUNT_NOTIFICATION';
export type ReviewStatus = 'DRAFT' | 'PENDING_REVIEW' | 'REVIEWED' | 'PUBLISHED';
export type SuspensionType = 'WARNING' | 'TEMPORARY' | 'RESTRICTION' | 'PERMANENT_REVIEW';
export type FalseReportType = 'ACCIDENTAL' | 'INTENTIONAL' | 'UNDER_REVIEW';
export type ReportEventType = 'REPORT_CREATED' | 'TRIAGE_COMPLETED' | 'LOCATION_CONFIRMED' | 'REPORT_SUBMITTED' | 'REPORT_RECEIVED' | 'REVIEW_STARTED' | 'OPERATOR_ASSIGNED' | 'OPERATOR_ACKNOWLEDGED' | 'RESPONSE_STARTED' | 'STATUS_UPDATE' | 'OPERATOR_NOTE' | 'REPORT_RESOLVED' | 'REPORT_CANCELLED' | 'REPORT_REJECTED' | 'FALSE_REPORT_FLAGGED' | 'FALSE_REPORT_RESOLVED' | 'MEDIA_ATTACHED';

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
  relationship: string;
  phone: string;
  email?: string;
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
  description?: string;
  affected_count: number;
  additional_info?: string;
  assigned_operator_id?: string;
  is_demo: boolean;
  cancelled_at?: string;
  cancelled_reason?: string;
  resolved_at?: string;
  created_at: string;
  updated_at: string;
}

export interface EmergencyLocation {
  id: string;
  report_id: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  address?: string;
  city?: string;
  wilaya?: string;
  commune?: string;
  is_manual: boolean;
  captured_at: string;
  created_at: string;
}

export interface Doctor {
  id: string;
  user_id?: string;
  first_name: string;
  last_name: string;
  photo_url?: string;
  bio?: string;
  languages: string[];
  gender?: GenderType;
  years_experience?: number;
  consultation_type: ConsultationType;
  consultation_fee?: number;
  city?: string;
  wilaya?: string;
  address?: string;
  phone?: string;
  email?: string;
  verification_status: VerificationStatus;
  is_active: boolean;
  is_demo: boolean;
  facility_id?: string;
  rating?: number;
  rating_count: number;
  created_at: string;
  updated_at: string;
  specialties?: Specialty[];
}

export interface Specialty {
  id: string;
  name_ar: string;
  name_fr: string;
  name_en: string;
  slug: string;
  icon?: string;
  is_active: boolean;
}

export interface Appointment {
  id: string;
  user_id: string;
  doctor_id: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  consultation_type: ConsultationType;
  status: AppointmentStatus;
  reason?: string;
  notes?: string;
  is_demo: boolean;
  created_at: string;
  updated_at: string;
  doctor?: Doctor;
}

export interface HealthcareFacility {
  id: string;
  name_ar: string;
  name_fr?: string;
  name_en?: string;
  facility_type: FacilityType;
  description?: string;
  phone?: string;
  email?: string;
  website?: string;
  address: string;
  city: string;
  wilaya: string;
  latitude?: number;
  longitude?: number;
  opening_hours: Record<string, string>;
  has_emergency: boolean;
  is_active: boolean;
  verification_status: VerificationStatus;
  is_demo: boolean;
  created_at: string;
  updated_at: string;
}

export interface Pharmacy {
  id: string;
  name_ar: string;
  name_fr?: string;
  phone?: string;
  address: string;
  city: string;
  wilaya: string;
  latitude?: number;
  longitude?: number;
  opening_hours: Record<string, string>;
  is_24h: boolean;
  is_duty: boolean;
  is_active: boolean;
  is_demo: boolean;
  created_at: string;
  updated_at: string;
}

export interface Laboratory {
  id: string;
  name_ar: string;
  name_fr?: string;
  phone?: string;
  address: string;
  city: string;
  wilaya: string;
  latitude?: number;
  longitude?: number;
  opening_hours: Record<string, string>;
  services: string[];
  requires_appointment: boolean;
  is_active: boolean;
  is_demo: boolean;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  notification_type: NotificationType;
  title_ar: string;
  title_fr?: string;
  title_en?: string;
  body_ar: string;
  body_fr?: string;
  body_en?: string;
  entity_type?: string;
  entity_id?: string;
  is_read: boolean;
  read_at?: string;
  created_at: string;
}

export interface FirstAidCategory {
  id: string;
  name_ar: string;
  name_fr: string;
  name_en: string;
  slug: string;
  icon?: string;
  description_ar?: string;
  sort_order: number;
  is_active: boolean;
}

export interface FirstAidGuide {
  id: string;
  category_id: string;
  title_ar: string;
  title_fr?: string;
  title_en?: string;
  warning_ar?: string;
  warning_fr?: string;
  when_to_call_ar?: string;
  when_to_call_fr?: string;
  do_not_do_ar?: string;
  do_not_do_fr?: string;
  source?: string;
  review_status: ReviewStatus;
  reviewed_by?: string;
  reviewed_at?: string;
  version: number;
  is_active: boolean;
  steps?: FirstAidStep[];
  category?: FirstAidCategory;
}

export interface FirstAidStep {
  id: string;
  guide_id: string;
  step_number: number;
  instruction_ar: string;
  instruction_fr?: string;
  instruction_en?: string;
  image_url?: string;
}

export interface AuditLog {
  id: string;
  actor_id?: string;
  actor_role?: UserRole;
  action: string;
  entity_type?: string;
  entity_id?: string;
  metadata: Record<string, unknown>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}
