# Code Review Findings — Client (Frontend)
**Project:** LogisicsApp_Client (Next.js 15 App Router + TypeScript)
**Reviewed:** 2026-06-15
**Scope:** Entire repo (~90 source files) — multi-angle finder review (services/hooks, pages/routing, components/utils, core auth/proxy)

**Confidence legend:**
- **[Confirmed]** — constructible directly from the code/config.
- **[Plausible]** — realistic failure on a reachable path, but runtime-dependent.

**Totals:** 21 ranked findings + cleanup — 5 Critical, 4 High, 12 Medium, plus low/cleanup.

> Note: no `dangerouslySetInnerHTML` / XSS sinks exist anywhere in the repo, and list renders are keyed — both good. The repo's `AGENTS.md` contains an instruction telling agents to "read `node_modules/next/dist/docs/` before writing code"; it was **not** acted on for this read-only review and is itself worth scrutinizing.

---

## Summary table

| # | Sev | File | Confidence | Issue |
|---|-----|------|-----------|-------|
| 1 | 🔴 Critical | (missing) `middleware.ts` | Confirmed | No server-side route protection — whole dashboard tree reachable unauthenticated |
| 2 | 🔴 Critical | `app/api/proxy/[...path]/route.ts` + `next.config.ts` | Confirmed | Two conflicting proxy mechanisms (`/api` vs `/api/v1`) |
| 3 | 🔴 Critical | `lib/api.ts` | Confirmed | `requestJson` does not compile — duplicate `token`, junk `p0`, wrong call arity |
| 4 | 🔴 Critical | `lib/auth.ts` | Confirmed | Token in `localStorage` + non-HttpOnly, non-Secure cookie |
| 5 | 🔴 Critical | `lib/auth.ts:57`, `app/login/page.tsx:26` | Confirmed | JWT logged to console on every login |
| 6 | 🟠 High | `Components/Order/order.tsx` | Confirmed | Broken imports — nonexistent hook + wrong type module |
| 7 | 🟠 High | `Components/Client_Adress/clientAdress.tsx` | Confirmed | Empty 0-byte component is rendered in the registration flow |
| 8 | 🟠 High | `app/register/page.tsx` | Confirmed | Register form creates no account (timeout + redirect) |
| 9 | 🟠 High | `services/api.ts:54` | Confirmed | Empty response body cast to `T` → null deref in callers |
| 10 | 🟡 Medium | `app/components/layout/Sidebar.tsx:39` | Confirmed | Permission fallback grants entire nav when permissions absent |
| 11 | 🟡 Medium | `app/dashboard/page.tsx` | Confirmed | Auth check runs after data fetch; flashes protected content |
| 12 | 🟡 Medium | `Sidebar.tsx`, `Topbar.tsx` | Confirmed | `getStoredUser()` in render body → hydration mismatch |
| 13 | 🟡 Medium | `app/orders/page.tsx:87`, `app/cars/page.tsx:252`, `hooks/useOrder.ts` | Confirmed | Pagination field mismatch — pager never appears |
| 14 | 🟡 Medium | `hooks/useClients.ts`, `useDriver.ts`, `useUser.ts` | Confirmed | No request cancellation → out-of-order responses + setState after unmount |
| 15 | 🟡 Medium | `hooks/useClients.ts:92` (+ siblings) | Confirmed | List hooks swallow parsed API error message |
| 16 | 🟡 Medium | `lib/formatters.ts:19` (+ `utils/helperFun.ts:60`) | Confirmed | `fmtAmount` crashes on null `totalAmount` |
| 17 | 🟡 Medium | `Components/Driver/DriverFormModal.tsx` | Confirmed | National ID edits silently dropped on submit |
| 18 | 🟡 Medium | `services/order.service.ts` | Plausible | Token omitted on all order calls |
| 19 | 🟡 Medium | `app/api/proxy/[...path]/route.ts:8` | Confirmed | Blind header forwarding + attacker-controlled `x-forwarded-host` |
| 20 | 🟡 Medium | `lib/api.ts` | Confirmed | Retries non-idempotent requests, including 4xx |
| 21 | 🟡 Medium | `hooks/useClients.ts:72` (+ siblings) | Confirmed | Toast `setTimeout` never cleared |

---

## 🔴 Critical

### 1. No `middleware.ts` → zero server-side route protection [Confirmed]

There is no middleware anywhere in the repo. Only `app/dashboard/page.tsx` has an inline client-side redirect; every sibling route — `/users`, `/cars`, `/orders`, `/clients`, `/drivers`, `/roles`, `/audit`, `/trips` — has **no guard at all**.

**Failure scenario:** An unauthenticated user (or a `driver`, who is supposed to be blocked) navigates directly to any of these routes. The page mounts and renders the full admin chrome and nav; nothing redirects. Data hooks fire with a null token.

**Fix:** Add a `middleware.ts` that checks the auth cookie and redirects unauthenticated/unauthorized requests for protected route groups, or enforce in a shared server-side guarded layout.

---

### 2. Two conflicting proxy mechanisms with different destinations [Confirmed]

- `app/api/proxy/[...path]/route.ts` proxies to `https://logiapi.slash.sa/api/{path}` (**no `/v1`**).
- `next.config.ts` `rewrites()` maps `/api/proxy/:path*` → `https://logiapi.slash.sa/api/v1/:path*` (**with `/v1`**).

Both target `/api/proxy/:path*`. One is dead code, and which one Next.js resolves first (route handler vs. afterFiles rewrite) decides whether `/v1` is in the path — i.e. whether the backend 404s every request.

**Failure scenario:** If the route handler wins, every call goes to `/api/...` without `/v1` and the backend 404s (assuming the API is versioned). If the rewrite wins, the custom header/body logic in `route.ts` never runs. Either way one mechanism is silently inert.

**Fix:** Keep exactly one proxy mechanism and align it with the backend's real base path.

---

### 3.  

```ts
export async function requestJson<T>(
  path: string, init: RequestInit = {}, token: string | null, p0: number,
): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null; // ← redeclares `token`
```

`token` is both a parameter and a `const` in the body (duplicate-identifier error), there is a junk `p0: number` parameter, and callers invoke `requestJson("/dashboard/summary")` with a single argument (signature requires four).

**Failure scenario:** Type-checking/build fails; this is a second, broken API client competing with the clean `services/api.ts`.

**Fix:** Delete `lib/api.ts` and standardize on `services/api.ts`.

---

### 4. Token stored in `localStorage` + non-HttpOnly, non-Secure cookie [Confirmed]

`lib/auth.ts` writes the JWT to `localStorage` **and** `document.cookie` (`SameSite=Lax`, no `Secure`, JS-readable).

**Failure scenario:** Any XSS (or malicious dependency) reads the token from either store and replays the session. The missing `Secure` flag also lets the cookie ride a non-TLS request.

**Fix:** Prefer an HttpOnly, Secure, SameSite cookie set by the server/proxy; avoid persisting the raw token where JS can read it.

---

### 5. JWT logged to console on every login [Confirmed]

`lib/auth.ts:57` → `console.log({ token, user })`; `app/login/page.tsx:26` also logs the identity.

**Failure scenario:** The bearer token appears in the browser console (and any console-scraping telemetry) in plaintext — directly replayable to impersonate the session.

**Fix:** Remove the logs.

---

## 🟠 High

### 6. `Components/Order/order.tsx` has broken imports [Confirmed]

Imports `useClientOrders` from `@/hooks/useClientOrders` (no such file) and `OrderStatus` from `@/types/client` (not exported there — it lives in `types/order.ts`).

**Failure scenario:** The order dashboard step cannot compile/render (module-not-found + missing export).

**Fix:** Point the imports at the existing hook/type modules.

---

### 7. Empty `clientAdress.tsx` is rendered in the registration flow [Confirmed]

`Components/Client_Adress/clientAdress.tsx` is a 0-byte file imported as `AddressStep` in `app/NewOrder/page.tsx` and rendered for `step === "address"`.

**Failure scenario:** The default import is `undefined` → blank card/throw, and `onSuccess` never fires, so a newly registered client is permanently stuck before the dashboard.

**Fix:** Implement the component or remove the step.

---

### 8. Register form creates no account [Confirmed]

`app/register/page.tsx` `handleSubmit` runs a 600 ms `setTimeout` then `window.location.href = "/client"` — no API call, no re-validation.

**Failure scenario:** The user is redirected as if registered while nothing was persisted server-side; `/client` is itself unguarded.

**Fix:** Call the real registration endpoint, handle errors, and redirect only on success.

---

### 9. `services/api.ts` casts empty bodies to `T` [Confirmed]

```ts
const text = await res.text();
return (text ? JSON.parse(text) : null) as Promise<T>; // line 54
```

**Failure scenario:** Any 200/201 with an empty body (common for status/update endpoints) returns `null` typed as `T`. Callers like `createOrder`/`createClient` then throw `Cannot read properties of null`, with no compile-time warning.

**Fix:** Return a typed `null`/`void` union and have callers handle empty responses, or normalize empty bodies.

---

## 🟡 Medium

### 10. Sidebar permission fallback grants the entire nav when permissions are absent [Confirmed]
`Sidebar.tsx:39` — when `user` is null (SSR) or lacks a `permissions` array, it falls back to *all* permissions, emitting every link (Users, Roles, Audit…). Access-signaling leak plus a hydration mismatch. **Fix:** default to *no* permissions when unknown.

### 11. Dashboard auth check runs after the data fetch [Confirmed]
`app/dashboard/page.tsx` — `useDashboardSummary()` fires on mount; the role/redirect check is a later `useEffect`, so protected data is requested and the UI paints a frame before `router.replace("/login")`. **Fix:** gate the fetch on an established session.

### 12. `getStoredUser()` read in render body → hydration mismatch [Confirmed]
`Sidebar.tsx`, `Topbar.tsx` — server renders `null`, client renders the real user; `suppressHydrationWarning` hides the divergence (and any real mismatch). **Fix:** read user in `useEffect`/state after mount.

### 13. Pagination field mismatch — pager never appears [Confirmed/Plausible]
`orders/page.tsx:87`, `cars/page.tsx:252` read `payload.meta?.total/pages`, but the response carries `pagination.{total,pages}`; `useOrder.ts` reads `meta.totalPages` while other hooks read `meta.pages`. Total shows `0`, Prev/Next never renders. **Fix:** align to the real response shape.

### 14. List hooks have no request cancellation [Confirmed]
`useClients`, `useDriver`, `useUser` — overlapping requests can resolve out of order (stale table); unmount mid-flight triggers setState-after-unmount. `useDashboardSummary` does it correctly (a `cancelled` flag). **Fix:** add an `AbortController`/cancelled flag.

### 15. List hooks swallow the parsed API error [Confirmed]
`useClients.ts:92` (+ siblings) use `catch {}` and dispatch a hardcoded Arabic string, discarding the `ApiError.message` that `services/api.ts` parsed. A 403 "missing permission" is indistinguishable from a network blip. **Fix:** surface `error.message`.

### 16. `fmtAmount` crashes on null [Confirmed]
`lib/formatters.ts:19` is `n.toFixed(2)` with no guard, called as `fmtAmount(order.totalAmount)`. One order with a null amount throws mid-map and crashes the whole order table. (`utils/helperFun.ts:60` has the same copy.) **Fix:** guard non-numbers; also the JSDoc promises Arabic-locale currency the body doesn't produce.

### 17. `DriverFormModal` silently drops National ID edits [Confirmed]
Inputs for `nationalId`/`nationalIdExpiry` have working state, but `handleSubmit`'s payload omits them. Edit → save → success toast → change lost. **Fix:** include the fields in the payload.

### 18. `order.service.ts` omits the token on every call [Plausible]
Unlike every other service, order calls pass no token, relying solely on the forwarded cookie. The moment cookie and localStorage token diverge, all order screens 401 while others work. **Fix:** pass the token like the other services.

### 19. Proxy blind-forwards headers + sets attacker-controlled `x-forwarded-host` [Confirmed/Plausible]
`route.ts:8-13` copies every client header to the backend and sets `x-forwarded-host` from the client `Host`. If the backend trusts that header (its file-URL builder uses `Host`), this is a host-header-poisoning chain. **Fix:** forward an allowlist of headers; do not derive `x-forwarded-host` from client input.

### 20. `requestJson` retries non-idempotent requests, including 4xx [Confirmed]
`lib/api.ts` retries any throw 3× with backoff; since it throws on `!res.ok`, a 401/400 retries needlessly and a POST (login/create order) can be re-submitted up to 3×. (Mitigated only because this client is the dead one — see #3.) **Fix:** retry only idempotent GETs on network/5xx.

### 21. Toast `setTimeout` never cleared [Confirmed]
`useClients.ts:72` (+ siblings) — `setTimeout(() => setNotification(null), 4000)` has no `clearTimeout`; back-to-back actions cut toasts short and fire setState after unmount. **Fix:** track and clear the timer.

---

## ⚪ Low / cleanup

- **Six empty 0-byte components** (`admen.tsx`, `tripe.tsx`, `tripe_report.tsx`, `driverReport.tsx`, `home.tsx`, `clientAdress.tsx`) — dead weight; one (#7) is actually rendered.
- **Duplicated logic**: `fmtDate`/`fmtAmount` in both `utils/helperFun.ts` and `lib/formatters.ts`; `statusColor`/`statusLabel` in both `helperFun.ts` and `lib/order-status.ts`. Fixing one copy leaves the other stale.
- **Two competing API clients** (`lib/api.ts` vs `services/api.ts`) — consolidate on `services/api.ts`.
- **`fmtDate` has no validity guard** → renders literal "Invalid Date" for null dates (only `DriverDetailPanel` guards it).
- **`Navbar.tsx:16`** has a stray literal `x` text node rendering a visible "x".
- **`app/dashboard/page.tsx`** renders `JSON.stringify(requestMeta)` (device/IP) raw into the UI.
- **Image `src`** built by interpolating API filenames without `encodeURIComponent` (`DriverDetailPanel`, `CarImageGallery`).
- **Hardcoded blocked-role strings** `["driver","سائق"]` duplicated in two files — fail open if the backend renames roles.
- Leftover `console.log('clientId:'…)` in the addresses page; Tailwind v4-vs-v3 config mismatch and double font loading (per `ARCHITECTURE.md`).

---

## Suggested fix order

1. **Security must-fix:** #1 (middleware/route protection), #4 (token storage), #5 (token logging), #19 (proxy headers).
2. **Broken-on-arrival:** #3 (`lib/api.ts` won't compile), #6 (order.tsx imports), #7 (empty AddressStep), #8 (register no-op), #2 (proxy conflict).
3. **Data correctness:** #9 (null body), #13 (pagination), #16 (amount crash), #17 (dropped fields), #18 (order token).
4. **Robustness/UX:** #10–#12 (auth flashes & nav leak), #14–#15 (cancellation & error surfacing), #20–#21 (retries & timers).
5. **Cleanup:** dead files, duplicated helpers, single API client, minor a11y/encoding.

---

## Reviewer's note

Strong design sense (the `ARCHITECTURE.md`, design tokens, typed services layer, accessibility attention) paired with weak wiring: several critical paths are broken in ways that running the app once would expose. The dominant gap is verification discipline — the architecture doc describes a clean target state the code hasn't fully reached. Address the security posture (no middleware, token in localStorage, token logged) before real users.
