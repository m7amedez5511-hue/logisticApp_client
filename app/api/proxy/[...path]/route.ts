import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const BACKEND_BASE_URL = "https://logiapi.slash.sa/api/v1";

async function proxy(
  request: NextRequest,
  params: { path: string[] },
): Promise<NextResponse> {
  const path = params.path?.join("/") ?? "";
  const targetUrl = `${BACKEND_BASE_URL}/${path}${request.nextUrl.search}`;

  // Read the HttpOnly cookie server-side — this is the ONLY place the raw
  // token value is accessible after the Issue 3 refactor.
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  const headers = new Headers();

  // Forward all safe request headers.
  request.headers.forEach((value, key) => {
    if (key === "host" || key === "content-length" || key === "cookie") return;
    headers.set(key, value);
  });

  // Inject the Authorization header using the server-side cookie value.
  // The client never had access to this token value.
  if (token) {
    headers.set("Authorization", `Bearer ${decodeURIComponent(token)}`);
  }

  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const isBodyless = request.method === "GET" || request.method === "HEAD";
  const body = isBodyless ? undefined : await request.text();

  const upstream = await fetch(targetUrl, {
    method: request.method,
    headers,
    body,
    cache: "no-store",
  });

  const contentType =
    upstream.headers.get("content-type") || "application/json";

  // Responses with these statuses MUST NOT carry a body (per the Fetch/HTTP
  // spec). Constructing a NextResponse with a body alongside one of these
  // statuses throws at runtime, which Next.js then surfaces as a 500 to the
  // client — even though the upstream call itself succeeded. This is exactly
  // what happens on DELETE endpoints that correctly return 204 No Content.
  const isNoBodyStatus = [204, 205, 304].includes(upstream.status);

  if (isNoBodyStatus) {
    // Drain the upstream body (should be empty anyway) without parsing it.
    await upstream.text().catch(() => null);
    return new NextResponse(null, {
      status: upstream.status,
      headers: { "cache-control": "no-store" },
    });
  }

  const responseBody = contentType.includes("application/json")
    ? await upstream.json().catch(() => null)
    : await upstream.text();

  return new NextResponse(
    typeof responseBody === "string"
      ? responseBody
      : JSON.stringify(responseBody),
    {
      status: upstream.status,
      headers: {
        "content-type": contentType,
        "cache-control": "no-store",
      },
    },
  );
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  return proxy(request, await params);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  return proxy(request, await params);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  return proxy(request, await params);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  return proxy(request, await params);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  return proxy(request, await params);
}