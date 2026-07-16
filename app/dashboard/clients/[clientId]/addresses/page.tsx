"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { Alert, ConfirmDialog, Toast, ArchiveButton } from "@/src/Components/UI";

import { useClientAddresses } from "@/src/hooks/useClientAddresses";
import { clientService }      from "@/src/services/client.service";
import { getStoredToken }     from "@/src/lib/auth";

import type { Client, ClientFormData } from "@/src/types/client";
import type { ClientAddress }          from "@/src/types/client_adresses";

import { AddressFormModal, ClientFormModal } from "@/src/Components/Client";
import { ArchivedClientsAddressesModal } from "@/src/Components/Client_Adress/archive/ArchivedClientsAddressesModal";
import type {
  CreateAddressFormValues,
  UpdateAddressFormValues,
} from "@/src/validations/client_address.validator";

// ─── Helpers ───────────────────────────────────────────────────────────────

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

// ─── AddressCard ───────────────────────────────────────────────────────────

interface AddressCardProps {
  address:        ClientAddress;
  onEdit:         () => void;
  onDelete:       () => void;
  onSetPrimary:   () => void;
  settingPrimary: boolean; // true only while THIS card's request is in flight
}

function AddressCard({ address, onEdit, onDelete, onSetPrimary, settingPrimary }: AddressCardProps) {
  const { details, contactPerson } = address;
  const {
    street,
    city,
    state,
    district,
    buildingNo,
    unitNo,
    additionalNo,
    zipCode,
    country,
  } = details;

  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        gap: "0.75rem",
        borderRadius: "var(--radius-xl)",
        border: "1px solid var(--color-border)",
        padding: "1.25rem",
        background: "var(--color-surface)",
        boxShadow: "var(--shadow-card)",
      }}
    >
      {/* Label row */}
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
        {address.branchName && (
          <span
            style={{
              fontSize: 11,
              color: "var(--color-text-muted)",
              background: "var(--color-surface-muted)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-full)",
              padding: "0.1rem 0.45rem",
              flexShrink: 0,
            }}
          >
            {address.branchName}
          </span>
        )}
        {address.isPrimary && (
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: "#1D4ED8",
              background: "#EFF6FF",
              border: "1px solid #BFDBFE",
              borderRadius: "var(--radius-full)",
              padding: "0.1rem 0.45rem",
              flexShrink: 0,
              marginInlineStart: "auto",
            }}
          >
            أساسي
          </span>
        )}
      </div>

      {/* Address details — rendered fully in-card */}
      <address
        dir="rtl"
        style={{
          fontStyle: "normal",
          fontSize: 13,
          color: "var(--color-text-secondary)",
          lineHeight: 1.7,
          display: "flex",
          flexDirection: "column",
          gap: 2,
        }}
      >
        <p style={{ margin: 0, fontWeight: 600, color: "var(--color-text-primary)" }}>
          {street}
        </p>

        {district && <p style={{ margin: 0 }}>حي {district}</p>}

        <p style={{ margin: 0 }}>
          {city}
          {state ? `، ${state}` : ""}
          {zipCode ? ` ${zipCode}` : ""}
        </p>

        {(buildingNo || unitNo || additionalNo) && (
          <p style={{ margin: 0, fontSize: 12, color: "var(--color-text-muted)" }} dir="ltr">
            {buildingNo && `مبنى ${buildingNo}`}
            {unitNo && ` · وحدة ${unitNo}`}
            {additionalNo && ` · رقم إضافي ${additionalNo}`}
          </p>
        )}

        <p style={{ margin: 0 }}>{country}</p>
      </address>

      {/* Contact person — only when present */}
      {(contactPerson?.name || contactPerson?.phone) && (
        <div
          dir="rtl"
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "0.5rem",
            fontSize: 12,
            color: "var(--color-text-secondary)",
            paddingTop: 8,
            borderTop: "1px solid var(--color-border)",
          }}
        >
          <span style={{ fontWeight: 600 }}>👤</span>
          {contactPerson?.name && <span>{contactPerson.name}</span>}
          {contactPerson?.phone && (
            <span dir="ltr" style={{ color: "var(--color-text-muted)" }}>
              {contactPerson.phone}
            </span>
          )}
        </div>
      )}

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
        <ActionBtn onClick={onEdit} color="#1D4ED8" bg="#EFF6FF" border="#BFDBFE">
          تعديل
        </ActionBtn>

        {!address.isPrimary && (
          <ActionBtn
            onClick={onSetPrimary}
            disabled={settingPrimary}
            color="#B45309"
            bg="#FFFBEB"
            border="#FDE68A"
          >
            {settingPrimary ? "جارٍ التعيين…" : "تعيين كأساسي"}
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
  onClick:   () => void;
  color:     string;
  bg:        string;
  border:    string;
  style?:    React.CSSProperties;
  disabled?: boolean;
  children:  React.ReactNode;
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

// ─── ClientEditModal ───────────────────────────────────────────────────────

interface ClientEditModalProps {
  client:   Client;
  onClose:  () => void;
  onSubmit: (data: ClientFormData, isNew: boolean) => Promise<boolean>;
}

function ClientEditModal({ client, onClose, onSubmit }: ClientEditModalProps) {
  return (
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
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 520,
          background: "var(--color-surface)",
          borderRadius: "var(--radius-2xl)",
          border: "1px solid var(--color-border)",
          boxShadow: "0 24px 64px rgba(0,0,0,.18)",
          overflow: "hidden",
        }}
      >
        <ClientFormModal
          editClient={client}
          onClose={onClose}
          onSubmit={onSubmit}
        />
      </div>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────

export default function ClientAddressesPage() {
  const params   = useParams();
  const router   = useRouter();

  const clientId = (params?.clientId ?? params?.id) as string | undefined;

  useEffect(() => {
    if (!clientId) {
      console.warn("ClientAddressesPage: clientId missing from route params.");
    }
  }, [clientId]);

  // ── Parent client ────────────────────────────────────────────────────────
  const [client, setClient]               = useState<Client | null>(null);
  const [clientLoading, setClientLoading] = useState(true);

  const loadClient = useCallback(() => {
    if (!clientId) return;
    queueMicrotask(() => {
      setClientLoading(true);
      clientService
        .getById(clientId, getStoredToken())
        .then((res) => setClient(res.data))
        .catch(() => router.replace("/dashboard/clients"))
        .finally(() => setClientLoading(false));
    });
  }, [clientId, router]);

  useEffect(() => {
    loadClient();
  }, [loadClient]);

  // ── Address hook ─────────────────────────────────────────────────────────
  const {
    addresses,
    loading: addrLoading,
    error,
    notification,
    clearError,
    createAddress,
    updateAddress,
    deleteAddress,
    setPrimaryAddress,
    settingPrimaryId,
  } = useClientAddresses(clientId ?? "");

  // ── Modal state ──────────────────────────────────────────────────────────
  const [addrFormTarget, setAddrFormTarget] = useState<ClientAddress | null | false>(false);
  const [deleteTarget,   setDeleteTarget]   = useState<ClientAddress | null>(null);
  const [deleting,       setDeleting]       = useState(false);
  const [editingClient,  setEditingClient]  = useState(false);
  // Archive browser modal open/closed — scoped to this client's addresses
  const [archiveOpen,    setArchiveOpen]    = useState(false);

  // ── Address form handler ─────────────────────────────────────────────────
  const handleAddressSubmit = async (
    data: CreateAddressFormValues | UpdateAddressFormValues
  ): Promise<boolean> => {
    if (addrFormTarget === null)  return createAddress(data as CreateAddressFormValues);
    if (addrFormTarget === false) return false;
    return updateAddress(addrFormTarget.id, data as UpdateAddressFormValues);
  };

  // ── Delete handler ───────────────────────────────────────────────────────
  const handleDeleteConfirm = async () => {
    if (!deleteTarget || deleting) return;
    setDeleting(true);
    const ok = await deleteAddress(deleteTarget.id);
    setDeleting(false);
    if (ok) setDeleteTarget(null);
  };

  // ── Set primary handler ──────────────────────────────────────────────────
  const handleSetPrimary = async (address: ClientAddress) => {
    await setPrimaryAddress(address.id);
  };

  // ── Client edit handler ──────────────────────────────────────────────────
  const handleClientEditSubmit = async (
    data: ClientFormData,
  ): Promise<boolean> => {
    if (!client) return false;
    try {
      const res = await clientService.update(client.id, data, getStoredToken());
      setClient(res.data);
      return true;
    } catch {
      return false;
    }
  };

  // ── Loading guard ────────────────────────────────────────────────────────
  if (!clientId || clientLoading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
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
      <Toast notification={notification} />

      {/* Address create / edit modal */}
      {addrFormTarget !== false && (
        <AddressFormModal
          editAddress={addrFormTarget}
          onClose={() => setAddrFormTarget(false)}
          onSubmit={handleAddressSubmit}
        />
      )}

      {/* Delete confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        loading={deleting}
        onCancel={() => { if (!deleting) setDeleteTarget(null); }}
        onConfirm={handleDeleteConfirm}
        title="حذف العميل"
        description={`هل أنت متأكد من حذف ${deleteTarget?.label ?? ""}؟ سيتم حذف جميع عناوينه أيضاً. لا يمكن التراجع عن هذا الإجراء.`}
      />

      {/* Client edit modal */}
      {editingClient && client && (
        <ClientEditModal
          client={client}
          onClose={() => setEditingClient(false)}
          onSubmit={handleClientEditSubmit}
        />
      )}

      {/* Archived addresses browser — scoped to this client */}
      {archiveOpen && (
        <ArchivedClientsAddressesModal
          clientId={clientId}
          onClose={() => setArchiveOpen(false)}
        />
      )}

      <section style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

        {/* ── Header ── */}
        <header
          style={{
            borderRadius: "var(--radius-xl)",
            border: "1px solid var(--color-border)",
            background: "var(--color-surface)",
            padding: "1.5rem 2rem",
            boxShadow: "var(--shadow-card)",
          }}
        >
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
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6" />
            </svg>
            جميع العملاء
          </button>

          <p style={{ fontSize: 11, letterSpacing: "0.3em", textTransform: "uppercase", color: "#2563EB", fontWeight: 600 }}>
            إدارة العناوين
          </p>

          <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--color-text-primary)", margin: 0 }}>
                {client ? `${client.name} — العناوين` : "العناوين"}
              </h1>
              <p style={{ marginTop: "0.25rem", fontSize: 13, color: "var(--color-text-muted)" }}>
                إجمالي{" "}
                <strong style={{ color: "var(--color-text-primary)" }}>{addresses.length}</strong>{" "}
                عنوان
              </p>
            </div>

            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
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
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                  تعديل بيانات العميل
                </button>
              )}

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
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
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
              <span style={{ fontWeight: 600, color: "var(--color-text-primary)" }}>{client.name}</span>
              <a href={`mailto:${client.email}`} style={{ color: "#2563EB", textDecoration: "none" }}>
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

        {error && <Alert type="error" message={error} onClose={clearError} />}

        {/* ── Address grid ── */}
        {addrLoading ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "4rem 0", color: "var(--color-text-muted)", gap: 12, fontSize: 13 }}>
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
            <p style={{ marginTop: 12, fontSize: 15, fontWeight: 700, color: "var(--color-text-primary)" }}>
              لا توجد عناوين بعد
            </p>
            <p style={{ marginTop: 4, fontSize: 13, color: "var(--color-text-muted)" }}>
              أضف عنواناً واحداً على الأقل حتى يتمكن العميل من استقبال الشحنات والفواتير.
            </p>
            <button
              type="button"
              onClick={() => setAddrFormTarget(null)}
              style={{ marginTop: 16, fontSize: 13, fontWeight: 600, color: "var(--color-brand-600)", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}
            >
              أضف أول عنوان
            </button>
          </div>
        ) : (
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
                onSetPrimary={() => handleSetPrimary(addr)}
                settingPrimary={settingPrimaryId === addr.id}
              />
            ))}
          </div>
        )}
      </section>

      {/* Floating button to open the address archive for this client */}
      <ArchiveButton onClick={() => setArchiveOpen(true)} label="أرشيف العناوين" />
    </>
  );
}