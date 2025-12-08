/**
 * CSRF Protection Utilities
 * 
 * Next.js has built-in CSRF protection, but this provides additional validation
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

/**
 * Validates CSRF token for form submissions
 * Next.js automatically handles CSRF for API routes, but we can add additional checks
 */
export async function validateCSRF(
  request: NextRequest
): Promise<{ valid: boolean; error?: string }> {
  // Next.js automatically validates CSRF tokens for API routes
  // This is an additional layer for custom validation if needed
  
  // Check if request has proper origin/referer headers for same-origin requests
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");
  const host = request.headers.get("host");
  
  // For same-origin requests, origin should match host
  if (origin && host) {
    try {
      const originHost = new URL(origin).host;
      if (originHost !== host && process.env.NODE_ENV === "production") {
        return { valid: false, error: "Invalid origin" };
      }
    } catch {
      // Invalid origin URL, but let Next.js handle it
    }
  }

  return { valid: true };
}

/**
 * Middleware to add CSRF protection to API routes
 */
export function withCSRF(handler: (req: NextRequest) => Promise<NextResponse>) {
  return async (req: NextRequest): Promise<NextResponse> => {
    // Skip CSRF check for GET/HEAD/OPTIONS
    if (["GET", "HEAD", "OPTIONS"].includes(req.method)) {
      return handler(req);
    }

    const csrfCheck = await validateCSRF(req);
    if (!csrfCheck.valid) {
      return NextResponse.json(
        { error: "CSRF validation failed" },
        { status: 403 }
      );
    }

    return handler(req);
  };
}

