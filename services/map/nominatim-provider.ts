// ============================================================
// SIHALINK - OpenStreetMap/Nominatim Map Provider
// Free, no API key required for development
// ============================================================
import type { MapProvider, Coordinates } from './types';

export class NominatimMapProvider implements MapProvider {
  async reverseGeocode(coords: Coordinates) {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${coords.latitude}&lon=${coords.longitude}&format=json&accept-language=ar`,
        { headers: { 'User-Agent': 'SIHALINK/1.0' } }
      );
      const data = await res.json();
      return {
        address: data.display_name,
        city: data.address?.city || data.address?.town || data.address?.village,
        wilaya: data.address?.state,
        commune: data.address?.municipality,
      };
    } catch {
      return {};
    }
  }

  getStaticMapUrl(coords: Coordinates, zoom = 15): string {
    // OpenStreetMap tile URL pattern
    return `https://www.openstreetmap.org/?mlat=${coords.latitude}&mlon=${coords.longitude}&zoom=${zoom}`;
  }
}
