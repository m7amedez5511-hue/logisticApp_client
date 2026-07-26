"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import {
  Alert,
  ConfirmDialog,
  Toast,
  ArchiveButton,
  Button,
  EmptyState,
  PageLoader,
  InlineLoader,
} from "@/src/Components/UI";

import { useClientAddresses } from "@/src/hooks/useClientAddresses";
import { clientService }      from "@/src/services/client.service";
import { getStoredToken }     from "@/src/lib/auth";

import type { Client, ClientFormData } from "@/src/types/client";
import type { ClientAddress }          from "@/src/types/client_adresses";

import { AddressFormModal, ClientFormModal } from "@/src/Components/Client";
import { AddressDetailModal } from "@/src/Components/Client_Adress/AddressDetailModal";
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
// CHANGE: clicking the card now opens AddressDetailModal — same pattern as
// UserTable → UserDetailModal (viewUserId). Action buttons stop propagation
// so they don't trigger the modal. `ActionBtn` (custom component) removed in
// favor of the shared <Button size="sm" /> from the template.

interface AddressCardProps {
  address:        ClientAddress;
  onView:         () => void;
  onEdit:         () => void;
  onDelete:       () => void;
  onSetPrimary:   () => void;
  settingPrimary: boolean; // true only while THIS card's request is in flight
}

function AddressCard({ address, onView, onEdit, onDelete, onSetPrimary, settingPrimary }: AddressCardProps) {
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
      onClick={onView}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onView(); }}
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
        cursor: "pointer",
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

      {/* Actions — stopPropagation so clicking them doesn't open the detail modal */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: 8,
          paddingTop: 8,
          borderTop: "1px solid var(--color-border)",
        }}
      >
        <Button type="button" variant="secondary" size="sm" onClick={onEdit}>
          تعديل
        </Button>

        {!address.isPrimary && (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onSetPrimary}
            loading={settingPrimary}
          >
            تعيين كأساسي
          </Button>
        )}

        <Button
          type="button"
          variant="danger"
          size="sm"
          onClick={onDelete}
          style={{ marginInlineStart: "auto" }}
        >
          حذف
        </Button>
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
        .then((res) => setClient(res))
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
  // Address whose detail modal is open — same pattern as viewUserId/UserDetailModal
  const [viewAddress,    setViewAddress]    = useState<ClientAddress | null>(null);

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
      setClient(res);
      return true;
    } catch {
      return false;
    }
  };

  // ── Loading guard ────────────────────────────────────────────────────────
  // CHANGE: swapped the hand-rolled spinning <div> for the template's PageLoader.
  if (!clientId || clientLoading) {
    return <PageLoader message="جارٍ تحميل بيانات العميل…" />;
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      <Toast notification={notification} />

      {/* Address detail modal — same pattern as viewUserId → UserDetailModal */}
      {viewAddress && (
        <AddressDetailModal
          address={viewAddress}
          onClose={() => setViewAddress(null)}
        />
      )}

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
        title="حذف العنوان"
        description={`هل أنت متأكد من حذف ${deleteTarget?.label ?? ""}؟ لا يمكن التراجع عن هذا الإجراء.`}
      />

      {/*
        Client edit modal
        CHANGE: removed the custom `ClientEditModal` wrapper that built its
        own fixed-position backdrop by hand. `ClientFormModal` already
        renders the shared <Modal/> internally, so wrapping it in another
        backdrop produced two stacked overlays. We now render it directly.
      */}
      {editingClient && client && (
        <ClientFormModal
          editClient={client}
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
          {/* CHANGE: custom <button> → Button variant="ghost" */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => router.push("/dashboard/clients")}
            style={{ marginBottom: 12 }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6" />
            </svg>
            جميع العملاء
          </Button>

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
              {/* CHANGE: custom <button> → Button variant="secondary" */}
              {client && (
                <Button type="button" variant="secondary" onClick={() => setEditingClient(true)}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                  تعديل بيانات العميل
                </Button>
              )}

              {/* CHANGE: custom <button> → Button variant="primary" */}
              <Button type="button" variant="primary" onClick={() => setAddrFormTarget(null)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                إضافة عنوان
              </Button>
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
          // CHANGE: hand-rolled spinning <div> → InlineLoader
          <InlineLoader message="جارٍ تحميل العناوين…" />
        ) : addresses.length === 0 ? (
          // CHANGE: custom empty-state <div> → EmptyState
          <EmptyState
            icon="📍"
            title="لا توجد عناوين بعد"
            description="أضف عنواناً واحداً على الأقل حتى يتمكن العميل من استقبال الشحنات والفواتير."
            action={
              <Button type="button" variant="primary" onClick={() => setAddrFormTarget(null)}>
                أضف أول عنوان
              </Button>
            }
          />
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
                onView={() => setViewAddress(addr)}
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