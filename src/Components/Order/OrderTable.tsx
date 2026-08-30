"use client";

import { ReusableTable, ActionButtons } from "../UI";
import { ORDER_STATUS_MAP } from "./OrderDetailModel";
import type { TableColumn } from "@/src/types/models";
import type { Order } from "@/src/types/order";

function fmtDate(iso?: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

function fmtAmount(n?: number | null): string {
  if (n == null) return "—";
  return `${n.toFixed(2)} SAR`;
}

interface OrderTableProps {
  orders: Order[];
  loading: boolean;
  search: string;
  page: number;
  pages: number;
  setPage: React.Dispatch<React.SetStateAction<number>>;
  onRowClick: (orderId: string) => void;
  onEdit: (order: Order) => void;
  onDelete: (order: Order) => void;
}

export function OrderTable({
  orders, loading, search, page, pages,
  setPage, onRowClick, onEdit, onDelete,
}: OrderTableProps) {
  const columns: TableColumn<Order>[] = [
    {
      key: "shipmentNumber",
      header: "رقم الشحنة #",
      width: "1.6fr",
      render: (o) => (
        <div>
          <p style={{ fontWeight: 600, fontFamily: "var(--font-mono)", color: "#2563EB", margin: 0 }}>{o.shipmentNumber}</p>
          <p style={{ marginTop: 2, fontSize: 11, color: "var(--color-text-muted)" }}>{fmtDate(o.createdAt)}</p>
        </div>
      ),
    },
    {
      key: "recipient",
      header: "المستلم",
      width: "1.6fr",
      render: (o) => (
        <div>
          <p style={{ fontWeight: 600, color: "var(--color-text-primary)", margin: 0 }}>{o.recipientName}</p>
          <p style={{ marginTop: 2, fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--color-text-muted)" }}>{o.recipientPhone}</p>
        </div>
      ),
    },
    { key: "client", header: "العميل", width: "1.2fr", render: (o) => o.clientId ?? "—" },
    {
      key: "amount",
      header: "الكمية",
      width: "1.1fr",
      render: (o) => (
        <span style={{ fontWeight: 600, color: "var(--color-text-primary)", fontFamily: "var(--font-mono)" }}>
          {o.quantity ?? "—"}
        </span>
      ),
    },
    {
      key: "status",
      header: "الحالة",
      width: "1fr",
      render: (o) => {
        const s = ORDER_STATUS_MAP[o.currentStatus] ?? ORDER_STATUS_MAP.Created;
        return (
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 5,
            borderRadius: "var(--radius-full)",
            border: `1px solid ${s.border}`,
            background: s.bg,
            padding: "0.2rem 0.625rem",
            fontSize: 11, fontWeight: 600, color: s.color,
            width: "fit-content",
          }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: s.dot, flexShrink: 0 }} />
            {s.label}
          </span>
        );
      },
    },
  ];

  return (
    <ReusableTable
      columns={columns}
      data={orders}
      loading={loading}
      search={search}
      page={page}
      pages={pages}
      onPageChange={setPage}
      actionsWidth="0.8fr"
      onRowClick={(o) => onRowClick(o.id)}
      emptyDescription={search ? `No results for "${search}"` : undefined}
      renderActions={(o) => (
        <ActionButtons
          itemLabel={o.shipmentNumber}
          onEdit={() => onEdit(o)}
          onDelete={() => onDelete(o)}
        />
      )}
    />
  );
}