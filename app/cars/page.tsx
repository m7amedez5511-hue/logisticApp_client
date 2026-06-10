"use client";

import { useEffect, useState } from "react";
import { getStoredToken } from "../../lib/auth";
import { get } from "../../services/api";
import { Spinner, Alert } from "../../Components/UI";

interface Car {
  id: string;
  manufacturer: string;
  model: string;
  year: number;
  color?: string;
  plateNumber: string;
  plateLetters: string;
  currentStatus: "Active" | "InMaintenance" | "InTrip" | "Inactive";
  insuranceStatus?: "Valid" | "Expired" | "NotInsured";
  insuranceExpiryDate?: string;
  registrationExpiryDate?: string;
  branch?: { name: string };
  createdAt: string;
}

interface ApiResponse {
  data: {
    data: Car[];
    pagination: { total: number; page: number; pages: number };
  };
}

const STATUS_MAP: Record<
  Car["currentStatus"],
  { label: string; color: string; bg: string; border: string }
> = {
  Active: { label: "نشط", color: "#166534", bg: "#DCFCE7", border: "#BBF7D0" },
  InMaintenance: {
    label: "صيانة",
    color: "#854D0E",
    bg: "#FFFBEB",
    border: "#FDE68A",
  },
  InTrip: {
    label: "في رحلة",
    color: "#1E40AF",
    bg: "#EFF6FF",
    border: "#BFDBFE",
  },
  Inactive: {
    label: "غير نشط",
    color: "#64748B",
    bg: "#F1F5F9",
    border: "#E2E8F0",
  },
};

const INS_MAP: Record<string, { label: string; color: string }> = {
  Valid: { label: "سارٍ", color: "#16A34A" },
  Expired: { label: "منتهي", color: "#DC2626" },
  NotInsured: { label: "غير مؤمَّن", color: "#D97706" },
};

function fmtDate(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("ar-SA", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
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

export default function CarsPage() {
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);

  useEffect(() => {
    const token = getStoredToken();
    setLoading(true);
    setError(null);
    const query = `?page=${page}&limit=10${search ? `&search=${encodeURIComponent(search)}` : ""}`;
    get<ApiResponse>(`cars${query}`, token)
      .then((res) => {
        const payload = res.data ?? res;
        setCars(payload.data ?? []);
        setTotal(payload.pagination?.total ?? 0);
        setPages(payload.pagination?.pages ?? 1);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [page, search]);

  return (
    <section
      style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}
    >
      {/* Header */}
      <header
        style={{
          borderRadius: "var(--radius-xl)",
          border: "1px solid var(--color-border)",
          background: "var(--color-surface)",
          padding: "1.5rem 2rem",
          boxShadow: "var(--shadow-card)",
        }}
      >
        <p
          style={{
            fontSize: 11,
            letterSpacing: "0.3em",
            textTransform: "uppercase",
            color: "#2563EB",
            fontWeight: 600,
          }}
        >
          إدارة الأسطول
        </p>
        <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1
              style={{
                fontSize: "1.5rem",
                fontWeight: 700,
                color: "var(--color-text-primary)",
                margin: 0,
              }}
            >
              السيارات
            </h1>
            <p
              style={{
                marginTop: "0.25rem",
                fontSize: 13,
                color: "var(--color-text-muted)",
              }}
            >
              إجمالي{" "}
              <strong style={{ color: "var(--color-text-primary)" }}>
                {total}
              </strong>{" "}
              مركبة في الأسطول
            </p>
          </div>
          <div style={{ position: "relative", width: "100%", maxWidth: 288 }}>
            <svg
              style={{
                position: "absolute",
                right: 12,
                top: "50%",
                transform: "translateY(-50%)",
                width: 16,
                height: 16,
                color: "var(--color-text-hint)",
                pointerEvents: "none",
              }}
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <input
              type="text"
              placeholder="بحث بالماركة أو اللوحة..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              dir="rtl"
              style={{
                width: "100%",
                height: 40,
                paddingRight: 36,
                paddingLeft: 12,
                borderRadius: "var(--radius-lg)",
                border: "1px solid var(--color-border)",
                background: "var(--color-surface)",
                fontSize: 13,
                color: "var(--color-text-primary)",
                outline: "none",
                fontFamily: "var(--font-sans)",
              }}
            />
          </div>
        </div>
      </header>

      {error && (
        <Alert type="error" message={error} onClose={() => setError(null)} />
      )}

      {/* Table */}
      <div style={cardStyle}>
        <div
          dir="rtl"
          style={{
            display: "grid",
            gridTemplateColumns: "2fr 1.5fr 1fr 1fr 1fr 1fr",
            ...thStyle,
          }}
        >
          <span>السيارة</span>
          <span>اللوحة</span>
          <span>الفرع</span>
          <span>الحالة</span>
          <span>التأمين</span>
          <span style={{ textAlign: "center" }}>انتهاء الاستمارة</span>
        </div>

        {loading ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 12,
              padding: "4rem 0",
              color: "var(--color-text-muted)",
            }}
          >
            <Spinner size="sm" className="text-blue-600" />
            <span style={{ fontSize: 13 }}>جارٍ التحميل…</span>
          </div>
        ) : cars.length === 0 ? (
          <p
            style={{
              textAlign: "center",
              padding: "4rem 0",
              fontSize: 13,
              color: "var(--color-text-muted)",
            }}
          >
            لا توجد نتائج {search && `لـ "${search}"`}
          </p>
        ) : (
          <ul dir="rtl" style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {cars.map((c, i) => {
              const status = STATUS_MAP[c.currentStatus];
              const ins = c.insuranceStatus ? INS_MAP[c.insuranceStatus] : null;
              return (
                <li
                  key={c.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "2fr 1.5fr 1fr 1fr 1fr 1fr",
                    alignItems: "center",
                    gap: "0.5rem",
                    padding: "0.875rem 1.5rem",
                    borderBottom: "1px solid var(--color-border)",
                    background:
                      i % 2 !== 0
                        ? "var(--color-surface-muted)"
                        : "transparent",
                    fontSize: 13,
                  }}
                >
                  <div>
                    <p
                      style={{
                        fontWeight: 600,
                        color: "var(--color-text-primary)",
                        margin: 0,
                      }}
                    >
                      {c.manufacturer} {c.model}
                    </p>
                    <p
                      style={{
                        marginTop: 2,
                        fontSize: 11,
                        color: "var(--color-text-muted)",
                      }}
                    >
                      {c.year}
                      {c.color ? ` · ${c.color}` : ""}
                    </p>
                  </div>
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 13,
                      fontWeight: 700,
                      letterSpacing: "0.08em",
                      color: "#2563EB",
                    }}
                  >
                    {c.plateLetters} {c.plateNumber}
                  </span>
                  <span style={{ color: "var(--color-text-secondary)" }}>
                    {c.branch?.name ?? "—"}
                  </span>
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      borderRadius: "var(--radius-full)",
                      border: `1px solid ${status.border}`,
                      background: status.bg,
                      padding: "0.2rem 0.625rem",
                      fontSize: 11,
                      fontWeight: 600,
                      color: status.color,
                      width: "fit-content",
                    }}
                  >
                    {status.label}
                  </span>
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: ins?.color ?? "var(--color-text-muted)",
                    }}
                  >
                    {ins?.label ?? "—"}
                  </span>
                  <span
                    style={{
                      textAlign: "center",
                      fontSize: 11,
                      color: "var(--color-text-muted)",
                    }}
                  >
                    {fmtDate(c.registrationExpiryDate)}
                  </span>
                </li>
              );
            })}
          </ul>
        )}

        {pages > 1 && (
          <div
            dir="rtl"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderTop: "1px solid var(--color-border)",
              padding: "0.875rem 1.5rem",
            }}
          >
            <span style={{ fontSize: 12, color: "var(--color-text-muted)" }}>
              صفحة{" "}
              <strong style={{ color: "var(--color-text-primary)" }}>
                {page}
              </strong>{" "}
              من{" "}
              <strong style={{ color: "var(--color-text-primary)" }}>
                {pages}
              </strong>
            </span>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              {[
                {
                  label: "السابق",
                  action: () => setPage((p) => Math.max(1, p - 1)),
                  disabled: page === 1,
                },
                {
                  label: "التالي",
                  action: () => setPage((p) => Math.min(pages, p + 1)),
                  disabled: page === pages,
                },
              ].map((btn) => (
                <button
                  key={btn.label}
                  onClick={btn.action}
                  disabled={btn.disabled}
                  style={{
                    borderRadius: "var(--radius-lg)",
                    border: "1px solid var(--color-border)",
                    background: "var(--color-surface-muted)",
                    padding: "0.375rem 0.875rem",
                    fontSize: 12,
                    color: "var(--color-text-secondary)",
                    cursor: btn.disabled ? "not-allowed" : "pointer",
                    opacity: btn.disabled ? 0.4 : 1,
                    fontFamily: "var(--font-sans)",
                  }}
                >
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
