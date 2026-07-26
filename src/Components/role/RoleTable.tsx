"use client";

import { Button, ReusableTable, ActionButtons } from "../UI";
import type { TableColumn } from "@/src/types/models";
import type { Role } from "@/src/types/role";

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      borderRadius: "var(--radius-full)",
      border: active ? "1px solid #BBF7D0" : "1px solid #FECACA",
      background: active ? "#DCFCE7" : "#FEF2F2",
      padding: "0.2rem 0.625rem",
      fontSize: 11, fontWeight: 600,
      color: active ? "#166534" : "#991B1B",
    }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: active ? "#16A34A" : "#DC2626" }} />
      {active ? "Active" : "Disabled"}
    </span>
  );
}

interface RoleTableProps {
  roles: Role[];
  loading: boolean;
  search: string;
  page: number;
  pages: number;
  onEdit: (role: Role) => void;
  onDelete: (role: Role) => void;
  onView: (role: Role) => void;
  onAddFirst: () => void;
  onPageChange: (p: number) => void;
}

export function RoleTable({
  roles, loading, search, page, pages,
  onEdit, onDelete, onView, onAddFirst, onPageChange,
}: RoleTableProps) {
  const columns: TableColumn<Role>[] = [
    {
      key: "name",
      header: " الدور",
      width: "2fr",
      render: (r) => <span style={{ fontWeight: 600, color: "var(--color-text-primary)" }}>{r.name}</span>,
    },
    {
      key: "description",
      header: "الوصف",
      width: "3fr",
      render: (r) =>
        r.description || <span style={{ color: "var(--color-text-hint)", fontStyle: "italic" }}>No description</span>,
    },
    {
      key: "permissions",
      header: "الصلحيات",
      width: "1fr",
      render: (r) => (
        <span style={{
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          width: 28, height: 28, borderRadius: "var(--radius-full)",
          background: "#EFF6FF", border: "1px solid #BFDBFE",
          fontSize: 11, fontWeight: 700, color: "#1D4ED8",
        }}>
          {r.permissions?.length ?? 0}
        </span>
      ),
    },
    { key: "status", header: "الحالة", width: "1fr", render: (r) => <StatusBadge active={r.isActive} /> },
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
      actionsWidth="120px"
      emptyIcon="🛡️"
      emptyTitle={search ? undefined : "No roles to display"}
      emptyDescription={!search ? "Start by creating the first role in the system" : undefined}
      emptyAction={
        !search && (
          <Button type="button" variant="ghost" size="sm" onClick={onAddFirst}>
            Add first role
          </Button>
        )
      }
      renderActions={(r) => (
        <ActionButtons
          itemLabel={r.name}
          onView={() => onView(r)}
          onEdit={() => onEdit(r)}
          onDelete={() => onDelete(r)}
        />
      )}
    />
  );
}