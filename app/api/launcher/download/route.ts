import { NextRequest, NextResponse } from "next/server";
import { safeLog } from "@/lib/security";
import { generatePresignedDownloadUrl } from "@/lib/r2-client";

export const dynamic = "force-dynamic";
// No maxDuration needed - we're just redirecting, not streaming
// Disable caching for download requests
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

      // Redirect directly to presigned URL - this is the modern, professional approach
      // Benefits:
      // - No server resources used (R2 handles the download)
      // - No timeout concerns (60s limit doesn't apply)
      // - Faster (direct connection to R2)
      // - Lower cost (no serverless function execution)
      // - Better scalability
      // The presigned URL already includes ResponseContentDisposition header
      // which should set the filename correctly in most browsers
      return NextResponse.redirect(presignedUrl, 302);
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

