// hooks/useOrders.ts
"use client";

import { useCallback, useEffect, useReducer } from "react";
import { orderService } from "../services/order.service";
import type {
  Order,
  CreateOrderPayload,
  UpdateOrderPayload,
  UpdateOrderStatusPayload,
} from "../types/order";

// ── State ─────────────────────────────────────────────────
interface State {
  orders: Order[];
  total: number;
  page: number;
  totalPages: number;
  loading: boolean;
  submitting: boolean;
  error: string | null;
}

type Action =
  | { type: "FETCH_START" }
  | { type: "FETCH_SUCCESS"; payload: { orders: Order[]; total: number; totalPages: number; page: number } }
  | { type: "FETCH_ERROR"; error: string }
  | { type: "SUBMIT_START" }
  | { type: "SUBMIT_SUCCESS"; order: Order; isNew: boolean }
  | { type: "SUBMIT_ERROR"; error: string }
  | { type: "DELETE_SUCCESS"; id: string }
  | { type: "CLEAR_ERROR" };

const initialState: State = {
  orders: [],
  total: 0,
  page: 1,
  totalPages: 1,
  loading: false,
  submitting: false,
  error: null,
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "FETCH_START":
      return { ...state, loading: true, error: null };
    case "FETCH_SUCCESS":
      return {
        ...state,
        loading: false,
        orders: action.payload.orders,
        total: action.payload.total,
        totalPages: action.payload.totalPages,
        page: action.payload.page,
      };
    case "FETCH_ERROR":
      return { ...state, loading: false, error: action.error };
    case "SUBMIT_START":
      return { ...state, submitting: true, error: null };
    case "SUBMIT_SUCCESS":
      return {
        ...state,
        submitting: false,
        orders: action.isNew
          ? [action.order, ...state.orders]
          : state.orders.map((o) => (o.id === action.order.id ? action.order : o)),
      };
    case "SUBMIT_ERROR":
      return { ...state, submitting: false, error: action.error };
    case "DELETE_SUCCESS":
      return { ...state, orders: state.orders.filter((o) => o.id !== action.id) };
    case "CLEAR_ERROR":
      return { ...state, error: null };
    default:
      return state;
  }
}

// ── Hook ──────────────────────────────────────────────────
export function useOrders(autoFetch = true) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const fetchOrders = useCallback(
    async (page = 1, limit = 20) => {
      dispatch({ type: "FETCH_START" });
      try {
        const res = await orderService.getAll({ page, limit });
        const body = (res as unknown as { data: { data: Order[]; meta: { total: number; totalPages: number; page: number } } }).data;
        dispatch({
          type: "FETCH_SUCCESS",
          payload: {
            orders: body.data,
            total: body.meta.total,
            totalPages: body.meta.totalPages,
            page: body.meta.page,
          },
        });
      } catch (err: unknown) {
        dispatch({
          type: "FETCH_ERROR",
          error: err instanceof Error ? err.message : "Failed to load orders",
        });
      }
    },
    [],
  );

  const createOrder = useCallback(async (payload: CreateOrderPayload) => {
    dispatch({ type: "SUBMIT_START" });
    try {
      const res = await orderService.create(payload);
      const order = (res as unknown as { data: Order }).data;
      dispatch({ type: "SUBMIT_SUCCESS", order, isNew: true });
      return order;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create order";
      dispatch({ type: "SUBMIT_ERROR", error: msg });
      throw new Error(msg);
    }
  }, []);

  const updateOrder = useCallback(
    async (id: string, payload: UpdateOrderPayload) => {
      dispatch({ type: "SUBMIT_START" });
      try {
        const res = await orderService.update(id, payload);
        const order = (res as unknown as { data: Order }).data;
        dispatch({ type: "SUBMIT_SUCCESS", order, isNew: false });
        return order;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Failed to update order";
        dispatch({ type: "SUBMIT_ERROR", error: msg });
        throw new Error(msg);
      }
    },
    [],
  );

  const updateStatus = useCallback(
    async (id: string, payload: UpdateOrderStatusPayload) => {
      dispatch({ type: "SUBMIT_START" });
      try {
        const res = await orderService.updateStatus(id, payload);
        const order = (res as unknown as { data: Order }).data;
        dispatch({ type: "SUBMIT_SUCCESS", order, isNew: false });
        return order;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Failed to update status";
        dispatch({ type: "SUBMIT_ERROR", error: msg });
        throw new Error(msg);
      }
    },
    [],
  );

  const deleteOrder = useCallback(async (id: string) => {
    try {
      await orderService.delete(id);
      dispatch({ type: "DELETE_SUCCESS", id });
    } catch (err: unknown) {
      dispatch({
        type: "FETCH_ERROR",
        error: err instanceof Error ? err.message : "Failed to delete order",
      });
    }
  }, []);

  useEffect(() => {
    if (autoFetch) fetchOrders();
  }, [autoFetch, fetchOrders]);

  return {
    ...state,
    fetchOrders,
    createOrder,
    updateOrder,
    updateStatus,
    deleteOrder,
    clearError: () => dispatch({ type: "CLEAR_ERROR" }),
  };
}