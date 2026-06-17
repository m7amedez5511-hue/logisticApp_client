// app/api/auth/clear-cookie/route.ts
// Clears the HttpOnly auth cookie on logout.
// Only the server can delete an HttpOnly cookie.

import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ ok: true });

  // Overwrite the cookie with an empty value and a past expiry date.
  response.headers.set(
    "Set-Cookie",
    "auth_token=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0",
  );

  return response;
}