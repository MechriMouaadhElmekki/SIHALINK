import type { EmergencyDispatchProvider, EmergencyDispatchPayload, EmergencyDispatchResult } from './types';

/**
 * MockEmergencyDispatchProvider
 * 
 * ⚠️ SIMULATION ONLY - This provider simulates emergency dispatch.
 * It does NOT connect to Civil Protection, ambulance services,
 * police, hospitals, or any government emergency system.
 * 
 * Replace with a real provider when official integration credentials
 * and agreements are obtained.
 */
export class MockEmergencyDispatchProvider implements EmergencyDispatchProvider {
  async submitEmergency(payload: EmergencyDispatchPayload): Promise<EmergencyDispatchResult> {
    console.log('[MOCK DISPATCH] Emergency submitted:', payload.reportNumber);
    // Simulate network delay
    await new Promise(r => setTimeout(r, 500));
    return {
      success: true,
      externalReferenceId: `MOCK-${Date.now()}`,
      estimatedResponseMinutes: Math.floor(Math.random() * 10) + 5,
      message: 'SIMULATION: Emergency report registered in mock system. Not connected to real emergency services.',
      isSimulated: true,
    };
  }

  async updateEmergency(reportId: string): Promise<EmergencyDispatchResult> {
    console.log('[MOCK DISPATCH] Emergency updated:', reportId);
    return { success: true, message: 'SIMULATION: Update acknowledged.', isSimulated: true };
  }

  async cancelEmergency(reportId: string, reason: string): Promise<EmergencyDispatchResult> {
    console.log('[MOCK DISPATCH] Emergency cancelled:', reportId, reason);
    return { success: true, message: 'SIMULATION: Cancellation acknowledged.', isSimulated: true };
  }

  async getEmergencyStatus(reportId: string): Promise<{ status: string; isSimulated: boolean }> {
    return { status: 'MOCK_RECEIVED', isSimulated: true };
  }
}

export const emergencyDispatch = new MockEmergencyDispatchProvider();
