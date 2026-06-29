"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { Alert, Toast } from "@/src/Components/UI";
import { AddressFormModal, DeleteConfirmModal } from "@/src/Components/Client";
import { clientAddressService }                from "@/src/services/clientAddress.service";
import { clientService }                       from "@/src/services/client.service";
import { getStoredToken }                      from "@/src/lib/auth";

import type { Client }         from "@/src/types/client";
import type { ClientAddress }  from "@/src/types/client_adresses";
import type {
  CreateAddressFormValues,
  UpdateAddressFormValues,
} from "@/src/validations/client_address.validator";
import type { ToastNotification } from "@/src/Components/UI";

// ─── Detail row ────────────────────────────────────────────────────────────

function DetailRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 3,
        padding: "0.625rem 0",
        borderBottom: "1px solid var(--color-border)",
      }}
    >
      <span style={{ fontSize: 11, fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
        {label}
      </span>
      <span style={{ fontSize: 13, color: "var(--color-text-primary)", fontWeight: 500 }}>
        {value}
      </span>
    </div>
  );
}

// ─── Section header ────────────────────────────────────────────────────────

function SectionHeader({ title }: { title: string }) {
  return (
    <p
      style={{
        fontSize: 11,
        fontWeight: 700,
        color: "var(--color-text-muted)",
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        margin: "1.25rem 0 0",
        paddingBottom: "0.25rem",
        borderBottom: "1px solid var(--color-border)",
      }}
    >
      {title}
    </p>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────

export default function AddressDetailPage() {
  const params   = useParams();
  const router   = useRouter();

  const clientId  = (params?.clientId  ?? params?.id) as string | undefined;
  const addressId = params?.addressId as string | undefined;

  // ── State ──────────────────────────────────────────────────────────────
  const [address, setAddress]   = useState<ClientAddress | null>(null);
  const [client,  setClient]    = useState<Client | null>(null);
  const [loading, setLoading]   = useState(true);
  const [error,   setError]     = useState<string | null>(null);

  const [editOpen,   setEditOpen]   = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting,   setDeleting]   = useState(false);

  const [notification, setNotification] = useState<ToastNotification | null>(null);

  const notify = (n: ToastNotification) => {
    setNotification(n);
    setTimeout(() => setNotification(null), 4000);
  };

  // ── Fetch address & client ─────────────────────────────────────────────
  useEffect(() => {
    if (!clientId || !addressId) return;
    setLoading(true);

    Promise.all([
      clientAddressService.getById(clientId, addressId, getStoredToken()),
      clientService.getById(clientId, getStoredToken()),
    ])
      .then(([addrRes, clientRes]) => {
        const raw = (addrRes as any).data ?? addrRes;
        setAddress({ ...raw, id: raw.id ?? raw._id });
        setClient(clientRes.data);
      })
      .catch(() => setError("تعذّر تحميل بيانات العنوان. يرجى المحاولة مجدداً."))
      .finally(() => setLoading(false));
  }, [clientId, addressId]);

  // ── Update handler ─────────────────────────────────────────────────────
  const handleUpdateSubmit = async (
    data: CreateAddressFormValues | UpdateAddressFormValues
  ): Promise<boolean> => {
    if (!clientId || !addressId) return false;
    try {
      const token = getStoredToken();
      const res = await clientAddressService.update(
        clientId,
        addressId,
        data as UpdateAddressFormValues,
        token
      );
      const raw = (res as any).data ?? res;
      setAddress({ ...raw, id: raw.id ?? raw._id });
      notify({ type: "success", message: "تم تحديث العنوان بنجاح." });
      return true;
    } catch (err) {
      notify({
        type: "error",
        message: err instanceof Error ? err.message : "تعذّر تحديث العنوان.",
      });
      return false;
    }
  };

  // ── Delete handler ─────────────────────────────────────────────────────
  const handleDeleteConfirm = async () => {
    if (!clientId || !addressId || deleting) return;
    setDeleting(true);
    try {
      await clientAddressService.delete(clientId, addressId, getStoredToken());
      notify({ type: "success", message: "تم حذف العنوان بنجاح." });
      setTimeout(() => router.replace(`/dashboard/clients/${clientId}/addresses`), 800);
    } catch (err) {
      notify({
        type: "error",
        message: err instanceof Error ? err.message : "تعذّر حذف العنوان.",
      });
      setDeleting(false);
    }
  };

  // ── Loading ────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            border: "3px solid var(--color-border)",
            borderTopColor: "var(--color-brand-600)",
            animation: "spin 0.7s linear infinite",
          }}
        />
      </div>
    );
  }

  if (error || !address) {
    return (
      <div style={{ padding: "2rem" }}>
        <Alert type="error" message={error ?? "لم يتم العثور على العنوان."} />
        <button
          type="button"
          onClick={() => router.back()}
          style={{ marginTop: 16, fontSize: 13, color: "var(--color-brand-600)", background: "none", border: "none", cursor: "pointer", fontFamily: "var(--font-sans)" }}
        >
          ← رجوع
        </button>
      </div>
    );
  }

  const { details, contactPerson, location } = address;

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <>
      <Toast notification={notification} />

      {/* Edit modal */}
      {editOpen && (
        <AddressFormModal
          editAddress={address}
          onClose={() => setEditOpen(false)}
          onSubmit={handleUpdateSubmit}
        />
      )}

      {/* Delete confirmation */}
      {deleteOpen && (
        <DeleteConfirmModal
          client={
            {
              ...address,
              name: address.label,
              email: "",
              phone: "",
            } as Client
          }
          deleting={deleting}
          onCancel={() => { if (!deleting) setDeleteOpen(false); }}
          onConfirm={handleDeleteConfirm}
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
          {/* Back to addresses list */}
          <button
            type="button"
            onClick={() => router.push(`/dashboard/clients/${clientId}/addresses`)}
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
            {client ? `${client.name} — العناوين` : "العناوين"}
          </button>

          <p style={{ fontSize: 11, letterSpacing: "0.3em", textTransform: "uppercase", color: "#2563EB", fontWeight: 600, margin: 0 }}>
            تفاصيل العنوان
          </p>

          <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 28 }} aria-hidden="true">
                {address.label === "شحن" ? "📦" : address.label === "فوترة" ? "💳" : "📍"}
              </span>
              <div>
                <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--color-text-primary)", margin: 0 }}>
                  {address.label}
                </h1>
                {address.branchName && (
                  <p style={{ marginTop: 2, fontSize: 13, color: "var(--color-text-muted)" }}>
                    {address.branchName}
                  </p>
                )}
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button
                type="button"
                onClick={() => setEditOpen(true)}
                style={{
                  height: 40,
                  padding: "0 1rem",
                  borderRadius: "var(--radius-lg)",
                  border: "1px solid #BFDBFE",
                  background: "#EFF6FF",
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#1D4ED8",
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
                تعديل
              </button>

              <button
                type="button"
                onClick={() => setDeleteOpen(true)}
                style={{
                  height: 40,
                  padding: "0 1rem",
                  borderRadius: "var(--radius-lg)",
                  border: "1px solid #FECACA",
                  background: "#FEF2F2",
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#DC2626",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 7,
                  fontFamily: "var(--font-sans)",
                }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6l-1 14H6L5 6" />
                  <path d="M10 11v6M14 11v6" />
                  <path d="M9 6V4h6v2" />
                </svg>
                حذف
              </button>
            </div>
          </div>
        </header>

        {/* ── Details card ── */}
        <div
          style={{
            borderRadius: "var(--radius-xl)",
            border: "1px solid var(--color-border)",
            background: "var(--color-surface)",
            padding: "1.5rem 2rem",
            boxShadow: "var(--shadow-card)",
          }}
          dir="rtl"
        >
          {/* Address details */}
          <SectionHeader title="تفاصيل العنوان" />
          <DetailRow label="الشارع"       value={details.street} />
          <DetailRow label="المدينة"      value={details.city} />
          <DetailRow label="المنطقة"      value={details.state} />
          <DetailRow label="الحي"         value={details.district} />
          <DetailRow label="رقم المبنى"   value={details.buildingNo} />
          <DetailRow label="رقم الوحدة"   value={details.unitNo} />
          <DetailRow label="الرقم الإضافي" value={details.additionalNo} />
          <DetailRow label="الرمز البريدي" value={details.zipCode} />
          <DetailRow label="الشقة / الطابق" value={details.apartment} />
          <DetailRow label="الدولة"       value={details.country} />

          {/* Contact person */}
          {(contactPerson?.name || contactPerson?.phone) && (
            <>
              <SectionHeader title="جهة الاتصال" />
              <DetailRow label="الاسم"       value={contactPerson.name} />
              <DetailRow label="رقم الهاتف"  value={contactPerson.phone} />
            </>
          )}

          {/* Coordinates */}
          {location?.coordinates && (
            <>
              <SectionHeader title="الإحداثيات الجغرافية" />
              <DetailRow label="خط الطول (Longitude)" value={String(location.coordinates[0])} />
              <DetailRow label="خط العرض (Latitude)"  value={String(location.coordinates[1])} />
            </>
          )}

          {/* Metadata */}
          <SectionHeader title="معلومات النظام" />
          <DetailRow label="تاريخ الإنشاء"  value={new Date(address.createdAt).toLocaleString("ar-SA")} />
          <DetailRow label="آخر تحديث"      value={new Date(address.updatedAt).toLocaleString("ar-SA")} />
        </div>
      </section>
    </>
  );
}