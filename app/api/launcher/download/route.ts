import { NextRequest, NextResponse } from "next/server";
import { safeLog } from "@/lib/security";
import { generatePresignedDownloadUrl } from "@/lib/r2-client";

export const dynamic = "force-dynamic";
export const maxDuration = 300; // 5 minutes max duration for large file downloads
// Disable caching for large file downloads (Next.js can't cache files > 2MB)
export const revalidate = 0;
// Use Node.js runtime to ensure proper streaming
export const runtime = "nodejs";

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

    // Build R2 object key (path in bucket)
    // Based on your R2 structure, files are stored as "launcher/filename.exe"
    const objectKey = `launcher/${filename}`;

    try {
      // Generate a presigned URL for the file in R2
      // This creates a secure, time-limited HTTPS URL (valid for 1 hour)
      safeLog.log(`[R2] Generating presigned URL for: ${objectKey}`);
      safeLog.log(`[R2] Bucket: ${process.env.R2_BUCKET_NAME}, Account ID: ${process.env.R2_ACCOUNT_ID?.substring(0, 8)}...`);
      
      // Generate presigned URL
      const presignedUrl = await generatePresignedDownloadUrl(
        objectKey, 
        3600, // 1 hour expiration
        filename // Pass filename for proper Content-Disposition header
      );

      safeLog.log(`[R2] Generated presigned URL successfully (length: ${presignedUrl.length})`);
      safeLog.log(`[R2] URL starts with: ${presignedUrl.substring(0, 50)}...`);

      // Fetch the file from R2 and stream it through our server
      // This allows us to set proper Content-Disposition headers that browsers will respect
      // We stream (don't buffer) to avoid timeout issues
      const fileResponse = await fetch(presignedUrl, {
        // Don't follow redirects - we want the actual response
        redirect: 'manual',
      });

      if (!fileResponse.ok || !fileResponse.body) {
        throw new Error(`Failed to fetch file from R2: ${fileResponse.status} ${fileResponse.statusText}`);
      }

      // Get content type from R2 response or default to application/octet-stream
      const contentType = fileResponse.headers.get("content-type") || "application/octet-stream";
      const contentLength = fileResponse.headers.get("content-length");

      // Stream the file with proper Content-Disposition header
      // This ensures the browser uses the correct filename
      // Escape quotes in filename and use proper encoding
      const escapedFilename = filename.replace(/"/g, '\\"');
      // Use both standard and extended filename formats for maximum compatibility
      const encodedFilename = encodeURIComponent(filename);
      const contentDisposition = `attachment; filename="${escapedFilename}"; filename*=UTF-8''${encodedFilename}`;
      
      safeLog.log(`[R2] Setting Content-Disposition header: ${contentDisposition}`);
      safeLog.log(`[R2] Filename being set: ${filename}`);
      safeLog.log(`[R2] Escaped filename: ${escapedFilename}`);
      safeLog.log(`[R2] Encoded filename: ${encodedFilename}`);
      
      return new NextResponse(fileResponse.body, {
        headers: {
          "Content-Type": contentType,
          "Content-Disposition": contentDisposition,
          ...(contentLength && { "Content-Length": contentLength }),
          // Disable caching for large files (Next.js can't cache files > 2MB)
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          "Pragma": "no-cache",
          "Expires": "0",
          // Prevent Next.js from trying to cache this response
          "X-Content-Type-Options": "nosniff",
        },
      });
    } catch (error: any) {
      safeLog.error(`[R2] Failed to generate presigned URL for ${objectKey}:`, error);
      safeLog.error(`[R2] Error name: ${error.name}, message: ${error.message}`);
      safeLog.error(`[R2] Stack: ${error.stack}`);
      
      // Check if it's a "not found" type error
      if (error.name === "NoSuchKey" || error.message?.includes("not found") || error.message?.includes("NoSuchKey")) {
        return NextResponse.json(
          { error: "File not found in R2 storage" },
          { status: 404 }
        );
      }
      
      // Check if it's a configuration error
      if (error.message?.includes("Missing") || error.message?.includes("environment variable")) {
        safeLog.error(`[R2] Configuration error - check environment variables`);
        return NextResponse.json(
          { error: "R2 storage not configured. Please contact support." },
          { status: 500 }
        );
      }
      
      return NextResponse.json(
        { error: `Failed to generate download link: ${error.message || "Unknown error"}` },
        { status: 500 }
      );
    }
  } catch (error: any) {
    safeLog.error("Download route error:", error);
    return NextResponse.json(
      { error: "Failed to initiate download. Please try again later." },
      { status: 500 }
    );
  }
}

