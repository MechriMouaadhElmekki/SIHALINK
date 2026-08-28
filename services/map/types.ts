// ============================================================
// SIHALINK - Map Provider Interface
// Allows Mapbox, Google Maps, or OpenStreetMap to be connected
// without changing application logic.
// ============================================================

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface MapProvider {
  reverseGeocode(coords: Coordinates): Promise<{
    address?: string;
    city?: string;
    wilaya?: string;
    commune?: string;
  }>;
  getStaticMapUrl(coords: Coordinates, zoom?: number): string;
}
