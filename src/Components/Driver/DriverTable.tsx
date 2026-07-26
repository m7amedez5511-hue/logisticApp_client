"use client";

// src/Components/Driver/DriverTable.tsx
// NEW — previously this table was written inline inside
// app/dashboard/drivers/page.tsx (the only model whose table wasn't
// already split into its own component). Extracted here using
// ReusableTable + ActionButtons, matching every other *Table.tsx in the
// project. Same columns, same warn-highlighting for expiring
// license/national-ID dates, same row-click-to-view / edit+delete icons
// behavior as the original inline version.
//
// Integration: in app/dashboard/drivers/page.tsx, replace the entire
// `<div style={cardStyle}>...</div>` table block (and its `fmtDate` /
// `expirySoon` / `cardStyle` / `thStyle` / `ROW_GRID_COLUMNS` /
// `iconBtnBase` helpers, now unused) with:
//
//   <DriverTable
//     drivers={drivers}
//     loading={loading}
//     search={search}
//     page={page}
//     pages={pages}
//     onPageChange={setPage}
//     onRowClick={(d) => setSelectedDriverId(d.id)}
//     onEdit={handleEdit}
//     onDelete={handleDelete}
//   />

import { ReusableTable, ActionButtons } from "../UI";
import { DRIVER_STATUS_MAP } from "@/src/types/driver";
import type { TableColumn } from "@/src/types/models";
import type { Driver } from "@/src/types/driver";

function fmtDate(iso?: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

function expirySoon(iso?: string | null): boolean {
  if (!iso) return false;
  return (new Date(iso).getTime() - Date.now()) / 86_400_000 <= 90;
}

interface DriverTableProps {
  drivers: Driver[];
  loading: boolean;
  search: string;
  page: number;
  pages: number;
  onPageChange: (p: number) => void;
  onRowClick: (driver: Driver) => void;
  onEdit: (driver: Driver) => void;
  onDelete: (driver: Driver) => void;
}

export function DriverTable({
  drivers, loading, search, page, pages,
  onPageChange, onRowClick, onEdit, onDelete,
}: DriverTableProps) {
  const columns: TableColumn<Driver>[] = [
    {
      key: "name",
      header: "السائقين",
      width: "2fr",
      render: (d) => (
        <div>
          <p style={{ fontWeight: 600, color: "var(--color-text-primary)", margin: 0 }}>{d.name}</p>
          <p style={{ marginTop: 2, fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--color-text-muted)" }}>{d.phone}</p>
        </div>
      ),
    },
    { key: "branch", header: "الفرع", width: "1.2fr", render: (d) => d.branch?.name ?? "—" },
    { key: "nationality", header: "الجنسية", width: "1fr", render: (d) => d.nationality ?? "—" },
    {
      key: "licenseExpiry",
      header: "تاريخ انتهاء الرخصة",
      width: "1.1fr",
      render: (d) => {
        const warn = expirySoon(d.licenseExpiry);
        return (
          <span style={{ fontSize: 12, fontWeight: warn ? 600 : 400, color: warn ? "#D97706" : "var(--color-text-secondary)" }}>
            {warn && "⚠ "}{fmtDate(d.licenseExpiry)}
          </span>
        );
      },
    },
    {
      key: "nationalIdExpiry",
      header: "تاريخ انتهاء الهوية الوطنية",
      width: "1.1fr",
      render: (d) => {
        const idExpiry = (d as Driver & { nationalIdExpiry?: string }).nationalIdExpiry;
        const warn = expirySoon(idExpiry);
        return (
          <span style={{ fontSize: 12, fontWeight: warn ? 600 : 400, color: warn ? "#D97706" : "var(--color-text-secondary)" }}>
            {warn && "⚠ "}{fmtDate(idExpiry)}
          </span>
        );
      },
    },
    {
      key: "status",
      header: "الحالة",
      width: "1fr",
      render: (d) => {
        const s = DRIVER_STATUS_MAP[d.status] ?? DRIVER_STATUS_MAP.Inactive;
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
      data={drivers}
      loading={loading}
      search={search}
      page={page}
      pages={pages}
      onPageChange={onPageChange}
      actionsWidth="0.8fr"
      onRowClick={onRowClick}
      emptyDescription={search ? `No results for "${search}"` : undefined}
      renderActions={(d) => (
        <ActionButtons
          itemLabel={d.name}
          onEdit={() => onEdit(d)}
          onDelete={() => onDelete(d)}
        />
      )}
    />
  );
}