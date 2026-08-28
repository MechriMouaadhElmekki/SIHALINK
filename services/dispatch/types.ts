import { EmergencyPriority, EmergencyType, LocationData } from '@/types';

export interface DispatchSubmitPayload {
  reportId: string;
  reportNumber: string;
  emergencyType: EmergencyType;
  priority: EmergencyPriority;
  location: LocationData;
  description?: string;
  triageAnswers?: Record<string, string>;
}

export interface DispatchResult {
  success: boolean;
  dispatchId?: string;
  estimatedArrival?: string;
  message: string;
  isSimulated: boolean;
}

export interface EmergencyDispatchProvider {
  submitEmergency(payload: DispatchSubmitPayload): Promise<DispatchResult>;
  updateEmergency(reportId: string, updates: Partial<DispatchSubmitPayload>): Promise<DispatchResult>;
  cancelEmergency(reportId: string, reason: string): Promise<DispatchResult>;
  getEmergencyStatus(reportId: string): Promise<{ status: string; isSimulated: boolean }>;
}
