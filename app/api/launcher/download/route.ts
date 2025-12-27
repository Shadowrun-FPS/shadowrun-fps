import { NextRequest, NextResponse } from "next/server";
import { safeLog } from "@/lib/security";

export const dynamic = "force-dynamic";

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

    // Validate filename to prevent directory traversal
    if (filename.includes("..") || filename.includes("/") || filename.includes("\\")) {
      safeLog.error("Invalid filename attempted:", filename);
      return NextResponse.json(
        { error: "Invalid filename" },
        { status: 400 }
      );
    }

    // Build direct download URL
    const fileUrl = `http://157.245.214.234/launcher/${encodeURIComponent(
      filename
    )}`;

    // Verify file exists with HEAD request (quick, doesn't download the file)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout for verification

    try {
      const headResponse = await fetch(fileUrl, {
        method: "HEAD",
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!headResponse.ok) {
        safeLog.error(`File not found: ${filename} (${headResponse.status})`);
        return NextResponse.json(
          { error: "File not found" },
          { status: 404 }
        );
      }

      // File exists, redirect to it directly (much faster than proxying 160MB)
      safeLog.log(`Redirecting to download: ${filename}`);
      return NextResponse.redirect(fileUrl, 302);
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      if (fetchError.name === "AbortError") {
        safeLog.error("File verification timeout");
        // Still redirect even if verification times out
        return NextResponse.redirect(fileUrl, 302);
      }
      throw fetchError;
    }
  } catch (error: any) {
    safeLog.error("Download route error:", error);
    return NextResponse.json(
      { error: "Failed to initiate download. Please try again later." },
      { status: 500 }
    );
  }
}

