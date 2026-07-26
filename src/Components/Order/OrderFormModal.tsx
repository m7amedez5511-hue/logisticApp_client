"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useForm, type Resolver } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { Alert, Button, Input, Modal, Select } from "../UI";
import { getStoredToken } from "@/src/lib/auth";
import { clientService } from "@/src/services/client.service";
import { tripService } from "@/src/services/trip.service";
import {
  createOrderSchema,
  updateOrderSchema,
} from "@/src/validations/order.validation";
import type {
  Order,
  CreateOrderPayload,
  UpdateOrderPayload,
  PaymentMethod,
  PaymentStatus,
} from "@/src/types/order";
import type { Client } from "@/src/types/client";
import type { Trip } from "@/src/types/trip";

const sectionHeadingStyle: React.CSSProperties = {
  fontSize: 11,
  letterSpacing: "0.25em",
  textTransform: "uppercase",
  color: "var(--color-text-hint)",
  fontWeight: 700,
  margin: "0.5rem 0 0",
};

const createLinkStyle: React.CSSProperties = {
  fontSize: 11,
  color: "var(--color-brand-600)",
  textDecoration: "none",
  fontWeight: 500,
  marginTop: 6,
  display: "inline-flex",
  alignItems: "center",
  gap: 3,
};

// ── Form values shape ────────────────────────────────────────────────────────
// Nested address paths mirror the yup schema exactly (deliveryAddress.details.*,
// deliveryAddress.location.coordinates.0/1, etc.) so register("a.b.c") dot-paths
// validate against the matching nested schema node without any extra mapping.

interface AddressFormValues {
  details: {
    city: string;
    district: string;
    street: string;
    buildingNo: string;
    unitNo: string;
    zipCode: string;
  };
  location: {
    coordinates: [number | undefined, number | undefined];
  };
}

interface OrderFormValues {
  shipmentNumber: string;
  recipientName: string;
  recipientPhone: string;
  clientId: string;
  tripId: string;
  type: string;
  quantity: number | undefined;
  weight: number | undefined;
  subTotal: number | undefined;
  vatRate: number | undefined;
  paymentMethod: PaymentMethod | "";
  paymentStatus: PaymentStatus | "";
  deliveryAddress: AddressFormValues;
  pickupAddressId: string;
  pickupAddress: AddressFormValues;
}

const emptyAddress = (): AddressFormValues => ({
  details: { city: "", district: "", street: "", buildingNo: "", unitNo: "", zipCode: "" },
  location: { coordinates: [undefined, undefined] },
});

interface OrderFormModalProps {
  editOrder: Order | null;
  onClose: () => void;
  onSubmit: (
    payload: CreateOrderPayload | UpdateOrderPayload,
    isNew: boolean,
  ) => Promise<boolean>;
}

export function OrderFormModal({
  editOrder,
  onClose,
  onSubmit,
}: OrderFormModalProps) {
  const isNew = editOrder === null;

  const [clients, setClients] = useState<Client[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [relLoading, setRelLoading] = useState(true);

  const [pickupMode, setPickupMode] = useState<"id" | "new">(
    editOrder?.pickupAddressId ? "id" : "new",
  );

  const {
    register,
    handleSubmit,
    setError,
    setFocus,
    formState: { errors, isSubmitting },
  } = useForm<OrderFormValues>({
    // create/update schemas differ structurally in which fields are
    // required (e.g. tripId), so yup can't unify them into one type on
    // its own — the ternary alone won't typecheck as a single schema
    // argument. We cast in two places for two separate reasons:
    //   1. `(...) as any` on the schema — lets the ternary's two
    //      differently-shaped ObjectSchemas pass as a single argument.
    //   2. `as unknown as Resolver<OrderFormValues>` on the whole call —
    //      stops TS from inferring the Resolver's generics from the
    //      schema's own (slightly different) inferred shape, which is
    //      what caused the earlier "quantity optional vs required"
    //      mismatch.
    resolver: yupResolver(
      (isNew ? createOrderSchema : updateOrderSchema) as any,
    ) as unknown as Resolver<OrderFormValues>,
    defaultValues: {
      shipmentNumber: editOrder?.shipmentNumber ?? "",
      recipientName: editOrder?.recipientName ?? "",
      recipientPhone: editOrder?.recipientPhone ?? "",
      clientId: editOrder?.clientId ?? "",
      tripId: editOrder?.tripId ?? "",
      type: editOrder?.type ?? "",
      quantity: editOrder?.quantity ?? 1,
      weight: editOrder?.weight ?? undefined,
      subTotal: editOrder?.subTotal ?? undefined,
      vatRate: editOrder?.vatRate ?? undefined,
      paymentMethod: editOrder?.paymentMethod ?? "",
      paymentStatus: editOrder?.paymentStatus ?? "",
      deliveryAddress: {
        details: {
          city: editOrder?.deliveryAddress?.details?.city ?? "",
          district: editOrder?.deliveryAddress?.details?.district ?? "",
          street: editOrder?.deliveryAddress?.details?.street ?? "",
          buildingNo: editOrder?.deliveryAddress?.details?.buildingNo ?? "",
          unitNo: editOrder?.deliveryAddress?.details?.unitNo ?? "",
          zipCode: editOrder?.deliveryAddress?.details?.zipCode ?? "",
        },
        location: {
          coordinates: [
            editOrder?.deliveryAddress?.location?.coordinates?.[0],
            editOrder?.deliveryAddress?.location?.coordinates?.[1],
          ],
        },
      },
      pickupAddressId: editOrder?.pickupAddressId ?? "",
      pickupAddress: {
        details: {
          city: editOrder?.pickupAddress?.details?.city ?? "",
          district: editOrder?.pickupAddress?.details?.district ?? "",
          street: editOrder?.pickupAddress?.details?.street ?? "",
          buildingNo: editOrder?.pickupAddress?.details?.buildingNo ?? "",
          unitNo: editOrder?.pickupAddress?.details?.unitNo ?? "",
          zipCode: editOrder?.pickupAddress?.details?.zipCode ?? "",
        },
        location: {
          coordinates: [
            editOrder?.pickupAddress?.location?.coordinates?.[0],
            editOrder?.pickupAddress?.location?.coordinates?.[1],
          ],
        },
      },
    },
  });

  const [apiError, setApiError] = useState("");

  // register("shipmentNumber") already attaches its own ref — focusing via
  // setFocus avoids the ref collision a separate `ref={firstRef}` would cause.
  useEffect(() => {
    setFocus("shipmentNumber");
  }, [setFocus]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const token = getStoredToken();
        const { items: clientList } = await clientService.getAll(1, "", token);
        const { items: tripList } = await tripService.getAll({ page: 1, limit: 100 }, token);
        if (!cancelled) {
          setClients(clientList);
          setTrips(tripList);
        }
      } catch (err) {
        console.error("OrderFormModal: failed to load clients/trips", err);
        if (!cancelled) {
          setApiError("تعذّر تحميل قوائم العملاء والرحلات. تحقق من اتصالك وحاول إعادة فتح النافذة.");
        }
      } finally {
        if (!cancelled) setRelLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const numberField = (
    field:
      | "quantity"
      | "weight"
      | "subTotal"
      | "vatRate",
  ) =>
    register(field, {
      setValueAs: (v) => (v === "" || v === null ? undefined : Number(v)),
    });

  // Coordinate fields use dot-path registration (matches the pattern already
  // used in Client_Adress/Addressformmodal.tsx for location.coordinates.0/1).
  const coordField = (
    path:
      | "deliveryAddress.location.coordinates.0"
      | "deliveryAddress.location.coordinates.1"
      | "pickupAddress.location.coordinates.0"
      | "pickupAddress.location.coordinates.1",
  ) =>
    register(path as never, {
      setValueAs: (v: string) => (v === "" || v === null ? undefined : Number(v)),
    });

  // ── Submit ────────────────────────────────────────────────────────────────
  // Address objects stay entirely optional at the schema level (see the
  // inline note in order.validation.ts), so — exactly like before the
  // refactor — we only attach deliveryAddress/pickupAddress to the payload
  // when the person actually filled in at least one field for them.

  const submitHandler = async (data: OrderFormValues) => {
    const payload: Record<string, unknown> = {
      shipmentNumber: data.shipmentNumber,
      recipientName: data.recipientName,
      recipientPhone: data.recipientPhone,
      clientId: data.clientId,
      quantity: data.quantity || 1,
    };

    if (data.tripId) payload.tripId = data.tripId;
    if (data.type) payload.type = data.type;
    if (data.weight !== undefined) payload.weight = data.weight;
    if (data.subTotal !== undefined) payload.subTotal = data.subTotal;
    if (data.vatRate !== undefined) payload.vatRate = data.vatRate;
    if (data.paymentMethod) payload.paymentMethod = data.paymentMethod;
    if (data.paymentStatus) payload.paymentStatus = data.paymentStatus;

    const delDetails = Object.fromEntries(
      Object.entries(data.deliveryAddress.details).filter(([, v]) => !!v),
    );
    const [delLng, delLat] = data.deliveryAddress.location.coordinates;
    const delCoordinates = delLng !== undefined && delLat !== undefined ? [delLng, delLat] : undefined;

    if (Object.keys(delDetails).length > 0 || delCoordinates) {
      payload.deliveryAddress = {
        ...(Object.keys(delDetails).length > 0 && { details: delDetails }),
        ...(delCoordinates && { location: { coordinates: delCoordinates } }),
      };
    }

    if (pickupMode === "id" && data.pickupAddressId.trim()) {
      payload.pickupAddressId = data.pickupAddressId.trim();
    } else {
      const pkpDetails = Object.fromEntries(
        Object.entries(data.pickupAddress.details).filter(([, v]) => !!v),
      );
      const [pkpLng, pkpLat] = data.pickupAddress.location.coordinates;
      const pkpCoordinates = pkpLng !== undefined && pkpLat !== undefined ? [pkpLng, pkpLat] : undefined;

      if (Object.keys(pkpDetails).length > 0 || pkpCoordinates) {
        payload.pickupAddress = {
          ...(Object.keys(pkpDetails).length > 0 && { details: pkpDetails }),
          ...(pkpCoordinates && { location: { coordinates: pkpCoordinates } }),
        };
      }
    }

    setApiError("");
    try {
      const ok = await onSubmit(payload as unknown as CreateOrderPayload, isNew);
      if (ok) {
        onClose();
      } else {
        setError("shipmentNumber", { message: "حدث خطأ غير متوقع. يرجى المحاولة لاحقاً." });
        setApiError("حدث خطأ غير متوقع. يرجى المحاولة لاحقاً.");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "حدث خطأ غير متوقع. يرجى المحاولة لاحقاً.";
      setError("shipmentNumber", { message });
      setApiError(message);
    }
  };

  const deliveryErr = errors.deliveryAddress;
  const pickupErr = errors.pickupAddress;

  return (
    <Modal
      open
      title={isNew ? "طلب جديد" : editOrder?.shipmentNumber ?? ""}
      subtitle={isNew ? "إنشاء طلب" : "تعديل طلب"}
      onClose={onClose}
      size="lg"
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
            إلغاء
          </Button>
          <Button type="submit" form="order-form" loading={isSubmitting}>
            {isNew ? "إنشاء الطلب" : "حفظ التغييرات"}
          </Button>
        </>
      }
    >
      <form
        id="order-form"
        onSubmit={handleSubmit(submitHandler)}
        noValidate
        style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
        dir="rtl"
      >
        {errors.shipmentNumber?.type === "manual" && (
          <Alert type="error" message={errors.shipmentNumber.message ?? ""} onClose={() => setApiError("")} />
        )}

        <p style={sectionHeadingStyle}>بيانات الشحنة والمستلم</p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
          <Input
            id="order-shipmentNumber"
            label="رقم الشحنة *"
            error={
              errors.shipmentNumber && errors.shipmentNumber.type !== "manual"
                ? errors.shipmentNumber.message
                : undefined
            }
            {...register("shipmentNumber")}
            placeholder="SHP-0001"
            dir="ltr"
            autoComplete="off"
          />

          <div>
            <Select
              id="order-clientId"
              label="العميل *"
              error={errors.clientId?.message}
              disabled={relLoading}
              {...register("clientId")}
              dir="rtl"
              style={{ cursor: relLoading ? "wait" : "pointer" }}
            >
              <option value="">{relLoading ? "جارٍ التحميل…" : "اختر العميل"}</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                  {c.phone ? ` — ${c.phone}` : ""}
                </option>
              ))}
            </Select>
            <Link href="/dashboard/clients" style={createLinkStyle} tabIndex={-1}>
              <i className="ti ti-plus" style={{ fontSize: 11 }} aria-hidden="true" />
              إنشاء عميل جديد
            </Link>
          </div>

          <Input
            id="order-recipientName"
            label="اسم المستلم *"
            error={errors.recipientName?.message}
            {...register("recipientName")}
            placeholder="أحمد محمد"
            dir="rtl"
          />

          <Input
            id="order-recipientPhone"
            label="رقم جوال المستلم *"
            error={errors.recipientPhone?.message}
            {...register("recipientPhone")}
            placeholder="05XXXXXXXX"
            dir="ltr"
          />

          <div style={{ gridColumn: "1 / -1" }}>
            <Select
              id="order-tripId"
              label={isNew ? "الرحلة *" : "الرحلة (اختياري)"}
              error={errors.tripId?.message}
              disabled={relLoading}
              {...register("tripId")}
              dir="rtl"
              style={{ cursor: relLoading ? "wait" : "pointer" }}
            >
              <option value="">{relLoading ? "جارٍ التحميل…" : "اختر الرحلة"}</option>
              {trips.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.tripNumber}
                  {t.title ? ` — ${t.title}` : ""}
                  {t.driver?.name ? ` (${t.driver.name})` : ""}
                </option>
              ))}
            </Select>
            <Link href="/dashboard/trips" style={createLinkStyle} tabIndex={-1}>
              <i className="ti ti-plus" style={{ fontSize: 11 }} aria-hidden="true" />
              إنشاء رحلة جديدة
            </Link>
          </div>
        </div>

        <p style={sectionHeadingStyle}>تفاصيل الشحنة</p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem" }}>
          <Input
            id="order-type"
            label="نوع الشحنة (اختياري)"
            {...register("type")}
            placeholder="عادي / مبرد"
            dir="rtl"
          />

          <Input
            id="order-quantity"
            label="الكمية *"
            type="number"
            min={1}
            error={errors.quantity?.message}
            {...numberField("quantity")}
            dir="ltr"
          />

          <Input
            id="order-weight"
            label="الوزن (كجم) (اختياري)"
            type="number"
            min={0}
            step="0.01"
            {...numberField("weight")}
            dir="ltr"
          />
        </div>

        <p style={sectionHeadingStyle}>بيانات الدفع</p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem" }}>
          <Input
            id="order-subTotal"
            label="الإجمالي الفرعي (اختياري)"
            type="number"
            min={0}
            step="0.01"
            error={errors.subTotal?.message}
            {...numberField("subTotal")}
            dir="ltr"
          />

          <Input
            id="order-vatRate"
            label="نسبة الضريبة (%) (اختياري)"
            type="number"
            min={0}
            step="0.01"
            error={errors.vatRate?.message}
            {...numberField("vatRate")}
            dir="ltr"
          />

          <Select
            id="order-paymentMethod"
            label="طريقة الدفع (اختياري)"
            {...register("paymentMethod")}
            dir="rtl"
            style={{ cursor: "pointer" }}
          >
            <option value="">اختر الطريقة</option>
            <option value="Cash">نقداً</option>
            <option value="Card">بطاقة</option>
            <option value="Prepaid">مدفوع مسبقاً</option>
          </Select>

          {!isNew && (
            <Select
              id="order-paymentStatus"
              label="حالة الدفع"
              {...register("paymentStatus")}
              dir="rtl"
              style={{ cursor: "pointer" }}
            >
              <option value="">—</option>
              <option value="Pending">معلَّق</option>
              <option value="Paid">مدفوع</option>
              <option value="Failed">فشل</option>
              <option value="Refunded">مُسترجع</option>
            </Select>
          )}
        </div>

        <p style={sectionHeadingStyle}>عنوان التسليم</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem" }}>
          <Input
            id="delivery-city"
            label="المدينة (اختياري)"
            {...register("deliveryAddress.details.city")}
            placeholder="الرياض"
            dir="rtl"
          />
          <Input
            id="delivery-district"
            label="الحي (اختياري)"
            {...register("deliveryAddress.details.district")}
            placeholder="العليا"
            dir="rtl"
          />
          <Input
            id="delivery-street"
            label="الشارع (اختياري)"
            {...register("deliveryAddress.details.street")}
            placeholder="شارع الأمير محمد"
            dir="rtl"
          />
          <Input
            id="delivery-buildingNo"
            label="رقم المبنى (اختياري)"
            {...register("deliveryAddress.details.buildingNo")}
            placeholder="1234"
            dir="ltr"
          />
          <Input
            id="delivery-unitNo"
            label="رقم الوحدة (اختياري)"
            {...register("deliveryAddress.details.unitNo")}
            placeholder="56"
            dir="ltr"
          />
          <Input
            id="delivery-zipCode"
            label="الرمز البريدي (اختياري)"
            {...register("deliveryAddress.details.zipCode")}
            placeholder="12345"
            dir="ltr"
          />
          <Input
            id="delivery-lng"
            label="خط الطول (Longitude) *"
            type="number"
            step="any"
            error={deliveryErr?.location?.coordinates ? " " : undefined}
            {...coordField("deliveryAddress.location.coordinates.0")}
            placeholder="46.6753"
            dir="ltr"
          />
          <Input
            id="delivery-lat"
            label="خط العرض (Latitude) *"
            type="number"
            step="any"
            error={deliveryErr?.location?.coordinates?.message}
            {...coordField("deliveryAddress.location.coordinates.1")}
            placeholder="24.7136"
            dir="ltr"
          />
        </div>

        <p style={sectionHeadingStyle}>عنوان الاستلام</p>

        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.25rem" }}>
          {(["id", "new"] as const).map((m) => (
            <Button
              key={m}
              type="button"
              size="sm"
              variant={pickupMode === m ? "primary" : "secondary"}
              onClick={() => setPickupMode(m)}
            >
              {m === "id" ? "عنوان موجود (ID)" : "عنوان جديد"}
            </Button>
          ))}
        </div>

        {pickupMode === "id" ? (
          <Input
            id="pickup-addressId"
            label="معرّف العنوان (MongoDB ID)"
            {...register("pickupAddressId")}
            placeholder="67a1b2c3d4e5f6a7b8c9d0e1"
            dir="ltr"
            autoComplete="off"
          />
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem" }}>
            <Input
              id="pickup-city"
              label="المدينة (اختياري)"
              {...register("pickupAddress.details.city")}
              placeholder="جدة"
              dir="rtl"
            />
            <Input
              id="pickup-district"
              label="الحي (اختياري)"
              {...register("pickupAddress.details.district")}
              placeholder="الروضة"
              dir="rtl"
            />
            <Input
              id="pickup-street"
              label="الشارع (اختياري)"
              {...register("pickupAddress.details.street")}
              placeholder="شارع التحلية"
              dir="rtl"
            />
            <Input
              id="pickup-buildingNo"
              label="رقم المبنى (اختياري)"
              {...register("pickupAddress.details.buildingNo")}
              placeholder="4321"
              dir="ltr"
            />
            <Input
              id="pickup-unitNo"
              label="رقم الوحدة (اختياري)"
              {...register("pickupAddress.details.unitNo")}
              placeholder="12"
              dir="ltr"
            />
            <Input
              id="pickup-zipCode"
              label="الرمز البريدي (اختياري)"
              {...register("pickupAddress.details.zipCode")}
              placeholder="23456"
              dir="ltr"
            />
            <Input
              id="pickup-lng"
              label="خط الطول (Longitude) (اختياري)"
              type="number"
              step="any"
              error={pickupErr?.location?.coordinates ? " " : undefined}
              {...coordField("pickupAddress.location.coordinates.0")}
              placeholder="46.6753"
              dir="ltr"
            />
            <Input
              id="pickup-lat"
              label="خط العرض (Latitude) (اختياري)"
              type="number"
              step="any"
              error={pickupErr?.location?.coordinates?.message}
              {...coordField("pickupAddress.location.coordinates.1")}
              placeholder="24.7136"
              dir="ltr"
            />
          </div>
        )}
      </form>
    </Modal>
  );
}

// Re-exported for callers that only need the empty-address shape (e.g. tests).
export { emptyAddress as emptyOrderAddress };