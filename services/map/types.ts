export interface MapProvider {
  name: string;
  reverseGeocode(lat: number, lng: number): Promise<GeocodingResult>;
  getStaticMapUrl(lat: number, lng: number, zoom?: number): string;
}

export interface GeocodingResult {
  address?: string;
  city?: string;
  wilaya?: string;
  commune?: string;
  formattedAddress?: string;
}
