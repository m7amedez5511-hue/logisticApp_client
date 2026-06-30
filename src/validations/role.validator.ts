import * as yup from "yup";

export const createRoleSchema = yup.object({
  name: yup
    .string()
    .required("اسم الدور مطلوب")
    .min(2, "الاسم يجب أن يكون حرفين على الأقل"),
  description: yup
    .string()
    .min(5, "الوصف يجب أن يكون 5 أحرف على الأقل")
    .optional(),
  permissionIds: yup.array(yup.string().required()).default([]),
});

export const updateRoleSchema = yup.object({
  name: yup
    .string()
    .required("اسم الدور مطلوب")
    .min(2, "الاسم يجب أن يكون حرفين على الأقل"),
  description: yup
    .string()
    .min(5, "الوصف يجب أن يكون 5 أحرف على الأقل")
    .optional(),
  isActive: yup.boolean().optional(),
  permissionIds: yup.array(yup.string().required()).default([]),
});

export type RoleFormErrors = Partial<Record<"name" | "description", string>>;