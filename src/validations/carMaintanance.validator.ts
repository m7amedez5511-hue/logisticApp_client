import * as yup from "yup";

// ── Shared date helper ────────────────────────────────────────────────────────
// <input type="date"> gives back "YYYY-MM-DD" — just check it parses as a real date.
const dateString = yup
  .string()
  .test("valid-date", "تاريخ غير صالح", (val) => {
    if (!val) return true; // optional, unless required elsewhere
    return !isNaN(Date.parse(val));
  });

// ── Create schema ─────────────────────────────────────────────────────────────
// Used when adding a brand-new maintenance record for a car.

export const createMaintenanceSchema = yup.object({
  reason: yup
    .string()
    .required("سبب الصيانة مطلوب")
    .min(3, "سبب الصيانة يجب أن يكون 3 أحرف على الأقل"),

  cost: yup
    .number()
    .typeError("التكلفة يجب أن تكون رقماً")
    .required("التكلفة مطلوبة")
    .min(0, "التكلفة يجب أن تكون 0 أو أكثر"),

  startAt: dateString.required("تاريخ البدء مطلوب"),

  // endAt is optional (the job may still be ongoing), but if it is given
  // it must not be earlier than the start date.
  endAt: dateString.test(
    "after-start",
    "تاريخ الانتهاء يجب أن يكون بعد تاريخ البدء",
    function (val) {
      const { startAt } = this.parent as { startAt?: string };
      if (!val || !startAt) return true;
      return new Date(val).getTime() >= new Date(startAt).getTime();
    },
  ),
});

// ── Update schema (everything optional, but same rules where present) ─────────

export const updateMaintenanceSchema = yup.object({
  reason: yup
    .string()
    .min(3, "سبب الصيانة يجب أن يكون 3 أحرف على الأقل")
    .optional(),

  cost: yup
    .number()
    .typeError("التكلفة يجب أن تكون رقماً")
    .min(0, "التكلفة يجب أن تكون 0 أو أكثر")
    .optional(),

  startAt: dateString.optional(),

  endAt: dateString.test(
    "after-start",
    "تاريخ الانتهاء يجب أن يكون بعد تاريخ البدء",
    function (val) {
      const { startAt } = this.parent as { startAt?: string };
      if (!val || !startAt) return true;
      return new Date(val).getTime() >= new Date(startAt).getTime();
    },
  ),

  isActive: yup.boolean().optional(),
});

// ── Infer form error shape ────────────────────────────────────────────────────

export type MaintenanceSchemaErrors = Partial<
  Record<"reason" | "cost" | "startAt" | "endAt" | "isActive", string>
>;