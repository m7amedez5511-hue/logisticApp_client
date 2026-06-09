export type OrderStatus =
  | "Created"
  | "Assigned"
  | "InTransit"
  | "Delivered"
  | "Returned"
  | "Cancelled";

export type PaymentMethod = "Cash" | "Card" | "Prepaid";
export type PaymentStatus = "Pending" | "Paid" | "Failed" | "Refunded";

export interface OrderAddress {
  details?: {
    city?: string;
    district?: string;
    street?: string;
    buildingNo?: string;
    unitNo?: string;
    zipCode?: string;
  };
  location?: {
    coordinates?: [number, number];
  };
}

export interface Order {
  id: string;
  shipmentNumber: string;
  recipientName: string;
  recipientPhone: string;
  currentStatus: OrderStatus;
  clientId: string;
  tripId?: string | null;
  totalPrice?: number | null;
  subTotal?: number | null;
  vatAmount?: number | null;
  vatRate?: number | null;
  paymentMethod?: PaymentMethod | null;
  paymentStatus?: PaymentStatus | null;
  type?: string | null;
  quantity: number;
  weight?: number | null;
  deliveryAddressId?: string | null;
  pickupAddressId?: string | null;
  createdAt: string;
  updatedAt: string;
  statusHistory?: Array<{
    id: string;
    status: OrderStatus;
    reason?: string | null;
    createdAt: string;
  }>;
  client?: { id: string; name: string; phone: string };
  trip?: { id: string; tripNumber: string } | null;
}

export interface CreateOrderPayload {
  shipmentNumber: string;
  recipientName: string;
  recipientPhone: string;
  clientId: string;
  tripId?: string;
  subTotal?: number;
  vatRate?: number;
  vatAmount?: number;
  totalPrice?: number;
  paymentMethod?: PaymentMethod;
  paymentStatus?: PaymentStatus;
  type?: string;
  quantity?: number;
  weight?: number;
  deliveryAddress?: OrderAddress;
  pickupAddressId?: string;
}

export interface UpdateOrderPayload extends Partial<CreateOrderPayload> {
  currentStatus?: OrderStatus;
}

export interface UpdateOrderStatusPayload {
  status: OrderStatus;
  reason?: string;
}

export interface TransferOrderPayload {
  tripId: string;
}

export interface OrdersResponse {
  data: Order[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}