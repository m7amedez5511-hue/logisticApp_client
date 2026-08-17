"use client";

import { useState } from "react";
import { Alert, Toast, ArchiveButton, ConfirmDialog } from "@/src/Components/UI";
import { UserFormModal,UserDetailModal,UserTable }      from "@/src/Components/User";
import { useUsers }           from "@/src/hooks/useUser";
import type { User, UserFormData } from "@/src/types/user";
import { ArchivedUsersModal } from "@/src/Components/User/archive/Archivedusersmodal";
import Header from "@/src/Components/UI/Header";

export default function UsersPage() {
  // ── Modal state ─────────────────────────────────────────────────────────────
  // false = closed | null = create mode | User = edit mode
  const [formTarget,   setFormTarget]   = useState<User | null | false>(false);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  // ID of user whose detail modal is open; null = closed
  const [viewUserId,   setViewUserId]   = useState<string | null>(null);
  // Archive browser modal open/closed
  const [archiveOpen,  setArchiveOpen]  = useState(false);
  // Local submitting flag shown in DeleteConfirmModal spinner
  const [deleting, setDeleting] = useState(false);

  // ── Data hook ───────────────────────────────────────────────────────────────
  const {
    users, loading, total, pages, error,
    roles, branches,
    page, search,
    setPage, handleSearch, clearError,
    createUser, updateUser, deleteUser,
    notification,
  } = useUsers();

  // ── Create / Update handler ─────────────────────────────────────────────────
  const handleFormSubmit = async (data: UserFormData, isNew: boolean): Promise<boolean> => {
    if (isNew) return createUser(data);
    // formTarget is User when editing
    return updateUser((formTarget as User).id, data);
  };

  // ── Delete handler ──────────────────────────────────────────────────────────
  const handleDeleteConfirm = async () => {
    if (!deleteTarget || deleting) return;
    setDeleting(true);

    const ok = await deleteUser(deleteTarget.id);

    setDeleting(false);
    if (ok) setDeleteTarget(null);
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Global success / error toast — fires on create, update, AND delete */}
      <Toast notification={notification} />

      {/* User detail modal */}
      {viewUserId && (
        <UserDetailModal
          userId={viewUserId}
          onClose={() => setViewUserId(null)}
        />
      )}

      {/* Create / Edit modal */}
      {formTarget !== false && (
        <UserFormModal
          // CHANGE: added key — forces a full remount when switching between
          // "new" and different edit targets, so useForm's defaultValues
          // (roleId/branchId included) always reflect the correct user
          // instead of possibly reusing stale state from a previous instance.
          key={formTarget === null ? "new" : formTarget.id}
          editUser={formTarget}
          roles={roles}
          branches={branches}
          onClose={() => setFormTarget(false)}
          onSubmit={handleFormSubmit}
        />
      )}

      {/* Delete confirmation dialog */}
      <ConfirmDialog
        open={!!deleteTarget}
        loading={deleting}
        onCancel={() => { if (!deleting) setDeleteTarget(null); }}
        onConfirm={handleDeleteConfirm}
        title="حذف المستخدم"
        description={`هل أنت متأكد من حذف ${deleteTarget?.name ?? ""}؟ لا يمكن التراجع عن هذا الإجراء.`}
      />

      {/* Archive browser modal */}
      {archiveOpen && (
        <ArchivedUsersModal onClose={() => setArchiveOpen(false)} />
      )}

      <section style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

        {/* ── Page header ── */}
       <Header mainTitle="إدارة المستخدمين"
                title="المستخدمون"
                name="مستخدم"
                state={{ total }}
                search={search}
                setSearch={handleSearch}
                module=""
                setModule={() => {}}
                setPage={setPage}
                isAudit={false}
                onAdd={() => setFormTarget(null)}/>

        {/* General load error */}
        {error && <Alert type="error" message={error} onClose={clearError} />}

        {/* Users table */}
        <UserTable
          users={users}
          loading={loading}
          search={search}
          page={page}
          pages={pages}
          onView={user => setViewUserId(user.id)}
          onEdit={user => setFormTarget(user)}
          onDelete={user => setDeleteTarget(user)}
          onAddFirst={() => setFormTarget(null)}
          onPageChange={setPage}
        />
      </section>

      {/* Floating button to open the archive browser */}
      <ArchiveButton onClick={() => setArchiveOpen(true)} />
    </>
  );
}