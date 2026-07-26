"use client";

import { ReusableTable, ActionButtons } from "../../UI";
import { ORDER_STATUS_MAP } from "../OrderDetailModel";
import type { TableColumn } from "@/src/types/models";
import type { ArchivedOrder } from "@/src/types/order";

function fmtAmount(n?: string | number | null): string {
  if (n == null) return "—";
  const num = typeof n === "string" ? parseFloat(n) : n;
  if (Number.isNaN(num)) return "—";
  return `${num.toFixed(2)} SAR`;
}

interface ArchivedOrderTableProps {
  orders: ArchivedOrder[];
  loading: boolean;
  search: string;
  page: number;
  pages: number;
  onView: (order: ArchivedOrder) => void;
  onPageChange: (p: number) => void;
}

export function ArchivedOrderTable({ orders, loading, search, page, pages, onView, onPageChange }: ArchivedOrderTableProps) {
  const columns: TableColumn<ArchivedOrder>[] = [
    {
      key: "shipmentNumber",
      header: "رقم الشحنة #",
      width: "1.6fr",
      render: (o) => <span style={{ fontWeight: 600, fontFamily: "var(--font-mono)", color: "#2563EB" }}>{o.shipmentNumber}</span>,
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
    {
      key: "amount",
      header: "الكمية",
      width: "1fr",
      render: (o) => <span style={{ fontWeight: 600, fontFamily: "var(--font-mono)", color: "var(--color-text-primary)" }}>{fmtAmount(o.subTotal)}</span>,
    },
    {
      key: "status",
      header: "الحالة",
      width: "1fr",
      render: (o) => {
        const s = ORDER_STATUS_MAP[o.currentStatus] ?? ORDER_STATUS_MAP.Created;
        return (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5, borderRadius: "var(--radius-full)", border: `1px solid ${s.border}`, background: s.bg, padding: "0.2rem 0.625rem", fontSize: 11, fontWeight: 600, color: s.color, width: "fit-content" }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: s.dot }} />
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
      onPageChange={onPageChange}
      emptyIcon="🗄️"
      emptyDescription={search ? `No results for "${search}"` : "No archived orders."}
      renderActions={(o) => <ActionButtons itemLabel={o.shipmentNumber} onView={() => onView(o)} />}
    />
  );
}