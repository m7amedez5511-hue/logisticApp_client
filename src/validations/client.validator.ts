
import * as yup from "yup";

// ─── Saudi phone regex  ───────────────────────────
// accept: +966 5xxxxxxxx | 966 5xxxxxxxx | 05xxxxxxxx | 5xxxxxxxx
const SAUDI_PHONE_REGEX = /^(\+966|966|0)?5[0-9]{8}$/;
const SAUDI_PHONE_MSG   = "صيغة الهاتف غير صحيحة (مثال: 05xxxxxxxx)";

// ─── clientType values enums ────────────────────────────
export const CLIENT_TYPES = ["Individual", "Corporate"] as const;
export type  ClientType   = typeof CLIENT_TYPES[number];

// ─────────────────────────────────────────────────────────────────────────────
// Inferred TypeScript types
// ─────────────────────────────────────────────────────────────────────────────

// data type create fprm
export type CreateClientFormValues = yup.InferType<typeof createClientSchema>;

// data type update form
export type UpdateClientFormValues = yup.InferType<typeof updateClientSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// createClientSchema

export const createClientSchema = yup.object({
  name: yup
    .string()
    .trim()
    .required("اسم العميل مطلوب")
    .min(2, "الاسم يجب أن يكون حرفين على الأقل"),

  phone: yup
    .string()
    .trim()
    .required("رقم الهاتف مطلوب")
    .matches(SAUDI_PHONE_REGEX, SAUDI_PHONE_MSG),

  email: yup
    .string()
    .trim()
    .email("صيغة البريد الإلكتروني غير صحيحة")
    .optional()
    .transform((val) => (val === "" ? undefined : val)),

  taxId: yup
    .string()
    .trim()
    .optional()
    .transform((val) => (val === "" ? undefined : val)),

  notes: yup
    .string()
    .trim()
    .optional()
    .transform((val) => (val === "" ? undefined : val)),

  clientType: yup
    .mixed<ClientType>()
    .oneOf([...CLIENT_TYPES] as ClientType[], "نوع العميل غير صالح")
    .optional(),

  isActive: yup
    .boolean()
    .optional(),
}).required();

// ─────────────────────────────────────────────────────────────────────────────
// updateClientSchema

export const updateClientSchema = yup.object({
  name: yup
    .string()
    .trim()
    .min(2, "الاسم يجب أن يكون حرفين على الأقل")
    .optional()
    .transform((val) => (val === "" ? undefined : val)),

  phone: yup
    .string()
    .trim()
    .matches(SAUDI_PHONE_REGEX, {
      message:         SAUDI_PHONE_MSG,
      excludeEmptyString: true,
    })
    .optional()
    .transform((val) => (val === "" ? undefined : val)),

  email: yup
    .string()
    .trim()
    .email("صيغة البريد الإلكتروني غير صحيحة")
    .optional()
    .transform((val) => (val === "" ? undefined : val)),

  clientType: yup
    .mixed<ClientType>()
    .oneOf([...CLIENT_TYPES] as ClientType[], "نوع العميل غير صالح")
    .optional(),
  isActive: yup
    .boolean()
    .optional(),
}).required();