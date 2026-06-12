"use client";
// app/roles/page.tsx
// Roles management page — full CRUD for user roles and permissions.
// Mirrors the architecture of app/users/page.tsx exactly.

import { useState } from "react";
import { Alert } from "../../Components/UI";
import { RoleTable }        from "../../Components/role/RoleTable";
import { RoleFormModal }    from "../../Components/role/RoleFormModal";
import { DeleteRoleModal }  from "../../Components/role/DeleteRoleModal";
import { RoleToast }        from "../../Components/role/RoleToast";
import { useRoles }         from "../../hooks/useRole";
import type { Role, RoleFormData } from "../../services/role.service";

export default function RolesPage() {
  // ── Modal state ────────────────────────────────────────────────────────────
  // false = closed | null = create mode | Role = edit mode
  const [formTarget,   setFormTarget]   = useState<Role | null | false>(false);
  const [deleteTarget, setDeleteTarget] = useState<Role | null>(null);
  const [deleting,     setDeleting]     = useState(false);

  // ── Data hook ──────────────────────────────────────────────────────────────
  const {
    roles, loading, total, pages, error,
    permissions,
    page, search,
    setPage, handleSearch, clearError,
    createRole, updateRole, deleteRole,
    notification,
  } = useRoles();

  // ── Form submit: create or update ─────────────────────────────────────────
  const handleFormSubmit = async (data: RoleFormData, currentPermIds: string[]): Promise<boolean> => {
  if (formTarget === null) {
    return createRole(data);
  }
  return updateRole((formTarget as Role).id, data, currentPermIds);
};
  

  // ── Delete confirm ─────────────────────────────────────────────────────────
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const ok = await deleteRole(deleteTarget.id);
    setDeleting(false);
    if (ok) setDeleteTarget(null);
  };

  return (
    <>
      {/* Notifications */}
      <RoleToast notification={notification} />

      {/* Create / Edit modal */}
      {formTarget !== false && (
        <RoleFormModal
          editRole={formTarget}
          permissions={permissions}
          onClose={() => setFormTarget(false)}
          onSubmit={handleFormSubmit}
        />
      )}

      {/* Delete confirmation */}
      {deleteTarget && (
        <DeleteRoleModal
          role={deleteTarget}
          deleting={deleting}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={handleDeleteConfirm}
        />
      )}

      <section style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

        {/* ── Page header ── */}
        <header style={{
          borderRadius: "var(--radius-xl)",
          border: "1px solid var(--color-border)",
          background: "var(--color-surface)",
          padding: "1.5rem 2rem",
          boxShadow: "var(--shadow-card)",
        }}>
          <p style={{
            fontSize: 11, letterSpacing: "0.3em",
            textTransform: "uppercase", color: "#2563EB", fontWeight: 600,
          }}>
            إدارة الصلاحيات
          </p>

          <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 style={{
                fontSize: "1.5rem", fontWeight: 700,
                color: "var(--color-text-primary)", margin: 0,
              }}>
                الأدوار والصلاحيات
              </h1>
              <p style={{ marginTop: "0.25rem", fontSize: 13, color: "var(--color-text-muted)" }}>
                إجمالي{" "}
                <strong style={{ color: "var(--color-text-primary)" }}>{total}</strong>{" "}
                دور مُعرَّف
              </p>
            </div>

            {/* Search + Add button */}
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>

              {/* Search field */}
              <div style={{ position: "relative", width: 256 }}>
                <svg
                  style={{
                    position: "absolute", right: 12, top: "50%",
                    transform: "translateY(-50%)",
                    width: 16, height: 16,
                    color: "var(--color-text-hint)", pointerEvents: "none",
                  }}
                  fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"
                >
                  <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                </svg>
                <input
                  type="text"
                  placeholder="بحث باسم الدور…"
                  value={search}
                  onChange={e => handleSearch(e.target.value)}
                  dir="rtl"
                  style={{
                    width: "100%", height: 40,
                    paddingRight: 36, paddingLeft: 12,
                    borderRadius: "var(--radius-lg)",
                    border: "1px solid var(--color-border)",
                    background: "var(--color-surface)",
                    fontSize: 13, outline: "none",
                    fontFamily: "var(--font-sans)",
                    color: "var(--color-text-primary)",
                  }}
                />
              </div>

              {/* Add role button */}
              <button
                type="button"
                onClick={() => setFormTarget(null)}
                style={{
                  height: 40, padding: "0 1.125rem",
                  borderRadius: "var(--radius-lg)",
                  border: "none",
                  background: "var(--color-brand-600)",
                  fontSize: 13, fontWeight: 700,
                  color: "#FFF",
                  cursor: "pointer",
                  display: "inline-flex", alignItems: "center", gap: 7,
                  fontFamily: "var(--font-sans)",
                  boxShadow: "0 1px 4px rgba(37,99,235,.35)",
                  whiteSpace: "nowrap",
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="12" y1="5" x2="12" y2="19"/>
                  <line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                إضافة دور
              </button>
            </div>
          </div>
        </header>

        {/* ── Permission info banner ── */}
        {permissions.length > 0 && (
          <div style={{
            borderRadius: "var(--radius-lg)",
            border: "1px solid var(--color-brand-200)",
            background: "var(--color-brand-50)",
            padding: "0.75rem 1.25rem",
            display: "flex", alignItems: "center", gap: 10,
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" style={{ flexShrink: 0 }}>
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <p style={{ fontSize: 12, color: "#1E3A8A", margin: 0 }}>
              يتضمن النظام <strong>{permissions.length}</strong> صلاحية موزَّعة على{" "}
              <strong>{[...new Set(permissions.map(p => p.module))].length}</strong> وحدة.
              يمكن تعيين أي منها عند إنشاء الدور أو تعديله.
            </p>
          </div>
        )}

        {/* ── Error alert ── */}
        {error && <Alert type="error" message={error} onClose={clearError} />}

        {/* ── Roles table ── */}
        <RoleTable
          roles={roles}
          loading={loading}
          search={search}
          page={page}
          pages={pages}
          onEdit={role => setFormTarget(role)}
          onDelete={role => setDeleteTarget(role)}
          onAddFirst={() => setFormTarget(null)}
          onPageChange={setPage}
        />
      </section>
    </>
  );
}