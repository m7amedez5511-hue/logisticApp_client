export interface Branch {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  country: string;
  city: string;
  state?: string | null;
  district?: string | null;
  street: string;
  buildingNo?: string | null;
  unitNo?: string | null;
  zipCode?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  isActive: boolean;
  createdAt: string;
}

export interface BranchFormData {
  name: string;
  email: string;
  phone: string;
  country: string;
  city: string;
  state: string;
  district: string;
  street: string;
  buildingNo: string;
  unitNo: string;
  zipCode: string;
  latitude: string;
  longitude: string;
}

export interface FormErrors {
  name?: string;
  email?: string;
  phone?: string;
  country?: string;
  city?: string;
  state?: string;
  district?: string;
  street?: string;
  buildingNo?: string;
  unitNo?: string;
  zipCode?: string;
  latitude?: string;
  longitude?: string;
}

export interface ApiListResponse<T> {
  data: {
    data: T[];
    pagination: { total: number; page: number; pages: number };
    meta?: { total: number; pages: number };
  };
}

export type TableState = {
  branches: Branch[];
  loading: boolean;
  total: number;
  pages: number;
  error: string | null;
};

export type TableAction =
  | { type: "LOAD_START" }
  | { type: "LOAD_OK"; branches: Branch[]; total: number; pages: number }
  | { type: "LOAD_ERR"; error: string }
  | { type: "ADD"; branch: Branch }
  | { type: "UPDATE"; branch: Branch }
  | { type: "DELETE"; id: string }
  | { type: "CLEAR_ERR" };

export interface BranchDetail extends Branch {
  updatedAt: string;
  isDeleted: boolean;
  deletedAt: string | null;
}