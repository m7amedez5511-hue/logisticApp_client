"use client";



import { IconBtn, ReusableTable } from "../../UI";
import { fmtDateShort, fmtCost } from "@/src/types/carMaintanance";
import type { TableColumn } from "@/src/types/models";
import type { CarMaintenance } from "@/src/types/carMaintanance";

interface ArchivedCarMaintenanceTableProps {
  records:      CarMaintenance[];
  loading:      boolean;
  search:       string;
  page:         number;
  pages:        number;
  /** Only relevant for the global (cross-car) archive view. */
  showCar?:     boolean;
  onView:       (record: CarMaintenance) => void;
  onPageChange: (p: number) => void;
}

export function ArchivedCarMaintenanceTable({
  records, loading, search, page, pages, showCar = false, onView, onPageChange,
}: ArchivedCarMaintenanceTableProps) {
  const columns: TableColumn<CarMaintenance>[] = [
    {
      key: "reason",
      header: "سبب الصيانة",
      width: "2fr",
      render: (r) => (
        <div>
          <p style={{ fontWeight: 600, color: "var(--color-text-primary)", margin: 0 }}>{r.reason}</p>
          <p style={{ marginTop: 2, fontSize: 11, color: "var(--color-text-muted)" }}>أضيف {fmtDateShort(r.createdAt)}</p>
        </div>
      ),
    },
    // Only shown in the global (cross-car) archive view.
    ...(showCar
      ? [{
          key: "car",
          header: "المركبة",
          width: "1fr",
          render: (r: CarMaintenance) => (
            <span style={{ color: "var(--color-text-secondary)" }}>
              {r.car ? `${r.car.manufacturer} ${r.car.model}` : "—"}
            </span>
          ),
        } as TableColumn<CarMaintenance>]
      : []),
    {
      key: "cost",
      header: "التكلفة",
      width: "1fr",
      render: (r) => (
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "#2563EB", fontWeight: 600 }}>
          {fmtCost(r.cost)}
        </span>
      ),
    },
    { key: "startAt", header: "تاريخ البدء", width: "1fr", render: (r) => (
        <span style={{ color: "var(--color-text-secondary)" }}>{fmtDateShort(r.startAt)}</span>
      ),
    },
    {
      key: "endAt",
      header: "تاريخ الانتهاء",
      width: "1fr",
      render: (r) => (
        <span style={{ fontSize: 12, color: "var(--color-text-muted)" }}>
          {fmtDateShort(r.endAt)}
        </span>
      ),
    },
  ];

  return (
    <ReusableTable
      columns={columns}
      data={records}
      loading={loading}
      search={search}
      page={page}
      pages={pages}
      onPageChange={onPageChange}
      actionsWidth="100px"
      onRowClick={onView}
      emptyDescription={search ? `لا توجد نتائج لـ "${search}"` : "لا توجد سجلات صيانة في الأرشيف."}
      renderActions={(r) => (
        <IconBtn
          title={`عرض ${r.reason}`}
          color="#059669" bg="#ECFDF5" borderColor="#A7F3D0"
          onClick={() => onView(r)}
        >
          <i className="ti ti-eye" style={{ fontSize: 14 }} aria-hidden="true" />
        </IconBtn>
      )}
    />
  );
}