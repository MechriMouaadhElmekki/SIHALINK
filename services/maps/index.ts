import type { MapProvider } from './types';
import { NominatimMapProvider } from './nominatim-provider';

function createMapProvider(): MapProvider {
  const provider = process.env.MAP_PROVIDER || 'openstreetmap';
  switch (provider) {
    // case 'mapbox': return new MapboxProvider();
    // case 'google': return new GoogleMapsProvider();
    default: return new NominatimMapProvider();
  }
}

export const mapProvider = createMapProvider();
export type { MapProvider, Coordinates } from './types';
