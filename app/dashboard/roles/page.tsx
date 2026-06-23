"use client";

import { useState } from "react";
import { Alert } from "@/src/Components/UI";
import { RoleTable }       from "@/src/Components/role/RoleTable";
import { RoleFormModal }   from "@/src/Components/role/RoleFormModal";
import { RoleDetailModal } from "@/src/Components/role/RoleDetailModal";
import { DeleteRoleModal } from "@/src/Components/role/DeleteRoleModal";
import { RoleToast }       from "@/src/Components/role/RoleToast";
import { useRoles }        from "@/src/hooks/useRole";
import type { Role, RoleFormData } from "@/src/services/role.service";

export default function RolesPage() {
  const {
    roles, loading, total, pages, error,
    permissions,
    page, search,
    setPage, handleSearch, clearError,
    createRole, updateRole, deleteRole,
    updateRolePermissionsBulk,
    notification,
  } = useRoles();

  // false = closed | null = create mode | Role = edit mode
  const [formTarget,   setFormTarget]   = useState<Role | null | false>(false);
  const [viewTarget,   setViewTarget]   = useState<Role | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Role | null>(null);
  const [deleting,     setDeleting]     = useState(false);

  const handleFormSubmit = async (
    data: RoleFormData,
    currentPermIds: string[],
  ): Promise<boolean> => {
    if (formTarget === null) {
      return createRole(data);
    }
    return updateRole((formTarget as Role).id, data, currentPermIds);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget || deleting) return;
    setDeleting(true);
    const ok = await deleteRole(deleteTarget.id);
    setDeleting(false);
    if (ok) setDeleteTarget(null);
  };

  const handleSavePermissions = async (
    roleId: string,
    permissionIds: string[],
  ): Promise<boolean> => {
    return updateRolePermissionsBulk(roleId, permissionIds);
  };

  return (
    <>
      <RoleToast notification={notification} />

      {formTarget !== false && (
        <RoleFormModal
          editRole={formTarget}
          permissions={permissions}
          onClose={() => setFormTarget(false)}
          onSubmit={handleFormSubmit}
        />
      )}

      {viewTarget && (
        <RoleDetailModal
          role={viewTarget}
          allPermissions={permissions}
          onClose={() => setViewTarget(null)}
          onSave={handleSavePermissions}
        />
      )}

      {deleteTarget && (
        <DeleteRoleModal
          role={deleteTarget}
          deleting={deleting}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={handleDeleteConfirm}
        />
      )}

      <section style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

        {/* Header */}
        <header style={{
          borderRadius: "var(--radius-xl)", border: "1px solid var(--color-border)",
          background: "var(--color-surface)", padding: "1.5rem 2rem", boxShadow: "var(--shadow-card)",
        }}>
          <p style={{ fontSize: 11, letterSpacing: "0.3em", textTransform: "uppercase", color: "#2563EB", fontWeight: 600 }}>
            إدارة الصلاحيات
          </p>
          <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--color-text-primary)", margin: 0 }}>
                الأدوار والصلاحيات
              </h1>
              <p style={{ marginTop: "0.25rem", fontSize: 13, color: "var(--color-text-muted)" }}>
                إجمالي <strong style={{ color: "var(--color-text-primary)" }}>{total}</strong> دور
              </p>
            </div>
            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
              <div style={{ position: "relative", width: 256 }}>
                <svg style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", width: 16, height: 16, color: "var(--color-text-hint)", pointerEvents: "none" }}
                  fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                </svg>
                <input type="text" placeholder="بحث بالاسم…" value={search}
                  onChange={e => handleSearch(e.target.value)} dir="rtl"
                  style={{ width: "100%", height: 40, paddingRight: 36, paddingLeft: 12, borderRadius: "var(--radius-lg)", border: "1px solid var(--color-border)", background: "var(--color-surface)", fontSize: 13, color: "var(--color-text-primary)", outline: "none", fontFamily: "var(--font-sans)" }} />
              </div>
              <button type="button" onClick={() => setFormTarget(null)}
                style={{ height: 40, padding: "0 1.125rem", borderRadius: "var(--radius-lg)", border: "none", background: "var(--color-brand-600)", fontSize: 13, fontWeight: 700, color: "#FFF", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 7, fontFamily: "var(--font-sans)", boxShadow: "0 1px 4px rgba(37,99,235,.35)", whiteSpace: "nowrap" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                إضافة دور
              </button>
            </div>
          </div>
        </header>

        {error && <Alert type="error" message={error} onClose={clearError} />}

        <RoleTable
          roles={roles}
          loading={loading}
          search={search}
          page={page}
          pages={pages}
          onView={role => setViewTarget(role)}
          onEdit={role => setFormTarget(role)}
          onDelete={role => setDeleteTarget(role)}
          onAddFirst={() => setFormTarget(null)}
          onPageChange={setPage}
        />
      </section>
    </>
  );
}