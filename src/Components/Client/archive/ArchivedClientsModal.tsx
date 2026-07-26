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
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
              </svg>
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