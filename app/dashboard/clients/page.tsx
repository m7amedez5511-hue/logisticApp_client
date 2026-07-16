"use client";


import { useState } from "react";
import { useRouter } from "next/navigation";

// ── UI components ──────────────────────────────────────────────────────────
// NOTE: Toast is now imported from the canonical UI barrel, NOT from Client/Toast.
import { Alert, Toast, ArchiveButton, ConfirmDialog } from "@/src/Components/UI";

// ── Client-specific components ─────────────────────────────────────────────
import { useClients }         from "@/src/hooks/useClients";
import type { Client, ClientFormData } from "@/src/types/client";
import { ClientFormModal , ClientTable }    from "@/src/Components/Client";
import { ArchivedClientsModal } from "@/src/Components/Client/archive/ArchivedClientsModal";


export default function ClientsPage() {
  const router = useRouter();

  // ── Modal state ──────────────────────────────────────────────────────────
  // false = closed | null = create mode | Client = edit mode
  const [formTarget,   setFormTarget]   = useState<Client | null | false>(false);
  const [deleteTarget, setDeleteTarget] = useState<Client | null>(null);
  const [deleting,     setDeleting]     = useState(false);
  // Archive browser modal open/closed
  const [archiveOpen,  setArchiveOpen]  = useState(false);

  // ── Data hook ────────────────────────────────────────────────────────────
  const {
    clients, loading, total, pages, error,
    page, search,
    setPage, handleSearch, clearError,
    createClient, updateClient, deleteClient,
    notification,
  } = useClients();

  // ── Create / Update handler ──────────────────────────────────────────────
  const handleFormSubmit = async (
    data: ClientFormData,
    isNew: boolean,
  ): Promise<boolean> => {
    if (isNew) return createClient(data);
    return updateClient((formTarget as Client).id, data);
  };

  // ── Delete handler ───────────────────────────────────────────────────────
  const handleDeleteConfirm = async () => {
    if (!deleteTarget || deleting) return;
    setDeleting(true);
    const ok = await deleteClient(deleteTarget.id);
    setDeleting(false);
    if (ok) setDeleteTarget(null);
  };

  // ── Navigate to address management ──────────────────────────────────────
  // This is called both by the AddressBadge click and the "العناوين" button
  // inside the ClientDetailPanel.
  const handleManageAddresses = (client: Client) => {
    router.push(`/dashboard/clients/${client.id}/addresses`);
  };

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <>
      {/*
       * Global toast notification.
       * Using the new UI/Toast which accepts ToastNotification | null.
       * The hook's `notification` shape { type, message } matches ToastNotification exactly.
       */}
      <Toast notification={notification} />

      {/* Create / Edit modal */}
      {formTarget !== false && (
        <ClientFormModal
          editClient={formTarget}
          onClose={() => setFormTarget(false)}
          onSubmit={handleFormSubmit}
        />
      )}

      {/* Delete confirmation dialog */}
      <ConfirmDialog
        open={!!deleteTarget}
        loading={deleting}
        onCancel={() => { if (!deleting) setDeleteTarget(null); }}
        onConfirm={handleDeleteConfirm}
        title="حذف العميل"
        description={`هل أنت متأكد من حذف ${deleteTarget?.name ?? ""}؟ سيتم حذف جميع عناوينه أيضاً. لا يمكن التراجع عن هذا الإجراء.`}
      />

      {/* Archive browser modal */}
      {archiveOpen && (
        <ArchivedClientsModal onClose={() => setArchiveOpen(false)} />
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
          <p
            style={{
              fontSize: 11,
              letterSpacing: "0.3em",
              textTransform: "uppercase",
              color: "#2563EB",
              fontWeight: 600,
            }}
          >
            إدارة العملاء
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
                العملاء
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
                  {total}
                </strong>{" "}
                عميل
              </p>
            </div>

            <div
              style={{
                display: "flex",
                gap: "0.5rem",
                flexWrap: "wrap",
                alignItems: "center",
              }}
            >
              {/* Search input */}
              <div style={{ position: "relative", width: 256 }}>
                <svg
                  style={{
                    position: "absolute",
                    right: 12,
                    top: "50%",
                    transform: "translateY(-50%)",
                    width: 16,
                    height: 16,
                    color: "var(--color-text-hint)",
                    pointerEvents: "none",
                  }}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
                <input
                  type="text"
                  placeholder="بحث بالاسم أو الهاتف أو البريد…"
                  value={search}
                  onChange={(e) => handleSearch(e.target.value)}
                  dir="rtl"
                  style={{
                    width: "100%",
                    height: 40,
                    paddingRight: 36,
                    paddingLeft: 12,
                    borderRadius: "var(--radius-lg)",
                    border: "1px solid var(--color-border)",
                    background: "var(--color-surface)",
                    fontSize: 13,
                    outline: "none",
                    fontFamily: "var(--font-sans)",
                    color: "var(--color-text-primary)",
                  }}
                />
              </div>

              {/* Add client button */}
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
                إضافة عميل
              </button>
            </div>
          </div>
        </header>

        {/* General load error */}
        {error && <Alert type="error" message={error} onClose={clearError} />}

        {/* Clients table */}
        <ClientTable
          clients={clients}
          loading={loading}
          search={search}
          page={page}
          pages={pages}
          onEdit={(client) => setFormTarget(client)}
          onDelete={(client) => setDeleteTarget(client)}
          onAddFirst={() => setFormTarget(null)}
          onPageChange={setPage}
          onManageAddresses={handleManageAddresses}
        />
      </section>

      {/* Floating button to open the archive browser */}
      <ArchiveButton onClick={() => setArchiveOpen(true)} label="أرشيف العملاء" />
    </>
  );
}