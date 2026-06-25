import * as yup from "yup";

// ─── Saudi phone regex ───────────────────────────
const SAUDI_PHONE_REGEX = /^(\+966|966|0)?5[0-9]{8}$/;
const SAUDI_PHONE_MSG   = "صيغة الهاتف غير صحيحة (مثال: 05xxxxxxxx)";

// ─────────────────────────────────────────────────────────────────────────────
// Inferred TypeScript types
// ─────────────────────────────────────────────────────────────────────────────
export type CreateAddressFormValues = yup.InferType<typeof createAddressSchema>;
export type UpdateAddressFormValues = yup.InferType<typeof updateAddressSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// Sub-schemas (shared between create & update)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * contactPersonSchema 

 */
const contactPersonSchema = yup.object({
  name: yup
    .string()
    .trim()
    .optional()
    .transform((v) => (v === "" ? undefined : v)),

  phone: yup
    .string()
    .trim()
    .matches(SAUDI_PHONE_REGEX, {
      message:            SAUDI_PHONE_MSG,
      excludeEmptyString: true, 
    })
    .optional()
    .transform((v) => (v === "" ? undefined : v)),
}).optional();

/**
 * detailsCreateSchema 
 
 */
const detailsCreateSchema = yup.object({
  country: yup
    .string()
    .trim()
    .optional()
    .default("SA"), 

  city: yup
    .string()
    .trim()
    .required("المدينة مطلوبة"),

  state: yup
    .string()
    .trim()
    .optional()
    .transform((v) => (v === "" ? undefined : v)),

  district: yup
    .string()
    .trim()
    .optional()
    .transform((v) => (v === "" ? undefined : v)),

  street: yup
    .string()
    .trim()
    .required("الشارع / العنوان التفصيلي مطلوب"),

  buildingNo: yup
    .string()
    .trim()
    .optional()
    .transform((v) => (v === "" ? undefined : v)),

  unitNo: yup
    .string()
    .trim()
    .optional()
    .transform((v) => (v === "" ? undefined : v)),

  additionalNo: yup
    .string()
    .trim()
    .optional()
    .transform((v) => (v === "" ? undefined : v)),

  zipCode: yup
    .string()
    .trim()
    .optional()
    .transform((v) => (v === "" ? undefined : v)),

  apartment: yup
    .string()
    .trim()
    .optional()
    .transform((v) => (v === "" ? undefined : v)),
}).required();

/**
 * detailsUpdateSchema 
 */
const detailsUpdateSchema = yup.object({
  country:     yup.string().trim().optional().transform((v) => (v === "" ? undefined : v)),
  city:        yup.string().trim().optional().transform((v) => (v === "" ? undefined : v)),
  state:       yup.string().trim().optional().transform((v) => (v === "" ? undefined : v)),
  district:    yup.string().trim().optional().transform((v) => (v === "" ? undefined : v)),
  street:      yup.string().trim().optional().transform((v) => (v === "" ? undefined : v)),
  buildingNo:  yup.string().trim().optional().transform((v) => (v === "" ? undefined : v)),
  unitNo:      yup.string().trim().optional().transform((v) => (v === "" ? undefined : v)),
  additionalNo:yup.string().trim().optional().transform((v) => (v === "" ? undefined : v)),
  zipCode:     yup.string().trim().optional().transform((v) => (v === "" ? undefined : v)),
  apartment:   yup.string().trim().optional().transform((v) => (v === "" ? undefined : v)),
}).optional();

/**
 * locationCreateSchema 
 */
const locationCreateSchema = yup.object({
  coordinates: yup
    .array()
    .of(yup.number().required())
    .length(2, "الإحداثيات يجب أن تكون [خط الطول، خط العرض]")
    .required("إحداثيات الموقع مطلوبة"),
}).required();

/**
 * locationUpdateSchema
 */
const locationUpdateSchema = yup.object({
  coordinates: yup
    .array()
    .of(yup.number().required())
    .length(2, "الإحداثيات يجب أن تكون [خط الطول، خط العرض]")
    .optional(),
}).optional();

// ─────────────────────────────────────────────────────────────────────────────
// createAddressSchema

// ─────────────────────────────────────────────────────────────────────────────
export const createAddressSchema = yup.object({
  label: yup
    .string()
    .trim()
    .optional()
    .default("General"),

  branchName: yup
    .string()
    .trim()
    .nullable()
    .optional()
    .transform((v) => (v === "" ? null : v)),

  contactPerson: contactPersonSchema,

  details: detailsCreateSchema,

  location: locationCreateSchema,

  
  isPrimary: yup
    .boolean()
    .optional()
    .default(false),
}).required();

// ─────────────────────────────────────────────────────────────────────────────
// updateAddressSchema
// ─────────────────────────────────────────────────────────────────────────────
export const updateAddressSchema = yup.object({
  label: yup
    .string()
    .trim()
    .optional()
    .transform((v) => (v === "" ? undefined : v)),

  branchName: yup
    .string()
    .trim()
    .nullable()
    .optional()
    .transform((v) => (v === "" ? null : v)),

  contactPerson: contactPersonSchema,

  details: detailsUpdateSchema,

  location: locationUpdateSchema,

  // isValidated — backend-only field،
  isValidated: yup
    .boolean()
    .optional(),

  // isPrimary — frontend-only
  isPrimary: yup
    .boolean()
    .optional(),
}).required();