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
    state?: string;
    district?: string;
    street?: string;
    buildingNo?: string;
    unitNo?: string;
    zipCode?: string;
  };
  location?: {
    coordinates?: [number, number]; // [longitude, latitude]
  };
}
export interface State {
  orders:  Order[];
  error:   string | null;
  loading: boolean;
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
  // Hybrid address IDs (stored in PostgreSQL, resolve to MongoDB docs)
  deliveryAddressId?: string | null;
  pickupAddressId?: string | null;
  // Populated address objects returned by the API (from MongoDB)
  deliveryAddress?: OrderAddress | null;
  pickupAddress?: OrderAddress | null;
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
  // Delivery address: send a NEW address object (backend writes to MongoDB)
  deliveryAddress?: OrderAddress;
  // Pickup: send an existing MongoDB ID OR a new address object
  pickupAddressId?: string;
  pickupAddress?: OrderAddress;
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
// Archived order resource returned by /orders/archived.
// NOTE: sample payload has no pagination meta — adjust if backend confirms otherwise.
export interface ArchivedOrder {
  id: string;
  shipmentNumber: string;
  recipientName: string;
  recipientPhone: string;
  clientId: string;
  tripId?: string | null;
  pickupAddressId?: string | null;
  deliveryAddressId?: string | null;
  currentStatus: OrderStatus;
  quantity: number;
  subTotal?: string | number | null;   
  createdAt: string;
  updatedAt: string;
  statusHistory?: Array<{
    id: string;
    status: OrderStatus;
    reason?: string | null;
    createdAt: string;
  }>;
}

export interface ArchivedOrderListResponse {
  success: boolean;
  message: string;
  responseAt: string;
  data: {
    data: ArchivedOrder[];
    meta?: { total: number; page: number; limit: number; totalPages: number };
  };
}

export interface OrderListResult {
  items: Order[];
  total: number;
  pages: number;
}