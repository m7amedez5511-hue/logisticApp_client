"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Alert }              from "../../../../Components/UI";
import { Toast }              from "../../../../Components/Client/Toast";
import { useClientAddresses } from "../../../../hooks/useClientAddresses";
import { clientService }      from "../../../../services/client.service";
import { getStoredToken }     from "../../../../lib/auth";
import type {
  Client,
  ClientAddress,
  ClientAddressFormData,
} from "../../../../types/client";
import { AddressFormModal } from "@/Components/Client/Addressformmodal";
import { DeleteConfirmModal } from "@/Components/Client/Deleteconfirmmodal";

// ── Helpers ────────────────────────────────────────────────────────────────

/** Returns a context-appropriate emoji for each common address label */
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

// ── Address card sub-component ─────────────────────────────────────────────
// Mirrors the AddressCard in the old page — kept co-located because it's only used here.
interface AddressCardProps {
  address:       ClientAddress;
  onEdit:        () => void;
  onDelete:      () => void;
  onMakePrimary: () => void;
}

function AddressCard({ address, onEdit, onDelete, onMakePrimary }: AddressCardProps) {
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
      }}
    >
      {/* Label row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 20 }} aria-hidden="true">
            {labelIcon(address.label)}
          </span>
          <span style={{ fontSize: 13, fontWeight: 700, color: "var(--color-text-primary)" }}>
            {address.label}
          </span>
        </div>
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
            }}
          >
            رئيسي
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
          {address.city}، {address.state} {address.postalCode}
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
        <ActionBtn onClick={onEdit} color="#1D4ED8" bg="#EFF6FF" border="#BFDBFE">
          تعديل
        </ActionBtn>

        {!address.isPrimary && (
          <ActionBtn
            onClick={onMakePrimary}
            color="#065F46"
            bg="#DCFCE7"
            border="#BBF7D0"
          >
            تعيين كرئيسي
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
  children,
}: {
  onClick: () => void;
  color: string;
  bg: string;
  border: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        height: 30,
        padding: "0 0.75rem",
        borderRadius: "var(--radius-md)",
        border: `1px solid ${border}`,
        background: bg,
        fontSize: 12,
        fontWeight: 600,
        color,
        cursor: "pointer",
        fontFamily: "var(--font-sans)",
        ...style,
      }}
    >
      {children}
    </button>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function ClientAddressesPage() {
  
  const params   = useParams();
  const router   = useRouter();
  const clientId = params?.clientId as string;
  console.log('clientId:', params.clientId); // شوف إيه اللي بيجي
  // ── Parent client meta ───────────────────────────────────────────────────
  const [client, setClient]             = useState<Client | null>(null);
  const [clientLoading, setClientLoading] = useState(true);

  useEffect(() => {
    if (!clientId) return;
    setClientLoading(true);
    clientService
      .getById(clientId, getStoredToken())
      .then((res) => setClient(res.data))
      .catch(() => router.replace("/clients"))
      .finally(() => setClientLoading(false));
  }, [clientId, router]);

  // ── Address CRUD hook ────────────────────────────────────────────────────
  const {
    addresses,
    loading: addrLoading,
    error,
    notification,
    clearError,
    createAddress,
    updateAddress,
    deleteAddress,
    makePrimary,
  } = useClientAddresses(clientId ?? "");

  // ── Modal state (mirrors UsersPage pattern) ──────────────────────────────
  // false = closed | null = create mode | ClientAddress = edit mode
  const [formTarget,   setFormTarget]   = useState<ClientAddress | null | false>(false);
  const [deleteTarget, setDeleteTarget] = useState<ClientAddress | null>(null);
  const [deleting,     setDeleting]     = useState(false);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleFormSubmit = async (
    data: ClientAddressFormData,
    isNew: boolean
  ): Promise<boolean> => {
    if (isNew) return createAddress(data);
    return updateAddress((formTarget as ClientAddress).id, data);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget || deleting) return;
    setDeleting(true);
    const ok = await deleteAddress(deleteTarget.id);
    setDeleting(false);
    if (ok) setDeleteTarget(null);
  };

  // ── Guard: wait for router + client ─────────────────────────────────────
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
      {/* Global success / error toast */}
      <Toast notification={notification} />

      {/* Create / Edit address modal */}
      {formTarget !== false && (
        <AddressFormModal
          editAddress={formTarget}
          onClose={() => setFormTarget(false)}
          onSubmit={handleFormSubmit}
        />
      )}

      {/* Delete confirmation — reuses the same DeleteConfirmModal shape */}
      {deleteTarget && (
        <DeleteConfirmModal
          // Cast address as Client for the modal (same shape: id + name)
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
            onClick={() => router.push("/clients")}
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

            {/* Add address button */}
            <button
              type="button"
              onClick={() => setFormTarget(null)}
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
              <span style={{ fontWeight: 600, color: "var(--color-text-primary)" }}>
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

        {/* General load error */}
        {error && <Alert type="error" message={error} onClose={clearError} />}

        {/* Address grid */}
        {addrLoading ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "4rem 0",
              color: "var(--color-text-muted)",
              fontSize: 13,
            }}
          >
            جارٍ التحميل…
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
              onClick={() => setFormTarget(null)}
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
                onEdit={() => setFormTarget(addr)}
                onDelete={() => setDeleteTarget(addr)}
                onMakePrimary={() => makePrimary(addr.id)}
              />
            ))}
          </div>
        )}
      </section>
    </>
  );
}