export interface LocationCoords {
  latitude: number;
  longitude: number;
  accuracy?: number;
  altitude?: number;
}

export interface MapLocation extends LocationCoords {
  address?: string;
  city?: string;
  wilaya?: string;
}

export interface MapProvider {
  readonly providerName: string;
  geocode(lat: number, lng: number): Promise<MapLocation>;
  search(query: string): Promise<MapLocation[]>;
  getMapEmbedUrl(lat: number, lng: number): string;
}

/**
 * OpenStreetMapProvider
 * Uses Nominatim for free reverse geocoding.
 * No API key required for development.
 */
export class OpenStreetMapProvider implements MapProvider {
  readonly providerName = 'OpenStreetMap/Nominatim';

  async geocode(lat: number, lng: number): Promise<MapLocation> {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=ar`,
        { headers: { 'User-Agent': 'SIHALINK/1.0' } }
      );
      const data = await res.json();
      return {
        latitude: lat,
        longitude: lng,
        address: data.display_name,
        city: data.address?.city || data.address?.town || data.address?.village,
        wilaya: data.address?.state,
      };
    } catch {
      return { latitude: lat, longitude: lng };
    }
  }

  async search(query: string): Promise<MapLocation[]> {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=dz&limit=5`,
        { headers: { 'User-Agent': 'SIHALINK/1.0' } }
      );
      const results = await res.json();
      return results.map((r: Record<string, string>) => ({
        latitude: parseFloat(r.lat),
        longitude: parseFloat(r.lon),
        address: r.display_name,
      }));
    } catch {
      return [];
    }
  }

  getMapEmbedUrl(lat: number, lng: number): string {
    return `https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.01},${lat - 0.01},${lng + 0.01},${lat + 0.01}&layer=mapnik&marker=${lat},${lng}`;
  }
}

export const mapProvider: MapProvider = new OpenStreetMapProvider();
