import { NextRequest, NextResponse } from "next/server";
import { safeLog } from "@/lib/security";
import { withApiSecurity } from "@/lib/api-wrapper";

export const dynamic = "force-dynamic";

async function getDownloadHandler(request: NextRequest) {
  try {
    const response = await fetch(
      "http://157.245.214.234/releases/ShadowrunLauncher.zip"
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch file: ${response.statusText}`);
    }

    const fileBuffer = await response.arrayBuffer();

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": 'attachment; filename="ShadowrunLauncher.zip"',
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    });
  } catch (error) {
    safeLog.error("Download error:", error);
    return NextResponse.json(
      { error: "Failed to download file" },
      { status: 500 }
    );
  }
}

export const GET = withApiSecurity(getDownloadHandler, {
  rateLimiter: "api",
  cacheable: true,
  cacheMaxAge: 3600,
});
