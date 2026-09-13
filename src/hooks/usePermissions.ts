// src/hooks/usePermissions.ts
"use client";

import { useMemo } from "react";
import { useStoredUser } from "./useStoredUser";

/**
 * Central permission lookup — single source of truth for RBAC checks
 * on the client. Reads the cached user (already normalized by
 * src/lib/auth.ts) instead of re-parsing localStorage everywhere.
 */
export function usePermissions() {
  const { user, loading } = useStoredUser();

  // Stable key so effects that depend on "permissions" don't re-run on
  // every render just because getStoredUser() returns a new array ref.
  const permissions = user?.permissions ?? [];
  const permissionsKey = permissions.join(",");

  const permissionSet = useMemo(
    () => new Set(permissions),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [permissionsKey],
  );

  const has = (permission: string) => permissionSet.has(permission);
  const hasAny = (perms: string[]) => perms.some((p) => permissionSet.has(p));

  return { has, hasAny, permissions, permissionsKey, loading };
}