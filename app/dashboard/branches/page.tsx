"use client";

import { useState } from "react";
import { Alert, Toast, ArchiveButton ,ConfirmDialog } from "@/src/Components/UI";
import { BranchDetailModal, BranchTable ,BranchFormModal }   from "@/src/Components/Branch";
import { useBranches }         from "@/src/hooks/useBranch";
import type { Branch, BranchFormData } from "@/src/types/branch";
import { ArchivedBranchesModal } from "@/src/Components/Branch/archive/ArchivedBranchesModal";
import Header from "@/src/Components/UI/Header";


export default function BranchesPage() {
  // ── Modal state ─────────────────────────────────────────────────────────────
  // false = closed | null = create mode | Branch = edit mode
  const [formTarget,   setFormTarget]   = useState<Branch | null | false>(false);
  const [deleteTarget, setDeleteTarget] = useState<Branch | null>(null);
  // ID of branch whose detail modal is open; null = closed
  const [viewBranchId, setViewBranchId] = useState<string | null>(null);
  // Archive browser modal open/closed
  const [archiveOpen,  setArchiveOpen]  = useState(false);
  // Local submitting flag shown in DeleteConfirmModal spinner
  const [deleting, setDeleting] = useState(false);

  // ── Data hook ───────────────────────────────────────────────────────────────
  const {
    branches, loading, total, pages, error,
    page, search,
    setPage, handleSearch, clearError,
    createBranch, updateBranch, deleteBranch,
    notification,
  } = useBranches();

  // ── Create / Update handler ─────────────────────────────────────────────────
  const handleFormSubmit = async (data: BranchFormData, isNew: boolean): Promise<boolean> => {
    if (isNew) return createBranch(data);
    // formTarget is Branch when editing
    return updateBranch((formTarget as Branch).id, data);
  };

  // ── Delete handler ──────────────────────────────────────────────────────────
  const handleDeleteConfirm = async () => {
    if (!deleteTarget || deleting) return;
    setDeleting(true);

    const ok = await deleteBranch(deleteTarget.id);

    setDeleting(false);
    if (ok) setDeleteTarget(null);
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Global success / error toast — fires on create, update, AND delete */}
      <Toast notification={notification} />

      {/* Branch detail modal */}
      {viewBranchId && (
        <BranchDetailModal
          branchId={viewBranchId}
          onClose={() => setViewBranchId(null)}
        />
      )}

      {/* Create / Edit modal */}
      {formTarget !== false && (
        <BranchFormModal
          editBranch={formTarget}
          onClose={() => setFormTarget(false)}
          onSubmit={handleFormSubmit}
        />
      )}

      {/* Delete confirmation dialog */}
      <ConfirmDialog
        open={!!deleteTarget}
        loading={deleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="حذف الفرع"
        description={`هل أنت متأكد من حذف الفرع ${deleteTarget?.name ?? ""}؟ لا يمكن التراجع عن هذا الإجراء.`}
      />

      {/* Archive browser modal */}
      {archiveOpen && (
        <ArchivedBranchesModal onClose={() => setArchiveOpen(false)} />
      )}

      <section style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

        {/* ── Page header ── */}
        <Header
          state={{ total }}
          search={search}
          setSearch={handleSearch}
          module=""
          setModule={() => {}}
          title="الفروع"
          mainTitle="إدارة الفروع"
          setPage={setPage}
          name={"فرع"}
          isAudit={false}
          onAdd={() => setFormTarget(null)}
        />

        {/* General load error */}
        {error && <Alert type="error" message={error} onClose={clearError} />}

        {/* Branches table */}
        <BranchTable
          branches={branches}
          loading={loading}
          search={search}
          page={page}
          pages={pages}
          onView={branch => setViewBranchId(branch.id)}
          onEdit={branch => setFormTarget(branch)}
          onDelete={branch => setDeleteTarget(branch)}
          onAddFirst={() => setFormTarget(null)}
          onPageChange={setPage}
        />
      </section>

      {/* Floating button to open the archive browser */}
      <ArchiveButton onClick={() => setArchiveOpen(true)} />
    </>
  );
}