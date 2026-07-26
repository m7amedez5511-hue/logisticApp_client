"use client";

// src/Components/Client/archive/ArchivedClientTable.tsx
// MIGRATED to ReusableTable + ActionButtons. View-only, no row click in
// the original.

import { Badge, ReusableTable, ActionButtons } from "../../UI";
import type { TableColumn } from "@/src/types/models";
import type { ArchivedClient } from "@/src/types/client";

interface ArchivedClientTableProps {
  clients: ArchivedClient[];
  loading: boolean;
  search: string;
  page: number;
  pages: number;
  onView: (client: ArchivedClient) => void;
  onPageChange: (p: number) => void;
}

export function ArchivedClientTable({ clients, loading, search, page, pages, onView, onPageChange }: ArchivedClientTableProps) {
  const columns: TableColumn<ArchivedClient>[] = [
    {
      key: "name",
      header: "اسم العميل",
      width: "2fr",
      render: (c) => (
        <div>
          <p style={{ fontWeight: 600, color: "var(--color-text-primary)", margin: 0 }}>{c.name}</p>
          <p style={{ marginTop: 2, fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--color-text-muted)" }}>{c.phone}</p>
        </div>
      ),
    },
    {
      key: "email",
      header: "البريد الالكتروني",
      width: "1.5fr",
      render: (c) => <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "#2563EB", fontWeight: 600 }}>{c.email}</span>,
    },
    {
      key: "status",
      header: "الحالة",
      width: "1fr",
      render: (c) => <Badge label={c.isActive ? "Active" : "Disabled"} color={c.isActive ? "green" : "red"} />,
    },
    {
      key: "createdAt",
      header: "تاريخ الانشاء",
      width: "1fr",
      align: "center",
      render: (c) => new Date(c.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }),
    },
    {
      key: "updatedAt",
      header: "تاريخ التعديل",
      width: "1fr",
      align: "center",
      render: (c) => new Date(c.updatedAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }),
    },
  ];

  return (
    <ReusableTable
      columns={columns}
      data={clients}
      loading={loading}
      search={search}
      page={page}
      pages={pages}
      onPageChange={onPageChange}
      emptyIcon="👥"
      emptyDescription={search ? `No results for "${search}"` : "No archived clients."}
      renderActions={(c) => <ActionButtons itemLabel={c.name} onView={() => onView(c)} />}
    />
  );
}