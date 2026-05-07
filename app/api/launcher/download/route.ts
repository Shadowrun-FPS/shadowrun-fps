import { NextRequest, NextResponse } from "next/server";
import { safeLog } from "@/lib/security";
import { generatePresignedDownloadUrl } from "@/lib/r2-client";
import { isLauncherDownloadFilenameAllowed } from "@/lib/launcher-download-allowlist";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const filename = searchParams.get("file");

    if (!filename) {
      return NextResponse.json(
        { error: "File parameter is required" },
        { status: 400 }
      );
    }

    if (!isLauncherDownloadFilenameAllowed(filename)) {
      safeLog.error("Disallowed launcher download filename attempted:", filename);
      return NextResponse.json(
        { error: "Invalid or unsupported file." },
        { status: 400 }
      );
    }

    const objectKey = `launcher/${filename}`;

    try {
      const presignedUrl = await generatePresignedDownloadUrl(
        objectKey,
        3600,
        filename
      );

      // Log object key only — presigned URLs are credential-like and must not appear in logs.
      safeLog.log(`[R2] Presigned download redirect: ${objectKey}`);

      return NextResponse.redirect(presignedUrl, 302);
    } catch (error: unknown) {
      safeLog.error(`[R2] Failed presigned URL for ${objectKey}:`, error);

      const err = error as { name?: string; message?: string };

      if (
        err.name === "NoSuchKey" ||
        err.message?.includes("not found") ||
        err.message?.includes("NoSuchKey")
      ) {
        return NextResponse.json(
          { error: "File not found." },
          { status: 404 }
        );
      }

      if (
        err.message?.includes("Missing") ||
        err.message?.includes("environment variable")
      ) {
        safeLog.error("[R2] Configuration error — check environment variables");
        return NextResponse.json(
          { error: "Download service is not configured." },
          { status: 500 }
        );
      }

      return NextResponse.json(
        { error: "Could not generate download link. Try again later." },
        { status: 500 }
      );
    }
  } catch (error: unknown) {
    safeLog.error("Download route error:", error);
    return NextResponse.json(
      { error: "Failed to initiate download. Please try again later." },
      { status: 500 }
    );
  }
}
