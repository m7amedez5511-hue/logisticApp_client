"use client";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import type { Resolver } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { Alert, Button, Input, Select } from "../UI";
import { createUserSchema, updateUserSchema } from "@/src/validations/user.validator";
import { useEditFormSync } from "@/src/hooks/useEditFormSync"; // CHANGE: added hook — fixes roleId/branchId not pre-selecting on edit
import type { Branch } from "@/src/types/branch";
import type { Role } from "@/src/types/role";
import type { User, UserFormData } from "@/src/types/user";

// ── Props ─────────────────────────────────────────────────────────────────────
interface UserFormModalProps {
  editUser:  User | null;
  roles:     Role[];
  branches:  Branch[];
  onClose:   () => void;
  onSubmit:  (data: UserFormData, isNew: boolean) => Promise<boolean>;
}

// ── main component ────────────────────────────────────────────────────────────
export function UserFormModal({ editUser, roles, branches, onClose, onSubmit }: UserFormModalProps) {
  const isNew = editUser === null;

  // Custom resolver wrapper — on edit, an empty password field must be
  // treated as "not provided" (skip the min(8) rule entirely) rather than
  // validated as an empty string, exactly like the old validate() call did
  // by stripping `password` from the object before running the schema.
  const resolver: Resolver<UserFormData> = async (values, context, options) => {
    const schema = isNew ? createUserSchema : updateUserSchema;
    const data = !isNew && !values.password ? { ...values, password: undefined } : values;
    return (yupResolver(schema as any) as any)(data as UserFormData, context, options);
  };

  const {
    register,
    handleSubmit,
    setError,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<UserFormData>({
    resolver,
    defaultValues: {
      name:     editUser?.name        ?? "",
      email:    editUser?.email       ?? "",
      phone:    editUser?.phone       ?? "",
      password: "",
      roleId:   editUser?.role?.id    ?? "",
      branchId: editUser?.branch?.id  ?? "",
    },
  });

  // CHANGE: replaced the two manual useEffect blocks with useEditFormSync —
  // same behavior (re-apply saved id once its option list contains it),
  // reused across Driver/Car/Trip forms that have the same bug pattern.
  useEditFormSync(setValue, "roleId", editUser?.role?.id, roles);
  useEditFormSync(setValue, "branchId", editUser?.branch?.id, branches);

  // CHANGE: surface an inline error if the saved role/branch no longer
  // exists in the fetched list, instead of silently falling back to the
  // placeholder with no explanation.
  useEffect(() => {
    if (editUser?.role?.id && roles.length && !roles.some(r => r.id === editUser.role!.id)) {
      setError("roleId", { message: "الدور المحفوظ لم يعد متاحًا، الرجاء اختيار دور آخر" });
    }
  }, [roles, editUser, setError]);

  useEffect(() => {
    if (editUser?.branch?.id && branches.length && !branches.some(b => b.id === editUser.branch!.id)) {
      setError("branchId", { message: "الفرع المحفوظ لم يعد متاحًا، الرجاء اختيار فرع آخر" });
    }
  }, [branches, editUser, setError]);

  const submitHandler = async (data: UserFormData) => {
    const payload: Partial<UserFormData> = { ...data };
    if (!isNew && !payload.password) delete payload.password;

    const ok = await onSubmit(payload as UserFormData, isNew);
    if (ok) {
      onClose();
    } else {
      setError("name", { message: "حدث خطأ غير متوقع. يرجى المحاولة لاحقاً." });
    }
  };

  return (
    <div
      role="dialog" aria-modal="true" aria-labelledby="modal-title"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: "fixed", inset: 0, zIndex: 50,
        background: "rgba(15,23,42,0.55)", backdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem",
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 520,
          background: "var(--color-surface)",
          borderRadius: "var(--radius-2xl)",
          border: "1px solid var(--color-border)",
          boxShadow: "0 24px 64px rgba(0,0,0,.18)",
          overflow: "hidden",
        }}
      >
        {/* header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "1.25rem 1.5rem",
          borderBottom: "1px solid var(--color-border)",
          background: "var(--color-surface-muted)",
        }}>
          <div>
            <p style={{ fontSize: 11, letterSpacing: "0.3em", textTransform: "uppercase", color: "#2563EB", fontWeight: 600, margin: 0 }}>
              {isNew ? "إضافة مستخدم" : "تعديل مستخدم"}
            </p>
            <h2 id="modal-title" style={{ fontSize: 17, fontWeight: 700, color: "var(--color-text-primary)", margin: "4px 0 0" }}>
              {isNew ? "مستخدم جديد" : editUser?.name}
            </h2>
          </div>
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            aria-label="إغلاق"
            style={{ width: 34, height: 34, padding: 0, fontSize: 18 }}
          >
            ×
          </Button>
        </div>

        {/* body */}
        {/* CHANGE: added suppressHydrationWarning — form elements are the
            most common target for browser-extension-injected attributes
            (e.g. bis_skin_checked from Bitdefender), which caused the
            hydration mismatch error on Save. See ExtensionAttributeCleanup
            for the global fix; this is a scoped safety net. */}
        <form
          onSubmit={handleSubmit(submitHandler)}
          noValidate
          suppressHydrationWarning
          style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}
        >
          {errors.name?.type === "manual" && (
            <Alert type="error" message={errors.name.message ?? ""} onClose={() => {}} />
          )}

          {/* name */}
          <Input
            label="الاسم الكامل *"
            {...register("name")}
            error={errors.name && errors.name.type !== "manual" ? errors.name.message : undefined}
            placeholder="أحمد الرشيدي"
            autoComplete="name"
            autoFocus
            dir="rtl"
          />

          {/* email + phone */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <Input
              label="البريد الإلكتروني"
              type="email"
              {...register("email")}
              error={errors.email?.message}
              placeholder="ahmed@co.sa"
              autoComplete="email"
              dir="ltr"
            />
            <Input
              label="رقم الهاتف *"
              type="tel"
              {...register("phone")}
              error={errors.phone?.message}
              placeholder="+966 5x xxx xxxx"
              autoComplete="tel"
              dir="ltr"
            />
          </div>

          {/* password */}
          <Input
            label={isNew ? "كلمة المرور *" : "كلمة المرور الجديدة (اتركها فارغة إذا لا تريد تغييرها)"}
            type="password"
            {...register("password")}
            error={errors.password?.message}
            placeholder="••••••••"
            autoComplete={isNew ? "new-password" : "off"}
            dir="ltr"
          />

          {/* role + branch */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <Select
              label="الدور *"
              {...register("roleId")}
              error={errors.roleId?.message}
              dir="rtl"
            >
              <option value="">اختر الدور</option>
              {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            </Select>
            <Select
              label="الفرع *"
              {...register("branchId")}
              error={errors.branchId?.message}
              dir="rtl"
            >
              <option value="">اختر الفرع</option>
              {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </Select>
          </div>

          {/* actions */}
          <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end", paddingTop: "0.5rem" }}>
            <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
              إلغاء
            </Button>
            <Button type="submit" variant="primary" loading={isSubmitting}>
              {isSubmitting ? "جارٍ الحفظ…" : isNew ? "إضافة المستخدم" : "حفظ التغييرات"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}