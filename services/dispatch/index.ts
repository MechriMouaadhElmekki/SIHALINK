// Compatibility shim — canonical implementation is in services/emergency-dispatch/
// Any import from '@/services/dispatch' resolves here and is forwarded.
export { emergencyDispatch } from '../emergency-dispatch';
export type {
  EmergencyDispatchProvider,
  EmergencyDispatchPayload,
  EmergencyDispatchResult,
} from '../emergency-dispatch';
