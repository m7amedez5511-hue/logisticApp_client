"use client";

import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { getStoredToken } from "../../lib/auth";
import { get, post, put, del } from "../../services/api";
import { Spinner, Alert } from "../../Components/UI";
import { ApiListResponse, FormErrors, TableAction, TableState, User, UserFormData } from "@/types/user";
import { Branch } from "@/types/branch";
import { Role } from "@/types/role";


// ─── Reducer for table state ────────────────────────────────────────────────

function tableReducer(s: TableState, a: TableAction): TableState {
  switch (a.type) {
    case "LOAD_START":
      return { ...s, loading: true, error: null };
    case "LOAD_OK":
      return {
        ...s,
        loading: false,
        users: a.users,
        total: a.total,
        pages: a.pages,
      };
    case "LOAD_ERR":
      return { ...s, loading: false, error: a.error };
    case "ADD":
      return { ...s, users: [a.user, ...s.users] };
    case "UPDATE":
      return {
        ...s,
        users: s.users.map((u) => (u.id === a.user.id ? a.user : u)),
      };
    case "DELETE":
      return { ...s, users: s.users.filter((u) => u.id !== a.id) };
    case "CLEAR_ERR":
      return { ...s, error: null };
    default:
      return s;
  }
}

// ─── Validation ─────────────────────────────────────────────────────────────

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\+?[0-9]{10,15}$/;

function validate(data: UserFormData, isNew: boolean): FormErrors {
  const e: FormErrors = {};
  if (!data.name.trim()) e.name = "الاسم الكامل مطلوب";
  if (data.email && !EMAIL_RE.test(data.email))
    e.email = "صيغة البريد الإلكتروني غير صحيحة";
  if (!data.phone.trim()) e.phone = "رقم الهاتف مطلوب";
  else if (!PHONE_RE.test(data.phone.replace(/\s/g, "")))
    e.phone = "رقم هاتف غير صالح (10-15 رقم)";
  if (isNew && !data.password) e.password = "كلمة المرور مطلوبة";
  if (isNew && data.password && data.password.length < 6)
    e.password = "كلمة المرور 6 أحرف على الأقل";
  if (!data.roleId) e.roleId = "الدور مطلوب";
  if (!data.branchId) e.branchId = "الفرع مطلوب";
  return e;
}

// ─── Shared style tokens (inline, matching tokens.css) ─────────────────────

const S = {
  card: {
    borderRadius: "var(--radius-xl)",
    border: "1px solid var(--color-border)",
    background: "var(--color-surface)",
    overflow: "hidden",
    boxShadow: "var(--shadow-card)",
  } as React.CSSProperties,

  th: {
    padding: "0.75rem 1.5rem",
    fontSize: 11,
    fontWeight: 700,
    textTransform: "uppercase" as const,
    letterSpacing: "0.2em",
    color: "var(--color-text-muted)",
    background: "var(--color-surface-muted)",
    borderBottom: "1px solid var(--color-border)",
  } as React.CSSProperties,

  input: {
    width: "100%",
    height: 40,
    padding: "0 0.75rem",
    borderRadius: "var(--radius-md)",
    border: "1px solid var(--color-border)",
    background: "var(--color-surface)",
    fontSize: 13,
    color: "var(--color-text-primary)",
    outline: "none",
    fontFamily: "var(--font-sans)",
    transition: "border-color 150ms",
  } as React.CSSProperties,

  label: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 6,
    fontSize: 12,
    fontWeight: 600,
    color: "var(--color-text-secondary)",
  } as React.CSSProperties,

  errorText: {
    fontSize: 11,
    color: "var(--color-danger)",
    fontWeight: 500,
  } as React.CSSProperties,
};

// ─── UserFormModal ───────────────────────────────────────────────────────────

interface UserFormModalProps {
  /** null = add mode; User = edit mode */
  editUser: User | null;
  roles: Role[];
  branches: Branch[];
  onClose: () => void;
  onSaved: (user: User, isNew: boolean) => void;
}

function UserFormModal({
  editUser,
  roles,
  branches,
  onClose,
  onSaved,
}: UserFormModalProps) {
  const isNew = editUser === null;

  const [form, setForm] = useState<UserFormData>({
    name: editUser?.name ?? "",
    email: editUser?.email ?? "",
    phone: editUser?.phone ?? "",
    password: "",
    roleId: editUser?.role?.id ?? "",
    branchId: editUser?.branch?.id ?? "",
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState("");

  const firstInputRef = useRef<HTMLInputElement>(null);

  // Focus first input when modal opens
  useEffect(() => {
    firstInputRef.current?.focus();
  }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const set =
    (field: keyof UserFormData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setForm((p) => ({ ...p, [field]: e.target.value }));
      if (errors[field]) setErrors((p) => ({ ...p, [field]: undefined }));
    };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate(form, isNew);
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }

    setSaving(true);
    setApiError("");
    const token = getStoredToken();

    try {
      // Build payload — exclude password on edit unless filled
      const payload: Record<string, string> = {
        name: form.name.trim(),
        phone: form.phone.trim(),
        roleId: form.roleId,
        branchId: form.branchId,
      };
      if (form.email) payload.email = form.email.trim();
      if (isNew) payload.password = form.password;
      else if (form.password) payload.password = form.password;

      let saved: User;
      if (isNew) {
        const res = await post<{ data: User }>("users", payload, token);
        saved = res.data;
      } else {
        const res = await put<{ data: User }>(
          `users/${editUser!.id}`,
          payload,
          token,
        );
        saved = res.data;
      }

      onSaved(saved, isNew);
      onClose();
    } catch (err: unknown) {
      setApiError(
        err instanceof Error ? err.message : "حدث خطأ، يرجى المحاولة مجددًا.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    /* Backdrop */
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        background: "rgba(15,23,42,0.55)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
      }}
    >
      {/* Panel */}
      <div
        style={{
          width: "100%",
          maxWidth: 520,
          background: "var(--color-surface)",
          borderRadius: "var(--radius-2xl)",
          border: "1px solid var(--color-border)",
          boxShadow: "0 24px 64px rgba(0,0,0,.18)",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "1.25rem 1.5rem",
            borderBottom: "1px solid var(--color-border)",
            background: "var(--color-surface-muted)",
          }}
        >
          <div>
            <p
              style={{
                fontSize: 11,
                letterSpacing: "0.3em",
                textTransform: "uppercase",
                color: "#2563EB",
                fontWeight: 600,
                margin: 0,
              }}
            >
              {isNew ? "إضافة مستخدم" : "تعديل مستخدم"}
            </p>
            <h2
              id="modal-title"
              style={{
                fontSize: 17,
                fontWeight: 700,
                color: "var(--color-text-primary)",
                margin: "4px 0 0",
              }}
            >
              {isNew ? "مستخدم جديد" : editUser?.name}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق"
            style={{
              width: 34,
              height: 34,
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--color-border)",
              background: "var(--color-surface)",
              cursor: "pointer",
              fontSize: 18,
              lineHeight: 1,
              color: "var(--color-text-muted)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            ×
          </button>
        </div>

        {/* Form body */}
        <form
          onSubmit={handleSubmit}
          noValidate
          style={{
            padding: "1.5rem",
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
          }}
        >
          {apiError && (
            <Alert
              type="error"
              message={apiError}
              onClose={() => setApiError("")}
            />
          )}

          {/* Name */}
          <label style={S.label}>
            الاسم الكامل *
            <input
              ref={firstInputRef}
              style={{
                ...S.input,
                ...(errors.name
                  ? {
                      borderColor: "var(--color-danger)",
                      background: "#FEF2F2",
                    }
                  : {}),
              }}
              value={form.name}
              onChange={set("name")}
              placeholder="أحمد الرشيدي"
              autoComplete="name"
              dir="rtl"
            />
            {errors.name && <span style={S.errorText}>{errors.name}</span>}
          </label>

          {/* Email + Phone — 2 columns */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "0.75rem",
            }}
          >
            <label style={S.label}>
              البريد الإلكتروني
              <input
                style={{
                  ...S.input,
                  ...(errors.email
                    ? {
                        borderColor: "var(--color-danger)",
                        background: "#FEF2F2",
                      }
                    : {}),
                }}
                type="email"
                value={form.email}
                onChange={set("email")}
                placeholder="ahmed@co.sa"
                autoComplete="email"
                dir="ltr"
              />
              {errors.email && <span style={S.errorText}>{errors.email}</span>}
            </label>

            <label style={S.label}>
              رقم الهاتف *
              <input
                style={{
                  ...S.input,
                  ...(errors.phone
                    ? {
                        borderColor: "var(--color-danger)",
                        background: "#FEF2F2",
                      }
                    : {}),
                }}
                type="tel"
                value={form.phone}
                onChange={set("phone")}
                placeholder="+966 5x xxx xxxx"
                autoComplete="tel"
                dir="ltr"
              />
              {errors.phone && <span style={S.errorText}>{errors.phone}</span>}
            </label>
          </div>

          {/* Password */}
          <label style={S.label}>
            {isNew
              ? "كلمة المرور *"
              : "كلمة المرور الجديدة (اتركها فارغة إذا لا تريد تغييرها)"}
            <input
              style={{
                ...S.input,
                ...(errors.password
                  ? {
                      borderColor: "var(--color-danger)",
                      background: "#FEF2F2",
                    }
                  : {}),
              }}
              type="password"
              value={form.password}
              onChange={set("password")}
              placeholder="••••••••"
              autoComplete={isNew ? "new-password" : "off"}
              dir="ltr"
            />
            {errors.password && (
              <span style={S.errorText}>{errors.password}</span>
            )}
          </label>

          {/* Role + Branch — 2 columns */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "0.75rem",
            }}
          >
            <label style={S.label}>
              الدور *
              <select
                style={{
                  ...S.input,
                  cursor: "pointer",
                  ...(errors.roleId
                    ? {
                        borderColor: "var(--color-danger)",
                        background: "#FEF2F2",
                      }
                    : {}),
                }}
                value={form.roleId}
                onChange={set("roleId")}
                dir="rtl"
              >
                <option value="">اختر الدور</option>
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
              {errors.roleId && (
                <span style={S.errorText}>{errors.roleId}</span>
              )}
            </label>

            <label style={S.label}>
              الفرع *
              <select
                style={{
                  ...S.input,
                  cursor: "pointer",
                  ...(errors.branchId
                    ? {
                        borderColor: "var(--color-danger)",
                        background: "#FEF2F2",
                      }
                    : {}),
                }}
                value={form.branchId}
                onChange={set("branchId")}
                dir="rtl"
              >
                <option value="">اختر الفرع</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
              {errors.branchId && (
                <span style={S.errorText}>{errors.branchId}</span>
              )}
            </label>
          </div>

          {/* Actions */}
          <div
            style={{
              display: "flex",
              gap: "0.5rem",
              justifyContent: "flex-end",
              paddingTop: "0.5rem",
            }}
          >
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              style={{
                height: 40,
                padding: "0 1.25rem",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--color-border)",
                background: "var(--color-surface)",
                fontSize: 13,
                fontWeight: 600,
                color: "var(--color-text-secondary)",
                cursor: saving ? "not-allowed" : "pointer",
                fontFamily: "var(--font-sans)",
              }}
            >
              إلغاء
            </button>

            <button
              type="submit"
              disabled={saving}
              style={{
                height: 40,
                padding: "0 1.5rem",
                borderRadius: "var(--radius-md)",
                border: "none",
                background: saving
                  ? "var(--color-brand-400)"
                  : "var(--color-brand-600)",
                fontSize: 13,
                fontWeight: 700,
                color: "#FFFFFF",
                cursor: saving ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontFamily: "var(--font-sans)",
                transition: "background 150ms",
              }}
            >
              {saving && <Spinner size="sm" className="text-white" />}
              {saving
                ? "جارٍ الحفظ…"
                : isNew
                  ? "إضافة المستخدم"
                  : "حفظ التغييرات"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── DeleteConfirmModal ──────────────────────────────────────────────────────

interface DeleteConfirmProps {
  user: User;
  onCancel: () => void;
  onConfirm: () => void;
  deleting: boolean;
}

function DeleteConfirmModal({
  user,
  onCancel,
  onConfirm,
  deleting,
}: DeleteConfirmProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onCancel]);

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="del-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 60,
        background: "rgba(15,23,42,0.55)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 400,
          background: "var(--color-surface)",
          borderRadius: "var(--radius-xl)",
          border: "1px solid #FECACA",
          boxShadow: "0 20px 48px rgba(0,0,0,.18)",
          padding: "2rem",
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
          textAlign: "center",
        }}
      >
        {/* Icon */}
        <div
          style={{
            width: 52,
            height: 52,
            margin: "0 auto",
            borderRadius: "50%",
            background: "#FEF2F2",
            border: "1px solid #FECACA",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#DC2626"
            strokeWidth="2"
          >
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
            <path d="M10 11v6M14 11v6" />
            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
          </svg>
        </div>

        <div>
          <h2
            id="del-title"
            style={{
              fontSize: 17,
              fontWeight: 700,
              color: "var(--color-text-primary)",
              margin: 0,
            }}
          >
            حذف المستخدم
          </h2>
          <p
            style={{
              marginTop: 8,
              fontSize: 13,
              color: "var(--color-text-muted)",
              lineHeight: 1.6,
            }}
          >
            هل أنت متأكد من حذف{" "}
            <strong style={{ color: "var(--color-text-primary)" }}>
              {user.name}
            </strong>
            ؟ لا يمكن التراجع عن هذا الإجراء.
          </p>
        </div>

        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button
            type="button"
            onClick={onCancel}
            disabled={deleting}
            style={{
              flex: 1,
              height: 40,
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--color-border)",
              background: "var(--color-surface)",
              fontSize: 13,
              fontWeight: 600,
              color: "var(--color-text-secondary)",
              cursor: deleting ? "not-allowed" : "pointer",
              fontFamily: "var(--font-sans)",
            }}
          >
            إلغاء
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={deleting}
            style={{
              flex: 1,
              height: 40,
              borderRadius: "var(--radius-md)",
              border: "none",
              background: "#DC2626",
              fontSize: 13,
              fontWeight: 700,
              color: "#FFF",
              cursor: deleting ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              fontFamily: "var(--font-sans)",
              opacity: deleting ? 0.7 : 1,
            }}
          >
            {deleting && <Spinner size="sm" className="text-white" />}
            {deleting ? "جارٍ الحذف…" : "تأكيد الحذف"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Badge components ────────────────────────────────────────────────────────

function RoleBadge({ name }: { name?: string }) {
  const isAdmin = name === "مدير النظام";
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        borderRadius: "var(--radius-full)",
        border: isAdmin ? "1px solid #BFDBFE" : "1px solid var(--color-border)",
        background: isAdmin ? "#EFF6FF" : "var(--color-surface-muted)",
        padding: "0.2rem 0.625rem",
        fontSize: 11,
        fontWeight: 600,
        color: isAdmin ? "#1D4ED8" : "var(--color-text-muted)",
      }}
    >
      {name ?? "—"}
    </span>
  );
}

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        borderRadius: "var(--radius-full)",
        border: active ? "1px solid #BBF7D0" : "1px solid #FECACA",
        background: active ? "#DCFCE7" : "#FEF2F2",
        padding: "0.2rem 0.625rem",
        fontSize: 11,
        fontWeight: 600,
        color: active ? "#166534" : "#991B1B",
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: active ? "#16A34A" : "#DC2626",
        }}
      />
      {active ? "نشط" : "معطل"}
    </span>
  );
}

// ─── Icon buttons ────────────────────────────────────────────────────────────

function IconBtn({
  onClick,
  title,
  color,
  bg,
  borderColor,
  children,
}: {
  onClick: () => void;
  title: string;
  color: string;
  bg: string;
  borderColor: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      style={{
        width: 32,
        height: 32,
        borderRadius: "var(--radius-md)",
        border: `1px solid ${borderColor}`,
        background: bg,
        color,
        cursor: "pointer",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "opacity 150ms",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.75")}
      onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
    >
      {children}
    </button>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function UsersPage() {
  // ── Table state ────────────────────────────────────────
  const [state, dispatch] = useReducer(tableReducer, {
    users: [],
    loading: true,
    total: 0,
    pages: 1,
    error: null,
  });

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  // ── Modal state ────────────────────────────────────────
  // null → closed, false → add mode, User → edit mode
  const [formTarget, setFormTarget] = useState<User | null | false>(false);
  const modalOpen = formTarget !== false;

  // ── Delete state ───────────────────────────────────────
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  // ── Meta (roles, branches) ─────────────────────────────
  const [roles, setRoles] = useState<Role[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);

  // ── Fetch helpers ──────────────────────────────────────

  const loadUsers = useCallback(async (p: number, q: string) => {
    dispatch({ type: "LOAD_START" });
    const token = getStoredToken();
    try {
      const qs = `?page=${p}&limit=10${q ? `&search=${encodeURIComponent(q)}` : ""}`;
      const res = await get<ApiListResponse<User>>(`users${qs}`, token);
      const payload = res.data ?? res;
      dispatch({
        type: "LOAD_OK",
        users: payload.data ?? [],
        total: payload.meta?.total ?? 0,
        pages: payload.meta?.pages ?? 1,
      });
    } catch (err: unknown) {
      dispatch({
        type: "LOAD_ERR",
        error: err instanceof Error ? err.message : "فشل التحميل",
      });
    }
  }, []);

  // Load roles + branches once for modal selects
  useEffect(() => {
    const token = getStoredToken();
    get<{ data: { data: Role[] } }>("role?limit=100", token)
      .then((res) => setRoles((res.data ?? res).data ?? []))
      .catch(() => {});
    get<{ data: { data: Branch[] } }>("branches?limit=100", token)
      .then((res) => setBranches((res.data ?? res).data ?? []))
      .catch(() => {});
  }, []);

  // Re-fetch when page or search changes
  useEffect(() => {
    loadUsers(page, search);
  }, [page, search, loadUsers]);

  // ── Handlers ───────────────────────────────────────────

  const handleSaved = (user: User, isNew: boolean) => {
    dispatch(isNew ? { type: "ADD", user } : { type: "UPDATE", user });
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError("");
    const token = getStoredToken();
    try {
      await del(`users/${deleteTarget.id}`, token);
      dispatch({ type: "DELETE", id: deleteTarget.id });
      setDeleteTarget(null);
    } catch (err: unknown) {
      setDeleteError(
        err instanceof Error ? err.message : "فشل الحذف، يرجى المحاولة مجددًا.",
      );
    } finally {
      setDeleting(false);
    }
  };

  // ── Render ─────────────────────────────────────────────

  return (
    <>
      {/* ── Add / Edit modal ── */}
      {modalOpen && (
        <UserFormModal
          editUser={formTarget as User | null}
          roles={roles}
          branches={branches}
          onClose={() => setFormTarget(false)}
          onSaved={handleSaved}
        />
      )}

      {/* ── Delete confirm modal ── */}
      {deleteTarget && (
        <DeleteConfirmModal
          user={deleteTarget}
          deleting={deleting}
          onCancel={() => {
            setDeleteTarget(null);
            setDeleteError("");
          }}
          onConfirm={handleDelete}
        />
      )}

      <section
        style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}
      >
        {/* ── Header ── */}
        <header
          style={{
            borderRadius: "var(--radius-xl)",
            border: "1px solid var(--color-border)",
            background: "var(--color-surface)",
            padding: "1.5rem 2rem",
            boxShadow: "var(--shadow-card)",
          }}
        >
          <p
            style={{
              fontSize: 11,
              letterSpacing: "0.3em",
              textTransform: "uppercase",
              color: "#2563EB",
              fontWeight: 600,
            }}
          >
            إدارة الفريق
          </p>
          <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1
                style={{
                  fontSize: "1.5rem",
                  fontWeight: 700,
                  color: "var(--color-text-primary)",
                  margin: 0,
                }}
              >
                المستخدمون
              </h1>
              <p
                style={{
                  marginTop: "0.25rem",
                  fontSize: 13,
                  color: "var(--color-text-muted)",
                }}
              >
                إجمالي{" "}
                <strong style={{ color: "var(--color-text-primary)" }}>
                  {state.total}
                </strong>{" "}
                مستخدم
              </p>
            </div>

            {/* Right controls */}
            <div
              style={{
                display: "flex",
                gap: "0.5rem",
                flexWrap: "wrap",
                alignItems: "center",
              }}
            >
              {/* Search */}
              <div style={{ position: "relative", width: 256 }}>
                <svg
                  style={{
                    position: "absolute",
                    right: 12,
                    top: "50%",
                    transform: "translateY(-50%)",
                    width: 16,
                    height: 16,
                    color: "var(--color-text-hint)",
                    pointerEvents: "none",
                  }}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
                <input
                  type="text"
                  placeholder="بحث بالاسم أو الهاتف..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  dir="rtl"
                  style={{
                    width: "100%",
                    height: 40,
                    paddingRight: 36,
                    paddingLeft: 12,
                    borderRadius: "var(--radius-lg)",
                    border: "1px solid var(--color-border)",
                    background: "var(--color-surface)",
                    fontSize: 13,
                    color: "var(--color-text-primary)",
                    outline: "none",
                    fontFamily: "var(--font-sans)",
                  }}
                />
              </div>

              {/* ── ADD USER BUTTON ── */}
              <button
                type="button"
                onClick={() => setFormTarget(null)}
                style={{
                  height: 40,
                  padding: "0 1.125rem",
                  borderRadius: "var(--radius-lg)",
                  border: "none",
                  background: "var(--color-brand-600)",
                  fontSize: 13,
                  fontWeight: 700,
                  color: "#FFFFFF",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 7,
                  fontFamily: "var(--font-sans)",
                  boxShadow: "0 1px 4px rgba(37,99,235,.35)",
                  transition: "background 150ms",
                  whiteSpace: "nowrap",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "var(--color-brand-700)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "var(--color-brand-600)")
                }
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                إضافة مستخدم
              </button>
            </div>
          </div>
        </header>

        {/* ── Global error / delete error ── */}
        {state.error && (
          <Alert
            type="error"
            message={state.error}
            onClose={() => dispatch({ type: "CLEAR_ERR" })}
          />
        )}
        {deleteError && (
          <Alert
            type="error"
            message={deleteError}
            onClose={() => setDeleteError("")}
          />
        )}

        {/* ── Table ── */}
        <div style={S.card}>
          {/* Column headers */}
          <div
            dir="rtl"
            style={{
              display: "grid",
              gridTemplateColumns: "2fr 1.5fr 1.5fr 1fr 1fr 1fr 80px",
              ...S.th,
            }}
          >
            <span>الاسم</span>
            <span>اسم المستخدم</span>
            <span>الفرع</span>
            <span>الدور</span>
            <span>الحالة</span>
            <span style={{ textAlign: "center" }}>تاريخ الإنشاء</span>
            <span style={{ textAlign: "center" }}>إجراءات</span>
          </div>

          {/* Loading state */}
          {state.loading ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 12,
                padding: "4rem 0",
                color: "var(--color-text-muted)",
              }}
            >
              <Spinner size="sm" className="text-blue-600" />
              <span style={{ fontSize: 13 }}>جارٍ التحميل…</span>
            </div>
          ) : /* Empty state */
          state.users.length === 0 ? (
            <div style={{ textAlign: "center", padding: "4rem 1rem" }}>
              <p style={{ fontSize: 13, color: "var(--color-text-muted)" }}>
                {search
                  ? `لا توجد نتائج لـ "${search}"`
                  : "لا يوجد مستخدمون بعد."}
              </p>
              {!search && (
                <button
                  type="button"
                  onClick={() => setFormTarget(null)}
                  style={{
                    marginTop: 12,
                    fontSize: 13,
                    fontWeight: 600,
                    color: "var(--color-brand-600)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    textDecoration: "underline",
                  }}
                >
                  أضف أول مستخدم
                </button>
              )}
            </div>
          ) : (
            /* Rows */
            <ul dir="rtl" style={{ listStyle: "none", margin: 0, padding: 0 }}>
              {state.users.map((u, i) => (
                <li
                  key={u.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "2fr 1.5fr 1.5fr 1fr 1fr 1fr 80px",
                    alignItems: "center",
                    gap: "0.5rem",
                    padding: "0.875rem 1.5rem",
                    borderBottom: "1px solid var(--color-border)",
                    background:
                      i % 2 !== 0
                        ? "var(--color-surface-muted)"
                        : "transparent",
                    fontSize: 13,
                  }}
                >
                  {/* Name + phone */}
                  <div>
                    <p
                      style={{
                        fontWeight: 600,
                        color: "var(--color-text-primary)",
                        margin: 0,
                      }}
                    >
                      {u.name}
                    </p>
                    <p
                      style={{
                        marginTop: 2,
                        fontFamily: "var(--font-mono)",
                        fontSize: 11,
                        color: "var(--color-text-muted)",
                      }}
                    >
                      {u.phone}
                    </p>
                  </div>

                  {/* Username */}
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 12,
                      color: "#2563EB",
                      fontWeight: 600,
                    }}
                  >
                    {u.userName ?? "—"}
                  </span>

                  {/* Branch */}
                  <span style={{ color: "var(--color-text-secondary)" }}>
                    {u.branch?.name ?? "—"}
                  </span>

                  {/* Role */}
                  <RoleBadge name={u.role?.name} />

                  {/* Status */}
                  <StatusBadge active={u.isActive} />

                  {/* Created at */}
                  <span
                    style={{
                      textAlign: "center",
                      fontSize: 11,
                      color: "var(--color-text-muted)",
                    }}
                  >
                    {new Date(u.createdAt).toLocaleDateString("ar-SA", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </span>

                  {/* Actions */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      gap: 6,
                    }}
                  >
                    {/* Edit */}
                    <IconBtn
                      title={`تعديل ${u.name}`}
                      color="#1D4ED8"
                      bg="#EFF6FF"
                      borderColor="#BFDBFE"
                      onClick={() => setFormTarget(u)}
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </IconBtn>

                    {/* Delete */}
                    <IconBtn
                      title={`حذف ${u.name}`}
                      color="#DC2626"
                      bg="#FEF2F2"
                      borderColor="#FECACA"
                      onClick={() => setDeleteTarget(u)}
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                        <path d="M10 11v6M14 11v6" />
                        <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                      </svg>
                    </IconBtn>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {/* Pagination */}
          {state.pages > 1 && (
            <div
              dir="rtl"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                borderTop: "1px solid var(--color-border)",
                padding: "0.875rem 1.5rem",
              }}
            >
              <span style={{ fontSize: 12, color: "var(--color-text-muted)" }}>
                صفحة{" "}
                <strong style={{ color: "var(--color-text-primary)" }}>
                  {page}
                </strong>{" "}
                من{" "}
                <strong style={{ color: "var(--color-text-primary)" }}>
                  {state.pages}
                </strong>
              </span>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                {[
                  {
                    label: "السابق",
                    action: () => setPage((p) => Math.max(1, p - 1)),
                    disabled: page === 1,
                  },
                  {
                    label: "التالي",
                    action: () => setPage((p) => Math.min(state.pages, p + 1)),
                    disabled: page === state.pages,
                  },
                ].map((btn) => (
                  <button
                    key={btn.label}
                    type="button"
                    onClick={btn.action}
                    disabled={btn.disabled}
                    style={{
                      borderRadius: "var(--radius-lg)",
                      border: "1px solid var(--color-border)",
                      background: "var(--color-surface-muted)",
                      padding: "0.375rem 0.875rem",
                      fontSize: 12,
                      color: "var(--color-text-secondary)",
                      cursor: btn.disabled ? "not-allowed" : "pointer",
                      opacity: btn.disabled ? 0.4 : 1,
                      fontFamily: "var(--font-sans)",
                    }}
                  >
                    {btn.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
