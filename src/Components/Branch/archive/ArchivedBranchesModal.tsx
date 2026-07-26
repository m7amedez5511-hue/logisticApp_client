"use client";

import { useState } from "react";
import { Alert, Input, Modal } from "../../UI";
import { ArchivedBranchTable } from "./ArchivedBranchTable";
import { ArchivedBranchDetailModal } from "./ArchivedBranchDetailModal";
import { useArchivedBranches } from "@/src/hooks/archive/useArchiveBranch";
import type { ArchivedBranch } from "@/src/types/branch";

interface ArchivedBranchesModalProps {
  onClose: () => void;
}

const SearchIcon = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
  </svg>
);

export function ArchivedBranchesModal({ onClose }: ArchivedBranchesModalProps) {
  // hold the full object, not just the id — no GET /branches/archived/{id} route exists
  const [viewBranch, setViewBranch] = useState<ArchivedBranch | null>(null);

  const {
    branches, loading, total, pages, error,
    page, search,
    setPage, handleSearch, clearError,
  } = useArchivedBranches();

  return (
    <>
      <Modal
        open
        onClose={onClose}
        size="lg"
        subtitle="الأرشيف"
        title={`الفروع المؤرشفة (${total})`}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {/* search */}
          <div dir="rtl" style={{ maxWidth: 320 }}>
            <Input
              label="بحث"
              placeholder="بحث بالاسم أو المدينة..."
              value={search}
              onChange={e => handleSearch(e.target.value)}
              dir="rtl"
              icon={SearchIcon}
            />
          </div>

          {/* general fetch error — fallback UI */}
          {error && <Alert type="error" message={error} onClose={clearError} />}

          <ArchivedBranchTable
            branches={branches}
            loading={loading}
            search={search}
            page={page}
            pages={pages}
            onView={branch => setViewBranch(branch)}
            onPageChange={setPage}
          />
        </div>
      </Modal>

      {/* Rendered after the list modal so it stacks visually on top of it
          (both use the shared Modal's fixed full-screen overlay at the same
          z-index — later in the DOM wins the paint order). */}
      {viewBranch && (
        <ArchivedBranchDetailModal branch={viewBranch} onClose={() => setViewBranch(null)} />
      )}
    </>
  );
}