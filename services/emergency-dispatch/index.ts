import type { EmergencyDispatchProvider } from './types';
import { MockEmergencyDispatchProvider } from './mock-provider';

function createDispatchProvider(): EmergencyDispatchProvider {
  const provider = process.env.EMERGENCY_DISPATCH_PROVIDER || 'mock';

  switch (provider) {
    case 'mock':
    default:
      return new MockEmergencyDispatchProvider();
    // case 'civil_protection':
    //   return new CivilProtectionProvider(); // Add when credentials available
  }
}

export const emergencyDispatch = createDispatchProvider();
export type { EmergencyDispatchProvider, EmergencySubmitPayload, EmergencyDispatchResult } from './types';
