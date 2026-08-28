// ============================================================
// SIHALINK - Emergency Dispatch Provider Interface
// This abstraction allows any real dispatch provider to be
// connected later without changing core application logic.
// ============================================================

export interface DispatchEmergencyInput {
  reportNumber: string;
  reportId: string;
  emergencyType: string;
  priority: string;
  location: {
    latitude: number;
    longitude: number;
    address?: string;
    city?: string;
    wilaya?: string;
  };
  triageAnswers: Array<{ question: string; answer: string }>;
  additionalInfo?: string;
  contactPhone?: string;
}

export interface DispatchResult {
  success: boolean;
  dispatchId?: string;
  estimatedResponseMinutes?: number;
  message?: string;
  isSimulated: boolean;
}

export interface EmergencyDispatchProvider {
  submitEmergency(input: DispatchEmergencyInput): Promise<DispatchResult>;
  updateEmergency(dispatchId: string, update: Partial<DispatchEmergencyInput>): Promise<DispatchResult>;
  cancelEmergency(dispatchId: string, reason: string): Promise<DispatchResult>;
  getEmergencyStatus(dispatchId: string): Promise<{ status: string; isSimulated: boolean }>;
}
