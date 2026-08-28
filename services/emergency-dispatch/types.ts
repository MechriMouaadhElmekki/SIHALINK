// ============================================================
// SIHALINK Emergency Dispatch Provider Interface
// Replace MockEmergencyDispatchProvider with real provider
// when official integration credentials are available.
// ============================================================

export interface EmergencySubmitPayload {
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
  triageAnswers: Record<string, string>;
  contactPhone?: string;
}

export interface EmergencyDispatchResult {
  success: boolean;
  dispatchId?: string;
  estimatedResponseMinutes?: number;
  message: string;
  isSimulated: boolean;
}

export interface EmergencyDispatchProvider {
  readonly providerName: string;
  readonly isSimulated: boolean;
  submitEmergency(payload: EmergencySubmitPayload): Promise<EmergencyDispatchResult>;
  updateEmergency(dispatchId: string, update: Partial<EmergencySubmitPayload>): Promise<EmergencyDispatchResult>;
  cancelEmergency(dispatchId: string, reason: string): Promise<EmergencyDispatchResult>;
  getEmergencyStatus(dispatchId: string): Promise<{ status: string; isSimulated: boolean }>;
}
