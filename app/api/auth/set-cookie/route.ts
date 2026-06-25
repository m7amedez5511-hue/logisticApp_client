

import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const token: unknown = body?.token;

  if (typeof token !== "string" || !token) {
    return NextResponse.json({ error: "Invalid token" }, { status: 400 });
  }

  const isProduction = process.env.NODE_ENV === "production";

  // Build the Set-Cookie header manually so we have full control over flags.
  // - HttpOnly: JavaScript cannot read this cookie.
  // - Secure:   Only sent over HTTPS (omitted in development for localhost).
  // - SameSite=Strict: Not sent on cross-site requests, mitigating CSRF.
  // - Path=/:   Available for all routes (needed for the middleware to read it).
  const cookieParts = [
    `auth_token=${encodeURIComponent(token)}`,
    "HttpOnly",
    isProduction ? "Secure" : "", // Omit Secure on localhost (no HTTPS)
    "SameSite=Strict",
    "Path=/",
    "Max-Age=604800", // 7 days in seconds
  ].filter(Boolean);

  const response = NextResponse.json({ ok: true });
  response.headers.set("Set-Cookie", cookieParts.join("; "));
  return response;
}