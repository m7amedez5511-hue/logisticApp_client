import * as yup from "yup"
import type { NationalIdType, DriverCardType } from "../src/types/driver";

// ── Create schema ─────────────────────────────────────────────────────────────

export const createDriverSchema = yup.object({
  // Required
  name: yup
    .string()
    .required("الاسم مطلوب")
    .min(2, "الاسم يجب أن يكون حرفين على الأقل"),

  phone: yup
    .string()
    .required("رقم الجوال مطلوب")
    .matches(
      /^(\+966|966|0)?5[0-9]{8}$/,
      "رقم الجوال غير صالح — يجب أن يكون رقم سعودي صحيح",
    ),

  // Optional
  email: yup
    .string()
    .email("البريد الإلكتروني غير صالح")
    .optional(),

  address: yup
    .string()
    .min(5, "العنوان يجب أن يكون 5 أحرف على الأقل")
    .optional(),

  nationality: yup
    .string()
    .min(5, "الجنسية يجب أن تكون 5 أحرف على الأقل")
    .optional(),

  nationalIdType: yup
    .mixed<NationalIdType>()
    .oneOf(["NationalID", "Iqama", "Passport"], "نوع الهوية غير صالح")
    .optional(),

  gosiNumber: yup.string().optional(),

  licenseNumber: yup.string().optional(),

  licenseType: yup.string().optional(),

  licenseExpiry: yup
    .string()
    .test(
      "not-in-past",
      "تاريخ انتهاء الرخصة يجب أن يكون اليوم أو في المستقبل",
      (val) => {
        if (!val) return true; // optional
        return new Date(val) >= new Date(new Date().toDateString());
      },
    )
    .optional(),

  driverCardNumber: yup.string().optional(),

  driverCardType: yup
    .mixed<DriverCardType>()
    .oneOf(
      ["Temporary", "Seasonal", "Annual", "Restricted"],
      "نوع بطاقة السائق غير صالح",
    )
    .optional(),

  driverCardExpiry: yup
    .string()
    .test(
      "not-in-past",
      "تاريخ انتهاء بطاقة السائق يجب أن يكون اليوم أو في المستقبل",
      (val) => {
        if (!val) return true;
        return new Date(val) >= new Date(new Date().toDateString());
      },
    )
    .optional(),

  driverType: yup.string().optional(),

  branchId: yup
    .string()
    .uuid("معرّف الفرع غير صالح")
    .optional(),
});

// ── Update schema (same rules, all optional except they don't change) ─────────

export const updateDriverSchema = yup.object({
  name: yup
    .string()
    .min(2, "الاسم يجب أن يكون حرفين على الأقل")
    .optional(),

  phone: yup
    .string()
    .matches(
      /^(\+966|966|0)?5[0-9]{8}$/,
      "رقم الجوال غير صالح — يجب أن يكون رقم سعودي صحيح",
    )
    .optional(),

  email: yup
    .string()
    .email("البريد الإلكتروني غير صالح")
    .optional(),

  address: yup
    .string()
    .min(5, "العنوان يجب أن يكون 5 أحرف على الأقل")
    .optional(),

  nationality: yup
    .string()
    .min(5, "الجنسية يجب أن تكون 5 أحرف على الأقل")
    .optional(),

  nationalIdType: yup
    .mixed<NationalIdType>()
    .oneOf(["NationalID", "Iqama", "Passport"], "نوع الهوية غير صالح")
    .optional(),

  gosiNumber: yup.string().optional(),

  licenseNumber: yup.string().optional(),

  licenseType: yup.string().optional(),

  licenseExpiry: yup
    .string()
    .test(
      "not-in-past",
      "تاريخ انتهاء الرخصة يجب أن يكون اليوم أو في المستقبل",
      (val) => {
        if (!val) return true;
        return new Date(val) >= new Date(new Date().toDateString());
      },
    )
    .optional(),

  driverCardNumber: yup.string().optional(),

  driverCardType: yup
    .mixed<DriverCardType>()
    .oneOf(
      ["Temporary", "Seasonal", "Annual", "Restricted"],
      "نوع بطاقة السائق غير صالح",
    )
    .optional(),

  driverCardExpiry: yup
    .string()
    .test(
      "not-in-past",
      "تاريخ انتهاء بطاقة السائق يجب أن يكون اليوم أو في المستقبل",
      (val) => {
        if (!val) return true;
        return new Date(val) >= new Date(new Date().toDateString());
      },
    )
    .optional(),

  driverType: yup.string().optional(),

  branchId: yup
    .string()
    .uuid("معرّف الفرع غير صالح")
    .optional(),

  status: yup
    .mixed<"Active" | "Inactive" | "InTrip" | "Suspended">()
    .oneOf(
      ["Active", "Inactive", "InTrip", "Suspended"],
      "حالة السائق غير صالحة",
    )
    .optional(),

  reason: yup.string().optional(),
});

// ── Infer form error shape ────────────────────────────────────────────────────

export type DriverSchemaErrors = Partial<
  Record<
    | "name"
    | "phone"
    | "email"
    | "address"
    | "nationality"
    | "nationalIdType"
    | "gosiNumber"
    | "licenseNumber"
    | "licenseType"
    | "licenseExpiry"
    | "driverCardNumber"
    | "driverCardType"
    | "driverCardExpiry"
    | "driverType"
    | "branchId"
    | "status"
    | "reason",
    string
  >
>;