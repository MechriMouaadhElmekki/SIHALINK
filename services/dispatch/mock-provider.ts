// ============================================================
// SIHALINK - Mock Emergency Dispatch Provider
// ⚠️ SIMULATION ONLY - Not connected to any real emergency service
// For development and demo purposes only.
// ============================================================

import type { EmergencyDispatchProvider, DispatchEmergencyInput, DispatchResult } from './types';

export class MockEmergencyDispatchProvider implements EmergencyDispatchProvider {
  private readonly WARNING = '⚠️ SIMULATION MODE: This report has NOT been sent to any real emergency service, Civil Protection, ambulance, or government system.';

  async submitEmergency(input: DispatchEmergencyInput): Promise<DispatchResult> {
    console.warn(this.WARNING, { reportNumber: input.reportNumber });
    // Simulate async dispatch delay
    await new Promise(resolve => setTimeout(resolve, 500));
    return {
      success: true,
      dispatchId: `MOCK-${Date.now()}`,
      estimatedResponseMinutes: undefined,
      message: this.WARNING,
      isSimulated: true,
    };
  }

  async updateEmergency(dispatchId: string): Promise<DispatchResult> {
    return { success: true, dispatchId, isSimulated: true, message: this.WARNING };
  }

  async cancelEmergency(dispatchId: string): Promise<DispatchResult> {
    return { success: true, dispatchId, isSimulated: true, message: this.WARNING };
  }

  async getEmergencyStatus(dispatchId: string) {
    return { status: 'SIMULATED', isSimulated: true };
  }
}
