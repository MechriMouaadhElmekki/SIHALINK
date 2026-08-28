export interface EmergencyDispatchRequest {
  reportId: string;
  reportNumber: string;
  emergencyType: string;
  priority: string;
  location: {
    latitude: number;
    longitude: number;
    accuracy?: number;
    address?: string;
    city?: string;
    wilaya?: string;
  };
  description?: string;
  affectedCount: number;
  triageAnswers: Record<string, string>;
  contactPhone?: string;
}

export interface EmergencyDispatchResponse {
  success: boolean;
  externalId?: string;
  estimatedResponseTime?: number;
  message?: string;
  isSimulated: boolean;
}

export interface EmergencyDispatchProvider {
  readonly providerName: string;
  readonly isSimulated: boolean;
  submitEmergency(request: EmergencyDispatchRequest): Promise<EmergencyDispatchResponse>;
  updateEmergency(externalId: string, update: Partial<EmergencyDispatchRequest>): Promise<EmergencyDispatchResponse>;
  cancelEmergency(externalId: string, reason: string): Promise<EmergencyDispatchResponse>;
  getEmergencyStatus(externalId: string): Promise<{ status: string; isSimulated: boolean }>;
}
