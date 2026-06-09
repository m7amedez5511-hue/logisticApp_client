export interface ClientAddress {
  _id: string;
  label: string;
  branchName: string | null;
  contactPerson: { name: string; phone: string };
  details: {
    city: string;
    district?: string;
    street: string;
    buildingNo?: string;
    unitNo?: string;
    zipCode?: string;
  };
}

export type OrderStatus = "CREATED" | "IN_TRANSIT" | "DELIVERED" | "CANCELLED";

export interface Order {
  id: string;
  createdAt: string;
  status: OrderStatus;
  totalAmount: number;
  description: string;
}