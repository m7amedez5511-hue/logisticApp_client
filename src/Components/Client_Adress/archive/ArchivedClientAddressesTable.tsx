"use client";


import { Badge, IconBtn, ReusableTable } from "../../UI";
import type { TableColumn } from "@/src/types/models";
import type { ArchivedClientAddress } from "@/src/types/client_adresses";


type Row = ArchivedClientAddress & { id: string };

// ── Props ────────────────────────────────────────────────────────────────────
interface ArchivedClientAddressesTableProps {
  addresses: ArchivedClientAddress[];
  loading:   boolean;
  search:    string;
  onView:    (address: ArchivedClientAddress) => void;
}

// ── main table — no pagination footer: the endpoint returns the full set ─────
export function ArchivedClientAddressesTable({ addresses, loading, search, onView }: ArchivedClientAddressesTableProps) {
  const rows: Row[] = addresses.map((a) => ({ ...a, id: a._id }));

  const columns: TableColumn<Row>[] = [
    {
      key: "type",
      header: "النوع",
      width: "1.5fr",
      render: (a) => (
        <div>
          <p style={{ fontWeight: 600, color: "var(--color-text-primary)", margin: 0 }}>{a.label}</p>
          {a.branchName && (
            <p style={{ marginTop: 2, fontSize: 11, color: "var(--color-text-muted)" }}>{a.branchName}</p>
          )}
        </div>
      ),
    },
    {
      key: "address",
      header: "العنوان",
      width: "2fr",
      render: (a) => (
        <span style={{ color: "var(--color-text-secondary)" }}>
          {a.details.street}، {a.details.city}
        </span>
      ),
    },
    {
      key: "contact",
      header: "جهة الاتصال",
      width: "1.2fr",
      render: (a) => (
        <span style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>
          {a.contactPerson?.name ?? "—"}
        </span>
      ),
    },
    {
      key: "status",
      header: "الحالة",
      width: "1fr",
      render: (a) => (
        <Badge
          label={a.isValidated ? "موثّق" : "غير موثّق"}
          color={a.isValidated ? "green" : "slate"}
        />
      ),
    },
    {
      key: "createdAt",
      header: "تاريخ الإنشاء",
      width: "1fr",
      render: (a) => (
        <span style={{ fontSize: 11, color: "var(--color-text-muted)" }}>
          {new Date(a.createdAt).toLocaleDateString("ar-SA", { year: "numeric", month: "short", day: "numeric" })}
        </span>
      ),
    },
  ];

  return (
    <ReusableTable
      columns={columns}
      data={rows}
      loading={loading}
      search={search}
      page={1}
      pages={1}
      onPageChange={() => {}}
      actionsWidth="100px"
      onRowClick={onView}
      emptyDescription={search ? `لا توجد نتائج لـ "${search}"` : "لا توجد عناوين في الأرشيف."}
      renderActions={(a) => (
        // view only — matches archived users/clients: no delete/restore yet
        <IconBtn
          title={`عرض ${a.label}`}
          color="#059669" bg="#ECFDF5" borderColor="#A7F3D0"
          onClick={() => onView(a)}
        >
          <i className="ti ti-eye" style={{ fontSize: 14 }} aria-hidden="true" />
        </IconBtn>
      )}
    />
  );
}