"use client";

import { useCallback, useEffect, useReducer, useState } from "react";
import { getStoredToken } from "@/src/lib/auth";
import { branchService } from "@/src/services/branch.service";
import type {
  BranchFormData,
  TableAction,
  TableState,
} from "@/src/types/branch";
import type { ToastNotification } from "@/src/Components/UI";

export type Notification = ToastNotification;

// ── Reducer  ──────────────────────────────────────
function tableReducer(s: TableState, a: TableAction): TableState {
  switch (a.type) {
    case "LOAD_START":  return { ...s, loading: true, error: null };
    case "LOAD_OK":     return { ...s, loading: false, branches: a.branches, total: a.total, pages: a.pages };
    case "LOAD_ERR":    return { ...s, loading: false, error: a.error };
    case "ADD":         return { ...s, branches: [a.branch, ...s.branches] };
    case "UPDATE":      return { ...s, branches: s.branches.map(b => b.id === a.branch.id ? a.branch : b) };
    case "DELETE":      return { ...s, branches: s.branches.filter(b => b.id !== a.id) };
    case "CLEAR_ERR":   return { ...s, error: null };
    default:            return s;
  }
}

// ──  first status ─────────────────────────────────────────────────────────
const initialState: TableState = {
  branches: [], loading: true, total: 0, pages: 1, error: null,
};

// ──  main hook ──────────────────────────────────────────────────────────────
export function useBranches() {
  const [state, dispatch]         = useReducer(tableReducer, initialState);
  const [search, setSearch]       = useState("");
  const [page, setPage]           = useState(1);
  const [notification, setNotification] = useState<ToastNotification | null>(null);

  //        notify with auto-dismiss after 4s
  const notify = useCallback((n: ToastNotification) => {
    setNotification(n);
    setTimeout(() => setNotification(null), 4000);
  }, []);

  // fetch branches with pagination and search
  const loadBranches = useCallback(async (p: number, q: string) => {
  dispatch({ type: "LOAD_START" });
  try {
    const token = getStoredToken();
    const { items, total, pages } = await branchService.getAll(p, q, token);
    dispatch({ type: "LOAD_OK", branches: items, total, pages });
  } catch {
    dispatch({ type: "LOAD_ERR", error: "عذراً، حدث خطأ أثناء تحميل بيانات الفروع. يرجى المحاولة لاحقاً." });
  }
}, []);

  // reload branches when page or search changes
  useEffect(() => {
    loadBranches(page, search);
  }, [page, search, loadBranches]);

  // create new branch
  const createBranch = useCallback(async (data: BranchFormData): Promise<boolean> => {
  try {
    const token = getStoredToken();
    const branch = await branchService.create(data, token);
    dispatch({ type: "ADD", branch });
    notify({ type: "success", message: "تم إضافة الفرع بنجاح." });
    return true;
  } catch (err) {
    notify({ type: "error", message: err instanceof Error ? err.message : "تعذر الاتصال بالخادم." });
    return false;
  }
}, [notify]);

  // update existing branch
  const updateBranch = useCallback(async (id: string, data: BranchFormData): Promise<boolean> => {
    try {
      const token = getStoredToken();
      const branch = await branchService.update(id, data, token);
      if (!branch?.id) {
        throw new Error("لم يُرجع الخادم بيانات الفرع المحدث.");
      }
      dispatch({ type: "UPDATE", branch });
      notify({ type: "success", message: "تم تحديث الفرع بنجاح." });
      return true;
    } catch (err) {
      const msg = err instanceof Error && err.message
        ? err.message
        : "تعذر الاتصال بالخادم. تحقق من اتصالك بالإنترنت.";
      notify({ type: "error", message: msg });
      return false;
    }
  }, [notify]);

  // delete branch
  const deleteBranch = useCallback(async (id: string): Promise<boolean> => {
    try {
      const token = getStoredToken();
      await branchService.delete(id, token);
      dispatch({ type: "DELETE", id });
      notify({ type: "success", message: "تم حذف الفرع بنجاح." });
      return true;
    } catch (err) {
      const msg = err instanceof Error && err.message
        ? err.message
        : "تعذر الاتصال بالخادم. تحقق من اتصالك بالإنترنت.";
      notify({ type: "error", message: msg });
      return false;
    }
  }, [notify]);

  const handleSearch = useCallback((q: string) => {
    setSearch(q);
    setPage(1);
  }, []);

  const clearError = useCallback(() => dispatch({ type: "CLEAR_ERR" }), []);

  return {
    //table data and status
    ...state,
    // pagination and search state
    page,
    search,
    setPage,
    handleSearch,
    clearError,
    //main actions
    createBranch,
    updateBranch,
    deleteBranch,
    // notifications for success/error messages
    notification,
  };
}