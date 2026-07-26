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
  <i className="ti ti-search" style={{ fontSize: 16 }} aria-hidden="true" />
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