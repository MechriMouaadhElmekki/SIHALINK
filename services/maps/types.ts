export interface MapLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
  address?: string;
  city?: string;
  wilaya?: string;
}

export interface MapProvider {
  getCurrentLocation(): Promise<MapLocation>;
  reverseGeocode(lat: number, lng: number): Promise<Partial<MapLocation>>;
  getMapEmbedUrl(lat: number, lng: number): string;
}
