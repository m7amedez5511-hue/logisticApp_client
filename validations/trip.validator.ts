import * as yup from "yup";
import type { TripStatus } from "@/types/trip";

const TRIP_STATUSES: TripStatus[] = [
  "Scheduled",
  "InProgress",
  "Completed",
  "Cancelled",
];

// NOTE: Unlike driver_validator.ts, there is no actual backend trip validator
// file in this handoff. The rules below come from trip_api_reference.html
// (marked "// doc") plus a few sensible defaults that are NOT explicitly
// stated in the reference (marked "// inferred"). Verify the "inferred" ones
// against the real backend validator before relying on them.

// ── Create schema ─────────────────────────────────────────────────────────────

export const createTripSchema = yup.object({
  // Required
  title: yup
    .string()
    .required("عنوان الرحلة مطلوب")
    .min(3, "عنوان الرحلة يجب أن يكون 3 أحرف على الأقل"), // doc

  driverId: yup
    .string()
    .required("السائق مطلوب")
    .uuid("معرّف السائق غير صالح"), // doc: UUID, driver must be status=Active (enforced server-side)

  carId: yup
    .string()
    .required("السيارة مطلوبة")
    .uuid("معرّف السيارة غير صالح"), // doc: UUID, car must be status=Active (enforced server-side)

  // Optional
  startTime: yup.string().optional(), // doc: ISO 8601, default now()

  endTime: yup
    .string()
    .optional()
    .test(
      "after-start",
      "وقت الانتهاء يجب أن يكون بعد وقت البدء",
      function (val) {
        if (!val) return true;
        const { startTime } = this.parent;
        if (!startTime) return true;
        return new Date(val) > new Date(startTime); // inferred
      },
    ),

  branchId: yup.string().uuid("معرّف الفرع غير صالح").optional(), // doc

  status: yup
    .mixed<TripStatus>()
    .oneOf(TRIP_STATUSES, "حالة الرحلة غير صالحة")
    .optional(), // doc: default Scheduled

  collectedCount: yup
    .number()
    .typeError("القيمة يجب أن تكون رقم")
    .integer("القيمة يجب أن تكون رقم صحيح")
    .min(0, "القيمة لا يمكن أن تكون سالبة") // inferred
    .optional(),

  deliveredCount: yup
    .number()
    .typeError("القيمة يجب أن تكون رقم")
    .integer("القيمة يجب أن تكون رقم صحيح")
    .min(0, "القيمة لا يمكن أن تكون سالبة") // inferred
    .optional(),

  returnedCount: yup
    .number()
    .typeError("القيمة يجب أن تكون رقم")
    .integer("القيمة يجب أن تكون رقم صحيح")
    .min(0, "القيمة لا يمكن أن تكون سالبة") // inferred
    .optional(),

  totalCashCollected: yup
    .number()
    .typeError("القيمة يجب أن تكون رقم")
    .min(0, "القيمة لا يمكن أن تكون سالبة") // inferred
    .optional(), // doc: number | string -> Decimal server-side

  notes: yup
    .string()
    .min(2, "الملاحظات يجب أن تكون حرفين على الأقل") // doc
    .optional(),

  endReason: yup
    .string()
    .min(2, "سبب الانتهاء يجب أن يكون حرفين على الأقل") // doc
    .optional(),
});

// ── Update schema (same rules, all optional + reason) ─────────────────────────

export const updateTripSchema = yup.object({
  title: yup
    .string()
    .min(3, "عنوان الرحلة يجب أن يكون 3 أحرف على الأقل")
    .optional(),

  driverId: yup.string().uuid("معرّف السائق غير صالح").optional(), // doc: must be Active

  carId: yup.string().uuid("معرّف السيارة غير صالح").optional(), // doc: must be Active

  status: yup
    .mixed<TripStatus>()
    .oneOf(TRIP_STATUSES, "حالة الرحلة غير صالحة")
    .optional(),

  startTime: yup.string().optional(),

  endTime: yup
    .string()
    .optional()
    .test(
      "after-start",
      "وقت الانتهاء يجب أن يكون بعد وقت البدء",
      function (val) {
        if (!val) return true;
        const { startTime } = this.parent;
        if (!startTime) return true;
        return new Date(val) > new Date(startTime); // inferred
      },
    ),

  branchId: yup.string().uuid("معرّف الفرع غير صالح").optional(),

  collectedCount: yup
    .number()
    .typeError("القيمة يجب أن تكون رقم")
    .integer("القيمة يجب أن تكون رقم صحيح")
    .min(0, "القيمة لا يمكن أن تكون سالبة")
    .optional(),

  deliveredCount: yup
    .number()
    .typeError("القيمة يجب أن تكون رقم")
    .integer("القيمة يجب أن تكون رقم صحيح")
    .min(0, "القيمة لا يمكن أن تكون سالبة")
    .optional(),

  returnedCount: yup
    .number()
    .typeError("القيمة يجب أن تكون رقم")
    .integer("القيمة يجب أن تكون رقم صحيح")
    .min(0, "القيمة لا يمكن أن تكون سالبة")
    .optional(),

  totalCashCollected: yup
    .number()
    .typeError("القيمة يجب أن تكون رقم")
    .min(0, "القيمة لا يمكن أن تكون سالبة")
    .optional(),

  notes: yup
    .string()
    .min(2, "الملاحظات يجب أن تكون حرفين على الأقل")
    .optional(),

  endReason: yup
    .string()
    .min(2, "سبب الانتهاء يجب أن يكون حرفين على الأقل")
    .optional(),

  // Update-only: reason for reassigning driver/car (recorded in history)
  reason: yup.string().optional(), // doc: no explicit min length stated
});

// ── Infer form error shape ────────────────────────────────────────────────────

export type TripSchemaErrors = Partial<
  Record<
    | "title"
    | "driverId"
    | "carId"
    | "status"
    | "startTime"
    | "endTime"
    | "branchId"
    | "collectedCount"
    | "deliveredCount"
    | "returnedCount"
    | "totalCashCollected"
    | "notes"
    | "endReason"
    | "reason",
    string
  >
>;