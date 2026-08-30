import * as yup from "yup";
import { isValidLocationChain } from "@/src/lib/locationHierarchy";

// ── Phone regex — same as backend ─────────────────────────────────────────────
const SAUDI_PHONE_RE = /^(\+966|966|0)?5[0-9]{8}$/;

// Step 1: Cross-field test shared by create/update schemas — verifies the
// selected regionId/cityId/districtId genuinely form a valid parent/child
// chain in SAUDI_LOCATION_HIERARCHY (e.g. rejects "Mohandessin"-style
// mismatches such as a district that doesn't belong to the chosen city).
// Step 2: Only runs when all three ids are present — required-ness of each
// individual field is handled by its own `.required()` rule below, so this
// test focuses purely on chain CONSISTENCY, not presence.
function locationChainTest(this: yup.TestContext): boolean {
  const { regionId, cityId, districtId } = this.parent as {
    regionId?: string;
    cityId?: string;
    districtId?: string;
  };
  if (!regionId || !cityId || !districtId) return true; // presence handled elsewhere
  return isValidLocationChain(regionId, cityId, districtId);
}

// ── Create schema ─────────────────────────────────────────────────────────────
// Mirrors branch_validator.js createBranchSchema (Zod) field-for-field, plus
// the new Region/City/District hierarchy fields.

export const createBranchSchema = yup.object({
  name: yup
    .string()
    .required("اسم الفرع مطلوب")
    .min(2, "اسم الفرع يجب أن يكون حرفين على الأقل"),

  email: yup
    .string()
    .email("البريد الإلكتروني غير صالح")
    .optional(),

  phone: yup
    .string()
    .matches(SAUDI_PHONE_RE, { message: "رقم الجوال غير صالح — يجب أن يكون رقم سعودي صحيح", excludeEmptyString: true })
    .optional(),

  country: yup
    .string()
    .optional(),

  // Step 3: Hierarchy ids — required on create. `city`/`state`/`district`
  // (free-text) stay in the schema below ONLY as derived/display fields
  // populated from the resolved hierarchy, not typed by the user anymore.
  regionId: yup
    .string()
    .required("المنطقة مطلوبة"),

  cityId: yup
    .string()
    .required("المدينة مطلوبة"),

  districtId: yup
    .string()
    .required("الحي مطلوب")
    .test(
      "location-chain-consistency",
      "الحي المختار لا يتبع المدينة/المنطقة المختارة",
      locationChainTest,
    ),

  // Step 4: Kept as plain strings — these are populated automatically from
  // the resolved RegionEntry/CityEntry/DistrictEntry names right before the
  // payload is built (see BranchFormModal submitHandler), so the API
  // contract (Branch.city / Branch.state / Branch.district as strings)
  // never changes even though the UI now drives selection via ids.
  city: yup.string().optional(),
  state: yup.string().optional(),
  district: yup.string().optional(),

  street: yup
    .string()
    .required("الشارع مطلوب"),

  buildingNo: yup
    .string()
    .optional(),

  unitNo: yup
    .string()
    .optional(),

  zipCode: yup
    .string()
    .matches(/^[0-9]{5}$/, { message: "الرمز البريدي يجب أن يتكون من 5 أرقام", excludeEmptyString: true })
    .optional(),

  // Step 5: latitude/longitude are now auto-derived from the selected
  // district (see getDistrictCoordinates) and rendered read-only in the
  // form — the range check below stays as a defensive guard in case a
  // future data-entry mistake ever puts an out-of-range value in the
  // dataset itself, not because the user can type these manually anymore.
  latitude: yup
    .string()
    .test("is-number", "خط العرض غير صالح", (v) => !v || !isNaN(Number(v)))
    .test("lat-range", "خط العرض يجب أن يكون بين -90 و 90", (v) => !v || (Number(v) >= -90 && Number(v) <= 90))
    .optional(),

  longitude: yup
    .string()
    .test("is-number", "خط الطول غير صالح", (v) => !v || !isNaN(Number(v)))
    .test("lng-range", "خط الطول يجب أن يكون بين -180 و 180", (v) => !v || (Number(v) >= -180 && Number(v) <= 180))
    .optional(),
});

// ── Update schema ─────────────────────────────────────────────────────────────
// Mirrors updateBranchSchema = createBranchSchema.partial().extend({ isActive })
// Step 6: Hierarchy ids become optional on update (a branch may be edited
// without touching its location), but IF districtId is provided, the same
// chain-consistency test still applies.

export const updateBranchSchema = yup.object({
  name: yup
    .string()
    .min(2, "اسم الفرع يجب أن يكون حرفين على الأقل")
    .optional(),

  email: yup
    .string()
    .email("البريد الإلكتروني غير صالح")
    .optional(),

  phone: yup
    .string()
    .matches(SAUDI_PHONE_RE, { message: "رقم الجوال غير صالح — يجب أن يكون رقم سعودي صحيح", excludeEmptyString: true })
    .optional(),

  country: yup
    .string()
    .optional(),

  regionId: yup.string().optional(),
  cityId: yup.string().optional(),
  districtId: yup
    .string()
    .optional()
    .test(
      "location-chain-consistency",
      "الحي المختار لا يتبع المدينة/المنطقة المختارة",
      locationChainTest,
    ),

  city: yup.string().optional(),
  state: yup.string().optional(),
  district: yup.string().optional(),

  street: yup
    .string()
    .optional(),

  buildingNo: yup
    .string()
    .optional(),

  unitNo: yup
    .string()
    .optional(),

  zipCode: yup
    .string()
    .matches(/^[0-9]{5}$/, { message: "الرمز البريدي يجب أن يتكون من 5 أرقام", excludeEmptyString: true })
    .optional(),

  latitude: yup
    .string()
    .test("is-number", "خط العرض غير صالح", (v) => !v || !isNaN(Number(v)))
    .test("lat-range", "خط العرض يجب أن يكون بين -90 و 90", (v) => !v || (Number(v) >= -90 && Number(v) <= 90))
    .optional(),

  longitude: yup
    .string()
    .test("is-number", "خط الطول غير صالح", (v) => !v || !isNaN(Number(v)))
    .test("lng-range", "خط الطول يجب أن يكون بين -180 و 180", (v) => !v || (Number(v) >= -180 && Number(v) <= 180))
    .optional(),

  isActive: yup.boolean().optional(),
});

// ── Infer form error shape ────────────────────────────────────────────────────

export type BranchSchemaErrors = Partial<
  Record<
    | "name"
    | "email"
    | "phone"
    | "country"
    | "regionId"
    | "cityId"
    | "districtId"
    | "city"
    | "state"
    | "district"
    | "street"
    | "buildingNo"
    | "unitNo"
    | "zipCode"
    | "latitude"
    | "longitude"
    | "isActive",
    string
  >
>;