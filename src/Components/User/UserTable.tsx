"use client";

import { Badge, ReusableTable, ActionButtons, Button } from "@/src/Components/UI";
import type { TableColumn } from "@/src/types/models";
import type { User } from "@/src/types/user";

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        borderRadius: "var(--radius-full)",
        border: active ? "1px solid #BBF7D0" : "1px solid #FECACA",
        background: active ? "#DCFCE7" : "#FEF2F2",
        padding: "0.2rem 0.625rem",
        fontSize: 11,
        fontWeight: 600,
        color: active ? "#166534" : "#991B1B",
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: active ? "#16A34A" : "#DC2626" }} />
      {active ? "Active" : "Disabled"}
    </span>
  );
}

interface UserTableProps {
  users: User[];
  loading: boolean;
  search: string;
  page: number;
  pages: number;
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
  onView: (user: User) => void;
  onAddFirst: () => void;
  onPageChange: (p: number) => void;
}

export function UserTable({
  users, loading, search, page, pages,
  onEdit, onDelete, onView, onAddFirst, onPageChange,
}: UserTableProps) {
  const columns: TableColumn<User>[] = [
    {
      key: "name",
      header: "الاسم",
      width: "2fr",
      render: (u) => (
        <div>
          <p style={{ fontWeight: 600, color: "var(--color-text-primary)", margin: 0 }}>{u.name}</p>
          <p style={{ marginTop: 2, fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--color-text-muted)" }}>
            {u.phone}
          </p>
        </div>
      ),
    },
    {
      key: "userName",
      header: "اسم المستخدم",
      width: "1.5fr",
      render: (u) => (
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "#2563EB", fontWeight: 600 }}>
          {u.userName ?? "—"}
        </span>
      ),
    },
    { key: "branch", header: "الفرع", width: "1.5fr", render: (u) => u.branch?.name ?? "—" },
    {
      key: "role",
      header: "الدور",
      width: "1fr",
      render: (u) => <Badge label={u.role?.name ?? "—"} color={u.role?.name === "System Admin" ? "indigo" : "slate"} />,
    },
    { key: "status", header: "الحالة", width: "1fr", render: (u) => <StatusBadge active={u.isActive} /> },
    {
      key: "createdAt",
      header: "تم الانشاء",
      width: "1fr",
      align: "center",
      render: (u) => new Date(u.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }),
    },
  ];

  return (
    <ReusableTable
      columns={columns}
      data={users}
      loading={loading}
      search={search}
      page={page}
      pages={pages}
      onPageChange={onPageChange}
      emptyIcon="👥"
      emptyDescription={!search ? "No users to display." : undefined}
      emptyAction={
        !search && (
          <Button type="button" variant="ghost" size="sm" onClick={onAddFirst}>
            Add first user
          </Button>
        )
      }
      renderActions={(u) => (
        <ActionButtons
          itemLabel={u.name}
          onView={() => onView(u)}
          onEdit={() => onEdit(u)}
          onDelete={() => onDelete(u)}
        />
      )}
    />
  );
}