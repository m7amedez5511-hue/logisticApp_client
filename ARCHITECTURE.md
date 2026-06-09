# Slash.sa Logistics Frontend — Architecture Refactor

## 1. Current Issues Analysis

### 1.1 File Structure Problems
| Issue | Location | Impact |
|---|---|---|
| Components mixed into `src/Components/` with PascalCase subdirectories, but `app/components/` also exists | Both directories | Confusing, inconsistent import paths |
| Empty component files (`admen.tsx`, `driver.tsx`, `tripe.tsx`, etc.) | `src/Components/` | Dead weight, misleading tree |
| API logic scattered (`src/lib/api.ts`, direct `fetch()` calls in components) | Multiple files | Hard to mock/test, duplicated base URL logic |
| No barrel (`index.ts`) exports anywhere | All directories | Verbose imports everywhere |
| `helperFun.ts` mixes session management, formatting utilities, and order-status config | `src/utils/` | Violates single-responsibility principle |
| Proxy route handler in `app/api/proxy/` but also `NEXT_PUBLIC_API_BASE_URL` pointing to the same origin | Both | Redundant, confusing config |

### 1.2 Design Inconsistencies
| Issue | Example |
|---|---|
| Dark `slate-950` dashboard theme vs. light `slate-50` login/register theme — no shared token layer | `app/login/page.tsx` vs `app/dashboard/page.tsx` |
| Three different spinner implementations (inline SVG in `spinner.tsx`, div spinner in `NewOrder/page.tsx`, none elsewhere) | Multiple files |
| `Plus Jakarta Sans` loaded via `@import` in `globals.css` but Geist fonts loaded via `next/font` in `layout.tsx` — double font loading | `app/layout.tsx`, `app/globals.css` |
| Tailwind v4 used (`@import "tailwindcss"`) but `tailwind.config.js` targets v3 API | Config mismatch |
| RTL direction set per-page inconsistently (`dir="rtl"` on `<main>` or `<div>`) | All pages |
| No shared color CSS variables consumed by Tailwind — raw hex strings in JSX | Throughout |

### 1.3 API / State Issues
| Issue | Location |
|---|---|
| `API_BASE` read from `process.env.NEXT_PUBLIC_API_BASE_URL!` with `!` assertion and a `console.log` | `client.tsx`, `order.tsx`, `clientAdress.tsx` |
| Auth token cookie set manually with string concatenation | `src/lib/auth.ts` |
| No centralised error-boundary or query-state helper | Everywhere |
| `requestJson` retries 3× with exponential back-off but components also retry inline | `api.ts` + components |

---

## 2. Proposed Folder Structure

```
/
├── app/
│   ├── (admin)/                       # Route group — requires auth + admin role
│   │   ├── dashboard/page.tsx
│   │   ├── users/page.tsx
│   │   ├── cars/page.tsx
│   │   ├── drivers/page.tsx
│   │   ├── clients/page.tsx
│   │   ├── orders/page.tsx
│   │   ├── trips/page.tsx
│   │   ├── branches/page.tsx
│   │   ├── roles/page.tsx
│   │   ├── audit/page.tsx
│   │   └── layout.tsx                 # DashboardLayout (Sidebar + Topbar)
│   │
│   ├── (client)/                      # Route group — public client portal
│   │   ├── NewOrder/page.tsx
│   │   ├── client/page.tsx
│   │   └── register/page.tsx
│   │
│   ├── (auth)/                        # Route group — unauthenticated
│   │   ├── login/page.tsx
│   │   └── forgot-password/page.tsx
│   │
│   ├── forbidden/page.tsx
│   ├── api/
│   │   └── proxy/[...path]/route.ts
│   ├── globals.css
│   └── layout.tsx                     # Root layout (fonts, metadata)
│
├── components/                        # Shared UI primitives
│   ├── ui/
│   │   ├── Spinner.tsx                ✅ Single canonical spinner
│   │   ├── Alert.tsx                  ✅ Typed alert banner
│   │   ├── Button.tsx                 ✅ PrimaryBtn + variants
│   │   ├── Input.tsx                  ✅ Labelled input with error
│   │   └── index.ts                   barrel
│   │
│   ├── layout/
│   │   ├── Sidebar.tsx
│   │   ├── Topbar.tsx
│   │   ├── Navbar.tsx
│   │   └── index.ts
│   │
│   ├── auth/
│   │   └── LoginForm.tsx
│   │
│   ├── client/
│   │   ├── RegisterStep.tsx
│   │   ├── AddressStep.tsx
│   │   └── OrderDashboard.tsx         (was DashboardStep)
│   │
│   └── dashboard/
│       ├── SummaryCard.tsx
│       ├── ActiveTripCard.tsx
│       └── AlertsCard.tsx
│
├── services/                          # All network calls — no UI imports
│   ├── api.ts                         base requestJson helper
│   ├── auth.service.ts                loginUser, logout helpers
│   ├── dashboard.service.ts           getDashboardSummary
│   ├── client.service.ts              getClientOrders, postClientAddress …
│   └── index.ts                       barrel
│
├── lib/                               # Non-UI utilities
│   ├── auth.ts                        token storage, cookie helpers
│   ├── session.ts                     (extracted from helperFun.ts)
│   ├── formatters.ts                  fmtDate, fmtAmount
│   ├── order-status.ts                statusColor, statusLabel, OrderStatus type
│   └── index.ts
│
├── hooks/                             # Custom React hooks
│   ├── useAuth.ts
│   ├── useDashboardSummary.ts
│   └── useClientOrders.ts
│
├── styles/
│   └── tokens.css                     CSS custom properties (design tokens)
│
├── types/
│   ├── auth.ts
│   ├── dashboard.ts
│   └── client.ts
│
└── public/
```

---

## 3. Design System

### 3.1 Color Tokens (`styles/tokens.css`)

```css
/* ── Brand ─────────────────────────────── */
--color-brand-600:   #1A73E8;
--color-brand-700:   #1557B0;
--color-brand-50:    #EBF3FF;

/* ── Semantic ───────────────────────────── */
--color-success:     #34A853;
--color-warning:     #F59E0B;
--color-danger:      #E53935;
--color-info:        #1A73E8;

/* ── Surface (light) ────────────────────── */
--color-surface:       #FFFFFF;
--color-surface-muted: #F9FAFB;
--color-border:        #E5E7EB;

/* ── Surface (dark — admin dashboard) ───── */
--color-surface-dark:       #0F172A;   /* slate-950 */
--color-surface-dark-card:  #1E293B;   /* slate-800 */
--color-border-dark:        rgba(255,255,255,0.1);

/* ── Text ───────────────────────────────── */
--color-text-primary:  #111827;
--color-text-muted:    #6B7280;
--color-text-hint:     #9CA3AF;
--color-text-inverse:  #FFFFFF;

/* ── Font ───────────────────────────────── */
--font-sans: 'Plus Jakarta Sans', sans-serif;
--font-mono: 'IBM Plex Mono', monospace;

/* ── Radius ─────────────────────────────── */
--radius-sm:   7px;
--radius-md:   10px;
--radius-lg:   14px;
--radius-xl:   20px;
--radius-full: 9999px;

/* ── Sidebar width ──────────────────────── */
--sidebar-width: 280px;
```

These are imported once in `app/globals.css` and referenced via Tailwind's `theme.extend` for utility access.

### 3.2 Typography

| Role | Font | Weight | Size |
|---|---|---|---|
| Page heading | Plus Jakarta Sans | 700 | 28–38px |
| Section title | Plus Jakarta Sans | 600 | 18–22px |
| Body | Plus Jakarta Sans | 400 | 13–14px |
| Label/caps | Plus Jakarta Sans | 700 | 10–11px |
| Code/mono | IBM Plex Mono | 400/500 | 12–13px |

Load **once** via `next/font/google` in `app/layout.tsx`. Remove `@import url(...)` from `globals.css`.

---

## 4. Key Component Implementations

### 4.1 Canonical Spinner (`components/ui/Spinner.tsx`)

```tsx
import { cn } from "@/lib/utils";

interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizes = { sm: "h-4 w-4", md: "h-6 w-6", lg: "h-10 w-10" };

export function Spinner({ size = "md", className }: SpinnerProps) {
  return (
    <svg
      role="status"
      aria-label="Loading"
      className={cn("animate-spin text-[var(--color-brand-600)]", sizes[size], className)}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12" cy="12" r="10"
        stroke="currentColor" strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v8H4z"
      />
    </svg>
  );
}
```

**Usage:** `<Spinner />`, `<Spinner size="lg" />`, `<Spinner size="sm" className="text-white" />`

### 4.2 Alert (`components/ui/Alert.tsx`)

```tsx
interface AlertProps {
  type?: "error" | "info" | "success" | "warning";
  message: string;
  onClose?: () => void;
}

const config = {
  error:   { bg: "bg-red-50 border-red-200 text-red-700",     icon: "⚠" },
  info:    { bg: "bg-blue-50 border-blue-200 text-blue-700",  icon: "ℹ" },
  success: { bg: "bg-emerald-50 border-emerald-200 text-emerald-700", icon: "✓" },
  warning: { bg: "bg-amber-50 border-amber-200 text-amber-700", icon: "!" },
};

export function Alert({ type = "error", message, onClose }: AlertProps) {
  const { bg, icon } = config[type];
  return (
    <div role="alert" aria-live="polite"
      className={`flex items-start gap-2 border rounded-lg px-3 py-2.5 text-[12px] font-medium ${bg}`}
    >
      <span aria-hidden="true">{icon}</span>
      <span className="flex-1">{message}</span>
      {onClose && (
        <button
          onClick={onClose}
          aria-label="Dismiss alert"
          className="opacity-60 hover:opacity-100 text-[14px] leading-none"
        >×</button>
      )}
    </div>
  );
}
```

### 4.3 Button (`components/ui/Button.tsx`)

```tsx
import { Spinner } from "./Spinner";
import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
}

const variants = {
  primary:   "bg-[var(--color-brand-600)] hover:bg-[var(--color-brand-700)] text-white shadow-sm",
  secondary: "bg-white border border-[var(--color-border)] text-[var(--color-text-primary)] hover:bg-[var(--color-surface-muted)]",
  ghost:     "text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)]",
  danger:    "bg-red-600 hover:bg-red-700 text-white",
};

const sizes = {
  sm: "h-8 px-3 text-[12px]",
  md: "h-10 px-4 text-[13px]",
  lg: "h-11 px-6 text-[14px]",
};

export function Button({ loading, variant = "primary", size = "md", children, className, disabled, ...rest }: ButtonProps) {
  return (
    <button
      disabled={loading || disabled}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-[var(--radius-md)] font-semibold",
        "transition-all active:scale-[.98] disabled:opacity-60 disabled:cursor-not-allowed",
        variants[variant], sizes[size], className
      )}
      {...rest}
    >
      {loading && <Spinner size="sm" className="text-current" />}
      {children}
    </button>
  );
}
```

### 4.4 Input (`components/ui/Input.tsx`)

```tsx
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
}

export function Input({ label, error, hint, id, className, ...rest }: InputProps) {
  const inputId = id ?? label.toLowerCase().replace(/\s+/g, "-");
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={inputId} className="text-[12px] font-semibold text-[var(--color-text-primary)]">
        {label}
      </label>
      <input
        id={inputId}
        aria-invalid={!!error}
        aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
        className={`
          w-full h-10 px-3 border rounded-[var(--radius-md)] text-[13px]
          text-[var(--color-text-primary)] placeholder-[var(--color-text-hint)]
          outline-none transition
          focus:border-[var(--color-brand-600)] focus:ring-2 focus:ring-[var(--color-brand-600)]/15
          ${error ? "border-red-400 bg-red-50" : "border-[var(--color-border)] bg-white"}
          ${className ?? ""}
        `}
        {...rest}
      />
      {error && (
        <p id={`${inputId}-error`} role="alert" className="text-[11px] text-red-500 font-medium">
          {error}
        </p>
      )}
      {hint && !error && (
        <p id={`${inputId}-hint`} className="text-[11px] text-[var(--color-text-hint)]">
          {hint}
        </p>
      )}
    </div>
  );
}
```

---

## 5. Services Layer

### 5.1 `services/api.ts` (base)

```ts
// Single source of truth for all HTTP calls.
// Never import React or UI code here.

const API_BASE =
  typeof window === "undefined"
    ? process.env.INTERNAL_API_BASE_URL ?? ""
    : "/api/proxy";

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

export async function request<T>(
  path: string,
  init: RequestInit = {},
  token?: string | null,
): Promise<T> {
  const headers = new Headers(init.headers);
  if (!headers.has("Content-Type") && !(init.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(`${API_BASE}/${path.replace(/^\//, "")}`, {
    ...init,
    headers,
    cache: "no-store",
  });

  if (!res.ok) {
    const json = await res.json().catch(() => null);
    throw new ApiError(res.status, json?.message ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}
```

### 5.2 `services/dashboard.service.ts`

```ts
import { request } from "./api";
import type { DashboardSummary } from "@/types/dashboard";

export const dashboardService = {
  getSummary: (token: string) =>
    request<{ success: boolean; data: DashboardSummary }>("dashboard/summary", {}, token),
};
```

### 5.3 `services/auth.service.ts`

```ts
import { request } from "./api";
import type { LoginResponse } from "@/types/auth";

export const authService = {
  login: (identity: string, password: string) =>
    request<LoginResponse>("auth/login", {
      method: "POST",
      body: JSON.stringify({ identity, password }),
    }),
};
```

---

## 6. Custom Hooks

### `hooks/useDashboardSummary.ts`

```ts
"use client";
import { useEffect, useState } from "react";
import { dashboardService } from "@/services/dashboard.service";
import { getStoredToken } from "@/lib/auth";
import type { DashboardSummary } from "@/types/dashboard";

export function useDashboardSummary() {
  const [data,    setData]    = useState<DashboardSummary | null>(null);
  const [error,   setError]   = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) { setLoading(false); return; }
    dashboardService.getSummary(token)
      .then(r => setData(r.data))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return { data, error, loading };
}
```

---

## 7. Accessibility Checklist

| Area | Implementation |
|---|---|
| **Focus management** | All interactive elements reachable via Tab; custom components include `focus:ring-2` |
| **ARIA roles** | `role="alert"` on `<Alert>`, `role="status"` + `aria-label="Loading"` on `<Spinner>` |
| **Form labels** | `<Input>` always renders a `<label htmlFor>` pair; `aria-invalid` set on error |
| **Error descriptions** | `aria-describedby` connects input to its error paragraph |
| **Color contrast** | Brand blue `#1A73E8` on white = 4.6:1 (AA); white on brand blue = same |
| **Motion** | Spinner uses `prefers-reduced-motion` via `@media (prefers-reduced-motion: reduce) { .animate-spin { animation: none } }` in globals |
| **RTL support** | `dir` attribute set once on `<html>` or per route-group layout, not per element |
| **Semantic HTML** | `<nav>`, `<main>`, `<aside>`, `<article>`, `<header>`, `<footer>` used consistently |
| **Button states** | `disabled` prop correctly prevents interaction; `aria-busy` added when `loading` |

---

## 8. Migration Steps (Priority Order)

1. **Create `styles/tokens.css`** — define all CSS vars; import in `globals.css`.
2. **Create `components/ui/`** — move and refactor `Spinner`, `Alert`, `Button`, `Input`.
3. **Create `services/`** — extract all `fetch` calls from components.
4. **Split `src/utils/helperFun.ts`** → `lib/session.ts`, `lib/formatters.ts`, `lib/order-status.ts`.
5. **Create `hooks/`** — one hook per data concern.
6. **Move pages into route groups** — `(admin)`, `(client)`, `(auth)`.
7. **Replace inline font `@import`** with `next/font/google` only in `layout.tsx`.
8. **Delete empty component files** (`admen.tsx`, `driver.tsx`, `tripe.tsx`, etc.).
9. **Add barrel `index.ts`** to each directory.
10. **Update `tailwind.config.js`** to v4 pattern or remove in favour of CSS-only config.

---

## 9. Rationale Summary

- **Route groups** keep auth guards co-located with the pages they protect, reducing the chance of forgetting a guard when adding a new page.
- **Services layer** with no React imports enables unit testing without a DOM, and makes swapping the HTTP client (e.g. to Axios or a generated SDK) a one-file change.
- **CSS custom properties** as the design token layer means the same values are available in both Tailwind utilities and plain CSS without duplication.
- **Single Spinner** eliminates the three current implementations and ensures `aria-label="Loading"` is always present.
- **`lib/` vs `services/`** split: `lib/` holds pure functions and storage helpers (no network); `services/` holds network calls. This boundary makes each testable in isolation.