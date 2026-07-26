"use client";

import { useState } from "react";
import { Alert, Input, Modal } from "../../UI";
import { ArchivedOrderTable } from "./ArchivedOrderTable";
import { ArchivedOrderDetailModal } from "./ArchivedOrderDetailModal";
import { useArchivedOrders } from "@/src/hooks/archive/useArchivedOrders";
import type { ArchivedOrder } from "@/src/types/order";

interface ArchivedOrdersModalProps {
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

export function ArchivedOrdersModal({ onClose }: ArchivedOrdersModalProps) {
  const [viewOrder, setViewOrder] = useState<ArchivedOrder | null>(null);

  const {
    orders, loading, total, pages, error,
    page, search,
    setPage, handleSearch, clearError,
  } = useArchivedOrders();

  return (
    <>
      {viewOrder && (
        <ArchivedOrderDetailModal order={viewOrder} onClose={() => setViewOrder(null)} />
      )}

      <Modal
        open
        onClose={onClose}
        size="lg"
        subtitle="الأرشيف"
        title={`الطلبات المؤرشفة (${total})`}
      >
        <div dir="rtl" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {/* search */}
          <div style={{ maxWidth: 320 }}>
            <Input
              label="بحث"
              placeholder="رقم الشحنة أو المستلم..."
              value={search}
              onChange={e => handleSearch(e.target.value)}
              icon={searchIcon}
              dir="rtl"
            />
          </div>

          {error && <Alert type="error" message={error} onClose={clearError} />}

          <ArchivedOrderTable
            orders={orders}
            loading={loading}
            search={search}
            page={page}
            pages={pages}
            onView={order => setViewOrder(order)}
            onPageChange={setPage}
          />
        </div>
      </Modal>
    </>
  );
}