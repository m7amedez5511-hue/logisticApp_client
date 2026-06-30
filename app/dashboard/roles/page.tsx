"use client";

import { useState } from "react";
import { Alert } from "@/src/Components/UI";
import { RoleTable }       from "@/src/Components/role/RoleTable";
import { RoleFormModal }   from "@/src/Components/role/RoleFormModal";
import { RoleDetailModal } from "@/src/Components/role/RoleDetailModal";
import { DeleteRoleModal } from "@/src/Components/role/DeleteRoleModal";
import { Toast }       from "@/src/Components/UI";
import { useRoles }        from "@/src/hooks/useRole";
import { Role, RoleFormData } from "@/src/types/role";

export default function RolesPage() {
  // ── Modal state ──────────────────────────────────────────────────────────────
  // false = closed | null = create | Role = edit
  const [formTarget,   setFormTarget]   = useState<Role | null | false>(false);
  const [deleteTarget, setDeleteTarget] = useState<Role | null>(null);
  const [viewRoleId,   setViewRoleId]   = useState<string | null>(null);
  const [deleting,     setDeleting]     = useState(false);

  // ── Data hook ────────────────────────────────────────────────────────────────
  const {
    roles, loading, total, pages, error,
    permissions,
    page, search,
    setPage, handleSearch, clearError,
    createRole, updateRole, deleteRole,
    notification,
  } = useRoles();

  // ── Create / Update ──────────────────────────────────────────────────────────
  const handleFormSubmit = async (data: RoleFormData, isNew: boolean): Promise<boolean> => {
    if (isNew) return createRole(data);
    const currentPermIds = (formTarget as Role)?.permissions?.map(p => p.permission.id) ?? [];
    return updateRole((formTarget as Role).id, data, currentPermIds);
  };

  // ── Delete ───────────────────────────────────────────────────────────────────
  const handleDeleteConfirm = async () => {
    if (!deleteTarget || deleting) return;
    setDeleting(true);
    const ok = await deleteRole(deleteTarget.id);
    setDeleting(false);
    if (ok) setDeleteTarget(null);
  };

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Toast notifications */}
      <Toast notification={notification} />

      {/* Detail modal */}
      {viewRoleId && (
        <RoleDetailModal
          roleId={viewRoleId}
          onClose={() => setViewRoleId(null)}
        />
      )}

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
          onCancel={() => { if (!deleting) setDeleteTarget(null); }}
          onConfirm={handleDeleteConfirm}
        />
      )}

      <section style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

        {/* Page header */}
        <header style={{
          borderRadius: "var(--radius-xl)",
          border: "1px solid var(--color-border)",
          background: "var(--color-surface)",
          padding: "1.5rem 2rem",
          boxShadow: "var(--shadow-card)",
        }}>
          <p style={{ fontSize: 11, letterSpacing: "0.3em", textTransform: "uppercase", color: "#2563EB", fontWeight: 600 }}>
            إدارة الصلاحيات
          </p>
          <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--color-text-primary)", margin: 0 }}>
                الأدوار
              </h1>
              <p style={{ marginTop: "0.25rem", fontSize: 13, color: "var(--color-text-muted)" }}>
                إجمالي <strong style={{ color: "var(--color-text-primary)" }}>{total}</strong> دور
              </p>
            </div>

            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
              {/* Search */}
              <div style={{ position: "relative", width: 240 }}>
                <svg style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", width: 16, height: 16, color: "var(--color-text-hint)", pointerEvents: "none" }}
                  fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                </svg>
                <input
                  type="text"
                  placeholder="بحث باسم الدور..."
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
                  fontSize: 13, fontWeight: 700, color: "#FFF",
                  cursor: "pointer",
                  display: "inline-flex", alignItems: "center", gap: 7,
                  fontFamily: "var(--font-sans)",
                  boxShadow: "0 1px 4px rgba(37,99,235,.35)",
                  whiteSpace: "nowrap",
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                إضافة دور
              </button>
            </div>
          </div>
        </header>

        {/* Error alert */}
        {error && <Alert type="error" message={error} onClose={clearError} />}

        {/* Roles table */}
        <RoleTable
          roles={roles}
          loading={loading}
          search={search}
          page={page}
          pages={pages}
          onView={role => setViewRoleId(role.id)}
          onEdit={role => setFormTarget(role)}
          onDelete={role => setDeleteTarget(role)}
          onAddFirst={() => setFormTarget(null)}
          onPageChange={setPage}
        />
      </section>
    </>
  );
}