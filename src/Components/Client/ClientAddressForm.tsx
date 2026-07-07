import React, { useState, FormEvent } from "react";
import type { ClientAddress, CreateClientAddressPayload } from "@/src/types/client_adresses";
import { Input, Select, Button } from "../UI";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ClientAddressFormProps {
  clientId: string;
  initialValues?: Partial<ClientAddress>;
  onSubmit: (data: CreateClientAddressPayload) => Promise<void>;
  onCancel: () => void;
  submitLabel?: string;
}

type FormErrors = Partial<{
  label: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}>;

// ─── Validation ───────────────────────────────────────────────────────────────

function validate(v: { label: string; street: string; city: string; state: string; postalCode: string; country: string }): FormErrors {
  const e: FormErrors = {};
  if (!v.label.trim())      e.label      = "Label is required.";
  if (!v.street.trim())     e.street     = "Street is required.";
  if (!v.city.trim())       e.city       = "City is required.";
  if (!v.state.trim())      e.state      = "State / Province is required.";
  if (!v.postalCode.trim()) e.postalCode = "Postal code is required.";
  if (!v.country.trim())    e.country    = "Country is required.";
  return e;
}

// Common address labels – quick-pick for the user
const LABEL_PRESETS = ["Billing", "Shipping", "Head Office", "Branch", "Warehouse", "Other"];

// ─── Component ────────────────────────────────────────────────────────────────

export default function ClientAddressForm({
  clientId,
  initialValues = {},
  onSubmit,
  onCancel,
  submitLabel = "Save address",
}: ClientAddressFormProps) {
  const [values, setValues] = useState<{
    label: string;
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    isPrimary: boolean;
  }>({
    label: initialValues.label ?? "",
    street: initialValues.details?.street ?? "",
    city: initialValues.details?.city ?? "",
    state: initialValues.details?.state ?? "",
    postalCode: initialValues.details?.zipCode ?? "",
    country: initialValues.details?.country ?? "",
    isPrimary: initialValues.isPrimary ?? false,
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);

  const set =
    (field: "label" | "street" | "city" | "state" | "postalCode" | "country") =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setValues((v) => ({ ...v, [field]: e.target.value }));
      if (errors[field]) setErrors((er) => ({ ...er, [field]: undefined }));
    };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const errs = validate(values);
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    setSubmitting(true);
    try {
      const payload: CreateClientAddressPayload = {
        clientId,
        label: values.label,
        branchName: null,
        contactPerson: undefined,
        details: {
          country: values.country,
          city: values.city,
          state: values.state,
          street: values.street,
          zipCode: values.postalCode,
        },
        location: {
          coordinates: [0, 0],
        },
        isPrimary: values.isPrimary,
        isValidated: false,
      };
      await onSubmit(payload);
    } catch {
      /* parent surfaces the error */
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      {/* Label + Primary toggle */}
      <div className="flex items-end gap-4">
        <Select
          label="Label"
          value={values.label}
          onChange={(e) => {
            setValues((v) => ({ ...v, label: e.target.value }));
            if (errors.label) setErrors((er) => ({ ...er, label: undefined }));
          }}
          error={errors.label}
          wrapperClassName="flex-1"
        >
          <option value="">Select a label…</option>
          {LABEL_PRESETS.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </Select>

        <label className="mb-1 flex items-center gap-2 text-sm text-slate-600 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={values.isPrimary}
            onChange={(e) =>
              setValues((v) => ({ ...v, isPrimary: e.target.checked }))
            }
            className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
          />
          Primary address
        </label>
      </div>

      {/* Street */}
      <Input
        label="Street address"
        placeholder="123 Main St, Suite 4"
        value={values.street}
        onChange={set("street")}
        error={errors.street}
        required
      />

      {/* City + State */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label="City"
          placeholder="New York"
          value={values.city}
          onChange={set("city")}
          error={errors.city}
          required
        />
        <Input
          label="State / Province"
          placeholder="NY"
          value={values.state}
          onChange={set("state")}
          error={errors.state}
          required
        />
      </div>

      {/* Postal code + Country */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label="Postal code"
          placeholder="10001"
          value={values.postalCode}
          onChange={set("postalCode")}
          error={errors.postalCode}
          required
        />
        <Input
          label="Country"
          placeholder="United States"
          value={values.country}
          onChange={set("country")}
          error={errors.country}
          required
        />
      </div>

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