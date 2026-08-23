"use client";

import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { getStoredToken } from "@/src/lib/auth";
import { userService } from "@/src/services/user.service";
import type { Branch } from "@/src/types/branch";
import type { Role } from "@/src/types/role";
import type {
  TableAction,
  TableState,
  UserFormData,
} from "@/src/types/user";
import type { ToastNotification } from "@/src/Components/UI"

export type Notification = ToastNotification;

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
  const [notification, setNotification] = useState<ToastNotification | null>(null);

  // Ref so the dismiss timer can be cleared if a new notification arrives
  // before the previous one expires — prevents stale-closure memory leaks
  // and premature/duplicate toast dismissal on rapid successive calls.
  // Pattern copied from useTrip.ts for consistency across list hooks.
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  //        notify with auto-dismiss after 4s
  const notify = useCallback((n: ToastNotification) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setNotification(n);
    timerRef.current = setTimeout(() => setNotification(null), 4000);
  }, []);

  // Clear pending timer on unmount
  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  // fetch users with pagination and search
 const loadUsers = useCallback(async (p: number, q: string) => {
  dispatch({ type: "LOAD_START" });
  try {
    const token = getStoredToken();
    const { items, total, pages } = await userService.getAll(p, q, token);
    dispatch({ type: "LOAD_OK", users: items, total, pages });
  } catch {
    dispatch({ type: "LOAD_ERR", error: "عذراً، حدث خطأ أثناء تحميل بيانات المستخدمين. يرجى المحاولة لاحقاً." });
  }
}, []);

useEffect(() => {
  const token = getStoredToken();
  userService.getRoles(token).then(setRoles).catch(() => {});
  userService.getBranches(token).then(setBranches).catch(() => {});
}, []);

  // reload users when page or search changes
  useEffect(() => {
    loadUsers(page, search);
  }, [page, search, loadUsers]);

  // create new user
const createUser = useCallback(async (data: UserFormData): Promise<boolean> => {
  try {
    const token = getStoredToken();
    const user = await userService.create(data as UserFormData & { password: string }, token);
    dispatch({ type: "ADD", user });
    notify({ type: "success", message: "تم إنشاء مستخدم جديد بنجاح." });
    return true;
  } catch (err) {
    notify({ type: "error", message: err instanceof Error && err.message ? err.message : "تعذر الاتصال بالخادم." });
    return false;
  }
}, [notify]);

  // update existing user
  const updateUser = useCallback(async (id: string, data: UserFormData): Promise<boolean> => {
    try {
      const token = getStoredToken();
      const res   = await userService.update(id, data, token);
      dispatch({ type: "UPDATE", user: res });
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

  // delete user
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