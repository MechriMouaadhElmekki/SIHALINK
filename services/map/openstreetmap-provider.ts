import { MapProvider, GeocodingResult } from './types';

export class OpenStreetMapProvider implements MapProvider {
  name = 'OpenStreetMap (Nominatim)';

  async reverseGeocode(lat: number, lng: number): Promise<GeocodingResult> {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=ar,fr`,
        { headers: { 'User-Agent': 'SIHALINK/1.0' } }
      );
      if (!res.ok) return {};
      const data = await res.json();
      const addr = data.address ?? {};
      return {
        address: data.display_name,
        city: addr.city ?? addr.town ?? addr.village ?? addr.county,
        wilaya: addr.state ?? addr.county,
        commune: addr.suburb ?? addr.neighbourhood,
        formattedAddress: data.display_name,
      };
    } catch {
      return {};
    }
  }

  getStaticMapUrl(lat: number, lng: number, zoom: number = 14): string {
    // OpenStreetMap does not provide a static map API by default
    // Return a URL that can open in browser or embed via iframe
    return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}&zoom=${zoom}`;
  }
}

export function getMapProvider(): MapProvider {
  return new OpenStreetMapProvider();
}
