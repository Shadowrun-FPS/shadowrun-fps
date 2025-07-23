import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { rateLimit, adminRateLimit, authRateLimit } from "./lib/rate-limiting";
import { generateCSPHeader, SECURITY_CONFIG } from "./lib/security-config";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip rate limiting for critical auth endpoints to prevent OAuth flow interruption
  const criticalAuthPaths = [
    "/api/auth/session",
    "/api/auth/csrf",
    "/api/auth/providers",
    "/api/auth/signin",
    "/api/auth/callback",
  ];

  const shouldSkipRateLimit = criticalAuthPaths.some((path) =>
    pathname.startsWith(path)
  );

  // Apply rate limiting based on route (but skip critical auth paths)
  let rateLimitResult;

  if (!shouldSkipRateLimit) {
    if (pathname.startsWith("/api/admin/")) {
      rateLimitResult = adminRateLimit(request);
    } else if (
      pathname.startsWith("/api/auth/") ||
      pathname.startsWith("/api/discord/")
    ) {
      rateLimitResult = authRateLimit(request);
    } else if (pathname.startsWith("/api/")) {
      rateLimitResult = rateLimit(request);
    }

    // Return rate limit error if exceeded
    if (rateLimitResult && !rateLimitResult.success) {
      return rateLimitResult.error!;
    }
  }

  // Handle Socket.IO paths in Edge Runtime
  if (pathname.startsWith("/api/socketio")) {
    return NextResponse.json(
      { error: "Socket.IO is only available through the custom server" },
      { status: 501 }
    );
  }

  // Get response (continue with request)
  const response = NextResponse.next();

  // Add security headers
  const headers = new Headers();

  // Content Security Policy
  headers.set("Content-Security-Policy", generateCSPHeader());

  // Other security headers
  headers.set("X-DNS-Prefetch-Control", "off");
  headers.set("X-Frame-Options", "DENY");
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("Referrer-Policy", "origin-when-cross-origin");
  headers.set("X-XSS-Protection", "1; mode=block");

  // Remove server information
  headers.set("Server", "");

  // HTTPS enforcement in production
  if (process.env.NODE_ENV === "production") {
    headers.set(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains; preload"
    );
  }

  // Permissions Policy (restrict access to sensitive APIs)
  headers.set(
    "Permissions-Policy",
    [
      "camera=()",
      "microphone=()",
      "geolocation=()",
      "payment=()",
      "usb=()",
      "bluetooth=()",
      "magnetometer=()",
      "gyroscope=()",
      "accelerometer=()",
    ].join(", ")
  );

  // Apply headers to response
  headers.forEach((value, key) => {
    response.headers.set(key, value);
  });

  return response;
}

export const config = {
  matcher: [
    // Apply to all API routes
    "/api/:path*",
    // Apply to all pages (for security headers)
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
