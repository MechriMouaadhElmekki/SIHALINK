import type { EmergencyReport } from '@/types/database';

export interface DispatchResult {
  success: boolean;
  externalId?: string;
  message: string;
  simulatedAt?: string;
}

export interface EmergencyDispatchProvider {
  submitEmergency(report: EmergencyReport): Promise<DispatchResult>;
  updateEmergency(externalId: string, update: Partial<EmergencyReport>): Promise<DispatchResult>;
  cancelEmergency(externalId: string, reason: string): Promise<DispatchResult>;
  getEmergencyStatus(externalId: string): Promise<{ status: string; message: string }>;
}
