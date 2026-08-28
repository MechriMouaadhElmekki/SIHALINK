import { NominatimMapProvider } from './nominatim-provider';
import type { MapProvider } from './types';

function getMapProvider(): MapProvider {
  const provider = process.env.MAP_PROVIDER ?? 'openstreetmap';
  switch (provider) {
    case 'openstreetmap':
    default:
      return new NominatimMapProvider();
  }
}

export const mapProvider = getMapProvider();
export type { MapProvider, Coordinates } from './types';
