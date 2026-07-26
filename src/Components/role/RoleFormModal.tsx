"use client";

import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { Alert, Button, Input, Modal, Textarea } from "../UI";
import { createRoleSchema, updateRoleSchema } from "@/src/validations/role.validator";
import { Permission, Role, RoleFormData } from "@/src/types/role";

const FORM_ID = "role-form";

// ── Permission checkbox group ─────────────────────────────────────────────────
function PermissionGroup({
  module, perms, selected, onToggle,
}: {
  module: string; perms: Permission[]; selected: string[]; onToggle: (id: string) => void;
}) {
  return (
    <div style={{ marginBottom: "0.75rem" }}>
      <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", color: "var(--color-text-muted)", margin: "0 0 6px" }}>
        {module}
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
        {perms.map(p => {
          const checked = selected.includes(p.id);
          return (
            <label key={p.id} style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "0.3rem 0.6rem", borderRadius: "var(--radius-md)",
              border: `1px solid ${checked ? "#BFDBFE" : "var(--color-border)"}`,
              background: checked ? "#EFF6FF" : "var(--color-surface-muted)",
              cursor: "pointer", fontSize: 12, fontWeight: 500,
              color: checked ? "#1D4ED8" : "var(--color-text-secondary)",
              transition: "all 150ms",
            }}>
              <input
                type="checkbox" checked={checked} onChange={() => onToggle(p.id)}
                style={{ accentColor: "#2563EB", cursor: "pointer" }}
              />
              {p.name}
            </label>
          );
        })}
      </div>
    </div>
  );
}

// ── Props ─────────────────────────────────────────────────────────────────────
interface RoleFormModalProps {
  editRole:    Role | null;
  permissions: Permission[];
  onClose:     () => void;
  onSubmit:    (data: RoleFormData, isNew: boolean) => Promise<boolean>;
}

// ── Main component ────────────────────────────────────────────────────────────
export function RoleFormModal({ editRole, permissions, onClose, onSubmit }: RoleFormModalProps) {
  const isNew = editRole === null;

  // Group permissions by module
  const grouped = permissions.reduce<Record<string, Permission[]>>((acc, p) => {
    if (!acc[p.module]) acc[p.module] = [];
    acc[p.module].push(p);
    return acc;
  }, {});

  const currentPermIds = editRole?.permissions?.map(p => p.permission.id) ?? [];

  const {
    register,
    handleSubmit,
    control,
    setError,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RoleFormData>({
    // Cast the schema itself and pin the generic explicitly — create/update
    // schemas differ structurally in which fields are required, so yup can't
    // unify them into RoleFormData on its own.
    resolver: yupResolver<RoleFormData>((isNew ? createRoleSchema : updateRoleSchema) as any),
    defaultValues: {
      name: editRole?.name ?? "",
      description: editRole?.description ?? "",
      permissionIds: currentPermIds,
    },
  });

  const submitHandler = async (data: RoleFormData) => {
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
      title={isNew ? "دور جديد" : editRole?.name ?? ""}
      subtitle={isNew ? "إضافة دور" : "تعديل دور"}
      onClose={onClose}
      size="md"
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
            إلغاء
          </Button>
          <Button type="submit" form={FORM_ID} loading={isSubmitting}>
            {isNew ? "إنشاء الدور" : "حفظ التغييرات"}
          </Button>
        </>
      }
    >
      <form
        id={FORM_ID}
        onSubmit={handleSubmit(submitHandler)}
        noValidate
        style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
      >
        {errors.name?.type === "manual" && (
          <Alert type="error" message={errors.name.message ?? ""} onClose={() => {}} />
        )}

        <div dir="rtl">
          <Input
            label="اسم الدور *"
            {...register("name")}
            error={errors.name && errors.name.type !== "manual" ? errors.name.message : undefined}
            placeholder="مثال: مدير الفروع"
            dir="rtl"
            autoFocus
          />
        </div>

        <div dir="rtl">
          <Textarea
            label="الوصف"
            {...register("description")}
            placeholder="وصف مختصر لمهام هذا الدور…"
            error={errors.description?.message}
            dir="rtl"
            rows={3}
          />
        </div>

        {/* Permissions — bound via Controller since it's a custom checkbox
            group, not a plain input/select/textarea. */}
        {permissions.length > 0 && (
          <Controller
            name="permissionIds"
            control={control}
            render={({ field }) => (
              <div dir="rtl">
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "var(--color-text-secondary)" }}>
                    الصلاحيات
                  </span>
                  <div style={{ display: "flex", gap: 8 }}>
                    <Button
                      type="button"
                      onClick={() => setValue("permissionIds", permissions.map(x => x.id))}
                      style={{ fontSize: 11, fontWeight: 600, color: "#2563EB", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}
                    >
                      تحديد الكل
                    </Button>
                    <Button
                      type="button"
                      onClick={() => setValue("permissionIds", [])}
                      style={{ fontSize: 11, fontWeight: 600, color: "#DC2626", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}
                    >
                      إلغاء الكل
                    </Button>
                  </div>
                </div>
                <div style={{
                  border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)",
                  padding: "0.875rem", background: "var(--color-surface-muted)",
                  maxHeight: 280, overflowY: "auto",
                }}>
                  {Object.entries(grouped).map(([module, perms]) => (
                    <PermissionGroup
                      key={module}
                      module={module}
                      perms={perms}
                      selected={field.value}
                      onToggle={(id) =>
                        field.onChange(
                          field.value.includes(id)
                            ? field.value.filter((x) => x !== id)
                            : [...field.value, id],
                        )
                      }
                    />
                  ))}
                </div>
                <p style={{ fontSize: 11, color: "var(--color-text-muted)", marginTop: 6 }}>
                  {field.value.length} صلاحية محددة من أصل {permissions.length}
                </p>
              </div>
            )}
          />
        )}
      </form>
    </Modal>
  );
}