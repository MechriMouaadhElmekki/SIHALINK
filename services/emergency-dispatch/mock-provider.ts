import type { EmergencyDispatchProvider, EmergencySubmitPayload, EmergencyDispatchResult } from './types';

// ============================================================
// MOCK Emergency Dispatch Provider
// Used in development and demo mode ONLY.
// This does NOT connect to any real emergency service.
// When official Civil Protection / ambulance API credentials
// are available, implement a real provider and set
// EMERGENCY_DISPATCH_PROVIDER=civil_protection in production.
// ============================================================

export class MockEmergencyDispatchProvider implements EmergencyDispatchProvider {
  readonly providerName = 'MockEmergencyDispatchProvider';
  readonly isSimulated = true;

  async submitEmergency(payload: EmergencySubmitPayload): Promise<EmergencyDispatchResult> {
    console.log('[MOCK DISPATCH] Emergency submitted (NOT sent to real services):', payload.reportNumber);
    await this.simulateDelay();
    return {
      success: true,
      dispatchId: `MOCK-${payload.reportId}`,
      estimatedResponseMinutes: undefined,
      message: '[SIMULATION] Report received by mock dispatch system. No real emergency services have been contacted.',
      isSimulated: true,
    };
  }

  async updateEmergency(dispatchId: string, update: Partial<EmergencySubmitPayload>): Promise<EmergencyDispatchResult> {
    console.log('[MOCK DISPATCH] Update for:', dispatchId);
    await this.simulateDelay();
    return { success: true, dispatchId, message: '[SIMULATION] Update acknowledged.', isSimulated: true };
  }

  async cancelEmergency(dispatchId: string, reason: string): Promise<EmergencyDispatchResult> {
    console.log('[MOCK DISPATCH] Cancel for:', dispatchId, reason);
    await this.simulateDelay();
    return { success: true, dispatchId, message: '[SIMULATION] Cancellation acknowledged.', isSimulated: true };
  }

  async getEmergencyStatus(dispatchId: string): Promise<{ status: string; isSimulated: boolean }> {
    return { status: 'SIMULATED_RECEIVED', isSimulated: true };
  }

  private async simulateDelay(): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 500));
  }
}
