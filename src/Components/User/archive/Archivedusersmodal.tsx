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
  <i className="ti ti-search" style={{ fontSize: 16 }} aria-hidden="true" />
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