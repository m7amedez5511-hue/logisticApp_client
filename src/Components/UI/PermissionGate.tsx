
"use client";

import { usePermissions } from "@/src/hooks/usePermissions";

interface PermissionGateProps {
  /** Required permission slug, e.g. "read-car" */
  permission: string;
  children: React.ReactNode;
  /** Rendered instead of children when the permission is missing */
  fallback?: React.ReactNode;
}

/**
 * Conditionally renders children based on the current user's permissions.
 * Renders nothing while the stored user is loading, to avoid a flash of
 * content the user isn't allowed to see.
 */
export function PermissionGate({ permission, children, fallback = null }: PermissionGateProps) {
  const { has, loading } = usePermissions();
  if (loading) return null;
  return has(permission) ? <>{children}</> : <>{fallback}</>;
}