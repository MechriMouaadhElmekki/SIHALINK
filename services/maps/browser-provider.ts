import type { MapProvider, MapLocation } from './types';

/** BrowserMapProvider - uses native browser Geolocation API */
export class BrowserMapProvider implements MapProvider {
  async getCurrentLocation(): Promise<MapLocation> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        pos => resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        }),
        err => reject(err),
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
      );
    });
  }

  async reverseGeocode(lat: number, lng: number): Promise<Partial<MapLocation>> {
    // Uses OpenStreetMap Nominatim (no API key required for reasonable usage)
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=ar`,
        { headers: { 'User-Agent': 'SIHALINK/1.0' } }
      );
      const data = await response.json();
      return {
        address: data.display_name,
        city: data.address?.city || data.address?.town || data.address?.village,
        wilaya: data.address?.state,
      };
    } catch {
      return {};
    }
  }

  getMapEmbedUrl(lat: number, lng: number): string {
    return `https://www.openstreetmap.org/export/embed.html?bbox=${lng-0.01},${lat-0.01},${lng+0.01},${lat+0.01}&layer=mapnik&marker=${lat},${lng}`;
  }
}

export const mapProvider = new BrowserMapProvider();
