"use client";

import { useState } from "react";
import { Alert, ArchiveButton, ConfirmDialog,Toast } from "@/src/Components/UI";
import { RoleTable }       from "@/src/Components/role/RoleTable";
import { RoleFormModal,RoleDetailModal }   from "@/src/Components/role";
import { useRoles }        from "@/src/hooks/useRole";
import { Role, RoleFormData } from "@/src/types/role";
import { ArchivedRolesModal } from "@/src/Components/role/archive/ArchivedRolesModal";
import Header from "@/src/Components/UI/Header";


export default function RolesPage() {
  // ── Modal state ──────────────────────────────────────────────────────────────
  // false = closed | null = create | Role = edit
  const [formTarget,   setFormTarget]   = useState<Role | null | false>(false);
  const [deleteTarget, setDeleteTarget] = useState<Role | null>(null);
  const [viewRoleId,   setViewRoleId]   = useState<string | null>(null);
  const [deleting,     setDeleting]     = useState(false);
  // Archive browser modal open/closed
  const [archiveOpen,  setArchiveOpen]  = useState(false);

  // ── Data hook ────────────────────────────────────────────────────────────────
  const {
    roles, loading, total, pages, error,
    permissions,
    page, search,
    setPage, handleSearch, clearError,
    createRole, updateRole, deleteRole,
    assignPermission, removePermission,
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
          permissions={permissions}
          onClose={() => setViewRoleId(null)}
          onAssign={assignPermission}
          onRemove={removePermission}
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
      <ConfirmDialog
        open={!!deleteTarget}
        loading={deleting}
        onCancel={() => { if (!deleting) setDeleteTarget(null); }}
        onConfirm={handleDeleteConfirm}
        title="حذف الدور"
        description={`هل أنت متأكد من حذف دور ${deleteTarget?.name ?? ""}؟ لا يمكن التراجع عن هذا الإجراء.`}
      />

      {/* Archive browser modal */}
      {archiveOpen && (
        <ArchivedRolesModal onClose={() => setArchiveOpen(false)} />
      )}

      <section style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

        {/* Page header */}
        <Header mainTitle="إدارة الادوار"
                 title="الادوار"
                 name="دور"
                 state={{ total }}
                 search={search}
                 setSearch={handleSearch}
                 module=""
                 setModule={() => {}}
                 setPage={setPage}
                 isAudit={false}
                 onAdd={() => setFormTarget(null)}/>

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

      {/* Floating button to open the archive browser */}
      <ArchiveButton onClick={() => setArchiveOpen(true)} />
    </>
  );
}