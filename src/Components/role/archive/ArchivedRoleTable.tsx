"use client";

import { ReusableTable, ActionButtons } from "../../UI";
import type { TableColumn } from "@/src/types/models";
import type { ArchivedRole } from "@/src/types/role";

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, borderRadius: "var(--radius-full)", border: active ? "1px solid #BBF7D0" : "1px solid #FECACA", background: active ? "#DCFCE7" : "#FEF2F2", padding: "0.2rem 0.625rem", fontSize: 11, fontWeight: 600, color: active ? "#166534" : "#991B1B" }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: active ? "#16A34A" : "#DC2626" }} />
      {active ? "Active" : "Disabled"}
    </span>
  );
}

interface ArchivedRoleTableProps {
  roles: ArchivedRole[];
  loading: boolean;
  search: string;
  page: number;
  pages: number;
  onView: (role: ArchivedRole) => void;
  onPageChange: (p: number) => void;
}

export function ArchivedRoleTable({ roles, loading, search, page, pages, onView, onPageChange }: ArchivedRoleTableProps) {
  const columns: TableColumn<ArchivedRole>[] = [
    { key: "name", header: "الدور", width: "2fr", render: (r) => <span style={{ fontWeight: 600, color: "var(--color-text-primary)" }}>{r.name}</span> },
    { key: "description", header: "الوصف", width: "2fr", render: (r) => r.description || "—" },
    { key: "status", header: "الحالة", width: "1fr", render: (r) => <StatusBadge active={r.isActive} /> },
    {
      key: "createdAt",
      header: "تاريخ الانشاء",
      width: "1fr",
      align: "center",
      render: (r) => new Date(r.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }),
    },
    {
      key: "updatedAt",
      header: "تاريخ التعديل",
      width: "1fr",
      align: "center",
      render: (r) => new Date(r.updatedAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }),
    },
  ];

  return (
    <ReusableTable
      columns={columns}
      data={roles}
      loading={loading}
      search={search}
      page={page}
      pages={pages}
      onPageChange={onPageChange}
      emptyIcon="🛡️"
      emptyDescription={search ? `No results for "${search}"` : "No archived roles."}
      renderActions={(r) => <ActionButtons itemLabel={r.name} onView={() => onView(r)} />}
    />
  );
}