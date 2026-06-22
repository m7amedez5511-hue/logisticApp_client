// middleware.ts
// Runs on the Edge runtime before any page component is rendered.
// Handles two guards for all /dashboard/* routes (and their sub-routes):
//   1. Authentication — redirects to /login if no auth cookie is present.
//   2. Role-based access control — blocks the "driver" role from admin routes.

import { NextRequest, NextResponse } from "next/server";

// The cookie name must match what the server-side login action sets.
// Previously lib/auth.ts wrote this as a JS-accessible cookie — after the
// auth.ts refactor (Issue 3) this same name is now an HttpOnly cookie.
const AUTH_COOKIE_NAME = "auth_token";

// Routes that require authentication (and block the driver role).
// The matcher below handles the routing; this constant is for documentation.
const PROTECTED_PREFIX = "/dashboard";

/**
 * Lightweight JWT payload decoder.
 * We only need the `role` claim — we do NOT verify the signature here
 * because the backend already validates the token on every API request.
 * Signature verification in middleware would require the secret to be
 * bundled into the Edge runtime, which is its own security concern.
 * The authoritative check is always the backend; middleware is a UX guard.
 */
function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    // Base64url → Base64 → JSON
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

  // ── Guard: only apply to protected routes ─────────────────────────────────
  // (The `matcher` config below already limits execution, but this is an
  //  explicit check for clarity and defensive depth.)
  if (!pathname.startsWith(PROTECTED_PREFIX)) {
    return NextResponse.next();
  }

  // ── Check 1: Authentication ────────────────────────────────────────────────
  // Read the HttpOnly auth cookie set by the server after login.
  const authCookie = request.cookies.get(AUTH_COOKIE_NAME);

  if (!authCookie?.value) {
    // No token → send to login, preserving the original URL so we can
    // redirect back after successful login if needed.
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // ── Check 2: Role-based access control ────────────────────────────────────
  // Decode the JWT payload (not verified — see note on decodeJwtPayload above).
  const payload = decodeJwtPayload(authCookie.value);

  if (!payload) {
    // Malformed token — treat as unauthenticated.
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  // The role field matches what lib/auth.ts stores: a plain string like
  // "driver", "admin", "user" (extracted from the backend JWT during login).
  const role =
    typeof payload.role === "string"
      ? payload.role.toLowerCase()
      : null;

  const BLOCKED_ROLES = ["driver", "سائق"];

  if (role && BLOCKED_ROLES.includes(role)) {
    // Driver accounts must never access the admin dashboard.
    return NextResponse.redirect(new URL("/forbidden", request.url));
  }

  // ── All checks passed — allow the request through ─────────────────────────
  return NextResponse.next();
}

export const config = {
  // Apply this middleware to the dashboard root and all sub-routes.
  // Explicitly list the known sub-routes so the matcher is predictable;
  // any new top-level pages added under /dashboard are automatically covered
  // by the "/dashboard/:path*" pattern.
  matcher: [
    "/dashboard",
    "/dashboard/:path*",
    "/users",
    "/users/:path*",
    "/cars",
    "/cars/:path*",
    "/orders",
    "/orders/:path*",
    "/clients",
    "/clients/:path*",
    "/drivers",
    "/drivers/:path*",
    "/roles",
    "/roles/:path*",
    "/audit",
    "/audit/:path*",
    "/trips",
    "/trips/:path*",
    "/branches",
    "/branches/:path*",
  ],
};