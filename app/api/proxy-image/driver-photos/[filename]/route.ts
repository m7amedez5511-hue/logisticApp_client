import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/api\/?$/, "") ??
  process.env.BACKEND_URL ??
  "http://localhost:3001";

export async function GET(
  _req: NextRequest,
  { params }: { params: { filename: string } },
) {
  try {
    const upstream = await fetch(
      `${BACKEND_URL}/uploads/driver-photos/${params.filename}`,
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
        // Cache images in the browser for 1 hour
        "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
      },
    });
  } catch {
    return new NextResponse(null, { status: 502 });
  }
}