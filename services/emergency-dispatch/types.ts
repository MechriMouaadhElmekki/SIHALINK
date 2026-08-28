export interface EmergencyDispatchPayload {
  reportId: string;
  reportNumber: string;
  emergencyType: string;
  priority: string;
  location: {
    latitude: number;
    longitude: number;
    address?: string;
    city?: string;
    wilaya?: string;
  };
  description?: string;
  affectedCount: number;
  contactPhone?: string;
}

export interface EmergencyDispatchResult {
  success: boolean;
  externalReferenceId?: string;
  estimatedResponseMinutes?: number;
  message?: string;
  isSimulated: boolean;
}

export interface EmergencyDispatchProvider {
  submitEmergency(payload: EmergencyDispatchPayload): Promise<EmergencyDispatchResult>;
  updateEmergency(reportId: string, update: Partial<EmergencyDispatchPayload>): Promise<EmergencyDispatchResult>;
  cancelEmergency(reportId: string, reason: string): Promise<EmergencyDispatchResult>;
  getEmergencyStatus(reportId: string): Promise<{ status: string; isSimulated: boolean }>;
}
