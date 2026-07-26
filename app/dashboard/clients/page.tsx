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
import Header from "@/src/Components/UI/Header";


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
        <Header
          state={{ total }}
          search={search}
          setSearch={handleSearch}
          module=""
          setModule={() => {}}
          title="العملاء"
          mainTitle="إدارة العملاء"
          setPage={setPage}
          name={"عميل"}
          isAudit={false}
          onAdd={() => setFormTarget(null)}
        />

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
      <ArchiveButton onClick={() => setArchiveOpen(true)} label="الأرشيف" />
    </>
  );
}