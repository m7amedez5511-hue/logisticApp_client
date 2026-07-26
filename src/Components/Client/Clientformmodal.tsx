"use client";

import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { Alert, Button, Input, Modal, Select } from "../UI";
import {
  createClientSchema,
  updateClientSchema,
  CLIENT_TYPES,
} from "@/src/validations/client.validator";
import type { Client, ClientFormData } from "@/src/types/client";

const FORM_ID = "client-form";

// ── Props ──────────────────────────────────────────────────────────────────
interface ClientFormModalProps {
  editClient: Client | null;
  onClose:   () => void;
  onSubmit:  (
    data: ClientFormData,
    isNew: boolean
  ) => Promise<boolean>;
}

// ── Component ──────────────────────────────────────────────────────────────
export function ClientFormModal({ editClient, onClose, onSubmit }: ClientFormModalProps) {
  const isNew = editClient === null;

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ClientFormData>({
    resolver: yupResolver(isNew ? createClientSchema : updateClientSchema) as never,
    defaultValues: {
      name: editClient?.name ?? "",
      email: editClient?.email ?? "",
      phone: editClient?.phone ?? "",
      clientType: editClient?.clientType ?? undefined,
      isActive: editClient?.isActive ?? true,
    },
  });

  const submitHandler = async (data: ClientFormData) => {
    const ok = await onSubmit(data, isNew);
    if (ok) {
      onClose();
    } else {
      setError("name", { message: "حدث خطأ غير متوقع. يرجى المحاولة لاحقاً." });
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      size="sm"
      subtitle={isNew ? "إضافة عميل" : "تعديل عميل"}
      title={isNew ? "عميل جديد" : editClient?.name ?? ""}
      footer={
        <>
          <Button variant="secondary" type="button" onClick={onClose} disabled={isSubmitting}>
            إلغاء
          </Button>
          <Button type="submit" form={FORM_ID} loading={isSubmitting}>
            {isNew ? "إضافة العميل" : "حفظ التغييرات"}
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
        {errors.name?.type === "manual" && (
          <Alert type="error" message={errors.name.message ?? ""} onClose={() => {}} />
        )}

        <Input
          label={`اسم العميل ${isNew ? "*" : ""}`}
          placeholder="شركة لوجي فلو للتوصيل"
          autoComplete="organization"
          dir="rtl"
          error={errors.name?.type !== "manual" ? errors.name?.message : undefined}
          {...register("name")}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="البريد الإلكتروني"
            type="email"
            placeholder="info@company.sa"
            autoComplete="email"
            dir="ltr"
            error={errors.email?.message}
            {...register("email")}
          />

          <Input
            label={`رقم الهاتف ${isNew ? "*" : ""}`}
            type="tel"
            placeholder="05xxxxxxxx"
            autoComplete="tel"
            dir="ltr"
            error={errors.phone?.message}
            {...register("phone")}
          />
        </div>

        <Select
          label="نوع العميل"
          dir="rtl"
          error={errors.clientType?.message}
          {...register("clientType")}
        >
          <option value="">اختر النوع</option>
          {CLIENT_TYPES.map((t) => (
            <option key={t} value={t}>
              {t === "Individual" ? "فرد" : "شركة"}
            </option>
          ))}
        </Select>

        {!isNew && (
          <label className="flex items-center gap-2 text-[12px] font-semibold text-[var(--color-text-secondary)] cursor-pointer">
            <input
              type="checkbox"
              {...register("isActive" as never)}
              defaultChecked={editClient?.isActive ?? true}
              className="w-3.5 h-3.5 cursor-pointer"
            />
            عميل نشط
          </label>
        )}
      </form>
    </Modal>
  );
}