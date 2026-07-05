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

// ── Mirrors backend rolePremisson.validators.js ────────────────────────────

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** POST /role/{id}/permissions */
export const assignPermissionSchema = yup.object({
  permissionId: yup
    .string()
    .required("Permission ID is required")
    .matches(UUID_REGEX, "Invalid Permission ID format"),
});

/** PATCH /role/{id}/permissions/bulk */
export const bulkAssignPermissionSchema = yup.object({
  permissionIds: yup
    .array(
      yup
        .string()
        .matches(UUID_REGEX, "Each permission ID must be a valid UUID")
        .required()
    )
    .test("unique", "Permission IDs must be unique", function (arr) {
      if (!arr) return true;
      return new Set(arr).size === arr.length;
    })
    .required(),
});

export type PermissionFormErrors = Partial<Record<"permissionId" | "permissionIds", string>>;