"use client";

import { useState } from "react";
import { Alert, Input, Modal } from "../../UI";
import { ArchivedClientTable } from "./ArchivedClientTable";
import { ArchivedClientDetailModal } from "./ArchivedClientDetailModal";
import { useArchivedClients } from "@/src/hooks/archive/useArchivedClients";

interface ArchivedClientsModalProps {
  onClose: () => void;
}

export function ArchivedClientsModal({ onClose }: ArchivedClientsModalProps) {
  const [viewClientId, setViewClientId] = useState<string | null>(null);

  const {
    clients, loading, total, pages, error,
    page, search,
    setPage, handleSearch, clearError,
  } = useArchivedClients();

  return (
    <Modal
      open
      title={`العملاء المؤرشفون (${total})`}
      subtitle="الأرشيف"
      onClose={onClose}
      size="lg"
    >
      {viewClientId && (
        <ArchivedClientDetailModal clientId={viewClientId} onClose={() => setViewClientId(null)} />
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {/* search */}
        <div style={{ maxWidth: 320 }}>
          <Input
            label="بحث"
            type="text"
            placeholder="بحث بالاسم أو البريد الإلكتروني..."
            value={search}
            onChange={e => handleSearch(e.target.value)}
            dir="rtl"
            icon={
              <i className="ti ti-search" style={{ fontSize: 16 }} aria-hidden="true" />
            }
          />
        </div>

        {error && <Alert type="error" message={error} onClose={clearError} />}

        <ArchivedClientTable
          clients={clients}
          loading={loading}
          search={search}
          page={page}
          pages={pages}
          onView={client => setViewClientId(client.id)}
          onPageChange={setPage}
        />
      </div>
    </Modal>
  );
}