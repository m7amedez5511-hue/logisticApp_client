"use client";


import { useState } from "react";
import { Spinner } from "../UI";
import type { Client } from "@/src/types/client";

// ── Address count badge ────────────────────────────────────────────────────
function AddressBadge({ count, onClick }: { count: number; onClick: () => void }) {
  const hasAddr = count > 0;
  return (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      title="إدارة العناوين"
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
      {count} {count === 1 ? "عنوان" : "عناوين"}
      {/* Small arrow icon to hint navigation */}
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <path d="M9 18l6-6-6-6" />
      </svg>
    </button>
  );
}

// ── Status badge ───────────────────────────────────────────────────────────
function StatusBadge({ active }: { active?: boolean }) {
  const isActive = active !== false;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        borderRadius: "var(--radius-full)",
        border: isActive ? "1px solid #BBF7D0" : "1px solid #FECACA",
        background: isActive ? "#DCFCE7" : "#FEF2F2",
        padding: "0.2rem 0.625rem",
        fontSize: 11,
        fontWeight: 600,
        color: isActive ? "#166534" : "#991B1B",
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: isActive ? "#16A34A" : "#DC2626",
        }}
      />
      {isActive ? "نشط" : "غير نشط"}
    </span>
  );
}

// ── Icon button ────────────────────────────────────────────────────────────
function IconBtn({
  onClick,
  title,
  color,
  bg,
  borderColor,
  children,
}: {
  onClick: () => void;
  title: string;
  color: string;
  bg: string;
  borderColor: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      style={{
        width: 32,
        height: 32,
        borderRadius: "var(--radius-md)",
        border: `1px solid ${borderColor}`,
        background: bg,
        color,
        cursor: "pointer",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "opacity 150ms",
      }}
    >
      {children}
    </button>
  );
}

// ── Client detail panel (inline expandable) ────────────────────────────────
/**
 * ClientDetailPanel — shown below the clicked row.
 * Displays all client fields (name, email, phone, taxId, notes, createdAt)
 * and provides a direct link to the addresses sub-page.
 *
 * @param client         The client whose details are rendered.
 * @param onGoAddresses  Callback that navigates to /dashboard/clients/[id]/addresses.
 * @param onEdit         Opens the edit modal for this client.
 */
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
      dir="rtl"
      style={{
        /* Slide-down visual treatment: left accent border in brand blue */
        borderRight: "3px solid var(--color-brand-600)",
        background: "linear-gradient(135deg, #EFF6FF 0%, #F0F9FF 100%)",
        borderBottom: "1px solid #BFDBFE",
        padding: "1.25rem 1.5rem",
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
        animation: "detailFadeIn 180ms ease",
      }}
    >
      {/* ── Top row: name + quick actions ── */}
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

        {/* Action buttons */}
        <div style={{ display: "flex", gap: "0.5rem", flexShrink: 0 }}>
          {/* Edit client */}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onEdit(); }}
            style={{
              height: 32,
              padding: "0 0.875rem",
              borderRadius: "var(--radius-md)",
              border: "1px solid #BFDBFE",
              background: "#EFF6FF",
              fontSize: 12,
              fontWeight: 600,
              color: "#1D4ED8",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              fontFamily: "var(--font-sans)",
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
            تعديل البيانات
          </button>

          {/*
           * "Addresses" button — KEY FEATURE:
           * Navigates to /dashboard/clients/[clientId]/addresses
           */}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onGoAddresses(); }}
            style={{
              height: 32,
              padding: "0 0.875rem",
              borderRadius: "var(--radius-md)",
              border: "none",
              background: "var(--color-brand-600)",
              fontSize: 12,
              fontWeight: 700,
              color: "#FFF",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              fontFamily: "var(--font-sans)",
              boxShadow: "0 1px 4px rgba(37,99,235,.3)",
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
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
          </button>
        </div>
      </div>

      {/* ── Info grid ── */}
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
          "البريد الإلكتروني",
          <a
            href={`mailto:${client.email}`}
            onClick={(e) => e.stopPropagation()}
            style={{ color: "#2563EB", textDecoration: "none" }}
          >
            {client.email}
          </a>,
        )}
        {infoItem("الهاتف", client.phone)}
        {infoItem(
          "تاريخ الإضافة",
          new Date(client.createdAt).toLocaleDateString("ar-SA", {
            year: "numeric",
            month: "long",
            day: "numeric",
          }),
        )}
        {infoItem(
          "آخر تحديث",
          new Date(client.updatedAt).toLocaleDateString("ar-SA", {
            year: "numeric",
            month: "long",
            day: "numeric",
          }),
        )}
        {client.notes && infoItem("ملاحظات", client.notes)}
      </div>

      {/* Keyframe animation injected via a style tag (scoped) */}
      <style>{`
        @keyframes detailFadeIn {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

// ── Shared card & header styles ────────────────────────────────────────────
const cardStyle: React.CSSProperties = {
  borderRadius: "var(--radius-xl)",
  border: "1px solid var(--color-border)",
  background: "var(--color-surface)",
  overflow: "hidden",
  boxShadow: "var(--shadow-card)",
};

const thStyle: React.CSSProperties = {
  padding: "0.75rem 1.5rem",
  fontSize: 11,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.2em",
  color: "var(--color-text-muted)",
  background: "var(--color-surface-muted)",
  borderBottom: "1px solid var(--color-border)",
};

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
  /** Navigate to address management for a client */
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
  /**
   * expandedId — tracks which client row is currently expanded.
   * Clicking the same row again collapses it (toggle behaviour).
   */
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleRowClick = (client: Client) => {
    // Toggle: collapse if already open, expand otherwise
    setExpandedId((prev) => (prev === client.id ? null : client.id));
  };

  return (
    <div style={cardStyle}>
      {/* Column headers */}
      <div
        dir="rtl"
        style={{
          display: "grid",
          gridTemplateColumns: "2fr 1.5fr 1.5fr 1fr 1fr 80px",
          ...thStyle,
        }}
      >
        <span>العميل</span>
        <span>البريد الإلكتروني</span>
        <span>الهاتف</span>
        <span>العناوين</span>
        <span style={{ textAlign: "center" }}>تاريخ الإضافة</span>
        <span style={{ textAlign: "center" }}>إجراءات</span>
      </div>

      {/* Loading */}
      {loading ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 12,
            padding: "4rem 0",
            color: "var(--color-text-muted)",
          }}
        >
          <Spinner size="sm" className="text-blue-600" />
          <span style={{ fontSize: 13 }}>جارٍ التحميل…</span>
        </div>
      ) : clients.length === 0 ? (
        /* Empty state */
        <div style={{ textAlign: "center", padding: "4rem 1rem" }}>
          <p style={{ fontSize: 13, color: "var(--color-text-muted)" }}>
            {search
              ? `لا توجد نتائج لـ "${search}"`
              : "لا يوجد عملاء لعرضهم."}
          </p>
          {!search && (
            <button
              type="button"
              onClick={onAddFirst}
              style={{
                marginTop: 12,
                fontSize: 13,
                fontWeight: 600,
                color: "var(--color-brand-600)",
                background: "none",
                border: "none",
                cursor: "pointer",
                textDecoration: "underline",
              }}
            >
              أضف أول عميل
            </button>
          )}
        </div>
      ) : (
        /* Data rows */
        <ul dir="rtl" style={{ listStyle: "none", margin: 0, padding: 0 }}>
          {clients.map((c, i) => {
            const isExpanded = expandedId === c.id;
            return (
              <li key={c.id}>
                {/* ── Main row ── */}
                <div
                  role="button"
                  tabIndex={0}
                  aria-expanded={isExpanded}
                  aria-label={`${c.name} — انقر لعرض التفاصيل`}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") handleRowClick(c);
                  }}
                  onClick={() => handleRowClick(c)}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "2fr 1.5fr 1.5fr 1fr 1fr 80px",
                    alignItems: "center",
                    gap: "0.5rem",
                    padding: "0.875rem 1.5rem",
                    borderBottom: isExpanded
                      ? "none"
                      : "1px solid var(--color-border)",
                    /* Highlight the expanded row with a brand-tinted background */
                    background: isExpanded
                      ? "#EFF6FF"
                      : i % 2 !== 0
                      ? "var(--color-surface-muted)"
                      : "transparent",
                    /* Left accent border when expanded (RTL: border-right in visual) */
                    borderRight: isExpanded
                      ? "3px solid var(--color-brand-600)"
                      : "3px solid transparent",
                    fontSize: 13,
                    cursor: "pointer",
                    transition: "background 120ms, border-color 120ms",
                    outline: "none",
                  }}
                >
                  {/* Name */}
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
                      {/* Chevron indicator — rotates when expanded */}
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        style={{
                          flexShrink: 0,
                          color: "var(--color-text-muted)",
                          transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)",
                          transition: "transform 200ms",
                        }}
                      >
                        <path d="M9 18l6-6-6-6" />
                      </svg>
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

                  {/* Email */}
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

                  {/* Phone */}
                  <span style={{ color: "var(--color-text-secondary)" }}>
                    {c.phone}
                  </span>

                  {/*
                   * Address count badge — clicking it navigates directly to
                   * /dashboard/clients/[clientId]/addresses (bypasses the detail panel).
                   */}
                  <AddressBadge
                    count={c.addresses?.length ?? 0}
                    onClick={() => onManageAddresses(c)}
                  />

                  {/* Created at */}
                  <span
                    style={{
                      textAlign: "center",
                      fontSize: 11,
                      color: "var(--color-text-muted)",
                    }}
                  >
                    {new Date(c.createdAt).toLocaleDateString("ar-SA", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </span>

                  {/* Row action buttons */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      gap: 6,
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <IconBtn
                      title={`تعديل ${c.name}`}
                      color="#1D4ED8"
                      bg="#EFF6FF"
                      borderColor="#BFDBFE"
                      onClick={() => onEdit(c)}
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </IconBtn>
                    <IconBtn
                      title={`حذف ${c.name}`}
                      color="#DC2626"
                      bg="#FEF2F2"
                      borderColor="#FECACA"
                      onClick={() => onDelete(c)}
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                        <path d="M10 11v6M14 11v6" />
                        <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                      </svg>
                    </IconBtn>
                  </div>
                </div>

                {/*
                 * ── Expandable detail panel ──
                 * Rendered inline below the row when isExpanded is true.
                 * Contains full client metadata + "العناوين" navigation button.
                 *
                 * TEST: Click any row → panel slides in with client details.
                 *       Click "العناوين" → router.push to /dashboard/clients/[id]/addresses.
                 *       Click same row again → panel collapses.
                 */}
                {isExpanded && (
                  <ClientDetailPanel
                    client={c}
                    onGoAddresses={() => onManageAddresses(c)}
                    onEdit={() => onEdit(c)}
                  />
                )}
              </li>
            );
          })}
        </ul>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <div
          dir="rtl"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderTop: "1px solid var(--color-border)",
            padding: "0.875rem 1.5rem",
          }}
        >
          <span style={{ fontSize: 12, color: "var(--color-text-muted)" }}>
            صفحة{" "}
            <strong style={{ color: "var(--color-text-primary)" }}>{page}</strong>{" "}
            من{" "}
            <strong style={{ color: "var(--color-text-primary)" }}>{pages}</strong>
          </span>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            {[
              {
                label: "السابق",
                action: () => onPageChange(Math.max(1, page - 1)),
                disabled: page === 1,
              },
              {
                label: "التالي",
                action: () => onPageChange(Math.min(pages, page + 1)),
                disabled: page === pages,
              },
            ].map((btn) => (
              <button
                key={btn.label}
                type="button"
                onClick={btn.action}
                disabled={btn.disabled}
                style={{
                  borderRadius: "var(--radius-lg)",
                  border: "1px solid var(--color-border)",
                  background: "var(--color-surface-muted)",
                  padding: "0.375rem 0.875rem",
                  fontSize: 12,
                  color: "var(--color-text-secondary)",
                  cursor: btn.disabled ? "not-allowed" : "pointer",
                  opacity: btn.disabled ? 0.4 : 1,
                  fontFamily: "var(--font-sans)",
                }}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}