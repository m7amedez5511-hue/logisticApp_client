"use client";

// src/Components/Branch/archive/ArchivedBranchTable.tsx
// MIGRATED to ReusableTable + ActionButtons. View-only, no row click in
// the original.

import { Badge, ReusableTable, ActionButtons } from "../../UI";
import type { TableColumn } from "@/src/types/models";
import type { ArchivedBranch } from "@/src/types/branch";

interface ArchivedBranchTableProps {
  branches: ArchivedBranch[];
  loading: boolean;
  search: string;
  page: number;
  pages: number;
  onView: (branch: ArchivedBranch) => void;
  onPageChange: (p: number) => void;
}

export function ArchivedBranchTable({ branches, loading, search, page, pages, onView, onPageChange }: ArchivedBranchTableProps) {
  const columns: TableColumn<ArchivedBranch>[] = [
    {
      key: "name",
      header: "اسم الفرع",
      width: "2fr",
      render: (b) => (
        <div>
          <p style={{ fontWeight: 600, color: "var(--color-text-primary)", margin: 0 }}>{b.name}</p>
          <p style={{ marginTop: 2, fontSize: 11, color: "var(--color-text-muted)" }}>{b.street}</p>
        </div>
      ),
    },
    { key: "city", header: "المدينة", width: "1.5fr", render: (b) => b.city || "—" },
    {
      key: "status",
      header: "الحالة",
      width: "1fr",
      render: (b) => <Badge label={b.isActive ? "Active" : "Disabled"} color={b.isActive ? "green" : "red"} />,
    },
    {
      key: "createdAt",
      header: "تاريخ الانشاء",
      width: "1fr",
      align: "center",
      render: (b) => new Date(b.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }),
    },
    {
      key: "updatedAt",
      header: "تاريخ التعديل",
      width: "1fr",
      align: "center",
      render: (b) => new Date(b.updatedAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }),
    },
  ];

  return (
    <ReusableTable
      columns={columns}
      data={branches}
      loading={loading}
      search={search}
      page={page}
      pages={pages}
      onPageChange={onPageChange}
      emptyDescription={search ? `No results for "${search}"` : "No archived branches."}
      renderActions={(b) => <ActionButtons itemLabel={b.name} onView={() => onView(b)} />}
    />
  );
}