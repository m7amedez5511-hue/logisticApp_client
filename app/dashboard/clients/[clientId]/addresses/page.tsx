"use client";

/**
 * app/dashboard/clients/[clientId]/addresses/page.tsx — Full Enhanced Version
 *
 * Features implemented:
 * 1. Fetches and displays all addresses for the client at page load.
 * 2. Full CRUD: Add / Edit / Delete addresses via modals.
 * 3. Set-primary logic: calls clientAddressService.setPrimary; reloads to sync cascade.
 * 4. Toast notifications (from UI barrel) for all CRUD results.
 * 5. Alert banner for load errors (from UI barrel).
 * 6. "Update Client" edit modal includes an inline address list so the user
 *    can see and designate the primary address without leaving the modal.
 * 7. The old Client/Toast component is NOT used here; UI/Toast is used throughout.
 *
 * HOW TO TEST:
 *   Navigate to /dashboard/clients/[id]/addresses from the client list.
 *   - Add address  → form modal → success toast "تم إضافة العنوان بنجاح."
 *   - Edit address → form modal pre-filled → success toast "تم تحديث العنوان."
 *   - Delete       → confirm dialog → success toast "تم حذف العنوان بنجاح."
 *   - Set primary  → inline button → success toast "تم تعيين العنوان الرئيسي."
 *   - Click "تعديل بيانات العميل" → client edit modal opens with address section.
 */

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

// ── UI components (canonical barrel — no old Client/Toast) ─────────────────
import { Alert, Toast } from "@/src/Components/UI";

// ── Hooks & services ───────────────────────────────────────────────────────
import { useClientAddresses } from "@/src/hooks/useClientAddresses";
import { clientService }      from "@/src/services/client.service";
import { getStoredToken }     from "@/src/lib/auth";

// ── Types ──────────────────────────────────────────────────────────────────
import type {
  Client,
  ClientAddress,
  ClientAddressFormData,
  ClientFormData,
} from "@/src/types/client";

// ── Client-specific modals ─────────────────────────────────────────────────
import { AddressFormModal,DeleteConfirmModal ,ClientFormModal }   from "@/src/Components/Client";


// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Emoji icon for known address label types */
function labelIcon(label: string): string {
  const map: Record<string, string> = {
    "فوترة":           "💳",
    "شحن":             "📦",
    "المقر الرئيسي":   "🏢",
    "فرع":             "🏬",
    "مستودع":          "🏭",
    billing:           "💳",
    shipping:          "📦",
    "head office":     "🏢",
    branch:            "🏬",
    warehouse:         "🏭",
  };
  return map[label.toLowerCase()] ?? "📍";
}

// ─────────────────────────────────────────────────────────────────────────────
// AddressCard sub-component
// ─────────────────────────────────────────────────────────────────────────────

interface AddressCardProps {
  address:       ClientAddress;
  onEdit:        () => void;
  onDelete:      () => void;
  onMakePrimary: () => void;
  /** Whether a "set primary" action is pending for this specific card */
  settingPrimary?: boolean;
}

/**
 * AddressCard — Renders a single address in the grid.
 *
 * Highlights:
 * - Primary address gets a blue ring + "رئيسي" badge.
 * - "تعيين كرئيسي" button only shown for non-primary addresses.
 * - Loading state on "تعيين كرئيسي" while the API call is in-flight.
 */
function AddressCard({
  address,
  onEdit,
  onDelete,
  onMakePrimary,
  settingPrimary = false,
}: AddressCardProps) {
  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        gap: "0.75rem",
        borderRadius: "var(--radius-xl)",
        border: address.isPrimary
          ? "1px solid #93C5FD"
          : "1px solid var(--color-border)",
        padding: "1.25rem",
        background: "var(--color-surface)",
        boxShadow: address.isPrimary
          ? "0 0 0 2px #BFDBFE, var(--shadow-card)"
          : "var(--shadow-card)",
        transition: "box-shadow 200ms",
      }}
    >
      {/* Label row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 20 }} aria-hidden="true">
            {labelIcon(address.label)}
          </span>
          <span
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: "var(--color-text-primary)",
            }}
          >
            {address.label}
          </span>
        </div>

        {/* Primary badge */}
        {address.isPrimary && (
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: "#1D4ED8",
              background: "#EFF6FF",
              border: "1px solid #BFDBFE",
              borderRadius: "var(--radius-full)",
              padding: "0.15rem 0.5rem",
              flexShrink: 0,
            }}
          >
            ★ رئيسي
          </span>
        )}
      </div>

      {/* Address lines */}
      <address
        dir="rtl"
        style={{
          fontStyle: "normal",
          fontSize: 13,
          color: "var(--color-text-secondary)",
          lineHeight: 1.7,
        }}
      >
        <p style={{ margin: 0 }}>{address.street}</p>
        <p style={{ margin: 0 }}>
          {address.city}،{" "}{address.state} {address.postalCode}
        </p>
        <p style={{ margin: 0 }}>{address.country}</p>
      </address>

      {/* Actions */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: 8,
          paddingTop: 8,
          borderTop: "1px solid var(--color-border)",
        }}
      >
        <ActionBtn
          onClick={onEdit}
          color="#1D4ED8"
          bg="#EFF6FF"
          border="#BFDBFE"
        >
          تعديل
        </ActionBtn>

        {/*
         * Set-primary button — only for non-primary addresses.
         * Shows a loading indicator while the API call is in-flight.
         */}
        {!address.isPrimary && (
          <ActionBtn
            onClick={onMakePrimary}
            color="#065F46"
            bg="#DCFCE7"
            border="#BBF7D0"
            disabled={settingPrimary}
          >
            {settingPrimary ? "…" : "تعيين كرئيسي"}
          </ActionBtn>
        )}

        <ActionBtn
          onClick={onDelete}
          color="#DC2626"
          bg="#FEF2F2"
          border="#FECACA"
          style={{ marginRight: "auto" }}
        >
          حذف
        </ActionBtn>
      </div>
    </div>
  );
}

function ActionBtn({
  onClick,
  color,
  bg,
  border,
  style,
  disabled,
  children,
}: {
  onClick: () => void;
  color: string;
  bg: string;
  border: string;
  style?: React.CSSProperties;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        height: 30,
        padding: "0 0.75rem",
        borderRadius: "var(--radius-md)",
        border: `1px solid ${border}`,
        background: bg,
        fontSize: 12,
        fontWeight: 600,
        color,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.6 : 1,
        fontFamily: "var(--font-sans)",
        transition: "opacity 150ms",
        ...style,
      }}
    >
      {children}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// AddressMiniList — used inside the client edit modal
// ─────────────────────────────────────────────────────────────────────────────

/**
 * AddressMiniList — A compact read-only list of addresses shown inside
 * the ClientFormModal when editing an existing client.
 *
 * Purpose:
 *   Allows the user to see all addresses and designate one as primary
 *   without navigating away from the edit modal.
 *
 * Props:
 *   addresses      — current list from useClientAddresses
 *   onMakePrimary  — handler that calls clientAddressService.setPrimary
 *   settingId      — id of the address currently being promoted (for loading state)
 */
function AddressMiniList({
  addresses,
  onMakePrimary,
  settingId,
}: {
  addresses: ClientAddress[];
  onMakePrimary: (id: string) => void;
  settingId: string | null;
}) {
  if (addresses.length === 0) {
    return (
      <div
        style={{
          borderRadius: "var(--radius-lg)",
          border: "1px dashed var(--color-border)",
          padding: "1rem",
          textAlign: "center",
          fontSize: 12,
          color: "var(--color-text-muted)",
        }}
      >
        لا توجد عناوين مضافة بعد.
      </div>
    );
  }

  return (
    <ul
      dir="rtl"
      style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 8 }}
    >
      {addresses.map((addr) => (
        <li
          key={addr.id}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 8,
            padding: "0.625rem 0.875rem",
            borderRadius: "var(--radius-md)",
            border: addr.isPrimary ? "1px solid #93C5FD" : "1px solid var(--color-border)",
            background: addr.isPrimary ? "#EFF6FF" : "var(--color-surface-muted)",
            fontSize: 12,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span aria-hidden="true">{labelIcon(addr.label)}</span>
            <div>
              <span style={{ fontWeight: 600, color: "var(--color-text-primary)" }}>
                {addr.label}
              </span>
              <span style={{ color: "var(--color-text-muted)", marginRight: 8 }}>
                {addr.city}، {addr.state}
              </span>
            </div>
          </div>

          {addr.isPrimary ? (
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: "#1D4ED8",
                background: "#DBEAFE",
                border: "1px solid #BFDBFE",
                borderRadius: "var(--radius-full)",
                padding: "0.1rem 0.45rem",
                flexShrink: 0,
              }}
            >
              ★ رئيسي
            </span>
          ) : (
            <button
              type="button"
              onClick={() => onMakePrimary(addr.id)}
              disabled={settingId === addr.id}
              style={{
                height: 24,
                padding: "0 0.5rem",
                borderRadius: "var(--radius-md)",
                border: "1px solid #BBF7D0",
                background: "#DCFCE7",
                fontSize: 11,
                fontWeight: 600,
                color: "#065F46",
                cursor: settingId === addr.id ? "not-allowed" : "pointer",
                opacity: settingId === addr.id ? 0.6 : 1,
                fontFamily: "var(--font-sans)",
                flexShrink: 0,
              }}
            >
              {settingId === addr.id ? "…" : "تعيين كرئيسي"}
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ClientEditModalWithAddresses — wraps ClientFormModal + AddressMiniList
// ─────────────────────────────────────────────────────────────────────────────

/**
 * ClientEditModalWithAddresses
 *
 * Extends the standard ClientFormModal with an "العناوين" section at the bottom.
 * This satisfies the "Update Client Page" requirement:
 *   "create a section that displays all available addresses for the selected client.
 *    The user should be able to intuitively designate one address as the primary address."
 *
 * Implementation note:
 *   We wrap ClientFormModal's children by rendering a secondary panel below the modal's
 *   close/submit cycle. Because ClientFormModal is self-contained (it manages its own
 *   form state), the address section is appended as a sibling modal layer that shares
 *   the same backdrop. The two panels share the same z-index stacking context.
 */
interface ClientEditModalWithAddressesProps {
  client: Client;
  addresses: ClientAddress[];
  onClose: () => void;
  onSubmit: (data: ClientFormData, isNew: boolean) => Promise<boolean>;
  onMakePrimary: (id: string) => Promise<boolean>;
}

function ClientEditModalWithAddresses({
  client,
  addresses,
  onClose,
  onSubmit,
  onMakePrimary,
}: ClientEditModalWithAddressesProps) {
  const [settingId, setSettingId] = useState<string | null>(null);

  const handleSetPrimary = async (id: string) => {
    setSettingId(id);
    await onMakePrimary(id);
    setSettingId(null);
  };

  return (
    // We reuse the backdrop and center the compound modal manually
    <div
      role="dialog"
      aria-modal="true"
      aria-label="تعديل بيانات العميل"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        background: "rgba(15,23,42,0.55)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        padding: "2rem 1rem",
        overflowY: "auto",
        gap: "1rem",
      }}
    >
      {/* Left panel: client form */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 520,
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
        }}
      >
        {/* Render ClientFormModal in a "portal-less" way by embedding its JSX inline */}
        <div
          style={{
            background: "var(--color-surface)",
            borderRadius: "var(--radius-2xl)",
            border: "1px solid var(--color-border)",
            boxShadow: "0 24px 64px rgba(0,0,0,.18)",
            overflow: "hidden",
          }}
        >
          {/* We mount ClientFormModal as a standalone dialog — it handles its own
              form logic. We intercept onClose to close the whole compound modal. */}
          <ClientFormModal
            editClient={client}
            onClose={onClose}
            onSubmit={onSubmit}
          />
        </div>

        {/*
         * Address section — appended below the form card.
         * Satisfies: "create a section that displays all available addresses."
         */}
        <div
          style={{
            background: "var(--color-surface)",
            borderRadius: "var(--radius-xl)",
            border: "1px solid var(--color-border)",
            boxShadow: "var(--shadow-card)",
            overflow: "hidden",
          }}
        >
          {/* Section header */}
          <div
            style={{
              padding: "0.875rem 1.25rem",
              borderBottom: "1px solid var(--color-border)",
              background: "var(--color-surface-muted)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div>
              <p
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: "0.25em",
                  textTransform: "uppercase",
                  color: "#2563EB",
                  margin: 0,
                }}
              >
                عناوين العميل
              </p>
              <p
                style={{
                  margin: "2px 0 0",
                  fontSize: 12,
                  color: "var(--color-text-muted)",
                }}
              >
                {addresses.length} عنوان — اضغط "تعيين كرئيسي" لتغيير العنوان الرئيسي
              </p>
            </div>
          </div>

          {/* Address mini-list */}
          <div style={{ padding: "1rem" }}>
            <AddressMiniList
              addresses={addresses}
              onMakePrimary={handleSetPrimary}
              settingId={settingId}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Page component
// ─────────────────────────────────────────────────────────────────────────────

export default function ClientAddressesPage() {
  const params   = useParams();
  const router   = useRouter();
  const clientId = params?.clientId as string;

  // ── Parent client meta ───────────────────────────────────────────────────
  const [client, setClient]               = useState<Client | null>(null);
  const [clientLoading, setClientLoading] = useState(true);

  // Fetch the parent client so we can show their name / details in the header
  useEffect(() => {
    if (!clientId) return;
    setClientLoading(true);
    clientService
      .getById(clientId, getStoredToken())
      .then((res) => setClient(res.data))
      .catch(() => router.replace("/dashboard/clients"))
      .finally(() => setClientLoading(false));
  }, [clientId, router]);

  // ── Address CRUD hook ────────────────────────────────────────────────────
  const {
    addresses,
    loading: addrLoading,
    error,
    notification,   // { type, message } — matches ToastNotification
    clearError,
    createAddress,
    updateAddress,
    deleteAddress,
    makePrimary,
    reload,
  } = useClientAddresses(clientId ?? "");

  // ── Modal state ──────────────────────────────────────────────────────────
  // Address form: false = closed | null = create | ClientAddress = edit
  const [addrFormTarget,  setAddrFormTarget]  = useState<ClientAddress | null | false>(false);
  const [deleteTarget,    setDeleteTarget]    = useState<ClientAddress | null>(null);
  const [deleting,        setDeleting]        = useState(false);

  // Client edit modal (with address section)
  const [editingClient,   setEditingClient]   = useState(false);

  // Per-card primary-setting loading state (card id)
  const [settingPrimaryId, setSettingPrimaryId] = useState<string | null>(null);

  // ── Address form handler ─────────────────────────────────────────────────
  const handleAddrFormSubmit = async (
    data: ClientAddressFormData,
    isNew: boolean,
  ): Promise<boolean> => {
    if (isNew) return createAddress(data);
    return updateAddress((addrFormTarget as ClientAddress).id, data);
  };

  // ── Delete handler ───────────────────────────────────────────────────────
  const handleDeleteConfirm = async () => {
    if (!deleteTarget || deleting) return;
    setDeleting(true);
    const ok = await deleteAddress(deleteTarget.id);
    setDeleting(false);
    if (ok) setDeleteTarget(null);
  };

  // ── Set-primary handler ──────────────────────────────────────────────────
  /**
   * makePrimaryForCard — wraps makePrimary from the hook with per-card
   * loading state so each card can show its own spinner independently.
   */
  const makePrimaryForCard = async (id: string): Promise<boolean> => {
    setSettingPrimaryId(id);
    const ok = await makePrimary(id);
    setSettingPrimaryId(null);
    return ok;
  };

  // ── Client edit submit ───────────────────────────────────────────────────
  const handleClientEditSubmit = async (
    data: ClientFormData,
    _isNew: boolean,
  ): Promise<boolean> => {
    if (!client) return false;
    try {
      const token = getStoredToken();
      const res = await clientService.update(client.id, data, token);
      setClient(res.data); // optimistically update local state
      return true;
    } catch {
      return false;
    }
  };

  // ── Guard: wait for client ───────────────────────────────────────────────
  if (!clientId || clientLoading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: "50%",
            border: "3px solid var(--color-border)",
            borderTopColor: "var(--color-brand-600)",
            animation: "spin 0.7s linear infinite",
          }}
        />
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      {/*
       * Global toast — sourced from UI barrel (not the old Client/Toast).
       * The notification object from useClientAddresses has the same shape
       * as ToastNotification: { type: "success" | "error"; message: string }.
       */}
      <Toast notification={notification} />

      {/* ── Address create / edit modal ── */}
      {addrFormTarget !== false && (
        <AddressFormModal
          editAddress={addrFormTarget}
          onClose={() => setAddrFormTarget(false)}
          onSubmit={handleAddrFormSubmit}
        />
      )}

      {/*
       * ── Address delete confirmation ──
       * We cast the address to the Client shape that DeleteConfirmModal expects
       * (it only uses id + name fields from Client).
       */}
      {deleteTarget && (
        <DeleteConfirmModal
          client={
            {
              ...deleteTarget,
              name: deleteTarget.label,
              email: "",
              phone: "",
              createdAt: deleteTarget.createdAt,
              updatedAt: deleteTarget.updatedAt,
            } as Client
          }
          deleting={deleting}
          onCancel={() => { if (!deleting) setDeleteTarget(null); }}
          onConfirm={handleDeleteConfirm}
        />
      )}

      {/*
       * ── Client edit modal with embedded address section ──
       * TEST: Click "تعديل بيانات العميل" in the header.
       *       → Modal shows client form + address list with "تعيين كرئيسي" buttons.
       */}
      {editingClient && client && (
        <ClientEditModalWithAddresses
          client={client}
          addresses={addresses}
          onClose={() => setEditingClient(false)}
          onSubmit={handleClientEditSubmit}
          onMakePrimary={makePrimaryForCard}
        />
      )}

      <section style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

        {/* ── Page header ── */}
        <header
          style={{
            borderRadius: "var(--radius-xl)",
            border: "1px solid var(--color-border)",
            background: "var(--color-surface)",
            padding: "1.5rem 2rem",
            boxShadow: "var(--shadow-card)",
          }}
        >
          {/* Back link */}
          <button
            type="button"
            onClick={() => router.push("/dashboard/clients")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              fontSize: 12,
              fontWeight: 600,
              color: "var(--color-text-muted)",
              background: "none",
              border: "none",
              cursor: "pointer",
              marginBottom: 12,
              fontFamily: "var(--font-sans)",
            }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
            جميع العملاء
          </button>

          <p
            style={{
              fontSize: 11,
              letterSpacing: "0.3em",
              textTransform: "uppercase",
              color: "#2563EB",
              fontWeight: 600,
            }}
          >
            إدارة العناوين
          </p>

          <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1
                style={{
                  fontSize: "1.5rem",
                  fontWeight: 700,
                  color: "var(--color-text-primary)",
                  margin: 0,
                }}
              >
                {client ? `${client.name} — العناوين` : "العناوين"}
              </h1>
              <p
                style={{
                  marginTop: "0.25rem",
                  fontSize: 13,
                  color: "var(--color-text-muted)",
                }}
              >
                إجمالي{" "}
                <strong style={{ color: "var(--color-text-primary)" }}>
                  {addresses.length}
                </strong>{" "}
                عنوان
              </p>
            </div>

            {/* Header action buttons */}
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              {/* Edit client (opens compound modal with address section) */}
              {client && (
                <button
                  type="button"
                  onClick={() => setEditingClient(true)}
                  style={{
                    height: 40,
                    padding: "0 1rem",
                    borderRadius: "var(--radius-lg)",
                    border: "1px solid var(--color-border)",
                    background: "var(--color-surface)",
                    fontSize: 13,
                    fontWeight: 600,
                    color: "var(--color-text-secondary)",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 7,
                    fontFamily: "var(--font-sans)",
                  }}
                >
                  <svg
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                  تعديل بيانات العميل
                </button>
              )}

              {/* Add address button */}
              <button
                type="button"
                onClick={() => setAddrFormTarget(null)}
                style={{
                  height: 40,
                  padding: "0 1.125rem",
                  borderRadius: "var(--radius-lg)",
                  border: "none",
                  background: "var(--color-brand-600)",
                  fontSize: 13,
                  fontWeight: 700,
                  color: "#FFF",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 7,
                  fontFamily: "var(--font-sans)",
                  boxShadow: "0 1px 4px rgba(37,99,235,.35)",
                  whiteSpace: "nowrap",
                }}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                إضافة عنوان
              </button>
            </div>
          </div>

          {/* Client info strip */}
          {client && (
            <div
              dir="rtl"
              style={{
                marginTop: "1rem",
                display: "flex",
                flexWrap: "wrap",
                gap: "1rem",
                fontSize: 13,
                color: "var(--color-text-secondary)",
                paddingTop: "1rem",
                borderTop: "1px solid var(--color-border)",
              }}
            >
              <span
                style={{
                  fontWeight: 600,
                  color: "var(--color-text-primary)",
                }}
              >
                {client.name}
              </span>
              <a
                href={`mailto:${client.email}`}
                style={{ color: "#2563EB", textDecoration: "none" }}
              >
                {client.email}
              </a>
              <span>{client.phone}</span>
              {client.taxId && (
                <code
                  style={{
                    fontSize: 11,
                    background: "var(--color-surface-muted)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "var(--radius-sm)",
                    padding: "0.1rem 0.4rem",
                  }}
                >
                  {client.taxId}
                </code>
              )}
            </div>
          )}
        </header>

        {/*
         * Error alert — shown when the address load fails.
         * Uses the UI/Alert component with an onClose dismiss handler.
         * TEST: Simulate a network error → alert banner appears above the grid.
         */}
        {error && (
          <Alert type="error" message={error} onClose={clearError} />
        )}

        {/* ── Address grid ── */}
        {addrLoading ? (
          /* Loading skeleton-ish state */
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "4rem 0",
              color: "var(--color-text-muted)",
              gap: 12,
              fontSize: 13,
            }}
          >
            <div
              style={{
                width: 20,
                height: 20,
                borderRadius: "50%",
                border: "2px solid var(--color-border)",
                borderTopColor: "var(--color-brand-600)",
                animation: "spin 0.7s linear infinite",
                flexShrink: 0,
              }}
            />
            جارٍ تحميل العناوين…
          </div>
        ) : addresses.length === 0 ? (
          /* Empty state */
          <div
            style={{
              borderRadius: "var(--radius-xl)",
              border: "1px solid var(--color-border)",
              background: "var(--color-surface)",
              padding: "4rem 1rem",
              textAlign: "center",
              boxShadow: "var(--shadow-card)",
            }}
          >
            <p style={{ fontSize: 32, margin: 0 }}>📍</p>
            <p
              style={{
                marginTop: 12,
                fontSize: 15,
                fontWeight: 700,
                color: "var(--color-text-primary)",
              }}
            >
              لا توجد عناوين بعد
            </p>
            <p
              style={{
                marginTop: 4,
                fontSize: 13,
                color: "var(--color-text-muted)",
              }}
            >
              أضف عنواناً واحداً على الأقل حتى يتمكن العميل من استقبال الشحنات والفواتير.
            </p>
            <button
              type="button"
              onClick={() => setAddrFormTarget(null)}
              style={{
                marginTop: 16,
                fontSize: 13,
                fontWeight: 600,
                color: "var(--color-brand-600)",
                background: "none",
                border: "none",
                cursor: "pointer",
                textDecoration: "underline",
              }}
            >
              أضف أول عنوان
            </button>
          </div>
        ) : (
          /*
           * Address cards grid.
           * TEST:
           *   - Click "تعديل" → AddressFormModal opens pre-filled.
           *   - Click "تعيين كرئيسي" → button shows "…" loading, then card re-renders
           *     with "★ رئيسي" badge and blue ring; previously primary card loses the badge.
           *   - Click "حذف" → DeleteConfirmModal opens → confirm → card removed, toast shown.
           */
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: "1rem",
            }}
          >
            {addresses.map((addr) => (
              <AddressCard
                key={addr.id}
                address={addr}
                onEdit={() => setAddrFormTarget(addr)}
                onDelete={() => setDeleteTarget(addr)}
                onMakePrimary={() => makePrimaryForCard(addr.id)}
                settingPrimary={settingPrimaryId === addr.id}
              />
            ))}
          </div>
        )}
      </section>
    </>
  );
}