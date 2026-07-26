"use client";

import { useState } from "react";
import { Alert, Input, Modal } from "../../UI";
import { ArchivedRoleTable } from "./ArchivedRoleTable";
import { ArchivedRoleDetailModal } from "./ArchivedRoleDetailModal";
import { useArchivedRoles } from "@/src/hooks/archive/useArchiveRole";

interface ArchivedRolesModalProps {
  onClose: () => void;
}

const searchIcon = (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    aria-hidden="true"
  >
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.35-4.35" />
  </svg>
);

export function ArchivedRolesModal({ onClose }: ArchivedRolesModalProps) {
  const [viewRoleId, setViewRoleId] = useState<string | null>(null);

  const {
    roles, loading, total, pages, error,
    page, search,
    setPage, handleSearch, clearError,
  } = useArchivedRoles();

  return (
    <>
      {viewRoleId && (
        <ArchivedRoleDetailModal roleId={viewRoleId} onClose={() => setViewRoleId(null)} />
      )}

      <Modal
        open
        onClose={onClose}
        size="lg"
        subtitle="الأرشيف"
        title={`الأدوار المؤرشفة (${total})`}
      >
        <div dir="rtl" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {/* search — client-side, since /role/archived has no search param */}
          <div style={{ maxWidth: 320 }}>
            <Input
              label="بحث"
              placeholder="بحث باسم الدور..."
              value={search}
              onChange={e => handleSearch(e.target.value)}
              icon={searchIcon}
              dir="rtl"
            />
          </div>

          {/* general fetch error — fallback UI */}
          {error && <Alert type="error" message={error} onClose={clearError} />}

          <ArchivedRoleTable
            roles={roles}
            loading={loading}
            search={search}
            page={page}
            pages={pages}
            onView={role => setViewRoleId(role.id)}
            onPageChange={setPage}
          />
        </div>
      </Modal>
    </>
  );
}