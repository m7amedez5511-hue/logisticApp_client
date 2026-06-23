"use client";

import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { Alert, Spinner } from "@/src/Components/UI";
import { getStoredToken } from "@/src/lib/auth";
import { get, post, put, del } from "@/src/services/api";

// ── Types ──────────────────────────────────────────────────────────────────

interface Branch {
  id: string;
  name: string;
  address?: string | null;
  phone?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface BranchFormData {
  name: string;
  address: string;
  phone: string;
}

// ── State / Reducer ────────────────────────────────────────────────────────

interface State {
  branches: Branch[];
  loading: boolean;
  total: number;
  pages: number;
  error: string | null;
}

type Action =
  | { type: "LOAD_START" }
  | { type: "LOAD_OK"; branches: Branch[]; total: number; pages: number }
  | { type: "LOAD_ERR"; error: string }
  | { type: "ADD"; branch: Branch }
  | { type: "UPDATE"; branch: Branch }
  | { type: "DELETE"; id: string }
  | { type: "CLEAR_ERR" };

function reducer(s: State, a: Action): State {
  switch (a.type) {
    case "LOAD_START": return { ...s, loading: true, error: null };
    case "LOAD_OK":    return { ...s, loading: false, branches: a.branches, total: a.total, pages: a.pages };
    case "LOAD_ERR":   return { ...s, loading: false, error: a.error };
    case "ADD":        return { ...s, branches: [a.branch, ...s.branches], total: s.total + 1 };
    case "UPDATE":     return { ...s, branches: s.branches.map(b => b.id === a.branch.id ? a.branch : b) };
    case "DELETE":     return { ...s, branches: s.branches.filter(b => b.id !== a.id), total: Math.max(0, s.total - 1) };
    case "CLEAR_ERR":  return { ...s, error: null };
    default:           return s;
  }
}

// ── Branch Form Modal ──────────────────────────────────────────────────────

function BranchFormModal({
  editBranch,
  onClose,
  onSubmit,
}: {
  editBranch: Branch | null;
  onClose: () => void;
  onSubmit: (data: BranchFormData, isNew: boolean) => Promise<boolean>;
}) {
  const isNew = editBranch === null;
  const [form, setForm] = useState<BranchFormData>({
    name:    editBranch?.name    ?? "",
    address: editBranch?.address ?? "",
    phone:   editBranch?.phone   ?? "",
  });
  const [errors, setErrors] = useState<Partial<BranchFormData>>({});
  const [saving, setSaving] = useState(false);
  const [apiErr, setApiErr] = useState("");
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => { nameRef.current?.focus(); }, []);
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  function validate(): boolean {
    const e: Partial<BranchFormData> = {};
    if (!form.name.trim()) e.name = "اسم الفرع مطلوب";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!validate()) return;
    setSaving(true);
    setApiErr("");
    const ok = await onSubmit(form, isNew);
    setSaving(false);
    if (ok) onClose();
    else setApiErr("حدث خطأ غير متوقع. يرجى المحاولة لاحقاً.");
  }

  const inputBase: React.CSSProperties = {
    width: "100%", height: 40, padding: "0 0.75rem",
    borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)",
    background: "var(--color-surface)", fontSize: 13,
    color: "var(--color-text-primary)", outline: "none", fontFamily: "var(--font-sans)",
  };

  return (
    <div
      role="dialog" aria-modal="true"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: "fixed", inset: 0, zIndex: 50,
        background: "rgba(15,23,42,0.55)", backdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem",
      }}
    >
      <div onClick={e => e.stopPropagation()} style={{
        width: "100%", maxWidth: 480,
        background: "var(--color-surface)", borderRadius: "var(--radius-2xl)",
        border: "1px solid var(--color-border)", boxShadow: "0 24px 64px rgba(0,0,0,.18)",
        overflow: "hidden",
      }}>
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "1.25rem 1.5rem", borderBottom: "1px solid var(--color-border)",
          background: "var(--color-surface-muted)",
        }}>
          <div>
            <p style={{ fontSize: 11, letterSpacing: "0.3em", textTransform: "uppercase", color: "#2563EB", fontWeight: 600, margin: 0 }}>
              {isNew ? "إضافة فرع" : "تعديل فرع"}
            </p>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: "var(--color-text-primary)", margin: "4px 0 0" }}>
              {isNew ? "فرع جديد" : editBranch?.name}
            </h2>
          </div>
          <button type="button" onClick={onClose} style={{
            width: 34, height: 34, borderRadius: "var(--radius-md)",
            border: "1px solid var(--color-border)", background: "var(--color-surface)",
            cursor: "pointer", fontSize: 18, color: "var(--color-text-muted)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>×</button>
        </div>

        <form onSubmit={handleSubmit} noValidate style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
          {apiErr && <Alert type="error" message={apiErr} onClose={() => setApiErr("")} />}

          <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12, fontWeight: 600, color: "var(--color-text-secondary)" }}>
            اسم الفرع *
            <input ref={nameRef} style={{ ...inputBase, ...(errors.name ? { borderColor: "var(--color-danger)", background: "#FEF2F2" } : {}) }}
              value={form.name} onChange={e => { setForm(p => ({ ...p, name: e.target.value })); setErrors(p => ({ ...p, name: undefined })); }}
              placeholder="فرع الرياض" dir="rtl" />
            {errors.name && <span style={{ fontSize: 11, color: "var(--color-danger)" }}>{errors.name}</span>}
          </label>

          <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12, fontWeight: 600, color: "var(--color-text-secondary)" }}>
            العنوان (اختياري)
            <input style={inputBase} value={form.address}
              onChange={e => setForm(p => ({ ...p, address: e.target.value }))}
              placeholder="شارع الملك فهد، الرياض" dir="rtl" />
          </label>

          <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12, fontWeight: 600, color: "var(--color-text-secondary)" }}>
            رقم الهاتف (اختياري)
            <input style={inputBase} value={form.phone}
              onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
              placeholder="+966 11 xxx xxxx" dir="ltr" />
          </label>

          <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end", paddingTop: "0.5rem" }}>
            <button type="button" onClick={onClose} disabled={saving}
              style={{ height: 40, padding: "0 1.25rem", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", background: "var(--color-surface)", fontSize: 13, fontWeight: 600, color: "var(--color-text-secondary)", cursor: saving ? "not-allowed" : "pointer", fontFamily: "var(--font-sans)" }}>
              إلغاء
            </button>
            <button type="submit" disabled={saving}
              style={{ height: 40, padding: "0 1.5rem", borderRadius: "var(--radius-md)", border: "none", background: saving ? "var(--color-brand-400)" : "var(--color-brand-600)", fontSize: 13, fontWeight: 700, color: "#FFF", cursor: saving ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 8, fontFamily: "var(--font-sans)" }}>
              {saving && <Spinner size="sm" className="text-white" />}
              {saving ? "جارٍ الحفظ…" : isNew ? "إضافة الفرع" : "حفظ التغييرات"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Delete Modal ───────────────────────────────────────────────────────────

function BranchDeleteModal({ branch, deleting, onCancel, onConfirm }: {
  branch: Branch; deleting: boolean; onCancel: () => void; onConfirm: () => void;
}) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onCancel(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onCancel]);

  return (
    <div role="alertdialog" aria-modal="true"
      onClick={e => { if (e.target === e.currentTarget) onCancel(); }}
      style={{
        position: "fixed", inset: 0, zIndex: 60,
        background: "rgba(15,23,42,0.55)", backdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem",
      }}>
      <div onClick={e => e.stopPropagation()} style={{
        width: "100%", maxWidth: 420, background: "var(--color-surface)",
        borderRadius: "var(--radius-xl)", border: "1px solid #FECACA",
        boxShadow: "0 20px 48px rgba(0,0,0,.18)", padding: "2rem",
        display: "flex", flexDirection: "column", gap: "1rem", textAlign: "center",
      }}>
        <div style={{ width: 52, height: 52, margin: "0 auto", borderRadius: "50%", background: "#FEF2F2", border: "1px solid #FECACA", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2">
            <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
            <path d="M10 11v6M14 11v6" /><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
          </svg>
        </div>
        <div>
          <h2 style={{ fontSize: 17, fontWeight: 700, color: "var(--color-text-primary)", margin: 0 }}>حذف الفرع</h2>
          <p style={{ marginTop: 8, fontSize: 13, color: "var(--color-text-muted)", lineHeight: 1.6 }}>
            هل أنت متأكد من حذف فرع <strong style={{ color: "var(--color-text-primary)" }}>{branch.name}</strong>؟ لا يمكن التراجع عن هذا الإجراء.
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button type="button" onClick={onCancel} disabled={deleting}
            style={{ flex: 1, height: 40, borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", background: "var(--color-surface)", fontSize: 13, fontWeight: 600, color: "var(--color-text-secondary)", cursor: deleting ? "not-allowed" : "pointer", fontFamily: "var(--font-sans)" }}>
            إلغاء
          </button>
          <button type="button" onClick={onConfirm} disabled={deleting}
            style={{ flex: 1, height: 40, borderRadius: "var(--radius-md)", border: "none", background: "#DC2626", fontSize: 13, fontWeight: 700, color: "#FFF", cursor: deleting ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontFamily: "var(--font-sans)", opacity: deleting ? 0.7 : 1 }}>
            {deleting && <Spinner size="sm" className="text-white" />}
            {deleting ? "جارٍ الحذف…" : "تأكيد الحذف"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Toast ──────────────────────────────────────────────────────────────────

function Toast({ type, message }: { type: "success" | "error"; message: string }) {
  const ok = type === "success";
  return (
    <div role="status" style={{
      position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", zIndex: 9999,
      display: "flex", alignItems: "center", gap: 10, padding: "0.75rem 1.25rem",
      borderRadius: "var(--radius-full)", background: ok ? "#065F46" : "#7F1D1D",
      color: "#FFF", fontSize: 13, fontWeight: 600, boxShadow: "0 8px 32px rgba(0,0,0,.25)",
      maxWidth: "90vw", whiteSpace: "nowrap", fontFamily: "var(--font-sans)",
    }}>
      <span style={{ fontSize: 16 }}>{ok ? "✓" : "⚠"}</span>
      <span>{message}</span>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function BranchesPage() {
  const [state, dispatch] = useReducer(reducer, {
    branches: [], loading: true, total: 0, pages: 1, error: null,
  });
  const [search, setSearch]       = useState("");
  const [page, setPage]           = useState(1);
  const [formTarget, setFormTarget] = useState<Branch | null | false>(false);
  const [deleteTarget, setDeleteTarget] = useState<Branch | null>(null);
  const [deleting, setDeleting]   = useState(false);
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const notify = useCallback((n: { type: "success" | "error"; message: string }) => {
    setNotification(n);
    setTimeout(() => setNotification(null), 4000);
  }, []);

  const loadBranches = useCallback(async (p: number, q: string) => {
    dispatch({ type: "LOAD_START" });
    try {
      const token = getStoredToken();
      const qs = `?page=${p}&limit=12${q ? `&search=${encodeURIComponent(q)}` : ""}`;
      const res = await get<{ data: { data: Branch[]; meta?: { total: number; pages: number }; pagination?: { total: number; pages: number } } }>(`branches${qs}`, token);
      const payload = (res as unknown as { data: { data: Branch[]; meta?: { total: number; pages: number }; pagination?: { total: number; pages: number } } }).data;
      dispatch({
        type: "LOAD_OK",
        branches: payload.data ?? [],
        total: payload.meta?.total ?? payload.pagination?.total ?? 0,
        pages: payload.meta?.pages ?? payload.pagination?.pages ?? 1,
      });
    } catch {
      dispatch({ type: "LOAD_ERR", error: "تعذّر تحميل الفروع. يرجى المحاولة مجدداً." });
    }
  }, []);

  useEffect(() => { loadBranches(page, search); }, [page, search, loadBranches]);

  const handleFormSubmit = useCallback(async (data: BranchFormData, isNew: boolean): Promise<boolean> => {
    try {
      const token = getStoredToken();
      if (isNew) {
        const res = await post<{ data: Branch }>("branches", data, token);
        dispatch({ type: "ADD", branch: (res as unknown as { data: Branch }).data });
        notify({ type: "success", message: "تم إضافة الفرع بنجاح." });
      } else {
        const res = await put<{ data: Branch }>(`branches/${(formTarget as Branch).id}`, data, token);
        dispatch({ type: "UPDATE", branch: (res as unknown as { data: Branch }).data });
        notify({ type: "success", message: "تم تحديث الفرع بنجاح." });
      }
      return true;
    } catch (err) {
      notify({ type: "error", message: err instanceof Error ? err.message : "تعذّر حفظ الفرع." });
      return false;
    }
  }, [formTarget, notify]);

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const token = getStoredToken();
      await del(`branches/${deleteTarget.id}`, token);
      dispatch({ type: "DELETE", id: deleteTarget.id });
      notify({ type: "success", message: "تم حذف الفرع بنجاح." });
      setDeleteTarget(null);
    } catch (err) {
      notify({ type: "error", message: err instanceof Error ? err.message : "تعذّر حذف الفرع." });
    } finally {
      setDeleting(false);
    }
  }, [deleteTarget, notify]);

  const cardStyle: React.CSSProperties = {
    borderRadius: "var(--radius-xl)", border: "1px solid var(--color-border)",
    background: "var(--color-surface)", overflow: "hidden", boxShadow: "var(--shadow-card)",
  };

  const thStyle: React.CSSProperties = {
    padding: "0.75rem 1.5rem", fontSize: 11, fontWeight: 700,
    textTransform: "uppercase", letterSpacing: "0.2em",
    color: "var(--color-text-muted)", background: "var(--color-surface-muted)",
    borderBottom: "1px solid var(--color-border)",
  };

  return (
    <>
      {notification && <Toast type={notification.type} message={notification.message} />}

      {formTarget !== false && (
        <BranchFormModal
          editBranch={formTarget}
          onClose={() => setFormTarget(false)}
          onSubmit={handleFormSubmit}
        />
      )}

      {deleteTarget && (
        <BranchDeleteModal
          branch={deleteTarget}
          deleting={deleting}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={handleDeleteConfirm}
        />
      )}

      <section style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

        {/* Header */}
        <header style={{ borderRadius: "var(--radius-xl)", border: "1px solid var(--color-border)", background: "var(--color-surface)", padding: "1.5rem 2rem", boxShadow: "var(--shadow-card)" }}>
          <p style={{ fontSize: 11, letterSpacing: "0.3em", textTransform: "uppercase", color: "#2563EB", fontWeight: 600 }}>
            إدارة الفروع
          </p>
          <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--color-text-primary)", margin: 0 }}>الفروع</h1>
              <p style={{ marginTop: "0.25rem", fontSize: 13, color: "var(--color-text-muted)" }}>
                إجمالي <strong style={{ color: "var(--color-text-primary)" }}>{state.total}</strong> فرع
              </p>
            </div>
            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
              <div style={{ position: "relative", width: 256 }}>
                <svg style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", width: 16, height: 16, color: "var(--color-text-hint)", pointerEvents: "none" }}
                  fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                </svg>
                <input type="text" placeholder="بحث بالاسم..." value={search}
                  onChange={e => { setSearch(e.target.value); setPage(1); }} dir="rtl"
                  style={{ width: "100%", height: 40, paddingRight: 36, paddingLeft: 12, borderRadius: "var(--radius-lg)", border: "1px solid var(--color-border)", background: "var(--color-surface)", fontSize: 13, color: "var(--color-text-primary)", outline: "none", fontFamily: "var(--font-sans)" }} />
              </div>
              <button type="button" onClick={() => setFormTarget(null)}
                style={{ height: 40, padding: "0 1.125rem", borderRadius: "var(--radius-lg)", border: "none", background: "var(--color-brand-600)", fontSize: 13, fontWeight: 700, color: "#FFF", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 7, fontFamily: "var(--font-sans)", boxShadow: "0 1px 4px rgba(37,99,235,.35)", whiteSpace: "nowrap" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                إضافة فرع
              </button>
            </div>
          </div>
        </header>

        {state.error && <Alert type="error" message={state.error} onClose={() => dispatch({ type: "CLEAR_ERR" })} />}

        {/* Table */}
        <div style={cardStyle}>
          <div dir="rtl" style={{ display: "grid", gridTemplateColumns: "2fr 2fr 1.5fr 1fr 100px", ...thStyle }}>
            <span>الفرع</span>
            <span>العنوان</span>
            <span>الهاتف</span>
            <span style={{ textAlign: "center" }}>تاريخ الإنشاء</span>
            <span style={{ textAlign: "center" }}>إجراءات</span>
          </div>

          {state.loading ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, padding: "4rem 0", color: "var(--color-text-muted)" }}>
              <Spinner size="sm" className="text-blue-600" />
              <span style={{ fontSize: 13 }}>جارٍ التحميل…</span>
            </div>
          ) : state.branches.length === 0 ? (
            <div style={{ textAlign: "center", padding: "4rem 1rem" }}>
              <p style={{ fontSize: 13, color: "var(--color-text-muted)" }}>
                {search ? `لا توجد نتائج لـ "${search}"` : "لا توجد فروع لعرضها."}
              </p>
              {!search && (
                <button type="button" onClick={() => setFormTarget(null)}
                  style={{ marginTop: 12, fontSize: 13, fontWeight: 600, color: "var(--color-brand-600)", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>
                  أضف أول فرع
                </button>
              )}
            </div>
          ) : (
            <ul dir="rtl" style={{ listStyle: "none", margin: 0, padding: 0 }}>
              {state.branches.map((b, i) => (
                <li key={b.id} style={{
                  display: "grid", gridTemplateColumns: "2fr 2fr 1.5fr 1fr 100px",
                  alignItems: "center", gap: "0.5rem", padding: "0.875rem 1.5rem",
                  borderBottom: "1px solid var(--color-border)",
                  background: i % 2 !== 0 ? "var(--color-surface-muted)" : "transparent",
                  fontSize: 13,
                }}>
                  <div>
                    <p style={{ fontWeight: 600, color: "var(--color-text-primary)", margin: 0 }}>{b.name}</p>
                    <p style={{ marginTop: 2, fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--color-text-muted)" }}>{b.id.slice(0, 8)}…</p>
                  </div>
                  <span style={{ color: "var(--color-text-secondary)" }}>{b.address ?? "—"}</span>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--color-text-secondary)" }}>{b.phone ?? "—"}</span>
                  <span style={{ textAlign: "center", fontSize: 11, color: "var(--color-text-muted)" }}>
                    {new Date(b.createdAt).toLocaleDateString("ar-SA", { year: "numeric", month: "short", day: "numeric" })}
                  </span>
                  <div style={{ display: "flex", justifyContent: "center", gap: 6 }}>
                    <button type="button" title="تعديل" onClick={() => setFormTarget(b)}
                      style={{ width: 32, height: 32, borderRadius: "var(--radius-md)", border: "1px solid #BFDBFE", background: "#EFF6FF", color: "#1D4ED8", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </button>
                    <button type="button" title="حذف" onClick={() => setDeleteTarget(b)}
                      style={{ width: 32, height: 32, borderRadius: "var(--radius-md)", border: "1px solid #FECACA", background: "#FEF2F2", color: "#DC2626", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                        <path d="M10 11v6M14 11v6" /><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                      </svg>
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {state.pages > 1 && (
            <div dir="rtl" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "1px solid var(--color-border)", padding: "0.875rem 1.5rem" }}>
              <span style={{ fontSize: 12, color: "var(--color-text-muted)" }}>
                صفحة <strong style={{ color: "var(--color-text-primary)" }}>{page}</strong> من <strong style={{ color: "var(--color-text-primary)" }}>{state.pages}</strong>
              </span>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                {[
                  { label: "السابق", action: () => setPage(p => Math.max(1, p - 1)), disabled: page === 1 },
                  { label: "التالي", action: () => setPage(p => Math.min(state.pages, p + 1)), disabled: page === state.pages },
                ].map(btn => (
                  <button key={btn.label} onClick={btn.action} disabled={btn.disabled}
                    style={{ borderRadius: "var(--radius-lg)", border: "1px solid var(--color-border)", background: "var(--color-surface-muted)", padding: "0.375rem 0.875rem", fontSize: 12, color: "var(--color-text-secondary)", cursor: btn.disabled ? "not-allowed" : "pointer", opacity: btn.disabled ? 0.4 : 1, fontFamily: "var(--font-sans)" }}>
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