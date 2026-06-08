import { NextRequest, NextResponse } from "next/server";

const BACKEND_BASE_URL = "https://logiapi.slash.sa/api";

function buildHeaders(request: NextRequest) {
  const headers = new Headers();

  request.headers.forEach((value, key) => {
    if (key === "host" || key === "content-length") return;
    headers.set(key, value);
  });

  headers.set("x-forwarded-host", request.headers.get("host") || "localhost");
  headers.delete("origin");

  return headers;
}

async function proxy(request: NextRequest, params: { path: string[] }) {
  const path = params.path?.join("/") ?? "";
  const targetUrl = `${BACKEND_BASE_URL}/${path}${request.nextUrl.search}`;

  const isBodyless = request.method === "GET" || request.method === "HEAD";
  const body = isBodyless ? undefined : await request.text();

  const upstream = await fetch(targetUrl, {
    method: request.method,
    headers: buildHeaders(request),
    body,
    cache: "no-store",
  });

  const contentType = upstream.headers.get("content-type") || "application/json";
  const responseBody = contentType.includes("application/json")
    ? await upstream.json().catch(() => null)
    : await upstream.text();

  return new NextResponse(typeof responseBody === "string" ? responseBody : JSON.stringify(responseBody), {
    status: upstream.status,
    headers: {
      "content-type": contentType,
      "cache-control": "no-store",
    },
  });
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxy(request, await params);
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxy(request, await params);
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxy(request, await params);
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxy(request, await params);
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxy(request, await params);
}
