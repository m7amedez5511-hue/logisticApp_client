"use client";



import { ReusableTable, ActionButtons } from "../../UI";
import { DRIVER_STATUS_MAP } from "@/src/types/driver";
import type { TableColumn } from "@/src/types/models";
import type { ArchivedDriver } from "@/src/types/driver";

interface ArchivedDriverTableProps {
  drivers: ArchivedDriver[];
  loading: boolean;
  search: string;
  page: number;
  pages: number;
  onView: (driver: ArchivedDriver) => void;
  onPageChange: (p: number) => void;
}

export function ArchivedDriverTable({ drivers, loading, search, page, pages, onView, onPageChange }: ArchivedDriverTableProps) {
  const columns: TableColumn<ArchivedDriver>[] = [
    {
      key: "name",
      header: "الاسم",
      width: "2fr",
      render: (d) => (
        <div>
          <p style={{ fontWeight: 600, color: "var(--color-text-primary)", margin: 0 }}>{d.name}</p>
          <p style={{ marginTop: 2, fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--color-text-muted)" }}>{d.phone}</p>
        </div>
      ),
    },
    {
      key: "userName",
      header: "اسم السائق",
      width: "1.5fr",
      render: (d) => (
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "#2563EB", fontWeight: 600 }}>{d.userName ?? "—"}</span>
      ),
    },
    {
      key: "status",
      header: "الحالة",
      width: "1fr",
      render: (d) => {
        const s = DRIVER_STATUS_MAP[d.status] ?? DRIVER_STATUS_MAP.Inactive;
        return (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5, borderRadius: "var(--radius-full)", border: `1px solid ${s.border}`, background: s.bg, padding: "0.2rem 0.625rem", fontSize: 11, fontWeight: 600, color: s.color }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: s.dot }} />
            {s.label}
          </span>
        );
      },
    },
    {
      key: "createdAt",
      header: "تاريخ الانشاء",
      width: "1fr",
      align: "center",
      render: (d) => new Date(d.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }),
    },
    {
      key: "updatedAt",
      header: "تاريخ التعديل",
      width: "1fr",
      align: "center",
      render: (d) => new Date(d.updatedAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }),
    },
  ];

  return (
    <ReusableTable
      columns={columns}
      data={drivers}
      loading={loading}
      search={search}
      page={page}
      pages={pages}
      onPageChange={onPageChange}
      onRowClick={onView}
      emptyIcon="🗄️"
      emptyDescription={search ? `No results for "${search}"` : "No archived drivers."}
      renderActions={(d) => <ActionButtons itemLabel={d.name} onView={() => onView(d)} />}
    />
  );
}