"use client";


import { useCallback, useEffect, useReducer, useState } from "react";
import { getStoredToken } from "../lib/auth";
import { roleService } from "../services/role.service";
import type { Role, RoleFormData, Permission } from "../services/role.service";

// ── Notification ──────────────────────────────────────────────────────────────

export interface RoleNotification {
  type: "success" | "error";
  message: string;
}

// ── Table state / reducer ─────────────────────────────────────────────────────

interface TableState {
  roles: Role[];
  loading: boolean;
  total: number;
  pages: number;
  error: string | null;
}

type TableAction =
  | { type: "LOAD_START" }
  | { type: "LOAD_OK"; roles: Role[]; total: number; pages: number }
  | { type: "LOAD_ERR"; error: string }
  | { type: "ADD"; role: Role }
  | { type: "UPDATE"; role: Role }
  | { type: "DELETE"; id: string }
  | { type: "CLEAR_ERR" };

function tableReducer(s: TableState, a: TableAction): TableState {
  switch (a.type) {
    case "LOAD_START":  return { ...s, loading: true, error: null };
    case "LOAD_OK":     return { ...s, loading: false, roles: a.roles, total: a.total, pages: a.pages };
    case "LOAD_ERR":    return { ...s, loading: false, error: a.error };
    case "ADD":         return { ...s, roles: [a.role, ...s.roles] };
    case "UPDATE":      return { ...s, roles: s.roles.map(r => r.id === a.role.id ? a.role : r) };
    case "DELETE":      return { ...s, roles: s.roles.filter(r => r.id !== a.id) };
    case "CLEAR_ERR":   return { ...s, error: null };
    default:            return s;
  }
}

const initialState: TableState = {
  roles: [], loading: true, total: 0, pages: 1, error: null,
};

// ── Main hook ─────────────────────────────────────────────────────────────────

export function useRoles() {
  const [state, dispatch]               = useReducer(tableReducer, initialState);
  const [search, setSearch]             = useState("");
  const [page, setPage]                 = useState(1);
  const [permissions, setPermissions]   = useState<Permission[]>([]);
  const [notification, setNotification] = useState<RoleNotification | null>(null);

  const notify = useCallback((n: RoleNotification) => {
    setNotification(n);
    setTimeout(() => setNotification(null), 4000);
  }, []);

  // ── Fetch roles ─────────────────────────────────────────────────────────────
  const loadRoles = useCallback(async (p: number, q: string) => {
    dispatch({ type: "LOAD_START" });
    try {
      const token = getStoredToken();
      const res   = await roleService.getAll(p, q, token);
      const payload = (res as unknown as { data: { data: Role[]; meta?: { total: number; pages: number }; pagination?: { total: number; pages: number } } }).data ?? res;
      dispatch({
        type: "LOAD_OK",
        roles: payload.data ?? [],
        total: payload.meta?.total ?? payload.pagination?.total ?? 0,
        pages: payload.meta?.pages ?? payload.pagination?.pages ?? 1,
      });
    } catch {
      dispatch({ type: "LOAD_ERR", error: "تعذّر تحميل بيانات الأدوار. يرجى المحاولة مجدداً." });
    }
  }, []);

  // ── Load permissions on mount ────────────────────────────────────────────────
  useEffect(() => {
    const token = getStoredToken();
    roleService.getPermissions(token)
      .then(res => {
        const raw = (res as unknown as { data: { premissions: Permission[] } }).data;
        setPermissions(raw?.premissions ?? []);
      })
      .catch(() => {});
  }, []);

  // ── Reload when page / search changes ────────────────────────────────────────
  useEffect(() => {
    loadRoles(page, search);
  }, [page, search, loadRoles]);

  // ── CRUD actions ─────────────────────────────────────────────────────────────

  const createRole = useCallback(async (data: RoleFormData): Promise<boolean> => {
    try {
      const token = getStoredToken();
      const res   = await roleService.create(data, token);
      const role  = (res as unknown as { data: Role }).data;

      // Assign permissions sequentially (backend handles individually)
      for (const pid of data.permissionIds) {
        try {
          await roleService.assignPermission(role.id, pid, token);
        } catch { /* non-fatal: skip individual failures */ }
      }

      // Re-fetch to get fresh data with permissions attached
      await loadRoles(page, search);
      notify({ type: "success", message: "تم إنشاء الدور وتعيين الصلاحيات بنجاح." });
      return true;
    } catch (err) {
      notify({
        type: "error",
        message: err instanceof Error ? err.message : "تعذّر إنشاء الدور.",
      });
      return false;
    }
  }, [page, search, loadRoles, notify]);

  const updateRole = useCallback(async (id: string, data: RoleFormData, currentPermIds: string[]): Promise<boolean> => {
    try {
      const token = getStoredToken();
      // Update basic fields
      await roleService.update(id, data, token);

      // Diff permissions: add new, remove removed
      const toAdd    = data.permissionIds.filter(p => !currentPermIds.includes(p));
      const toRemove = currentPermIds.filter(p => !data.permissionIds.includes(p));

      for (const pid of toAdd)    { try { await roleService.assignPermission(id, pid, token); } catch { /* skip */ } }
      for (const pid of toRemove) { try { await roleService.removePermission(id, pid, token);  } catch { /* skip */ } }

      await loadRoles(page, search);
      notify({ type: "success", message: "تم تحديث الدور والصلاحيات بنجاح." });
      return true;
    } catch (err) {
      notify({
        type: "error",
        message: err instanceof Error ? err.message : "تعذّر تحديث الدور.",
      });
      return false;
    }
  }, [page, search, loadRoles, notify]);

  const deleteRole = useCallback(async (id: string): Promise<boolean> => {
    try {
      const token = getStoredToken();
      await roleService.delete(id, token);
      dispatch({ type: "DELETE", id });
      notify({ type: "success", message: "تم حذف الدور بنجاح." });
      return true;
    } catch (err) {
      notify({
        type: "error",
        message: err instanceof Error ? err.message : "تعذّر حذف الدور.",
      });
      return false;
    }
  }, [notify]);

  const handleSearch = useCallback((q: string) => {
    setSearch(q);
    setPage(1);
  }, []);

  return {
    ...state,
    permissions,
    page,
    search,
    setPage,
    handleSearch,
    clearError: () => dispatch({ type: "CLEAR_ERR" }),
    createRole,
    updateRole,
    deleteRole,
    notification,
  };
}