

export interface AuditLog {
  id: string;
  action: string;
  module?: string | null;
  entityId?: string | null;
  userId?: string | null;
  userName?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
}