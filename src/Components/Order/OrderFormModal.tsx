"use client";


import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { Alert, Spinner } from "../UI";
import { getStoredToken } from "@/src/lib/auth";
import { clientService } from "@/src/services/client.service";
import { tripService }   from "@/src/services/trip.service";
import { createOrderSchema, updateOrderSchema } from "@/src/validations/order.validation";
import type { ValidationError } from "yup";
import type {
  Order,
  CreateOrderPayload,
  UpdateOrderPayload,
  PaymentMethod,
  PaymentStatus,
} from "@/src/types/order";
import type { Client } from "@/src/types/client";
import type { Trip }   from "@/src/types/trip";
import type { OrderSchemaErrors } from "@/src/validations/order.validation";

// ── Shared input / label styles — verbatim from DriverFormModal.tsx ──────────

const inputBase: React.CSSProperties = {
  width: "100%",
  height: 40,
  padding: "0 0.75rem",
  borderRadius: "var(--radius-md)",
  border: "1px solid var(--color-border)",
  background: "var(--color-surface)",
  fontSize: 13,
  color: "var(--color-text-primary)",
  outline: "none",
  fontFamily: "var(--font-sans)",
};

const labelStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 6,
  fontSize: 12,
  fontWeight: 600,
  color: "var(--color-text-secondary)",
};

const errorTextStyle: React.CSSProperties = {
  fontSize: 11,
  color: "var(--color-danger)",
  fontWeight: 500,
};

const sectionHeadingStyle: React.CSSProperties = {
  fontSize: 11,
  letterSpacing: "0.25em",
  textTransform: "uppercase",
  color: "var(--color-text-hint)",
  fontWeight: 700,
  margin: "0.5rem 0 0",
};

const optionalLabelStyle: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 500,
  color: "var(--color-text-hint)",
  marginRight: 4,
};

/** Small "Create new" link rendered below each relation dropdown. */
const createLinkStyle: React.CSSProperties = {
  fontSize: 11,
  color: "var(--color-brand-600)",
  textDecoration: "none",
  fontWeight: 500,
  marginTop: 2,
  display: "inline-flex",
  alignItems: "center",
  gap: 3,
};

// ── Props ────────────────────────────────────────────────────────────────────

interface OrderFormModalProps {
  editOrder: Order | null;
  onClose: () => void;
  onSubmit: (
    payload: CreateOrderPayload | UpdateOrderPayload,
    isNew: boolean,
  ) => Promise<boolean>;
}

// ── Component ────────────────────────────────────────────────────────────────

export function OrderFormModal({ editOrder, onClose, onSubmit }: OrderFormModalProps) {
  const isNew = editOrder === null;

  // ── Relation data — clients & trips loaded once on mount ─────────────────
  const [clients, setClients]           = useState<Client[]>([]);
  const [trips,   setTrips]             = useState<Trip[]>([]);
  const [relLoading, setRelLoading]     = useState(true);

  // ── Form state ────────────────────────────────────────────────────────────
  const [shipmentNumber, setShipmentNumber] = useState(editOrder?.shipmentNumber ?? "");
  const [recipientName,  setRecipientName]  = useState(editOrder?.recipientName  ?? "");
  const [recipientPhone, setRecipientPhone] = useState(editOrder?.recipientPhone ?? "");
  const [clientId,       setClientId]       = useState(editOrder?.clientId       ?? "");
  const [tripId,         setTripId]         = useState(editOrder?.tripId         ?? "");
  const [type,           setType]           = useState(editOrder?.type           ?? "");
  const [quantity,       setQuantity]       = useState(String(editOrder?.quantity ?? 1));
  const [weight,         setWeight]         = useState(
    editOrder?.weight != null ? String(editOrder.weight) : "",
  );
  const [subTotal,       setSubTotal]       = useState(
    editOrder?.subTotal != null ? String(editOrder.subTotal) : "",
  );
  const [vatRate,        setVatRate]        = useState(
    editOrder?.vatRate != null ? String(editOrder.vatRate) : "",
  );
  const [paymentMethod,  setPaymentMethod]  = useState<PaymentMethod | "">(
    editOrder?.paymentMethod ?? "",
  );
  const [paymentStatus,  setPaymentStatus]  = useState<PaymentStatus | "">(
    editOrder?.paymentStatus ?? "",
  );

  // ── Address state ─────────────────────────────────────────────────────────
  // Delivery address (عنوان التسليم) — always creates new MongoDB doc
  const [delCity,       setDelCity]       = useState(editOrder?.deliveryAddress?.details?.city       ?? "");
  const [delDistrict,   setDelDistrict]   = useState(editOrder?.deliveryAddress?.details?.district   ?? "");
  const [delStreet,     setDelStreet]     = useState(editOrder?.deliveryAddress?.details?.street     ?? "");
  const [delBuildingNo, setDelBuildingNo] = useState(editOrder?.deliveryAddress?.details?.buildingNo ?? "");
  const [delUnitNo,     setDelUnitNo]     = useState(editOrder?.deliveryAddress?.details?.unitNo     ?? "");
  const [delZipCode,    setDelZipCode]    = useState(editOrder?.deliveryAddress?.details?.zipCode    ?? "");
  // GeoJSON coordinates [longitude, latitude] — required by backend
  const [delLng,        setDelLng]        = useState(
    editOrder?.deliveryAddress?.location?.coordinates?.[0] != null
      ? String(editOrder.deliveryAddress!.location!.coordinates![0])
      : "",
  );
  const [delLat,        setDelLat]        = useState(
    editOrder?.deliveryAddress?.location?.coordinates?.[1] != null
      ? String(editOrder.deliveryAddress!.location!.coordinates![1])
      : "",
  );

  // Pickup address (عنوان الاستلام) — إما ID موجود أو object جديد
  const [pickupMode,    setPickupMode]    = useState<"id" | "new">(
    editOrder?.pickupAddressId ? "id" : "new",
  );
  const [pickupAddressId, setPickupAddressId] = useState(editOrder?.pickupAddressId ?? "");
  const [pkpCity,       setPkpCity]       = useState(editOrder?.pickupAddress?.details?.city       ?? "");
  const [pkpDistrict,   setPkpDistrict]   = useState(editOrder?.pickupAddress?.details?.district   ?? "");
  const [pkpStreet,     setPkpStreet]     = useState(editOrder?.pickupAddress?.details?.street     ?? "");
  const [pkpBuildingNo, setPkpBuildingNo] = useState(editOrder?.pickupAddress?.details?.buildingNo ?? "");
  const [pkpUnitNo,     setPkpUnitNo]     = useState(editOrder?.pickupAddress?.details?.unitNo     ?? "");
  const [pkpZipCode,    setPkpZipCode]    = useState(editOrder?.pickupAddress?.details?.zipCode    ?? "");
  // GeoJSON coordinates [longitude, latitude] — optional for pickup
  const [pkpLng,        setPkpLng]        = useState(
    editOrder?.pickupAddress?.location?.coordinates?.[0] != null
      ? String(editOrder.pickupAddress!.location!.coordinates![0])
      : "",
  );
  const [pkpLat,        setPkpLat]        = useState(
    editOrder?.pickupAddress?.location?.coordinates?.[1] != null
      ? String(editOrder.pickupAddress!.location!.coordinates![1])
      : "",
  );


  const [errors,   setErrors]   = useState<OrderSchemaErrors>({});
  const [saving,   setSaving]   = useState(false);
  const [apiError, setApiError] = useState("");
  const firstRef = useRef<HTMLInputElement>(null);

  // ── Load clients + trips in parallel on mount ─────────────────────────────
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const token = getStoredToken();

        // Fetch first 100 clients (enough for a practical dropdown)
        const clientRes = await clientService.getAll(1, "", token);
        const clientPayload = (clientRes as any).data ?? clientRes;
        const clientList: Client[] = clientPayload.data ?? [];

        // Fetch first 100 trips (active ones the order can be assigned to)
        const tripRes = await tripService.getAll({ page: 1, limit: 100 }, token);
        const tripPayload = (tripRes as any).data ?? tripRes;
        const tripList: Trip[] = tripPayload.data ?? [];

        if (!cancelled) {
          setClients(clientList);
          setTrips(tripList);
        }
      } catch (err) {
        // Logged so failures are visible during development instead of
        // failing completely silently when clientService/tripService error out
        // (e.g. expired token, CORS, 500). Dropdowns stay empty either way,
        // and the user can still navigate to the create pages via the helper
        // links — but now they also see a message explaining why.
        console.error("OrderFormModal: failed to load clients/trips", err);
        if (!cancelled) {
          setApiError("تعذّر تحميل قوائم العملاء والرحلات. تحقق من اتصالك وحاول إعادة فتح النافذة.");
        }
      } finally {
        if (!cancelled) setRelLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // ── Keyboard / focus setup ────────────────────────────────────────────────
  useEffect(() => { firstRef.current?.focus(); }, []);
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  // ── Dynamic input error style ─────────────────────────────────────────────
  const inputStyle = (field: keyof OrderSchemaErrors): React.CSSProperties => ({
    ...inputBase,
    border: errors[field]
      ? "1px solid var(--color-danger)"
      : inputBase.border,
    ...(errors[field] ? { background: "#FEF2F2" } : {}),
  });

  const clearFieldError = useCallback(
    (field: keyof OrderSchemaErrors) => setErrors((p) => ({ ...p, [field]: undefined })),
    [],
  );

  // ── Yup validation ────────────────────────────────────────────────────────
  const runValidation = useCallback(async (): Promise<boolean> => {
    const schema = isNew ? createOrderSchema : updateOrderSchema;
    try {
      await schema.validate(
        {
          tripId,
          clientId,
          shipmentNumber,
          recipientName,
          recipientPhone,
          quantity: quantity ? Number(quantity) : undefined,
          weight:   weight   ? Number(weight)   : undefined,
          subTotal: subTotal ? Number(subTotal) : undefined,
          vatRate:  vatRate  ? Number(vatRate)  : undefined,
          paymentMethod:  paymentMethod  || undefined,
          paymentStatus:  paymentStatus  || undefined,
          type: type || undefined,
        },
        { abortEarly: false },
      );
      setErrors({});
      return true;
    } catch (err) {
      const bag: OrderSchemaErrors = {};
      (err as ValidationError).inner.forEach((e) => {
        if (e.path) (bag as Record<string, string>)[e.path] = e.message;
      });
      setErrors(bag);
      return false;
    }
  }, [isNew, tripId, clientId, shipmentNumber, recipientName, recipientPhone,
      quantity, weight, subTotal, vatRate, paymentMethod, paymentStatus, type]);

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    console.log("her");
    
    e.preventDefault();

    const valid = await runValidation();
    if (!valid) return;

    // Build clean payload.
    // NOTE: deliveryAddressId / pickupAddressId are intentionally omitted
    // from create payloads — the backend creates address records from
    // deliveryAddressData / pickupAddressData instead.
    const payload: Record<string, unknown> = {
      shipmentNumber,
      recipientName,
      recipientPhone,
      clientId,
      quantity: Number(quantity) || 1,
    };

    // tripId: only include when a value is selected
    if (tripId) payload.tripId = tripId;

    // Optional fields — include only when filled
    if (type)          payload.type          = type;
    if (weight)        payload.weight        = Number(weight);
    if (subTotal)      payload.subTotal      = Number(subTotal);
    if (vatRate)       payload.vatRate       = Number(vatRate);
    if (paymentMethod) payload.paymentMethod = paymentMethod;
    if (paymentStatus) payload.paymentStatus = paymentStatus;

    // ── Build delivery address object (only if at least one field filled) ──
    const delDetails = {
      ...(delCity       && { city:       delCity }),
      ...(delDistrict   && { district:   delDistrict }),
      ...(delStreet     && { street:     delStreet }),
      ...(delBuildingNo && { buildingNo: delBuildingNo }),
      ...(delUnitNo     && { unitNo:     delUnitNo }),
      ...(delZipCode    && { zipCode:    delZipCode }),
    };
    // coordinates are always included when provided (required by backend GeoJSON schema)
    const delCoordinates =
      delLng.trim() && delLat.trim()
        ? [Number(delLng), Number(delLat)]
        : undefined;

    if (Object.keys(delDetails).length > 0 || delCoordinates) {
      payload.deliveryAddress = {
        ...(Object.keys(delDetails).length > 0 && { details: delDetails }),
        ...(delCoordinates && { location: { coordinates: delCoordinates } }),
      };
    }

    // ── Build pickup address: ID or new object ──
    if (pickupMode === "id" && pickupAddressId.trim()) {
      payload.pickupAddressId = pickupAddressId.trim();
    } else {
      const pkpDetails = {
        ...(pkpCity       && { city:       pkpCity }),
        ...(pkpDistrict   && { district:   pkpDistrict }),
        ...(pkpStreet     && { street:     pkpStreet }),
        ...(pkpBuildingNo && { buildingNo: pkpBuildingNo }),
        ...(pkpUnitNo     && { unitNo:     pkpUnitNo }),
        ...(pkpZipCode    && { zipCode:    pkpZipCode }),
      };
      const pkpCoordinates =
        pkpLng.trim() && pkpLat.trim()
          ? [Number(pkpLng), Number(pkpLat)]
          : undefined;

      if (Object.keys(pkpDetails).length > 0 || pkpCoordinates) {
        payload.pickupAddress = {
          ...(Object.keys(pkpDetails).length > 0 && { details: pkpDetails }),
          ...(pkpCoordinates && { location: { coordinates: pkpCoordinates } }),
        };
      }
    }


    setSaving(true);
    setApiError("");

    try {
      const ok = await onSubmit(payload as unknown as CreateOrderPayload, isNew);
      if (ok) {
        onClose();
      } else {
        setApiError("حدث خطأ غير متوقع. يرجى المحاولة لاحقاً.");
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "حدث خطأ غير متوقع. يرجى المحاولة لاحقاً.";
      setApiError(message);
    } finally {
      setSaving(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="order-modal-title"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: "fixed", inset: 0, zIndex: 50,
        background: "rgba(15,23,42,0.55)", backdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "1rem", overflowY: "auto",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 640,
          background: "var(--color-surface)",
          borderRadius: "var(--radius-2xl)",
          border: "1px solid var(--color-border)",
          boxShadow: "0 24px 64px rgba(0,0,0,.18)",
          overflow: "hidden", margin: "auto",
        }}
      >
        {/* ── Header ── */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "1.25rem 1.5rem",
          borderBottom: "1px solid var(--color-border)",
          background: "var(--color-surface-muted)",
        }}>
          <div>
            <p style={{
              fontSize: 11, letterSpacing: "0.3em", textTransform: "uppercase",
              color: "#2563EB", fontWeight: 600, margin: 0,
            }}>
              {isNew ? "إنشاء طلب" : "تعديل طلب"}
            </p>
            <h2
              id="order-modal-title"
              style={{
                fontSize: 17, fontWeight: 700,
                color: "var(--color-text-primary)",
                margin: "4px 0 0", fontFamily: "var(--font-mono)",
              }}
            >
              {isNew ? "طلب جديد" : editOrder?.shipmentNumber}
            </h2>
          </div>
          <button
            type="button" onClick={onClose} aria-label="إغلاق"
            style={{
              width: 34, height: 34, borderRadius: "var(--radius-md)",
              border: "1px solid var(--color-border)", background: "var(--color-surface)",
              cursor: "pointer", fontSize: 18, color: "var(--color-text-muted)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            ×
          </button>
        </div>

        {/* ── Form ── */}
        <form
          onSubmit={handleSubmit}
          noValidate
          style={{
            padding: "1.5rem",
            display: "flex", flexDirection: "column", gap: "1rem",
            maxHeight: "75vh", overflowY: "auto",
          }}
          dir="rtl"
        >
          {apiError && (
            <Alert type="error" message={apiError} onClose={() => setApiError("")} />
          )}

          {/* ── Section: Shipment & Recipient ── */}
          <p style={sectionHeadingStyle}>بيانات الشحنة والمستلم</p>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>

            {/* Shipment number — required */}
            <label style={labelStyle}>
              رقم الشحنة *
              <input
                ref={firstRef}
                style={inputStyle("shipmentNumber")}
                value={shipmentNumber}
                onChange={(e) => {
                  setShipmentNumber(e.target.value);
                  clearFieldError("shipmentNumber");
                }}
                placeholder="SHP-0001"
                dir="ltr"
                autoComplete="off"
              />
              {errors.shipmentNumber && (
                <span style={errorTextStyle}>{errors.shipmentNumber}</span>
              )}
            </label>

            {/* ── Client dropdown — required ── */}
            <label style={labelStyle}>
              العميل *
              <select
                style={{
                  ...inputStyle("clientId"),
                  cursor: relLoading ? "wait" : "pointer",
                  // Shift placeholder text right for RTL
                  paddingRight: "0.75rem",
                }}
                value={clientId}
                disabled={relLoading}
                onChange={(e) => {
                  setClientId(e.target.value);
                  clearFieldError("clientId");
                }}
                dir="rtl"
              >
                <option value="">
                  {relLoading ? "جارٍ التحميل…" : "اختر العميل"}
                </option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                    {c.phone ? ` — ${c.phone}` : ""}
                  </option>
                ))}
              </select>
              {errors.clientId && (
                <span style={errorTextStyle}>{errors.clientId}</span>
              )}
              {/* Helper link */}
              <Link href="/dashboard/clients" style={createLinkStyle} tabIndex={-1}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2.5">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                إنشاء عميل جديد
              </Link>
            </label>

            {/* Recipient name — required */}
            <label style={labelStyle}>
              اسم المستلم *
              <input
                style={inputStyle("recipientName")}
                value={recipientName}
                onChange={(e) => {
                  setRecipientName(e.target.value);
                  clearFieldError("recipientName");
                }}
                placeholder="أحمد محمد"
                dir="rtl"
              />
              {errors.recipientName && (
                <span style={errorTextStyle}>{errors.recipientName}</span>
              )}
            </label>

            {/* Recipient phone — required */}
            <label style={labelStyle}>
              رقم جوال المستلم *
              <input
                style={inputStyle("recipientPhone")}
                value={recipientPhone}
                onChange={(e) => {
                  setRecipientPhone(e.target.value);
                  clearFieldError("recipientPhone");
                }}
                placeholder="05XXXXXXXX"
                dir="ltr"
              />
              {errors.recipientPhone && (
                <span style={errorTextStyle}>{errors.recipientPhone}</span>
              )}
            </label>

            {/* ── Trip dropdown — required on create, optional on edit ── */}
            <label style={{ ...labelStyle, gridColumn: "1 / -1" }}>
              {isNew ? "الرحلة *" : "الرحلة"}
              {!isNew && <span style={optionalLabelStyle}>(اختياري)</span>}
              <select
                style={{
                  ...inputStyle("tripId"),
                  cursor: relLoading ? "wait" : "pointer",
                }}
                value={tripId ?? ""}
                disabled={relLoading}
                onChange={(e) => {
                  setTripId(e.target.value);
                  clearFieldError("tripId");
                }}
                dir="rtl"
              >
                <option value="">
                  {relLoading ? "جارٍ التحميل…" : "اختر الرحلة"}
                </option>
                {trips.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.tripNumber}
                    {t.title ? ` — ${t.title}` : ""}
                    {t.driver?.name ? ` (${t.driver.name})` : ""}
                  </option>
                ))}
              </select>
              {errors.tripId && (
                <span style={errorTextStyle}>{errors.tripId}</span>
              )}
              {/* Helper link */}
              <Link href="/dashboard/trips" style={createLinkStyle} tabIndex={-1}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2.5">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                إنشاء رحلة جديدة
              </Link>
            </label>
          </div>

          {/* ── Section: Shipment details ── */}
          <p style={sectionHeadingStyle}>تفاصيل الشحنة</p>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem" }}>
            {/* Type — optional */}
            <label style={labelStyle}>
              نوع الشحنة
              <span style={optionalLabelStyle}>(اختياري)</span>
              <input
                style={inputBase}
                value={type}
                onChange={(e) => setType(e.target.value)}
                placeholder="عادي / مبرد"
                dir="rtl"
              />
            </label>

            {/* Quantity — required, defaults to 1 */}
            <label style={labelStyle}>
              الكمية *
              <input
                style={inputStyle("quantity")}
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => {
                  setQuantity(e.target.value);
                  clearFieldError("quantity");
                }}
                dir="ltr"
              />
              {errors.quantity && (
                <span style={errorTextStyle}>{errors.quantity}</span>
              )}
            </label>

            {/* Weight — optional */}
            <label style={labelStyle}>
              الوزن (كجم)
              <span style={optionalLabelStyle}>(اختياري)</span>
              <input
                style={inputBase}
                type="number"
                min={0}
                step="0.01"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                dir="ltr"
              />
            </label>
          </div>

          {/* ── Section: Payment ── */}
          <p style={sectionHeadingStyle}>بيانات الدفع</p>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem" }}>
            {/* Subtotal — optional */}
            <label style={labelStyle}>
              الإجمالي الفرعي
              <span style={optionalLabelStyle}>(اختياري)</span>
              <input
                style={inputStyle("subTotal")}
                type="number"
                min={0}
                step="0.01"
                value={subTotal}
                onChange={(e) => {
                  setSubTotal(e.target.value);
                  clearFieldError("subTotal");
                }}
                dir="ltr"
              />
              {errors.subTotal && (
                <span style={errorTextStyle}>{errors.subTotal}</span>
              )}
            </label>

            {/* VAT rate — optional */}
            <label style={labelStyle}>
              نسبة الضريبة (%)
              <span style={optionalLabelStyle}>(اختياري)</span>
              <input
                style={inputStyle("vatRate")}
                type="number"
                min={0}
                step="0.01"
                value={vatRate}
                onChange={(e) => {
                  setVatRate(e.target.value);
                  clearFieldError("vatRate");
                }}
                dir="ltr"
              />
              {errors.vatRate && (
                <span style={errorTextStyle}>{errors.vatRate}</span>
              )}
            </label>

            {/* Payment method — optional */}
            <label style={labelStyle}>
              طريقة الدفع
              <span style={optionalLabelStyle}>(اختياري)</span>
              <select
                style={{ ...inputBase, cursor: "pointer" }}
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod | "")}
                dir="rtl"
              >
                <option value="">اختر الطريقة</option>
                <option value="Cash">نقداً</option>
                <option value="Card">بطاقة</option>
                <option value="Prepaid">مدفوع مسبقاً</option>
              </select>
            </label>

            {/* Payment status — edit-only, mirrors Driver's status-on-edit pattern */}
            {!isNew && (
              <label style={labelStyle}>
                حالة الدفع
                <select
                  style={{ ...inputBase, cursor: "pointer" }}
                  value={paymentStatus}
                  onChange={(e) =>
                    setPaymentStatus(e.target.value as PaymentStatus | "")
                  }
                  dir="rtl"
                >
                  <option value="">—</option>
                  <option value="Pending">معلَّق</option>
                  <option value="Paid">مدفوع</option>
                  <option value="Failed">فشل</option>
                  <option value="Refunded">مُسترجع</option>
                </select>
              </label>
            )}
          </div>

          {/* ── Section: Delivery Address ── */}
          <p style={sectionHeadingStyle}>عنوان التسليم</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem" }}>
            <label style={labelStyle}>
              المدينة
              <span style={optionalLabelStyle}>(اختياري)</span>
              <input style={inputBase} value={delCity} onChange={(e) => setDelCity(e.target.value)} placeholder="الرياض" dir="rtl" />
            </label>
            <label style={labelStyle}>
              الحي
              <span style={optionalLabelStyle}>(اختياري)</span>
              <input style={inputBase} value={delDistrict} onChange={(e) => setDelDistrict(e.target.value)} placeholder="العليا" dir="rtl" />
            </label>
            <label style={labelStyle}>
              الشارع
              <span style={optionalLabelStyle}>(اختياري)</span>
              <input style={inputBase} value={delStreet} onChange={(e) => setDelStreet(e.target.value)} placeholder="شارع الأمير محمد" dir="rtl" />
            </label>
            <label style={labelStyle}>
              رقم المبنى
              <span style={optionalLabelStyle}>(اختياري)</span>
              <input style={inputBase} value={delBuildingNo} onChange={(e) => setDelBuildingNo(e.target.value)} placeholder="1234" dir="ltr" />
            </label>
            <label style={labelStyle}>
              رقم الوحدة
              <span style={optionalLabelStyle}>(اختياري)</span>
              <input style={inputBase} value={delUnitNo} onChange={(e) => setDelUnitNo(e.target.value)} placeholder="56" dir="ltr" />
            </label>
            <label style={labelStyle}>
              الرمز البريدي
              <span style={optionalLabelStyle}>(اختياري)</span>
              <input style={inputBase} value={delZipCode} onChange={(e) => setDelZipCode(e.target.value)} placeholder="12345" dir="ltr" />
            </label>
            {/* GeoJSON coordinates — required by backend */}
            <label style={labelStyle}>
              خط الطول (Longitude) *
              <input
                style={inputBase}
                type="number"
                step="any"
                value={delLng}
                onChange={(e) => setDelLng(e.target.value)}
                placeholder="46.6753"
                dir="ltr"
              />
            </label>
            <label style={labelStyle}>
              خط العرض (Latitude) *
              <input
                style={inputBase}
                type="number"
                step="any"
                value={delLat}
                onChange={(e) => setDelLat(e.target.value)}
                placeholder="24.7136"
                dir="ltr"
              />
            </label>
          </div>

          {/* ── Section: Pickup Address ── */}
          <p style={sectionHeadingStyle}>عنوان الاستلام</p>

          {/* Toggle: existing ID or new address */}
          <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.25rem" }}>
            {(["id", "new"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setPickupMode(m)}
                style={{
                  height: 32, padding: "0 0.875rem",
                  borderRadius: "var(--radius-md)",
                  border: `1px solid ${pickupMode === m ? "var(--color-brand-600)" : "var(--color-border)"}`,
                  background: pickupMode === m ? "var(--color-brand-50, #EFF6FF)" : "var(--color-surface)",
                  fontSize: 12, fontWeight: 600,
                  color: pickupMode === m ? "var(--color-brand-600)" : "var(--color-text-secondary)",
                  cursor: "pointer", fontFamily: "var(--font-sans)",
                }}
              >
                {m === "id" ? "عنوان موجود (ID)" : "عنوان جديد"}
              </button>
            ))}
          </div>

          {pickupMode === "id" ? (
            <label style={labelStyle}>
              معرّف العنوان (MongoDB ID)
              <input
                style={inputBase}
                value={pickupAddressId}
                onChange={(e) => setPickupAddressId(e.target.value)}
                placeholder="67a1b2c3d4e5f6a7b8c9d0e1"
                dir="ltr"
                autoComplete="off"
              />
            </label>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem" }}>
              <label style={labelStyle}>
                المدينة
                <span style={optionalLabelStyle}>(اختياري)</span>
                <input style={inputBase} value={pkpCity} onChange={(e) => setPkpCity(e.target.value)} placeholder="جدة" dir="rtl" />
              </label>
              <label style={labelStyle}>
                الحي
                <span style={optionalLabelStyle}>(اختياري)</span>
                <input style={inputBase} value={pkpDistrict} onChange={(e) => setPkpDistrict(e.target.value)} placeholder="الروضة" dir="rtl" />
              </label>
              <label style={labelStyle}>
                الشارع
                <span style={optionalLabelStyle}>(اختياري)</span>
                <input style={inputBase} value={pkpStreet} onChange={(e) => setPkpStreet(e.target.value)} placeholder="شارع التحلية" dir="rtl" />
              </label>
              <label style={labelStyle}>
                رقم المبنى
                <span style={optionalLabelStyle}>(اختياري)</span>
                <input style={inputBase} value={pkpBuildingNo} onChange={(e) => setPkpBuildingNo(e.target.value)} placeholder="4321" dir="ltr" />
              </label>
              <label style={labelStyle}>
                رقم الوحدة
                <span style={optionalLabelStyle}>(اختياري)</span>
                <input style={inputBase} value={pkpUnitNo} onChange={(e) => setPkpUnitNo(e.target.value)} placeholder="12" dir="ltr" />
              </label>
              <label style={labelStyle}>
                الرمز البريدي
                <span style={optionalLabelStyle}>(اختياري)</span>
                <input style={inputBase} value={pkpZipCode} onChange={(e) => setPkpZipCode(e.target.value)} placeholder="23456" dir="ltr" />
              </label>
              {/* GeoJSON coordinates — optional for pickup */}
              <label style={labelStyle}>
                خط الطول (Longitude)
                <span style={optionalLabelStyle}>(اختياري)</span>
                <input
                  style={inputBase}
                  type="number"
                  step="any"
                  value={pkpLng}
                  onChange={(e) => setPkpLng(e.target.value)}
                  placeholder="46.6753"
                  dir="ltr"
                />
              </label>
              <label style={labelStyle}>
                خط العرض (Latitude)
                <span style={optionalLabelStyle}>(اختياري)</span>
                <input
                  style={inputBase}
                  type="number"
                  step="any"
                  value={pkpLat}
                  onChange={(e) => setPkpLat(e.target.value)}
                  placeholder="24.7136"
                  dir="ltr"
                />
              </label>
            </div>
          )}

          {/* ── Actions ── */}
          <div style={{
            display: "flex", gap: "0.5rem",
            justifyContent: "flex-end", paddingTop: "0.5rem",
          }}>
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              style={{
                height: 40, padding: "0 1.25rem",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--color-border)",
                background: "var(--color-surface)",
                fontSize: 13, fontWeight: 600, color: "var(--color-text-secondary)",
                cursor: saving ? "not-allowed" : "pointer",
                fontFamily: "var(--font-sans)",
              }}
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={saving}
              style={{
                height: 40, padding: "0 1.5rem",
                borderRadius: "var(--radius-md)",
                border: "none",
                background: saving ? "var(--color-brand-400)" : "var(--color-brand-600)",
                fontSize: 13, fontWeight: 700, color: "#FFF",
                cursor: saving ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", gap: 8,
                fontFamily: "var(--font-sans)",
              }}
            >
              {saving && <Spinner size="sm" className="text-white" />}
              {saving ? "جارٍ الحفظ…" : isNew ? "إنشاء الطلب" : "حفظ التغييرات"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}