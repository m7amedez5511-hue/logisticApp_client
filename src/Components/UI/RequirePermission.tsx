
"use client";
import { usePermissions } from "@/src/hooks/usePermissions";
import { NotAuthorized } from "./NotAuthorized";

interface RequirePermissionProps {
  permission: string;
  children: React.ReactNode;
}

/**
 * Guards an entire entity page. Renders NotAuthorized instead of the
 * page content when the user lacks the permission — this is what
 * catches direct navigation (typed URL / stale link) to a restricted
 * route, without a hard redirect or a raw error state.
 */
export function RequirePermission({ permission, children }: RequirePermissionProps) {
  const { has, loading } = usePermissions();
  if (loading) return null;
  return has(permission) ? <>{children}</> : <NotAuthorized />;
}