"use client";

import { useState } from "react";
import { Alert, Input, Modal } from "../../UI";
import { ArchivedUserTable } from "./Archivedusertable";
import { ArchivedUserDetailModal } from "./Archiveduserdetailmodal";
import { useArchivedUsers } from "@/src/hooks/archive/useArchivedUsers";

interface ArchivedUsersModalProps {
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

export function ArchivedUsersModal({ onClose }: ArchivedUsersModalProps) {
  const [viewUserId, setViewUserId] = useState<string | null>(null);

  const {
    users, loading, total, pages, error,
    page, search,
    setPage, handleSearch, clearError,
  } = useArchivedUsers();

  return (
    <>
      {viewUserId && (
        <ArchivedUserDetailModal userId={viewUserId} onClose={() => setViewUserId(null)} />
      )}

      <Modal
        open
        onClose={onClose}
        size="lg"
        subtitle="الأرشيف"
        title={`المستخدمون المؤرشفون (${total})`}
      >
        <div dir="rtl" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div style={{ maxWidth: 320 }}>
            <Input
              label="بحث"
              placeholder="بحث بالاسم أو الهاتف..."
              value={search}
              onChange={e => handleSearch(e.target.value)}
              icon={searchIcon}
              dir="rtl"
            />
          </div>

          {error && <Alert type="error" message={error} onClose={clearError} />}

          <ArchivedUserTable
            users={users}
            loading={loading}
            search={search}
            page={page}
            pages={pages}
            onView={user => setViewUserId(user.id)}
            onPageChange={setPage}
          />
        </div>
      </Modal>
    </>
  );
}