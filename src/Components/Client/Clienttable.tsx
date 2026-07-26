"use client";

// src/Components/Client/Clienttable.tsx
// MIGRATED to ReusableTable — this is the one table in the project with
// extra behavior (a click-to-expand detail panel below the row), so it
// relies on ReusableTable's `renderExpanded` prop (added specifically to
// cover this case) instead of the plain `renderActions`/`onRowClick` pair
// every other table uses. AddressBadge and ClientDetailPanel are kept
// exactly as in the original — purpose-built layouts with no shared-UI
// equivalent, same rationale as the original file's comments.

import { IconBtn, ReusableTable, Button } from "../UI";
import type { TableColumn } from "@/src/types/models";
import type { Client } from "@/src/types/client";

// ── Address count badge ────────────────────────────────────────────────────
function AddressBadge({
  count,
  onClick,
}: {
  count: number;
  onClick: () => void;
}) {
  const hasAddr = count > 0;
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      title="ادارة العناوين"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        borderRadius: "var(--radius-full)",
        border: hasAddr ? "1px solid #BFDBFE" : "1px solid var(--color-border)",
        background: hasAddr ? "#EFF6FF" : "var(--color-surface-muted)",
        padding: "0.2rem 0.625rem",
        fontSize: 11,
        fontWeight: 600,
        color: hasAddr ? "#1D4ED8" : "var(--color-text-muted)",
        cursor: "pointer",
        fontFamily: "var(--font-sans)",
        transition: "opacity 150ms",
      }}
    >
      {count} {count === 1 ? "address" : "العناوين"}
      <i className="ti ti-chevron-right" style={{ fontSize: 10 }} aria-hidden="true" />
    </button>
  );
}

// ── Client detail panel (the expandable content) ───────────────────────────
function ClientDetailPanel({
  client,
  onGoAddresses,
  onEdit,
}: {
  client: Client;
  onGoAddresses: () => void;
  onEdit: () => void;
}) {
  const infoItem = (label: string, value: React.ReactNode) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <span
        style={{
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: "0.15em",
          textTransform: "uppercase",
          color: "var(--color-text-muted)",
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: 13,
          color: "var(--color-text-primary)",
          fontWeight: 500,
          wordBreak: "break-word",
        }}
      >
        {value || <span style={{ color: "var(--color-text-hint)" }}>—</span>}
      </span>
    </div>
  );

  return (
    <div
      style={{
        borderInlineStart: "3px solid var(--color-brand-600)",
        background: "linear-gradient(135deg, #EFF6FF 0%, #F0F9FF 100%)",
        borderBottom: "1px solid #BFDBFE",
        padding: "1.25rem 1.5rem",
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
        animation: "detailFadeIn 180ms ease",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: "1rem",
          flexWrap: "wrap",
        }}
      >
        <div>
          <h3
            style={{
              margin: 0,
              fontSize: 16,
              fontWeight: 700,
              color: "var(--color-text-primary)",
            }}
          >
            {client.name}
          </h3>
          {client.taxId && (
            <code
              style={{
                marginTop: 2,
                display: "block",
                fontSize: 11,
                background: "#DBEAFE",
                border: "1px solid #BFDBFE",
                borderRadius: "var(--radius-sm)",
                padding: "0.1rem 0.4rem",
                color: "#1E40AF",
                width: "fit-content",
              }}
            >
              {client.taxId}
            </code>
          )}
        </div>

        <div style={{ display: "flex", gap: "0.5rem", flexShrink: 0 }}>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
          >
            <i className="ti ti-edit" style={{ fontSize: 12 }} aria-hidden="true" />
            تعديل التفاصيل
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onGoAddresses();
            }}
          >
            <i className="ti ti-map-pin" style={{ fontSize: 12 }} aria-hidden="true" />
            العناوين
            {client.addresses?.length !== undefined && (
              <span
                style={{
                  background: "rgba(255,255,255,0.25)",
                  borderRadius: "var(--radius-full)",
                  padding: "0 5px",
                  fontSize: 10,
                  minWidth: 16,
                  textAlign: "center",
                }}
              >
                {client.addresses.length}
              </span>
            )}
          </Button>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
          gap: "1rem",
          paddingTop: "0.75rem",
          borderTop: "1px solid #BFDBFE",
        }}
      >
        {infoItem(
          "البريد الالكتروني",
          <a
            href={`mailto:${client.email}`}
            onClick={(e) => e.stopPropagation()}
            style={{ color: "#2563EB", textDecoration: "none" }}
          >
            {client.email}
          </a>,
        )}
        {infoItem("رقم الجوال", client.phone)}
        {infoItem(
          "تاريخ الانشاء",
          new Date(client.createdAt).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          }),
        )}
        {infoItem(
          "اخر تحديث",
          new Date(client.updatedAt).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          }),
        )}
        {client.notes && infoItem("Notes", client.notes)}
      </div>

      <style>{`
        @keyframes detailFadeIn {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

// ── Props ──────────────────────────────────────────────────────────────────
interface ClientTableProps {
  clients: Client[];
  loading: boolean;
  search: string;
  page: number;
  pages: number;
  onEdit: (client: Client) => void;
  onDelete: (client: Client) => void;
  onAddFirst: () => void;
  onPageChange: (p: number) => void;
  onManageAddresses: (client: Client) => void;
}

// ── Main table ─────────────────────────────────────────────────────────────
export function ClientTable({
  clients,
  loading,
  search,
  page,
  pages,
  onEdit,
  onDelete,
  onAddFirst,
  onPageChange,
  onManageAddresses,
}: ClientTableProps) {
  const columns: TableColumn<Client>[] = [
    {
      key: "name",
      header: "اسم العميل",
      width: "2fr",
      render: (c, _i, isExpanded) => (
        <div>
          <p
            style={{
              fontWeight: 600,
              color: "var(--color-text-primary)",
              margin: 0,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            {c.name}
            <i
              className="ti ti-chevron-right"
              aria-hidden="true"
              style={{
                fontSize: 12,
                flexShrink: 0,
                color: "var(--color-text-muted)",
                transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)",
                transition: "transform 200ms",
                display: "inline-block",
              }}
            />
          </p>
          {c.taxId && (
            <p
              style={{
                marginTop: 2,
                fontFamily: "var(--font-mono)",
                fontSize: 11,
                color: "var(--color-text-muted)",
              }}
            >
              {c.taxId}
            </p>
          )}
        </div>
      ),
    },
    {
      key: "email",
      header: "البريد الالكتروني",
      width: "1.5fr",
      render: (c) => (
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 12,
            color: "#2563EB",
            fontWeight: 600,
          }}
        >
          {c.email}
        </span>
      ),
    },
    {
      key: "phone",
      header: "رقم الجوال",
      width: "1.5fr",
      render: (c) => (
        <span style={{ color: "var(--color-text-secondary)" }}>{c.phone}</span>
      ),
    },
    {
      key: "addresses",
      header: "العناوين",
      width: "1fr",
      render: (c) => (
        <AddressBadge
          count={c.addresses?.length ?? 0}
          onClick={() => onManageAddresses(c)}
        />
      ),
    },
    {
      key: "createdAt",
      header: "تاريخ الانشاء",
      width: "1fr",
      align: "center",
      render: (c) => (
        <span style={{ fontSize: 11, color: "var(--color-text-muted)" }}>
          {new Date(c.createdAt).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
          })}
        </span>
      ),
    },
  ];

  return (
    <ReusableTable
      columns={columns}
      data={clients}
      loading={loading}
      search={search}
      page={page}
      pages={pages}
      onPageChange={onPageChange}
      actionsWidth="80px"
      emptyIcon="👥"
      emptyTitle={
        search ? `No results for "${search}"` : "No clients to display."
      }
      emptyAction={
        !search && (
          <Button type="button" variant="ghost" size="sm" onClick={onAddFirst}>
            Add first client
          </Button>
        )
      }
      renderActions={(c) => (
        <>
          <IconBtn
            title={`Edit ${c.name}`}
            color="#1D4ED8"
            bg="#EFF6FF"
            borderColor="#BFDBFE"
            onClick={() => onEdit(c)}
          >
            <i className="ti ti-edit" style={{ fontSize: 14 }} aria-hidden="true" />
          </IconBtn>
          <IconBtn
            title={`Delete ${c.name}`}
            color="#DC2626"
            bg="#FEF2F2"
            borderColor="#FECACA"
            onClick={() => onDelete(c)}
          >
            <i className="ti ti-trash" style={{ fontSize: 14 }} aria-hidden="true" />
          </IconBtn>
        </>
      )}
      renderExpanded={(c) => (
        <ClientDetailPanel
          client={c}
          onGoAddresses={() => onManageAddresses(c)}
          onEdit={() => onEdit(c)}
        />
      )}
    />
  );
}