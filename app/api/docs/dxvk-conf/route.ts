import { NextRequest, NextResponse } from "next/server";
import { safeLog } from "@/lib/security";
import { withApiSecurity } from "@/lib/api-wrapper";

const DXVK_CONF_UPSTREAM =
  "http://download.shadowrunfps.com/releases/dxvk.conf";

export const dynamic = "force-dynamic";

async function getDxvkConfHandler(_request: NextRequest) {
  try {
    const upstream = await fetch(DXVK_CONF_UPSTREAM, {
      next: { revalidate: 3600 },
    });

    if (!upstream.ok) {
      safeLog.error(
        "dxvk-conf proxy: upstream failed",
        upstream.status,
        upstream.statusText
      );
      return NextResponse.json(
        { error: "File is temporarily unavailable." },
        { status: 502 }
      );
    }

    const body = upstream.body;
    if (!body) {
      safeLog.error("dxvk-conf proxy: empty body");
      return NextResponse.json(
        { error: "File is temporarily unavailable." },
        { status: 502 }
      );
    }

    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Content-Disposition": 'attachment; filename="dxvk.conf"',
      },
    });
  } catch (error) {
    safeLog.error("dxvk-conf proxy error:", error);
    return NextResponse.json(
      { error: "Failed to download file." },
      { status: 500 }
    );
  }
}

export const GET = withApiSecurity(getDxvkConfHandler, {
  rateLimiter: "api",
  cacheable: true,
  cacheMaxAge: 3600,
});
