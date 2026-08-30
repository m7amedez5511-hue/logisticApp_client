interface DistrictEntry {
  name: string;
  streets?: string[];
  boundingBox?: { minLat: number; maxLat: number; minLng: number; maxLng: number };
}
interface CityEntry {
  name: string;
  boundingBox?: { minLat: number; maxLat: number; minLng: number; maxLng: number };
  districts: DistrictEntry[];
}
interface StateEntry {
  name: string;
  cities: CityEntry[];
}
interface CountryLocationData {
  countryCode: string;
  states: StateEntry[];
}