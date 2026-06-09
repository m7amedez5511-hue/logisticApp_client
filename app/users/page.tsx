"use client";

import { useEffect, useState } from "react";
import { getStoredToken } from "../../lib/auth";
import { get } from "../../services/api";
import { Spinner, Alert } from "../../Components/UI";

interface User {
  id: string;
  name: string;
  userName?: string;
  email?: string;
  phone: string;
  isActive: boolean;
  createdAt: string;
  role?: { name: string };
  branch?: { name: string };
}

interface ApiResponse {
  data: {
    data: User[];
    pagination: { total: number; page: number; pages: number };
  };
}

function RoleBadge({ name }: { name?: string }) {
  const isAdmin = name === "مدير النظام";
  return (
    <span style={{
      display: "inline-flex",
      alignItems: "center",
      borderRadius: "var(--radius-full)",
      border: isAdmin ? "1px solid rgba(103,232,249,0.30)" : "1px solid var(--color-border-dark)",
      background: isAdmin ? "rgba(103,232,249,0.10)" : "rgba(255,255,255,0.04)",
      padding: "0.2rem 0.625rem",
      fontSize: 11,
      fontWeight: 600,
      color: isAdmin ? "#CFFAFE" : "var(--color-text-dark-muted)",
    }}>
      {name ?? "—"}
    </span>
  );
}

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      borderRadius: "var(--radius-full)",
      border: active ? "1px solid rgba(52,211,153,0.20)" : "1px solid rgba(251,113,133,0.20)",
      background: active ? "rgba(52,211,153,0.10)" : "rgba(244,63,94,0.08)",
      padding: "0.2rem 0.625rem",
      fontSize: 11,
      fontWeight: 600,
      color: active ? "#A7F3D0" : "#FCA5A5",
    }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: active ? "#34D399" : "#F87171", flexShrink: 0 }} />
      {active ? "نشط" : "معطل"}
    </span>
  );
}

export default function UsersPage() {
  const [users, setUsers]     = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [search, setSearch]   = useState("");
  const [page, setPage]       = useState(1);
  const [total, setTotal]     = useState(0);
  const [pages, setPages]     = useState(1);

  useEffect(() => {
    const token = getStoredToken();
    setLoading(true);
    setError(null);
    const query = `?page=${page}&limit=10${search ? `&search=${encodeURIComponent(search)}` : ""}`;
    get<ApiResponse>(`/users${query}`, token)
      .then((res) => {
        setUsers(res.data.data);
        setTotal(res.data.pagination.total);
        setPages(res.data.pagination.pages);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [page, search]);

  const cardStyle: React.CSSProperties = {
    borderRadius: "var(--radius-2xl)",
    border: "1px solid var(--color-border-dark)",
    background: "var(--color-surface-dark-card)",
    overflow: "hidden",
    boxShadow: "var(--shadow-card)",
  };

  const thStyle: React.CSSProperties = {
    padding: "0.75rem 1.5rem",
    fontSize: 11,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.25em",
    color: "var(--color-text-dark-muted)",
    background: "rgba(255,255,255,0.04)",
    borderBottom: "1px solid var(--color-border-dark)",
  };

  return (
    <section style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

      {/* ── Header ── */}
      <header style={{
        borderRadius: "var(--radius-2xl)",
        border: "1px solid var(--color-border-dark)",
        background: "rgba(255,255,255,0.04)",
        padding: "1.5rem 2rem",
        boxShadow: "var(--shadow-overlay)",
        backdropFilter: "blur(16px)",
      }}>
        <p style={{ fontSize: 11, letterSpacing: "0.35em", textTransform: "uppercase", color: "#67E8F9" }}>
          إدارة الفريق
        </p>
        <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 600, color: "var(--color-text-dark-primary)", margin: 0 }}>
              المستخدمون
            </h1>
            <p style={{ marginTop: "0.25rem", fontSize: 13, color: "var(--color-text-dark-muted)" }}>
              إجمالي <strong style={{ color: "var(--color-text-dark-primary)" }}>{total}</strong> مستخدم مسجل في النظام
            </p>
          </div>
          {/* Search */}
          <div style={{ position: "relative", width: "100%", maxWidth: 288 }}>
            <svg style={{ position: "absolute", left: "auto", right: 12, top: "50%", transform: "translateY(-50%)", width: 16, height: 16, color: "var(--color-text-dark-muted)", pointerEvents: "none" }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              type="text"
              placeholder="بحث بالاسم أو الهاتف..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              dir="rtl"
              style={{
                width: "100%",
                height: 40,
                paddingRight: 36,
                paddingLeft: 12,
                borderRadius: "var(--radius-lg)",
                border: "1px solid var(--color-border-dark)",
                background: "var(--color-surface-dark-raised)",
                fontSize: 13,
                color: "var(--color-text-dark-primary)",
                outline: "none",
                transition: "var(--transition-base)",
                fontFamily: "var(--font-sans)",
              }}
            />
          </div>
        </div>
      </header>

      {/* ── Error ── */}
      {error && (
        <Alert type="error" message={error} onClose={() => setError(null)}
          className="border-rose-400/30 bg-rose-500/10 text-rose-200" />
      )}

      {/* ── Table ── */}
      <div style={cardStyle}>
        {/* Table header */}
        <div dir="rtl" style={{ display: "grid", gridTemplateColumns: "2fr 1.5fr 1.5fr 1fr 1fr 1fr", ...thStyle }}>
          <span>الاسم</span>
          <span>اسم المستخدم</span>
          <span>الفرع</span>
          <span>الدور</span>
          <span>الحالة</span>
          <span style={{ textAlign: "center" }}>تاريخ الإنشاء</span>
        </div>

        {loading ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, padding: "4rem 0", color: "var(--color-text-dark-muted)" }}>
            <Spinner size="sm" className="text-cyan-400" />
            <span style={{ fontSize: 13 }}>جارٍ التحميل…</span>
          </div>
        ) : users.length === 0 ? (
          <p style={{ textAlign: "center", padding: "4rem 0", fontSize: 13, color: "var(--color-text-dark-muted)" }}>
            لا توجد نتائج {search && `لـ "${search}"`}
          </p>
        ) : (
          <ul dir="rtl" style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {users.map((u, i) => (
              <li
                key={u.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "2fr 1.5fr 1.5fr 1fr 1fr 1fr",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "1rem 1.5rem",
                  borderBottom: "1px solid var(--color-border-dark)",
                  background: i % 2 !== 0 ? "rgba(255,255,255,0.02)" : "transparent",
                  transition: "var(--transition-base)",
                  fontSize: 13,
                }}
              >
                {/* Name + phone */}
                <div>
                  <p style={{ fontWeight: 600, color: "var(--color-text-dark-primary)", margin: 0 }}>{u.name}</p>
                  <p style={{ marginTop: 2, fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--color-text-dark-muted)" }}>{u.phone}</p>
                </div>

                {/* Username */}
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "#67E8F9" }}>
                  {u.userName ?? "—"}
                </span>

                {/* Branch */}
                <span style={{ color: "var(--color-text-dark-muted)" }}>{u.branch?.name ?? "—"}</span>

                {/* Role */}
                <RoleBadge name={u.role?.name} />

                {/* Status */}
                <StatusBadge active={u.isActive} />

                {/* Date */}
                <span style={{ textAlign: "center", fontSize: 11, color: "var(--color-text-dark-muted)" }}>
                  {new Date(u.createdAt).toLocaleDateString("ar-SA", { year: "numeric", month: "short", day: "numeric" })}
                </span>
              </li>
            ))}
          </ul>
        )}

        {/* Pagination */}
        {pages > 1 && (
          <div dir="rtl" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "1px solid var(--color-border-dark)", padding: "1rem 1.5rem" }}>
            <span style={{ fontSize: 12, color: "var(--color-text-dark-muted)" }}>
              صفحة <strong style={{ color: "var(--color-text-dark-primary)" }}>{page}</strong> من <strong style={{ color: "var(--color-text-dark-primary)" }}>{pages}</strong>
            </span>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              {[{ label: "السابق", action: () => setPage(p => Math.max(1, p - 1)), disabled: page === 1 },
                { label: "التالي",  action: () => setPage(p => Math.min(pages, p + 1)), disabled: page === pages }]
                .map(btn => (
                  <button key={btn.label} onClick={btn.action} disabled={btn.disabled}
                    style={{
                      borderRadius: "var(--radius-lg)",
                      border: "1px solid var(--color-border-dark)",
                      background: "var(--color-surface-dark-raised)",
                      padding: "0.375rem 0.75rem",
                      fontSize: 12,
                      color: "var(--color-text-dark-muted)",
                      cursor: btn.disabled ? "not-allowed" : "pointer",
                      opacity: btn.disabled ? 0.4 : 1,
                      transition: "var(--transition-base)",
                      fontFamily: "var(--font-sans)",
                    }}>
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