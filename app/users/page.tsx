// صفحة إدارة المستخدمين — تستورد فقط من الطبقات الأخرى
"use client";

import { useState } from "react";
import { Alert } from "../../Components/UI";
import { UserTable }         from "../../Components/User/UserTable";
import { UserFormModal }     from "../../Components/User/UserFormModal";
import { DeleteConfirmModal } from "../../Components/User/DeleteConfirmModal";
import { Toast }             from "../../Components/User/Toast";
import { useUsers }          from "../../hooks/useUser";
import type { User, UserFormData } from "../../types/user";

export default function UsersPage() {
  // ── الحالة المحلية للمودالات فقط ─────────────────────────────────────────
  // false = مغلق، null = وضع الإضافة، User = وضع التعديل
  const [formTarget,    setFormTarget]    = useState<User | null | false>(false);
  const [deleteTarget,  setDeleteTarget]  = useState<User | null>(null);
  const [deleting,      setDeleting]      = useState(false);

  // ── كل منطق البيانات والحالة من الهوك ────────────────────────────────────
  const {
    users, loading, total, pages, error,
    roles, branches,
    page, search,
    setPage, handleSearch, clearError,
    createUser, updateUser, deleteUser,
    notification,
  } = useUsers();

  // ── معالج تقديم النموذج (إضافة أو تعديل) ────────────────────────────────
  const handleFormSubmit = async (data: UserFormData, isNew: boolean): Promise<boolean> => {
    if (isNew) return createUser(data);
    return updateUser((formTarget as User).id, data);
  };

  // ── معالج تأكيد الحذف ────────────────────────────────────────────────────
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const ok = await deleteUser(deleteTarget.id);
    setDeleting(false);
    if (ok) setDeleteTarget(null);
  };

  return (
    <>
      {/* ── Toast لعرض رسائل النجاح والخطأ ── */}
      <Toast notification={notification} />

      {/* ── مودال الإضافة / التعديل ── */}
      {formTarget !== false && (
        <UserFormModal
          editUser={formTarget}
          roles={roles}
          branches={branches}
          onClose={() => setFormTarget(false)}
          onSubmit={handleFormSubmit}
        />
      )}

      {/* ── مودال تأكيد الحذف ── */}
      {deleteTarget && (
        <DeleteConfirmModal
          user={deleteTarget}
          deleting={deleting}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={handleDeleteConfirm}
        />
      )}

      <section style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

        {/* ── رأس الصفحة ── */}
        <header style={{
          borderRadius: "var(--radius-xl)", border: "1px solid var(--color-border)",
          background: "var(--color-surface)", padding: "1.5rem 2rem", boxShadow: "var(--shadow-card)",
        }}>
          <p style={{ fontSize: 11, letterSpacing: "0.3em", textTransform: "uppercase", color: "#2563EB", fontWeight: 600 }}>
            إدارة الفريق
          </p>
          <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--color-text-primary)", margin: 0 }}>
                المستخدمون
              </h1>
              <p style={{ marginTop: "0.25rem", fontSize: 13, color: "var(--color-text-muted)" }}>
                إجمالي <strong style={{ color: "var(--color-text-primary)" }}>{total}</strong> مستخدم
              </p>
            </div>

            {/* أدوات البحث وإضافة مستخدم */}
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
              {/* حقل البحث */}
              <div style={{ position: "relative", width: 256 }}>
                <svg style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", width: 16, height: 16, color: "var(--color-text-hint)", pointerEvents: "none" }}
                  fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                </svg>
                <input type="text" placeholder="بحث بالاسم أو الهاتف..." value={search}
                  onChange={e => handleSearch(e.target.value)} dir="rtl"
                  style={{ width: "100%", height: 40, paddingRight: 36, paddingLeft: 12, borderRadius: "var(--radius-lg)", border: "1px solid var(--color-border)", background: "var(--color-surface)", fontSize: 13, outline: "none", fontFamily: "var(--font-sans)" }}
                />
              </div>

              {/* زر إضافة مستخدم */}
              <button type="button" onClick={() => setFormTarget(null)}
                style={{ height: 40, padding: "0 1.125rem", borderRadius: "var(--radius-lg)", border: "none", background: "var(--color-brand-600)", fontSize: 13, fontWeight: 700, color: "#FFF", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 7, fontFamily: "var(--font-sans)", boxShadow: "0 1px 4px rgba(37,99,235,.35)", whiteSpace: "nowrap" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                إضافة مستخدم
              </button>
            </div>
          </div>
        </header>

        {/* ── رسالة الخطأ العامة (فشل التحميل) ── */}
        {error && (
          <Alert type="error" message={error} onClose={clearError} />
        )}

        {/* ── جدول المستخدمين ── */}
        <UserTable
          users={users}
          loading={loading}
          search={search}
          page={page}
          pages={pages}
          onEdit={user => setFormTarget(user)}
          onDelete={user => setDeleteTarget(user)}
          onAddFirst={() => setFormTarget(null)}
          onPageChange={setPage}
        />
      </section>
    </>
  );
}