// src/types/location.ts
//
// Step 1: Define the Parent/Child hierarchy for Saudi administrative
// locations: Region (المنطقة) -> City (المدينة) -> District (الحي).
// Step 2: Each District carries its own fixed latitude/longitude, so once
// a district is selected in the form, coordinates are derived automatically
// instead of being typed manually by the user.
// Step 3: Keep this file dependency-free (no imports) so it can be safely
// imported from both client components and validation schemas.

export interface DistrictEntry {
  // Step 1: Stable id used as the <option value> and for lookups.
  id: string;
  // Step 2: Arabic display name (primary language of the UI).
  name: string;
  // Step 3: Optional English name, useful for search/debugging/logs.
  nameEn?: string;
  // Step 4: Approximate center point of the district — used to
  // auto-populate latitude/longitude once the district is chosen.
  latitude: number;
  longitude: number;
  // Step 5: Optional list of known streets for this district. Left empty
  // means the UI falls back to a free-text street input.
  streets?: string[];
}

export interface CityEntry {
  id: string;
  name: string;
  nameEn?: string;
  // Step 6: A city always belongs to exactly one region (enforced by the
  // dataset's nesting, not by a back-reference field, to avoid drift).
  districts: DistrictEntry[];
}

export interface RegionEntry {
  id: string;
  name: string;
  nameEn?: string;
  cities: CityEntry[];
}

// Step 7: Flat, resolved shape returned by lookup helpers — convenient for
// building the branch payload and for pre-filling the form on edit.
export interface ResolvedLocation {
  regionId: string;
  regionName: string;
  cityId: string;
  cityName: string;
  districtId: string;
  districtName: string;
  latitude: number;
  longitude: number;
}