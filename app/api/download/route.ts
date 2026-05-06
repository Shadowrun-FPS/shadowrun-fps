import { NextRequest, NextResponse } from "next/server";
import { PORTABLE_LAUNCHER_ZIP_URL } from "@/lib/download-urls";
import { safeLog } from "@/lib/security";
import { withApiSecurity } from "@/lib/api-wrapper";

export const dynamic = "force-dynamic";

async function getDownloadHandler(request: NextRequest) {
  try {
    const response = await fetch(PORTABLE_LAUNCHER_ZIP_URL);

    if (!response.ok) {
      throw new Error(`Failed to fetch file: ${response.statusText}`);
    }

    const fileBuffer = await response.arrayBuffer();

    const isPortableExe = /\.exe(\?|$)/i.test(PORTABLE_LAUNCHER_ZIP_URL);
    const filename = isPortableExe
      ? "Shadowrun FPS Launcher.exe"
      : "Shadowrun FPS Launcher.zip";
    const contentType = isPortableExe
      ? "application/octet-stream"
      : "application/zip";

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${filename}"`,
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
