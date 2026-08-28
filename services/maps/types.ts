export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface MapProvider {
  readonly providerName: string;
  reverseGeocode(coords: Coordinates): Promise<{
    address?: string;
    city?: string;
    wilaya?: string;
    commune?: string;
  }>;
  getStaticMapUrl(coords: Coordinates, zoom?: number): string;
}
