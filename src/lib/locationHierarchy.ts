// Step 1: Pure lookup helpers over SAUDI_LOCATION_HIERARCHY. No side
// effects, no fetch — the dataset is static and imported directly, so
// these functions are safe to call from both client components and the
// yup validation schema (see src/validations/branch.validator.ts).

import { SAUDI_LOCATION_HIERARCHY } from "@/src/data/saudiLocationHierarchy";
import { RegionEntry, CityEntry, DistrictEntry, ResolvedLocation  } from "../data/location";


// Step 2: Return every region — used to populate the first dropdown.
export function getRegions(): RegionEntry[] {
  return SAUDI_LOCATION_HIERARCHY;
}

// Step 3: Return the cities that belong to a given region id. Returns an
// empty array (not undefined) when the region id is unknown, so callers
// can render an empty <Select> safely without extra null checks.
export function getCitiesByRegion(regionId: string | undefined | null): CityEntry[] {
  if (!regionId) return [];
  const region = SAUDI_LOCATION_HIERARCHY.find((r) => r.id === regionId);
  return region?.cities ?? [];
}

// Step 4: Return the districts that belong to a given city id, scoped to
// its parent region id (prevents accidentally resolving a city id that
// exists twice under two different regions — not currently possible with
// this dataset, but kept as a safety net for future data entry mistakes).
export function getDistrictsByCity(
  regionId: string | undefined | null,
  cityId: string | undefined | null,
): DistrictEntry[] {
  if (!regionId || !cityId) return [];
  const city = getCitiesByRegion(regionId).find((c) => c.id === cityId);
  return city?.districts ?? [];
}

// Step 5: Resolve a full Region -> City -> District selection into a flat
// object with display names + auto-derived coordinates. Returns null if
// any part of the chain doesn't actually match (this is the core
// consistency check: a district id must genuinely belong to the given
// city id, which must genuinely belong to the given region id).
export function resolveLocation(
  regionId: string | undefined | null,
  cityId: string | undefined | null,
  districtId: string | undefined | null,
): ResolvedLocation | null {
  if (!regionId || !cityId || !districtId) return null;

  const region = SAUDI_LOCATION_HIERARCHY.find((r) => r.id === regionId);
  if (!region) return null;

  const city = region.cities.find((c) => c.id === cityId);
  if (!city) return null;

  const district = city.districts.find((d) => d.id === districtId);
  if (!district) return null;

  return {
    regionId: region.id,
    regionName: region.name,
    cityId: city.id,
    cityName: city.name,
    districtId: district.id,
    districtName: district.name,
    latitude: district.latitude,
    longitude: district.longitude,
  };
}

// Step 6: Convenience boolean wrapper around resolveLocation — used inside
// the yup `.test()` cross-field validator.
export function isValidLocationChain(
  regionId: string | undefined | null,
  cityId: string | undefined | null,
  districtId: string | undefined | null,
): boolean {
  return resolveLocation(regionId, cityId, districtId) !== null;
}

// Step 7: Look up a district's coordinates directly, used to auto-fill
// latitude/longitude the moment a district is selected in the form.
export function getDistrictCoordinates(
  regionId: string | undefined | null,
  cityId: string | undefined | null,
  districtId: string | undefined | null,
): { latitude: number; longitude: number } | null {
  const resolved = resolveLocation(regionId, cityId, districtId);
  if (!resolved) return null;
  return { latitude: resolved.latitude, longitude: resolved.longitude };
}

// Step 8: Handle the "edit mode with a legacy/unknown value" case — given
// a district NAME coming back from the API (not an id, since the backend
// stores display strings today per Branch/BranchDetail), try to find a
// matching region/city/district id triplet in the current dataset. If no
// match is found, the caller should treat the stored value as a legacy
// value and prompt the user to reselect (see BranchFormModal Step 4).
export function findLocationByNames(
  regionName?: string | null,
  cityName?: string | null,
  districtName?: string | null,
): ResolvedLocation | null {
  if (!regionName || !cityName || !districtName) return null;

  for (const region of SAUDI_LOCATION_HIERARCHY) {
    if (region.name !== regionName) continue;
    for (const city of region.cities) {
      if (city.name !== cityName) continue;
      for (const district of city.districts) {
        if (district.name !== districtName) continue;
        return {
          regionId: region.id,
          regionName: region.name,
          cityId: city.id,
          cityName: city.name,
          districtId: district.id,
          districtName: district.name,
          latitude: district.latitude,
          longitude: district.longitude,
        };
      }
    }
  }
  return null;
}