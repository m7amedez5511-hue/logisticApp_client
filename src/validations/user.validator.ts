import * as yup from "yup";

// ── Phone regex — same as backend ─────────────────────────────────────────────
const SAUDI_PHONE_RE = /^(\+966|966|0)?5[0-9]{8}$/;

// ── Create schema ─────────────────────────────────────────────────────────────

export const createUserSchema = yup.object({
  name: yup
    .string()
    .required("الاسم الكامل مطلوب")
    .min(2, "الاسم يجب أن يكون حرفين على الأقل"),

  phone: yup
    .string()
    .required("رقم الهاتف مطلوب")
    .matches(SAUDI_PHONE_RE, "رقم الجوال غير صالح — يجب أن يكون رقم سعودي صحيح"),

  email: yup
    .string()
    .email("البريد الإلكتروني غير صالح")
    .optional(),

  password: yup
    .string()
    .required("كلمة المرور مطلوبة")
    .min(8, "كلمة المرور يجب أن تكون 8 أحرف على الأقل"),

  roleId: yup
    .string()
    .required("الدور مطلوب")
    .uuid("معرّف الدور غير صالح"),

  branchId: yup
    .string()
    .uuid("معرّف الفرع غير صالح")
    .optional(),
});

// ── Update schema ─────────────────────────────────────────────────────────────

export const updateUserSchema = yup.object({
  name: yup
    .string()
    .min(2, "الاسم يجب أن يكون حرفين على الأقل")
    .optional(),

  phone: yup
    .string()
    .matches(SAUDI_PHONE_RE, "رقم الجوال غير صالح — يجب أن يكون رقم سعودي صحيح")
    .optional(),

  email: yup
    .string()
    .email("البريد الإلكتروني غير صالح")
    .optional(),

  // password is optional on update — only sent if user wants to change it
  password: yup
    .string()
    .min(8, "كلمة المرور يجب أن تكون 8 أحرف على الأقل")
    .optional(),

  isActive: yup.boolean().optional(),

  roleId: yup
    .string()
    .uuid("معرّف الدور غير صالح")
    .optional(),

  branchId: yup
    .string()
    .uuid("معرّف الفرع غير صالح")
    .optional(),
});

// ── Infer form error shape ────────────────────────────────────────────────────

export type UserSchemaErrors = Partial<
  Record<
    | "name"
    | "phone"
    | "email"
    | "password"
    | "roleId"
    | "branchId"
    | "isActive",
    string
  >
>;