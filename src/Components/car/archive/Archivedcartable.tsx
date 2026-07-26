"use client";

// src/Components/Car/archive/ArchivedCarTable.tsx
// Converted to use ReusableTable, matching DriverTable / OrderTable /
// AuditTable — previously this was its own hand-rolled cardStyle/thStyle
// grid. Same columns, same view-only action (delete/restore still not
// implemented), same empty/loading text. Row click now also opens the
// view action, same as Driver/Order's onRowClick, in addition to the
// explicit eye icon.

import { IconBtn, ReusableTable } from "../../UI";
import { STATUS_MAP, fmtDateShort } from "@/src/types/car";
import type { TableColumn } from "@/src/types/models";
import type { Car } from "@/src/types/car";

// ── Props ────────────────────────────────────────────────────────────────────
interface ArchivedCarTableProps {
  cars:         Car[];
  loading:      boolean;
  search:       string;
  page:         number;
  pages:        number;
  onView:       (car: Car) => void;
  onPageChange: (p: number) => void;
}

// ── main table ───────────────────────────────────────────────────────────────
export function ArchivedCarTable({ cars, loading, search, page, pages, onView, onPageChange }: ArchivedCarTableProps) {
  const columns: TableColumn<Car>[] = [
    {
      key: "vehicle",
      header: "المركبة",
      width: "2fr",
      render: (c) => (
        <div>
          <p style={{ fontWeight: 600, color: "var(--color-text-primary)", margin: 0 }}>
            {c.manufacturer} {c.model}
          </p>
          <p style={{ marginTop: 2, fontSize: 11, color: "var(--color-text-muted)" }}>
            {c.year}{c.color ? ` · ${c.color}` : ""}
          </p>
        </div>
      ),
    },
    {
      key: "plate",
      header: "رقم اللوحة",
      width: "1.5fr",
      render: (c) => (
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "#2563EB", fontWeight: 600 }}>
          {c.plateLetters} {c.plateNumber}
        </span>
      ),
    },
    { key: "branch", header: "الفرع", width: "1fr", render: (c) => c.branch?.name ?? "—" },
    {
      key: "status",
      header: "آخر حالة",
      width: "1fr",
      render: (c) => {
        const status = STATUS_MAP[c.currentStatus];
        return (
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 5,
            borderRadius: "var(--radius-full)",
            border: `1px solid ${status.border}`,
            background: status.bg,
            padding: "0.2rem 0.625rem",
            fontSize: 11, fontWeight: 700, color: status.color,
            width: "fit-content",
          }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: status.dot }} />
            {status.label}
          </span>
        );
      },
    },
    {
      key: "createdAt",
      header: "تاريخ الإضافة",
      width: "1fr",
      render: (c) => (
        <span style={{ fontSize: 11, color: "var(--color-text-muted)" }}>
          {fmtDateShort(c.createdAt)}
        </span>
      ),
    },
  ];

  return (
    <ReusableTable
      columns={columns}
      data={cars}
      loading={loading}
      search={search}
      page={page}
      pages={pages}
      onPageChange={onPageChange}
      actionsWidth="100px"
      onRowClick={onView}
      emptyDescription={search ? `لا توجد نتائج لـ "${search}"` : "لا توجد مركبات في الأرشيف."}
      renderActions={(c) => (
        // view only — delete/restore not implemented yet
        <IconBtn
          title={`عرض ${c.manufacturer} ${c.model}`}
          color="#059669" bg="#ECFDF5" borderColor="#A7F3D0"
          onClick={() => onView(c)}
        >
          <i className="ti ti-eye" style={{ fontSize: 14 }} aria-hidden="true" />
        </IconBtn>
      )}
    />
  );
}