import type { EmergencyDispatchProvider, EmergencyDispatchRequest, EmergencyDispatchResponse } from './types';

/**
 * MockEmergencyDispatchProvider
 *
 * THIS IS A SIMULATED PROVIDER FOR DEVELOPMENT AND DEMONSTRATION PURPOSES ONLY.
 * It does NOT connect to Civil Protection, ambulance services, police,
 * hospitals, or any government emergency systems.
 *
 * When a real EmergencyDispatchProvider is available (e.g., Civil Protection API),
 * replace this with a real implementation of the EmergencyDispatchProvider interface.
 */
export class MockEmergencyDispatchProvider implements EmergencyDispatchProvider {
  readonly providerName = 'MockDispatch (DEMO ONLY)';
  readonly isSimulated = true;

  async submitEmergency(request: EmergencyDispatchRequest): Promise<EmergencyDispatchResponse> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    console.log('[SIMULATED DISPATCH - NOT REAL]', {
      reportNumber: request.reportNumber,
      priority: request.priority,
      location: request.location,
    });

    return {
      success: true,
      externalId: `MOCK-${Date.now()}`,
      estimatedResponseTime: this.getSimulatedResponseTime(request.priority),
      message: '[SIMULATION] Emergency logged in demo system. NOT sent to real services.',
      isSimulated: true,
    };
  }

  async updateEmergency(externalId: string): Promise<EmergencyDispatchResponse> {
    return { success: true, externalId, isSimulated: true };
  }

  async cancelEmergency(externalId: string): Promise<EmergencyDispatchResponse> {
    return { success: true, externalId, isSimulated: true };
  }

  async getEmergencyStatus(externalId: string) {
    return { status: 'SIMULATED', isSimulated: true };
  }

  private getSimulatedResponseTime(priority: string): number {
    const times: Record<string, number> = {
      CRITICAL: 8, HIGH: 12, MEDIUM: 20, LOW: 30
    };
    return times[priority] ?? 15;
  }
}

export const emergencyDispatchProvider: EmergencyDispatchProvider = new MockEmergencyDispatchProvider();
