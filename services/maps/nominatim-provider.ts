import type { MapProvider, Coordinates } from './types';

// OpenStreetMap Nominatim - free, no API key required
export class NominatimMapProvider implements MapProvider {
  readonly providerName = 'OpenStreetMap/Nominatim';

  async reverseGeocode(coords: Coordinates) {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${coords.latitude}&lon=${coords.longitude}&format=json&accept-language=ar`,
        { headers: { 'User-Agent': 'SIHALINK/1.0 (healthcare-platform)' } }
      );
      if (!res.ok) return {};
      const data = await res.json();
      return {
        address: data.display_name,
        city: data.address?.city || data.address?.town || data.address?.village,
        wilaya: data.address?.state,
        commune: data.address?.suburb || data.address?.municipality,
      };
    } catch {
      return {};
    }
  }

  getStaticMapUrl(coords: Coordinates, zoom = 15): string {
    // Returns an OpenStreetMap tile URL for display purposes
    return `https://www.openstreetmap.org/#map=${zoom}/${coords.latitude}/${coords.longitude}`;
  }
}
