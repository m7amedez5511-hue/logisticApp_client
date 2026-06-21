import * as yup from "yup";

// ── Enums (mirror backend) ────────────────────────────────────────────────────
const INSURANCE_STATUSES  = ["Valid", "Expired", "NotInsured"] as const;
const CAR_STATUSES        = ["Active", "InMaintenance", "InTrip", "Inactive"] as const;
const IMPOUND_STATUSES    = ["None", "Impounded"] as const;
const IMAGE_STAGES        = ["BEFORE", "AFTER", "GENERAL"] as const;

// ── Shared date helper ────────────────────────────────────────────────────────
// <input type="date"> gives "YYYY-MM-DD"; validate as a real date string
const dateString = yup
  .string()
  .test(
    "valid-date",
    "تاريخ غير صالح",
    (val) => {
      if (!val) return true; // optional
      return !isNaN(Date.parse(val));
    },
  )
  ;

// ── Create schema ─────────────────────────────────────────────────────────────

export const createCarSchema = yup.object({
  // Required
  manufacturer: yup
    .string()
    .required("الشركة المصنعة مطلوبة")
    .min(2, "اسم الشركة يجب أن يكون حرفين على الأقل"),

  model: yup
    .string()
    .required("الموديل مطلوب")
    .min(1, "الموديل مطلوب"),

  year: yup
    .number()
    .typeError("سنة الصنع يجب أن تكون رقماً")
    .required("سنة الصنع مطلوبة")
    .integer("سنة الصنع يجب أن تكون رقماً صحيحاً")
    .min(1900, "سنة الصنع غير صالحة")
    .max(new Date().getFullYear() + 1, "سنة الصنع غير صالحة"),

  plateNumber: yup
    .string()
    .required("رقم اللوحة مطلوب")
    .min(1, "رقم اللوحة مطلوب"),

  plateLetters: yup
    .string()
    .required("حروف اللوحة مطلوبة")
    .min(1, "حروف اللوحة مطلوبة"),

    registrationNumber: yup.string().required("رقم التسجيل مطلوب ").min(4,"رقم التسجيل لا يقل عن 4 ارقام"),
    
    vinNumber: yup.string().required(" رقم الهيكل مطلوب").min(4,"رقم الهيكل لا يقل عن 4 ارقام"),
  // Optional
  color: yup.string().optional(),

  plateType: yup.string().optional(),



  ownerNationalId: yup.string().optional(),

  branchId: yup
    .string()
    .uuid("معرّف الفرع غير صالح")
    .optional(),

  currentStatus: yup
    .mixed<typeof CAR_STATUSES[number]>()
    .oneOf([...CAR_STATUSES], "حالة المركبة غير صالحة")
    .optional(),

  insuranceStatus: yup
    .mixed<typeof INSURANCE_STATUSES[number]>()
    .oneOf([...INSURANCE_STATUSES], "حالة التأمين غير صالحة")
    .optional(),

  currentImpoundStatus: yup
    .mixed<typeof IMPOUND_STATUSES[number]>()
    .oneOf([...IMPOUND_STATUSES], "حالة الحجز غير صالحة")
    .optional(),

  registrationExpiryDate: dateString,
  insuranceExpiryDate:    dateString,
  inspectionExpiryDate:   dateString,
  operationCardExpiry:    dateString,
  registrationIssueDate:  dateString,
  ownershipStartDate:     dateString,
  actualUserStartDate:    dateString,

  gpsDeviceId:         yup.string().optional(),
  operationCardNumber: yup.string().optional(),

  capacity: yup
    .number()
    .typeError("الطاقة الاستيعابية يجب أن تكون رقماً")
    .integer("الطاقة الاستيعابية يجب أن تكون رقماً صحيحاً")
    .min(0, "الطاقة الاستيعابية يجب أن تكون 0 أو أكثر")
    .optional(),

  weight: yup
    .number()
    .typeError("الوزن يجب أن يكون رقماً")
    .integer("الوزن يجب أن يكون رقماً صحيحاً")
    .min(0, "الوزن يجب أن يكون 0 أو أكثر")
    .optional(),
});

// ── Update schema (all optional except enums still validated) ─────────────────

export const updateCarSchema = yup.object({
  manufacturer: yup
    .string()
    .min(2, "اسم الشركة يجب أن يكون حرفين على الأقل")
    .optional(),

  model: yup.string().optional(),

  year: yup
    .number()
    .typeError("سنة الصنع يجب أن تكون رقماً")
    .integer("سنة الصنع يجب أن تكون رقماً صحيحاً")
    .min(1900, "سنة الصنع غير صالحة")
    .max(new Date().getFullYear() + 1, "سنة الصنع غير صالحة")
    .optional(),

  plateNumber:  yup.string().optional(),
  plateLetters: yup.string().optional(),
  color:        yup.string().optional(),
  plateType:    yup.string().optional(),

  registrationNumber: yup.string().optional(),
  vinNumber:          yup.string().optional(),
  ownerNationalId:    yup.string().optional(),

  branchId: yup
    .string()
    .uuid("معرّف الفرع غير صالح")
    .optional(),

  currentStatus: yup
    .mixed<typeof CAR_STATUSES[number]>()
    .oneOf([...CAR_STATUSES], "حالة المركبة غير صالحة")
    .optional(),

  insuranceStatus: yup
    .mixed<typeof INSURANCE_STATUSES[number]>()
    .oneOf([...INSURANCE_STATUSES], "حالة التأمين غير صالحة")
    .optional(),

  currentImpoundStatus: yup
    .mixed<typeof IMPOUND_STATUSES[number]>()
    .oneOf([...IMPOUND_STATUSES], "حالة الحجز غير صالحة")
    .optional(),

  isActive: yup.boolean().optional(),

  registrationExpiryDate: dateString,
  insuranceExpiryDate:    dateString,
  inspectionExpiryDate:   dateString,
  operationCardExpiry:    dateString,
  registrationIssueDate:  dateString,
  ownershipStartDate:     dateString,
  actualUserStartDate:    dateString,

  gpsDeviceId:         yup.string().optional(),
  operationCardNumber: yup.string().optional(),

  capacity: yup
    .number()
    .typeError("الطاقة الاستيعابية يجب أن تكون رقماً")
    .integer("الطاقة الاستيعابية يجب أن تكون رقماً صحيحاً")
    .min(0, "الطاقة الاستيعابية يجب أن تكون 0 أو أكثر")
    .optional(),

  weight: yup
    .number()
    .typeError("الوزن يجب أن يكون رقماً")
    .integer("الوزن يجب أن يكون رقماً صحيحاً")
    .min(0, "الوزن يجب أن يكون 0 أو أكثر")
    .optional(),
});

// ── Car image schema (from carImage.validator.js) ─────────────────────────────

export const addCarImagesSchema = yup.object({
  stage: yup
    .mixed<typeof IMAGE_STAGES[number]>()
    .oneOf([...IMAGE_STAGES], "مرحلة الصورة غير صالحة")
    .optional(),

  maintenanceId: yup
    .string()
    .uuid("معرّف الصيانة غير صالح")
    .optional(),
});

// ── Infer form error shape ────────────────────────────────────────────────────

export type CarSchemaErrors = Partial<
  Record<
    | "manufacturer"
    | "model"
    | "year"
    | "color"
    | "plateNumber"
    | "plateLetters"
    | "plateType"
    | "registrationNumber"
    | "vinNumber"
    | "ownerNationalId"
    | "branchId"
    | "currentStatus"
    | "insuranceStatus"
    | "currentImpoundStatus"
    | "isActive"
    | "registrationExpiryDate"
    | "insuranceExpiryDate"
    | "inspectionExpiryDate"
    | "operationCardExpiry"
    | "registrationIssueDate"
    | "ownershipStartDate"
    | "actualUserStartDate"
    | "gpsDeviceId"
    | "operationCardNumber"
    | "capacity"
    | "weight"
    | "stage"
    | "maintenanceId",
    string
  >
>;