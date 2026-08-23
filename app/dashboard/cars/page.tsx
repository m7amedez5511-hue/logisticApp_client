"use client";

import { useCallback, useState } from "react";
import {
  Spinner,
  Alert,
  ArchiveButton,
  ConfirmDialog,
} from "@/src/Components/UI";
import { CarFormModal, CarDetailPanel } from "@/src/Components/car";
import { ArchivedCarsModal } from "@/src/Components/car/archive/Archivedcarsmodal";
import { CarMaintenanceFormModal } from "@/src/Components/Car_Maintanance/CarMaintananceFormModal";
import { useCars, useCarMutations, useToast } from "@/src/hooks/useCars";
import { useCarMaintenanceMutations } from "@/src/hooks/UseCarsMaintanance";
import {
  fmtDateShort,
  isExpiringSoon,
  STATUS_MAP,
  INS_MAP,
} from "@/src/types/car";
import type {
  Car,
  CreateCarPayload,
  ToastMsg,
  UpdateCarPayload,
} from "@/src/types/car";
import type {
  CreateMaintenancePayload,
  UpdateMaintenancePayload,
} from "@/src/types/carMaintanance";

// ── Toast ─────────────────────────────────────────────────────────────────────

function CarToast({ notification }: { notification: ToastMsg | null }) {
  if (!notification) return null;
  const ok = notification.type === "success";
  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: "fixed",
        bottom: 24,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 9999,
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "0.75rem 1.25rem",
          borderRadius: "var(--radius-full)",
          background: ok ? "#065F46" : "#7F1D1D",
          color: "#FFF",
          fontSize: 13,
          fontWeight: 600,
          boxShadow: "0 8px 32px rgba(0,0,0,.25)",
          maxWidth: "90vw",
          whiteSpace: "nowrap",
          fontFamily: "var(--font-sans)",
        }}
      >
        <span style={{ fontSize: 16 }}>{ok ? "✓" : "⚠"}</span>
        <span>{notification.message}</span>
      </div>
    </div>
  );
}

// ── CarCard ───────────────────────────────────────────────────────────────────
// NOTE: hover/lift affordance is implemented via Tailwind `hover:`/`focus-visible:`
// classes instead of onMouseEnter/onMouseLeave DOM mutation, so keyboard users
// (tabbing to this card, which is already role="button" tabIndex={0}) get the
// same visual feedback as mouse users via the native :focus-visible pseudo-class.

function CarCard({
  car,
  onClick,
  onSendToMaintenance,
}: {
  car: Car;
  onClick: () => void;
  onSendToMaintenance: (car: Car) => void;
}) {
  const status = STATUS_MAP[car.currentStatus];
  const ins = car.insuranceStatus ? INS_MAP[car.insuranceStatus] : null;
  const regWarn = isExpiringSoon(car.registrationExpiryDate);

  // Maintenance status can ONLY be set via this button's flow (POST
  // cars/:carId/maintenance flips it on the backend). Disable rather than
  // hide it once the car is already in maintenance or inactive, and explain why.
  const maintenanceDisabled =
    car.currentStatus === "InMaintenance" || car.currentStatus === "Inactive";
  const maintenanceDisabledReason =
    car.currentStatus === "InMaintenance"
      ? "المركبة في الصيانة بالفعل"
      : car.currentStatus === "Inactive"
        ? "لا يمكن إرسال مركبة غير نشطة للصيانة"
        : undefined;

  return (
    <article
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onClick();
      }}
      aria-label={`${car.manufacturer} ${car.model} — ${car.plateLetters} ${car.plateNumber}`}
      className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden shadow-[var(--shadow-card)] cursor-pointer outline-none transition-all duration-200 hover:shadow-[0_8px_24px_rgba(37,99,235,.12)] hover:-translate-y-0.5 focus-visible:shadow-[0_8px_24px_rgba(37,99,235,.12)] focus-visible:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-[var(--color-brand-600)] focus-visible:ring-offset-2"
    >
      {/* Colour accent bar by status */}
      <div
        style={{
          height: 4,
          background: status.dot,
          borderRadius: "var(--radius-xl) var(--radius-xl) 0 0",
        }}
      />

      <div style={{ padding: "1.25rem" }}>
        {/* Manufacturer + model */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 8,
          }}
        >
          <div>
            <p
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: "var(--color-text-primary)",
                margin: 0,
              }}
            >
              {car.manufacturer} {car.model}
            </p>
            <p
              style={{
                fontSize: 12,
                color: "var(--color-text-muted)",
                marginTop: 2,
              }}
            >
              {car.year}
              {car.color ? ` · ${car.color}` : ""}
            </p>
          </div>
          {/* Status badge */}
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              borderRadius: "var(--radius-full)",
              border: `1px solid ${status.border}`,
              background: status.bg,
              padding: "0.2rem 0.625rem",
              fontSize: 11,
              fontWeight: 700,
              color: status.color,
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: status.dot,
              }}
            />
            {status.label}
          </span>
        </div>

        {/* Plate number */}
        <div
          style={{
            marginTop: "0.875rem",
            background: "var(--color-surface-muted)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-md)",
            padding: "0.5rem 0.75rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span
            style={{
              fontSize: 11,
              color: "var(--color-text-muted)",
              fontWeight: 600,
            }}
          >
            رقم اللوحة
          </span>
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 14,
              fontWeight: 700,
              letterSpacing: "0.1em",
              color: "var(--color-brand-700)",
            }}
          >
            {car.plateLetters} {car.plateNumber}
          </span>
        </div>

        {/* Key attributes grid */}
        <div
          style={{
            marginTop: "0.875rem",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "0.5rem",
          }}
        >
          <div style={{ fontSize: 11 }}>
            <span
              style={{
                color: "var(--color-text-muted)",
                fontWeight: 600,
                display: "block",
              }}
            >
              الفرع
            </span>
            <span
              style={{
                color: "var(--color-text-primary)",
                marginTop: 2,
                display: "block",
              }}
            >
              {car.branch?.name ?? "—"}
            </span>
          </div>
          <div style={{ fontSize: 11 }}>
            <span
              style={{
                color: "var(--color-text-muted)",
                fontWeight: 600,
                display: "block",
              }}
            >
              التأمين
            </span>
            <span
              style={{
                color: ins?.color ?? "var(--color-text-muted)",
                marginTop: 2,
                display: "block",
                fontWeight: 600,
              }}
            >
              {ins?.label ?? "—"}
            </span>
          </div>
          <div style={{ fontSize: 11 }}>
            <span
              style={{
                color: "var(--color-text-muted)",
                fontWeight: 600,
                display: "block",
              }}
            >
              انتهاء الاستمارة
            </span>
            <span
              style={{
                color: regWarn ? "#D97706" : "var(--color-text-secondary)",
                marginTop: 2,
                display: "block",
                fontWeight: regWarn ? 600 : 400,
              }}
            >
              {regWarn && "⚠ "}
              {fmtDateShort(car.registrationExpiryDate)}
            </span>
          </div>
          <div style={{ fontSize: 11 }}>
            <span
              style={{
                color: "var(--color-text-muted)",
                fontWeight: 600,
                display: "block",
              }}
            >
              الطاقة
            </span>
            <span
              style={{
                color: "var(--color-text-secondary)",
                marginTop: 2,
                display: "block",
              }}
            >
              {car.capacity != null ? car.capacity : "—"}
            </span>
          </div>
        </div>

        {/* Send to Maintenance quick action */}
        <button
          type="button"
          title={maintenanceDisabledReason}
          disabled={maintenanceDisabled}
          onClick={(e) => {
            e.stopPropagation();
            onSendToMaintenance(car);
          }}
          style={{
            marginTop: "0.875rem",
            width: "100%",
            height: 34,
            borderRadius: "var(--radius-md)",
            border: `1px solid ${maintenanceDisabled ? "var(--color-border)" : "#FDE68A"}`,
            background: maintenanceDisabled
              ? "var(--color-surface-muted)"
              : "#FFFBEB",
            fontSize: 12,
            fontWeight: 700,
            color: maintenanceDisabled ? "var(--color-text-hint)" : "#854D0E",
            cursor: maintenanceDisabled ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            fontFamily: "var(--font-sans)",
          }}
        >
          <i
            className="ti ti-tool"
            style={{ fontSize: 13 }}
            aria-hidden="true"
          />
          إرسال للصيانة
        </button>

        {/* Footer CTA hint */}
        <p
          style={{
            marginTop: "0.75rem",
            fontSize: 11,
            color: "var(--color-brand-600)",
            fontWeight: 600,
            textAlign: "left",
          }}
        >
          اضغط لعرض التفاصيل ←
        </p>
      </div>
    </article>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function CarsPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  // Modal state
  const [detailId, setDetailId] = useState<string | null>(null);
  const [formTarget, setFormTarget] = useState<Car | null | false>(false); // false = closed
  const [deleteTarget, setDeleteTarget] = useState<Car | null>(null);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [maintenanceTarget, setMaintenanceTarget] = useState<Car | null>(null);

  const { toast, notify } = useToast();

  const { cars, loading, error, total, pages, loadCars, removeCar, setError } =
    useCars(page, search);

  // Need a stable ref to the current edit target for the mutation hook
  const getEditTarget = useCallback(
    () =>
      formTarget instanceof Object && formTarget !== null
        ? (formTarget as Car)
        : null,
    [formTarget],
  );

  const { deleting, handleFormSubmit, handleDeleteConfirm } = useCarMutations({
    onSuccess: (msg) => {
      notify({ type: "success", message: msg });
      loadCars();
    },
    onError: (msg) => notify({ type: "error", message: msg }),
    onDeleted: (id) => {
      removeCar(id);
      setDeleteTarget(null);
    },
    getEditTarget,
  });

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await handleDeleteConfirm(deleteTarget);
  };

  // "Send to Maintenance" mutation — carId is bound to whichever car the
  // person just clicked. Errors surface inline inside the modal's own
  // apiError state (its default behavior), not through the outer toast —
  // onError is intentionally a no-op here.
  const { handleFormSubmit: handleMaintenanceSubmit } =
    useCarMaintenanceMutations({
      carId: maintenanceTarget?.id ?? "",
      onSuccess: (msg) => {
        notify({ type: "success", message: msg });
        loadCars();
      },
      onError: () => {},
      onDeleted: () => {},
      getEditTarget: () => null,
    });

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <>
      <CarToast notification={toast} />

      {detailId && (
        <CarDetailPanel
          carId={detailId}
          onClose={() => setDetailId(null)}
          onEdit={(car) => {
            setDetailId(null);
            setFormTarget(car);
          }}
          onDelete={(car) => {
            setDetailId(null);
            setDeleteTarget(car);
          }}
        />
      )}

      {formTarget !== false && (
        <CarFormModal
          // CHANGE: added key — same fix as UserFormModal/DriverFormModal,
          // forces a fresh useForm instance (and fresh defaultValues) when
          // switching between "new" and different edit targets.
          key={formTarget === null ? "new" : formTarget.id}
          editCar={formTarget}
          branches={[]}
          onClose={() => setFormTarget(false)}
          onSubmit={(
            payload: CreateCarPayload | UpdateCarPayload,
            isNew: boolean,
          ) =>
            handleFormSubmit(payload, isNew).then((ok) => {
              if (ok) setFormTarget(false);
              return ok;
            })
          }
        />
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        loading={deleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="حذف المركبة"
        description={`هل أنت متأكد من حذف ${deleteTarget?.manufacturer ?? ""} ${deleteTarget?.model ?? ""} (${deleteTarget?.plateLetters ?? ""} ${deleteTarget?.plateNumber ?? ""})؟ لا يمكن التراجع عن هذا الإجراء.`}
      />

      {maintenanceTarget && (
        <CarMaintenanceFormModal
          editRecord={null}
          carLabel={`${maintenanceTarget.manufacturer} ${maintenanceTarget.model} — ${maintenanceTarget.plateLetters} ${maintenanceTarget.plateNumber}`}
          onClose={() => setMaintenanceTarget(null)}
          onSubmit={(
            payload: CreateMaintenancePayload | UpdateMaintenancePayload,
            isNew: boolean,
          ) => handleMaintenanceSubmit(payload, isNew)}
        />
      )}

      {archiveOpen && (
        <ArchivedCarsModal onClose={() => setArchiveOpen(false)} />
      )}

      <section
        style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}
        dir="rtl"
      >
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
          <p
            style={{
              fontSize: 11,
              letterSpacing: "0.3em",
              textTransform: "uppercase",
              color: "#2563EB",
              fontWeight: 600,
            }}
          >
            إدارة الأسطول
          </p>
          <div
            style={{
              marginTop: "0.75rem",
              display: "flex",
              flexWrap: "wrap",
              gap: "1rem",
              alignItems: "flex-end",
              justifyContent: "space-between",
            }}
          >
            <div>
              <h1
                style={{
                  fontSize: "1.5rem",
                  fontWeight: 700,
                  color: "var(--color-text-primary)",
                  margin: 0,
                }}
              >
                المركبات
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
                مركبة في الأسطول
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
              {/* Search */}
              <div style={{ position: "relative", width: 256 }}>
                <i
                  className="ti ti-search"
                  aria-hidden="true"
                  style={{
                    position: "absolute",
                    right: 12,
                    top: "50%",
                    transform: "translateY(-50%)",
                    fontSize: 16,
                    color: "var(--color-text-hint)",
                    pointerEvents: "none",
                  }}
                />
                <input
                  type="text"
                  placeholder="بحث بالماركة أو اللوحة..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
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
                    color: "var(--color-text-primary)",
                    outline: "none",
                    fontFamily: "var(--font-sans)",
                  }}
                />
              </div>

              {/* Add button */}
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
                <i
                  className="ti ti-plus"
                  style={{ fontSize: 14 }}
                  aria-hidden="true"
                />
                إضافة مركبة
              </button>
            </div>
          </div>
        </header>

        {/* Error alert */}
        {error && (
          <Alert type="error" message={error} onClose={() => setError(null)} />
        )}

        {/* ── Loading ── */}
        {loading ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 12,
              padding: "5rem 0",
              color: "var(--color-text-muted)",
            }}
          >
            <Spinner size="md" className="text-blue-600" />
            <span style={{ fontSize: 14 }}>جارٍ تحميل المركبات…</span>
          </div>
        ) : cars.length === 0 ? (
          <div
            style={{
              borderRadius: "var(--radius-xl)",
              border: "2px dashed var(--color-border)",
              background: "var(--color-surface)",
              padding: "5rem 2rem",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 52, marginBottom: 16 }}>🚗</div>
            <p
              style={{
                fontSize: 16,
                fontWeight: 600,
                color: "var(--color-text-primary)",
              }}
            >
              {search
                ? `لا توجد مركبات تطابق "${search}"`
                : "لا توجد مركبات بعد"}
            </p>
            <p
              style={{
                fontSize: 13,
                color: "var(--color-text-muted)",
                marginTop: 6,
              }}
            >
              اضغط على &quot;إضافة مركبة&quot; لإضافة أول مركبة في الأسطول.
            </p>
            {!search && (
              <button
                type="button"
                onClick={() => setFormTarget(null)}
                style={{
                  marginTop: 16,
                  height: 40,
                  padding: "0 1.5rem",
                  borderRadius: "var(--radius-lg)",
                  border: "none",
                  background: "var(--color-brand-600)",
                  fontSize: 13,
                  fontWeight: 700,
                  color: "#FFF",
                  cursor: "pointer",
                  fontFamily: "var(--font-sans)",
                }}
              >
                إضافة مركبة
              </button>
            )}
          </div>
        ) : (
          /* ── Card grid ── */
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
              gap: "1rem",
            }}
          >
            {/* PERF NOTE: Cards are rendered inline via .map() below. At the
                current pagination size (10-12 items) this is not a bottleneck.
                If page size increases (e.g. "show all" mode, a larger
                page-size selector, or removal of server-side pagination),
                extract <CarCard> is already its own component above — wrap
                it in React.memo at that point, and make sure onClick /
                onSendToMaintenance passed to it are stable (useCallback)
                so memoization is actually effective. */}
            {cars.map((car) => (
              <CarCard
                key={car.id}
                car={car}
                onClick={() => setDetailId(car.id)}
                onSendToMaintenance={(c) => setMaintenanceTarget(c)}
              />
            ))}
          </div>
        )}

        {/* ── Pagination ── */}
        {pages > 1 && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderRadius: "var(--radius-xl)",
              border: "1px solid var(--color-border)",
              background: "var(--color-surface)",
              padding: "0.875rem 1.5rem",
              boxShadow: "var(--shadow-card)",
            }}
          >
            <span style={{ fontSize: 12, color: "var(--color-text-muted)" }}>
              صفحة{" "}
              <strong style={{ color: "var(--color-text-primary)" }}>
                {page}
              </strong>{" "}
              من{" "}
              <strong style={{ color: "var(--color-text-primary)" }}>
                {pages}
              </strong>
              {" · "}
              <span style={{ color: "var(--color-text-hint)" }}>
                {total} مركبة
              </span>
            </span>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              {[
                {
                  label: "← السابق",
                  action: () => setPage((p) => Math.max(1, p - 1)),
                  disabled: page === 1,
                },
                {
                  label: "التالي →",
                  action: () => setPage((p) => Math.min(pages, p + 1)),
                  disabled: page === pages,
                },
              ].map((btn) => (
                <button
                  key={btn.label}
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
                    fontWeight: 600,
                  }}
                >
                  {btn.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Floating button to open the archive browser */}
      <ArchiveButton onClick={() => setArchiveOpen(true)} />
    </>
  );
}
