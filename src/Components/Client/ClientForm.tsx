import React, { useState, FormEvent } from "react";
import { Client, CreateClientPayload } from "@/src/types/client";
import { Input, Textarea, Button } from "../UI";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ClientFormProps {
  /** Pre-populated when editing; omit for create */
  initialValues?: Partial<Client>;
  onSubmit: (data: CreateClientPayload) => Promise<void>;
  onCancel: () => void;
  submitLabel?: string;
}

type FormErrors = Partial<Record<keyof CreateClientPayload, string>>;

// ─── Validation ───────────────────────────────────────────────────────────────

function validate(values: CreateClientPayload): FormErrors {
  const errors: FormErrors = {};
  if (!values.name.trim()) errors.name = "Name is required.";
  if (!values.email.trim()) {
    errors.email = "Email is required.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
    errors.email = "Enter a valid email address.";
  }
  if (!values.phone.trim()) errors.phone = "Phone is required.";
  return errors;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ClientForm({
  initialValues = {},
  onSubmit,
  onCancel,
  submitLabel = "Save client",
}: ClientFormProps) {
  const [values, setValues] = useState<CreateClientPayload>({
    name:  initialValues.name  ?? "",
    email: initialValues.email ?? "",
    phone: initialValues.phone ?? "",
    taxId: initialValues.taxId ?? "",
    notes: initialValues.notes ?? "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);

  // Generic field updater
  const set = (field: keyof CreateClientPayload) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setValues((v) => ({ ...v, [field]: e.target.value }));
      if (errors[field]) setErrors((er) => ({ ...er, [field]: undefined }));
    };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const errs = validate(values);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit(values);
    } catch {
      // Error surfaced via parent hook's alert; keep form open
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      {/* Row 1: Name + Email */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label="Full name"
          placeholder="Acme Corp"
          value={values.name}
          onChange={set("name")}
          error={errors.name}
          required
          autoFocus
        />
        <Input
          label="Email"
          type="email"
          placeholder="billing@acme.com"
          value={values.email}
          onChange={set("email")}
          error={errors.email}
          required
        />
      </div>

      {/* Row 2: Phone + Tax ID */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label="Phone"
          type="tel"
          placeholder="+1 555 000 0000"
          value={values.phone}
          onChange={set("phone")}
          error={errors.phone}
          required
        />
        <Input
          label="Tax ID / VAT (optional)"
          placeholder="US123456789"
          value={values.taxId}
          onChange={set("taxId")}
        />
      </div>

      {/* Notes */}
      <Textarea
        label="Notes (optional)"
        placeholder="Anything worth remembering about this client…"
        value={values.notes}
        onChange={set("notes")}
      />

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
        <Button type="submit" loading={submitting}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}