// Compatibility shim — canonical implementation is in services/maps/
// Any import from '@/services/map' resolves here and is forwarded.
export { mapProvider } from '../maps';
export type { MapProvider, Coordinates } from '../maps';
