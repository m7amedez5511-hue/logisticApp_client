import { NextRequest, NextResponse } from "next/server";

const BACKEND_BASE = "https://logiapi.slash.sa";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ filename: string }> },
) {
  const { filename } = await params;

  try {
    const upstream = await fetch(
      `${BACKEND_BASE}/public/uploads/driver-photos/${filename}`,
      { cache: "no-store" },
    );

    if (!upstream.ok) {
      return new NextResponse(null, { status: upstream.status });
    }

    const buffer = await upstream.arrayBuffer();
    const contentType =
      upstream.headers.get("Content-Type") ?? "image/jpeg";

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
      },
    });
  } catch {
    return new NextResponse(null, { status: 502 });
  }
}