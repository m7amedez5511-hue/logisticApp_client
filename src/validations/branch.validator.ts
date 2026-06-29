import * as yup from "yup";

// ── Phone regex — same as backend ─────────────────────────────────────────────
const SAUDI_PHONE_RE = /^(\+966|966|0)?5[0-9]{8}$/;

// ── Create schema ─────────────────────────────────────────────────────────────
// Mirrors branch_validator.js createBranchSchema (Zod) field-for-field.

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

  city: yup
    .string()
    .required("المدينة مطلوبة"),

  state: yup
    .string()
    .optional(),

  district: yup
    .string()
    .optional(),

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
    .optional(),

  latitude: yup
    .string()
    .test("is-number", "خط العرض غير صالح", v => !v || !isNaN(Number(v)))
    .optional(),

  longitude: yup
    .string()
    .test("is-number", "خط الطول غير صالح", v => !v || !isNaN(Number(v)))
    .optional(),
});

// ── Update schema ─────────────────────────────────────────────────────────────
// Mirrors updateBranchSchema = createBranchSchema.partial().extend({ isActive })

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

  city: yup
    .string()
    .optional(),

  state: yup
    .string()
    .optional(),

  district: yup
    .string()
    .optional(),

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
    .optional(),

  latitude: yup
    .string()
    .test("is-number", "خط العرض غير صالح", v => !v || !isNaN(Number(v)))
    .optional(),

  longitude: yup
    .string()
    .test("is-number", "خط الطول غير صالح", v => !v || !isNaN(Number(v)))
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