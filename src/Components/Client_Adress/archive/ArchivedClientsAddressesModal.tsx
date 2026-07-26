"use client";

import { useState } from "react";
import { Alert, Input, Modal } from "../../UI";
import { ArchivedClientAddressesTable } from "./ArchivedClientAddressesTable";
import { ArchivedClientAddressesDetailModal } from "./ArchivedClientAddressesDetailModal";
import { useArchivedClientAddresses } from "@/src/hooks/archive/useArchiveClientAdresses";
import type { ArchivedClientAddress } from "@/src/types/client_adresses";

interface ArchivedClientsAddressesModalProps {
  onClose: () => void;
  /** Optional — scopes the archive to a single client's addresses.
   *  Pass the current clientId when opened from a client's addresses page;
   *  omit to browse the full cross-client archive. */
  clientId?: string;
}

export function ArchivedClientsAddressesModal({ onClose, clientId }: ArchivedClientsAddressesModalProps) {
  const [viewAddress, setViewAddress] = useState<ArchivedClientAddress | null>(null);

  const {
    addresses, total, loading, error, search,
    handleSearch, clearError,
  } = useArchivedClientAddresses(clientId);

  return (
    <Modal
      open
      title={`العناوين المؤرشفة (${total})`}
      subtitle="الأرشيف"
      onClose={onClose}
      size="lg"
    >
      {viewAddress && (
        <ArchivedClientAddressesDetailModal address={viewAddress} onClose={() => setViewAddress(null)} />
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {/* search — client-side only: this endpoint has no server-side search/pagination */}
        <div style={{ maxWidth: 320 }}>
          <Input
            label="بحث"
            type="text"
            placeholder="بحث بالنوع أو المدينة أو الفرع..."
            value={search}
            onChange={e => handleSearch(e.target.value)}
            dir="rtl"
            icon={
              <i className="ti ti-search" style={{ fontSize: 16 }} aria-hidden="true" />
            }
          />
        </div>

        {error && <Alert type="error" message={error} onClose={clearError} />}

        <ArchivedClientAddressesTable
          addresses={addresses}
          loading={loading}
          search={search}
          onView={setViewAddress}
        />
      </div>
    </Modal>
  );
}