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
  <i className="ti ti-search" style={{ fontSize: 16 }} aria-hidden="true" />
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