import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const BACKEND_BASE_URL = "https://logiapi.slash.sa/api/v1";

async function proxy(
  request: NextRequest,
  params: { path: string[] },
): Promise<NextResponse> {
  const path = params.path?.join("/") ?? "";
  const targetUrl = `${BACKEND_BASE_URL}/${path}${request.nextUrl.search}`;

  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  const headers = new Headers();

  request.headers.forEach((value, key) => {
    if (key === "host" || key === "content-length" || key === "cookie") return;
    headers.set(key, value);
  });

  if (token) {
    headers.set("Authorization", `Bearer ${decodeURIComponent(token)}`);
  }

  // NOTE: do NOT force a default Content-Type here when there's no body —
  // for multipart/form-data requests, the browser sets Content-Type itself
  // (including the multipart boundary). We only need a fallback for bodied
  // requests that didn't already specify one (e.g. raw JSON fetches).
  const isBodyless = request.method === "GET" || request.method === "HEAD";

  // CRITICAL FIX: read the body as raw bytes (ArrayBuffer), never as text.
  // request.text() decodes the body as UTF-8, which corrupts any binary
  // payload (images inside multipart/form-data) — invalid UTF-8 byte
  // sequences get silently replaced, mangling the uploaded file before it
  // ever reaches the backend. ArrayBuffer passes bytes through untouched,
  // and works equally well for JSON bodies.
  const body = isBodyless ? undefined : await request.arrayBuffer();

  if (!isBodyless && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const upstream = await fetch(targetUrl, {
    method: request.method,
    headers,
    body,
    cache: "no-store",
    // @ts-expect-error - duplex is required by undici when streaming a body
    // but isn't yet in the official RequestInit types in this Next.js version.
    duplex: body ? "half" : undefined,
  });

  const contentType =
    upstream.headers.get("content-type") || "application/json";

  const isNoBodyStatus = [204, 205, 304].includes(upstream.status);

  if (isNoBodyStatus) {
    await upstream.text().catch(() => null);
    return new NextResponse(null, {
      status: upstream.status,
      headers: { "cache-control": "no-store" },
    });
  }

  // Pass binary responses (e.g. images) through untouched too, just in case
  // any proxied endpoint ever returns one.
  if (!contentType.includes("application/json") && !contentType.includes("text")) {
    const buffer = await upstream.arrayBuffer();
    return new NextResponse(buffer, {
      status: upstream.status,
      headers: {
        "content-type": contentType,
        "cache-control": "no-store",
      },
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