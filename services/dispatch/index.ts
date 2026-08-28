import type { EmergencyDispatchProvider } from './types';
import { MockEmergencyDispatchProvider } from './mock-provider';

function getDispatchProvider(): EmergencyDispatchProvider {
  const provider = process.env.EMERGENCY_DISPATCH_PROVIDER ?? 'mock';
  switch (provider) {
    case 'mock':
    default:
      return new MockEmergencyDispatchProvider();
    // Future: case 'civil_protection': return new CivilProtectionProvider();
  }
}

export const dispatchProvider = getDispatchProvider();
export type { EmergencyDispatchProvider, DispatchEmergencyInput, DispatchResult } from './types';
