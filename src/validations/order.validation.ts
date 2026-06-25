import * as yup from "yup";

// ── Saudi mobile regex (05xxxxxxxx) ─────────────────────────────────────────
const SAUDI_PHONE_RE = /^(05\d{8}|009665\d{8}|\+9665\d{8})$/;

// ── Address sub-schemas (mirrors backend orderAddressSchema) ─────────────────

// Delivery address — location.coordinates required by the backend (MongoDB GeoJSON)
const deliveryAddressSchema = yup.object({
  details: yup.object({
    city:       yup.string().trim().optional(),
    state:      yup.string().trim().optional(),
    district:   yup.string().trim().optional(),
    street:     yup.string().trim().optional(),
    buildingNo: yup.string().trim().optional(),
    unitNo:     yup.string().trim().optional(),
    zipCode:    yup.string().trim().optional(),
  }).optional(),
  location: yup.object({
    coordinates: yup
      .array()
      .of(yup.number().required())
      .length(2, "الإحداثيات يجب أن تكون [خط الطول, خط العرض]")
      .required("إحداثيات موقع التسليم مطلوبة"),
  }).required("موقع التسليم مطلوب"),
}).optional();

// Pickup address — coordinates optional (user may supply an existing ID instead)
const pickupAddressSchema = yup.object({
  details: yup.object({
    city:       yup.string().trim().optional(),
    state:      yup.string().trim().optional(),
    district:   yup.string().trim().optional(),
    street:     yup.string().trim().optional(),
    buildingNo: yup.string().trim().optional(),
    unitNo:     yup.string().trim().optional(),
    zipCode:    yup.string().trim().optional(),
  }).optional(),
  location: yup.object({
    coordinates: yup
      .array()
      .of(yup.number().required())
      .length(2, "الإحداثيات يجب أن تكون [خط الطول, خط العرض]")
      .optional(),
  }).optional(),
}).optional();

// ── Base shape shared between create & update ────────────────────────────────
// Optional financial / shipment detail fields live here so both schemas
// inherit them without repetition.
const baseShape = {
  // ── Optional: shipment details ──
  type:          yup.string().nullable().optional(),
  quantity:      yup
    .number()
    .typeError("الكمية يجب أن تكون رقمًا")
    .min(1, "الكمية يجب أن تكون ١ أو أكثر")
    .optional(),
  weight:        yup
    .number()
    .typeError("الوزن يجب أن يكون رقمًا")
    .min(0, "الوزن لا يمكن أن يكون سالبًا")
    .nullable()
    .optional(),

  // ── Optional: financial ──
  subTotal: yup
    .number()
    .typeError("الإجمالي الفرعي يجب أن يكون رقمًا")
    .min(0, "القيمة لا يمكن أن تكون سالبة")
    .nullable()
    .optional(),
  vatRate: yup
    .number()
    .typeError("نسبة الضريبة يجب أن تكون رقمًا")
    .min(0, "النسبة لا يمكن أن تكون سالبة")
    .max(100, "النسبة لا يمكن أن تتجاوز ١٠٠%")
    .nullable()
    .optional(),
  paymentMethod: yup
    .mixed<"Cash" | "Card" | "Prepaid">()
    .oneOf(["Cash", "Card", "Prepaid"], "طريقة الدفع غير صالحة")
    .nullable()
    .optional(),
};

// ── Create schema ─────────────────────────────────────────────────────────────
// The five fields mandated by the task spec are required here.
// deliveryAddressId / pickupAddressId intentionally excluded — the backend
// generates address records from deliveryAddressData / pickupAddressData.

export const createOrderSchema = yup.object({
  // ── Required ──
  tripId: yup
    .string()
    .required("الرحلة مطلوبة")
    .min(1, "الرحلة مطلوبة"),

  clientId: yup
    .string()
    .required("العميل مطلوب")
    .min(1, "العميل مطلوب"),

  shipmentNumber: yup
    .string()
    .required("رقم الشحنة مطلوب")
    .min(2, "رقم الشحنة قصير جدًا"),

  recipientName: yup
    .string()
    .required("اسم المستلم مطلوب")
    .min(2, "اسم المستلم قصير جدًا"),

  recipientPhone: yup
    .string()
    .required("رقم جوال المستلم مطلوب")
    .matches(SAUDI_PHONE_RE, "أدخل رقم جوال سعودي صحيح (05xxxxxxxx)"),

  // ── Optional: addresses ──
  // deliveryAddress: always a new object (backend creates in MongoDB); coordinates required
  deliveryAddress: deliveryAddressSchema,
  // pickupAddress: new object OR existing ID — both optional; coordinates optional
  pickupAddress:   pickupAddressSchema,
  pickupAddressId: yup.string().optional(),

  // ── Optional inherited ──
  ...baseShape,
});

// ── Update schema ─────────────────────────────────────────────────────────────
// All fields are optional on update — the backend applies partial patches.
export const updateOrderSchema = yup.object({
  tripId:        yup.string().nullable().optional(),
  clientId:      yup.string().nullable().optional(),
  shipmentNumber: yup.string().min(2, "رقم الشحنة قصير جدًا").optional(),
  recipientName:  yup.string().min(2, "اسم المستلم قصير جدًا").optional(),
  recipientPhone: yup
    .string()
    .matches(SAUDI_PHONE_RE, "أدخل رقم جوال سعودي صحيح (05xxxxxxxx)")
    .optional(),

  paymentStatus: yup
    .mixed<"Pending" | "Paid" | "Failed" | "Refunded">()
    .oneOf(["Pending", "Paid", "Failed", "Refunded"], "حالة الدفع غير صالحة")
    .nullable()
    .optional(),

  // ── Optional: addresses (delivery keeps coordinates required; pickup stays optional) ──
  deliveryAddress: deliveryAddressSchema,
  pickupAddress:   pickupAddressSchema,
  pickupAddressId: yup.string().optional(),

  // ── Optional inherited ──
  ...baseShape,
});

// ── SchemaErrors — typed error bag consumed by OrderFormModal ─────────────────
export type CreateOrderSchemaErrors = Partial<
  Record<keyof yup.InferType<typeof createOrderSchema>, string>
>;

export type UpdateOrderSchemaErrors = Partial<
  Record<keyof yup.InferType<typeof updateOrderSchema>, string>
>;

// Union used inside the modal so one type covers both modes
export type OrderSchemaErrors = CreateOrderSchemaErrors & UpdateOrderSchemaErrors;