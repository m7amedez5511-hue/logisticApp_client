"use client";

// src/Components/Branch/BranchTable.tsx
// MIGRATED to ReusableTable + ActionButtons — same props, same visual
// result as the original hand-rolled version. No changes required in
// app/dashboard/branches/page.tsx.

import { Badge, Button, ReusableTable, ActionButtons } from "../UI";
import type { TableColumn } from "@/src/types/models";
import type { Branch } from "@/src/types/branch";

interface BranchTableProps {
  branches: Branch[];
  loading: boolean;
  search: string;
  page: number;
  pages: number;
  onEdit: (branch: Branch) => void;
  onDelete: (branch: Branch) => void;
  onView: (branch: Branch) => void;
  onAddFirst: () => void;
  onPageChange: (p: number) => void;
}

export function BranchTable({
  branches, loading, search, page, pages,
  onEdit, onDelete, onView, onAddFirst, onPageChange,
}: BranchTableProps) {
  const columns: TableColumn<Branch>[] = [
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
      key: "phone",
      header: "رقم الجوال",
      width: "1.5fr",
      render: (b) => (
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--color-text-secondary)" }}>
          {b.phone ?? "—"}
        </span>
      ),
    },
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
      render: (b) =>
        new Date(b.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }),
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
      emptyIcon="🏢"
      emptyDescription={!search ? "No branches to display." : undefined}
      emptyAction={
        !search && (
          <Button type="button" variant="ghost" size="sm" onClick={onAddFirst}>
            Add first branch
          </Button>
        )
      }
      renderActions={(b) => (
        <ActionButtons
          itemLabel={b.name}
          onView={() => onView(b)}
          onEdit={() => onEdit(b)}
          onDelete={() => onDelete(b)}
        />
      )}
    />
  );
}