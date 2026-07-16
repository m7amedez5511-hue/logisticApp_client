"use client";

import { useState } from "react";
import { Alert, Toast, ArchiveButton ,ConfirmDialog } from "@/src/Components/UI";
import { BranchDetailModal, BranchTable ,BranchFormModal }   from "@/src/Components/Branch";
import { useBranches }         from "@/src/hooks/useBranch";
import type { Branch, BranchFormData } from "@/src/types/branch";
import { ArchivedBranchesModal } from "@/src/Components/Branch/archive/ArchivedBranchesModal";


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
        <header style={{
          borderRadius: "var(--radius-xl)",
          border: "1px solid var(--color-border)",
          background: "var(--color-surface)",
          padding: "1.5rem 2rem",
          boxShadow: "var(--shadow-card)",
        }}>
          <p style={{ fontSize: 11, letterSpacing: "0.3em", textTransform: "uppercase", color: "#2563EB", fontWeight: 600 }}>
            إدارة الفروع
          </p>
          <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--color-text-primary)", margin: 0 }}>
                الفروع
              </h1>
              <p style={{ marginTop: "0.25rem", fontSize: 13, color: "var(--color-text-muted)" }}>
                إجمالي <strong style={{ color: "var(--color-text-primary)" }}>{total}</strong> فرع
              </p>
            </div>

            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
              {/* Search input */}
              <div style={{ position: "relative", width: 256 }}>
                <svg style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", width: 16, height: 16, color: "var(--color-text-hint)", pointerEvents: "none" }}
                  fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                </svg>
                <input
                  type="text"
                  placeholder="بحث بالاسم أو المدينة..."
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

              {/* Add branch button */}
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
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                إضافة فرع
              </button>
            </div>
          </div>
        </header>

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