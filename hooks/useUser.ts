"use client";

import { useCallback, useEffect, useReducer, useState } from "react";
import { getStoredToken } from "../lib/auth";
import { userService } from "../services/user.service";
import type { Branch } from "../types/branch";
import type { Role } from "../types/role";
import type {
  TableAction,
  TableState,
  User,
  UserFormData,
} from "../types/user";

// ── message taype─────────────────────────────────────────
export interface Notification {
  type: "success" | "error";
  message: string;
}

// ── Reducer  ──────────────────────────────────────
function tableReducer(s: TableState, a: TableAction): TableState {
  switch (a.type) {
    case "LOAD_START":  return { ...s, loading: true, error: null };
    case "LOAD_OK":     return { ...s, loading: false, users: a.users, total: a.total, pages: a.pages };
    case "LOAD_ERR":    return { ...s, loading: false, error: a.error };
    case "ADD":         return { ...s, users: [a.user, ...s.users] };
    case "UPDATE":      return { ...s, users: s.users.map(u => u.id === a.user.id ? a.user : u) };
    case "DELETE":      return { ...s, users: s.users.filter(u => u.id !== a.id) };
    case "CLEAR_ERR":   return { ...s, error: null };
    default:            return s;
  }
}

// ──  first status ─────────────────────────────────────────────────────────
const initialState: TableState = {
  users: [], loading: true, total: 0, pages: 1, error: null,
};

// ──  main hook ──────────────────────────────────────────────────────────────
export function useUsers() {
  const [state, dispatch]         = useReducer(tableReducer, initialState);
  const [search, setSearch]       = useState("");
  const [page, setPage]           = useState(1);
  const [roles, setRoles]         = useState<Role[]>([]);
  const [branches, setBranches]   = useState<Branch[]>([]);
  const [notification, setNotification] = useState<Notification | null>(null);

  //        notify with auto-dismiss after 4s 
  const notify = useCallback((n: Notification) => {
    setNotification(n);
    setTimeout(() => setNotification(null), 4000);
  }, []);

  // fetch users with pagination and search
  const loadUsers = useCallback(async (p: number, q: string) => {
    dispatch({ type: "LOAD_START" });
    try {
      const token = getStoredToken();
      const res   = await userService.getAll(p, q, token);
      const payload = res.data ?? res;
      dispatch({
        type: "LOAD_OK",
        users: payload.data ?? [],
        total: payload.meta?.total ?? 0,
        pages: payload.meta?.pages ?? 1,
      });
    } catch {
      dispatch({ type: "LOAD_ERR", error: "عذراً، حدث خطأ أثناء تحميل بيانات المستخدمين. يرجى المحاولة لاحقاً." });
    }
  }, []);

  // fetch roles and branches for form dropdowns on mount
  useEffect(() => {
    const token = getStoredToken();
    userService.getRoles(token)
      .then(res => setRoles((res.data ?? res).data ?? []))
      .catch(() => {});
    userService.getBranches(token)
      .then(res => setBranches((res.data ?? res).data ?? []))
      .catch(() => {});
  }, []);

  // reload users when page or search changes
  useEffect(() => {
    loadUsers(page, search);
  }, [page, search, loadUsers]);

  // create new user
  const createUser = useCallback(async (data: UserFormData): Promise<boolean> => {
    try {
      const token = getStoredToken();
      const res   = await userService.create(data as UserFormData & { password: string }, token);
      dispatch({ type: "ADD", user: res.data });
      notify({ type: "success", message: "تم إنشاء مستخدم جديد بنجاح." });
      return true;
    } catch (err) {
      const msg = err instanceof Error && err.message
        ? err.message
        : "تعذر الاتصال بالخادم. تحقق من اتصالك بالإنترنت.";
      notify({ type: "error", message: msg });
      return false;
    }
  }, [notify]);

  // update existing user
  const updateUser = useCallback(async (id: string, data: UserFormData): Promise<boolean> => {
    try {
      const token = getStoredToken();
      const res   = await userService.update(id, data, token);
      dispatch({ type: "UPDATE", user: res.data });
      notify({ type: "success", message: "تم تحديث بيانات المستخدم بنجاح." });
      return true;
    } catch (err) {
      const msg = err instanceof Error && err.message
        ? err.message
        : "تعذر الاتصال بالخادم. تحقق من اتصالك بالإنترنت.";
      notify({ type: "error", message: msg });
      return false;
    }
  }, [notify]);

  // deletwe user
  const deleteUser = useCallback(async (id: string): Promise<boolean> => {
    try {
      const token = getStoredToken();
      await userService.delete(id, token);
      dispatch({ type: "DELETE", id });
      notify({ type: "success", message: "تم حذف المستخدم بنجاح." });
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
   // dropdown data for forms
    roles,
    branches,
    // pagination and search state
    page,
    search,
    setPage,
    handleSearch,
    clearError,
    //main actions
    createUser,
    updateUser,
    deleteUser,
    // notifications for success/error messages
    notification,
  };
}