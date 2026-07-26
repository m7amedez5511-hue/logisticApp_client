"use client";

import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { Alert, Button, Input, Modal } from "../UI";
import {
  createMaintenanceSchema,
  updateMaintenanceSchema,
} from "@/src/validations/carMaintanance.validator";
import type {
  CarMaintenance,
  CreateMaintenancePayload,
  UpdateMaintenancePayload,
} from "@/src/types/carMaintanance";

const FORM_ID = "maintenance-form";

// ── Number coercion helper ────────────────────────────────────────────────────
// The backend can return `cost` as a numeric string (common with Decimal
// columns getting JSON-serialized as strings), even though our TS type says
// `number`. Coerce defensively both when hydrating the form AND right before
// building the submit payload, so this can never slip through as a string.

function toNumberOrUndefined(v: unknown): number | undefined {
  if (v === undefined || v === null || v === "") return undefined;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isNaN(n) ? undefined : n;
}

// ── Date helper ───────────────────────────────────────────────────────────────
// <input type="date"> gives "YYYY-MM-DD"; the backend expects full ISO-8601.

function toIsoDateTime(val: string): string {
  if (!val) return val;
  if (val.includes("T")) return val;
  return `${val}T00:00:00.000Z`;
}

// ── Form values shape ────────────────────────────────────────────────────────
// `cost` stays number | undefined (via setValueAs) so an empty input maps to
// `undefined` rather than NaN; startAt/endAt stay as raw "YYYY-MM-DD" strings
// while typed — yup's dateString test accepts that format directly — and are
// only converted to full ISO-8601 right before the payload is built.

interface MaintenanceFormValues {
  reason: string;
  cost: number | undefined;
  startAt: string;
  endAt: string;
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface CarMaintenanceFormModalProps {
  /** Pass null to create a brand new record, or an existing record to edit it. */
  editRecord: CarMaintenance | null;
  /** Shown in the header so the person knows which car this belongs to. */
  carLabel?: string;
  onClose: () => void;
  onSubmit: (
    payload: CreateMaintenancePayload | UpdateMaintenancePayload,
    isNew: boolean,
  ) => Promise<boolean>;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function CarMaintenanceFormModal({
  editRecord,
  carLabel,
  onClose,
  onSubmit,
}: CarMaintenanceFormModalProps) {
  const isNew = editRecord === null;

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<MaintenanceFormValues>({
    // Cast the schema itself and pin the generic explicitly — create/update
    // schemas differ structurally in which fields are required, so yup can't
    // unify them into MaintenanceFormValues on its own.
    resolver: yupResolver<MaintenanceFormValues>(
      (isNew ? createMaintenanceSchema : updateMaintenanceSchema) as any,
    ),
    defaultValues: {
      reason: editRecord?.reason ?? "",
      // Coerced defensively: editRecord.cost may arrive as a numeric string
      // from the backend (e.g. a Decimal column serialized to JSON as "150").
      cost: toNumberOrUndefined(editRecord?.cost),
      startAt: editRecord?.startAt?.slice(0, 10) ?? "",
      endAt: editRecord?.endAt?.slice(0, 10) ?? "",
    },
  });

  const costField = register("cost", {
    setValueAs: (v) => (v === "" || v === null ? undefined : Number(v)),
  });

  // ── Submit ────────────────────────────────────────────────────────────────

  const submitHandler = async (data: MaintenanceFormValues) => {
    // Belt-and-braces: re-coerce cost right before it's used, in case it
    // somehow slipped back into a string.
    const safeCost = toNumberOrUndefined(data.cost);

    // Dates go out as full ISO-8601 strings, and cost always goes out as a
    // real number, never a string.
    const raw: Record<string, unknown> = { reason: data.reason, cost: safeCost };
    if (data.startAt) raw.startAt = toIsoDateTime(data.startAt);
    if (data.endAt) raw.endAt = toIsoDateTime(data.endAt);

    const payload = raw as unknown as CreateMaintenancePayload;
    const ok = await onSubmit(payload, isNew);
    if (ok) {
      onClose();
    } else {
      setError("reason", { message: "حدث خطأ غير متوقع. يرجى المحاولة لاحقاً." });
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <Modal
      open
      onClose={onClose}
      size="sm"
      subtitle={isNew ? "إضافة سجل صيانة" : "تعديل سجل صيانة"}
      title={carLabel ?? (isNew ? "سجل صيانة جديد" : "تعديل السجل")}
      footer={
        <>
          <Button variant="secondary" type="button" onClick={onClose} disabled={isSubmitting}>
            إلغاء
          </Button>
          <Button type="submit" form={FORM_ID} loading={isSubmitting}>
            {isNew ? "إضافة السجل" : "حفظ التغييرات"}
          </Button>
        </>
      }
    >
      <form
        id={FORM_ID}
        onSubmit={handleSubmit(submitHandler)}
        noValidate
        dir="rtl"
        className="flex flex-col gap-4"
      >
        {errors.reason?.type === "manual" && (
          <Alert type="error" message={errors.reason.message ?? ""} onClose={() => {}} />
        )}

        <Input
          label="سبب الصيانة *"
          {...register("reason")}
          error={errors.reason && errors.reason.type !== "manual" ? errors.reason.message : undefined}
          placeholder="تغيير زيت المحرك"
          dir="rtl"
          autoFocus
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="التكلفة (ر.س) *"
            type="number"
            min={0}
            {...costField}
            error={errors.cost?.message}
            placeholder="0"
            dir="ltr"
          />

          <Input
            label="تاريخ البدء *"
            type="date"
            {...register("startAt")}
            error={errors.startAt?.message}
          />
        </div>

        <Input
          label="تاريخ الانتهاء"
          type="date"
          {...register("endAt")}
          error={errors.endAt?.message}
          hint="اتركه فارغاً إذا كانت الصيانة ما زالت جارية."
        />
      </form>
    </Modal>
  );
}