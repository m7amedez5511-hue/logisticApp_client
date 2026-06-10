"use client";

import { useEffect, useState } from "react";
import { getStoredToken } from "../../lib/auth";
import { get } from "../../services/api";
import { Spinner, Alert } from "../../Components/UI";

interface Driver {
  id: string;
  name: string;
  userName?: string;
  phone: string;
  nationality?: string;
  licenseNumber?: string;
  licenseExpiry?: string;
  nationalIdExpiry?: string;
  status: "Active" | "Inactive" | "InTrip" | "Suspended";
  isActive: boolean;
  branch?: { name: string };
  createdAt: string;
}

interface ApiResponse {
  data: {
    data: Driver[];
    pagination: { total: number; page: number; pages: number };
  };
}

const STATUS_MAP: Record<Driver["status"], { label: string; color: string; bg: string; border: string }> = {
  Active:    { label: "نشط",      color: "#166534", bg: "#DCFCE7", border: "#BBF7D0" },
  InTrip:    { label: "في رحلة",  color: "#1E40AF", bg: "#EFF6FF", border: "#BFDBFE" },
  Inactive:  { label: "غير نشط", color: "#64748B", bg: "#F1F5F9", border: "#E2E8F0" },
  Suspended: { label: "موقوف",   color: "#991B1B", bg: "#FEF2F2", border: "#FECACA" },
};

function fmtDate(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("ar-SA", {
    year: "numeric", month: "short", day: "numeric",
  });
}

function expirySoon(iso?: string) {
  if (!iso) return false;
  return (new Date(iso).getTime() - Date.now()) / 86_400_000 <= 90;
}

const cardStyle: React.CSSProperties = {
  borderRadius: "var(--radius-xl)",
  border: "1px solid var(--color-border)",
  background: "var(--color-surface)",
  overflow: "hidden",
  boxShadow: "var(--shadow-card)",
};

const thStyle: React.CSSProperties = {
  padding: "0.75rem 1.5rem",
  fontSize: 11,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.2em",
  color: "var(--color-text-muted)",
  background: "var(--color-surface-muted)",
  borderBottom: "1px solid var(--color-border)",
};

export default function DriversPage() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
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
    get<ApiResponse>(`driver${query}`, token)
      .then((res) => {
        const payload = res.data ?? res;
        setDrivers(payload.data ?? []);
        setTotal(payload.pagination?.total ?? 0);
        setPages(payload.pagination?.pages ?? 1);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [page, search]);

  return (
    <section style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

      {/* Header */}
      <header style={{
        borderRadius: "var(--radius-xl)",
        border: "1px solid var(--color-border)",
        background: "var(--color-surface)",
        padding: "1.5rem 2rem",
        boxShadow: "var(--shadow-card)",
      }}>
        <p style={{ fontSize: 11, letterSpacing: "0.3em", textTransform: "uppercase", color: "#2563EB", fontWeight: 600 }}>
          إدارة الكوادر
        </p>
        <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--color-text-primary)", margin: 0 }}>
              السائقون
            </h1>
            <p style={{ marginTop: "0.25rem", fontSize: 13, color: "var(--color-text-muted)" }}>
              إجمالي <strong style={{ color: "var(--color-text-primary)" }}>{total}</strong> سائق مسجل
            </p>
          </div>
          <div style={{ position: "relative", width: "100%", maxWidth: 288 }}>
            <svg style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", width: 16, height: 16, color: "var(--color-text-hint)", pointerEvents: "none" }}
              fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input type="text" placeholder="بحث بالاسم أو الهاتف..." value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }} dir="rtl"
              style={{
                width: "100%", height: 40, paddingRight: 36, paddingLeft: 12,
                borderRadius: "var(--radius-lg)",
                border: "1px solid var(--color-border)",
                background: "var(--color-surface)",
                fontSize: 13, color: "var(--color-text-primary)",
                outline: "none", fontFamily: "var(--font-sans)",
              }}
            />
          </div>
        </div>
      </header>

      {error && <Alert type="error" message={error} onClose={() => setError(null)} />}

      {/* Table */}
      <div style={cardStyle}>
        <div dir="rtl" style={{
          display: "grid",
          gridTemplateColumns: "2fr 1.2fr 1fr 1fr 1fr 1fr",
          ...thStyle,
        }}>
          <span>السائق</span>
          <span>الفرع</span>
          <span>الجنسية</span>
          <span>انتهاء الرخصة</span>
          <span>الحالة</span>
          <span style={{ textAlign: "center" }}>انتهاء الهوية</span>
        </div>

        {loading ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, padding: "4rem 0", color: "var(--color-text-muted)" }}>
            <Spinner size="sm" className="text-blue-600" />
            <span style={{ fontSize: 13 }}>جارٍ التحميل…</span>
          </div>
        ) : drivers.length === 0 ? (
          <p style={{ textAlign: "center", padding: "4rem 0", fontSize: 13, color: "var(--color-text-muted)" }}>
            لا توجد نتائج {search && `لـ "${search}"`}
          </p>
        ) : (
          <ul dir="rtl" style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {drivers.map((d, i) => {
              const status  = STATUS_MAP[d.status];
              const licWarn = expirySoon(d.licenseExpiry);
              const idWarn  = expirySoon(d.nationalIdExpiry);
              return (
                <li key={d.id} style={{
                  display: "grid",
                  gridTemplateColumns: "2fr 1.2fr 1fr 1fr 1fr 1fr",
                  alignItems: "center", gap: "0.5rem",
                  padding: "0.875rem 1.5rem",
                  borderBottom: "1px solid var(--color-border)",
                  background: i % 2 !== 0 ? "var(--color-surface-muted)" : "transparent",
                  fontSize: 13,
                }}>
                  <div>
                    <p style={{ fontWeight: 600, color: "var(--color-text-primary)", margin: 0 }}>{d.name}</p>
                    <p style={{ marginTop: 2, fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--color-text-muted)" }}>{d.phone}</p>
                  </div>
                  <span style={{ color: "var(--color-text-secondary)" }}>{d.branch?.name ?? "—"}</span>
                  <span style={{ color: "var(--color-text-secondary)" }}>{d.nationality ?? "—"}</span>
                  <span style={{
                    fontSize: 12, fontWeight: 600,
                    color: licWarn ? "#D97706" : "var(--color-text-secondary)",
                  }}>
                    {licWarn && "⚠ "}{fmtDate(d.licenseExpiry)}
                  </span>
                  <span style={{
                    display: "inline-flex", alignItems: "center",
                    borderRadius: "var(--radius-full)",
                    border: `1px solid ${status.border}`,
                    background: status.bg,
                    padding: "0.2rem 0.625rem",
                    fontSize: 11, fontWeight: 600, color: status.color,
                    width: "fit-content",
                  }}>
                    {status.label}
                  </span>
                  <span style={{
                    textAlign: "center", fontSize: 12, fontWeight: 600,
                    color: idWarn ? "#D97706" : "var(--color-text-secondary)",
                  }}>
                    {idWarn && "⚠ "}{fmtDate(d.nationalIdExpiry)}
                  </span>
                </li>
              );
            })}
          </ul>
        )}

        {pages > 1 && (
          <div dir="rtl" style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            borderTop: "1px solid var(--color-border)", padding: "0.875rem 1.5rem",
          }}>
            <span style={{ fontSize: 12, color: "var(--color-text-muted)" }}>
              صفحة <strong style={{ color: "var(--color-text-primary)" }}>{page}</strong> من <strong style={{ color: "var(--color-text-primary)" }}>{pages}</strong>
            </span>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              {[
                { label: "السابق", action: () => setPage(p => Math.max(1, p - 1)),    disabled: page === 1     },
                { label: "التالي", action: () => setPage(p => Math.min(pages, p + 1)), disabled: page === pages },
              ].map(btn => (
                <button key={btn.label} onClick={btn.action} disabled={btn.disabled}
                  style={{
                    borderRadius: "var(--radius-lg)",
                    border: "1px solid var(--color-border)",
                    background: "var(--color-surface-muted)",
                    padding: "0.375rem 0.875rem",
                    fontSize: 12, color: "var(--color-text-secondary)",
                    cursor: btn.disabled ? "not-allowed" : "pointer",
                    opacity: btn.disabled ? 0.4 : 1,
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