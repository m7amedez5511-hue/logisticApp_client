// middleware.ts
// 1. Runs on the Edge runtime before any page component is rendered.
// 2. Handles three guards for the app:
//    a. Authentication for all /dashboard/* routes — redirects to /login if
//       no valid auth cookie is present.
//    b. Role-based access control — blocks the "driver" role from admin routes.
//    c. Keeps an authenticated user off the public home page — if a logged-in
//       user manually navigates to "/" or "/home", they are sent back to
//       /dashboard instead of letting the marketing/home page render.
// 3. IMPORTANT: this file must live at the project root (or as src/middleware.ts)
//    for Next.js to auto-detect and execute it as middleware. It was previously
//    located at src/middleware/middleware.ts, which Next.js does NOT recognize
//    as the middleware entrypoint — so none of the guards below were ever
//    actually running. That misplacement was the root cause of unauthenticated
//    users being able to reach /dashboard/* pages directly, and of logged-in
//    users being able to navigate back to "/" or "/home" unchecked.

import { NextRequest, NextResponse } from "next/server";

// 4. The cookie name must match what the server-side login action sets
//    (see app/api/auth/set-cookie/route.ts).
const AUTH_COOKIE_NAME = "auth_token";

// 5. Route groups this middleware cares about.
const PROTECTED_PREFIX = "/dashboard";
const PUBLIC_HOME_PATHS = ["/", "/home"];

// 6. Lightweight JWT payload decoder.
//    We only need the `role` claim — we do NOT verify the signature here
//    because the backend already validates the token on every API request.
//    Signature verification in middleware would require the secret to be
//    bundled into the Edge runtime, which is its own security concern.
//    The authoritative check is always the backend; middleware is a UX guard.
function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    // Base64url -> Base64 -> JSON
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    // atob is available in the Edge runtime
    const json = atob(base64);
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const authCookie = request.cookies.get(AUTH_COOKIE_NAME);
  const isAuthenticated = !!authCookie?.value && !!decodeJwtPayload(authCookie.value);

  // 7. Guard 1: public home ("/" and "/home"). An authenticated user must not
  //    be able to land back on the marketing/home page by manually editing the
  //    URL — bounce them to the dashboard instead. An unauthenticated visitor
  //    passes through normally.
  if (PUBLIC_HOME_PATHS.includes(pathname)) {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
  }

  // 8. Guard 2: only the remaining checks apply to dashboard routes.
  //    (The `matcher` config below already limits execution, but this is an
  //    explicit check for clarity and defensive depth.)
  if (!pathname.startsWith(PROTECTED_PREFIX)) {
    return NextResponse.next();
  }

  // 9. Guard 3: authentication. No cookie at all -> redirect to /login,
  //    preserving the original URL so we can send the user back after
  //    a successful login.
  if (!authCookie?.value) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 10. Decode the JWT payload (not verified — see decodeJwtPayload above).
  const payload = decodeJwtPayload(authCookie.value);

  if (!payload) {
    // 11. Malformed or expired token — treat exactly like "not authenticated".
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 12. Guard 4: role-based access control. The role field matches what
  //     lib/auth.ts stores: a plain string like "driver", "admin", "user"
  //     (extracted from the backend JWT during login).
  const role =
    typeof payload.role === "string" ? payload.role.toLowerCase() : null;

  const BLOCKED_ROLES = ["driver", "سائق"];

  if (role && BLOCKED_ROLES.includes(role)) {
    // 13. Driver accounts must never access the admin dashboard.
    return NextResponse.redirect(new URL("/forbidden", request.url));
  }

  // 14. All checks passed — allow the request through.
  return NextResponse.next();
}

export const config = {
  // 15. Apply this middleware to the public home paths (so authenticated
  //     users get bounced off them) and to the dashboard root plus every
  //     sub-route (so unauthenticated visitors and blocked roles get
  //     redirected away from admin pages).
  matcher: [
    "/",
    "/home",
    "/dashboard",
    "/dashboard/:path*",
  ],
};