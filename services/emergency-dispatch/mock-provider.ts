import type { EmergencyDispatchProvider, DispatchResult } from './interface';
import type { EmergencyReport } from '@/types/database';

/**
 * MockEmergencyDispatchProvider
 * 
 * DEMO/DEVELOPMENT MODE ONLY.
 * This provider simulates emergency dispatch WITHOUT connecting to any
 * real emergency service, government system, Civil Protection, ambulance,
 * police, or hospital.
 *
 * All responses are simulated. No real emergency is dispatched.
 * Replace this with a real provider when official credentials are obtained.
 */
export class MockEmergencyDispatchProvider implements EmergencyDispatchProvider {
  private readonly SIMULATION_LABEL = '[SIMULATION - No real dispatch]';

  async submitEmergency(report: EmergencyReport): Promise<DispatchResult> {
    console.log(`${this.SIMULATION_LABEL} submitEmergency called for report ${report.report_number}`);
    await this.simulateDelay(500);
    return {
      success: true,
      externalId: `MOCK-${Date.now()}`,
      message: this.SIMULATION_LABEL,
      simulatedAt: new Date().toISOString(),
    };
  }

  async updateEmergency(externalId: string, _update: Partial<EmergencyReport>): Promise<DispatchResult> {
    console.log(`${this.SIMULATION_LABEL} updateEmergency called for ${externalId}`);
    await this.simulateDelay(200);
    return { success: true, externalId, message: this.SIMULATION_LABEL };
  }

  async cancelEmergency(externalId: string, reason: string): Promise<DispatchResult> {
    console.log(`${this.SIMULATION_LABEL} cancelEmergency called for ${externalId}: ${reason}`);
    await this.simulateDelay(200);
    return { success: true, externalId, message: this.SIMULATION_LABEL };
  }

  async getEmergencyStatus(externalId: string): Promise<{ status: string; message: string }> {
    return { status: 'SIMULATED', message: `${this.SIMULATION_LABEL} for ${externalId}` };
  }

  private simulateDelay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const emergencyDispatchProvider = new MockEmergencyDispatchProvider();
