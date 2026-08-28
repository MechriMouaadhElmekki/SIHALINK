import { EmergencyDispatchProvider, DispatchSubmitPayload, DispatchResult } from './types';

/**
 * MockEmergencyDispatchProvider
 *
 * IMPORTANT: This is a SIMULATED provider for demo/development use ONLY.
 * It does NOT connect to Civil Protection, ambulance services, police,
 * hospitals, or any government emergency system.
 *
 * When official integration credentials are available, implement a real
 * provider that satisfies the EmergencyDispatchProvider interface.
 */
export class MockEmergencyDispatchProvider implements EmergencyDispatchProvider {
  private readonly SIMULATED_DELAY_MS = 1200;

  private delay(): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, this.SIMULATED_DELAY_MS));
  }

  async submitEmergency(payload: DispatchSubmitPayload): Promise<DispatchResult> {
    await this.delay();
    console.log('[MOCK DISPATCH] Emergency submitted (SIMULATED - NOT REAL):', payload.reportNumber);
    return {
      success: true,
      dispatchId: `MOCK-${Date.now()}`,
      message: '[SIMULATION] Emergency report logged in demo system. Not dispatched to real services.',
      isSimulated: true,
    };
  }

  async updateEmergency(reportId: string): Promise<DispatchResult> {
    await this.delay();
    return { success: true, message: '[SIMULATION] Update logged.', isSimulated: true };
  }

  async cancelEmergency(reportId: string, reason: string): Promise<DispatchResult> {
    await this.delay();
    console.log('[MOCK DISPATCH] Emergency cancelled (SIMULATED):', reportId, reason);
    return { success: true, message: '[SIMULATION] Cancellation logged.', isSimulated: true };
  }

  async getEmergencyStatus(reportId: string): Promise<{ status: string; isSimulated: boolean }> {
    return { status: 'SIMULATED_RECEIVED', isSimulated: true };
  }
}

export function getDispatchProvider(): EmergencyDispatchProvider {
  // In production, check process.env.EMERGENCY_DISPATCH_PROVIDER
  // and return the appropriate real provider
  return new MockEmergencyDispatchProvider();
}
