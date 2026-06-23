"use client";

import { useCallback, useEffect, useReducer, useState } from "react";
import { Alert, Spinner } from "@/src/Components/UI";
import { getStoredToken } from "@/src/lib/auth";
import { get } from "@/src/services/api";

// ── Types ──────────────────────────────────────────────────────────────────

interface AuditLog {
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

// ── State / Reducer ────────────────────────────────────────────────────────

interface State {
  logs: AuditLog[];
  loading: boolean;
  total: number;
  pages: number;
  error: string | null;
}

type Action =
  | { type: "LOAD_START" }
  | { type: "LOAD_OK"; logs: AuditLog[]; total: number; pages: number }
  | { type: "LOAD_ERR"; error: string }
  | { type: "CLEAR_ERR" };

function reducer(s: State, a: Action): State {
  switch (a.type) {
    case "LOAD_START": return { ...s, loading: true, error: null };
    case "LOAD_OK":    return { ...s, loading: false, logs: a.logs, total: a.total, pages: a.pages };
    case "LOAD_ERR":   return { ...s, loading: false, error: a.error };
    case "CLEAR_ERR":  return { ...s, error: null };
    default:           return s;
  }
}

// ── Action badge ───────────────────────────────────────────────────────────

const ACTION_COLORS: Record<string, { bg: string; color: string; border: string }> = {
  CREATE: { bg: "#DCFCE7", color: "#166534", border: "#BBF7D0" },
  UPDATE: { bg: "#EFF6FF", color: "#1D4ED8", border: "#BFDBFE" },
  DELETE: { bg: "#FEF2F2", color: "#DC2626", border: "#FECACA" },
  LOGIN:  { bg: "#F5F3FF", color: "#5B21B6", border: "#DDD6FE" },
  LOGOUT: { bg: "#F1F5F9", color: "#475569", border: "#E2E8F0" },
};

function ActionBadge({ action }: { action: string }) {
  const upper = action?.toUpperCase() ?? "";
  const key = Object.keys(ACTION_COLORS).find(k => upper.includes(k)) ?? "CREATE";
  const cfg = ACTION_COLORS[key];
  return (
    <span style={{
      display: "inline-flex", alignItems: "center",
      borderRadius: "var(--radius-full)", border: `1px solid ${cfg.border}`,
      background: cfg.bg, padding: "0.2rem 0.625rem",
      fontSize: 11, fontWeight: 700, color: cfg.color, whiteSpace: "nowrap",
    }}>
      {action}
    </span>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function AuditPage() {
  const [state, dispatch] = useReducer(reducer, {
    logs: [], loading: true, total: 0, pages: 1, error: null,
  });
  const [page, setPage]       = useState(1);
  const [search, setSearch]   = useState("");
  const [module, setModule]   = useState("");

  const loadLogs = useCallback(async (p: number, q: string, mod: string) => {
    dispatch({ type: "LOAD_START" });
    try {
      const token = getStoredToken();
      const params = new URLSearchParams({ page: String(p), limit: "15" });
      if (q)   params.set("search", q);
      if (mod) params.set("module", mod);
      const res = await get<{
        data: { data: AuditLog[]; meta?: { total: number; pages: number }; pagination?: { total: number; pages: number } };
      }>(`audit?${params}`, token);
      const payload = (res as unknown as { data: { data: AuditLog[]; meta?: { total: number; pages: number }; pagination?: { total: number; pages: number } } }).data;
      dispatch({
        type: "LOAD_OK",
        logs: payload.data ?? [],
        total: payload.meta?.total ?? payload.pagination?.total ?? 0,
        pages: payload.meta?.pages ?? payload.pagination?.pages ?? 1,
      });
    } catch {
      dispatch({ type: "LOAD_ERR", error: "تعذّر تحميل سجل التدقيق. يرجى المحاولة مجدداً." });
    }
  }, []);

  useEffect(() => { loadLogs(page, search, module); }, [page, search, module, loadLogs]);

  const cardStyle: React.CSSProperties = {
    borderRadius: "var(--radius-xl)", border: "1px solid var(--color-border)",
    background: "var(--color-surface)", overflow: "hidden", boxShadow: "var(--shadow-card)",
  };

  const thStyle: React.CSSProperties = {
    padding: "0.75rem 1.5rem", fontSize: 11, fontWeight: 700,
    textTransform: "uppercase", letterSpacing: "0.2em",
    color: "var(--color-text-muted)", background: "var(--color-surface-muted)",
    borderBottom: "1px solid var(--color-border)",
  };

  return (
    <section style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

      {/* Header */}
      <header style={{ borderRadius: "var(--radius-xl)", border: "1px solid var(--color-border)", background: "var(--color-surface)", padding: "1.5rem 2rem", boxShadow: "var(--shadow-card)" }}>
        <p style={{ fontSize: 11, letterSpacing: "0.3em", textTransform: "uppercase", color: "#2563EB", fontWeight: 600 }}>
          الامتثال والمراجعة
        </p>
        <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--color-text-primary)", margin: 0 }}>سجل التدقيق</h1>
            <p style={{ marginTop: "0.25rem", fontSize: 13, color: "var(--color-text-muted)" }}>
              إجمالي <strong style={{ color: "var(--color-text-primary)" }}>{state.total}</strong> سجل
            </p>
          </div>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
            <input type="text" placeholder="بحث بالإجراء أو المستخدم…" value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }} dir="rtl"
              style={{ width: 220, height: 40, padding: "0 0.75rem", borderRadius: "var(--radius-lg)", border: "1px solid var(--color-border)", background: "var(--color-surface)", fontSize: 13, color: "var(--color-text-primary)", outline: "none", fontFamily: "var(--font-sans)" }} />
            <select value={module} onChange={e => { setModule(e.target.value); setPage(1); }} dir="rtl"
              style={{ height: 40, padding: "0 0.75rem", borderRadius: "var(--radius-lg)", border: "1px solid var(--color-border)", background: "var(--color-surface)", fontSize: 13, color: "var(--color-text-secondary)", outline: "none", fontFamily: "var(--font-sans)" }}>
              <option value="">كل الوحدات</option>
              {["User","Driver","Car","Trip","Order","Client","Role","Branch"].map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
        </div>
      </header>

      {state.error && <Alert type="error" message={state.error} onClose={() => dispatch({ type: "CLEAR_ERR" })} />}

      {/* Table */}
      <div style={cardStyle}>
        <div dir="rtl" style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr 1.5fr 1fr", ...thStyle }}>
          <span>الإجراء</span>
          <span>الوحدة</span>
          <span>المستخدم</span>
          <span>عنوان IP</span>
          <span style={{ textAlign: "center" }}>الوقت</span>
        </div>

        {state.loading ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, padding: "4rem 0", color: "var(--color-text-muted)" }}>
            <Spinner size="sm" className="text-blue-600" />
            <span style={{ fontSize: 13 }}>جارٍ التحميل…</span>
          </div>
        ) : state.logs.length === 0 ? (
          <p style={{ textAlign: "center", padding: "4rem 0", fontSize: 13, color: "var(--color-text-muted)" }}>
            لا توجد سجلات مطابقة
          </p>
        ) : (
          <ul dir="rtl" style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {state.logs.map((log, i) => (
              <li key={log.id} style={{
                display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr 1.5fr 1fr",
                alignItems: "center", gap: "0.5rem", padding: "0.875rem 1.5rem",
                borderBottom: "1px solid var(--color-border)",
                background: i % 2 !== 0 ? "var(--color-surface-muted)" : "transparent",
                fontSize: 13,
              }}>
                <div>
                  <ActionBadge action={log.action} />
                  {log.entityId && (
                    <p style={{ marginTop: 2, fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--color-text-muted)" }}>
                      {log.entityId.slice(0, 12)}…
                    </p>
                  )}
                </div>
                <span style={{ color: "var(--color-text-secondary)" }}>{log.module ?? "—"}</span>
                <span style={{ color: "var(--color-text-secondary)" }}>{log.userName ?? log.userId ?? "—"}</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--color-text-muted)" }}>{log.ipAddress ?? "—"}</span>
                <span style={{ textAlign: "center", fontSize: 11, color: "var(--color-text-muted)" }}>
                  {new Date(log.createdAt).toLocaleString("ar-SA", { dateStyle: "short", timeStyle: "short" })}
                </span>
              </li>
            ))}
          </ul>
        )}

        {state.pages > 1 && (
          <div dir="rtl" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "1px solid var(--color-border)", padding: "0.875rem 1.5rem" }}>
            <span style={{ fontSize: 12, color: "var(--color-text-muted)" }}>
              صفحة <strong style={{ color: "var(--color-text-primary)" }}>{page}</strong> من <strong style={{ color: "var(--color-text-primary)" }}>{state.pages}</strong>
            </span>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              {[
                { label: "السابق", action: () => setPage(p => Math.max(1, p - 1)), disabled: page === 1 },
                { label: "التالي", action: () => setPage(p => Math.min(state.pages, p + 1)), disabled: page === state.pages },
              ].map(btn => (
                <button key={btn.label} onClick={btn.action} disabled={btn.disabled}
                  style={{ borderRadius: "var(--radius-lg)", border: "1px solid var(--color-border)", background: "var(--color-surface-muted)", padding: "0.375rem 0.875rem", fontSize: 12, color: "var(--color-text-secondary)", cursor: btn.disabled ? "not-allowed" : "pointer", opacity: btn.disabled ? 0.4 : 1, fontFamily: "var(--font-sans)" }}>
                  {btn.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}